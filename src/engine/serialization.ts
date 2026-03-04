import { z } from "zod";
import type { SceneDocument } from "./types";
import { createSceneDocument } from "./scene-graph";

// ─── Zod Schema for Validation ───────────────────────────────

const easingSchema = z.object({
  type: z.enum(["linear", "step", "cubicBezier"]),
  controlPoints: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
});

const keyframeSchema = z.object({
  id: z.string(),
  timeMs: z.number().min(0),
  value: z.number(),
  easing: easingSchema,
});

const keyframeTrackSchema = z.object({
  keyframes: z.array(keyframeSchema),
});

const nodeAnimationSchema = z.object({
  nodeId: z.string(),
  tracks: z.record(z.string(), keyframeTrackSchema).default({}),
});

const transformSchema = z.object({
  x: z.number(),
  y: z.number(),
  rotation: z.number(),
  scaleX: z.number(),
  scaleY: z.number(),
  opacity: z.number().min(0).max(1),
});

const shapePropsSchema = z.object({
  shapeType: z.enum(["rectangle", "ellipse", "triangle", "star", "polygon", "stickfigure"]),
  width: z.number(),
  height: z.number(),
  fill: z.string(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  cornerRadius: z.number().optional(),
  points: z.number().optional(),
});

const textPropsSchema = z.object({
  content: z.string(),
  fontSize: z.number(),
  fontFamily: z.string(),
  fill: z.string(),
  fontWeight: z.enum(["normal", "bold"]).optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
});

const facePropsSchema = z.object({
  expression: z.enum([
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
  ]),
  eyeStyle: z.enum(["dot", "circle", "oval", "angry", "closed", "wink", "wide"]),
  eyeSize: z.number(),
  eyeSpacing: z.number(),
  eyeOffsetY: z.number(),
  eyeColor: z.string(),
  pupilSize: z.number(),
  mouthStyle: z.enum(["smile", "frown", "open", "line", "o", "teeth", "wavy", "small-smile"]),
  mouthSize: z.number(),
  mouthOffsetY: z.number(),
  mouthColor: z.string(),
  mouthCurve: z.number(),
  mouthEffect: z.enum(["none", "talk"]).default("none"),
  mouthTalkSpeed: z.number().default(6),
  mouthTalkAmount: z.number().default(0.4),
  eyebrowStyle: z.enum(["none", "line", "arc", "angry", "sad"]).default("none"),
  eyebrowColor: z.string().default("#000000"),
  eyebrowThickness: z.number().default(2),
  eyebrowOffsetY: z.number().default(-0.22),
  eyebrowTilt: z.number().default(0),
  faceScale: z.number(),
});

const sceneNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["container", "sprite", "shape", "text", "bone"]),
  parentId: z.string().nullable(),
  childIds: z.array(z.string()),
  visible: z.boolean(),
  locked: z.boolean(),
  showLabel: z.boolean().default(true),
  layer: z.enum(["background", "normal", "foreground"]).default("normal"),
  transform: transformSchema,
  assetId: z.string().optional(),
  pivot: z.object({ x: z.number(), y: z.number() }),
  boneId: z.string().optional(),
  shape: shapePropsSchema.optional(),
  text: textPropsSchema.optional(),
  face: facePropsSchema.optional(),
});

const sceneDocumentSchema = z.object({
  version: z.literal(1),
  rootNodeId: z.string(),
  nodes: z.record(z.string(), sceneNodeSchema),
  animations: z.record(z.string(), nodeAnimationSchema).default({}),
});

// ─── Serialization Functions ─────────────────────────────────

/**
 * Serialize a SceneDocument to a JSON-compatible object.
 * (Ready to be stored as JSONB in PostgreSQL)
 */
export function serializeScene(doc: SceneDocument): Record<string, unknown> {
  return JSON.parse(JSON.stringify(doc));
}

/**
 * Deserialize and validate a JSON object into a SceneDocument.
 * Throws if validation fails.
 */
export function deserializeScene(data: unknown): SceneDocument {
  return sceneDocumentSchema.parse(data) as SceneDocument;
}

/**
 * Safely attempt to deserialize. Returns null on failure.
 */
export function tryDeserializeScene(data: unknown): SceneDocument | null {
  const result = sceneDocumentSchema.safeParse(data);
  return result.success ? (result.data as SceneDocument) : null;
}

/**
 * Create an empty scene suitable for storing as the initial Scene.data.
 */
export function createEmptyScene(): Record<string, unknown> {
  return serializeScene(createSceneDocument());
}

/**
 * Validate scene data without parsing. Returns validation errors if any.
 */
export function validateSceneData(
  data: unknown
): { valid: true } | { valid: false; errors: z.ZodError } {
  const result = sceneDocumentSchema.safeParse(data);
  if (result.success) return { valid: true };
  return { valid: false, errors: result.error };
}
