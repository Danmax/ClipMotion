import { create } from "zustand";

export type ToolId = "select" | "move" | "rotate" | "scale" | "bone";
export type AspectRatio = "1:1" | "3:4" | "16:9" | "9:16";

interface UIState {
  // Panel visibility
  showSceneTree: boolean;
  showProperties: boolean;
  showAssetLibrary: boolean;

  // Canvas view
  canvasZoom: number;
  canvasPan: { x: number; y: number };

  // Onion skinning
  onionSkinning: {
    enabled: boolean;
    prevFrames: number;
    nextFrames: number;
    opacity: number;
  };

  // Active tool
  activeTool: ToolId;

  // Canvas aspect ratio
  aspectRatio: AspectRatio;

  // Actions
  togglePanel: (panel: "sceneTree" | "properties" | "assetLibrary") => void;
  setCanvasZoom: (zoom: number) => void;
  setCanvasPan: (pan: { x: number; y: number }) => void;
  setOnionSkinning: (settings: Partial<UIState["onionSkinning"]>) => void;
  setActiveTool: (tool: ToolId) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  showSceneTree: false,
  showProperties: true,
  showAssetLibrary: true,

  canvasZoom: 1,
  canvasPan: { x: 0, y: 0 },

  onionSkinning: {
    enabled: false,
    prevFrames: 2,
    nextFrames: 1,
    opacity: 0.3,
  },

  activeTool: "select",
  aspectRatio: "16:9",

  togglePanel: (panel) =>
    set((state) => {
      const key = `show${panel.charAt(0).toUpperCase() + panel.slice(1)}` as keyof UIState;
      return { [key]: !state[key] } as Partial<UIState>;
    }),

  setCanvasZoom: (zoom) => set({ canvasZoom: Math.max(0.1, Math.min(10, zoom)) }),

  setCanvasPan: (pan) => set({ canvasPan: pan }),

  setOnionSkinning: (settings) =>
    set((state) => ({
      onionSkinning: { ...state.onionSkinning, ...settings },
    })),

  setActiveTool: (tool) => set({ activeTool: tool }),

  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
}));
