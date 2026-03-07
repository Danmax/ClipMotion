import { z } from "zod";
import { applyPreset } from "@/engine/face-presets";
import {
  ANIMATABLE_PROPERTIES,
  DEFAULT_FACE,
  DEFAULT_LIMBS,
  type AccessoryProps,
  type AnimatableProperty,
  type EasingDefinition,
  type ExpressionPreset,
  type FaceProps,
  type LimbProps,
  type ShapeProps,
} from "@/engine/types";

export interface StoryLayerPlan {
  id: string;
  name: string;
  fill: string;
  targetLayer: "background" | "normal" | "foreground";
  parallaxFactor?: number;
  wFrac: number;
  hFrac: number;
  xFrac: number;
  yFrac: number;
}

export interface StoryTrackKeyframe {
  timeMs: number;
  value: number;
  easing?: EasingDefinition;
}

export type StoryTrackMap = Partial<Record<AnimatableProperty, StoryTrackKeyframe[]>>;

export interface StoryExpressionKey {
  timeMs: number;
  face: FaceProps;
}

export interface StoryNodePlan {
  id: string;
  name: string;
  layer: "background" | "normal" | "foreground";
  parallaxFactor?: number;
  shape: ShapeProps;
  face?: FaceProps;
  limbs?: LimbProps;
  accessories?: AccessoryProps[];
  transform: {
    x: number;
    y: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    opacity?: number;
  };
  tracks?: StoryTrackMap;
  expressionKeys?: StoryExpressionKey[];
}

export interface StoryScenePlan {
  id: string;
  prompt: string;
  summary: string;
  layers: StoryLayerPlan[];
  nodes: StoryNodePlan[];
}

interface StorySceneOptions {
  canvasWidth: number;
  canvasHeight: number;
  durationMs: number;
}

const STORY_LAYERS = ["background", "normal", "foreground"] as const;
const SHAPE_TYPES = [
  "rectangle",
  "ellipse",
  "triangle",
  "star",
  "polygon",
  "custom-path",
  "capsule",
  "diamond",
  "trapezoid",
  "parallelogram",
  "blob",
  "asymmetric-blob",
  "stickfigure",
] as const;
const EXPRESSIONS = [
  "neutral",
  "happy",
  "smiles",
  "joy",
  "sad",
  "fear",
  "angry",
  "thinking",
  "worry",
  "worried",
  "releive",
  "content",
  "bored",
  "meh",
  "tongueOut",
  "sleeping",
  "tired",
  "kiss",
  "flirt",
  "surprised",
  "smug",
  "scared",
  "dead",
] as const;
const EYE_STYLES = [
  "dot",
  "circle",
  "oval",
  "angry",
  "closed",
  "wink",
  "wide",
  "sleepy",
  "sparkle",
  "heart",
  "cross",
  "laughing",
  "attentive",
  "roll-eyes",
  "google-eyes",
  "intense",
  "puppy-eyes",
  "money",
  "slanted",
  "side-eye",
  "tiny",
  "half-lidded",
] as const;
const MOUTH_STYLES = [
  "smile",
  "frown",
  "open",
  "line",
  "o",
  "teeth",
  "wavy",
  "small-smile",
  "tongue",
  "tongue-smile",
  "toothy-grin",
  "fangs",
  "grin",
  "smirk-open",
  "shout",
  "grimace",
] as const;
const EYEBROW_STYLES = ["none", "line", "arc", "angry", "sad"] as const;
const LIMB_STYLES = ["straight", "bent", "none"] as const;
const SHOE_STYLES = ["kicks", "dress", "boots", "slides", "cool"] as const;
const SHOE_ACCESSORIES = ["none", "laces", "stripe", "buckle", "charm", "wings"] as const;
const HAND_STYLES = [
  "thumbs-up",
  "thumbs-down",
  "peace",
  "number-1",
  "cool",
  "surfer",
  "heart",
  "hi-five",
  "fist-bump",
  "handshake",
  "clapping",
  "congrats",
  "mittens",
  "cartoon",
] as const;
const ACCESSORY_TYPES = ["hat", "glasses", "prop", "other"] as const;

