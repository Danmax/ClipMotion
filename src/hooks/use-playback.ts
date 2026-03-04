"use client";

import { useEffect, useRef, useCallback } from "react";
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
  const currentTimeMs = usePlaybackStore((s) => s.currentTimeMs);
  const loopEnabled = usePlaybackStore((s) => s.loopEnabled);
  const loopRegion = usePlaybackStore((s) => s.loopRegion);
  const playbackSpeed = usePlaybackStore((s) => s.playbackSpeed);
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime);
  const pause = usePlaybackStore((s) => s.pause);

  const durationMs = useEditorStore((s) => s.durationMs);
  const fps = useEditorStore((s) => s.fps);

  const tick = useCallback(
    (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const deltaMs = (timestamp - lastTimestampRef.current) * playbackSpeed;
      lastTimestampRef.current = timestamp;

      const startMs = loopRegion?.startMs ?? 0;
      const endMs = loopRegion?.endMs ?? durationMs;

      let nextTime = currentTimeMs + deltaMs;

      if (nextTime >= endMs) {
        if (loopEnabled) {
          nextTime = startMs + (nextTime - endMs);
        } else {
          nextTime = endMs;
          pause();
        }
      }

      // Snap to frame boundaries for consistent playback
      const frameDuration = 1000 / fps;
      const snapped = Math.round(nextTime / frameDuration) * frameDuration;
      setCurrentTime(snapped);

      rafRef.current = requestAnimationFrame(tick);
    },
    [currentTimeMs, durationMs, fps, loopEnabled, loopRegion, pause, playbackSpeed, setCurrentTime]
  );

  useEffect(() => {
    if (isPlaying) {
      lastTimestampRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimestampRef.current = null;
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, tick]);
}
