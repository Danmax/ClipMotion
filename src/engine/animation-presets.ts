import type {
  SceneDocument,
  AnimatableProperty,
  EasingDefinition,
  Transform,
} from "./types";
import { EASING_PRESETS } from "./easing";
import { setKeyframe } from "./keyframe-engine";

// ─── Types ───────────────────────────────────────────────────

export type AnimationPresetId =
  | "bounce"
  | "slideInLeft"
  | "slideInRight"
  | "slideInTop"
  | "slideInBottom"
  | "slideOutLeft"
  | "slideOutRight"
  | "slideOutTop"
  | "slideOutBottom"
  | "wave"
  | "spin"
  | "pulse"
  | "shake"
  | "fadeIn"
  | "fadeOut"
  | "popIn"
  | "float";

export interface PresetAnimationOptions {
  delayMs?: number;
  durationMs?: number;
  easing?: EasingDefinition;
  replaceExisting?: boolean;
}

export interface PresetKeyframeSpec {
  timeFraction: number;
  value: number;
  easing?: EasingDefinition;
}

export interface PresetTrackSpec {
  property: AnimatableProperty;
  mode: "absolute" | "relative";
  keyframes: PresetKeyframeSpec[];
}

export interface PresetContext {
  nodeTransform: Transform;
  canvasWidth: number;
  canvasHeight: number;
}

export interface PresetAnimationDefinition {
  id: AnimationPresetId;
  name: string;
  description: string;
  category: "entrance" | "exit" | "emphasis" | "motion";
  defaultDurationMs: number;
  defaultEasing: EasingDefinition;
  tracks: PresetTrackSpec[];
  dynamicTracks?: (ctx: PresetContext) => PresetTrackSpec[];
}

// ─── Preset Catalog ──────────────────────────────────────────

