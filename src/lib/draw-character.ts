/**
 * Shared drawing functions for rendering characters (shapes + faces)
 * using PixiJS Graphics. Used by both the editor canvas and the
 * character builder preview.
 */
import { Graphics, Container } from "pixi.js";
import {
  DEFAULT_FACE,
  type ShapeProps,
  type ShapePattern,
  type FaceProps,
  type LimbProps,
  type AccessoryProps,
  type EyeStyle,
  type MouthStyle,
  type EyebrowStyle,
  type HandStyle,
  type ShoeAccessoryStyle,
  type ShoeStyle,
} from "@/engine/types";

export function hexToNumber(hex: string, fallback = 0x667085): number {
  if (typeof hex !== "string") return fallback;
  const normalized = hex.trim().replace("#", "");
  const value = parseInt(normalized, 16);
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Draw a shape body onto a Graphics object.
 * Returns { w, h } of the drawn shape.
 */
export function drawShapeBody(g: Graphics, shape: ShapeProps): { w: number; h: number } {
  let w = Math.max(1, Number(shape.width) || 1);
  let h = Math.max(1, Number(shape.height) || 1);
  if (shape.shapeType === "custom-path" && Array.isArray(shape.customPath) && shape.customPath.length >= 3) {
    const bounds = getPathBounds(shape.customPath);
    w = Math.max(1, bounds.w);
    h = Math.max(1, bounds.h);
  }
  const fillColor = hexToNumber(shape.fill, 0x58a6ff);
  const r = Math.max(0, Number(shape.cornerRadius) || 0);

  if (shape.shapeType === "stickfigure") {
    drawStickFigure(g, w, h, fillColor);
    return { w, h };
  }

  traceShapePath(g, shape, w, h, r);
  g.fill({ color: fillColor });

  const strokeColor = shape.stroke ? hexToNumber(shape.stroke, 0x1f2937) : 0x1f2937;
  const strokeWidth = shape.strokeWidth && shape.strokeWidth > 0 ? shape.strokeWidth : 1;
  g.stroke({ width: strokeWidth, color: strokeColor, alpha: shape.stroke ? 1 : 0.32 });

  return { w, h };
}

function getPathBounds(points: Array<{ x: number; y: number }>): { w: number; h: number } {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return {
    w: Number.isFinite(maxX - minX) ? maxX - minX : 1,
    h: Number.isFinite(maxY - minY) ? maxY - minY : 1,
  };
}

function traceShapePath(g: Graphics, shape: ShapeProps, w: number, h: number, cornerRadius: number) {
  switch (shape.shapeType) {
    case "rectangle": {
      if (cornerRadius > 0) {
        g.roundRect(-w / 2, -h / 2, w, h, Math.min(cornerRadius, Math.min(w, h) / 2));
      } else {
        g.rect(-w / 2, -h / 2, w, h);
      }
      break;
    }
    case "ellipse":
      g.ellipse(0, 0, w / 2, h / 2);
      break;
    case "triangle":
      drawTriangle(g, w, h, cornerRadius);
      break;
    case "star":
      drawStar(g, 0, 0, shape.points ?? 5, w / 2, w / 4, cornerRadius);
      break;
    case "polygon":
      drawPolygon(g, 0, 0, shape.points ?? 6, w / 2, cornerRadius);
      break;
    case "custom-path":
      if (Array.isArray(shape.customPath) && shape.customPath.length >= 3) {
        drawClosedRoundedPath(g, shape.customPath, cornerRadius);
      } else {
        g.rect(-w / 2, -h / 2, w, h);
      }
      break;
    case "capsule": {
      const capsuleRadius = cornerRadius > 0 ? Math.min(cornerRadius, Math.min(w, h) / 2) : Math.min(w, h) / 2;
      g.roundRect(-w / 2, -h / 2, w, h, capsuleRadius);
      break;
    }
    case "diamond":
      drawDiamond(g, w, h, cornerRadius);
      break;
    case "trapezoid":
      drawTrapezoid(g, w, h, 0.6, cornerRadius);
      break;
    case "parallelogram":
      drawParallelogram(g, w, h, w * 0.2, cornerRadius);
      break;
    case "blob":
      drawBlob(g, w, h, 0.18);
      break;
    case "asymmetric-blob":
      drawBlob(g, w, h, 0.42);
      break;
    case "stickfigure":
      break;
  }
}

function canPattern(shapeType: ShapeProps["shapeType"]): boolean {
  return shapeType !== "stickfigure";
}

export function drawShapePattern(
  container: Container,
  shape: ShapeProps,
  w: number,
  h: number
) {
  const pattern: ShapePattern = shape.pattern ?? "none";
  if (pattern === "none" || !canPattern(shape.shapeType)) return;

  const color = hexToNumber(shape.patternColor ?? "#ffffff", 0xffffff);
  const scale = Math.max(0.4, Math.min(3, shape.patternScale ?? 1));
  const spacing = Math.max(6, 16 / scale);
  const strokeWidth = Math.max(1, 1.6 * scale);

  const mask = new Graphics();
  traceShapePath(mask, shape, w, h, Math.max(0, Number(shape.cornerRadius) || 0));
  mask.fill({ color: 0xffffff });
  mask.alpha = 0.001;
  container.addChild(mask);

  const overlay = new Graphics();
  overlay.alpha = 0.35;

  const left = -w / 2;
  const top = -h / 2;
  const right = w / 2;
  const bottom = h / 2;

  if (pattern === "stripes" || pattern === "crosshatch" || pattern === "zigzag") {
    for (let x = left - h; x <= right + h; x += spacing) {
      if (pattern === "zigzag") {
        const yMid = (top + bottom) / 2;
        overlay.moveTo(x, yMid);
        overlay.lineTo(x + spacing * 0.5, top);
        overlay.lineTo(x + spacing, yMid);
        overlay.lineTo(x + spacing * 1.5, bottom);
        overlay.stroke({ width: strokeWidth, color, alpha: 0.9 });
      } else {
        overlay.moveTo(x, top - 2);
        overlay.lineTo(x + h + 4, bottom + 2);
        overlay.stroke({ width: strokeWidth, color, alpha: 0.9 });
      }
    }
    if (pattern === "crosshatch") {
      for (let x = left - h; x <= right + h; x += spacing) {
        overlay.moveTo(x, bottom + 2);
        overlay.lineTo(x + h + 4, top - 2);
        overlay.stroke({ width: strokeWidth, color, alpha: 0.9 });
      }
    }
  } else if (pattern === "dots") {
    const dotR = Math.max(1.2, 2.2 * scale);
    for (let y = top; y <= bottom; y += spacing) {
      for (let x = left; x <= right; x += spacing) {
        overlay.circle(x + (y % (spacing * 2) === 0 ? spacing * 0.25 : 0), y, dotR);
        overlay.fill({ color, alpha: 0.95 });
      }
    }
  } else if (pattern === "checker") {
    const cell = Math.max(6, 12 / scale);
    for (let y = top; y < bottom; y += cell) {
      for (let x = left; x < right; x += cell) {
        const ix = Math.floor((x - left) / cell);
        const iy = Math.floor((y - top) / cell);
        if ((ix + iy) % 2 === 0) {
          overlay.rect(x, y, cell, cell);
          overlay.fill({ color, alpha: 0.8 });
        }
      }
    }
  }

  overlay.mask = mask;
  container.addChild(overlay);
}

export function drawStar(
  g: Graphics,
  cx: number,
  cy: number,
  points: number,
  outerR: number,
  innerR: number,
  cornerRadius = 0
) {
  const step = Math.PI / points;
  const starPoints: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 2 * points; i++) {
    const radius = i % 2 === 0 ? outerR : innerR;
    const angle = -Math.PI / 2 + i * step;
    starPoints.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
  }
  drawClosedRoundedPath(g, starPoints, cornerRadius);
}

