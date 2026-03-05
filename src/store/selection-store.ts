import { create } from "zustand";

import type { AnimatableProperty, EasingDefinition } from "@/engine/types";

export interface SelectedKeyframeMeta {
  nodeId: string;
  property: AnimatableProperty;
  keyframeId: string;
  timeMs: number;
  value: number;
  easing: EasingDefinition;
}

interface SelectionState {
  selectedNodeIds: Set<string>;
  selectedKeyframeIds: Set<string>;
  selectedKeyframe: SelectedKeyframeMeta | null;
  hoveredNodeId: string | null;

  selectNode: (nodeId: string, additive?: boolean) => void;
  deselectNode: (nodeId: string) => void;
  clearNodeSelection: () => void;
  setHoveredNode: (nodeId: string | null) => void;

  selectKeyframe: (keyframeId: string, additive?: boolean) => void;
  deselectKeyframe: (keyframeId: string) => void;
  clearKeyframeSelection: () => void;
  setSelectedKeyframe: (keyframe: SelectedKeyframeMeta | null) => void;

  clearAll: () => void;
}

export const useSelectionStore = create<SelectionState>()((set) => ({
  selectedNodeIds: new Set<string>(),
  selectedKeyframeIds: new Set<string>(),
  selectedKeyframe: null,
  hoveredNodeId: null,

  selectNode: (nodeId, additive = false) =>
    set((state) => ({
      selectedNodeIds: additive
        ? new Set([...state.selectedNodeIds, nodeId])
        : new Set([nodeId]),
      ...(additive
        ? {}
        : {
            selectedKeyframe: null,
            selectedKeyframeIds: new Set<string>(),
          }),
    })),

  deselectNode: (nodeId) =>
    set((state) => {
      const next = new Set(state.selectedNodeIds);
      next.delete(nodeId);
      return { selectedNodeIds: next };
    }),

  clearNodeSelection: () =>
    set({
      selectedNodeIds: new Set(),
      selectedKeyframe: null,
      selectedKeyframeIds: new Set<string>(),
    }),

  setHoveredNode: (nodeId) => set({ hoveredNodeId: nodeId }),

  selectKeyframe: (keyframeId, additive = false) =>
    set((state) => ({
      selectedKeyframeIds: additive
        ? new Set([...state.selectedKeyframeIds, keyframeId])
        : new Set([keyframeId]),
    })),

  deselectKeyframe: (keyframeId) =>
    set((state) => {
      const next = new Set(state.selectedKeyframeIds);
      next.delete(keyframeId);
      return { selectedKeyframeIds: next };
    }),

  clearKeyframeSelection: () => set({ selectedKeyframeIds: new Set() }),

  setSelectedKeyframe: (keyframe) =>
    set({
      selectedKeyframe: keyframe,
      selectedKeyframeIds: keyframe ? new Set([keyframe.keyframeId]) : new Set(),
    }),

  clearAll: () =>
    set({
      selectedNodeIds: new Set(),
      selectedKeyframeIds: new Set(),
      selectedKeyframe: null,
      hoveredNodeId: null,
    }),
}));
