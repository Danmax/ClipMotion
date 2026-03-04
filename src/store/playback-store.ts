import { create } from "zustand";

interface PlaybackState {
  currentTimeMs: number;
  isPlaying: boolean;
  loopEnabled: boolean;
  loopRegion: { startMs: number; endMs: number } | null;
  playbackSpeed: number;

  setCurrentTime: (timeMs: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  togglePlay: () => void;
  setLoopEnabled: (enabled: boolean) => void;
  setLoopRegion: (region: { startMs: number; endMs: number } | null) => void;
  setPlaybackSpeed: (speed: number) => void;
}

export const usePlaybackStore = create<PlaybackState>()((set) => ({
  currentTimeMs: 0,
  isPlaying: false,
  loopEnabled: true,
  loopRegion: null,
  playbackSpeed: 1,

  setCurrentTime: (timeMs) => set({ currentTimeMs: Math.max(0, timeMs) }),

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  stop: () => set({ isPlaying: false, currentTimeMs: 0 }),

  togglePlay: () =>
    set((state) => ({ isPlaying: !state.isPlaying })),

  setLoopEnabled: (enabled) => set({ loopEnabled: enabled }),

  setLoopRegion: (region) => set({ loopRegion: region }),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
}));