export function drawPolygon(
  g: Graphics,
  cx: number,
  cy: number,
  sides: number,
  radius: number,
  cornerRadius = 0
) {
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    points.push({ x, y });
  }
  drawClosedRoundedPath(g, points, cornerRadius);
}

export function drawTrapezoid(
  g: Graphics,
  w: number,
  h: number,
  topWidthRatio = 0.65,
  cornerRadius = 0
) {
  const topW = w * Math.max(0.2, Math.min(1, topWidthRatio));
  drawClosedRoundedPath(
    g,
    [
      { x: -topW / 2, y: -h / 2 },
      { x: topW / 2, y: -h / 2 },
      { x: w / 2, y: h / 2 },
      { x: -w / 2, y: h / 2 },
    ],
    cornerRadius
  );
}

export function drawParallelogram(
  g: Graphics,
  w: number,
  h: number,
  skew = 18,
  cornerRadius = 0
) {
  const s = Math.max(-w * 0.45, Math.min(w * 0.45, skew));
  drawClosedRoundedPath(
    g,
    [
      { x: -w / 2 + s, y: -h / 2 },
      { x: w / 2 + s, y: -h / 2 },
      { x: w / 2 - s, y: h / 2 },
      { x: -w / 2 - s, y: h / 2 },
    ],
    cornerRadius
  );
}

export function drawDiamond(
  g: Graphics,
  w: number,
  h: number,
  cornerRadius = 0
) {
  drawClosedRoundedPath(
    g,
    [
      { x: 0, y: -h / 2 },
      { x: w / 2, y: 0 },
      { x: 0, y: h / 2 },
      { x: -w / 2, y: 0 },
    ],
    cornerRadius
  );
}

export function drawTriangle(
  g: Graphics,
  w: number,
  h: number,
  cornerRadius = 0
) {
  drawClosedRoundedPath(
    g,
    [
      { x: 0, y: -h / 2 },
      { x: w / 2, y: h / 2 },
      { x: -w / 2, y: h / 2 },
    ],
    cornerRadius
  );
}

function drawClosedRoundedPath(
  g: Graphics,
  points: Array<{ x: number; y: number }>,
  cornerRadius = 0
) {
  if (points.length < 3) return;
  const r = Math.max(0, cornerRadius);

  if (r <= 0.001) {
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      g.lineTo(points[i].x, points[i].y);
    }
    g.closePath();
    return;
  }

  const n = points.length;
  const starts: Array<{ x: number; y: number }> = [];
  const ends: Array<{ x: number; y: number }> = [];

  for (let i = 0; i < n; i += 1) {
    const prev = points[(i - 1 + n) % n];
    const curr = points[i];
    const next = points[(i + 1) % n];

    const vxPrev = prev.x - curr.x;
    const vyPrev = prev.y - curr.y;
    const vxNext = next.x - curr.x;
    const vyNext = next.y - curr.y;

    const lenPrev = Math.hypot(vxPrev, vyPrev);
    const lenNext = Math.hypot(vxNext, vyNext);
    if (lenPrev < 0.001 || lenNext < 0.001) {
      starts.push({ x: curr.x, y: curr.y });
      ends.push({ x: curr.x, y: curr.y });
      continue;
    }

    const d = Math.min(r, lenPrev / 2, lenNext / 2);
    starts.push({
      x: curr.x + (vxPrev / lenPrev) * d,
      y: curr.y + (vyPrev / lenPrev) * d,
    });
    ends.push({
      x: curr.x + (vxNext / lenNext) * d,
      y: curr.y + (vyNext / lenNext) * d,
    });
  }

  g.moveTo(starts[0].x, starts[0].y);
  for (let i = 0; i < n; i += 1) {
    const curr = points[i];
    const end = ends[i];
    const nextStart = starts[(i + 1) % n];
    g.quadraticCurveTo(curr.x, curr.y, end.x, end.y);
    g.lineTo(nextStart.x, nextStart.y);
  }
  g.closePath();
}

export function drawBlob(
  g: Graphics,
  w: number,
  h: number,
  asymmetry = 0.2
) {
  const ax = w * asymmetry * 0.5;
  const ay = h * asymmetry * 0.5;
  g.moveTo(0, -h / 2 + ay);
  g.bezierCurveTo(w / 2 + ax, -h / 2, w / 2 + ax, h / 2 - ay, 0, h / 2);
  g.bezierCurveTo(-w / 2 - ax, h / 2 + ay, -w / 2 + ax, -h / 2, 0, -h / 2 + ay);
  g.closePath();
}

export function drawStickFigure(
  g: Graphics,
  w: number,
  h: number,
  color: number
) {
  const strokeWidth = Math.max(3, w * 0.04);
  const headR = h * 0.12;
  const headY = -h / 2 + headR;
  const neckY = headY + headR;
  const torsoEnd = h * 0.1;
  const armY = neckY + h * 0.08;
  const armSpan = w * 0.35;
  const legSpan = w * 0.25;
  const legEnd = h / 2;

  g.circle(0, headY, headR);
  g.fill({ color });

  g.moveTo(0, neckY);
  g.lineTo(0, torsoEnd);
  g.closePath();
  g.stroke({ width: strokeWidth, color });

  g.moveTo(-armSpan, armY + h * 0.08);
  g.lineTo(0, armY);
  g.lineTo(armSpan, armY + h * 0.08);
  g.closePath();
  g.stroke({ width: strokeWidth, color });

  g.moveTo(-legSpan, legEnd);
  g.lineTo(0, torsoEnd);
  g.lineTo(legSpan, legEnd);
  g.closePath();
  g.stroke({ width: strokeWidth, color });
}

export function drawFace(
  container: Container,
  face: FaceProps,
  shapeW: number,
  shapeH: number,
  timeMs = Date.now()
) {
  const resolvedFace: FaceProps = { ...DEFAULT_FACE, ...face };
  const g = new Graphics();
  const scale = resolvedFace.faceScale;
  const baseSize = Math.min(shapeW, shapeH);

  const baseEyeRadius = baseSize * 0.06 * resolvedFace.eyeSize * scale;
  const baseSpacing = shapeW * 0.15 * resolvedFace.eyeSpacing * scale;
  const eyeY = shapeH * resolvedFace.eyeOffsetY;
  const eyeColor = hexToNumber(resolvedFace.eyeColor);

  const browColor = hexToNumber(resolvedFace.eyebrowColor);
  const browY = shapeH * (resolvedFace.eyeOffsetY + resolvedFace.eyebrowOffsetY);
  drawEyebrows(
    g,
    resolvedFace.eyebrowStyle,
    baseSpacing,
    browY,
    baseEyeRadius * 1.8,
    browColor,
    resolvedFace.eyebrowThickness,
    resolvedFace.eyebrowTilt
  );

  drawEye(g, -baseSpacing, eyeY, baseEyeRadius, resolvedFace.eyeStyle, eyeColor, resolvedFace.pupilSize, true);
  drawEye(g, baseSpacing, eyeY, baseEyeRadius, resolvedFace.eyeStyle, eyeColor, resolvedFace.pupilSize, false);

  const mouthY = shapeH * resolvedFace.mouthOffsetY;
  const talkSpeed = Math.max(0.1, resolvedFace.mouthTalkSpeed);
  const talkOsc = Math.sin((timeMs / 1000) * talkSpeed * Math.PI * 2);
  const talkOpen =
    resolvedFace.mouthEffect === "talk"
      ? ((talkOsc + 1) / 2) * Math.max(0, resolvedFace.mouthTalkAmount)
      : 0;
  const mouthW = shapeW * 0.2 * resolvedFace.mouthSize * scale * (1 + talkOpen * 0.4);
  const mouthColor = hexToNumber(resolvedFace.mouthColor);
  const mouthCurve =
    resolvedFace.mouthCurve +
    (resolvedFace.mouthEffect === "talk"
      ? Math.sin((timeMs / 1000) * talkSpeed) * 0.2 * resolvedFace.mouthTalkAmount
      : 0);

  drawMouth(g, 0, mouthY, mouthW, resolvedFace.mouthStyle, mouthColor, mouthCurve, talkOpen);

  container.addChild(g);
}

