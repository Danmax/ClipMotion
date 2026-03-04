"use client";

import { useState } from "react";
import { Plus, Trash2, Play } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { usePlaybackStore } from "@/store/playback-store";
import {
  ANIMATION_PRESETS,
  type AnimationPresetId,
} from "@/engine/animation-presets";
import { EASING_PRESETS } from "@/engine/easing";
import { AnimationPicker } from "./animation-picker";
import type { AnimatableProperty, NodeAnimation } from "@/engine/types";

interface AnimationSectionProps {
  nodeId: string;
  animation: NodeAnimation | undefined;
}

const EASING_OPTIONS = Object.keys(EASING_PRESETS) as (keyof typeof EASING_PRESETS)[];

/**
 * Detect which preset was applied by examining the keyframe pattern.
 * Returns a list of detected preset applications with their timing info.
 */
function detectAppliedPresets(animation: NodeAnimation | undefined): AppliedPresetInfo[] {
  if (!animation) return [];

  // Group tracks that have keyframes
  const activeTracks = Object.entries(animation.tracks).filter(
    ([, track]) => track && track.keyframes.length > 0
  );

  if (activeTracks.length === 0) return [];

  // Find the overall time range
  let minTime = Infinity;
  let maxTime = 0;
  for (const [, track] of activeTracks) {
    if (!track) continue;
    for (const kf of track.keyframes) {
      minTime = Math.min(minTime, kf.timeMs);
      maxTime = Math.max(maxTime, kf.timeMs);
    }
  }

  const properties = activeTracks.map(([prop]) => prop as AnimatableProperty);

  return [{
    properties,
    startMs: minTime === Infinity ? 0 : minTime,
    endMs: maxTime,
    durationMs: maxTime - (minTime === Infinity ? 0 : minTime),
    keyframeCount: activeTracks.reduce((sum, [, t]) => sum + (t?.keyframes.length ?? 0), 0),
  }];
}

interface AppliedPresetInfo {
  properties: AnimatableProperty[];
  startMs: number;
  endMs: number;
  durationMs: number;
  keyframeCount: number;
}

export function AnimationSection({ nodeId, animation }: AnimationSectionProps) {
  const [showPicker, setShowPicker] = useState(false);
  const applyPreset = useEditorStore((s) => s.applyPreset);
  const clearAnimations = useEditorStore((s) => s.clearAnimations);
  const togglePlay = usePlaybackStore((s) => s.togglePlay);

  const appliedPresets = detectAppliedPresets(animation);
  const hasAnimations = appliedPresets.length > 0 && appliedPresets[0].keyframeCount > 0;

  const handleAddPreset = (presetId: AnimationPresetId) => {
    applyPreset(nodeId, presetId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs text-gray-500">Animations</label>
        <div className="flex gap-1">
          {hasAnimations && (
            <>
              <button
                onClick={togglePlay}
                className="text-[10px] text-green-400 hover:text-green-300 flex items-center gap-0.5"
                title="Preview animation"
              >
                <Play className="w-3 h-3" />
              </button>
              <button
                onClick={() => clearAnimations(nodeId)}
                className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5"
                title="Remove all animations"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Applied animations display */}
      {hasAnimations && (
        <div className="space-y-1 mb-2">
          {appliedPresets.map((info, i) => (
            <div
              key={i}
              className="bg-gray-800 rounded px-2 py-1.5 border border-gray-700"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-300">
                  {info.properties.join(", ")}
                </span>
                <span className="text-[9px] text-gray-500">
                  {info.keyframeCount} keyframes
                </span>
              </div>
              <div className="text-[9px] text-gray-500 mt-0.5">
                {info.startMs}ms - {info.endMs}ms ({info.durationMs}ms)
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add animation button / picker */}
      {showPicker ? (
        <AnimationPicker
          onSelect={handleAddPreset}
          onClose={() => setShowPicker(false)}
        />
      ) : (
        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-center gap-1 py-1.5 rounded border border-dashed border-gray-700 text-[11px] text-gray-400 hover:text-gray-300 hover:border-gray-600 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Animation
        </button>
      )}
    </div>
  );
}
