import type { FaceProps, ExpressionPreset } from "./types";
import { DEFAULT_FACE } from "./types";

export const EXPRESSION_PRESETS: Record<ExpressionPreset, Partial<FaceProps>> = {
  neutral: {
    expression: "neutral",
    eyeStyle: "dot",
    mouthStyle: "line",
    mouthCurve: 0,
  },
  happy: {
    expression: "happy",
    eyeStyle: "dot",
    mouthStyle: "smile",
    mouthCurve: 0.8,
    mouthSize: 1.2,
  },
  sad: {
    expression: "sad",
    eyeStyle: "dot",
    mouthStyle: "frown",
    mouthCurve: -0.6,
    eyeOffsetY: -0.05,
  },
  angry: {
    expression: "angry",
    eyeStyle: "angry",
    mouthStyle: "frown",
    mouthCurve: -0.4,
    mouthSize: 0.8,
  },
  surprised: {
    expression: "surprised",
    eyeStyle: "wide",
    mouthStyle: "o",
    eyeSize: 1.4,
    mouthSize: 1.3,
  },
  worried: {
    expression: "worried",
    eyeStyle: "circle",
    mouthStyle: "wavy",
    mouthCurve: -0.3,
    eyeSize: 0.9,
  },
  smug: {
    expression: "smug",
    eyeStyle: "dot",
    mouthStyle: "small-smile",
    mouthCurve: 0.5,
    mouthOffsetY: 0.18,
  },
  scared: {
    expression: "scared",
    eyeStyle: "wide",
    mouthStyle: "wavy",
    eyeSize: 1.5,
    mouthSize: 1.1,
  },
  dead: {
    expression: "dead",
    eyeStyle: "closed",
    mouthStyle: "line",
    mouthCurve: 0,
    eyeSize: 1.2,
  },
};

export function applyPreset(preset: ExpressionPreset): FaceProps {
  return { ...DEFAULT_FACE, ...EXPRESSION_PRESETS[preset] };
}
