"use client";

import {
  MousePointer2,
  Move,
  RotateCw,
  Maximize2,
} from "lucide-react";
import { useUIStore, type ToolId } from "@/store/ui-store";

const TOOLS: { id: ToolId; icon: React.ElementType; label: string }[] = [
  { id: "select", icon: MousePointer2, label: "Select" },
  { id: "move", icon: Move, label: "Move" },
  { id: "rotate", icon: RotateCw, label: "Rotate" },
  { id: "scale", icon: Maximize2, label: "Scale" },
];

export function ToolSelector() {
  const activeTool = useUIStore((s) => s.activeTool);
  const setActiveTool = useUIStore((s) => s.setActiveTool);

  return (
    <div className="flex gap-0.5">
      {TOOLS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setActiveTool(id)}
          title={label}
          className={`p-1.5 rounded transition-colors ${
            activeTool === id
              ? "bg-cyan-500 text-white"
              : "text-gray-500 hover:text-gray-900 hover:bg-white"
          }`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
