import { applyPreset } from "@/engine/face-presets";
import {
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