function drawEyebrows(
  g: Graphics,
  style: EyebrowStyle,
  eyeSpacing: number,
  y: number,
  width: number,
  color: number,
  thickness: number,
  tilt: number
) {
  if (style === "none") return;

  const leftX = -eyeSpacing;
  const rightX = eyeSpacing;
  const half = width / 2;
  const t = Math.max(-1, Math.min(1, tilt));
  const baseTilt = t * 0.45;

  let leftAngle = -baseTilt;
  let rightAngle = baseTilt;
  if (style === "angry") {
    leftAngle = 0.65 + baseTilt;
    rightAngle = -0.65 - baseTilt;
  } else if (style === "sad") {
    leftAngle = -0.65 + baseTilt;
    rightAngle = 0.65 - baseTilt;
  }

  if (style === "arc") {
    const arcH = Math.max(1, half * 0.45);
    g.moveTo(leftX - half, y);
    g.quadraticCurveTo(leftX, y - arcH, leftX + half, y);
    g.stroke({ width: thickness, color });

    g.moveTo(rightX - half, y);
    g.quadraticCurveTo(rightX, y - arcH, rightX + half, y);
    g.stroke({ width: thickness, color });
    return;
  }

  drawBrowLine(g, leftX, y, half, leftAngle, thickness, color);
  drawBrowLine(g, rightX, y, half, rightAngle, thickness, color);
}

function drawBrowLine(
  g: Graphics,
  cx: number,
  cy: number,
  halfLength: number,
  angle: number,
  thickness: number,
  color: number
) {
  const dx = Math.cos(angle) * halfLength;
  const dy = Math.sin(angle) * halfLength;
  g.moveTo(cx - dx, cy - dy);
  g.lineTo(cx + dx, cy + dy);
  g.stroke({ width: thickness, color });
}

