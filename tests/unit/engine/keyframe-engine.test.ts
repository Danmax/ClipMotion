import { describe, it, expect } from "vitest";
import {
  interpolateProperty,
  sampleNodeAnimation,
  getEffectiveTransform,
  setKeyframe,
  removeKeyframe,
  moveKeyframe,
  getAllKeyframeTimes,
  getNodeKeyframeTimes,
} from "@/engine/keyframe-engine";
import { createSceneDocument, createNode, addNode } from "@/engine/scene-graph";
import type { KeyframeTrack, EasingDefinition } from "@/engine/types";

const LINEAR: EasingDefinition = { type: "linear" };

function makeTrack(keyframes: { timeMs: number; value: number }[]): KeyframeTrack {
  return {
    keyframes: keyframes.map((kf, i) => ({
      id: `kf${i}`,
      timeMs: kf.timeMs,
      value: kf.value,
      easing: LINEAR,
    })),
  };
}

describe("interpolateProperty", () => {
  it("should return undefined for empty track", () => {
    expect(interpolateProperty({ keyframes: [] }, 500)).toBeUndefined();
  });

  it("should hold first value before first keyframe", () => {
    const track = makeTrack([{ timeMs: 100, value: 50 }]);
    expect(interpolateProperty(track, 0)).toBe(50);
    expect(interpolateProperty(track, 50)).toBe(50);
  });

  it("should hold last value after last keyframe", () => {
    const track = makeTrack([
      { timeMs: 0, value: 0 },
      { timeMs: 1000, value: 100 },
    ]);
    expect(interpolateProperty(track, 1500)).toBe(100);
  });

  it("should interpolate linearly between keyframes", () => {
    const track = makeTrack([
      { timeMs: 0, value: 0 },
      { timeMs: 1000, value: 100 },
    ]);
    expect(interpolateProperty(track, 500)).toBeCloseTo(50);
    expect(interpolateProperty(track, 250)).toBeCloseTo(25);
    expect(interpolateProperty(track, 750)).toBeCloseTo(75);
  });

  it("should return exact values at keyframe times", () => {
    const track = makeTrack([
      { timeMs: 0, value: 10 },
      { timeMs: 500, value: 50 },
      { timeMs: 1000, value: 100 },
    ]);
    expect(interpolateProperty(track, 0)).toBe(10);
    expect(interpolateProperty(track, 500)).toBe(50);
    expect(interpolateProperty(track, 1000)).toBe(100);
  });

  it("should interpolate between non-zero-start keyframes", () => {
    const track = makeTrack([
      { timeMs: 200, value: 20 },
      { timeMs: 800, value: 80 },
    ]);
    expect(interpolateProperty(track, 500)).toBeCloseTo(50);
  });

  it("should handle single keyframe", () => {
    const track = makeTrack([{ timeMs: 500, value: 42 }]);
    expect(interpolateProperty(track, 0)).toBe(42);
    expect(interpolateProperty(track, 500)).toBe(42);
    expect(interpolateProperty(track, 1000)).toBe(42);
  });
});

describe("sampleNodeAnimation", () => {
  it("should return empty object for undefined animation", () => {
    expect(sampleNodeAnimation(undefined, 500)).toEqual({});
  });

  it("should sample all animated properties", () => {
    const result = sampleNodeAnimation(
      {
        nodeId: "n1",
        tracks: {
          x: makeTrack([
            { timeMs: 0, value: 0 },
            { timeMs: 1000, value: 100 },
          ]),
          y: makeTrack([
            { timeMs: 0, value: 0 },
            { timeMs: 1000, value: 200 },
          ]),
        },
      },
      500
    );
    expect(result.x).toBeCloseTo(50);
    expect(result.y).toBeCloseTo(100);
  });
});

describe("setKeyframe", () => {
  it("should add a keyframe to an empty document", () => {
    let doc = createSceneDocument();
    const node = createNode("Test", "sprite");
    doc = addNode(doc, node, doc.rootNodeId);

    doc = setKeyframe(doc, node.id, "x", 0, 100);

    expect(doc.animations[node.id]).toBeTruthy();
    expect(doc.animations[node.id].tracks.x).toBeTruthy();
    expect(doc.animations[node.id].tracks.x!.keyframes).toHaveLength(1);
    expect(doc.animations[node.id].tracks.x!.keyframes[0].value).toBe(100);
    expect(doc.animations[node.id].tracks.x!.keyframes[0].timeMs).toBe(0);
  });

  it("should maintain sorted keyframe order", () => {
    let doc = createSceneDocument();
    const node = createNode("Test", "sprite");
    doc = addNode(doc, node, doc.rootNodeId);

    doc = setKeyframe(doc, node.id, "x", 1000, 100);
    doc = setKeyframe(doc, node.id, "x", 0, 0);
    doc = setKeyframe(doc, node.id, "x", 500, 50);

    const kfs = doc.animations[node.id].tracks.x!.keyframes;
    expect(kfs[0].timeMs).toBe(0);
    expect(kfs[1].timeMs).toBe(500);
    expect(kfs[2].timeMs).toBe(1000);
  });

  it("should update existing keyframe at same time", () => {
    let doc = createSceneDocument();
    const node = createNode("Test", "sprite");
    doc = addNode(doc, node, doc.rootNodeId);

    doc = setKeyframe(doc, node.id, "x", 0, 100);
    doc = setKeyframe(doc, node.id, "x", 0, 200);

    expect(doc.animations[node.id].tracks.x!.keyframes).toHaveLength(1);
    expect(doc.animations[node.id].tracks.x!.keyframes[0].value).toBe(200);
  });
});

