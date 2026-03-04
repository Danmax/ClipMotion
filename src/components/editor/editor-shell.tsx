"use client";

import { useEffect } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { useEditorStore } from "@/store/editor-store";
import { useUIStore } from "@/store/ui-store";
import { usePlayback } from "@/hooks/use-playback";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useAutosave } from "@/hooks/use-autosave";
import { MenuBar } from "./menu-bar/menu-bar";
import { FloatingToolbar } from "./floating-toolbar";
import { CanvasViewport } from "./canvas/canvas-viewport";
import { StoryboardPanel } from "./storyboard/storyboard-panel";
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
      <MenuBar onSave={save} saving={saving} />

      {/* Main area: docked side panels + canvas + adjustable timeline/storyboard */}
      <div className="flex-1 min-h-0">
        <Group orientation="vertical" className="h-full">
          <Panel defaultSize={68} minSize={35}>
            <Group
              orientation="horizontal"
              className="h-full"
              key={[
                showSceneTree ? "objects" : "no-objects",
                showProperties ? "properties" : "no-properties",
                showAssetLibrary ? "stuff" : "no-stuff",
              ].join("-")}
            >
              {showSceneTree && (
                <>
                  <Panel defaultSize={22} minSize={16} maxSize={34}>
                    <div className="h-full bg-gray-900 border-r border-gray-800">
                      <SceneTreePanel />
                    </div>
                  </Panel>
                  <Separator className="w-px bg-gray-800 hover:bg-blue-500 transition-colors" />
                </>
              )}

              <Panel defaultSize={showSceneTree || showProperties || showAssetLibrary ? 56 : 70} minSize={28} maxSize={78}>
                <div className="w-full h-full bg-gray-950 flex items-center justify-center px-4 py-3">
                  <div className="relative w-[88%] max-w-[1200px] h-full min-h-0">
                    <CanvasViewport />
                    <FloatingToolbar />
                  </div>
                </div>
              </Panel>

              {(showProperties || showAssetLibrary) && (
                <Separator className="w-px bg-gray-800 hover:bg-blue-500 transition-colors" />
              )}

              {showProperties && (
                <>
                  <Panel defaultSize={21} minSize={16} maxSize={34}>
                    <div className="h-full bg-gray-900 border-l border-gray-800">
                      <PropertiesPanel />
                    </div>
                  </Panel>
                  {showAssetLibrary && (
                    <Separator className="w-px bg-gray-800 hover:bg-blue-500 transition-colors" />
                  )}
                </>
              )}

              {showAssetLibrary && (
                <Panel defaultSize={21} minSize={16} maxSize={34}>
                  <div className="h-full bg-gray-900 border-l border-gray-800">
                    <AssetLibraryPanel />
                  </div>
                </Panel>
              )}
            </Group>
          </Panel>

          <Separator className="h-px bg-gray-800 hover:bg-blue-500 transition-colors" />

          <Panel defaultSize={26} minSize={16} maxSize={45}>
            <TimelinePanel />
          </Panel>

          <Separator className="h-px bg-gray-800 hover:bg-blue-500 transition-colors" />

          <Panel defaultSize={10} minSize={8} maxSize={24}>
            <StoryboardPanel />
          </Panel>
        </Group>
      </div>
    </div>
  );
}