export const STORY_SCENE_REQUEST_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "layers", "nodes"],
  properties: {
    summary: { type: "string" },
    layers: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "fill", "targetLayer", "wFrac", "hFrac", "xFrac", "yFrac"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          fill: { type: "string" },
          targetLayer: { type: "string", enum: [...STORY_LAYERS] },
          parallaxFactor: { type: "number" },
          wFrac: { type: "number" },
          hFrac: { type: "number" },
          xFrac: { type: "number" },
          yFrac: { type: "number" },
        },
      },
    },
    nodes: {
      type: "array",
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "layer", "shape", "transform"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          layer: { type: "string", enum: [...STORY_LAYERS] },
          parallaxFactor: { type: "number" },
          shape: {
            type: "object",
            additionalProperties: false,
            required: ["shapeType", "width", "height", "fill"],
            properties: {
              shapeType: { type: "string", enum: [...SHAPE_TYPES] },
              width: { type: "number" },
              height: { type: "number" },
              fill: { type: "string" },
              stroke: { type: "string" },
              strokeWidth: { type: "number" },
              cornerRadius: { type: "number" },
              pattern: {
                type: "string",
                enum: ["none", "stripes", "dots", "checker", "crosshatch", "zigzag"],
              },
              patternColor: { type: "string" },
              patternScale: { type: "number" },
              points: { type: "number" },
              customPath: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["x", "y"],
                  properties: {
                    x: { type: "number" },
                    y: { type: "number" },
                  },
                },
              },
            },
          },
          face: { type: "object" },
          limbs: { type: "object" },
          accessories: { type: "array", items: { type: "object" } },
          transform: {
            type: "object",
            additionalProperties: false,
            required: ["x", "y"],
            properties: {
              x: { type: "number" },
              y: { type: "number" },
              rotation: { type: "number" },
              scaleX: { type: "number" },
              scaleY: { type: "number" },
              opacity: { type: "number" },
            },
          },
          tracks: { type: "object" },
          expressionKeys: { type: "array", items: { type: "object" } },
        },
      },
    },
  },
} as const;

const generatedSceneEnvelopeSchema = z.object({
  summary: z.string().optional(),
  layers: z.array(z.unknown()).optional(),
  nodes: z.array(z.unknown()).optional(),
});

type StoryTheme = "city-night" | "forest" | "desert" | "beach" | "factory" | "default";
type StoryAction = "chase" | "fly" | "dance" | "talk" | "walk";
type StoryMood = "happy" | "angry" | "fear" | "thinking" | "content";

const EASE_LINEAR: EasingDefinition = { type: "linear" };
const EASE_OUT: EasingDefinition = { type: "cubicBezier", controlPoints: [0.22, 0.05, 0.28, 1] };
const EASE_IN_OUT: EasingDefinition = { type: "cubicBezier", controlPoints: [0.4, 0, 0.2, 1] };

function hasAny(source: string, words: string[]): boolean {
  return words.some((word) => source.includes(word));
}

function detectTheme(prompt: string): StoryTheme {
  if (hasAny(prompt, ["city", "street", "neon", "night", "train"])) return "city-night";
  if (hasAny(prompt, ["forest", "jungle", "tree", "woods"])) return "forest";
  if (hasAny(prompt, ["desert", "canyon", "sand"])) return "desert";
  if (hasAny(prompt, ["beach", "ocean", "island", "sea", "tropical"])) return "beach";
  if (hasAny(prompt, ["factory", "industrial", "robot", "machine"])) return "factory";
  return "default";
}

function detectAction(prompt: string): StoryAction {
  if (hasAny(prompt, ["chase", "run", "race", "escape"])) return "chase";
  if (hasAny(prompt, ["fly", "soar", "bird", "sky"])) return "fly";
  if (hasAny(prompt, ["dance", "party", "groove"])) return "dance";
  if (hasAny(prompt, ["talk", "chat", "argue", "speak", "conversation"])) return "talk";
  return "walk";
}

function detectMood(prompt: string): StoryMood {
  if (hasAny(prompt, ["angry", "mad", "furious"])) return "angry";
  if (hasAny(prompt, ["fear", "scared", "afraid", "panic"])) return "fear";
  if (hasAny(prompt, ["think", "plan", "idea"])) return "thinking";
  if (hasAny(prompt, ["happy", "joy", "fun", "excited"])) return "happy";
  return "content";
}

function moodToExpression(mood: StoryMood): ExpressionPreset {
  if (mood === "angry") return "angry";
  if (mood === "fear") return "fear";
  if (mood === "thinking") return "thinking";
  if (mood === "happy") return "joy";
  return "content";
}

function hashPrompt(prompt: string): number {
  let hash = 0;
  for (let i = 0; i < prompt.length; i += 1) {
    hash = (hash * 31 + prompt.charCodeAt(i)) % 100000;
  }
  return hash;
}

function at(durationMs: number, fraction: number): number {
  return Math.round(Math.max(0, Math.min(1, fraction)) * durationMs);
}

