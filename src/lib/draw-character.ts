/**
 * Shared drawing functions for rendering characters (shapes + faces)
 * using PixiJS Graphics. Used by both the editor canvas and the
 * character builder preview.
 */
import { Graphics, Container } from "pixi.js";
import {
  DEFAULT_FACE,
  type ShapeProps,
  type FaceProps,
  type LimbProps,
  type EyeStyle,
  type MouthStyle,
  type EyebrowStyle,
} from "@/engine/types";

export function hexToNumber(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

/**
 * Draw a shape body onto a Graphics object.
 * Returns { w, h } of the drawn shape.
 */
export function drawShapeBody(g: Graphics, shape: ShapeProps): { w: number; h: number } {
  const w = shape.width;
  const h = shape.height;
  const fillColor = hexToNumber(shape.fill);

  switch (shape.shapeType) {
    case "rectangle": {
      const r = shape.cornerRadius ?? 0;
      if (r > 0) {
        g.roundRect(-w / 2, -h / 2, w, h, r);
      } else {
        g.rect(-w / 2, -h / 2, w, h);
      }
      g.fill({ color: fillColor });
      break;
    }
    case "ellipse": {
      g.ellipse(0, 0, w / 2, h / 2);
      g.fill({ color: fillColor });
      break;
    }
    case "triangle": {
      g.moveTo(0, -h / 2);
      g.lineTo(w / 2, h / 2);
      g.lineTo(-w / 2, h / 2);
      g.closePath();
      g.fill({ color: fillColor });
      break;
    }
    case "star": {
      const points = shape.points ?? 5;
      drawStar(g, 0, 0, points, w / 2, w / 4);
      g.fill({ color: fillColor });
      break;
    }
    case "polygon": {
      const sides = shape.points ?? 6;
      drawPolygon(g, 0, 0, sides, w / 2);
      g.fill({ color: fillColor });
      break;
    }
    case "stickfigure": {
      drawStickFigure(g, w, h, fillColor);
      break;
    }
  }

  if (shape.stroke && shape.strokeWidth) {
    g.stroke({ width: shape.strokeWidth, color: hexToNumber(shape.stroke) });
  }

  return { w, h };
}

export function drawStar(
  g: Graphics,
  cx: number,
  cy: number,
  points: number,
  outerR: number,
  innerR: number
) {
  const step = Math.PI / points;
  g.moveTo(cx, cy - outerR);
  for (let i = 1; i <= 2 * points; i++) {
    const r = i % 2 === 1 ? innerR : outerR;
    const angle = -Math.PI / 2 + i * step;
    g.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  }
  g.lineTo(cx, cy - outerR);
  g.closePath();
}

export function drawPolygon(
  g: Graphics,
  cx: number,
  cy: number,
  sides: number,
  radius: number
) {
  for (let i = 0; i < sides; i++) {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
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
  }
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
  const sw = limbs.limbThickness;

  // Arm attachment points: sides of the body, slightly below center
  if (limbs.armStyle !== "none") {
    const armAttachY = shapeH * 0.05;
    const armLen = shapeH * 0.4 * limbs.armLength;
    const spreadX = shapeW * 0.15 * limbs.armSpread;

    // Left arm
    const lax = -shapeW / 2;
    if (limbs.armStyle === "bent") {
      const midX = lax - armLen * 0.5;
      const midY = armAttachY + armLen * 0.3;
      const endX = lax - spreadX - armLen * 0.3;
      const endY = armAttachY + armLen * 0.8;
      g.moveTo(lax, armAttachY);
      g.lineTo(midX, midY);
      g.moveTo(midX, midY);
      g.lineTo(endX, endY);
      g.stroke({ width: sw, color });
    } else {
      const endX = lax - armLen * 0.6 - spreadX;
      const endY = armAttachY + armLen * 0.7;
      g.moveTo(lax, armAttachY);
      g.lineTo(endX, endY);
      g.stroke({ width: sw, color });
    }

    // Right arm
    const rax = shapeW / 2;
    if (limbs.armStyle === "bent") {
      const midX = rax + armLen * 0.5;
      const midY = armAttachY + armLen * 0.3;
      const endX = rax + spreadX + armLen * 0.3;
      const endY = armAttachY + armLen * 0.8;
      g.moveTo(rax, armAttachY);
      g.lineTo(midX, midY);
      g.moveTo(midX, midY);
      g.lineTo(endX, endY);
      g.stroke({ width: sw, color });
    } else {
      const endX = rax + armLen * 0.6 + spreadX;
      const endY = armAttachY + armLen * 0.7;
      g.moveTo(rax, armAttachY);
      g.lineTo(endX, endY);
      g.stroke({ width: sw, color });
    }
  }

  // Leg attachment points: bottom of the body
  if (limbs.legStyle !== "none") {
    const legAttachY = shapeH / 2;
    const legLen = shapeH * 0.45 * limbs.legLength;
    // Gap from center: small base gap + spread-controlled extra
    const legGap = shapeW * 0.08 + shapeW * 0.15 * limbs.legSpread;
    const footW = sw * 2.5;

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
      if (limbs.feet) {
        g.ellipse(endX, endY + footW * 0.3, footW, footW * 0.4);
        g.fill({ color });
      }
    } else {
      const endY = legAttachY + legLen;
      g.moveTo(-legGap, legAttachY);
      g.lineTo(-legGap, endY);
      g.stroke({ width: sw, color });
      if (limbs.feet) {
        g.ellipse(-legGap, endY + footW * 0.3, footW, footW * 0.4);
        g.fill({ color });
      }
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
      if (limbs.feet) {
        g.ellipse(endX, endY + footW * 0.3, footW, footW * 0.4);
        g.fill({ color });
      }
    } else {
      const endY = legAttachY + legLen;
      g.moveTo(legGap, legAttachY);
      g.lineTo(legGap, endY);
      g.stroke({ width: sw, color });
      if (limbs.feet) {
        g.ellipse(legGap, endY + footW * 0.3, footW, footW * 0.4);
        g.fill({ color });
      }
    }
  }

  container.addChild(g);
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
  timeMs = Date.now()
): { w: number; h: number } {
  // Draw limbs behind the body
  if (limbs) {
    drawLimbs(container, limbs, shape.width, shape.height);
  }

  const body = new Graphics();
  const { w, h } = drawShapeBody(body, shape);
  container.addChild(body);

  if (face) {
    drawFace(container, face, w, h, timeMs);
  }

  return { w, h };
}
