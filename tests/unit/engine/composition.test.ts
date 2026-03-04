import { describe, it, expect } from "vitest";
import {
  sortClips,
  computeCompositionDuration,
  resolveClipAtGlobalTime,
  createSingleClipComposition,
  createCompositionFromScenes,
  normalizeComposition,
} from "@/engine/composition";
import type { TimelineComposition } from "@/engine/types";

describe("composition", () => {
  it("sorts clips by start time and track index", () => {
    const sorted = sortClips([
      { id: "b", sceneId: "s2", startMs: 1000, durationMs: 500, trimInMs: 0, trackIndex: 1 },
      { id: "a", sceneId: "s1", startMs: 0, durationMs: 500, trimInMs: 0, trackIndex: 0 },
      { id: "c", sceneId: "s3", startMs: 1000, durationMs: 500, trimInMs: 0, trackIndex: 0 },
    ]);

    expect(sorted.map((c) => c.id)).toEqual(["a", "c", "b"]);
  });

  it("computes composition duration from furthest clip end", () => {
    const composition: TimelineComposition = {
      version: 1,
      clips: [
        { id: "a", sceneId: "s1", startMs: 0, durationMs: 1200, trimInMs: 0, trackIndex: 0 },
        { id: "b", sceneId: "s2", startMs: 2000, durationMs: 800, trimInMs: 0, trackIndex: 0 },
      ],
    };

    expect(computeCompositionDuration(composition)).toBe(2800);
  });

  it("resolves global time to clip local time", () => {
    const composition: TimelineComposition = {
      version: 1,
      clips: [
        { id: "a", sceneId: "s1", startMs: 1000, durationMs: 3000, trimInMs: 200, trackIndex: 0 },
      ],
    };

    const resolved = resolveClipAtGlobalTime(composition, 2500);
    expect(resolved?.clip.id).toBe("a");
    expect(resolved?.localTimeMs).toBe(1700);
  });

  it("resolves after the last clip to its end", () => {
    const composition: TimelineComposition = {
      version: 1,
      clips: [
        { id: "a", sceneId: "s1", startMs: 0, durationMs: 1000, trimInMs: 50, trackIndex: 0 },
      ],
    };

    const resolved = resolveClipAtGlobalTime(composition, 5000);
    expect(resolved?.localTimeMs).toBe(1050);
  });

  it("creates single-clip composition", () => {
    const composition = createSingleClipComposition("scene-1", 5000);
    expect(composition.clips).toHaveLength(1);
    expect(composition.clips[0].sceneId).toBe("scene-1");
    expect(composition.clips[0].startMs).toBe(0);
    expect(composition.clips[0].durationMs).toBe(5000);
  });

  it("creates sequential composition from ordered scenes", () => {
    const composition = createCompositionFromScenes(
      [
        { id: "s2", order: 1 },
        { id: "s1", order: 0 },
      ],
      2000
    );

    expect(composition.clips.map((c) => c.sceneId)).toEqual(["s1", "s2"]);
    expect(composition.clips.map((c) => c.startMs)).toEqual([0, 2000]);
  });

  it("normalizes invalid values", () => {
    const normalized = normalizeComposition({
      version: 1,
      clips: [
        { id: "a", sceneId: "s1", startMs: -100, durationMs: 0, trimInMs: -10, trackIndex: -3 },
      ],
    });

    expect(normalized.clips[0].startMs).toBe(0);
    expect(normalized.clips[0].durationMs).toBe(1);
    expect(normalized.clips[0].trimInMs).toBe(0);
    expect(normalized.clips[0].trackIndex).toBe(0);
  });
});
