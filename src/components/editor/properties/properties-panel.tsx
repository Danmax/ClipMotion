"use client";

import { useEditorStore } from "@/store/editor-store";
import { useSelectionStore } from "@/store/selection-store";
import { usePlaybackStore } from "@/store/playback-store";
import { KeySquare } from "lucide-react";
import type { AnimatableProperty, EyeStyle, MouthStyle, ExpressionPreset } from "@/engine/types";
import { DEFAULT_FACE } from "@/engine/types";
import { EXPRESSION_PRESETS, applyPreset } from "@/engine/face-presets";

export function PropertiesPanel() {
  const document = useEditorStore((s) => s.document);
  const updateNodeTransform = useEditorStore((s) => s.updateNodeTransform);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const setKeyframeAt = useEditorStore((s) => s.setKeyframeAt);
  const selectedNodeIds = useSelectionStore((s) => s.selectedNodeIds);
  const currentTimeMs = usePlaybackStore((s) => s.currentTimeMs);

  const selectedId = [...selectedNodeIds][0];
  const node = selectedId ? document.nodes[selectedId] : null;

  if (!node) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-gray-500">Select something to edit</p>
      </div>
    );
  }

  const handleTransformChange = (prop: AnimatableProperty, value: number) => {
    updateNodeTransform(selectedId, { [prop]: value });
  };

  const handleSetKeyframe = (prop: AnimatableProperty) => {
    setKeyframeAt(selectedId, prop, currentTimeMs, node.transform[prop]);
  };

  return (
    <div className="h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Settings
        </span>
      </div>

      <div className="p-3 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Name</label>
          <input
            value={node.name}
            onChange={(e) => updateNodeProps(selectedId, { name: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Face properties */}
        {node.type === "shape" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs text-gray-500">Face</label>
              {!node.face ? (
                <button
                  onClick={() => updateNodeProps(selectedId, { face: DEFAULT_FACE })}
                  className="text-[10px] text-blue-400 hover:text-blue-300"
                >
                  + Add Face
                </button>
              ) : (
                <button
                  onClick={() => updateNodeProps(selectedId, { face: undefined })}
                  className="text-[10px] text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </div>
            {node.face && (
              <div className="space-y-2">
                {/* Expression presets */}
                <div>
                  <span className="text-[10px] text-gray-600 mb-1 block">Expression</span>
                  <div className="grid grid-cols-3 gap-1">
                    {(Object.keys(EXPRESSION_PRESETS) as ExpressionPreset[]).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => updateNodeProps(selectedId, { face: applyPreset(preset) })}
                        className={`text-[10px] px-1.5 py-1 rounded capitalize ${
                          node.face!.expression === preset
                            ? "bg-blue-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Eye controls */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Eyes</span>
                  <select
                    value={node.face.eyeStyle}
                    onChange={(e) => updateNodeProps(selectedId, {
                      face: { ...node.face!, eyeStyle: e.target.value as EyeStyle }
                    })}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {(["dot", "circle", "oval", "angry", "closed", "wink", "wide"] as const).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Size</span>
                  <input type="range" min="0.5" max="2" step="0.1"
                    value={node.face.eyeSize}
                    onChange={(e) => updateNodeProps(selectedId, {
                      face: { ...node.face!, eyeSize: parseFloat(e.target.value) }
                    })}
                    className="flex-1 accent-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Spacing</span>
                  <input type="range" min="0.5" max="2" step="0.1"
                    value={node.face.eyeSpacing}
                    onChange={(e) => updateNodeProps(selectedId, {
                      face: { ...node.face!, eyeSpacing: parseFloat(e.target.value) }
                    })}
                    className="flex-1 accent-blue-500"
                  />
                </div>

                {/* Mouth controls */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Mouth</span>
                  <select
                    value={node.face.mouthStyle}
                    onChange={(e) => updateNodeProps(selectedId, {
                      face: { ...node.face!, mouthStyle: e.target.value as MouthStyle }
                    })}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {(["smile", "frown", "open", "line", "o", "teeth", "wavy", "small-smile"] as const).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Curve</span>
                  <input type="range" min="-1" max="1" step="0.1"
                    value={node.face.mouthCurve}
                    onChange={(e) => updateNodeProps(selectedId, {
                      face: { ...node.face!, mouthCurve: parseFloat(e.target.value) }
                    })}
                    className="flex-1 accent-blue-500"
                  />
                </div>

                {/* Face scale */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Scale</span>
                  <input type="range" min="0.5" max="2" step="0.1"
                    value={node.face.faceScale}
                    onChange={(e) => updateNodeProps(selectedId, {
                      face: { ...node.face!, faceScale: parseFloat(e.target.value) }
                    })}
                    className="flex-1 accent-blue-500"
                  />
                </div>

                {/* Color pickers */}
                <div className="flex gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-600">Eye</span>
                    <input type="color" value={node.face.eyeColor}
                      onChange={(e) => updateNodeProps(selectedId, { face: { ...node.face!, eyeColor: e.target.value } })}
                      className="w-6 h-5 rounded border border-gray-700 bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-600">Mouth</span>
                    <input type="color" value={node.face.mouthColor}
                      onChange={(e) => updateNodeProps(selectedId, { face: { ...node.face!, mouthColor: e.target.value } })}
                      className="w-6 h-5 rounded border border-gray-700 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Shape properties — before transform for easier access */}
        {node.type === "shape" && node.shape && (
          <div>
            <label className="block text-xs text-gray-500 mb-2">Shape</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-14">Width</span>
                <input
                  type="number"
                  value={node.shape.width}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v > 0) updateNodeProps(selectedId, { shape: { ...node.shape!, width: v } });
                  }}
                  step={1}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-14">Height</span>
                <input
                  type="number"
                  value={node.shape.height}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v > 0) updateNodeProps(selectedId, { shape: { ...node.shape!, height: v } });
                  }}
                  step={1}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-14">Color</span>
                <input
                  type="color"
                  value={node.shape.fill}
                  onChange={(e) => updateNodeProps(selectedId, { shape: { ...node.shape!, fill: e.target.value } })}
                  className="w-8 h-6 rounded border border-gray-700 bg-transparent cursor-pointer"
                />
                <span className="text-xs text-gray-500 font-mono">{node.shape.fill}</span>
              </div>
              {node.shape.cornerRadius !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Corners</span>
                  <input
                    type="number"
                    value={node.shape.cornerRadius}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v) && v >= 0) updateNodeProps(selectedId, { shape: { ...node.shape!, cornerRadius: v } });
                    }}
                    step={1}
                    min={0}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <span className="text-xs text-gray-600">px</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text properties */}
        {node.type === "text" && node.text && (
          <div>
            <label className="block text-xs text-gray-500 mb-2">Text</label>
            <div className="space-y-2">
              <textarea
                value={node.text.content}
                onChange={(e) => updateNodeProps(selectedId, { text: { ...node.text!, content: e.target.value } })}
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-14">Size</span>
                <input
                  type="number"
                  value={node.text.fontSize}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!isNaN(v) && v > 0) updateNodeProps(selectedId, { text: { ...node.text!, fontSize: v } });
                  }}
                  step={1}
                  min={1}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-xs text-gray-600">px</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-14">Color</span>
                <input
                  type="color"
                  value={node.text.fill}
                  onChange={(e) => updateNodeProps(selectedId, { text: { ...node.text!, fill: e.target.value } })}
                  className="w-8 h-6 rounded border border-gray-700 bg-transparent cursor-pointer"
                />
                <span className="text-xs text-gray-500 font-mono">{node.text.fill}</span>
              </div>
            </div>
          </div>
        )}

        {/* Transform fields */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">Position & Movement</label>
          <div className="space-y-2">
            <TransformRow
              label="X"
              value={node.transform.x}
              onChange={(v) => handleTransformChange("x", v)}
              onKeyframe={() => handleSetKeyframe("x")}
            />
            <TransformRow
              label="Y"
              value={node.transform.y}
              onChange={(v) => handleTransformChange("y", v)}
              onKeyframe={() => handleSetKeyframe("y")}
            />
            <TransformRow
              label="Rotation"
              value={node.transform.rotation}
              onChange={(v) => handleTransformChange("rotation", v)}
              onKeyframe={() => handleSetKeyframe("rotation")}
              step={1}
              suffix="deg"
            />
            <TransformRow
              label="Width Scale"
              value={node.transform.scaleX}
              onChange={(v) => handleTransformChange("scaleX", v)}
              onKeyframe={() => handleSetKeyframe("scaleX")}
              step={0.01}
            />
            <TransformRow
              label="Height Scale"
              value={node.transform.scaleY}
              onChange={(v) => handleTransformChange("scaleY", v)}
              onKeyframe={() => handleSetKeyframe("scaleY")}
              step={0.01}
            />
            <TransformRow
              label="Opacity"
              value={node.transform.opacity}
              onChange={(v) => handleTransformChange("opacity", v)}
              onKeyframe={() => handleSetKeyframe("opacity")}
              step={0.01}
              min={0}
              max={1}
            />
          </div>
        </div>

        {/* Layer selection */}
        <div>
          <label htmlFor="layer-select" className="block text-xs text-gray-500 mb-1">Layer</label>
          <select
            id="layer-select"
            value={node.layer}
            onChange={(e) => updateNodeProps(selectedId, { layer: e.target.value as "background" | "normal" | "foreground" })}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="background">Behind</option>
            <option value="normal">Middle</option>
            <option value="foreground">In Front</option>
          </select>
        </div>

        {/* Label visibility */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-label"
            checked={node.showLabel}
            onChange={(e) => updateNodeProps(selectedId, { showLabel: e.target.checked })}
            className="rounded border border-gray-600 bg-gray-800 cursor-pointer"
          />
          <label htmlFor="show-label" className="text-xs text-gray-500 cursor-pointer">Show label</label>
        </div>
      </div>
    </div>
  );
}

function TransformRow({
  label,
  value,
  onChange,
  onKeyframe,
  step = 1,
  min,
  max,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onKeyframe: () => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
      <input
        type="number"
        value={Math.round(value * 100) / 100}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
        step={step}
        min={min}
        max={max}
        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix && <span className="text-xs text-gray-600">{suffix}</span>}
      <button
        onClick={onKeyframe}
        className="p-1 rounded text-gray-500 hover:text-yellow-400 hover:bg-gray-800 transition-colors"
        title="Add animation point"
      >
        <KeySquare className="w-3 h-3" />
      </button>
    </div>
  );
}
