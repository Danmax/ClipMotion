"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  ANIMATION_PRESETS,
  getPresetsByCategory,
  type AnimationPresetId,
} from "@/engine/animation-presets";

interface AnimationPickerProps {
  onSelect: (presetId: AnimationPresetId) => void;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  entrance: "Entrance",
  exit: "Exit",
  emphasis: "Emphasis",
  motion: "Motion",
};

export function AnimationPicker({ onSelect, onClose }: AnimationPickerProps) {
  const grouped = getPresetsByCategory();

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-300">Add Animation</span>
        <button
          onClick={onClose}
          className="p-0.5 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-700"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {Object.entries(grouped).map(([category, presets]) => (
        <div key={category}>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">
            {CATEGORY_LABELS[category] ?? category}
          </span>
          <div className="grid grid-cols-2 gap-1">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  onSelect(preset.id);
                  onClose();
                }}
                className="text-left px-2 py-1.5 rounded bg-gray-750 hover:bg-gray-700 transition-colors"
                title={preset.description}
              >
                <span className="text-[11px] text-gray-300 block">{preset.name}</span>
                <span className="text-[9px] text-gray-500">{preset.defaultDurationMs}ms</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
