// Free tier limits
export const FREE_TIER_MAX_DURATION_MS = 30_000; // 30 seconds
export const FREE_TIER_MAX_EXPORTS_PER_DAY = 3;
export const FREE_TIER_MAX_RESOLUTION = "1280x720";
export const FREE_TIER_WATERMARK = true;

// FPS options
export const FPS_OPTIONS = [12, 16, 24, 30, 60] as const;
export type FpsOption = (typeof FPS_OPTIONS)[number];

// Canvas defaults
export const DEFAULT_CANVAS_WIDTH = 1920;
export const DEFAULT_CANVAS_HEIGHT = 1080;
export const DEFAULT_FPS = 24;

// Autosave
export const AUTOSAVE_DEBOUNCE_MS = 2000;

// Asset limits
export const MAX_ASSET_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
] as const;

// Resolution presets
export const RESOLUTION_PRESETS = {
  "480p": { width: 854, height: 480 },
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
} as const;