export function drawEye(
  g: Graphics,
  cx: number,
  cy: number,
  radius: number,
  style: EyeStyle,
  color: number,
  pupilSize: number,
  isLeft: boolean
) {
  switch (style) {
    case "dot":
      g.circle(cx, cy, radius);
      g.fill({ color });
      break;
    case "circle": {
      g.circle(cx, cy, radius * 1.5);
      g.fill({ color: 0xffffff });
      g.circle(cx, cy, radius * 1.5);
      g.stroke({ width: 1.5, color });
      g.circle(cx, cy, radius * pupilSize * 1.5);
      g.fill({ color });
      break;
    }
    case "oval": {
      g.ellipse(cx, cy, radius * 1.2, radius * 1.6);
      g.fill({ color: 0xffffff });
      g.ellipse(cx, cy, radius * 1.2, radius * 1.6);
      g.stroke({ width: 1.5, color });
      g.circle(cx, cy - radius * 0.2, radius * pupilSize * 1.2);
      g.fill({ color });
      break;
    }
    case "angry": {
      g.circle(cx, cy, radius);
      g.fill({ color });
      const browDir = isLeft ? 1 : -1;
      g.moveTo(cx - radius * 1.5, cy - radius * 1.8 + browDir * radius * 0.6);
      g.lineTo(cx + radius * 1.5, cy - radius * 1.8 - browDir * radius * 0.6);
      g.closePath();
      g.stroke({ width: 2, color });
      break;
    }
    case "closed":
      g.moveTo(cx - radius * 1.2, cy);
      g.lineTo(cx + radius * 1.2, cy);
      g.closePath();
      g.stroke({ width: 2, color });
      break;
    case "wink":
      if (isLeft) {
        g.circle(cx, cy, radius);
        g.fill({ color });
      } else {
        g.moveTo(cx - radius * 1.2, cy);
        g.quadraticCurveTo(cx, cy - radius * 1.5, cx + radius * 1.2, cy);
        g.closePath();
        g.stroke({ width: 2, color });
      }
      break;
    case "wide": {
      g.circle(cx, cy, radius * 1.8);
      g.fill({ color: 0xffffff });
      g.circle(cx, cy, radius * 1.8);
      g.stroke({ width: 1.5, color });
      g.circle(cx, cy, radius * pupilSize);
      g.fill({ color });
      break;
    }
    case "sleepy": {
      g.ellipse(cx, cy + radius * 0.1, radius * 1.35, radius * 0.9);
      g.fill({ color: 0xffffff });
      g.ellipse(cx, cy + radius * 0.1, radius * 1.35, radius * 0.9);
      g.stroke({ width: 1.5, color });
      g.moveTo(cx - radius * 1.2, cy - radius * 0.15);
      g.lineTo(cx + radius * 1.2, cy - radius * 0.35);
      g.stroke({ width: 1.6, color });
      g.circle(cx, cy + radius * 0.35, radius * pupilSize * 0.8);
      g.fill({ color });
      break;
    }
    case "sparkle": {
      g.circle(cx, cy, radius * 1.6);
      g.fill({ color: 0xffffff });
      g.circle(cx, cy, radius * 1.6);
      g.stroke({ width: 1.5, color });
      g.moveTo(cx, cy - radius * 1.1);
      g.lineTo(cx, cy + radius * 1.1);
      g.moveTo(cx - radius * 1.1, cy);
      g.lineTo(cx + radius * 1.1, cy);
      g.moveTo(cx - radius * 0.8, cy - radius * 0.8);
      g.lineTo(cx + radius * 0.8, cy + radius * 0.8);
      g.moveTo(cx + radius * 0.8, cy - radius * 0.8);
      g.lineTo(cx - radius * 0.8, cy + radius * 0.8);
      g.stroke({ width: 1.1, color });
      break;
    }
    case "heart": {
      const s = radius * 0.12;
      g.moveTo(cx, cy + radius * 1.1);
      g.bezierCurveTo(cx + radius * 1.8, cy + radius * 0.2, cx + radius * 1.6, cy - radius * 1.2, cx, cy - radius * 0.3);
      g.bezierCurveTo(cx - radius * 1.6, cy - radius * 1.2, cx - radius * 1.8, cy + radius * 0.2, cx, cy + radius * 1.1);
      g.closePath();
      g.fill({ color });
      g.moveTo(cx - radius * 0.35, cy - radius * 0.35);
      g.lineTo(cx - radius * 0.15, cy - radius * 0.15);
      g.stroke({ width: s, color: 0xffffff, alpha: 0.55 });
      break;
    }
    case "cross": {
      g.moveTo(cx - radius, cy - radius);
      g.lineTo(cx + radius, cy + radius);
      g.moveTo(cx + radius, cy - radius);
      g.lineTo(cx - radius, cy + radius);
      g.stroke({ width: 2.2, color });
      break;
    }
    case "laughing": {
      g.moveTo(cx - radius * 1.35, cy + radius * 0.2);
      g.quadraticCurveTo(cx, cy - radius * 1.05, cx + radius * 1.35, cy + radius * 0.2);
      g.stroke({ width: 2.1, color });
      g.moveTo(cx - radius * 0.55, cy + radius * 0.15);
      g.lineTo(cx + radius * 0.55, cy + radius * 0.15);
      g.stroke({ width: 1.1, color, alpha: 0.65 });
      break;
    }
    case "attentive": {
      g.ellipse(cx, cy, radius * 1.45, radius * 1.8);
      g.fill({ color: 0xffffff });
      g.ellipse(cx, cy, radius * 1.45, radius * 1.8);
      g.stroke({ width: 1.5, color });
      g.circle(cx, cy - radius * 0.08, radius * pupilSize * 0.95);
      g.fill({ color });
      g.circle(cx - radius * 0.35, cy - radius * 0.62, radius * 0.22);
      g.fill({ color: 0xffffff, alpha: 0.9 });
      break;
    }
    case "roll-eyes": {
      g.circle(cx, cy, radius * 1.55);
      g.fill({ color: 0xffffff });
      g.circle(cx, cy, radius * 1.55);
      g.stroke({ width: 1.45, color });
      g.circle(cx, cy - radius * 0.92, radius * pupilSize * 0.8);
      g.fill({ color });
      break;
    }
    case "google-eyes": {
      g.circle(cx, cy, radius * 1.7);
      g.fill({ color: 0xffffff });
      g.circle(cx, cy, radius * 1.7);
      g.stroke({ width: 1.45, color });
      const pupilX = cx + (isLeft ? radius * 0.48 : -radius * 0.48);
      const pupilY = cy + radius * 0.24;
      g.circle(pupilX, pupilY, radius * pupilSize * 1.05);
      g.fill({ color });
      break;
    }
    case "intense": {
      g.ellipse(cx, cy, radius * 1.45, radius * 0.85);
      g.fill({ color: 0xffffff });
      g.ellipse(cx, cy, radius * 1.45, radius * 0.85);
      g.stroke({ width: 1.7, color });
      g.ellipse(cx, cy, radius * pupilSize * 0.95, radius * pupilSize * 0.55);
      g.fill({ color });
      g.moveTo(cx - radius * 1.35, cy - radius * 1.05);
      g.lineTo(cx + radius * 1.35, cy - radius * 0.7);
      g.stroke({ width: 1.8, color, alpha: 0.9 });
      break;
    }
    case "puppy-eyes": {
      g.ellipse(cx, cy + radius * 0.2, radius * 1.35, radius * 1.85);
      g.fill({ color: 0xffffff });
      g.ellipse(cx, cy + radius * 0.2, radius * 1.35, radius * 1.85);
      g.stroke({ width: 1.4, color });
      g.circle(cx, cy + radius * 0.38, radius * pupilSize * 1.1);
      g.fill({ color });
      g.circle(cx - radius * 0.32, cy - radius * 0.22, radius * 0.28);
      g.fill({ color: 0xffffff, alpha: 0.96 });
      g.circle(cx + radius * 0.14, cy + radius * 0.08, radius * 0.14);
      g.fill({ color: 0xffffff, alpha: 0.82 });
      break;
    }
    case "money": {
      const ring = 1.6;
      g.circle(cx, cy, radius * ring);
      g.fill({ color: 0xffffff });
      g.circle(cx, cy, radius * ring);
      g.stroke({ width: 1.4, color });
      const moneyColor = 0x2ea043;
      g.moveTo(cx, cy - radius * 0.95);
      g.lineTo(cx, cy + radius * 0.95);
      g.stroke({ width: 1.3, color: moneyColor, alpha: 0.95 });
      g.moveTo(cx + radius * 0.65, cy - radius * 0.45);
      g.quadraticCurveTo(cx + radius * 0.02, cy - radius * 0.9, cx - radius * 0.5, cy - radius * 0.45);
      g.quadraticCurveTo(cx - radius * 0.82, cy - radius * 0.15, cx, cy + radius * 0.05);
      g.quadraticCurveTo(cx + radius * 0.82, cy + radius * 0.35, cx + radius * 0.35, cy + radius * 0.8);
      g.quadraticCurveTo(cx - radius * 0.2, cy + radius * 1.02, cx - radius * 0.72, cy + radius * 0.72);
      g.stroke({ width: 1.3, color: moneyColor, alpha: 0.95 });
      break;
    }
    case "slanted": {
      const dir = isLeft ? -1 : 1;
      g.moveTo(cx - radius * 1.25, cy + dir * radius * 0.45);
      g.lineTo(cx + radius * 1.25, cy - dir * radius * 0.45);
      g.stroke({ width: 2.3, color });
      break;
    }
    case "side-eye": {
      g.ellipse(cx, cy, radius * 1.45, radius * 1.08);
      g.fill({ color: 0xffffff });
      g.ellipse(cx, cy, radius * 1.45, radius * 1.08);
      g.stroke({ width: 1.5, color });
      const towardCenter = isLeft ? 0.42 : -0.42;
      g.circle(cx + towardCenter * radius, cy + radius * 0.05, radius * pupilSize * 0.88);
      g.fill({ color });
      break;
    }
    case "tiny": {
      g.circle(cx, cy, radius * 0.55);
      g.fill({ color });
      break;
    }
    case "half-lidded": {
      g.ellipse(cx, cy + radius * 0.22, radius * 1.25, radius * 1.22);
      g.fill({ color: 0xffffff });
      g.ellipse(cx, cy + radius * 0.22, radius * 1.25, radius * 1.22);
      g.stroke({ width: 1.5, color });
      g.rect(cx - radius * 1.3, cy - radius * 1.05, radius * 2.6, radius * 0.95);
      g.fill({ color: 0xdadde3, alpha: 0.85 });
      g.circle(cx, cy + radius * 0.35, radius * pupilSize * 0.9);
      g.fill({ color });
      break;
    }
  }
}

