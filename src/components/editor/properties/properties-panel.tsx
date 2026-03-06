"use client";

import { KeySquare, Plus } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { usePlaybackStore } from "@/store/playback-store";
import { useSelectionStore } from "@/store/selection-store";
import type {
  AnimatableProperty,
  EasingDefinition,
  EyeStyle,
  MouthStyle,
  ExpressionPreset,
  EyebrowStyle,
  MouthEffect,
  SceneNode,
} from "@/engine/types";
import { DEFAULT_FACE } from "@/engine/types";
import { EXPRESSION_PRESETS, applyPreset } from "@/engine/face-presets";
import { AnimationSection } from "./animation-section";
import { ANIMATABLE_PROPERTIES } from "@/engine/types";
import { EASING_PRESETS } from "@/engine/easing";

const KEYFRAME_EASING_OPTIONS: { id: string; label: string; easing: EasingDefinition }[] = [
  { id: "linear", label: "Linear", easing: EASING_PRESETS.linear },
  { id: "easeIn", label: "Ease In", easing: EASING_PRESETS.easeIn },
  { id: "easeOut", label: "Ease Out", easing: EASING_PRESETS.easeOut },
  { id: "easeInOut", label: "Ease In Out", easing: EASING_PRESETS.easeInOut },
  { id: "step", label: "Step", easing: EASING_PRESETS.step },
];

function isSameEasing(a: EasingDefinition, b: EasingDefinition): boolean {
  if (a.type !== b.type) return false;
  if (a.type !== "cubicBezier") return true;
  if (!a.controlPoints || !b.controlPoints) return false;
  return a.controlPoints.every((v, i) => Math.abs(v - b.controlPoints![i]) < 0.0001);
}

function getNodeAnimatableValue(
  node: SceneNode,
  property: AnimatableProperty
): number {
  if (property === "parallaxFactor") return node.parallaxFactor ?? 0;
  return node.transform[property];
}

