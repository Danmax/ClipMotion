"use client";

import { useEffect, useRef } from "react";
import {
  useEditorStore,
  createEditorStateSnapshot,
  type EditorStateSnapshot,
} from "@/store/editor-store";
import { useHistoryStore } from "@/store/history-store";

function cloneSnapshot(snapshot: EditorStateSnapshot): EditorStateSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as EditorStateSnapshot;
}

function serializeSnapshot(snapshot: EditorStateSnapshot): string {
  return JSON.stringify(snapshot);
}

function serializeComparableSnapshot(snapshot: EditorStateSnapshot): string {
  const { dirty, ...rest } = snapshot;
  void dirty;
  return JSON.stringify(rest);
}

export function useEditorHistory(projectId: string) {
  const clear = useHistoryStore((s) => s.clear);
  const record = useHistoryStore((s) => s.record);

  const isApplyingRef = useRef(false);
  const lastSerializedRef = useRef<string | null>(null);

  useEffect(() => {
    clear();
    lastSerializedRef.current = null;
  }, [projectId, clear]);

  useEffect(() => {
    const unsubscribe = useEditorStore.subscribe((state, prevState) => {
      if (isApplyingRef.current) return;
      if (!state.projectId) return;

      const before = createEditorStateSnapshot(prevState);
      const after = createEditorStateSnapshot(state);

      const beforeSerialized = serializeSnapshot(before);
      const afterSerialized = serializeSnapshot(after);
      const beforeComparable = serializeComparableSnapshot(before);
      const afterComparable = serializeComparableSnapshot(after);

      if (beforeComparable === afterComparable) {
        lastSerializedRef.current = afterSerialized;
        return;
      }

      // Skip initial document load and treat it as the baseline.
      if (
        prevState.projectId === null ||
        (prevState.projectId !== state.projectId && state.projectId !== null)
      ) {
        lastSerializedRef.current = afterSerialized;
        return;
      }

      if (lastSerializedRef.current === null) {
        lastSerializedRef.current = beforeSerialized;
      }

      const beforeSnapshot = cloneSnapshot(before);
      const afterSnapshot = cloneSnapshot(after);

      record({
        id: crypto.randomUUID(),
        label: "Edit",
        execute: () => {
          isApplyingRef.current = true;
          useEditorStore.getState().applyStateSnapshot(cloneSnapshot(afterSnapshot));
          isApplyingRef.current = false;
          lastSerializedRef.current = serializeSnapshot(afterSnapshot);
        },
        undo: () => {
          isApplyingRef.current = true;
          useEditorStore.getState().applyStateSnapshot(cloneSnapshot(beforeSnapshot));
          isApplyingRef.current = false;
          lastSerializedRef.current = serializeSnapshot(beforeSnapshot);
        },
      });

      lastSerializedRef.current = afterSerialized;
    });

    return () => unsubscribe();
  }, [record]);
}