export function drawMouth(
  g: Graphics,
  cx: number,
  cy: number,
  width: number,
  style: MouthStyle,
  color: number,
  curve: number,
  talkOpen = 0
) {
  const halfW = width / 2;
  const curveAmount = halfW * curve;
  const openAmount = Math.max(0, talkOpen);

  switch (style) {
    case "line": {
      g.moveTo(cx - halfW, cy);
      if (openAmount > 0.02) {
        g.quadraticCurveTo(cx, cy + halfW * 0.45 * openAmount, cx + halfW, cy);
      } else {
        g.lineTo(cx + halfW, cy);
      }
      g.stroke({ width: 2, color });
      break;
    }
    case "smile":
      g.moveTo(cx - halfW, cy);
      g.quadraticCurveTo(
        cx,
        cy + Math.abs(curveAmount) + halfW * (0.5 + openAmount * 0.5),
        cx + halfW,
        cy
      );
      g.stroke({ width: 2, color });
      break;
    case "frown":
      g.moveTo(cx - halfW, cy);
      g.quadraticCurveTo(
        cx,
        cy - Math.abs(curveAmount) - halfW * (0.3 - openAmount * 0.2),
        cx + halfW,
        cy
      );
      g.stroke({ width: 2, color });
      break;
    case "open":
      g.ellipse(cx, cy, halfW * 0.8, halfW * (0.6 + openAmount * 0.9));
      g.fill({ color });
      break;
    case "o":
      g.ellipse(cx, cy, halfW * (0.5 + openAmount * 0.15), halfW * (0.5 + openAmount * 0.4));
      g.stroke({ width: 2, color });
      break;
    case "teeth": {
      const teethDepth = halfW * (0.7 + openAmount * 0.8);
      g.moveTo(cx - halfW, cy);
      g.quadraticCurveTo(cx, cy + teethDepth, cx + halfW, cy);
      g.lineTo(cx - halfW, cy);
      g.closePath();
      g.fill({ color: 0xffffff });
      g.moveTo(cx - halfW, cy);
      g.quadraticCurveTo(cx, cy + teethDepth, cx + halfW, cy);
      g.stroke({ width: 2, color });
      g.moveTo(cx - halfW * 0.8, cy + teethDepth * 0.22);
      g.lineTo(cx + halfW * 0.8, cy + teethDepth * 0.22);
      g.stroke({ width: 1, color });
      break;
    }
    case "toothy-grin": {
      const mouthDepth = halfW * (0.55 + openAmount * 0.35);
      g.moveTo(cx - halfW, cy - halfW * 0.08);
      g.quadraticCurveTo(cx, cy + mouthDepth, cx + halfW, cy - halfW * 0.08);
      g.lineTo(cx + halfW * 0.95, cy + halfW * 0.35);
      g.quadraticCurveTo(cx, cy + mouthDepth + halfW * 0.18, cx - halfW * 0.95, cy + halfW * 0.35);
      g.closePath();
      g.fill({ color: 0xffffff });
      g.moveTo(cx - halfW, cy - halfW * 0.08);
      g.quadraticCurveTo(cx, cy + mouthDepth, cx + halfW, cy - halfW * 0.08);
      g.stroke({ width: 2, color });
      g.moveTo(cx - halfW * 0.75, cy + halfW * 0.22);
      g.lineTo(cx + halfW * 0.75, cy + halfW * 0.22);
      g.stroke({ width: 1, color });
      break;
    }
    case "wavy":
      g.moveTo(cx - halfW, cy);
      g.bezierCurveTo(
        cx - halfW * 0.3, cy - halfW * (0.3 + openAmount * 0.2),
        cx + halfW * 0.3, cy + halfW * (0.3 + openAmount * 0.4),
        cx + halfW, cy
      );
      g.stroke({ width: 2, color });
      break;
    case "small-smile":
      g.moveTo(cx - halfW * 0.4, cy);
      g.quadraticCurveTo(
        cx,
        cy + halfW * (0.3 + openAmount * 0.5),
        cx + halfW * 0.5,
        cy - halfW * (0.1 - openAmount * 0.1)
      );
      g.stroke({ width: 2, color });
      break;
    case "tongue": {
      const openH = halfW * (0.8 + openAmount * 0.7);
      g.ellipse(cx, cy, halfW * 0.78, openH);
      g.fill({ color: 0x1a1a1a });
      g.ellipse(cx, cy + openH * 0.3, halfW * 0.45, openH * 0.45);
      g.fill({ color: 0xff5a7a });
      g.moveTo(cx, cy + openH * 0.05);
      g.lineTo(cx, cy + openH * 0.72);
      g.stroke({ width: 1, color: 0xc63555, alpha: 0.7 });
      g.ellipse(cx, cy, halfW * 0.78, openH);
      g.stroke({ width: 2, color });
      break;
    }
    case "tongue-smile": {
      const smileY = cy + halfW * (0.45 + openAmount * 0.3);
      g.moveTo(cx - halfW, cy);
      g.quadraticCurveTo(cx, smileY, cx + halfW, cy);
      g.stroke({ width: 2, color });
      g.ellipse(cx, cy + halfW * 0.45, halfW * 0.35, halfW * 0.28);
      g.fill({ color: 0xff6b8a });
      g.moveTo(cx, cy + halfW * 0.28);
      g.lineTo(cx, cy + halfW * 0.62);
      g.stroke({ width: 1, color: 0xc63555, alpha: 0.7 });
      break;
    }
    case "fangs": {
      const openH = halfW * (0.65 + openAmount * 0.5);
      g.ellipse(cx, cy, halfW * 0.78, openH);
      g.fill({ color: 0x1a1a1a });
      g.moveTo(cx - halfW * 0.28, cy - openH * 0.1);
      g.lineTo(cx - halfW * 0.12, cy + openH * 0.38);
      g.lineTo(cx + halfW * 0.02, cy - openH * 0.08);
      g.closePath();
      g.fill({ color: 0xffffff });
      g.moveTo(cx + halfW * 0.02, cy - openH * 0.08);
      g.lineTo(cx + halfW * 0.18, cy + openH * 0.38);
      g.lineTo(cx + halfW * 0.32, cy - openH * 0.1);
      g.closePath();
      g.fill({ color: 0xffffff });
      g.ellipse(cx, cy, halfW * 0.78, openH);
      g.stroke({ width: 2, color });
      break;
    }
    case "grin": {
      const depth = halfW * (0.7 + openAmount * 0.35);
      g.moveTo(cx - halfW, cy - halfW * 0.1);
      g.quadraticCurveTo(cx, cy + depth, cx + halfW, cy - halfW * 0.1);
      g.lineTo(cx + halfW * 0.94, cy + halfW * 0.34);
      g.quadraticCurveTo(cx, cy + depth + halfW * 0.16, cx - halfW * 0.94, cy + halfW * 0.34);
      g.closePath();
      g.fill({ color: 0xffffff });
      g.moveTo(cx - halfW, cy - halfW * 0.1);
      g.quadraticCurveTo(cx, cy + depth, cx + halfW, cy - halfW * 0.1);
      g.stroke({ width: 2, color });
      break;
    }
    case "smirk-open": {
      const leftX = cx - halfW * 0.75;
      const rightX = cx + halfW;
      g.moveTo(leftX, cy + halfW * 0.08);
      g.quadraticCurveTo(cx + halfW * 0.1, cy + halfW * 0.55, rightX, cy - halfW * 0.12);
      g.stroke({ width: 2, color });
      g.ellipse(cx + halfW * 0.28, cy + halfW * 0.25, halfW * 0.36, halfW * (0.22 + openAmount * 0.4));
      g.fill({ color: 0x1a1a1a, alpha: 0.9 });
      break;
    }
    case "shout": {
      const openH = halfW * (0.95 + openAmount * 0.75);
      g.ellipse(cx, cy + halfW * 0.08, halfW * 0.72, openH);
      g.fill({ color: 0x121316 });
      g.ellipse(cx, cy + openH * 0.42, halfW * 0.38, openH * 0.32);
      g.fill({ color: 0xff6384, alpha: 0.95 });
      g.ellipse(cx, cy + halfW * 0.08, halfW * 0.72, openH);
      g.stroke({ width: 2, color });
      break;
    }
    case "grimace": {
      const gh = halfW * (0.46 + openAmount * 0.3);
      g.roundRect(cx - halfW * 0.88, cy - gh * 0.55, halfW * 1.76, gh * 1.1, gh * 0.2);
      g.fill({ color: 0xffffff });
      g.roundRect(cx - halfW * 0.88, cy - gh * 0.55, halfW * 1.76, gh * 1.1, gh * 0.2);
      g.stroke({ width: 2, color });
      for (let i = -2; i <= 2; i += 1) {
        const x = cx + (i * halfW * 0.3);
        g.moveTo(x, cy - gh * 0.45);
        g.lineTo(x, cy + gh * 0.45);
        g.stroke({ width: 0.9, color, alpha: 0.7 });
      }
      break;
    }
  }
}

function blendColor(base: number, target: number, amount: number): number {
  const t = Math.max(0, Math.min(1, amount));
  const br = (base >> 16) & 0xff;
  const bg = (base >> 8) & 0xff;
  const bb = base & 0xff;
  const tr = (target >> 16) & 0xff;
  const tg = (target >> 8) & 0xff;
  const tb = target & 0xff;
  const r = Math.round(br + (tr - br) * t);
  const g = Math.round(bg + (tg - bg) * t);
  const b = Math.round(bb + (tb - bb) * t);
  return (r << 16) | (g << 8) | b;
}

