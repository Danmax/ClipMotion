/** Top-level scene document stored as Scene.data JSONB in the database */
export interface SceneDocument {
  version: 1;
  rootNodeId: string;
  nodes: Record<string, SceneNode>;
  animations: Record<string, NodeAnimation>;
}

export interface TimelineClip {
  id: string;
  sceneId: string;
  startMs: number;
  durationMs: number;
  trimInMs: number;
  trackIndex: number;
}

export interface TimelineComposition {
  version: 1;
  clips: TimelineClip[];
}

export const EMPTY_TIMELINE_COMPOSITION: TimelineComposition = {
  version: 1,
  clips: [],
};

/** A single node in the scene graph */
export interface SceneNode {
  id: string;
  name: string;
  type: NodeType;
  parentId: string | null;
  childIds: string[];
  visible: boolean;
  locked: boolean;
  showLabel: boolean;
  layer: "background" | "normal" | "foreground";
  transform: Transform;
  assetId?: string;
  pivot: { x: number; y: number };
  boneId?: string;
  /** Optional parallax strength (-2..2). 0 = static, positive = drifts with depth. */
  parallaxFactor?: number;
  /** Shape-specific properties */
  shape?: ShapeProps;
  /** Text-specific properties */
  text?: TextProps;
  /** Face overlay (eyes + mouth) */
  face?: FaceProps;
  /** Expression/face keyframes sampled over time */
  faceKeyframes?: FaceKeyframe[];
  /** Limbs (arms + legs) */
  limbs?: LimbProps;
}

export interface FaceKeyframe {
  id: string;
  timeMs: number;
  face: FaceProps;
}

export type NodeType = "container" | "sprite" | "shape" | "text" | "bone";

export type ShapeType = "rectangle" | "ellipse" | "triangle" | "star" | "polygon" | "stickfigure";

export interface ShapeProps {
  shapeType: ShapeType;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  /** Number of points for star, sides for polygon */
  points?: number;
}

export interface TextProps {
  content: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontWeight?: "normal" | "bold";
  textAlign?: "left" | "center" | "right";
}

export type EyeStyle = "dot" | "circle" | "oval" | "angry" | "closed" | "wink" | "wide";
export type MouthStyle = "smile" | "frown" | "open" | "line" | "o" | "teeth" | "wavy" | "small-smile";
export type EyebrowStyle = "none" | "line" | "arc" | "angry" | "sad";
export type MouthEffect = "none" | "talk";
export type ExpressionPreset =
  | "neutral"
  | "happy"
  | "smiles"
  | "joy"
  | "sad"
  | "fear"
  | "angry"
  | "thinking"
  | "worry"
  | "worried"
  | "releive"
  | "content"
  | "bored"
  | "meh"
  | "tongueOut"
  | "sleeping"
  | "tired"
  | "kiss"
  | "flirt"
  | "surprised"
  | "smug"
  | "scared"
  | "dead";

export interface FaceProps {
  expression: ExpressionPreset;
  eyeStyle: EyeStyle;
  eyeSize: number;
  eyeSpacing: number;
  eyeOffsetY: number;
  eyeColor: string;
  pupilSize: number;
  mouthStyle: MouthStyle;
  mouthSize: number;
  mouthOffsetY: number;
  mouthColor: string;
  mouthCurve: number;
  mouthEffect: MouthEffect;
  mouthTalkSpeed: number;
  mouthTalkAmount: number;
  eyebrowStyle: EyebrowStyle;
  eyebrowColor: string;
  eyebrowThickness: number;
  eyebrowOffsetY: number;
  eyebrowTilt: number;
  faceScale: number;
}

export type LimbStyle = "straight" | "bent" | "none";

export interface LimbProps {
  armStyle: LimbStyle;
  legStyle: LimbStyle;
  limbColor: string;
  limbThickness: number;  // 1-5
  armLength: number;      // 0.3-1.5 multiplier
  legLength: number;      // 0.3-1.5 multiplier
  armSpread: number;      // 0-1 how far apart arms spread
  legSpread: number;      // 0-1 how far apart legs spread
  feet: boolean;          // draw small feet at end of legs
}

export const DEFAULT_LIMBS: LimbProps = {
  armStyle: "bent",
  legStyle: "straight",
  limbColor: "#000000",
  limbThickness: 3,
  armLength: 0.8,
  legLength: 0.9,
  armSpread: 0.5,
  legSpread: 0.3,
  feet: true,
};

export const DEFAULT_FACE: FaceProps = {
  expression: "neutral",
  eyeStyle: "dot",
  eyeSize: 1.0,
  eyeSpacing: 1.0,
  eyeOffsetY: -0.1,
  eyeColor: "#000000",
  pupilSize: 0.5,
  mouthStyle: "line",
  mouthSize: 1.0,
  mouthOffsetY: 0.15,
  mouthColor: "#000000",
  mouthCurve: 0,
  mouthEffect: "none",
  mouthTalkSpeed: 6,
  mouthTalkAmount: 0.4,
  eyebrowStyle: "none",
  eyebrowColor: "#000000",
  eyebrowThickness: 2,
  eyebrowOffsetY: -0.22,
  eyebrowTilt: 0,
  faceScale: 1.0,
};

export interface Transform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
}

/** All animations for a single node */
export interface NodeAnimation {
  nodeId: string;
  tracks: Partial<Record<AnimatableProperty, KeyframeTrack>>;
}

export type AnimatableProperty =
  | "x"
  | "y"
  | "rotation"
  | "scaleX"
  | "scaleY"
  | "opacity"
  | "parallaxFactor";

export const ANIMATABLE_PROPERTIES: AnimatableProperty[] = [
  "x",
  "y",
  "rotation",
  "scaleX",
  "scaleY",
  "opacity",
  "parallaxFactor",
];

export const TRANSFORM_ANIMATABLE_PROPERTIES: Exclude<AnimatableProperty, "parallaxFactor">[] = [
  "x",
  "y",
  "rotation",
  "scaleX",
  "scaleY",
  "opacity",
];

/** A track is a sorted array of keyframes for one property */
export interface KeyframeTrack {
  keyframes: Keyframe[];
}

export interface Keyframe {
  id: string;
  timeMs: number;
  value: number;
  easing: EasingDefinition;
}

export interface EasingDefinition {
  type: "linear" | "step" | "cubicBezier";
  /** Only used when type === 'cubicBezier': [x1, y1, x2, y2] */
  controlPoints?: [number, number, number, number];
}

/** Bone definition for rigging */
export interface BoneDefinition {
  id: string;
  name: string;
  parentBoneId: string | null;
  headX: number;
  headY: number;
  tailX: number;
  tailY: number;
  length: number;
  rotation: number;
  constraints?: RotationConstraint;
}

export interface RotationConstraint {
  minDegrees: number;
  maxDegrees: number;
}

/** Default transform (identity) */
export const DEFAULT_TRANSFORM: Transform = {
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1,
};

/** Default easing */
export const DEFAULT_EASING: EasingDefinition = { type: "linear" };
