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
  x: z.number().catch(0),
  y: z.number().catch(0),
  rotation: z.number().catch(0),
  scaleX: z.number().catch(1),
  scaleY: z.number().catch(1),
  opacity: z.number().catch(1),
});

const shapePropsSchema = z.object({
  shapeType: z.enum([
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
  ]).catch("rectangle"),
  width: z.number().catch(100),
  height: z.number().catch(100),
  fill: z.string().catch("#58a6ff"),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  cornerRadius: z.number().optional(),
  pattern: z.enum(["none", "stripes", "dots", "checker", "crosshatch", "zigzag"]).optional(),
  patternColor: z.string().optional(),
  patternScale: z.number().optional(),
  points: z.number().optional(),
  customPath: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
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
  ]).catch("neutral"),
  eyeStyle: z.enum([
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
  ]).catch("dot"),
  eyeSize: z.number().catch(1.0),
  eyeSpacing: z.number().catch(1.0),
  eyeOffsetY: z.number().catch(-0.1),
  eyeColor: z.string().catch("#000000"),
  pupilSize: z.number().catch(0.5),
  mouthStyle: z.enum([
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
  ]).catch("line"),
  mouthSize: z.number().catch(1.0),
  mouthOffsetY: z.number().catch(0.15),
  mouthColor: z.string().catch("#000000"),
  mouthCurve: z.number().catch(0),
  mouthEffect: z.enum(["none", "talk"]).default("none"),
  mouthTalkSpeed: z.number().default(6),
  mouthTalkAmount: z.number().default(0.4),
  eyebrowStyle: z.enum(["none", "line", "arc", "angry", "sad"]).default("none"),
  eyebrowColor: z.string().default("#000000"),
  eyebrowThickness: z.number().default(2),
  eyebrowOffsetY: z.number().default(-0.22),
  eyebrowTilt: z.number().default(0),
  faceScale: z.number().catch(1.0),
});

const faceKeyframeSchema = z.object({
  id: z.string(),
  timeMs: z.number().min(0),
  face: facePropsSchema,
});

const limbPropsSchema = z.object({
  armStyle: z.enum(["straight", "bent", "none"]).catch("bent"),
  legStyle: z.enum(["straight", "bent", "none"]).catch("straight"),
  limbColor: z.string().catch("#000000"),
  limbThickness: z.number().catch(3),
  armLength: z.number().catch(0.8),
  legLength: z.number().catch(0.9),
  armSpread: z.number().catch(0.5),
  armRotationDeg: z.number().default(0),
  legSpread: z.number().catch(0.3),
  feet: z.boolean().catch(true),
  shoeStyle: z.enum(["kicks", "dress", "boots", "slides", "cool"]).default("kicks"),
  shoeColor: z.string().default("#111111"),
  shoeSoleColor: z.string().default("#f2f4f7"),
  shoeAccessory: z.enum(["none", "laces", "stripe", "buckle", "charm", "wings"]).default("none"),
  shoeAccessoryColor: z.string().default("#ffffff"),
  handStyle: z.preprocess(
    (value) => {
      if (value === "yes") return "thumbs-up";
      if (value === "no") return "thumbs-down";
      return value;
    },
    z
      .enum([
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
      ])
      .default("cartoon")
  ),
  handColor: z.string().default("#f4c29b"),
});

const accessoryPropsSchema = z.object({
  id: z.string(),
  type: z.enum(["hat", "glasses", "prop", "other"]),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  scale: z.number(),
  rotation: z.number(),
  color: z.string().optional(),
  accentColor: z.string().optional(),
  detailColor: z.string().optional(),
});

const sceneNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["container", "sprite", "shape", "text", "bone"]),
  parentId: z.string().nullable(),
  childIds: z.array(z.string()),
  visible: z.boolean(),
  locked: z.boolean(),
  showLabel: z.boolean().default(false),
  layer: z.enum(["background", "normal", "foreground"]).default("normal"),
  transform: transformSchema,
  assetId: z.string().optional(),
  parallaxFactor: z.number().optional(),
  pivot: z.object({ x: z.number(), y: z.number() }),
  boneId: z.string().optional(),
  shape: shapePropsSchema.optional(),
  text: textPropsSchema.optional(),
  face: facePropsSchema.optional(),
  faceKeyframes: z.array(faceKeyframeSchema).optional(),
  limbs: limbPropsSchema.optional(),
  accessories: z.array(accessoryPropsSchema).optional(),
});

const sceneDocumentSchema = z.object({
  version: z.number().optional().default(1),
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
  if (result.success) return result.data as SceneDocument;
  if (process.env.NODE_ENV !== "production") {
    console.error(
      "[serialization] Scene deserialization failed. Zod errors:",
      result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    );
  }
  return null;
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
