import type {
  SceneDocument,
  KeyframeTrack,
  Keyframe,
  AnimatableProperty,
  Transform,
  EasingDefinition,
  NodeAnimation,
} from "./types";
import { DEFAULT_TRANSFORM, DEFAULT_EASING, ANIMATABLE_PROPERTIES } from "./types";
import { evaluateEasing } from "./easing";
import { nanoid } from "nanoid";

// ─── Interpolation ───────────────────────────────────────────

/**
 * Interpolate a single property value at a given time.
 * Returns the interpolated value, or undefined if no keyframes exist.
 */
export function interpolateProperty(
  track: KeyframeTrack,
  timeMs: number
): number | undefined {
  const keyframes = track.keyframes;
  if (keyframes.length === 0) return undefined;

  // Before first keyframe: hold first value
  if (timeMs <= keyframes[0].timeMs) {
    return keyframes[0].value;
  }

  // After last keyframe: hold last value
  if (timeMs >= keyframes[keyframes.length - 1].timeMs) {
    return keyframes[keyframes.length - 1].value;
  }

  // Find the surrounding keyframes using binary search
  const idx = binarySearchKeyframes(keyframes, timeMs);
  const prev = keyframes[idx];
  const next = keyframes[idx + 1];

  if (!next) return prev.value;

  // Calculate normalized time between the two keyframes
  const duration = next.timeMs - prev.timeMs;
  if (duration === 0) return next.value;

  const t = (timeMs - prev.timeMs) / duration;

  // Apply easing from the previous keyframe
  const easedT = evaluateEasing(prev.easing, t);

  // Linear interpolation with eased parameter
  return prev.value + (next.value - prev.value) * easedT;
}

/**
 * Binary search to find the index of the keyframe just before or at timeMs.
 * Returns the index such that keyframes[index].timeMs <= timeMs < keyframes[index+1].timeMs.
 */
function binarySearchKeyframes(keyframes: Keyframe[], timeMs: number): number {
  let lo = 0;
  let hi = keyframes.length - 1;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (keyframes[mid].timeMs <= timeMs) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return lo;
}

/**
 * Sample all animated properties of a single node at a given time.
 * Returns a partial transform with only the animated properties.
 */
export function sampleNodeAnimation(
  animation: NodeAnimation | undefined,
  timeMs: number
): Partial<Transform> {
  if (!animation) return {};

  const result: Partial<Transform> = {};

  for (const prop of ANIMATABLE_PROPERTIES) {
    const track = animation.tracks[prop];
    if (track && track.keyframes.length > 0) {
      const value = interpolateProperty(track, timeMs);
      if (value !== undefined) {
        result[prop] = value;
      }
    }
  }

  return result;
}

/**
 * Compute the effective transform for a node at a given time.
 * Merges the node's base transform with animated values.
 */
export function getEffectiveTransform(
  doc: SceneDocument,
  nodeId: string,
  timeMs: number
): Transform {
  const node = doc.nodes[nodeId];
  if (!node) return { ...DEFAULT_TRANSFORM };

  const animation = doc.animations[nodeId];
  const animated = sampleNodeAnimation(animation, timeMs);

  return {
    x: animated.x ?? node.transform.x,
    y: animated.y ?? node.transform.y,
    rotation: animated.rotation ?? node.transform.rotation,
    scaleX: animated.scaleX ?? node.transform.scaleX,
    scaleY: animated.scaleY ?? node.transform.scaleY,
    opacity: animated.opacity ?? node.transform.opacity,
  };
}

/**
 * Sample all nodes in the scene at a given time.
 * Returns a map of nodeId -> effective Transform.
 */
export function sampleScene(
  doc: SceneDocument,
  timeMs: number
): Record<string, Transform> {
  const result: Record<string, Transform> = {};

  for (const nodeId of Object.keys(doc.nodes)) {
    result[nodeId] = getEffectiveTransform(doc, nodeId, timeMs);
  }

  return result;
}

// ─── Keyframe Manipulation ───────────────────────────────────

/**
 * Add or update a keyframe at a specific time for a property.
 * If a keyframe already exists at that time, it's updated.
 * Returns the updated document.
 */
export function setKeyframe(
  doc: SceneDocument,
  nodeId: string,
  property: AnimatableProperty,
  timeMs: number,
  value: number,
  easing?: EasingDefinition
): SceneDocument {
  const newAnimations = { ...doc.animations };

  // Ensure animation entry exists
  if (!newAnimations[nodeId]) {
    newAnimations[nodeId] = { nodeId, tracks: {} };
  } else {
    newAnimations[nodeId] = { ...newAnimations[nodeId], tracks: { ...newAnimations[nodeId].tracks } };
  }

  const anim = newAnimations[nodeId];

  // Ensure track exists
  if (!anim.tracks[property]) {
    anim.tracks[property] = { keyframes: [] };
  } else {
    anim.tracks[property] = { keyframes: [...anim.tracks[property]!.keyframes] };
  }

  const track = anim.tracks[property]!;
  const existingIdx = track.keyframes.findIndex((kf) => kf.timeMs === timeMs);

  if (existingIdx >= 0) {
    // Update existing keyframe
    track.keyframes[existingIdx] = {
      ...track.keyframes[existingIdx],
      value,
      ...(easing ? { easing } : {}),
    };
  } else {
    // Insert new keyframe in sorted order
    const newKf: Keyframe = {
      id: nanoid(),
      timeMs,
      value,
      easing: easing ?? DEFAULT_EASING,
    };

    const insertIdx = track.keyframes.findIndex((kf) => kf.timeMs > timeMs);
    if (insertIdx === -1) {
      track.keyframes.push(newKf);
    } else {
      track.keyframes.splice(insertIdx, 0, newKf);
    }
  }

  return { ...doc, animations: newAnimations };
}