function buildThemeLayers(theme: StoryTheme): StoryLayerPlan[] {
  if (theme === "city-night") {
    return [
      { id: "sky", name: "Night Sky", fill: "#10152e", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
      { id: "buildings", name: "City Silhouette", fill: "#2c3e66", targetLayer: "normal", parallaxFactor: 0.6, wFrac: 1, hFrac: 0.33, xFrac: 0, yFrac: 0.27 },
      { id: "street", name: "Street", fill: "#1f2937", targetLayer: "foreground", parallaxFactor: 1.2, wFrac: 1, hFrac: 0.2, xFrac: 0, yFrac: 0.4 },
    ];
  }
  if (theme === "forest") {
    return [
      { id: "mist", name: "Forest Mist", fill: "#9ec5a6", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
      { id: "trees", name: "Tree Line", fill: "#3f6f48", targetLayer: "normal", parallaxFactor: 0.62, wFrac: 1, hFrac: 0.38, xFrac: 0, yFrac: 0.24 },
      { id: "ground", name: "Forest Floor", fill: "#264733", targetLayer: "foreground", parallaxFactor: 1.25, wFrac: 1, hFrac: 0.2, xFrac: 0, yFrac: 0.41 },
    ];
  }
  if (theme === "desert") {
    return [
      { id: "sky", name: "Desert Sky", fill: "#ffd8a8", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
      { id: "ridge", name: "Far Canyons", fill: "#c96a2a", targetLayer: "normal", parallaxFactor: 0.58, wFrac: 1, hFrac: 0.32, xFrac: 0, yFrac: 0.25 },
      { id: "sand", name: "Sandy Foreground", fill: "#8f3f1f", targetLayer: "foreground", parallaxFactor: 1.25, wFrac: 1, hFrac: 0.2, xFrac: 0, yFrac: 0.4 },
    ];
  }
  if (theme === "beach") {
    return [
      { id: "sky", name: "Coast Sky", fill: "#95e6ff", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
      { id: "water", name: "Ocean", fill: "#2b8fbf", targetLayer: "normal", parallaxFactor: 0.6, wFrac: 1, hFrac: 0.35, xFrac: 0, yFrac: 0.28 },
      { id: "shore", name: "Shoreline", fill: "#e0b76a", targetLayer: "foreground", parallaxFactor: 1.2, wFrac: 1, hFrac: 0.18, xFrac: 0, yFrac: 0.41 },
    ];
  }
  if (theme === "factory") {
    return [
      { id: "back", name: "Factory Backdrop", fill: "#6c757d", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
      { id: "mid", name: "Machine Midline", fill: "#495057", targetLayer: "normal", parallaxFactor: 0.64, wFrac: 1, hFrac: 0.34, xFrac: 0, yFrac: 0.27 },
      { id: "floor", name: "Steel Floor", fill: "#343a40", targetLayer: "foreground", parallaxFactor: 1.22, wFrac: 1, hFrac: 0.2, xFrac: 0, yFrac: 0.4 },
    ];
  }
  return [
    { id: "sky", name: "Sky", fill: "#a9d6ff", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
    { id: "horizon", name: "Horizon", fill: "#7db56e", targetLayer: "normal", parallaxFactor: 0.6, wFrac: 1, hFrac: 0.34, xFrac: 0, yFrac: 0.27 },
    { id: "ground", name: "Ground", fill: "#3f7d44", targetLayer: "foreground", parallaxFactor: 1.2, wFrac: 1, hFrac: 0.2, xFrac: 0, yFrac: 0.4 },
  ];
}

function createActorFace(mood: StoryMood, talk = false): FaceProps {
  const face = applyPreset(moodToExpression(mood));
  if (talk) {
    face.mouthEffect = "talk";
    face.mouthTalkAmount = 0.7;
    face.mouthTalkSpeed = 6.5;
  }
  return face;
}

function createActorLimbs(): LimbProps {
  return {
    ...DEFAULT_LIMBS,
    armStyle: "bent",
    legStyle: "bent",
    limbColor: "#101828",
    handStyle: "cartoon",
    armLength: 0.85,
    legLength: 0.95,
    feet: true,
    shoeStyle: "kicks",
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback: number, min?: number, max?: number): number {
  const candidate = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(candidate)) return fallback;
  if (min !== undefined && max !== undefined) return clamp(candidate, min, max);
  if (min !== undefined) return Math.max(candidate, min);
  if (max !== undefined) return Math.min(candidate, max);
  return candidate;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function sanitizeShape(raw: unknown, options: StorySceneOptions): ShapeProps {
  const record = isRecord(raw) ? raw : {};
  const shapeType = readEnum(record.shapeType, SHAPE_TYPES, "rectangle");
  const shape: ShapeProps = {
    shapeType,
    width: readNumber(record.width, Math.round(options.canvasWidth * 0.14), 24, options.canvasWidth * 1.2),
    height: readNumber(record.height, Math.round(options.canvasHeight * 0.18), 24, options.canvasHeight * 1.2),
    fill: readString(record.fill, "#58a6ff"),
  };

  if (typeof record.stroke === "string") shape.stroke = record.stroke;
  if (record.strokeWidth !== undefined) shape.strokeWidth = readNumber(record.strokeWidth, 0, 0, 24);
  if (record.cornerRadius !== undefined) shape.cornerRadius = readNumber(record.cornerRadius, 0, 0, 200);
  if (typeof record.pattern === "string") shape.pattern = readEnum(
    record.pattern,
    ["none", "stripes", "dots", "checker", "crosshatch", "zigzag"] as const,
    "none"
  );
  if (typeof record.patternColor === "string") shape.patternColor = record.patternColor;
  if (record.patternScale !== undefined) shape.patternScale = readNumber(record.patternScale, 1, 0.1, 8);
  if (record.points !== undefined) shape.points = Math.round(readNumber(record.points, 5, 3, 12));
  if (Array.isArray(record.customPath)) {
    const points = record.customPath
      .filter(isRecord)
      .slice(0, 16)
      .map((point) => ({
        x: readNumber(point.x, 0, -options.canvasWidth, options.canvasWidth),
        y: readNumber(point.y, 0, -options.canvasHeight, options.canvasHeight),
      }));
    if (points.length >= 3) shape.customPath = points;
  }

  return shape;
}

function sanitizeFace(raw: unknown): FaceProps | undefined {
  if (!isRecord(raw)) return undefined;
  return {
    expression: readEnum(raw.expression, EXPRESSIONS, DEFAULT_FACE.expression),
    eyeStyle: readEnum(raw.eyeStyle, EYE_STYLES, DEFAULT_FACE.eyeStyle),
    eyeSize: readNumber(raw.eyeSize, DEFAULT_FACE.eyeSize, 0.2, 3),
    eyeSpacing: readNumber(raw.eyeSpacing, DEFAULT_FACE.eyeSpacing, 0.1, 3),
    eyeOffsetY: readNumber(raw.eyeOffsetY, DEFAULT_FACE.eyeOffsetY, -1, 1),
    eyeColor: readString(raw.eyeColor, DEFAULT_FACE.eyeColor),
    pupilSize: readNumber(raw.pupilSize, DEFAULT_FACE.pupilSize, 0, 2),
    mouthStyle: readEnum(raw.mouthStyle, MOUTH_STYLES, DEFAULT_FACE.mouthStyle),
    mouthSize: readNumber(raw.mouthSize, DEFAULT_FACE.mouthSize, 0.2, 3),
    mouthOffsetY: readNumber(raw.mouthOffsetY, DEFAULT_FACE.mouthOffsetY, -1, 1),
    mouthColor: readString(raw.mouthColor, DEFAULT_FACE.mouthColor),
    mouthCurve: readNumber(raw.mouthCurve, DEFAULT_FACE.mouthCurve, -2, 2),
    mouthEffect: readEnum(raw.mouthEffect, ["none", "talk"] as const, DEFAULT_FACE.mouthEffect),
    mouthTalkSpeed: readNumber(raw.mouthTalkSpeed, DEFAULT_FACE.mouthTalkSpeed, 0.5, 16),
    mouthTalkAmount: readNumber(raw.mouthTalkAmount, DEFAULT_FACE.mouthTalkAmount, 0, 1.5),
    eyebrowStyle: readEnum(raw.eyebrowStyle, EYEBROW_STYLES, DEFAULT_FACE.eyebrowStyle),
    eyebrowColor: readString(raw.eyebrowColor, DEFAULT_FACE.eyebrowColor),
    eyebrowThickness: readNumber(raw.eyebrowThickness, DEFAULT_FACE.eyebrowThickness, 0.5, 8),
    eyebrowOffsetY: readNumber(raw.eyebrowOffsetY, DEFAULT_FACE.eyebrowOffsetY, -1, 1),
    eyebrowTilt: readNumber(raw.eyebrowTilt, DEFAULT_FACE.eyebrowTilt, -90, 90),
    faceScale: readNumber(raw.faceScale, DEFAULT_FACE.faceScale, 0.25, 3),
  };
}

function sanitizeLimbs(raw: unknown): LimbProps | undefined {
  if (!isRecord(raw)) return undefined;
  return {
    armStyle: readEnum(raw.armStyle, LIMB_STYLES, DEFAULT_LIMBS.armStyle),
    legStyle: readEnum(raw.legStyle, LIMB_STYLES, DEFAULT_LIMBS.legStyle),
    limbColor: readString(raw.limbColor, DEFAULT_LIMBS.limbColor),
    limbThickness: readNumber(raw.limbThickness, DEFAULT_LIMBS.limbThickness, 1, 8),
    armLength: readNumber(raw.armLength, DEFAULT_LIMBS.armLength, 0.3, 1.6),
    legLength: readNumber(raw.legLength, DEFAULT_LIMBS.legLength, 0.3, 1.6),
    armSpread: readNumber(raw.armSpread, DEFAULT_LIMBS.armSpread, 0, 1.2),
    armRotationDeg: readNumber(raw.armRotationDeg, DEFAULT_LIMBS.armRotationDeg, -120, 120),
    legSpread: readNumber(raw.legSpread, DEFAULT_LIMBS.legSpread, 0, 1.2),
    feet: readBoolean(raw.feet, DEFAULT_LIMBS.feet),
    shoeStyle: readEnum(raw.shoeStyle, SHOE_STYLES, DEFAULT_LIMBS.shoeStyle),
    shoeColor: readString(raw.shoeColor, DEFAULT_LIMBS.shoeColor),
    shoeSoleColor: readString(raw.shoeSoleColor, DEFAULT_LIMBS.shoeSoleColor),
    shoeAccessory: readEnum(raw.shoeAccessory, SHOE_ACCESSORIES, DEFAULT_LIMBS.shoeAccessory),
    shoeAccessoryColor: readString(raw.shoeAccessoryColor, DEFAULT_LIMBS.shoeAccessoryColor),
    handStyle: readEnum(raw.handStyle, HAND_STYLES, DEFAULT_LIMBS.handStyle),
    handColor: readString(raw.handColor, DEFAULT_LIMBS.handColor),
  };
}

function sanitizeAccessories(raw: unknown): AccessoryProps[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const accessories = raw
    .filter(isRecord)
    .slice(0, 6)
    .map((item, index) => ({
      id: readString(item.id, `acc-${index + 1}`),
      type: readEnum(item.type, ACCESSORY_TYPES, "other"),
      name: readString(item.name, `Accessory ${index + 1}`),
      x: readNumber(item.x, 0, -2000, 2000),
      y: readNumber(item.y, 0, -2000, 2000),
      scale: readNumber(item.scale, 1, 0.1, 4),
      rotation: readNumber(item.rotation, 0, -360, 360),
      color: typeof item.color === "string" ? item.color : undefined,
      accentColor: typeof item.accentColor === "string" ? item.accentColor : undefined,
      detailColor: typeof item.detailColor === "string" ? item.detailColor : undefined,
    }));

  return accessories.length > 0 ? accessories : undefined;
}

function sanitizeTracks(raw: unknown, durationMs: number): StoryTrackMap | undefined {
  if (!isRecord(raw)) return undefined;
  const tracks: StoryTrackMap = {};

  for (const property of ANIMATABLE_PROPERTIES) {
    const value = raw[property];
    if (!Array.isArray(value)) continue;
    const keyframes = value
      .filter(isRecord)
      .slice(0, 8)
      .map((frame, index) => {
        const easing = isRecord(frame.easing)
          ? {
              type: readEnum(frame.easing.type, ["linear", "step", "cubicBezier"] as const, "linear"),
              controlPoints:
                Array.isArray(frame.easing.controlPoints) && frame.easing.controlPoints.length === 4
                  ? [
                      readNumber(frame.easing.controlPoints[0], 0, 0, 1),
                      readNumber(frame.easing.controlPoints[1], 0, 0, 1),
                      readNumber(frame.easing.controlPoints[2], 1, 0, 1),
                      readNumber(frame.easing.controlPoints[3], 1, 0, 1),
                    ] as [number, number, number, number]
                  : undefined,
            }
          : undefined;

        return {
          timeMs: Math.round(readNumber(frame.timeMs, Math.round((index / Math.max(1, value.length - 1)) * durationMs), 0, durationMs)),
          value: readNumber(frame.value, 0, -4000, 4000),
          easing,
        };
      })
      .sort((a, b) => a.timeMs - b.timeMs);

    if (keyframes.length > 0) {
      tracks[property] = keyframes;
    }
  }

  return Object.keys(tracks).length > 0 ? tracks : undefined;
}

function sanitizeExpressionKeys(raw: unknown, durationMs: number): StoryExpressionKey[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const keys = raw
    .filter(isRecord)
    .slice(0, 6)
    .map((item, index) => ({
      timeMs: Math.round(readNumber(item.timeMs, Math.round((index / Math.max(1, raw.length - 1)) * durationMs), 0, durationMs)),
      face: sanitizeFace(item.face) ?? { ...DEFAULT_FACE },
    }))
    .sort((a, b) => a.timeMs - b.timeMs);

  return keys.length > 0 ? keys : undefined;
}

function sanitizeLayers(raw: unknown): StoryLayerPlan[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .slice(0, 5)
    .map((layer, index) => ({
      id: readString(layer.id, `layer-${index + 1}`),
      name: readString(layer.name, `Layer ${index + 1}`),
      fill: readString(layer.fill, index === 0 ? "#a9d6ff" : "#3f7d44"),
      targetLayer: readEnum(layer.targetLayer, STORY_LAYERS, index === 0 ? "background" : index === 1 ? "normal" : "foreground"),
      parallaxFactor:
        layer.parallaxFactor === undefined ? undefined : readNumber(layer.parallaxFactor, index === 0 ? 0.2 : index === 1 ? 0.65 : 1.2, -2, 2),
      wFrac: readNumber(layer.wFrac, 1, 0.05, 1.4),
      hFrac: readNumber(layer.hFrac, index === 0 ? 1 : 0.25, 0.05, 1.2),
      xFrac: readNumber(layer.xFrac, 0, -1.2, 1.2),
      yFrac: readNumber(layer.yFrac, index === 0 ? 0 : 0.28, -1.2, 1.2),
    }));
}

function sanitizeNodes(raw: unknown, options: StorySceneOptions): StoryNodePlan[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isRecord)
    .slice(0, 10)
    .map((node, index) => {
      const transform = isRecord(node.transform) ? node.transform : {};
      return {
        id: readString(node.id, `node-${index + 1}`),
        name: readString(node.name, `Node ${index + 1}`),
        layer: readEnum(node.layer, STORY_LAYERS, "normal"),
        parallaxFactor:
          node.parallaxFactor === undefined ? undefined : readNumber(node.parallaxFactor, 0.8, -2, 2),
        shape: sanitizeShape(node.shape, options),
        face: sanitizeFace(node.face),
        limbs: sanitizeLimbs(node.limbs),
        accessories: sanitizeAccessories(node.accessories),
        transform: {
          x: readNumber(transform.x, 0, -options.canvasWidth, options.canvasWidth),
          y: readNumber(transform.y, 0, -options.canvasHeight, options.canvasHeight),
          rotation: readNumber(transform.rotation, 0, -360, 360),
          scaleX: readNumber(transform.scaleX, 1, -4, 4),
          scaleY: readNumber(transform.scaleY, 1, -4, 4),
          opacity: readNumber(transform.opacity, 1, 0, 1),
        },
        tracks: sanitizeTracks(node.tracks, Math.max(2000, options.durationMs)),
        expressionKeys: sanitizeExpressionKeys(node.expressionKeys, Math.max(2000, options.durationMs)),
      };
    });
}

export function normalizeGeneratedStoryScenePlan(
  raw: unknown,
  promptText: string,
  options: StorySceneOptions
): StoryScenePlan {
  const fallback = generateStoryScenePlan(promptText, options);
  const envelope = generatedSceneEnvelopeSchema.safeParse(raw);
  if (!envelope.success) return fallback;

  const layers = sanitizeLayers(envelope.data.layers);
  const nodes = sanitizeNodes(envelope.data.nodes, options);

  if (layers.length === 0 || nodes.length === 0) return fallback;

  return {
    id: fallback.id,
    prompt: promptText.trim(),
    summary: readString(envelope.data.summary, fallback.summary),
    layers,
    nodes,
  };
}

export function generateStoryScenePlan(promptText: string, options: StorySceneOptions): StoryScenePlan {
  const prompt = promptText.trim();
  const lower = prompt.toLowerCase();
  const theme = detectTheme(lower);
  const action = detectAction(lower);
  const mood = detectMood(lower);
  const durationMs = Math.max(2000, options.durationMs);
  const planId = `story-${hashPrompt(prompt)}`;

  const heroColor = theme === "desert" ? "#f3722c" : theme === "city-night" ? "#38bdf8" : "#4cc9f0";
  const partnerColor = theme === "forest" ? "#84cc16" : theme === "factory" ? "#ffd166" : "#f15bb5";

  const heroFace = createActorFace(mood, action === "talk");
  const partnerFace = createActorFace(action === "chase" ? "fear" : "content", action === "talk");
  const limbs = createActorLimbs();

  const hero: StoryNodePlan = {
    id: "hero",
    name: "Hero",
    layer: "normal",
    parallaxFactor: 0.85,
    shape: { shapeType: "ellipse", width: 118, height: 118, fill: heroColor },
    face: heroFace,
    limbs,
    transform: { x: -options.canvasWidth * 0.28, y: options.canvasHeight * 0.16, opacity: 1 },
  };

  const partner: StoryNodePlan = {
    id: "partner",
    name: "Buddy",
    layer: "normal",
    parallaxFactor: 0.82,
    shape: { shapeType: "rectangle", width: 106, height: 120, fill: partnerColor, cornerRadius: 14 },
    face: partnerFace,
    limbs,
    transform: { x: options.canvasWidth * 0.12, y: options.canvasHeight * 0.17, opacity: 1 },
  };

  if (action === "chase") {
    hero.tracks = {
      x: [
        { timeMs: at(durationMs, 0), value: -options.canvasWidth * 0.36, easing: EASE_OUT },
        { timeMs: at(durationMs, 0.82), value: options.canvasWidth * 0.26, easing: EASE_OUT },
      ],
      y: [
        { timeMs: at(durationMs, 0), value: options.canvasHeight * 0.18, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.2), value: options.canvasHeight * 0.14, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.4), value: options.canvasHeight * 0.19, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.6), value: options.canvasHeight * 0.14, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.82), value: options.canvasHeight * 0.18, easing: EASE_IN_OUT },
      ],
    };
    partner.tracks = {
      x: [
        { timeMs: at(durationMs, 0), value: -options.canvasWidth * 0.54, easing: EASE_OUT },
        { timeMs: at(durationMs, 0.9), value: options.canvasWidth * 0.04, easing: EASE_OUT },
      ],
      y: [
        { timeMs: at(durationMs, 0), value: options.canvasHeight * 0.2, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.3), value: options.canvasHeight * 0.16, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.6), value: options.canvasHeight * 0.2, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.9), value: options.canvasHeight * 0.17, easing: EASE_IN_OUT },
      ],
    };
    hero.expressionKeys = [
      { timeMs: at(durationMs, 0), face: createActorFace("thinking") },
      { timeMs: at(durationMs, 0.5), face: createActorFace("angry") },
      { timeMs: at(durationMs, 0.82), face: createActorFace("happy") },
    ];
  } else if (action === "fly") {
    hero.shape = { shapeType: "triangle", width: 130, height: 96, fill: heroColor };
    hero.tracks = {
      x: [
        { timeMs: at(durationMs, 0), value: -options.canvasWidth * 0.42, easing: EASE_LINEAR },
        { timeMs: at(durationMs, 1), value: options.canvasWidth * 0.42, easing: EASE_LINEAR },
      ],
      y: [
        { timeMs: at(durationMs, 0), value: options.canvasHeight * 0.22, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.35), value: -options.canvasHeight * 0.08, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.7), value: -options.canvasHeight * 0.16, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 1), value: -options.canvasHeight * 0.04, easing: EASE_IN_OUT },
      ],
      rotation: [
        { timeMs: at(durationMs, 0), value: 8, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.5), value: -6, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 1), value: 5, easing: EASE_IN_OUT },
      ],
    };
    partner.shape = { shapeType: "triangle", width: 94, height: 74, fill: partnerColor };
    partner.tracks = {
      x: [
        { timeMs: at(durationMs, 0), value: -options.canvasWidth * 0.6, easing: EASE_LINEAR },
        { timeMs: at(durationMs, 1), value: options.canvasWidth * 0.24, easing: EASE_LINEAR },
      ],
      y: [
        { timeMs: at(durationMs, 0), value: options.canvasHeight * 0.14, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.5), value: -options.canvasHeight * 0.02, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 1), value: options.canvasHeight * 0.1, easing: EASE_IN_OUT },
      ],
    };
    partner.expressionKeys = [
      { timeMs: at(durationMs, 0), face: createActorFace("thinking") },
      { timeMs: at(durationMs, 0.6), face: createActorFace("happy") },
    ];
  } else if (action === "dance") {
    hero.tracks = {
      x: [
        { timeMs: at(durationMs, 0), value: -options.canvasWidth * 0.12, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.25), value: options.canvasWidth * 0.02, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.5), value: -options.canvasWidth * 0.08, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.75), value: options.canvasWidth * 0.06, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 1), value: -options.canvasWidth * 0.1, easing: EASE_IN_OUT },
      ],
      rotation: [
        { timeMs: at(durationMs, 0), value: -8, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.25), value: 10, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.5), value: -6, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.75), value: 9, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 1), value: -4, easing: EASE_IN_OUT },
      ],
    };
    partner.tracks = {
      x: [
        { timeMs: at(durationMs, 0), value: options.canvasWidth * 0.12, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.33), value: options.canvasWidth * 0.2, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.66), value: options.canvasWidth * 0.08, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 1), value: options.canvasWidth * 0.15, easing: EASE_IN_OUT },
      ],
      y: [
        { timeMs: at(durationMs, 0), value: options.canvasHeight * 0.18, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.33), value: options.canvasHeight * 0.12, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.66), value: options.canvasHeight * 0.19, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 1), value: options.canvasHeight * 0.14, easing: EASE_IN_OUT },
      ],
    };
    hero.expressionKeys = [
      { timeMs: at(durationMs, 0), face: createActorFace("happy") },
      { timeMs: at(durationMs, 0.5), face: { ...applyPreset("joy") } },
      { timeMs: at(durationMs, 1), face: createActorFace("content") },
    ];
  } else if (action === "talk") {
    hero.transform.x = -options.canvasWidth * 0.16;
    partner.transform.x = options.canvasWidth * 0.16;
    hero.face = createActorFace(mood, true);
    partner.face = createActorFace("content", true);
    hero.tracks = {
      y: [
        { timeMs: at(durationMs, 0), value: options.canvasHeight * 0.17, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.5), value: options.canvasHeight * 0.15, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 1), value: options.canvasHeight * 0.17, easing: EASE_IN_OUT },
      ],
    };
    partner.tracks = {
      y: [
        { timeMs: at(durationMs, 0), value: options.canvasHeight * 0.17, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 0.5), value: options.canvasHeight * 0.19, easing: EASE_IN_OUT },
        { timeMs: at(durationMs, 1), value: options.canvasHeight * 0.17, easing: EASE_IN_OUT },
      ],
    };
  } else {
    hero.tracks = {
      x: [
        { timeMs: at(durationMs, 0), value: -options.canvasWidth * 0.28, easing: EASE_OUT },
        { timeMs: at(durationMs, 1), value: options.canvasWidth * 0.2, easing: EASE_OUT },
      ],
    };
    partner.tracks = {
      x: [
        { timeMs: at(durationMs, 0), value: -options.canvasWidth * 0.02, easing: EASE_OUT },
        { timeMs: at(durationMs, 1), value: options.canvasWidth * 0.3, easing: EASE_OUT },
      ],
    };
  }

  const propNode: StoryNodePlan = {
    id: "story-prop",
    name: action === "chase" ? "Finish Marker" : action === "talk" ? "Story Marker" : "Action Marker",
    layer: "foreground",
    parallaxFactor: 1.15,
    shape: {
      shapeType: "rectangle",
      width: Math.round(options.canvasWidth * 0.08),
      height: Math.round(options.canvasHeight * 0.12),
      fill: theme === "city-night" ? "#fde047" : "#f97316",
      cornerRadius: 8,
    },
    transform: {
      x: action === "chase" ? options.canvasWidth * 0.38 : options.canvasWidth * 0.3,
      y: options.canvasHeight * 0.21,
      opacity: 0.9,
    },
    tracks: action === "chase"
      ? {
          opacity: [
            { timeMs: at(durationMs, 0), value: 0.55, easing: EASE_IN_OUT },
            { timeMs: at(durationMs, 0.82), value: 1, easing: EASE_IN_OUT },
          ],
        }
      : undefined,
  };

  const summary =
    action === "chase"
      ? "Generated chase beat: Hero sprints while Buddy follows toward the marker."
      : action === "fly"
        ? "Generated flying beat: Hero glides across the frame with a wingmate."
        : action === "dance"
          ? "Generated dance beat: Two characters move with rhythmic motion."
          : action === "talk"
            ? "Generated conversation beat: Two characters face each other with talk animation."
            : "Generated walk beat: Characters move through a short action moment.";

  return {
    id: planId,
    prompt,
    summary,
    layers: buildThemeLayers(theme),
    nodes: [hero, partner, propNode],
  };
}
