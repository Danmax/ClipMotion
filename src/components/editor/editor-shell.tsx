"use client";

import { useEffect, useState } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { ChevronDown, ChevronRight } from "lucide-react";
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
  const setCanvasZoom = useUIStore((s) => s.setCanvasZoom);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [stuffOpen, setStuffOpen] = useState(true);

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
    setCanvasZoom(1);
  }, [project, scenes, loadProject, setCanvasZoom]);

  const hasRightPanel = showProperties || showAssetLibrary;

  return (
    <div className="h-screen flex bg-[#f1f3f5] text-gray-900 overflow-hidden">
      <aside className="w-12 shrink-0">
        <FloatingToolbar />
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
      <MenuBar onSave={save} saving={saving} />

      {/* Main area: docked side panels + canvas + adjustable timeline/storyboard */}
      <div className="flex-1 min-h-0">
        <Group orientation="vertical" className="h-full">
          {/* react-resizable-panels v4 treats numeric sizes as px; use percentages explicitly. */}
          <Panel defaultSize="68%" minSize="35%">
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
                  <Panel defaultSize="22%" minSize="16%" maxSize="34%">
                    <div className="h-full bg-[#0b0d14] text-gray-100 border-r border-[#1f2430]">
                      <SceneTreePanel />
                    </div>
                  </Panel>
                  <Separator className="w-px bg-[#d9dde3] hover:bg-cyan-500 transition-colors" />
                </>
              )}

              <Panel
                defaultSize={showSceneTree || hasRightPanel ? "56%" : "70%"}
                minSize="28%"
                maxSize="78%"
              >
                <div className="w-full h-full bg-[#e7ebef] flex items-center justify-center px-4 py-3">
                  <div className="relative w-[88%] max-w-[1280px] h-full min-h-0">
                    <CanvasViewport />
                  </div>
                </div>
              </Panel>

              {hasRightPanel && (
                <Separator className="w-px bg-[#d9dde3] hover:bg-cyan-500 transition-colors" />
              )}

              {hasRightPanel && (
                <Panel defaultSize="21%" minSize="16%" maxSize="34%">
                  <div className="h-full bg-[#ffffff] border-l border-[#e2e8f0] flex flex-col overflow-hidden">
                    {showProperties && (
                      <>
                        <button
                          onClick={() => setSettingsOpen((v) => !v)}
                          className="h-9 px-3 border-b border-[#e2e8f0] text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hover:bg-[#f8fafc] transition-colors flex items-center justify-between"
                        >
                          <span>Editor Settings</span>
                          {settingsOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                        {settingsOpen && (
                          <div className={`min-h-0 ${showAssetLibrary && stuffOpen ? "flex-1 border-b border-[#e2e8f0]" : "flex-1"}`}>
                            <PropertiesPanel />
                          </div>
                        )}
                      </>
                    )}

                    {showAssetLibrary && (
                      <>
                        <button
                          onClick={() => setStuffOpen((v) => !v)}
                          className="h-9 px-3 border-b border-[#e2e8f0] text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hover:bg-[#f8fafc] transition-colors flex items-center justify-between"
                        >
                          <span>Add Stuff</span>
                          {stuffOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                        {stuffOpen && (
                          <div className="flex-1 min-h-0">
                            <AssetLibraryPanel />
                          </div>
                        )}
                      </>
                    )}

                    {!((showProperties && settingsOpen) || (showAssetLibrary && stuffOpen)) && (
                      <div className="flex-1 min-h-0 flex items-center justify-center text-sm text-gray-400">
                        Expand a section to edit.
                      </div>
                    )}
                  </div>
                </Panel>
              )}
            </Group>
          </Panel>

          <Separator className="h-px bg-[#d9dde3] hover:bg-cyan-500 transition-colors" />

          <Panel defaultSize="26%" minSize="16%" maxSize="45%">
            <TimelinePanel />
          </Panel>

          <Separator className="h-px bg-[#d9dde3] hover:bg-cyan-500 transition-colors" />

          <Panel defaultSize="10%" minSize="8%" maxSize="24%">
            <StoryboardPanel />
          </Panel>
        </Group>
      </div>
      </div>
    </div>
  );
}