export const ANIMATION_PRESETS: Record<AnimationPresetId, PresetAnimationDefinition> = {
  // ── Entrance ───────────────────────────────────────────────

  fadeIn: {
    id: "fadeIn",
    name: "Fade In",
    description: "Fades from transparent to visible",
    category: "entrance",
    defaultDurationMs: 500,
    defaultEasing: EASING_PRESETS.easeOut,
    tracks: [
      {
        property: "opacity",
        mode: "absolute",
        keyframes: [
          { timeFraction: 0, value: 0 },
          { timeFraction: 1, value: 1 },
        ],
      },
    ],
  },

  slideInLeft: {
    id: "slideInLeft",
    name: "Slide In Left",
    description: "Slides in from the left",
    category: "entrance",
    defaultDurationMs: 800,
    defaultEasing: EASING_PRESETS.easeOutCubic,
    tracks: [],
    dynamicTracks: (ctx) => [
      {
        property: "x",
        mode: "absolute",
        keyframes: [
          { timeFraction: 0, value: -ctx.canvasWidth / 2 - 100 },
          { timeFraction: 1, value: ctx.nodeTransform.x },
        ],
      },
    ],
  },

  slideInRight: {
    id: "slideInRight",
    name: "Slide In Right",
    description: "Slides in from the right",
    category: "entrance",
    defaultDurationMs: 800,
    defaultEasing: EASING_PRESETS.easeOutCubic,
    tracks: [],
    dynamicTracks: (ctx) => [
      {
        property: "x",
        mode: "absolute",
        keyframes: [
          { timeFraction: 0, value: ctx.canvasWidth / 2 + 100 },
          { timeFraction: 1, value: ctx.nodeTransform.x },
        ],
      },
    ],
  },

  slideInTop: {
    id: "slideInTop",
    name: "Slide In Top",
    description: "Slides in from the top",
    category: "entrance",
    defaultDurationMs: 800,
    defaultEasing: EASING_PRESETS.easeOutCubic,
    tracks: [],
    dynamicTracks: (ctx) => [
      {
        property: "y",
        mode: "absolute",
        keyframes: [
          { timeFraction: 0, value: -ctx.canvasHeight / 2 - 100 },
          { timeFraction: 1, value: ctx.nodeTransform.y },
        ],
      },
    ],
  },

  slideInBottom: {
    id: "slideInBottom",
    name: "Slide In Bottom",
    description: "Slides in from the bottom",
    category: "entrance",
    defaultDurationMs: 800,
    defaultEasing: EASING_PRESETS.easeOutCubic,
    tracks: [],
    dynamicTracks: (ctx) => [
      {
        property: "y",
        mode: "absolute",
        keyframes: [
          { timeFraction: 0, value: ctx.canvasHeight / 2 + 100 },
          { timeFraction: 1, value: ctx.nodeTransform.y },
        ],
      },
    ],
  },

  popIn: {
    id: "popIn",
    name: "Pop In",
    description: "Scales up from zero with overshoot",
    category: "entrance",
    defaultDurationMs: 600,
    defaultEasing: EASING_PRESETS.easeOutBack,
    tracks: [
      {
        property: "scaleX",
        mode: "absolute",
        keyframes: [
          { timeFraction: 0, value: 0 },
          { timeFraction: 1, value: 1 },
        ],
      },
      {
        property: "scaleY",
        mode: "absolute",
        keyframes: [
          { timeFraction: 0, value: 0 },
          { timeFraction: 1, value: 1 },
        ],
      },
      {
        property: "opacity",
        mode: "absolute",
        keyframes: [
          { timeFraction: 0, value: 0 },
          { timeFraction: 0.3, value: 1 },
          { timeFraction: 1, value: 1 },
        ],
      },
    ],
  },

  // ── Exit ───────────────────────────────────────────────────

  fadeOut: {
    id: "fadeOut",
    name: "Fade Out",
    description: "Fades from visible to transparent",
    category: "exit",
    defaultDurationMs: 500,
    defaultEasing: EASING_PRESETS.easeIn,
    tracks: [
      {
        property: "opacity",
        mode: "absolute",
        keyframes: [
          { timeFraction: 0, value: 1 },
          { timeFraction: 1, value: 0 },
        ],
      },
    ],
  },

  slideOutLeft: {
    id: "slideOutLeft",
    name: "Slide Out Left",
    description: "Slides out to the left",
    category: "exit",
    defaultDurationMs: 800,
    defaultEasing: EASING_PRESETS.easeInCubic,
    tracks: [],
    dynamicTracks: (ctx) => [
      {
        property: "x",
        mode: "absolute",
        keyframes: [
          { timeFraction: 0, value: ctx.nodeTransform.x },
          { timeFraction: 1, value: -ctx.canvasWidth / 2 - 100 },
        ],
      },
    ],
  },

  slideOutRight: {
    id: "slideOutRight",
    name: "Slide Out Right",
    description: "Slides out to the right",
    category: "exit",
    defaultDurationMs: 800,
    defaultEasing: EASING_PRESETS.easeInCubic,
    tracks: [],
    dynamicTracks: (ctx) => [
      {
        property: "x",
        mode: "absolute",
        keyframes: [
          { timeFraction: 0, value: ctx.nodeTransform.x },
          { timeFraction: 1, value: ctx.canvasWidth / 2 + 100 },
        ],
      },
    ],
  },

  slideOutTop: {
    id: "slideOutTop",
    name: "Slide Out Top",
    description: "Slides out to the top",
    category: "exit",
    defaultDurationMs: 800,
    defaultEasing: EASING_PRESETS.easeInCubic,
    tracks: [],
    dynamicTracks: (ctx) => [
      {
        property: "y",
        mode: "absolute",
        keyframes: [
          { timeFraction: 0, value: ctx.nodeTransform.y },
          { timeFraction: 1, value: -ctx.canvasHeight / 2 - 100 },
        ],
      },
    ],
  },

  slideOutBottom: {
    id: "slideOutBottom",
    name: "Slide Out Bottom",
    description: "Slides out to the bottom",
    category: "exit",
    defaultDurationMs: 800,
    defaultEasing: EASING_PRESETS.easeInCubic,
    tracks: [],
    dynamicTracks: (ctx) => [
      {
        property: "y",
        mode: "absolute",
        keyframes: [
          { timeFraction: 0, value: ctx.nodeTransform.y },
          { timeFraction: 1, value: ctx.canvasHeight / 2 + 100 },
        ],
      },
    ],
  },

  // ── Emphasis ───────────────────────────────────────────────

  bounce: {
    id: "bounce",
    name: "Bounce",
    description: "Bounces up and down",
    category: "emphasis",
    defaultDurationMs: 1000,
    defaultEasing: EASING_PRESETS.easeOutQuad,
    tracks: [
      {
        property: "y",
        mode: "relative",
        keyframes: [
          { timeFraction: 0, value: 0 },
          { timeFraction: 0.2, value: -60, easing: EASING_PRESETS.easeOut },
          { timeFraction: 0.4, value: 0, easing: EASING_PRESETS.easeIn },
          { timeFraction: 0.6, value: -25, easing: EASING_PRESETS.easeOut },
          { timeFraction: 0.8, value: 0, easing: EASING_PRESETS.easeIn },
          { timeFraction: 1, value: 0 },
        ],
      },
    ],
  },

  pulse: {
    id: "pulse",
    name: "Pulse",
    description: "Scales up and down rhythmically",
    category: "emphasis",
    defaultDurationMs: 800,
    defaultEasing: EASING_PRESETS.easeInOut,
    tracks: [
      {
        property: "scaleX",
        mode: "relative",
        keyframes: [
          { timeFraction: 0, value: 0 },
          { timeFraction: 0.5, value: 0.2 },
          { timeFraction: 1, value: 0 },
        ],
      },
      {
        property: "scaleY",
        mode: "relative",
        keyframes: [
          { timeFraction: 0, value: 0 },
          { timeFraction: 0.5, value: 0.2 },
          { timeFraction: 1, value: 0 },
        ],
      },
    ],
  },

  shake: {
    id: "shake",
    name: "Shake",
    description: "Rapid small movements",
    category: "emphasis",
    defaultDurationMs: 600,
    defaultEasing: EASING_PRESETS.linear,
    tracks: [
      {
        property: "x",
        mode: "relative",
        keyframes: [
          { timeFraction: 0, value: 0 },
          { timeFraction: 0.1, value: -10 },
          { timeFraction: 0.2, value: 10 },
          { timeFraction: 0.3, value: -8 },
          { timeFraction: 0.4, value: 8 },
          { timeFraction: 0.5, value: -5 },
          { timeFraction: 0.6, value: 5 },
          { timeFraction: 0.7, value: -3 },
          { timeFraction: 0.8, value: 3 },
          { timeFraction: 0.9, value: -1 },
          { timeFraction: 1, value: 0 },
        ],
      },
    ],
  },

  wave: {
    id: "wave",
    name: "Wave",
    description: "Rocks side to side",
    category: "emphasis",
    defaultDurationMs: 1200,
    defaultEasing: EASING_PRESETS.easeInOut,
    tracks: [
      {
        property: "rotation",
        mode: "relative",
        keyframes: [
          { timeFraction: 0, value: 0 },
          { timeFraction: 0.15, value: -15 },
          { timeFraction: 0.35, value: 15 },
          { timeFraction: 0.55, value: -10 },
          { timeFraction: 0.75, value: 10 },
          { timeFraction: 1, value: 0 },
        ],
      },
    ],
  },

  spin: {
    id: "spin",
    name: "Spin",
    description: "Rotates 360 degrees",
    category: "emphasis",
    defaultDurationMs: 1000,
    defaultEasing: EASING_PRESETS.easeInOut,
    tracks: [
      {
        property: "rotation",
        mode: "relative",
        keyframes: [
          { timeFraction: 0, value: 0 },
          { timeFraction: 1, value: 360 },
        ],
      },
    ],
  },

  // ── Motion ─────────────────────────────────────────────────

  float: {
    id: "float",
    name: "Float",
    description: "Gentle up-and-down floating",
    category: "motion",
    defaultDurationMs: 2000,
    defaultEasing: EASING_PRESETS.easeInOut,
    tracks: [
      {
        property: "y",
        mode: "relative",
        keyframes: [
          { timeFraction: 0, value: 0 },
          { timeFraction: 0.25, value: -15 },
          { timeFraction: 0.5, value: 0 },
          { timeFraction: 0.75, value: 15 },
          { timeFraction: 1, value: 0 },
        ],
      },
    ],
  },
};

