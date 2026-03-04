import { create } from "zustand";
import type { SceneDocument } from "@/engine/types";

export interface Command {
  id: string;
  label: string;
  execute: () => void;
  undo: () => void;
}

interface HistoryState {
  undoStack: Command[];
  redoStack: Command[];
  maxHistory: number;

  push: (command: Command) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  undoStack: [],
  redoStack: [],
  maxHistory: 100,

  push: (command) => {
    command.execute();
    set((state) => ({
      undoStack: [...state.undoStack.slice(-(state.maxHistory - 1)), command],
      redoStack: [], // Clear redo stack on new action
    }));
  },

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;

    const command = undoStack[undoStack.length - 1];
    command.undo();

    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, command],
    }));
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;

    const command = redoStack[redoStack.length - 1];
    command.execute();

    set((state) => ({
      redoStack: state.redoStack.slice(0, -1),
      undoStack: [...state.undoStack, command],
    }));
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  clear: () => set({ undoStack: [], redoStack: [] }),
}));

/**
 * Create a snapshot-based command for document mutations.
 * Captures before/after state of the scene document.
 */
export function createDocumentCommand(
  label: string,
  getDocument: () => SceneDocument,
  setDocument: (doc: SceneDocument) => void,
  mutate: () => void
): Command {
  const before = JSON.parse(JSON.stringify(getDocument())) as SceneDocument;

  return {
    id: crypto.randomUUID(),
    label,
    execute: () => {
      mutate();
    },
    undo: () => {
      setDocument(before);
    },
  };
}
