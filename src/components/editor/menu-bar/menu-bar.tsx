"use client";

import { Undo2, Redo2, Save, Download } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { useHistoryStore } from "@/store/history-store";
import { ProjectMenu } from "./project-menu";
import { ToolSelector } from "./tool-selector";
import { PlaybackControls } from "./playback-controls";

interface MenuBarProps {
  onSave: () => void;
  saving: boolean;
}

export function MenuBar({ onSave, saving }: MenuBarProps) {
  const dirty = useEditorStore((s) => s.dirty);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const undoStack = useHistoryStore((s) => s.undoStack);
  const redoStack = useHistoryStore((s) => s.redoStack);

  return (
    <div className="h-12 border-b border-gray-800 bg-gray-900 flex items-center px-3 gap-2 shrink-0">
      {/* Left: Project + Save */}
      <ProjectMenu />

      <button
        onClick={onSave}
        disabled={!dirty || saving}
        className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Save (Ctrl+S)"
      >
        <Save className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-700 mx-1" />

      {/* Tools */}
      <ToolSelector />

      <div className="w-px h-6 bg-gray-700 mx-1" />

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

      <div className="flex-1" />

      {/* Center: Playback */}
      <PlaybackControls />

      <div className="flex-1" />

      {/* Right: Export */}
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors">
        <Download className="w-3.5 h-3.5" />
        Export
      </button>
    </div>
  );
}
