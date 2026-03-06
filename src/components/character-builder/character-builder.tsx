"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Application, Container } from "pixi.js";
import { useRouter } from "next/navigation";
import { drawCharacter } from "@/lib/draw-character";
import { applyPreset, EXPRESSION_PRESETS } from "@/engine/face-presets";
import { DEFAULT_FACE, DEFAULT_LIMBS } from "@/engine/types";
import type {
  ShapeProps,
  ShapePattern,
  FaceProps,
  LimbProps,
  AccessoryProps,
  ShapeType,
  ExpressionPreset,
  EyeStyle,
  MouthStyle,
  MouthEffect,
  EyebrowStyle,
  LimbStyle,
  HandStyle,
  ShoeAccessoryStyle,
  ShoeStyle,
} from "@/engine/types";
import {
  Circle,
  Square,
  Triangle,
  Star,
  Hexagon,
  Diamond,
  Save,
  ArrowLeft,
  Shuffle,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";

const SHAPE_OPTIONS: { type: ShapeType; icon: React.ElementType; label: string }[] = [
  { type: "rectangle", icon: Square, label: "Square" },
  { type: "ellipse", icon: Circle, label: "Circle" },
  { type: "capsule", icon: Circle, label: "Capsule" },
  { type: "triangle", icon: Triangle, label: "Triangle" },
  { type: "trapezoid", icon: Square, label: "Trapezoid" },
  { type: "parallelogram", icon: Square, label: "Parallelogram" },
  { type: "diamond", icon: Diamond, label: "Diamond" },
  { type: "star", icon: Star, label: "Star" },
  { type: "polygon", icon: Hexagon, label: "Hexagon" },
  { type: "blob", icon: Circle, label: "Blob" },
  { type: "asymmetric-blob", icon: Circle, label: "Asym Blob" },
];

const PRESET_COLORS = [
  "#ff4444", "#ff8844", "#ffcc00", "#44cc44", "#44aaff", "#8844ff",
  "#ff44aa", "#00cccc", "#ffffff", "#aaaaaa", "#8B4513", "#222222",
  "#ccff00", "#00cc33", "#ff69b4", "#87ceeb",
];

const PATTERN_OPTIONS: { value: ShapePattern; label: string }[] = [
  { value: "none", label: "None" },
  { value: "stripes", label: "Stripes" },
  { value: "dots", label: "Dots" },
  { value: "checker", label: "Checker" },
  { value: "crosshatch", label: "Crosshatch" },
  { value: "zigzag", label: "Zigzag" },
];

const EYE_STYLES: { style: EyeStyle; label: string }[] = [
  { style: "dot", label: "Dot" },
  { style: "circle", label: "Circle" },
  { style: "oval", label: "Oval" },
  { style: "angry", label: "Angry" },
  { style: "closed", label: "Closed" },
  { style: "wink", label: "Wink" },
  { style: "wide", label: "Wide" },
  { style: "sleepy", label: "Sleepy" },
  { style: "sparkle", label: "Sparkle" },
  { style: "heart", label: "Heart" },
  { style: "cross", label: "Cross" },
  { style: "laughing", label: "Laughing" },
  { style: "attentive", label: "Attentive" },
  { style: "roll-eyes", label: "Roll Eyes" },
  { style: "google-eyes", label: "Google Eyes" },
  { style: "intense", label: "Intense" },
  { style: "puppy-eyes", label: "Puppy Eyes" },
  { style: "money", label: "Money" },
  { style: "slanted", label: "Slanted" },
  { style: "side-eye", label: "Side Eye" },
  { style: "tiny", label: "Tiny" },
  { style: "half-lidded", label: "Half Lidded" },
];

const MOUTH_STYLES: { style: MouthStyle; label: string }[] = [
  { style: "line", label: "Line" },
  { style: "smile", label: "Smile" },
  { style: "frown", label: "Frown" },
  { style: "open", label: "Open" },
  { style: "o", label: "O" },
  { style: "teeth", label: "Teeth" },
  { style: "toothy-grin", label: "Grin" },
  { style: "wavy", label: "Wavy" },
  { style: "small-smile", label: "Smirk" },
  { style: "tongue", label: "Tongue" },
  { style: "tongue-smile", label: "Tongue Smile" },
  { style: "fangs", label: "Fangs" },
  { style: "grin", label: "Grin+" },
  { style: "smirk-open", label: "Smirk Open" },
  { style: "shout", label: "Shout" },
  { style: "grimace", label: "Grimace" },
];

const MOUTH_EFFECTS: { effect: MouthEffect; label: string }[] = [
  { effect: "none", label: "Static" },
  { effect: "talk", label: "Talk" },
];

const EYEBROW_STYLES: { style: EyebrowStyle; label: string }[] = [
  { style: "none", label: "None" },
  { style: "line", label: "Line" },
  { style: "arc", label: "Arc" },
  { style: "angry", label: "Angry" },
  { style: "sad", label: "Sad" },
];

const LIMB_STYLES: { style: LimbStyle; label: string }[] = [
  { style: "none", label: "None" },
  { style: "straight", label: "Straight" },
  { style: "bent", label: "Bent" },
];

const SHOE_STYLES: { style: ShoeStyle; label: string }[] = [
  { style: "kicks", label: "Kicks" },
  { style: "dress", label: "Dress Shoes" },
  { style: "boots", label: "Boots" },
  { style: "slides", label: "Slides" },
  { style: "cool", label: "Cool" },
];

const SHOE_ACCESSORY_STYLES: { style: ShoeAccessoryStyle; label: string }[] = [
  { style: "none", label: "None" },
  { style: "laces", label: "Laces" },
  { style: "stripe", label: "Stripe" },
  { style: "buckle", label: "Buckle" },
  { style: "charm", label: "Charm" },
  { style: "wings", label: "Wings" },
];

const HAND_STYLES: { style: HandStyle; label: string }[] = [
  { style: "thumbs-up", label: "Thumbs Up" },
  { style: "thumbs-down", label: "Thumbs Down" },
  { style: "peace", label: "Peace" },
  { style: "number-1", label: "Number 1" },
  { style: "cool", label: "Cool" },
  { style: "surfer", label: "Surfer" },
  { style: "heart", label: "Heart" },
  { style: "hi-five", label: "Hi Five" },
  { style: "fist-bump", label: "Fist Bump" },
  { style: "handshake", label: "Hand Shake" },
  { style: "clapping", label: "Clapping" },
  { style: "congrats", label: "Congratulate" },
  { style: "mittens", label: "Mittens" },
  { style: "cartoon", label: "Cartoon" },
];

const EXPRESSION_LIST = Object.keys(EXPRESSION_PRESETS) as ExpressionPreset[];

const RANDOM_NAMES = [
  "Blobby", "Zippy", "Squish", "Bonk", "Wobble", "Fizz", "Nugget", "Sprout",
  "Doodle", "Pebble", "Glitch", "Muffin", "Pickle", "Toasty", "Widget",
  "Noodle", "Biscuit", "Cheddar", "Marble", "Sparky", "Dusty", "Cosmo",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randRange(min: number, max: number, step = 1): number {
  const steps = Math.round((max - min) / step);
  return min + Math.round(Math.random() * steps) * step;
}

function supportsCornerRadius(shapeType: ShapeType): boolean {
  return [
    "rectangle",
    "triangle",
    "star",
    "polygon",
    "capsule",
    "diamond",
    "trapezoid",
    "parallelogram",
  ].includes(shapeType);
}

function defaultCornerRadius(shapeType: ShapeType, width: number, height: number): number {
  if (shapeType === "capsule") {
    return Math.round(Math.min(width, height) / 2);
  }
  return Math.round(Math.min(width, height) * 0.08);
}

function generateRandomCharacter() {
  const shapeTypes: ShapeType[] = [
    "rectangle",
    "ellipse",
    "capsule",
    "triangle",
    "trapezoid",
    "parallelogram",
    "diamond",
    "star",
    "polygon",
    "blob",
    "asymmetric-blob",
  ];
  const shapeType = pick(shapeTypes);
  const width = randRange(60, 180, 10);
  const height = randRange(60, 180, 10);
  const canRound = supportsCornerRadius(shapeType);
  const randomPattern = Math.random() > 0.6 ? pick(PATTERN_OPTIONS.filter((p) => p.value !== "none")).value : "none";
  const shape: ShapeProps = {
    shapeType,
    width,
    height,
    fill: pick(PRESET_COLORS),
    pattern: randomPattern,
    patternColor: "#ffffff",
    patternScale: 1,
    points: shapeType === "star" ? randRange(4, 8) : shapeType === "polygon" ? randRange(4, 8) : undefined,
    cornerRadius: canRound ? randRange(0, Math.max(4, defaultCornerRadius(shapeType, width, height)), 2) : undefined,
  };

  const expression = pick(EXPRESSION_LIST);
  const face = applyPreset(expression);
  face.eyeStyle = pick(EYE_STYLES).style;
  face.mouthStyle = pick(MOUTH_STYLES).style;
  face.eyeSize = randRange(0.5, 2.0, 0.1);
  face.eyeSpacing = randRange(0.5, 1.5, 0.1);
  face.mouthSize = randRange(0.5, 2.0, 0.1);

  const armStyle = pick(LIMB_STYLES).style;
  const legStyle = pick(LIMB_STYLES).style;
  const limbs: LimbProps = {
    armStyle,
    legStyle,
    limbColor: Math.random() > 0.7 ? pick(PRESET_COLORS) : "#000000",
    limbThickness: randRange(2, 5),
    armLength: randRange(0.4, 1.3, 0.1),
    legLength: randRange(0.4, 1.3, 0.1),
    armSpread: randRange(0.1, 0.8, 0.1),
    armRotationDeg: randRange(-60, 60, 5),
    legSpread: randRange(0.1, 0.7, 0.1),
    feet: Math.random() > 0.3,
    shoeStyle: pick(SHOE_STYLES).style,
    shoeColor: Math.random() > 0.7 ? pick(PRESET_COLORS) : "#111111",
    shoeSoleColor: Math.random() > 0.65 ? pick(PRESET_COLORS) : "#f2f4f7",
    shoeAccessory: pick(SHOE_ACCESSORY_STYLES).style,
    shoeAccessoryColor: Math.random() > 0.65 ? pick(PRESET_COLORS) : "#ffffff",
    handStyle: pick(HAND_STYLES).style,
    handColor: Math.random() > 0.65 ? pick(PRESET_COLORS) : "#f4c29b",
  };

  const accessories: AccessoryProps[] = [];
  if (Math.random() > 0.65) {
    accessories.push({
      id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: "hat",
      name: "Hat",
      x: 0,
      y: -34,
      scale: 1,
      rotation: 0,
      color: "#222222",
    });
  }

  return { name: pick(RANDOM_NAMES), shape, face, limbs, accessories };
}

interface CharacterBuilderProps {
  editId?: string;
  initialName?: string;
  initialShape?: ShapeProps;
  initialFace?: FaceProps;
  initialLimbs?: LimbProps;
  initialAccessories?: AccessoryProps[];
  initialDigitizationMeta?: {
    confidence?: number;
    warnings?: string[];
    modelVersion?: string;
    partConfidence?: {
      body?: number;
      arms?: number;
      legs?: number;
      face?: number;
      accessories?: number;
    };
    image?: {
      format?: string;
      width?: number;
      height?: number;
      aspectRatio?: number;
    };
  } | null;
}

export function CharacterBuilder({
  editId,
  initialName,
  initialShape,
  initialFace,
  initialLimbs,
  initialAccessories,
  initialDigitizationMeta,
}: CharacterBuilderProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const sceneRef = useRef<Container | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [name, setName] = useState(initialName ?? "My Character");
  const [shape, setShape] = useState<ShapeProps>(
    initialShape ?? {
      shapeType: "ellipse",
      width: 120,
      height: 120,
      fill: "#44aaff",
    }
  );
  const [face, setFace] = useState<FaceProps>({ ...DEFAULT_FACE, ...(initialFace ?? applyPreset("happy")) });
  const [limbs, setLimbs] = useState<LimbProps>({ ...DEFAULT_LIMBS, ...(initialLimbs ?? {}) });
  const [accessories, setAccessories] = useState<AccessoryProps[]>(initialAccessories ?? []);
  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string | null>(
    initialAccessories?.[0]?.id ?? null
  );

  // Initialize PixiJS preview
  useEffect(() => {
    if (!canvasRef.current) return;
    const app = new Application();
    let destroyed = false;

    const initPromise = app.init({
      background: "#1a1a2e",
      width: 300,
      height: 300,
      antialias: true,
    }).then(() => {
      if (destroyed || !canvasRef.current) return;
      canvasRef.current.innerHTML = "";
      canvasRef.current.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      const scene = new Container();
      scene.x = 150;
      scene.y = 130; // slightly above center to leave room for legs
      app.stage.addChild(scene);
      sceneRef.current = scene;
      setPreviewReady(true);
    });

    return () => {
      destroyed = true;
      setPreviewReady(false);
      initPromise.then(() => {
        app.destroy(true, { children: true });
        appRef.current = null;
        sceneRef.current = null;
      });
    };
  }, []);

  const renderPreview = useCallback((timeMs = Date.now()) => {
    const scene = sceneRef.current;
    const app = appRef.current;
    if (!scene) return;

    scene.removeChildren();
    const hasLimbs = limbs.armStyle !== "none" || limbs.legStyle !== "none";
    drawCharacter(scene, shape, face, hasLimbs ? limbs : undefined, accessories, timeMs);
    // Force a render tick for cases where the preview can miss an auto-refresh.
    app?.renderer.render(app.stage);
  }, [shape, face, limbs, accessories]);

  // Re-render character on every state change
  useEffect(() => {
    if (!previewReady) return;
    renderPreview();
  }, [previewReady, renderPreview]);

  // Animate preview while talking mouth effect is enabled
  useEffect(() => {
    const app = appRef.current;
    if (!app || !previewReady || face.mouthEffect !== "talk") return;

    const tick = () => {
      renderPreview(Date.now());
    };
    app.ticker.add(tick);
    return () => {
      app.ticker.remove(tick);
    };
  }, [face.mouthEffect, previewReady, renderPreview]);

  const updateShape = useCallback((updates: Partial<ShapeProps>) => {
    setShape((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateFace = useCallback((updates: Partial<FaceProps>) => {
    setFace((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateLimbs = useCallback((updates: Partial<LimbProps>) => {
    setLimbs((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleExpressionPreset = useCallback((preset: ExpressionPreset) => {
    setFace(applyPreset(preset));
  }, []);

  const handleRandomize = useCallback(() => {
    const r = generateRandomCharacter();
    setName(r.name);
    setShape(r.shape);
    setFace(r.face);
    setLimbs(r.limbs);
    setAccessories(r.accessories);
    setSelectedAccessoryId(r.accessories[0]?.id ?? null);
  }, []);

  const addAccessory = useCallback((type: AccessoryProps["type"]) => {
    const id = `acc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const defaults: Record<AccessoryProps["type"], Omit<AccessoryProps, "id" | "type" | "name">> = {
      hat: { x: 0, y: -34, scale: 1, rotation: 0, color: "#222222" },
      glasses: { x: 0, y: -8, scale: 1, rotation: 0, color: "#111111" },
      prop: { x: 34, y: 14, scale: 1, rotation: -12, color: "#8b5e34" },
      other: { x: 0, y: 0, scale: 1, rotation: 0, color: "#666666" },
    };
    const labels: Record<AccessoryProps["type"], string> = {
      hat: "Hat",
      glasses: "Glasses",
      prop: "Prop",
      other: "Accessory",
    };
    const next: AccessoryProps = {
      id,
      type,
      name: labels[type],
      ...defaults[type],
    };
    setAccessories((prev) => [...prev, next]);
    setSelectedAccessoryId(id);
  }, []);

  const removeAccessory = useCallback((id: string) => {
    setAccessories((prev) => prev.filter((item) => item.id !== id));
    setSelectedAccessoryId((prev) => (prev === id ? null : prev));
  }, []);

  const updateAccessory = useCallback((id: string, updates: Partial<AccessoryProps>) => {
    setAccessories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const url = editId ? `/api/characters/${editId}` : "/api/characters";
      const method = editId ? "PATCH" : "POST";

      const hasLimbs = limbs.armStyle !== "none" || limbs.legStyle !== "none";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          shapeData: JSON.stringify(shape),
          faceData: JSON.stringify(face),
          limbsData: hasLimbs ? JSON.stringify(limbs) : null,
          accessoriesData: accessories.length > 0 ? JSON.stringify(accessories) : null,
        }),
      });

      if (res.ok) {
        router.push("/characters");
      } else {
        const data = await res.json().catch(() => null);
        setSaveError(data?.error ?? "Failed to save character");
      }
    } catch {
      setSaveError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  const selectedAccessory = selectedAccessoryId
    ? accessories.find((item) => item.id === selectedAccessoryId) ?? null
    : null;
  const patternValue: ShapePattern = shape.pattern ?? "none";
  const patternScaleValue = Math.max(0.4, Math.min(3, shape.patternScale ?? 1));
  const cornerRadiusMax = Math.max(2, Math.round(Math.min(shape.width, shape.height) / 2));
  const cornerRadiusValue = Math.max(
    0,
    Math.min(
      cornerRadiusMax,
      shape.cornerRadius ?? (supportsCornerRadius(shape.shapeType) ? defaultCornerRadius(shape.shapeType, shape.width, shape.height) : 0)
    )
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/characters"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">
            {editId ? "Edit Character" : "Create a Character"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRandomize}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 font-medium hover:bg-gray-800 hover:text-white transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            Random
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Character"}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-sm">
          {saveError}
        </div>
      )}

      {initialDigitizationMeta && (
        <div className="mb-4 px-4 py-2.5 rounded-lg bg-cyan-600/15 border border-cyan-500/30 text-cyan-100 text-sm">
          <div className="font-medium">Digitized Draft</div>
          {typeof initialDigitizationMeta.confidence === "number" && (
            <div className="text-xs text-cyan-200/80 mt-0.5">
              Confidence: {Math.round(initialDigitizationMeta.confidence * 100)}%
            </div>
          )}
          {Array.isArray(initialDigitizationMeta.warnings) && initialDigitizationMeta.warnings.length > 0 && (
            <ul className="mt-1 text-xs text-cyan-100/85 list-disc list-inside">
              {initialDigitizationMeta.warnings.slice(0, 3).map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          {initialDigitizationMeta.partConfidence && (
            <div className="mt-2 text-xs text-cyan-100/80 grid grid-cols-2 sm:grid-cols-3 gap-1">
              <span>Body: {Math.round((initialDigitizationMeta.partConfidence.body ?? 0) * 100)}%</span>
              <span>Arms: {Math.round((initialDigitizationMeta.partConfidence.arms ?? 0) * 100)}%</span>
              <span>Legs: {Math.round((initialDigitizationMeta.partConfidence.legs ?? 0) * 100)}%</span>
              <span>Face: {Math.round((initialDigitizationMeta.partConfidence.face ?? 0) * 100)}%</span>
              <span>Accessories: {Math.round((initialDigitizationMeta.partConfidence.accessories ?? 0) * 100)}%</span>
            </div>
          )}
          {initialDigitizationMeta.image?.format && (
            <div className="mt-1 text-[11px] text-cyan-200/70">
              Source: {initialDigitizationMeta.image.format}
              {initialDigitizationMeta.image.width && initialDigitizationMeta.image.height
                ? ` (${initialDigitizationMeta.image.width}x${initialDigitizationMeta.image.height})`
                : ""}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        {/* Controls */}
        <div className="space-y-5">
          {/* Name */}
          <Section title="Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name your character..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={50}
            />
          </Section>

          {/* Body Shape */}
          <Section title="Body Shape">
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {SHAPE_OPTIONS.map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() =>
                    updateShape({
                      shapeType: type,
                      points: type === "star" ? 5 : type === "polygon" ? 6 : undefined,
                      cornerRadius: supportsCornerRadius(type)
                        ? shape.cornerRadius ?? defaultCornerRadius(type, shape.width, shape.height)
                        : undefined,
                    })
                  }
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                    shape.shapeType === type
                      ? "border-blue-500 bg-blue-600/20 text-blue-400"
                      : "border-gray-700 bg-gray-800/50 text-gray-400 hover:text-white hover:border-gray-600"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-[10px]">{label}</span>
                </button>
              ))}
            </div>
          </Section>

          {/* Body Color */}
          <Section title="Body Color">
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => updateShape({ fill: color })}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    shape.fill === color
                      ? "border-white scale-110"
                      : "border-transparent hover:border-gray-500"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <label className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-600 cursor-pointer flex items-center justify-center text-gray-500 text-xs hover:border-gray-400">
                <input
                  type="color"
                  value={shape.fill}
                  onChange={(e) => updateShape({ fill: e.target.value })}
                  className="sr-only"
                />
                +
              </label>
            </div>
          </Section>

          {/* Pattern */}
          <Section title="Pattern">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {PATTERN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateShape({ pattern: opt.value })}
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                      patternValue === opt.value
                        ? "border-blue-500 bg-blue-600/20 text-blue-400"
                        : "border-gray-700 bg-gray-800/50 text-gray-400 hover:text-white hover:border-gray-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {patternValue !== "none" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-16">Pattern</span>
                    <input
                      type="color"
                      value={shape.patternColor ?? "#ffffff"}
                      onChange={(e) => updateShape({ patternColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-700"
                    />
                  </div>
                  <SliderField
                    label="Density"
                    value={patternScaleValue}
                    min={0.4}
                    max={3}
                    step={0.1}
                    onChange={(v) => updateShape({ patternScale: v })}
                  />
                </div>
              )}
            </div>
          </Section>

          {/* Body Size */}
          <Section title="Body Size">
            <div className="grid grid-cols-2 gap-4">
              <SliderField
                label="Width"
                value={shape.width}
                min={40}
                max={200}
                onChange={(v) => updateShape({ width: v })}
              />
              <SliderField
                label="Height"
                value={shape.height}
                min={40}
                max={200}
                onChange={(v) => updateShape({ height: v })}
              />
            </div>
            {supportsCornerRadius(shape.shapeType) && (
              <div className="mt-4">
                <SliderField
                  label="Corner Radius"
                  value={cornerRadiusValue}
                  min={0}
                  max={cornerRadiusMax}
                  onChange={(v) => updateShape({ cornerRadius: v })}
                />
              </div>
            )}
          </Section>

          {/* Expression Presets */}
          <Section title="Expression">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {EXPRESSION_LIST.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleExpressionPreset(preset)}
                  className={`px-3 py-2 rounded-lg border text-xs capitalize transition-all ${
                    face.expression === preset
                      ? "border-blue-500 bg-blue-600/20 text-blue-400"
                      : "border-gray-700 bg-gray-800/50 text-gray-400 hover:text-white hover:border-gray-600"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </Section>

          {/* Eyes */}
          <Section title="Eyes">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {EYE_STYLES.map(({ style, label }) => (
                  <button
                    key={style}
                    onClick={() => updateFace({ eyeStyle: style })}
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                      face.eyeStyle === style
                        ? "border-blue-500 bg-blue-600/20 text-blue-400"
                        : "border-gray-700 bg-gray-800/50 text-gray-400 hover:text-white hover:border-gray-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SliderField
                  label="Eye Size"
                  value={face.eyeSize}
                  min={0.3}
                  max={2.5}
                  step={0.1}
                  onChange={(v) => updateFace({ eyeSize: v })}
                />
                <SliderField
                  label="Spacing"
                  value={face.eyeSpacing}
                  min={0.3}
                  max={2}
                  step={0.1}
                  onChange={(v) => updateFace({ eyeSpacing: v })}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-16">Eye Color</span>
                <input
                  type="color"
                  value={face.eyeColor}
                  onChange={(e) => updateFace({ eyeColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-700"
                />
              </div>
            </div>
          </Section>

          {/* Eyebrows */}
          <Section title="Eyebrows">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {EYEBROW_STYLES.map(({ style, label }) => (
                  <button
                    key={style}
                    onClick={() => updateFace({ eyebrowStyle: style })}
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                      face.eyebrowStyle === style
                        ? "border-blue-500 bg-blue-600/20 text-blue-400"
                        : "border-gray-700 bg-gray-800/50 text-gray-400 hover:text-white hover:border-gray-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {face.eyebrowStyle !== "none" && (
                <div className="grid grid-cols-2 gap-4">
                  <SliderField
                    label="Thickness"
                    value={face.eyebrowThickness}
                    min={1}
                    max={6}
                    onChange={(v) => updateFace({ eyebrowThickness: v })}
                  />
                  <SliderField
                    label="Offset Y"
                    value={face.eyebrowOffsetY}
                    min={-0.5}
                    max={0}
                    step={0.02}
                    onChange={(v) => updateFace({ eyebrowOffsetY: v })}
                  />
                  <SliderField
                    label="Tilt"
                    value={face.eyebrowTilt}
                    min={-1}
                    max={1}
                    step={0.1}
                    onChange={(v) => updateFace({ eyebrowTilt: v })}
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-16">Color</span>
                    <input
                      type="color"
                      value={face.eyebrowColor}
                      onChange={(e) => updateFace({ eyebrowColor: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-700"
                    />
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Mouth */}
          <Section title="Mouth">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {MOUTH_STYLES.map(({ style, label }) => (
                  <button
                    key={style}
                    onClick={() => updateFace({ mouthStyle: style })}
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                      face.mouthStyle === style
                        ? "border-blue-500 bg-blue-600/20 text-blue-400"
                        : "border-gray-700 bg-gray-800/50 text-gray-400 hover:text-white hover:border-gray-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SliderField
                  label="Mouth Size"
                  value={face.mouthSize}
                  min={0.3}
                  max={2.5}
                  step={0.1}
                  onChange={(v) => updateFace({ mouthSize: v })}
                />
                <SliderField
                  label="Curve"
                  value={face.mouthCurve}
                  min={-1}
                  max={1}
                  step={0.1}
                  onChange={(v) => updateFace({ mouthCurve: v })}
                />
              </div>
              <div className="space-y-2">
                <span className="text-xs text-gray-400">Effect</span>
                <div className="flex gap-2">
                  {MOUTH_EFFECTS.map(({ effect, label }) => (
                    <button
                      key={effect}
                      onClick={() => updateFace({ mouthEffect: effect })}
                      className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                        face.mouthEffect === effect
                          ? "border-blue-500 bg-blue-600/20 text-blue-400"
                          : "border-gray-700 bg-gray-800/50 text-gray-400 hover:text-white hover:border-gray-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {face.mouthEffect === "talk" && (
                <div className="grid grid-cols-2 gap-4">
                  <SliderField
                    label="Talk Speed"
                    value={face.mouthTalkSpeed}
                    min={1}
                    max={12}
                    step={0.5}
                    onChange={(v) => updateFace({ mouthTalkSpeed: v })}
                  />
                  <SliderField
                    label="Talk Amount"
                    value={face.mouthTalkAmount}
                    min={0.1}
                    max={1}
                    step={0.05}
                    onChange={(v) => updateFace({ mouthTalkAmount: v })}
                  />
                </div>
              )}
            </div>
          </Section>

          {/* Arms & Legs */}
          <Section title="Arms & Legs">
            <div className="space-y-4">
              {/* Arm style */}
              <div>
                <span className="text-xs text-gray-400 mb-1.5 block">Arms</span>
                <div className="flex gap-2">
                  {LIMB_STYLES.map(({ style, label }) => (
                    <button
                      key={`arm-${style}`}
                      onClick={() => updateLimbs({ armStyle: style })}
                      className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                        limbs.armStyle === style
                          ? "border-blue-500 bg-blue-600/20 text-blue-400"
                          : "border-gray-700 bg-gray-800/50 text-gray-400 hover:text-white hover:border-gray-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Leg style */}
              <div>
                <span className="text-xs text-gray-400 mb-1.5 block">Legs</span>
                <div className="flex gap-2">
                  {LIMB_STYLES.map(({ style, label }) => (
                    <button
                      key={`leg-${style}`}
                      onClick={() => updateLimbs({ legStyle: style })}
                      className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                        limbs.legStyle === style
                          ? "border-blue-500 bg-blue-600/20 text-blue-400"
                          : "border-gray-700 bg-gray-800/50 text-gray-400 hover:text-white hover:border-gray-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Limb details (only show when at least one limb type is active) */}
              {(limbs.armStyle !== "none" || limbs.legStyle !== "none") && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <SliderField
                      label="Thickness"
                      value={limbs.limbThickness}
                      min={1}
                      max={6}
                      onChange={(v) => updateLimbs({ limbThickness: v })}
                    />
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-16">Color</span>
                      <input
                        type="color"
                        value={limbs.limbColor}
                        onChange={(e) => updateLimbs({ limbColor: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-700"
                      />
                    </div>
                  </div>

                  {limbs.armStyle !== "none" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <SliderField
                          label="Arm Length"
                          value={limbs.armLength}
                          min={0.3}
                          max={1.5}
                          step={0.1}
                          onChange={(v) => updateLimbs({ armLength: v })}
                        />
                        <SliderField
                          label="Arm Spread"
                          value={limbs.armSpread}
                          min={0}
                          max={1}
                          step={0.1}
                          onChange={(v) => updateLimbs({ armSpread: v })}
                        />
                      </div>
                      <SliderField
                        label="Arm Rotation"
                        value={limbs.armRotationDeg}
                        min={-120}
                        max={120}
                        step={5}
                        onChange={(v) => updateLimbs({ armRotationDeg: v })}
                      />
                      <div className="space-y-3 rounded-lg border border-gray-800 p-3">
                        <div>
                          <span className="text-xs text-gray-400 mb-1.5 block">Hand Style</span>
                          <div className="flex flex-wrap gap-2">
                            {HAND_STYLES.map(({ style, label }) => (
                              <button
                                key={`hand-${style}`}
                                onClick={() => updateLimbs({ handStyle: style })}
                                className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                  limbs.handStyle === style
                                    ? "border-blue-500 bg-blue-600/20 text-blue-400"
                                    : "border-gray-700 bg-gray-800/50 text-gray-400 hover:text-white hover:border-gray-600"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-20">Hand Color</span>
                          <input
                            type="color"
                            value={limbs.handColor}
                            onChange={(e) => updateLimbs({ handColor: e.target.value })}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-700"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {limbs.legStyle !== "none" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <SliderField
                          label="Leg Length"
                          value={limbs.legLength}
                          min={0.3}
                          max={1.5}
                          step={0.1}
                          onChange={(v) => updateLimbs({ legLength: v })}
                        />
                        <SliderField
                          label="Leg Spread"
                          value={limbs.legSpread}
                          min={0}
                          max={1}
                          step={0.1}
                          onChange={(v) => updateLimbs({ legSpread: v })}
                        />
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={limbs.feet}
                          onChange={(e) => updateLimbs({ feet: e.target.checked })}
                          className="rounded accent-blue-500"
                        />
                        <span className="text-xs text-gray-400">Show Feet</span>
                      </label>
                      {limbs.feet && (
                        <div className="space-y-3 rounded-lg border border-gray-800 p-3">
                          <div>
                            <span className="text-xs text-gray-400 mb-1.5 block">Shoe Style</span>
                            <div className="flex flex-wrap gap-2">
                              {SHOE_STYLES.map(({ style, label }) => (
                                <button
                                  key={`shoe-${style}`}
                                  onClick={() => updateLimbs({ shoeStyle: style })}
                                  className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                    limbs.shoeStyle === style
                                      ? "border-blue-500 bg-blue-600/20 text-blue-400"
                                      : "border-gray-700 bg-gray-800/50 text-gray-400 hover:text-white hover:border-gray-600"
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 w-20">Shoe Color</span>
                              <input
                                type="color"
                                value={limbs.shoeColor}
                                onChange={(e) => updateLimbs({ shoeColor: e.target.value })}
                                className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-700"
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 w-20">Sole Color</span>
                              <input
                                type="color"
                                value={limbs.shoeSoleColor}
                                onChange={(e) => updateLimbs({ shoeSoleColor: e.target.value })}
                                className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-700"
                              />
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-400 mb-1.5 block">Shoe Accessory</span>
                            <div className="flex flex-wrap gap-2">
                              {SHOE_ACCESSORY_STYLES.map(({ style, label }) => (
                                <button
                                  key={`shoe-accessory-${style}`}
                                  onClick={() => updateLimbs({ shoeAccessory: style })}
                                  className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                                    limbs.shoeAccessory === style
                                      ? "border-blue-500 bg-blue-600/20 text-blue-400"
                                      : "border-gray-700 bg-gray-800/50 text-gray-400 hover:text-white hover:border-gray-600"
                                  }`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 w-20">Accessory Color</span>
                            <input
                              type="color"
                              value={limbs.shoeAccessoryColor}
                              onChange={(e) => updateLimbs({ shoeAccessoryColor: e.target.value })}
                              className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-700"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </Section>

          {/* Accessories */}
          <Section title="Accessories">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => addAccessory("hat")}
                  className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/50 text-xs text-gray-300 hover:text-white hover:border-gray-600 transition-all"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Hat
                </button>
                <button
                  onClick={() => addAccessory("glasses")}
                  className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/50 text-xs text-gray-300 hover:text-white hover:border-gray-600 transition-all"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Glasses
                </button>
                <button
                  onClick={() => addAccessory("prop")}
                  className="px-3 py-1.5 rounded-lg border border-gray-700 bg-gray-800/50 text-xs text-gray-300 hover:text-white hover:border-gray-600 transition-all"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Prop
                </button>
              </div>

              {accessories.length === 0 ? (
                <p className="text-xs text-gray-500">No accessories added.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {accessories.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => setSelectedAccessoryId(acc.id)}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                          selectedAccessoryId === acc.id
                            ? "border-blue-500 bg-blue-600/20 text-blue-300"
                            : "border-gray-700 bg-gray-800/50 text-gray-300 hover:text-white hover:border-gray-600"
                        }`}
                      >
                        {acc.name}
                      </button>
                    ))}
                  </div>

                  {selectedAccessory && (
                    <div className="space-y-3 rounded-lg border border-gray-800 p-3">
                      <div className="flex items-center justify-between">
                        <input
                          value={selectedAccessory.name}
                          onChange={(e) => updateAccessory(selectedAccessory.id, { name: e.target.value })}
                          className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeAccessory(selectedAccessory.id)}
                          className="p-1 rounded text-red-300 hover:text-red-200 hover:bg-red-900/30 transition-colors"
                          title="Remove accessory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <SliderField
                          label="X Offset"
                          value={selectedAccessory.x}
                          min={-80}
                          max={80}
                          onChange={(v) => updateAccessory(selectedAccessory.id, { x: v })}
                        />
                        <SliderField
                          label="Y Offset"
                          value={selectedAccessory.y}
                          min={-80}
                          max={80}
                          onChange={(v) => updateAccessory(selectedAccessory.id, { y: v })}
                        />
                        <SliderField
                          label="Scale"
                          value={selectedAccessory.scale}
                          min={0.2}
                          max={2}
                          step={0.1}
                          onChange={(v) => updateAccessory(selectedAccessory.id, { scale: v })}
                        />
                        <SliderField
                          label="Rotation"
                          value={selectedAccessory.rotation}
                          min={-180}
                          max={180}
                          onChange={(v) => updateAccessory(selectedAccessory.id, { rotation: v })}
                        />
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-16">Color</span>
                          <input
                            type="color"
                            value={selectedAccessory.color ?? "#444444"}
                            onChange={(e) => updateAccessory(selectedAccessory.id, { color: e.target.value })}
                            className="w-8 h-8 rounded cursor-pointer bg-transparent border border-gray-700"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </Section>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-4 lg:self-start h-fit">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-800">
              <span className="text-xs font-medium text-gray-400">Preview</span>
            </div>
            <div
              ref={canvasRef}
              className="w-[300px] h-[300px] mx-auto"
            />
            <div className="px-4 py-2 border-t border-gray-800 text-center">
              <span className="text-sm text-gray-300">{name || "Unnamed"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs text-gray-500 font-mono">
          {step < 1 ? value.toFixed(1) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );
}