// ─── Core Functions ──────────────────────────────────────────

/**
 * Apply a preset animation to a node. Generates keyframes into the document's
 * existing animation system so sampleScene() still works.
 */
export function applyPresetAnimation(
  doc: SceneDocument,
  nodeId: string,
  presetId: AnimationPresetId,
  options: PresetAnimationOptions = {},
  context?: PresetContext
): SceneDocument {
  const preset = ANIMATION_PRESETS[presetId];
  if (!preset) throw new Error(`Unknown animation preset: ${presetId}`);

  const node = doc.nodes[nodeId];
  if (!node) throw new Error(`Node ${nodeId} not found`);

  const delayMs = options.delayMs ?? 0;
  const durationMs = options.durationMs ?? preset.defaultDurationMs;
  const replaceExisting = options.replaceExisting ?? true;

  const ctx: PresetContext = context ?? {
    nodeTransform: { ...node.transform },
    canvasWidth: 1920,
    canvasHeight: 1080,
  };

  // Resolve tracks (static or dynamic)
  const trackSpecs = preset.dynamicTracks
    ? preset.dynamicTracks(ctx)
    : preset.tracks;

  let newDoc = doc;

  // Clear affected tracks first if replacing
  if (replaceExisting) {
    newDoc = clearTracksForProperties(
      newDoc,
      nodeId,
      trackSpecs.map((t) => t.property)
    );
  }

  // Generate keyframes for each track
  for (const trackSpec of trackSpecs) {
    const defaultEasing = options.easing ?? preset.defaultEasing;

    for (const kfSpec of trackSpec.keyframes) {
      const timeMs = Math.round(delayMs + kfSpec.timeFraction * durationMs);

      let value: number;
      if (trackSpec.mode === "relative") {
        value = node.transform[trackSpec.property] + kfSpec.value;
      } else {
        value = kfSpec.value;
      }

      const easing = kfSpec.easing ?? defaultEasing;
      newDoc = setKeyframe(newDoc, nodeId, trackSpec.property, timeMs, value, easing);
    }
  }

  return newDoc;
}

