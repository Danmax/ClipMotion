import { nanoid } from "nanoid";
import type { TimelineClip, TimelineComposition } from "./types";

export interface SceneRef {
  id: string;
  order: number;
}

export interface ResolvedClipTime {
  clip: TimelineClip;
  localTimeMs: number;
}

export function clipEndMs(clip: TimelineClip): number {
  return clip.startMs + clip.durationMs;
}

export function sortClips(clips: TimelineClip[]): TimelineClip[] {
  return [...clips].sort((a, b) => {
    if (a.startMs !== b.startMs) return a.startMs - b.startMs;
    if (a.trackIndex !== b.trackIndex) return a.trackIndex - b.trackIndex;
    return a.id.localeCompare(b.id);
  });
}

export function computeCompositionDuration(composition: TimelineComposition): number {
  if (composition.clips.length === 0) return 0;
  return composition.clips.reduce((max, clip) => Math.max(max, clipEndMs(clip)), 0);
}

export function resolveClipAtGlobalTime(
  composition: TimelineComposition,
  globalTimeMs: number
): ResolvedClipTime | null {
  const clips = sortClips(composition.clips);
  if (clips.length === 0) return null;

  const t = Math.max(0, globalTimeMs);

  for (const clip of clips) {
    if (t >= clip.startMs && t < clipEndMs(clip)) {
      return {
        clip,
        localTimeMs: clip.trimInMs + (t - clip.startMs),
      };
    }
  }

  const last = clips[clips.length - 1];
  if (t >= clipEndMs(last)) {
    return {
      clip: last,
      localTimeMs: last.trimInMs + last.durationMs,
    };
  }

  return null;
}

export function createSingleClipComposition(
  sceneId: string,
  durationMs: number
): TimelineComposition {
  return {
    version: 1,
    clips: [
      {
        id: nanoid(),
        sceneId,
        startMs: 0,
        durationMs: Math.max(1, durationMs),
        trimInMs: 0,
        trackIndex: 0,
      },
    ],
  };
}

export function createCompositionFromScenes(
  scenes: SceneRef[],
  defaultClipDurationMs: number
): TimelineComposition {
  if (scenes.length === 0) return { version: 1, clips: [] };

  const clipDuration = Math.max(1, defaultClipDurationMs);
  const ordered = [...scenes].sort((a, b) => a.order - b.order);
  let cursorMs = 0;

  const clips: TimelineClip[] = ordered.map((scene) => {
    const clip: TimelineClip = {
      id: nanoid(),
      sceneId: scene.id,
      startMs: cursorMs,
      durationMs: clipDuration,
      trimInMs: 0,
      trackIndex: 0,
    };
    cursorMs += clipDuration;
    return clip;
  });

  return { version: 1, clips };
}

export function normalizeComposition(composition: TimelineComposition): TimelineComposition {
  return {
    version: 1,
    clips: sortClips(
      composition.clips.map((clip) => ({
        ...clip,
        startMs: Math.max(0, clip.startMs),
        durationMs: Math.max(1, clip.durationMs),
        trimInMs: Math.max(0, clip.trimInMs),
        trackIndex: Math.max(0, Math.floor(clip.trackIndex)),
      }))
    ),
  };
}