export function PropertiesPanel() {
  const document = useEditorStore((s) => s.document);
  const updateNodeTransform = useEditorStore((s) => s.updateNodeTransform);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const setKeyframeAt = useEditorStore((s) => s.setKeyframeAt);
  const removeKeyframeById = useEditorStore((s) => s.removeKeyframeById);
  const moveKeyframeTo = useEditorStore((s) => s.moveKeyframeTo);
  const updateKeyframeEasingById = useEditorStore((s) => s.updateKeyframeEasingById);
  const setExpressionKeyframeAt = useEditorStore((s) => s.setExpressionKeyframeAt);
  const currentTimeMs = usePlaybackStore((s) => s.currentTimeMs);
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime);
  const selectedNodeIds = useSelectionStore((s) => s.selectedNodeIds);
  const selectedKeyframe = useSelectionStore((s) => s.selectedKeyframe);
  const setSelectedKeyframe = useSelectionStore((s) => s.setSelectedKeyframe);

  const selectedId = [...selectedNodeIds][0];
  const node = selectedId ? document.nodes[selectedId] : null;
  const face = node?.face ? { ...DEFAULT_FACE, ...node.face } : null;

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
    setKeyframeAt(selectedId, prop, currentTimeMs, getNodeAnimatableValue(node, prop));
  };

  const handleSetExpressionKeyframe = () => {
    if (!face) return;
    setExpressionKeyframeAt(selectedId, currentTimeMs, face);
  };

  const handleSetAllTransformKeyframes = () => {
    for (const prop of ANIMATABLE_PROPERTIES) {
      setKeyframeAt(selectedId, prop, currentTimeMs, getNodeAnimatableValue(node, prop));
    }
  };

  const keyframeTrack = selectedKeyframe && selectedKeyframe.nodeId === selectedId
    ? document.animations[selectedId]?.tracks[selectedKeyframe.property]
    : undefined;
  const activeKeyframe =
    selectedKeyframe && keyframeTrack
      ? keyframeTrack.keyframes.find((kf) => kf.id === selectedKeyframe.keyframeId)
      : undefined;

  const activeKeyframeEasingId =
    activeKeyframe
      ? KEYFRAME_EASING_OPTIONS.find((opt) => isSameEasing(opt.easing, activeKeyframe.easing))?.id ?? "linear"
      : "linear";

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
              {!face ? (
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
            {face && (
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-600 block">Expression</span>
                    <button
                      onClick={handleSetExpressionKeyframe}
                      className="text-[10px] text-yellow-400 hover:text-yellow-300 flex items-center gap-0.5"
                      title="Add expression keyframe at playhead"
                    >
                      <KeySquare className="w-3 h-3" />
                      Key Expr
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(Object.keys(EXPRESSION_PRESETS) as ExpressionPreset[]).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => updateNodeProps(selectedId, { face: applyPreset(preset) })}
                        className={`text-[10px] px-1.5 py-1 rounded capitalize ${
                          face.expression === preset
                            ? "bg-blue-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  <div className="mt-1 text-[10px] text-gray-600">
                    {node.faceKeyframes?.length ?? 0} expression keys
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Eyes</span>
                  <select
                    value={face.eyeStyle}
                    onChange={(e) =>
                      updateNodeProps(selectedId, {
                        face: { ...face, eyeStyle: e.target.value as EyeStyle },
                      })
                    }
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {(
                      [
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
                      ] as const
                    ).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Eye Size</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={face.eyeSize}
                    onChange={(e) =>
                      updateNodeProps(selectedId, {
                        face: { ...face, eyeSize: parseFloat(e.target.value) },
                      })
                    }
                    className="flex-1 accent-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Eye Gap</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={face.eyeSpacing}
                    onChange={(e) =>
                      updateNodeProps(selectedId, {
                        face: { ...face, eyeSpacing: parseFloat(e.target.value) },
                      })
                    }
                    className="flex-1 accent-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Brows</span>
                  <select
                    value={face.eyebrowStyle}
                    onChange={(e) =>
                      updateNodeProps(selectedId, {
                        face: { ...face, eyebrowStyle: e.target.value as EyebrowStyle },
                      })
                    }
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {(["none", "line", "arc", "angry", "sad"] as const).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Brow Tilt</span>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={face.eyebrowTilt}
                    onChange={(e) =>
                      updateNodeProps(selectedId, {
                        face: { ...face, eyebrowTilt: parseFloat(e.target.value) },
                      })
                    }
                    className="flex-1 accent-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Mouth</span>
                  <select
                    value={face.mouthStyle}
                    onChange={(e) =>
                      updateNodeProps(selectedId, {
                        face: { ...face, mouthStyle: e.target.value as MouthStyle },
                      })
                    }
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {(
                      [
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
                      ] as const
                    ).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Curve</span>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={face.mouthCurve}
                    onChange={(e) =>
                      updateNodeProps(selectedId, {
                        face: { ...face, mouthCurve: parseFloat(e.target.value) },
                      })
                    }
                    className="flex-1 accent-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Effect</span>
                  <select
                    value={face.mouthEffect}
                    onChange={(e) =>
                      updateNodeProps(selectedId, {
                        face: { ...face, mouthEffect: e.target.value as MouthEffect },
                      })
                    }
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {(["none", "talk"] as const).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                {face.mouthEffect === "talk" && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-14">Talk Spd</span>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        step="0.5"
                        value={face.mouthTalkSpeed}
                        onChange={(e) =>
                          updateNodeProps(selectedId, {
                            face: { ...face, mouthTalkSpeed: parseFloat(e.target.value) },
                          })
                        }
                        className="flex-1 accent-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-14">Talk Amt</span>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={face.mouthTalkAmount}
                        onChange={(e) =>
                          updateNodeProps(selectedId, {
                            face: { ...face, mouthTalkAmount: parseFloat(e.target.value) },
                          })
                        }
                        className="flex-1 accent-blue-500"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14">Scale</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={face.faceScale}
                    onChange={(e) =>
                      updateNodeProps(selectedId, {
                        face: { ...face, faceScale: parseFloat(e.target.value) },
                      })
                    }
                    className="flex-1 accent-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-600">Eye</span>
                    <input
                      type="color"
                      value={face.eyeColor}
                      onChange={(e) =>
                        updateNodeProps(selectedId, { face: { ...face, eyeColor: e.target.value } })
                      }
                      className="w-6 h-5 rounded border border-gray-700 bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-600">Brow</span>
                    <input
                      type="color"
                      value={face.eyebrowColor}
                      onChange={(e) =>
                        updateNodeProps(selectedId, { face: { ...face, eyebrowColor: e.target.value } })
                      }
                      className="w-6 h-5 rounded border border-gray-700 bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-600">Mouth</span>
                    <input
                      type="color"
                      value={face.mouthColor}
                      onChange={(e) =>
                        updateNodeProps(selectedId, { face: { ...face, mouthColor: e.target.value } })
                      }
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs text-gray-500">Position & Transform</label>
            <button
              onClick={handleSetAllTransformKeyframes}
              className="text-[10px] text-yellow-400 hover:text-yellow-300 flex items-center gap-0.5"
              title="Add keyframes for all transform properties at playhead"
            >
              <Plus className="w-3 h-3" />
              Key All
            </button>
          </div>
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

        {/* Selected keyframe editing */}
        <div>
          <label className="block text-xs text-gray-500 mb-2">Keyframe Properties</label>
          {activeKeyframe && selectedKeyframe ? (
            <div className="space-y-2 rounded border border-gray-700 bg-gray-800/70 p-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-300">Property</span>
                <span className="text-[11px] text-yellow-300">{selectedKeyframe.property}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-20">Time (ms)</span>
                <input
                  type="number"
                  value={Math.round(activeKeyframe.timeMs)}
                  min={0}
                  step={1}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (Number.isNaN(v)) return;
                    const nextTimeMs = Math.max(0, v);
                    moveKeyframeTo(selectedId, selectedKeyframe.property, selectedKeyframe.keyframeId, nextTimeMs);
                    setCurrentTime(nextTimeMs);
                    setSelectedKeyframe({
                      ...selectedKeyframe,
                      timeMs: nextTimeMs,
                    });
                  }}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-20">Value</span>
                <input
                  type="number"
                  value={Math.round(activeKeyframe.value * 1000) / 1000}
                  step={selectedKeyframe.property === "opacity" ? 0.01 : 0.1}
                  min={selectedKeyframe.property === "opacity" ? 0 : undefined}
                  max={selectedKeyframe.property === "opacity" ? 1 : undefined}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (Number.isNaN(v)) return;
                    const nextValue = selectedKeyframe.property === "opacity"
                      ? Math.max(0, Math.min(1, v))
                      : v;
                    setKeyframeAt(
                      selectedId,
                      selectedKeyframe.property,
                      activeKeyframe.timeMs,
                      nextValue,
                      activeKeyframe.easing
                    );
                    setSelectedKeyframe({
                      ...selectedKeyframe,
                      value: nextValue,
                    });
                  }}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-20">Easing</span>
                <select
                  value={activeKeyframeEasingId}
                  onChange={(e) => {
                    const next = KEYFRAME_EASING_OPTIONS.find((opt) => opt.id === e.target.value);
                    if (!next) return;
                    updateKeyframeEasingById(
                      selectedId,
                      selectedKeyframe.property,
                      selectedKeyframe.keyframeId,
                      next.easing
                    );
                    setSelectedKeyframe({
                      ...selectedKeyframe,
                      easing: next.easing,
                    });
                  }}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {KEYFRAME_EASING_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  removeKeyframeById(selectedId, selectedKeyframe.property, selectedKeyframe.keyframeId);
                  setSelectedKeyframe(null);
                }}
                className="w-full rounded border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-300 hover:bg-red-500/20 transition-colors"
              >
                Remove Keyframe
              </button>
            </div>
          ) : (
            <div className="rounded border border-dashed border-gray-700 p-2 text-[11px] text-gray-500">
              Click a keyframe in timeline to edit its properties.
            </div>
          )}
        </div>

        {/* Animations */}
        <AnimationSection
          nodeId={selectedId}
          animation={document.animations[selectedId]}
        />

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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="parallax-factor" className="block text-xs text-gray-500">Parallax</label>
            <button
              onClick={() => handleSetKeyframe("parallaxFactor")}
              className="text-[10px] text-yellow-400 hover:text-yellow-300 flex items-center gap-0.5"
              title="Add parallax keyframe at playhead"
            >
              <KeySquare className="w-3 h-3" />
              Key
            </button>
          </div>
          <input
            id="parallax-factor"
            type="number"
            value={node.parallaxFactor ?? 0}
            min={-2}
            max={2}
            step={0.05}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) {
                updateNodeProps(selectedId, { parallaxFactor: Math.max(-2, Math.min(2, v)) });
              }
            }}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <p className="mt-1 text-[10px] text-gray-600">0 = static. Foreground usually uses higher values.</p>
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
  onKeyframe?: () => void;
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
      {onKeyframe && (
        <button
          onClick={onKeyframe}
          className="p-1 rounded text-gray-500 hover:text-yellow-400 hover:bg-gray-800 transition-colors"
          title="Add keyframe at playhead"
        >
          <KeySquare className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