/**
 * Remove all keyframes for the specified properties on a node.
 */
function clearTracksForProperties(
  doc: SceneDocument,
  nodeId: string,
  properties: AnimatableProperty[]
): SceneDocument {
  const anim = doc.animations[nodeId];
  if (!anim) return doc;

  const newTracks = { ...anim.tracks };
  for (const prop of properties) {
    delete newTracks[prop];
  }

  const newAnimations = { ...doc.animations };
  if (Object.keys(newTracks).length === 0) {
    delete newAnimations[nodeId];
  } else {
    newAnimations[nodeId] = { ...anim, tracks: newTracks };
  }

  return { ...doc, animations: newAnimations };
}

/**
 * Remove all animations for a node.
 */
export function clearNodeAnimations(
  doc: SceneDocument,
  nodeId: string
): SceneDocument {
  const anim = doc.animations[nodeId];
  if (!anim) return doc;

  const newAnimations = { ...doc.animations };
  delete newAnimations[nodeId];
  return { ...doc, animations: newAnimations };
}

/**
 * Get preset definitions grouped by category.
 */
export function getPresetsByCategory(): Record<string, PresetAnimationDefinition[]> {
  const grouped: Record<string, PresetAnimationDefinition[]> = {
    entrance: [],
    exit: [],
    emphasis: [],
    motion: [],
  };

  for (const preset of Object.values(ANIMATION_PRESETS)) {
    grouped[preset.category].push(preset);
  }

  return grouped;
}
