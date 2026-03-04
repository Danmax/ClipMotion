"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Application, Container } from "pixi.js";
import { useRouter } from "next/navigation";
import { drawCharacter } from "@/lib/draw-character";
import { applyPreset, EXPRESSION_PRESETS } from "@/engine/face-presets";
import { DEFAULT_FACE } from "@/engine/types";
import type { ShapeProps, FaceProps, ShapeType, ExpressionPreset, EyeStyle, MouthStyle } from "@/engine/types";
import {
  Circle,
  Square,
  Triangle,
  Star,
  Hexagon,
  Save,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

const SHAPE_OPTIONS: { type: ShapeType; icon: React.ElementType; label: string }[] = [
  { type: "rectangle", icon: Square, label: "Square" },
  { type: "ellipse", icon: Circle, label: Circle.name === "Circle" ? "Circle" : "Circle" },
  { type: "triangle", icon: Triangle, label: "Triangle" },
  { type: "star", icon: Star, label: "Star" },
  { type: "polygon", icon: Hexagon, label: "Hexagon" },
];

const PRESET_COLORS = [
  "#ff4444", "#ff8844", "#ffcc00", "#44cc44", "#44aaff", "#8844ff",
  "#ff44aa", "#00cccc", "#ffffff", "#aaaaaa", "#8B4513", "#222222",
];

const EYE_STYLES: { style: EyeStyle; label: string }[] = [
  { style: "dot", label: "Dot" },
  { style: "circle", label: "Circle" },
  { style: "oval", label: "Oval" },
  { style: "angry", label: "Angry" },
  { style: "closed", label: "Closed" },
  { style: "wink", label: "Wink" },
  { style: "wide", label: "Wide" },
];

const MOUTH_STYLES: { style: MouthStyle; label: string }[] = [
  { style: "line", label: "Line" },
  { style: "smile", label: "Smile" },
  { style: "frown", label: "Frown" },
  { style: "open", label: "Open" },
  { style: "o", label: "O" },
  { style: "teeth", label: "Teeth" },
  { style: "wavy", label: "Wavy" },
  { style: "small-smile", label: "Smirk" },
];

const EXPRESSION_LIST = Object.keys(EXPRESSION_PRESETS) as ExpressionPreset[];

interface CharacterBuilderProps {
  editId?: string;
  initialName?: string;
  initialShape?: ShapeProps;
  initialFace?: FaceProps;
}

export function CharacterBuilder({
  editId,
  initialName,
  initialShape,
  initialFace,
}: CharacterBuilderProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const sceneRef = useRef<Container | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(initialName ?? "My Character");
  const [shape, setShape] = useState<ShapeProps>(
    initialShape ?? {
      shapeType: "ellipse",
      width: 120,
      height: 120,
      fill: "#44aaff",
    }
  );
  const [face, setFace] = useState<FaceProps>(initialFace ?? applyPreset("happy"));

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
      canvasRef.current.appendChild(app.canvas as HTMLCanvasElement);
      appRef.current = app;

      const scene = new Container();
      scene.x = 150;
      scene.y = 150;
      app.stage.addChild(scene);
      sceneRef.current = scene;
    });

    return () => {
      destroyed = true;
      initPromise.then(() => {
        app.destroy(true, { children: true });
        appRef.current = null;
        sceneRef.current = null;
      });
    };
  }, []);

  // Re-render character on every state change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    scene.removeChildren();
    drawCharacter(scene, shape, face);
  }, [shape, face]);

  const updateShape = useCallback((updates: Partial<ShapeProps>) => {
    setShape((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateFace = useCallback((updates: Partial<FaceProps>) => {
    setFace((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleExpressionPreset = useCallback((preset: ExpressionPreset) => {
    setFace(applyPreset(preset));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editId ? `/api/characters/${editId}` : "/api/characters";
      const method = editId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          shapeData: JSON.stringify(shape),
          faceData: JSON.stringify(face),
        }),
      });

      if (res.ok) {
        router.push("/characters");
      }
    } finally {
      setSaving(false);
    }
  };

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
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Character"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Controls */}
        <div className="space-y-6">
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
            <div className="grid grid-cols-5 gap-2">
              {SHAPE_OPTIONS.map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => updateShape({ shapeType: type, points: type === "star" ? 5 : type === "polygon" ? 6 : undefined })}
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
            </div>
          </Section>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-24">
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
