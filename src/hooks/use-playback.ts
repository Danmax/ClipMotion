"use client";

import { useEffect, useRef } from "react";
import { usePlaybackStore } from "@/store/playback-store";
import { useEditorStore } from "@/store/editor-store";

/**
 * Drives the playback loop using requestAnimationFrame.
 * Advances currentTimeMs based on real elapsed time and playback speed.
 * Handles looping and end-of-clip behavior.
 */
export function usePlayback() {
  const rafRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  // Keep a store subscription so this hook re-renders when project timing changes.
  useEditorStore((s) => s.durationMs);
  useEditorStore((s) => s.fps);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimestampRef.current = null;
      return;
    }

    const tick = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const playbackState = usePlaybackStore.getState();
      const editorState = useEditorStore.getState();

      const deltaMs = (timestamp - lastTimestampRef.current) * playbackState.playbackSpeed;
      lastTimestampRef.current = timestamp;

      const startMs = playbackState.loopRegion?.startMs ?? 0;
      const endMs = playbackState.loopRegion?.endMs ?? editorState.durationMs;

      let nextTime = playbackState.currentTimeMs + deltaMs;

      if (nextTime >= endMs) {
        if (playbackState.loopEnabled) {
          nextTime = startMs + (nextTime - endMs);
        } else {
          nextTime = endMs;
          playbackState.pause();
        }
      }

      // Snap to frame boundaries for consistent playback
      const frameDuration = 1000 / editorState.fps;
      const snapped = Math.round(nextTime / frameDuration) * frameDuration;
      playbackState.setCurrentTime(snapped);

      rafRef.current = requestAnimationFrame(tick);
    };

    lastTimestampRef.current = null;
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimestampRef.current = null;
    };
  }, [isPlaying]);
}