describe("removeKeyframe", () => {
  it("should remove a keyframe by ID", () => {
    let doc = createSceneDocument();
    const node = createNode("Test", "sprite");
    doc = addNode(doc, node, doc.rootNodeId);

    doc = setKeyframe(doc, node.id, "x", 0, 0);
    doc = setKeyframe(doc, node.id, "x", 1000, 100);

    const kfId = doc.animations[node.id].tracks.x!.keyframes[0].id;
    doc = removeKeyframe(doc, node.id, "x", kfId);

    expect(doc.animations[node.id].tracks.x!.keyframes).toHaveLength(1);
    expect(doc.animations[node.id].tracks.x!.keyframes[0].value).toBe(100);
  });

  it("should clean up empty tracks and animations", () => {
    let doc = createSceneDocument();
    const node = createNode("Test", "sprite");
    doc = addNode(doc, node, doc.rootNodeId);

    doc = setKeyframe(doc, node.id, "x", 0, 0);
    const kfId = doc.animations[node.id].tracks.x!.keyframes[0].id;
    doc = removeKeyframe(doc, node.id, "x", kfId);

    expect(doc.animations[node.id]).toBeUndefined();
  });
});

describe("moveKeyframe", () => {
  it("should move a keyframe to a new time and maintain order", () => {
    let doc = createSceneDocument();
    const node = createNode("Test", "sprite");
    doc = addNode(doc, node, doc.rootNodeId);

    doc = setKeyframe(doc, node.id, "x", 0, 0);
    doc = setKeyframe(doc, node.id, "x", 500, 50);
    doc = setKeyframe(doc, node.id, "x", 1000, 100);

    const kfId = doc.animations[node.id].tracks.x!.keyframes[0].id;
    doc = moveKeyframe(doc, node.id, "x", kfId, 750);

    const kfs = doc.animations[node.id].tracks.x!.keyframes;
    expect(kfs[0].timeMs).toBe(500);
    expect(kfs[1].timeMs).toBe(750);
    expect(kfs[2].timeMs).toBe(1000);
  });
});

describe("getEffectiveTransform", () => {
  it("should merge base transform with animation", () => {
    let doc = createSceneDocument();
    const node = createNode("Test", "sprite");
    doc = addNode(doc, node, doc.rootNodeId);
    doc = setKeyframe(doc, node.id, "x", 0, 0);
    doc = setKeyframe(doc, node.id, "x", 1000, 200);

    const transform = getEffectiveTransform(doc, node.id, 500);
    expect(transform.x).toBeCloseTo(100);
    expect(transform.y).toBe(0); // Not animated, uses base
    expect(transform.scaleX).toBe(1); // Default
    expect(transform.opacity).toBe(1); // Default
  });
});

describe("getAllKeyframeTimes", () => {
  it("should return all unique keyframe times sorted", () => {
    let doc = createSceneDocument();
    const n1 = createNode("N1", "sprite");
    const n2 = createNode("N2", "sprite");
    doc = addNode(doc, n1, doc.rootNodeId);
    doc = addNode(doc, n2, doc.rootNodeId);

    doc = setKeyframe(doc, n1.id, "x", 0, 0);
    doc = setKeyframe(doc, n1.id, "x", 500, 50);
    doc = setKeyframe(doc, n2.id, "y", 250, 25);
    doc = setKeyframe(doc, n2.id, "y", 500, 50); // Same time as n1

    const times = getAllKeyframeTimes(doc);
    expect(times).toEqual([0, 250, 500]);
  });
});

describe("getNodeKeyframeTimes", () => {
  it("should return keyframe times for a specific node", () => {
    let doc = createSceneDocument();
    const node = createNode("Test", "sprite");
    doc = addNode(doc, node, doc.rootNodeId);

    doc = setKeyframe(doc, node.id, "x", 0, 0);
    doc = setKeyframe(doc, node.id, "y", 250, 25);
    doc = setKeyframe(doc, node.id, "x", 500, 50);

    const times = getNodeKeyframeTimes(doc, node.id);
    expect(times).toEqual([0, 250, 500]);
  });

  it("should return empty for non-animated nodes", () => {
    const doc = createSceneDocument();
    expect(getNodeKeyframeTimes(doc, "nonexistent")).toEqual([]);
  });
});
