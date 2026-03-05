"use client";

import { useEffect, useRef, useCallback, useState } from "react";
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
  const [saving, setSaving] = useState(false);

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

  const save = useCallback(async (): Promise<boolean> => {
    if (!projectId || !sceneId || savingRef.current) return false;
    if (!dirty) return true;

    savingRef.current = true;
    setSaving(true);
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

      const patchProject = async (v: number) =>
        fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: projectName,
            fps,
            timelineData: timelineComposition,
            version: v,
          }),
        });

      // Save project metadata with one conflict retry.
      let projectRes = await patchProject(version);
      if (projectRes.status === 409) {
        let recoveredVersion: number | null = null;
        try {
          const conflict = (await projectRes.json()) as { currentVersion?: unknown };
          if (typeof conflict.currentVersion === "number") {
            recoveredVersion = conflict.currentVersion;
          }
        } catch {
          // ignore parse error and try GET fallback
        }

        if (recoveredVersion === null) {
          const latestRes = await fetch(`/api/projects/${projectId}`, { method: "GET" });
          if (latestRes.ok) {
            const latest = (await latestRes.json()) as { version?: unknown };
            if (typeof latest.version === "number") {
              recoveredVersion = latest.version;
            }
          }
        }

        if (recoveredVersion !== null) {
          setVersion(recoveredVersion);
          projectRes = await patchProject(recoveredVersion);
        }
      }

      if (sceneRes.ok && projectRes.ok) {
        const updatedProject = await projectRes.json();
        if (updatedProject.version) {
          setVersion(updatedProject.version);
        }
        markClean();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Autosave failed:", error);
      return false;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [
    projectId,
    sceneId,
    dirty,
    document,
    fps,
    projectName,
    timelineComposition,
    version,
    markClean,
    setVersion,
  ]);

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

  return { save, saving };
}
