/**
 * Convert milliseconds to frame number at a given FPS.
 * Frame 0 starts at 0ms.
 */
export function msToFrame(ms: number, fps: number): number {
  return Math.floor(ms / (1000 / fps));
}

/**
 * Convert frame number to milliseconds.
 */
export function frameToMs(frame: number, fps: number): number {
  return frame * (1000 / fps);
}

/**
 * Snap a time in ms to the nearest frame boundary.
 */
export function snapToFrame(ms: number, fps: number): number {
  const frameDuration = 1000 / fps;
  return Math.round(ms / frameDuration) * frameDuration;
}

/**
 * Get the duration of a single frame in milliseconds.
 */
export function frameDurationMs(fps: number): number {
  return 1000 / fps;
}

/**
 * Get total number of frames for a given duration and FPS.
 */
export function totalFrames(durationMs: number, fps: number): number {
  return Math.ceil(durationMs / (1000 / fps));
}

/**
 * Format milliseconds as timecode string (MM:SS:FF).
 */
export function formatTimecode(ms: number, fps: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const frame = msToFrame(ms % 1000, fps);

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}:${String(frame).padStart(2, "0")}`;
}

/**
 * Clamp a time value within bounds.
 */
export function clampTime(ms: number, minMs: number, maxMs: number): number {
  return Math.max(minMs, Math.min(maxMs, ms));
}
