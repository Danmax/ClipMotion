"use client";

import { Plus } from "lucide-react";

interface AddSceneButtonProps {
  onClick: () => void;
}

export function AddSceneButton({ onClick }: AddSceneButtonProps) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 w-40 h-[90px] rounded-lg border-2 border-dashed border-gray-700 hover:border-gray-500 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-gray-300 transition-colors"
      title="Add new scene"
    >
      <Plus className="w-5 h-5" />
      <span className="text-[10px]">Add Scene</span>
    </button>
  );
}