function drawShoe(
  g: Graphics,
  style: ShoeStyle,
  x: number,
  y: number,
  width: number,
  height: number,
  direction: -1 | 1,
  color: number,
  soleColor: number,
  accessory: ShoeAccessoryStyle,
  accessoryColor: number
) {
  const dark = blendColor(color, 0x000000, 0.28);
  const light = blendColor(color, 0xffffff, 0.26);
  const left = x - width / 2;
  const top = y - height / 2;
  const soleY = y + height * 0.38;
  const drawAccessory = () => {
    if (accessory === "none") return;
    if (accessory === "laces") {
      for (let i = 0; i < 3; i++) {
        const yy = y - height * 0.12 + i * height * 0.16;
        g.moveTo(x - width * 0.2, yy);
        g.lineTo(x + width * 0.2, yy);
        g.stroke({ width: 1.2, color: accessoryColor, alpha: 0.95 });
      }
      return;
    }
    if (accessory === "stripe") {
      g.moveTo(x - direction * width * 0.2, y - height * 0.15);
      g.lineTo(x + direction * width * 0.28, y + height * 0.15);
      g.stroke({ width: 2, color: accessoryColor, alpha: 0.95 });
      return;
    }
    if (accessory === "buckle") {
      const bw = width * 0.2;
      const bh = height * 0.16;
      g.roundRect(x - bw / 2, y - bh / 2, bw, bh, bh * 0.3);
      g.fill({ color: accessoryColor, alpha: 0.92 });
      g.roundRect(x - bw * 0.26, y - bh * 0.18, bw * 0.52, bh * 0.36, bh * 0.1);
      g.fill({ color: dark, alpha: 0.95 });
      return;
    }
    if (accessory === "charm") {
      const r = height * 0.12;
      const cx = x + direction * width * 0.12;
      const cy = y - height * 0.18;
      g.circle(cx, cy, r);
      g.fill({ color: accessoryColor, alpha: 0.95 });
      return;
    }
    if (accessory === "wings") {
      const wx = width * 0.32;
      const wy = height * 0.22;
      g.moveTo(x - direction * width * 0.42, y - wy * 0.2);
      g.lineTo(x - direction * width * 0.42 - direction * wx * 0.35, y - wy);
      g.lineTo(x - direction * width * 0.42 - direction * wx * 0.4, y + wy * 0.05);
      g.closePath();
      g.fill({ color: accessoryColor, alpha: 0.9 });
    }
  };

  if (style === "dress") {
    const toeX = x + direction * width * 0.6;
    const heelX = x - direction * width * 0.45;
    g.moveTo(heelX, top + height * 0.08);
    g.lineTo(x + direction * width * 0.14, top - height * 0.06);
    g.lineTo(toeX, y + height * 0.04);
    g.lineTo(x + direction * width * 0.12, y + height * 0.45);
    g.lineTo(heelX, y + height * 0.42);
    g.closePath();
    g.fill({ color });
    g.roundRect(heelX, soleY - height * 0.07, toeX - heelX, height * 0.18, height * 0.08);
    g.fill({ color: soleColor, alpha: 0.95 });
    g.moveTo(heelX, soleY + height * 0.02);
    g.lineTo(toeX, soleY + height * 0.02);
    g.stroke({ width: 1.1, color: dark, alpha: 0.75 });
    drawAccessory();
    return;
  }

  if (style === "boots") {
    const shaftW = width * 0.56;
    const shaftLeft = x - shaftW / 2;
    g.roundRect(shaftLeft, top - height * 0.78, shaftW, height * 0.95, height * 0.22);
    g.fill({ color });
    g.roundRect(left, top + height * 0.08, width, height * 0.84, height * 0.26);
    g.fill({ color });
    g.roundRect(left - direction * width * 0.05, soleY - height * 0.08, width * 1.05, height * 0.24, height * 0.1);
    g.fill({ color: soleColor });
    drawAccessory();
    return;
  }

  if (style === "slides") {
    g.roundRect(left, y + height * 0.04, width, height * 0.36, height * 0.14);
    g.fill({ color: soleColor });
    g.roundRect(left + width * 0.1, top - height * 0.12, width * 0.8, height * 0.42, height * 0.16);
    g.fill({ color });
    g.moveTo(left + width * 0.16, y + height * 0.02);
    g.lineTo(left + width * 0.84, y + height * 0.02);
    g.stroke({ width: 1.4, color: light, alpha: 0.75 });
    drawAccessory();
    return;
  }

  if (style === "cool") {
    g.roundRect(left, top, width, height * 0.82, height * 0.24);
    g.fill({ color });
    g.roundRect(left - direction * width * 0.04, soleY - height * 0.1, width * 1.04, height * 0.28, height * 0.12);
    g.fill({ color: soleColor });
    g.moveTo(x - direction * width * 0.22, y - height * 0.03);
    g.lineTo(x + direction * width * 0.05, y - height * 0.16);
    g.lineTo(x + direction * width * 0.23, y + height * 0.03);
    g.lineTo(x - direction * width * 0.02, y + height * 0.15);
    g.closePath();
    g.fill({ color: 0xffffff, alpha: 0.9 });
    drawAccessory();
    return;
  }

  // kicks (default)
  g.roundRect(left, top, width, height * 0.8, height * 0.25);
  g.fill({ color });
  g.roundRect(left - direction * width * 0.05, soleY - height * 0.08, width * 1.05, height * 0.24, height * 0.1);
  g.fill({ color: soleColor });
  g.moveTo(left + width * 0.2, y - height * 0.02);
  g.lineTo(left + width * 0.8, y - height * 0.02);
  g.stroke({ width: 1.2, color: dark, alpha: 0.7 });
  drawAccessory();
}

