"use client";

import {
  Layers,
  SlidersHorizontal,
  Shapes,
} from "lucide-react";
import { useUIStore } from "@/store/ui-store";

const PANEL_TOGGLES: {
  panel: "sceneTree" | "properties" | "assetLibrary";
  icon: React.ElementType;
  label: string;
  stateKey: "showSceneTree" | "showProperties" | "showAssetLibrary";
}[] = [
  { panel: "sceneTree", icon: Layers, label: "Objects", stateKey: "showSceneTree" },
  { panel: "properties", icon: SlidersHorizontal, label: "Settings", stateKey: "showProperties" },
  { panel: "assetLibrary", icon: Shapes, label: "Add Stuff", stateKey: "showAssetLibrary" },
];

export function FloatingToolbar() {
  const togglePanel = useUIStore((s) => s.togglePanel);
  const showSceneTree = useUIStore((s) => s.showSceneTree);
  const showProperties = useUIStore((s) => s.showProperties);
  const showAssetLibrary = useUIStore((s) => s.showAssetLibrary);

  const panelState: Record<string, boolean> = {
    showSceneTree,
    showProperties,
    showAssetLibrary,
  };

  return (
    <div className="absolute top-2 left-2 bottom-2 z-20 flex flex-col gap-1 w-10">
      {/* Panel toggles */}
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-800/60 shadow-xl p-1 flex flex-col gap-0.5">
        {PANEL_TOGGLES.map(({ panel, icon: Icon, label, stateKey }) => {
          const isActive = panelState[stateKey];
          return (
            <button
              key={panel}
              onClick={() => togglePanel(panel)}
              title={label}
              className={`p-2 rounded-md transition-colors ${
                isActive
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/60"
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
