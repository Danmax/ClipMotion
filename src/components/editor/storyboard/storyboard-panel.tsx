"use client";

import { useState, useCallback } from "react";
import { useEditorStore } from "@/store/editor-store";
import { SceneCard } from "./scene-card";
import { AddSceneButton } from "./add-scene-button";

export function StoryboardPanel() {
  const sceneOrder = useEditorStore((s) => s.sceneOrder);
  const scenes = useEditorStore((s) => s.scenes);
  const sceneId = useEditorStore((s) => s.sceneId);
  const document = useEditorStore((s) => s.document);
  const setActiveScene = useEditorStore((s) => s.setActiveScene);
  const addScene = useEditorStore((s) => s.addScene);
  const removeScene = useEditorStore((s) => s.removeScene);
  const duplicateScene = useEditorStore((s) => s.duplicateScene);
  const renameScene = useEditorStore((s) => s.renameScene);
  const reorderScenes = useEditorStore((s) => s.reorderScenes);

  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);

  const handleDrop = useCallback(() => {
    // onDragOver already tracks target; here we finalize the reorder
    // We need to track dragOverIndex too
  }, []);

  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragEnd = useCallback(() => {
    if (dragFromIndex !== null && dragOverIndex !== null && dragFromIndex !== dragOverIndex) {
      reorderScenes(dragFromIndex, dragOverIndex);
    }
    setDragFromIndex(null);
    setDragOverIndex(null);
  }, [dragFromIndex, dragOverIndex, reorderScenes]);

  const getNodeCount = (sid: string): number => {
    const scene = scenes[sid];
    if (!scene) return 0;
    // Subtract 1 for root node
    return Math.max(0, Object.keys(scene.document.nodes).length - 1);
  };

  const getAnimationCount = (sid: string): number => {
    const scene = scenes[sid];
    if (!scene) return 0;
    return Object.keys(scene.document.animations).length;
  };

  return (
    <div className="h-[130px] border-t border-gray-800 bg-gray-900 flex items-center px-3 gap-3 overflow-x-auto shrink-0">
      {/* Label */}
      <div className="shrink-0 flex flex-col items-center gap-0.5 w-16">
        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
          Scenes
        </span>
        <span className="text-[10px] text-gray-600">
          {sceneOrder.length} total
        </span>
      </div>

      {/* Scene cards */}
      {sceneOrder.map((sid, index) => {
        const scene = scenes[sid];
        if (!scene) return null;

        return (
          <SceneCard
            key={sid}
            sceneId={sid}
            name={scene.name}
            index={index}
            durationMs={scene.durationMs}
            nodeCount={getNodeCount(sid)}
            animationCount={getAnimationCount(sid)}
            isActive={sid === sceneId}
            onSelect={() => setActiveScene(sid)}
            onRename={(name) => renameScene(sid, name)}
            onDuplicate={() => duplicateScene(sid)}
            onDelete={() => removeScene(sid)}
            onDragStart={(i) => setDragFromIndex(i)}
            onDragOver={(i) => setDragOverIndex(i)}
            onDrop={handleDragEnd}
            canDelete={sceneOrder.length > 1}
          />
        );
      })}

      {/* Add scene button */}
      <AddSceneButton onClick={() => addScene()} />
    </div>
  );
}