function drawHand(
  g: Graphics,
  style: HandStyle,
  x: number,
  y: number,
  size: number,
  direction: -1 | 1,
  color: number
) {
  const dark = blendColor(color, 0x000000, 0.25);
  const light = blendColor(color, 0xffffff, 0.2);
  const palmW = size * 0.72;
  const palmH = size * 0.58;
  const fingerW = size * 0.14;
  const fingerGap = size * 0.05;
  const palmLeft = x - palmW / 2;
  const palmTop = y - palmH / 2;

  const drawPalm = (fillColor = color, offsetX = 0, offsetY = 0, alpha = 1) => {
    g.roundRect(palmLeft + offsetX, palmTop + offsetY, palmW, palmH, size * 0.2);
    g.fill({ color: fillColor, alpha });
  };

  const drawFinger = (slot: number, length: number, width = fingerW, lift = 0) => {
    const cx = x + direction * slot;
    g.roundRect(cx - width / 2, palmTop - length + lift, width, length, width * 0.45);
    g.fill({ color });
  };

  const drawThumb = (up = false, out = true) => {
    const thumbW = fingerW * 0.95;
    const thumbH = up ? size * 0.48 : size * 0.32;
    // For front-facing hands, mirrored thumbs should sit toward the center by default.
    const thumbSide = out ? -direction : direction;
    const thumbX = x + thumbSide * (out ? palmW * 0.46 : palmW * 0.34) - thumbW / 2;
    const thumbY = up ? palmTop - thumbH * 0.85 : y - thumbH * 0.1;
    g.roundRect(thumbX, thumbY, thumbW, thumbH, thumbW * 0.45);
    g.fill({ color });
  };

  const drawOpenHand = () => {
    drawPalm();
    drawFinger(-1.5 * (fingerW + fingerGap), size * 0.46);
    drawFinger(-0.5 * (fingerW + fingerGap), size * 0.52);
    drawFinger(0.5 * (fingerW + fingerGap), size * 0.5);
    drawFinger(1.5 * (fingerW + fingerGap), size * 0.44);
    drawThumb(false, true);
  };

  const drawSparkle = (sx: number, sy: number, radius: number) => {
    g.moveTo(sx, sy - radius);
    g.lineTo(sx, sy + radius);
    g.moveTo(sx - radius, sy);
    g.lineTo(sx + radius, sy);
    g.stroke({ width: 1.2, color: light, alpha: 0.9 });
  };

  if (style === "heart") {
    const r = size * 0.2;
    g.circle(x - direction * r * 0.9, y - r * 0.2, r);
    g.fill({ color });
    g.circle(x + direction * r * 0.9, y - r * 0.2, r);
    g.fill({ color });
    g.moveTo(x - direction * r * 2, y - r * 0.05);
    g.lineTo(x, y + r * 2.2);
    g.lineTo(x + direction * r * 2, y - r * 0.05);
    g.closePath();
    g.fill({ color });
    return;
  }

  if (style === "mittens") {
    g.ellipse(x, y, palmW * 0.56, palmH * 0.6);
    g.fill({ color });
    g.circle(x + direction * palmW * 0.46, y + palmH * 0.06, size * 0.16);
    g.fill({ color });
    g.ellipse(x, y + palmH * 0.45, palmW * 0.4, palmH * 0.14);
    g.fill({ color: dark, alpha: 0.8 });
    return;
  }

  if (style === "fist-bump") {
    g.roundRect(palmLeft, palmTop - size * 0.05, palmW, palmH * 0.92, size * 0.2);
    g.fill({ color });
    for (let i = 0; i < 3; i++) {
      const offset = (-1 + i) * palmW * 0.22;
      g.moveTo(x + offset, palmTop + palmH * 0.2);
      g.lineTo(x + offset, palmTop + palmH * 0.48);
      g.stroke({ width: 1.3, color: dark, alpha: 0.8 });
    }
    return;
  }

  if (style === "handshake") {
    drawPalm(color, 0, 0, 0.95);
    drawPalm(blendColor(color, 0x8f6a49, 0.25), -direction * palmW * 0.52, palmH * 0.05, 0.95);
    g.roundRect(x - direction * palmW * 0.24, y - palmH * 0.04, palmW * 0.5, palmH * 0.18, size * 0.08);
    g.fill({ color: dark, alpha: 0.7 });
    return;
  }

  if (style === "clapping") {
    drawPalm(color, 0, 0, 0.95);
    drawPalm(blendColor(color, 0xffffff, 0.12), -direction * palmW * 0.85, -palmH * 0.08, 0.92);
    g.moveTo(x + direction * palmW * 0.5, y - palmH * 0.55);
    g.lineTo(x + direction * palmW * 0.82, y - palmH * 0.75);
    g.moveTo(x + direction * palmW * 0.56, y - palmH * 0.2);
    g.lineTo(x + direction * palmW * 0.92, y - palmH * 0.2);
    g.stroke({ width: 1.3, color: light, alpha: 0.9 });
    return;
  }

  if (style === "cartoon") {
    const glove = blendColor(color, 0xffffff, 0.72);
    drawPalm(glove);
    g.stroke({ width: 1.5, color: dark, alpha: 0.8 });
    drawFinger(-0.8 * (fingerW + fingerGap), size * 0.42, fingerW * 0.95);
    drawFinger(0, size * 0.5, fingerW * 0.98);
    drawFinger(0.8 * (fingerW + fingerGap), size * 0.44, fingerW * 0.95);
    drawThumb(false, true);
    return;
  }

  if (style === "thumbs-up") {
    drawPalm();
    drawThumb(true, true);
    g.roundRect(x - palmW * 0.24, y - palmH * 0.06, palmW * 0.44, palmH * 0.16, size * 0.06);
    g.fill({ color: dark, alpha: 0.45 });
    return;
  }

  if (style === "thumbs-down") {
    drawPalm();
    const thumbW = fingerW * 0.95;
    const thumbH = size * 0.48;
    const thumbSide = -direction;
    const thumbX = x + thumbSide * (palmW * 0.46) - thumbW / 2;
    const thumbY = y + palmH * 0.1;
    g.roundRect(thumbX, thumbY, thumbW, thumbH, thumbW * 0.45);
    g.fill({ color });
    g.roundRect(x - palmW * 0.24, y - palmH * 0.06, palmW * 0.44, palmH * 0.16, size * 0.06);
    g.fill({ color: dark, alpha: 0.45 });
    return;
  }

  if (style === "peace") {
    drawPalm();
    drawFinger(-0.45 * (fingerW + fingerGap), size * 0.56);
    drawFinger(0.45 * (fingerW + fingerGap), size * 0.54);
    drawThumb(false, true);
    return;
  }

  if (style === "number-1") {
    drawPalm();
    drawFinger(0, size * 0.6);
    drawThumb(false, false);
    return;
  }

  if (style === "cool") {
    drawPalm();
    drawFinger(-1.4 * (fingerW + fingerGap), size * 0.5);
    drawFinger(1.4 * (fingerW + fingerGap), size * 0.46);
    drawThumb(false, true);
    return;
  }

  if (style === "surfer") {
    drawPalm();
    drawFinger(1.45 * (fingerW + fingerGap), size * 0.44);
    drawThumb(false, true);
    return;
  }

  if (style === "hi-five") {
    drawOpenHand();
    return;
  }

  if (style === "congrats") {
    drawOpenHand();
    drawSparkle(x + direction * palmW * 0.72, y - palmH * 0.72, size * 0.08);
    return;
  }

  drawOpenHand();
}

/**
 * Draw Object Show-style limbs (arms + legs) around a shape body.
 */
