"use client";

import { useEffect } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { useEditorStore } from "@/store/editor-store";
import { useUIStore } from "@/store/ui-store";
import { usePlayback } from "@/hooks/use-playback";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAutosave } from "@/hooks/use-autosave";
import { Toolbar } from "./toolbar";
import { FloatingToolbar } from "./floating-toolbar";
import { CanvasViewport } from "./canvas/canvas-viewport";
import { TimelinePanel } from "./timeline/timeline-panel";
import { SceneTreePanel } from "./scene-tree/scene-tree-panel";
import { PropertiesPanel } from "./properties/properties-panel";
import { AssetLibraryPanel } from "./assets/asset-library-panel";

interface EditorShellProps {
  project: {
    id: string;
    name: string;
    fps: number;
    durationMs: number;
    width: number;
    height: number;
    version: number;
    timelineData?: Record<string, unknown> | null;
  };
  scenes: {
    id: string;
    name: string;
    order: number;
    data: Record<string, unknown>;
  }[];
}

export function EditorShell({ project, scenes }: EditorShellProps) {
  const loadProject = useEditorStore((s) => s.loadProject);
  const showSceneTree = useUIStore((s) => s.showSceneTree);
  const showProperties = useUIStore((s) => s.showProperties);
  const showTimeline = useUIStore((s) => s.showTimeline);
  const showAssetLibrary = useUIStore((s) => s.showAssetLibrary);

  // Wire up editor hooks
  usePlayback();
  const { save, saving } = useAutosave();
  useKeyboardShortcuts(save);

  useEffect(() => {
    loadProject({
      projectId: project.id,
      name: project.name,
      fps: project.fps,
      durationMs: project.durationMs,
      width: project.width,
      height: project.height,
      version: project.version,
      scenes,
      timelineData: project.timelineData ?? null,
    });
  }, [project, scenes, loadProject]);

  return (
    <div className="h-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      <Toolbar onSave={save} saving={saving} />

      <Group orientation="vertical" className="flex-1" key={showTimeline ? "with-timeline" : "no-timeline"}>
        {/* Main area: canvas with floating panels */}
        <Panel defaultSize={showTimeline ? 65 : 100} minSize={30}>
          <div className="relative w-full h-full">
            {/* Canvas fills the entire area */}
            <CanvasViewport />

            {/* Floating toolbar on the left edge */}
            <FloatingToolbar />

            {/* Scene tree - floating left panel */}
            {showSceneTree && (
              <div className="absolute top-2 left-14 bottom-2 w-56 z-10 rounded-lg overflow-hidden shadow-xl border border-gray-800/60 bg-gray-900/95 backdrop-blur-sm">
                <SceneTreePanel />
              </div>
            )}

            {/* Right-side floating panels */}
            {showProperties && !showAssetLibrary && (
              <div className="absolute top-2 right-2 bottom-2 w-60 z-10 rounded-lg overflow-hidden shadow-xl border border-gray-800/60 bg-gray-900/95 backdrop-blur-sm">
                <PropertiesPanel />
              </div>
            )}

            {!showProperties && showAssetLibrary && (
              <div className="absolute top-2 right-2 bottom-2 w-56 z-10 rounded-lg overflow-hidden shadow-xl border border-gray-800/60 bg-gray-900/95 backdrop-blur-sm">
                <AssetLibraryPanel />
              </div>
            )}

            {showProperties && showAssetLibrary && (
              <>
                <div className="absolute top-2 right-[15.5rem] bottom-2 w-60 z-10 rounded-lg overflow-hidden shadow-xl border border-gray-800/60 bg-gray-900/95 backdrop-blur-sm">
                  <PropertiesPanel />
                </div>
                <div className="absolute top-2 right-2 bottom-2 w-56 z-10 rounded-lg overflow-hidden shadow-xl border border-gray-800/60 bg-gray-900/95 backdrop-blur-sm">
                  <AssetLibraryPanel />
                </div>
              </>
            )}
          </div>
        </Panel>

        {/* Bottom: timeline */}
        {showTimeline && (
          <>
            <Separator className="h-px bg-gray-800 hover:bg-blue-500 transition-colors" />
            <Panel defaultSize={35} minSize={15} maxSize={60}>
              <TimelinePanel />
            </Panel>
          </>
        )}
      </Group>
    </div>
  );
}
