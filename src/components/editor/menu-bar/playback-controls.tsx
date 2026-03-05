"use client";

import { Play, Pause, Square } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { usePlaybackStore } from "@/store/playback-store";
import { formatTimecode } from "@/engine/time-utils";

export function PlaybackControls() {
  const fps = useEditorStore((s) => s.fps);
  const durationMs = useEditorStore((s) => s.durationMs);
  const currentTimeMs = usePlaybackStore((s) => s.currentTimeMs);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const togglePlay = usePlaybackStore((s) => s.togglePlay);
  const stop = usePlaybackStore((s) => s.stop);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={togglePlay}
        className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-white transition-colors"
        title={isPlaying ? "Pause (Space)" : "Play (Space)"}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <button
        onClick={stop}
        className="p-1.5 rounded text-gray-500 hover:text-gray-900 hover:bg-white transition-colors"
        title="Stop"
      >
        <Square className="w-4 h-4" />
      </button>
      <span className="text-xs font-mono text-gray-600 w-20 text-center">
        {formatTimecode(currentTimeMs, fps)} / {formatTimecode(durationMs, fps)}
      </span>
    </div>
  );
}