export function drawLimbs(
  container: Container,
  limbs: LimbProps,
  shapeW: number,
  shapeH: number
) {
  const g = new Graphics();
  const color = hexToNumber(limbs.limbColor);
  const shoeColor = hexToNumber(limbs.shoeColor ?? limbs.limbColor, color);
  const shoeSoleColor = hexToNumber(limbs.shoeSoleColor ?? "#f2f4f7", blendColor(shoeColor, 0xffffff, 0.55));
  const shoeAccessoryColor = hexToNumber(limbs.shoeAccessoryColor ?? "#ffffff", 0xffffff);
  const handColor = hexToNumber(limbs.handColor ?? limbs.limbColor, color);
  const sw = limbs.limbThickness;
  const handSize = Math.max(sw * 3.2, shapeW * 0.08);
  const shoeWidth = Math.max(sw * 3.8, shapeW * 0.14);
  const shoeHeight = Math.max(sw * 1.8, shoeWidth * 0.52);
  const drawFoot = (x: number, y: number, direction: -1 | 1) => {
    if (!limbs.feet) return;
    drawShoe(
      g,
      limbs.shoeStyle,
      x,
      y + shoeHeight * 0.34,
      shoeWidth,
      shoeHeight,
      direction,
      shoeColor,
      shoeSoleColor,
      limbs.shoeAccessory,
      shoeAccessoryColor
    );
  };

  // Arm attachment points: sides of the body, slightly below center
  if (limbs.armStyle !== "none") {
    const armAttachY = shapeH * 0.05;
    const armLen = shapeH * 0.4 * limbs.armLength;
    const spreadX = shapeW * 0.15 * limbs.armSpread;
    const rotationDeg = limbs.armRotationDeg ?? 0;
    const baseRotation = (rotationDeg * Math.PI) / 180;
    const rotateAround = (px: number, py: number, ox: number, oy: number, angle: number) => {
      const dx = px - ox;
      const dy = py - oy;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      return {
        x: ox + dx * c - dy * s,
        y: oy + dx * s + dy * c,
      };
    };
    const drawArm = (side: -1 | 1) => {
      const attachX = side * (shapeW / 2);
      // Positive rotation lifts both arms upward.
      const sideRotation = -side * baseRotation;
      if (limbs.armStyle === "bent") {
        const baseMidX = attachX + side * armLen * 0.5;
        const baseMidY = armAttachY + armLen * 0.3;
        const baseEndX = attachX + side * (spreadX + armLen * 0.3);
        const baseEndY = armAttachY + armLen * 0.8;
        const mid = rotateAround(baseMidX, baseMidY, attachX, armAttachY, sideRotation);
        const end = rotateAround(baseEndX, baseEndY, attachX, armAttachY, sideRotation);
        g.moveTo(attachX, armAttachY);
        g.lineTo(mid.x, mid.y);
        g.moveTo(mid.x, mid.y);
        g.lineTo(end.x, end.y);
        g.stroke({ width: sw, color });
        return end;
      }
      const baseEndX = attachX + side * (armLen * 0.6 + spreadX);
      const baseEndY = armAttachY + armLen * 0.7;
      const end = rotateAround(baseEndX, baseEndY, attachX, armAttachY, sideRotation);
      g.moveTo(attachX, armAttachY);
      g.lineTo(end.x, end.y);
      g.stroke({ width: sw, color });
      return end;
    };

    const leftEnd = drawArm(-1);
    const rightEnd = drawArm(1);
    drawHand(g, limbs.handStyle, leftEnd.x, leftEnd.y + handSize * 0.08, handSize, -1, handColor);
    drawHand(g, limbs.handStyle, rightEnd.x, rightEnd.y + handSize * 0.08, handSize, 1, handColor);
  }

  // Leg attachment points: bottom of the body
  if (limbs.legStyle !== "none") {
    const legAttachY = shapeH / 2;
    const legLen = shapeH * 0.45 * limbs.legLength;
    // Gap from center: small base gap + spread-controlled extra
    const legGap = shapeW * 0.08 + shapeW * 0.15 * limbs.legSpread;

    // Left leg
    if (limbs.legStyle === "bent") {
      const kneeX = -legGap - legLen * 0.12;
      const kneeY = legAttachY + legLen * 0.5;
      const endX = -legGap;
      const endY = legAttachY + legLen;
      g.moveTo(-legGap, legAttachY);
      g.lineTo(kneeX, kneeY);
      g.moveTo(kneeX, kneeY);
      g.lineTo(endX, endY);
      g.stroke({ width: sw, color });
      drawFoot(endX, endY, -1);
    } else {
      const endY = legAttachY + legLen;
      g.moveTo(-legGap, legAttachY);
      g.lineTo(-legGap, endY);
      g.stroke({ width: sw, color });
      drawFoot(-legGap, endY, -1);
    }

    // Right leg
    if (limbs.legStyle === "bent") {
      const kneeX = legGap + legLen * 0.12;
      const kneeY = legAttachY + legLen * 0.5;
      const endX = legGap;
      const endY = legAttachY + legLen;
      g.moveTo(legGap, legAttachY);
      g.lineTo(kneeX, kneeY);
      g.moveTo(kneeX, kneeY);
      g.lineTo(endX, endY);
      g.stroke({ width: sw, color });
      drawFoot(endX, endY, 1);
    } else {
      const endY = legAttachY + legLen;
      g.moveTo(legGap, legAttachY);
      g.lineTo(legGap, endY);
      g.stroke({ width: sw, color });
      drawFoot(legGap, endY, 1);
    }
  }

  container.addChild(g);
}

export function drawAccessories(
  container: Container,
  accessories: AccessoryProps[],
  shapeW: number,
  shapeH: number
) {
  if (!Array.isArray(accessories) || accessories.length === 0) return;

  for (const acc of accessories) {
    const g = new Graphics();
    const primary = hexToNumber(acc.color ?? "#5e5ce6", 0x5e5ce6);
    const accent = hexToNumber(acc.accentColor ?? "", blendColor(primary, 0xffffff, 0.32));
    const detail = hexToNumber(acc.detailColor ?? "", blendColor(primary, 0x000000, 0.32));
    const shine = blendColor(accent, 0xffffff, 0.35);
    const x = (acc.x / 100) * shapeW;
    const y = (acc.y / 100) * shapeH;
    const scale = Math.max(0.1, acc.scale || 1);
    g.position.set(x, y);
    g.rotation = ((acc.rotation || 0) * Math.PI) / 180;
    g.scale.set(scale);

    if (acc.type === "hat") {
      g.roundRect(-30, -10, 60, 12, 5);
      g.fill({ color: primary });
      g.stroke({ width: 1.3, color: detail, alpha: 0.45 });
      g.roundRect(-18, -34, 36, 24, 7);
      g.fill({ color: accent });
      g.stroke({ width: 1.3, color: detail, alpha: 0.45 });
      g.roundRect(-18, -18, 36, 6, 3);
      g.fill({ color: detail, alpha: 0.92 });
      g.circle(10, -22, 3);
      g.fill({ color: shine, alpha: 0.95 });
    } else if (acc.type === "glasses") {
      g.roundRect(-23, -8, 18, 14, 4);
      g.fill({ color: accent, alpha: 0.22 });
      g.stroke({ width: 2.3, color: primary, alpha: 0.95 });
      g.roundRect(5, -8, 18, 14, 4);
      g.fill({ color: accent, alpha: 0.22 });
      g.stroke({ width: 2.3, color: primary, alpha: 0.95 });
      g.moveTo(-5, -1);
      g.lineTo(5, -1);
      g.stroke({ width: 2, color: detail, alpha: 0.95 });
      g.moveTo(-21, -8);
      g.lineTo(21, -8);
      g.stroke({ width: 1.8, color: primary, alpha: 0.7 });
      g.moveTo(-19, -4);
      g.lineTo(-11, -7);
      g.moveTo(11, -4);
      g.lineTo(19, -7);
      g.stroke({ width: 1.2, color: shine, alpha: 0.85 });
    } else if (acc.type === "prop") {
      g.roundRect(-4, -24, 8, 48, 3);
      g.fill({ color: detail });
      g.stroke({ width: 1.2, color: primary, alpha: 0.45 });
      g.roundRect(-2.4, -16, 4.8, 22, 2);
      g.fill({ color: accent, alpha: 0.42 });
      g.circle(0, -28, 6);
      g.fill({ color: primary });
      g.stroke({ width: 1.2, color: detail, alpha: 0.4 });
      g.circle(0, -28, 3);
      g.fill({ color: shine, alpha: 0.95 });
    } else {
      g.roundRect(-14, -14, 28, 28, 7);
      g.fill({ color: accent, alpha: 0.95 });
      g.stroke({ width: 2, color: detail, alpha: 0.7 });
      g.circle(0, 0, 7);
      g.fill({ color: primary, alpha: 0.98 });
      g.circle(3, -3, 2.1);
      g.fill({ color: shine, alpha: 0.95 });
    }

    container.addChild(g);
  }
}

/**
 * Convenience: draw a complete character (shape + optional face + optional limbs) into a container.
 * Returns { w, h } of the drawn shape.
 */
export function drawCharacter(
  container: Container,
  shape: ShapeProps,
  face?: FaceProps,
  limbs?: LimbProps,
  accessories?: AccessoryProps[],
  timeMs = Date.now()
): { w: number; h: number } {
  // Draw limbs behind the body
  if (limbs) {
    drawLimbs(container, limbs, shape.width, shape.height);
  }

  const body = new Graphics();
  const { w, h } = drawShapeBody(body, shape);
  container.addChild(body);
  drawShapePattern(container, shape, w, h);

  if (face) {
    drawFace(container, face, w, h, timeMs);
  }

  if (accessories && accessories.length > 0) {
    drawAccessories(container, accessories, w, h);
  }

  return { w, h };
}
