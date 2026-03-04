"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEditorStore } from "@/store/editor-store";
import { serializeScene } from "@/engine/serialization";
import { AUTOSAVE_DEBOUNCE_MS } from "@/lib/constants";

/**
 * Autosave hook: debounces scene changes and PATCHes the API.
 * Only saves when the document is dirty.
 */
export function useAutosave() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  const projectId = useEditorStore((s) => s.projectId);
  const sceneId = useEditorStore((s) => s.sceneId);
  const document = useEditorStore((s) => s.document);
  const dirty = useEditorStore((s) => s.dirty);
  const version = useEditorStore((s) => s.version);
  const fps = useEditorStore((s) => s.fps);
  const projectName = useEditorStore((s) => s.projectName);
  const timelineComposition = useEditorStore((s) => s.timelineComposition);
  const markClean = useEditorStore((s) => s.markClean);
  const setVersion = useEditorStore((s) => s.setVersion);

  const save = useCallback(async () => {
    if (!projectId || !sceneId || savingRef.current) return;

    savingRef.current = true;
    try {
      const data = serializeScene(document);

      // Save scene data
      const sceneRes = await fetch(
        `/api/projects/${projectId}/scenes`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sceneId, data }),
        }
      );

      // Save project metadata
      const projectRes = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          fps,
          timelineData: timelineComposition,
          version,
        }),
      });

      if (sceneRes.ok && projectRes.ok) {
        const updatedProject = await projectRes.json();
        if (updatedProject.version) {
          setVersion(updatedProject.version);
        }
        markClean();
      }
    } catch (error) {
      console.error("Autosave failed:", error);
    } finally {
      savingRef.current = false;
    }
  }, [projectId, sceneId, document, fps, projectName, timelineComposition, version, markClean, setVersion]);

  useEffect(() => {
    if (!dirty) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(save, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [dirty, save]);

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      if (useEditorStore.getState().dirty) {
        save();
      }
    };
  }, [save]);

  return { save, saving: savingRef.current };
}
