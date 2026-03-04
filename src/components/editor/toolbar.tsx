"use client";

import {
  Play,
  Pause,
  Square,
  Undo2,
  Redo2,
  MousePointer2,
  Move,
  RotateCw,
  Maximize2,
  Download,
  Save,
} from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { usePlaybackStore } from "@/store/playback-store";
import { useUIStore, type ToolId, type AspectRatio } from "@/store/ui-store";
import { useHistoryStore } from "@/store/history-store";
import { useState } from "react";
import { FPS_OPTIONS } from "@/lib/constants";
import { formatTimecode } from "@/engine/time-utils";
import Link from "next/link";

const TOOLS: { id: ToolId; icon: React.ElementType; label: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "move", icon: Move, label: "Move" },
  { id: "rotate", icon: RotateCw, label: "Rotate" },
  { id: "scale", icon: Maximize2, label: "Scale" },
];

const ASPECT_RATIOS: { ratio: AspectRatio; label: string; width: number; height: number }[] = [
  { ratio: "1:1", label: "Square", width: 1080, height: 1080 },
  { ratio: "3:4", label: "Portrait", width: 810, height: 1080 },
  { ratio: "16:9", label: "Landscape", width: 1920, height: 1080 },
  { ratio: "9:16", label: "Mobile", width: 1080, height: 1920 },
];

interface ToolbarProps {
  onSave: () => void;
  saving: boolean;
}

export function Toolbar({ onSave, saving }: ToolbarProps) {
  const [showAspectRatioMenu, setShowAspectRatioMenu] = useState(false);

  const projectName = useEditorStore((s) => s.projectName);
  const fps = useEditorStore((s) => s.fps);
  const durationMs = useEditorStore((s) => s.durationMs);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const setFps = useEditorStore((s) => s.setFps);
  const setCanvasDimensions = useEditorStore((s) => s.setCanvasDimensions);

  const currentTimeMs = usePlaybackStore((s) => s.currentTimeMs);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const togglePlay = usePlaybackStore((s) => s.togglePlay);
  const stop = usePlaybackStore((s) => s.stop);

  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const aspectRatio = useUIStore((s) => s.aspectRatio);
  const setAspectRatio = useUIStore((s) => s.setAspectRatio);

  // Determine current aspect ratio based on canvas dimensions
  const currentRatio = ASPECT_RATIOS.find(
    (ar) => ar.width === canvasWidth && ar.height === canvasHeight
  )?.ratio || aspectRatio;

  const handleAspectRatioChange = (newRatio: AspectRatio) => {
    const preset = ASPECT_RATIOS.find((ar) => ar.ratio === newRatio);
    if (preset) {
      setAspectRatio(newRatio);
      setCanvasDimensions(preset.width, preset.height);
      setShowAspectRatioMenu(false);
    }
  };

  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const undoStack = useHistoryStore((s) => s.undoStack);
  const redoStack = useHistoryStore((s) => s.redoStack);
  const dirty = useEditorStore((s) => s.dirty);

  return (
    <div className="h-12 border-b border-gray-800 bg-gray-900 flex items-center px-3 gap-2 shrink-0">
      {/* Logo / Back */}
      <Link
        href="/projects"
        className="text-sm font-bold text-blue-400 hover:text-blue-300 mr-2"
      >
        ClipMotion
      </Link>

      <span className="text-sm text-gray-400 truncate max-w-[150px]">
        {projectName}
      </span>
      {dirty && (
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Unsaved changes" />
      )}
      <button
        onClick={onSave}
        disabled={!dirty || saving}
        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Save (Ctrl+S)"
      >
        <Save className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-700 mx-2" />

      {/* Tools */}
      <div className="flex gap-0.5">
        {TOOLS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTool(id)}
            title={label}
            className={`p-1.5 rounded transition-colors ${
              activeTool === id
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-700 mx-2" />

      {/* Undo/Redo */}
      <button
        onClick={undo}
        disabled={undoStack.length === 0}
        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        onClick={redo}
        disabled={redoStack.length === 0}
        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-700 mx-2" />

      {/* Playback controls */}
      <button
        onClick={togglePlay}
        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        title={isPlaying ? "Pause (Space)" : "Play (Space)"}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <button
        onClick={stop}
        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        title="Stop"
      >
        <Square className="w-4 h-4" />
      </button>

      {/* Timecode */}
      <span className="text-xs font-mono text-gray-400 w-20 text-center">
        {formatTimecode(currentTimeMs, fps)} / {formatTimecode(durationMs, fps)}
      </span>

      <div className="flex-1" />

      {/* Aspect ratio selector */}
      <div className="relative">
        <button
          onClick={() => setShowAspectRatioMenu(!showAspectRatioMenu)}
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
          title="Canvas aspect ratio"
        >
          {ASPECT_RATIOS.find(ar => ar.ratio === currentRatio)?.label || currentRatio}
        </button>

        {showAspectRatioMenu && (
          <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50">
            {ASPECT_RATIOS.map(({ ratio, label }) => (
              <button
                key={ratio}
                onClick={() => handleAspectRatioChange(ratio)}
                className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                  currentRatio === ratio
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700"
                } first:rounded-t last:rounded-b`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Export */}
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors">
        <Download className="w-3.5 h-3.5" />
        Export
      </button>
    </div>
  );
}