/**
 * Remove a keyframe by its ID.
 * Returns the updated document.
 */
export function removeKeyframe(
  doc: SceneDocument,
  nodeId: string,
  property: AnimatableProperty,
  keyframeId: string
): SceneDocument {
  const anim = doc.animations[nodeId];
  if (!anim) return doc;

  const track = anim.tracks[property];
  if (!track) return doc;

  const newKeyframes = track.keyframes.filter((kf) => kf.id !== keyframeId);
  if (newKeyframes.length === track.keyframes.length) return doc; // Nothing removed

  const newAnimations = { ...doc.animations };
  newAnimations[nodeId] = {
    ...anim,
    tracks: {
      ...anim.tracks,
      [property]: { keyframes: newKeyframes },
    },
  };

  // Clean up empty tracks
  if (newKeyframes.length === 0) {
    const tracks = { ...newAnimations[nodeId].tracks };
    delete tracks[property];
    newAnimations[nodeId] = { ...newAnimations[nodeId], tracks };
  }

  // Clean up empty animation entry
  if (Object.keys(newAnimations[nodeId].tracks).length === 0) {
    delete newAnimations[nodeId];
  }

  return { ...doc, animations: newAnimations };
}

/**
 * Move a keyframe to a new time.
 * Returns the updated document.
 */
export function moveKeyframe(
  doc: SceneDocument,
  nodeId: string,
  property: AnimatableProperty,
  keyframeId: string,
  newTimeMs: number
): SceneDocument {
  const anim = doc.animations[nodeId];
  if (!anim) return doc;

  const track = anim.tracks[property];
  if (!track) return doc;

  const kfIdx = track.keyframes.findIndex((kf) => kf.id === keyframeId);
  if (kfIdx === -1) return doc;

  // Remove from current position and re-insert at new time
  const kf = { ...track.keyframes[kfIdx], timeMs: newTimeMs };
  const remaining = track.keyframes.filter((_, i) => i !== kfIdx);

  // Insert in sorted order
  const insertIdx = remaining.findIndex((k) => k.timeMs > newTimeMs);
  if (insertIdx === -1) {
    remaining.push(kf);
  } else {
    remaining.splice(insertIdx, 0, kf);
  }

  const newAnimations = { ...doc.animations };
  newAnimations[nodeId] = {
    ...anim,
    tracks: {
      ...anim.tracks,
      [property]: { keyframes: remaining },
    },
  };

  return { ...doc, animations: newAnimations };
}

/**
 * Update the easing of a keyframe.
 */
export function updateKeyframeEasing(
  doc: SceneDocument,
  nodeId: string,
  property: AnimatableProperty,
  keyframeId: string,
  easing: EasingDefinition
): SceneDocument {
  const anim = doc.animations[nodeId];
  if (!anim) return doc;

  const track = anim.tracks[property];
  if (!track) return doc;

  const newKeyframes = track.keyframes.map((kf) =>
    kf.id === keyframeId ? { ...kf, easing } : kf
  );

  const newAnimations = { ...doc.animations };
  newAnimations[nodeId] = {
    ...anim,
    tracks: {
      ...anim.tracks,
      [property]: { keyframes: newKeyframes },
    },
  };

  return { ...doc, animations: newAnimations };
}

/**
 * Get all keyframe times across all nodes and properties.
 * Useful for timeline navigation (jump to next/prev keyframe).
 */
export function getAllKeyframeTimes(doc: SceneDocument): number[] {
  const times = new Set<number>();

  for (const anim of Object.values(doc.animations)) {
    for (const track of Object.values(anim.tracks)) {
      if (track) {
        for (const kf of track.keyframes) {
          times.add(kf.timeMs);
        }
      }
    }
  }

  return Array.from(times).sort((a, b) => a - b);
}

/**
 * Get all keyframe times for a specific node.
 */
export function getNodeKeyframeTimes(
  doc: SceneDocument,
  nodeId: string
): number[] {
  const times = new Set<number>();
  const anim = doc.animations[nodeId];
  if (!anim) return [];

  for (const track of Object.values(anim.tracks)) {
    if (track) {
      for (const kf of track.keyframes) {
        times.add(kf.timeMs);
      }
    }
  }

  return Array.from(times).sort((a, b) => a - b);
}
