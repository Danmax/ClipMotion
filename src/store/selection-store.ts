import { create } from "zustand";

interface SelectionState {
  selectedNodeIds: Set<string>;
  selectedKeyframeIds: Set<string>;
  hoveredNodeId: string | null;

  selectNode: (nodeId: string, additive?: boolean) => void;
  deselectNode: (nodeId: string) => void;
  clearNodeSelection: () => void;
  setHoveredNode: (nodeId: string | null) => void;

  selectKeyframe: (keyframeId: string, additive?: boolean) => void;
  deselectKeyframe: (keyframeId: string) => void;
  clearKeyframeSelection: () => void;

  clearAll: () => void;
}

export const useSelectionStore = create<SelectionState>()((set) => ({
  selectedNodeIds: new Set<string>(),
  selectedKeyframeIds: new Set<string>(),
  hoveredNodeId: null,

  selectNode: (nodeId, additive = false) =>
    set((state) => ({
      selectedNodeIds: additive
        ? new Set([...state.selectedNodeIds, nodeId])
        : new Set([nodeId]),
    })),

  deselectNode: (nodeId) =>
    set((state) => {
      const next = new Set(state.selectedNodeIds);
      next.delete(nodeId);
      return { selectedNodeIds: next };
    }),

  clearNodeSelection: () => set({ selectedNodeIds: new Set() }),

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

  clearAll: () =>
    set({
      selectedNodeIds: new Set(),
      selectedKeyframeIds: new Set(),
      hoveredNodeId: null,
    }),
}));
