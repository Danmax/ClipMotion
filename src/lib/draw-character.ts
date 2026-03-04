/**
 * Shared drawing functions for rendering characters (shapes + faces)
 * using PixiJS Graphics. Used by both the editor canvas and the
 * character builder preview.
 */
import { Graphics, Container } from "pixi.js";
import type { ShapeProps, FaceProps, EyeStyle, MouthStyle } from "@/engine/types";

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
  for (let i = 0; i < 2 * points; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = -Math.PI / 2 + (i + 1) * step;
    g.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
  }
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
  shapeH: number
) {
  const g = new Graphics();
  const scale = face.faceScale;
  const baseSize = Math.min(shapeW, shapeH);

  const baseEyeRadius = baseSize * 0.06 * face.eyeSize * scale;
  const baseSpacing = shapeW * 0.15 * face.eyeSpacing * scale;
  const eyeY = shapeH * face.eyeOffsetY;
  const eyeColor = hexToNumber(face.eyeColor);

  drawEye(g, -baseSpacing, eyeY, baseEyeRadius, face.eyeStyle, eyeColor, face.pupilSize, true);
  drawEye(g, baseSpacing, eyeY, baseEyeRadius, face.eyeStyle, eyeColor, face.pupilSize, false);

  const mouthY = shapeH * face.mouthOffsetY;
  const mouthW = shapeW * 0.2 * face.mouthSize * scale;
  const mouthColor = hexToNumber(face.mouthColor);

  drawMouth(g, 0, mouthY, mouthW, face.mouthStyle, mouthColor, face.mouthCurve);

  container.addChild(g);
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
  curve: number
) {
  const halfW = width / 2;
  const curveAmount = halfW * curve;

  switch (style) {
    case "line":
      g.moveTo(cx - halfW, cy);
      g.lineTo(cx + halfW, cy);
      g.closePath();
      g.stroke({ width: 2, color });
      break;
    case "smile":
      g.moveTo(cx - halfW, cy);
      g.quadraticCurveTo(cx, cy + Math.abs(curveAmount) + halfW * 0.5, cx + halfW, cy);
      g.closePath();
      g.stroke({ width: 2, color });
      break;
    case "frown":
      g.moveTo(cx - halfW, cy);
      g.quadraticCurveTo(cx, cy - Math.abs(curveAmount) - halfW * 0.3, cx + halfW, cy);
      g.closePath();
      g.stroke({ width: 2, color });
      break;
    case "open":
      g.ellipse(cx, cy, halfW * 0.8, halfW * 0.6);
      g.fill({ color });
      break;
    case "o":
      g.circle(cx, cy, halfW * 0.5);
      g.stroke({ width: 2, color });
      break;
    case "teeth": {
      g.moveTo(cx - halfW, cy);
      g.quadraticCurveTo(cx, cy + halfW * 0.7, cx + halfW, cy);
      g.lineTo(cx - halfW, cy);
      g.closePath();
      g.fill({ color: 0xffffff });
      g.moveTo(cx - halfW, cy);
      g.quadraticCurveTo(cx, cy + halfW * 0.7, cx + halfW, cy);
      g.closePath();
      g.stroke({ width: 2, color });
      g.moveTo(cx - halfW * 0.8, cy + halfW * 0.15);
      g.lineTo(cx + halfW * 0.8, cy + halfW * 0.15);
      g.closePath();
      g.stroke({ width: 1, color });
      break;
    }
    case "wavy":
      g.moveTo(cx - halfW, cy);
      g.bezierCurveTo(
        cx - halfW * 0.3, cy - halfW * 0.3,
        cx + halfW * 0.3, cy + halfW * 0.3,
        cx + halfW, cy
      );
      g.closePath();
      g.stroke({ width: 2, color });
      break;
    case "small-smile":
      g.moveTo(cx - halfW * 0.4, cy);
      g.quadraticCurveTo(cx, cy + halfW * 0.3, cx + halfW * 0.5, cy - halfW * 0.1);
      g.closePath();
      g.stroke({ width: 2, color });
      break;
  }
}

/**
 * Convenience: draw a complete character (shape + optional face) into a container.
 * Returns { w, h } of the drawn shape.
 */
export function drawCharacter(
  container: Container,
  shape: ShapeProps,
  face?: FaceProps
): { w: number; h: number } {
  const body = new Graphics();
  const { w, h } = drawShapeBody(body, shape);
  container.addChild(body);

  if (face) {
    drawFace(container, face, w, h);
  }

  return { w, h };
}
