"use client";

import { useEffect } from "react";
import { useHistoryStore } from "@/store/history-store";
import { usePlaybackStore } from "@/store/playback-store";
import { useSelectionStore } from "@/store/selection-store";
import { useEditorStore } from "@/store/editor-store";
import { useUIStore } from "@/store/ui-store";
import type { ToolId } from "@/store/ui-store";

/**
 * Global keyboard shortcut handler for the editor.
 * Attaches to window keydown events.
 */
export function useKeyboardShortcuts(onSave?: () => void | Promise<boolean>) {
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const togglePlay = usePlaybackStore((s) => s.togglePlay);
  const stop = usePlaybackStore((s) => s.stop);
  const currentTimeMs = usePlaybackStore((s) => s.currentTimeMs);
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime);
  const selectedNodeIds = useSelectionStore((s) => s.selectedNodeIds);
  const clearAll = useSelectionStore((s) => s.clearAll);
  const removeNodeById = useEditorStore((s) => s.removeNodeById);
  const duplicateNodeById = useEditorStore((s) => s.duplicateNodeById);
  const fps = useEditorStore((s) => s.fps);
  const durationMs = useEditorStore((s) => s.durationMs);
  const setActiveTool = useUIStore((s) => s.setActiveTool);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true"
      ) {
        return;
      }

      const mod = e.metaKey || e.ctrlKey;

      // Save: Ctrl+S
      if (mod && e.key === "s") {
        e.preventDefault();
        void onSave?.();
        return;
      }

      // Undo: Ctrl+Z
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((mod && e.key === "z" && e.shiftKey) || (mod && e.key === "y")) {
        e.preventDefault();
        redo();
        return;
      }

      // Play/Pause: Space
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        togglePlay();
        return;
      }

      // Stop: Escape
      if (e.key === "Escape") {
        stop();
        clearAll();
        return;
      }

      // Nudge playhead frame by frame
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        const frameMs = 1000 / fps;
        const next =
          e.key === "ArrowLeft"
            ? Math.max(0, currentTimeMs - frameMs)
            : Math.min(durationMs, currentTimeMs + frameMs);
        setCurrentTime(next);
        return;
      }

      // Delete selected nodes: Delete or Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeIds.size > 0) {
          e.preventDefault();
          for (const id of selectedNodeIds) {
            removeNodeById(id);
          }
          clearAll();
        }
        return;
      }

      // Duplicate: Ctrl+D
      if (mod && e.key === "d") {
        e.preventDefault();
        for (const id of selectedNodeIds) {
          duplicateNodeById(id);
        }
        return;
      }

      // Tool shortcuts (no modifier)
      if (!mod) {
        const toolMap: Record<string, ToolId> = {
          v: "select",
          g: "move",
          r: "rotate",
          s: "scale",
          b: "bone",
        };
        if (e.key in toolMap) {
          setActiveTool(toolMap[e.key]);
          return;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    undo,
    redo,
    togglePlay,
    stop,
    currentTimeMs,
    setCurrentTime,
    selectedNodeIds,
    clearAll,
    removeNodeById,
    duplicateNodeById,
    fps,
    durationMs,
    setActiveTool,
    onSave,
  ]);
}
