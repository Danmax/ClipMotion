"use client";

import { useState } from "react";
import { Undo2, Redo2, Save, Download } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { useHistoryStore } from "@/store/history-store";
import { usePlaybackStore } from "@/store/playback-store";
import { serializeScene } from "@/engine/serialization";
import { ProjectMenu } from "./project-menu";
import { ToolSelector } from "./tool-selector";
import { PlaybackControls } from "./playback-controls";

interface MenuBarProps {
  onSave: () => Promise<boolean>;
  saving: boolean;
}

type ExportFormat = "mp4" | "webm" | "gif" | "json";

function getSupportedRecorderMimeType(format: Extract<ExportFormat, "mp4" | "webm">): string | null {
  const candidates =
    format === "mp4"
      ? ["video/mp4;codecs=h264", "video/mp4"]
      : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];

  for (const mimeType of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return null;
}

export function MenuBar({ onSave, saving }: MenuBarProps) {
  const dirty = useEditorStore((s) => s.dirty);
  const projectName = useEditorStore((s) => s.projectName);
  const fps = useEditorStore((s) => s.fps);
  const durationMs = useEditorStore((s) => s.durationMs);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const undoStack = useHistoryStore((s) => s.undoStack);
  const redoStack = useHistoryStore((s) => s.redoStack);
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleManualSave = async () => {
    await onSave();
  };

  const handleExport = async (format: ExportFormat) => {
    if (exporting) return;
    setShowExportMenu(false);
    setExporting(true);
    try {
      await onSave();
      const state = useEditorStore.getState();
      const safeName = (projectName || "project")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "project";
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");

      if (format === "gif") {
        alert("GIF export is not available in-browser yet. Please use WebM or MP4.");
        return;
      }

      if (format === "mp4" || format === "webm") {
        const canvas = document.querySelector<HTMLCanvasElement>("#editor-canvas-viewport canvas");
        if (!canvas || typeof canvas.captureStream !== "function") {
          alert("Canvas export is unavailable. Reload the editor and try again.");
          return;
        }

        const mimeType = getSupportedRecorderMimeType(format);
        if (!mimeType) {
          alert(`${format.toUpperCase()} export is not supported in this browser. Try WebM.`);
          return;
        }

        const stream = canvas.captureStream(Math.max(1, fps));
        const chunks: BlobPart[] = [];
        const recorder = new MediaRecorder(stream, { mimeType });

        const playback = usePlaybackStore.getState();
        const prevPlaying = playback.isPlaying;
        const prevTime = playback.currentTimeMs;

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };

        const done = new Promise<void>((resolve) => {
          recorder.onstop = () => resolve();
        });

        playback.pause();
        playback.setCurrentTime(0);
        recorder.start(200);
        playback.play();

        await new Promise((resolve) => {
          window.setTimeout(resolve, Math.max(500, durationMs));
        });

        playback.pause();
        recorder.stop();
        await done;

        if (prevPlaying) {
          playback.play();
        } else {
          playback.pause();
        }
        playback.setCurrentTime(prevTime);

        const blob = new Blob(chunks, { type: mimeType });
        const ext = format === "mp4" ? "mp4" : "webm";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeName}-${stamp}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      const exportPayload = {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        project: {
          id: state.projectId,
          name: state.projectName,
          fps: state.fps,
          durationMs: state.durationMs,
          width: state.canvasWidth,
          height: state.canvasHeight,
          version: state.version,
          timelineData: state.timelineComposition,
        },
        scenes: state.sceneOrder
          .map((sceneId) => state.scenes[sceneId])
          .filter(Boolean)
          .map((scene) => ({
            id: scene.id,
            name: scene.name,
            order: scene.order,
            durationMs: scene.durationMs,
            data: serializeScene(scene.document),
          })),
      };

      const filename = `${safeName}-${stamp}.clipmotion.json`;

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-12 border-b border-[#dfe5eb] bg-[#f8fafc] flex items-center px-3 gap-2 shrink-0">
      {/* Left: Project + Save */}
      <ProjectMenu />

      <button
        onClick={handleManualSave}
        disabled={!dirty || saving}
        className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Save (Ctrl+S)"
      >
        <Save className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-[#d9e0e8] mx-1" />

      {/* Tools */}
      <ToolSelector />

      <div className="w-px h-6 bg-[#d9e0e8] mx-1" />

      {/* Undo/Redo */}
      <button
        onClick={undo}
        disabled={undoStack.length === 0}
        className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        onClick={redo}
        disabled={redoStack.length === 0}
        className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="flex-1" />

      {/* Center: Playback */}
      <PlaybackControls />

      <div className="flex-1" />

      {/* Right: Export */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu((v) => !v)}
          disabled={exporting || saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? "Exporting..." : "Export"}
        </button>

        {showExportMenu && !exporting && (
          <div className="absolute right-0 mt-2 w-40 rounded-lg border border-[#d9e0e8] bg-white shadow-lg overflow-hidden z-20">
            <button
              onClick={() => handleExport("mp4")}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#f4f7fb] transition-colors"
            >
              Export MP4
            </button>
            <button
              onClick={() => handleExport("webm")}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#f4f7fb] transition-colors"
            >
              Export WebM
            </button>
            <button
              onClick={() => handleExport("gif")}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-[#f4f7fb] transition-colors"
            >
              Export GIF
            </button>
            <button
              onClick={() => handleExport("json")}
              className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-[#f4f7fb] transition-colors border-t border-[#eef2f7]"
            >
              Export JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
