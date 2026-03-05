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
    <div className="h-full w-full bg-[#05060a] border-r border-[#171a22] flex flex-col items-center py-3 gap-1">
      {PANEL_TOGGLES.map(({ panel, icon: Icon, label, stateKey }) => {
        const isActive = panelState[stateKey];
        return (
          <button
            key={panel}
            onClick={() => togglePanel(panel)}
            title={label}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              isActive
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-gray-500 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
      <div className="mt-auto mb-1 text-[9px] uppercase tracking-wider text-gray-600">
        Tools
      </div>
    </div>
  );
}
