"use client";

import { useRef, useCallback, useState } from "react";
import { Plus, Trash2, Diamond } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { usePlaybackStore } from "@/store/playback-store";
import { useSelectionStore } from "@/store/selection-store";
import { useUIStore } from "@/store/ui-store";
import { msToFrame, frameToMs, formatTimecode } from "@/engine/time-utils";
import { ANIMATABLE_PROPERTIES } from "@/engine/types";
import type { AnimatableProperty } from "@/engine/types";

interface ContextMenu {
  x: number;
  y: number;
  nodeId: string;
  property: AnimatableProperty;
  keyframeId: string;
}

export function TimelinePanel() {
  const document = useEditorStore((s) => s.document);
  const fps = useEditorStore((s) => s.fps);
  const durationMs = useEditorStore((s) => s.durationMs);
  const setKeyframeAt = useEditorStore((s) => s.setKeyframeAt);
  const removeKeyframeById = useEditorStore((s) => s.removeKeyframeById);
  const currentTimeMs = usePlaybackStore((s) => s.currentTimeMs);
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime);
  const selectedNodeIds = useSelectionStore((s) => s.selectedNodeIds);
  const selectNode = useSelectionStore((s) => s.selectNode);
  const timelineZoom = useUIStore((s) => s.timelineZoom);

  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  // Total width in pixels
  const totalWidth = (durationMs / 1000) * timelineZoom;
  const playheadX = (currentTimeMs / 1000) * timelineZoom;

  // Handle ruler click to scrub
  const handleRulerClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const timeMs = (x / timelineZoom) * 1000;
      setCurrentTime(Math.max(0, Math.min(durationMs, timeMs)));
    },
    [timelineZoom, durationMs, setCurrentTime]
  );

  // Add keyframes for all properties of a node at the current time
  const handleAddKeyframesForNode = useCallback(
    (nodeId: string) => {
      const node = document.nodes[nodeId];
      if (!node) return;
      for (const prop of ANIMATABLE_PROPERTIES) {
        setKeyframeAt(nodeId, prop, currentTimeMs, node.transform[prop]);
      }
    },
    [document, currentTimeMs, setKeyframeAt]
  );

  // Double-click on a track row to add a keyframe at that time position
  const handleTrackDoubleClick = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const timeMs = Math.max(0, Math.min(durationMs, (x / timelineZoom) * 1000));
      const node = document.nodes[nodeId];
      if (!node) return;
      // Snap to frame
      const frame = msToFrame(timeMs, fps);
      const snappedMs = frameToMs(frame, fps);
      for (const prop of ANIMATABLE_PROPERTIES) {
        setKeyframeAt(nodeId, prop, snappedMs, node.transform[prop]);
      }
    },
    [document, durationMs, timelineZoom, fps, setKeyframeAt]
  );

  // Right-click on a keyframe dot
  const handleKeyframeContextMenu = useCallback(
    (e: React.MouseEvent, nodeId: string, property: AnimatableProperty, keyframeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId, property, keyframeId });
    },
    []
  );

  // Delete a keyframe from context menu
  const handleDeleteKeyframe = useCallback(() => {
    if (!contextMenu) return;
    removeKeyframeById(contextMenu.nodeId, contextMenu.property, contextMenu.keyframeId);
    setContextMenu(null);
  }, [contextMenu, removeKeyframeById]);

  // Close context menu on any click
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Get nodes to show in timeline (exclude root)
  const rootNode = document.nodes[document.rootNodeId];
  const trackNodes = rootNode
    ? rootNode.childIds
        .map((id) => document.nodes[id])
        .filter(Boolean)
    : [];

  // Generate ruler marks
  const rulerMarks: { x: number; label: string; major: boolean }[] = [];
  const frameDuration = 1000 / fps;
  const framesPerMark = timelineZoom > 80 ? 1 : timelineZoom > 40 ? 5 : 10;
  const totalFrames = Math.ceil(durationMs / frameDuration);

  for (let f = 0; f <= totalFrames; f += framesPerMark) {
    const ms = f * frameDuration;
    const x = (ms / 1000) * timelineZoom;
    const isMajor = f % fps === 0;
    rulerMarks.push({
      x,
      label: isMajor ? formatTimecode(ms, fps) : String(f),
      major: isMajor,
    });
  }

  return (
    <div
      className="h-full flex flex-col bg-gray-900 border-t border-gray-800"
      onClick={handleCloseContextMenu}
    >
      {/* Timeline header */}
      <div className="flex items-center px-3 py-1.5 border-b border-gray-800 gap-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Animation
        </span>
        <span className="text-xs text-gray-600">
          Frame {msToFrame(currentTimeMs, fps)} / {msToFrame(durationMs, fps)}
        </span>
        <div className="flex-1" />
        <span className="text-[10px] text-gray-600">
          Double-click to add animation point
        </span>
      </div>

      {/* Timeline body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track names (left) */}
        <div className="w-44 shrink-0 border-r border-gray-800">
          {/* Ruler spacer */}
          <div className="h-6 border-b border-gray-800" />

          {/* Track labels */}
          {trackNodes.map((node) => {
            const isSelected = selectedNodeIds.has(node.id);
            return (
              <div
                key={node.id}
                className={`h-7 flex items-center gap-1 px-2 text-xs cursor-pointer border-b border-gray-800/50 group ${
                  isSelected
                    ? "text-blue-300 bg-blue-600/10"
                    : "text-gray-400 hover:bg-gray-800"
                }`}
              >
                <span
                  className="flex-1 truncate"
                  onClick={() => selectNode(node.id)}
                >
                  {node.name}
                </span>
                {/* Add keyframe at playhead button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddKeyframesForNode(node.id);
                  }}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 text-gray-500 hover:text-yellow-400 transition-all"
                  title="Add animation point"
                >
                  <Diamond className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Keyframe area (right, scrollable) */}
        <div className="flex-1 overflow-x-auto overflow-y-auto">
          <div style={{ width: totalWidth, minWidth: "100%" }}>
            {/* Ruler */}
            <div
              ref={rulerRef}
              className="h-6 relative border-b border-gray-800 cursor-pointer"
              onClick={handleRulerClick}
            >
              {rulerMarks.map((mark, i) => (
                <div
                  key={i}
                  className="absolute top-0"
                  style={{ left: mark.x }}
                >
                  <div
                    className={`${mark.major ? "h-6 border-gray-600" : "h-3 border-gray-700"} border-l`}
                  />
                  {mark.major && (
                    <span className="absolute top-0 left-1 text-[9px] text-gray-500 whitespace-nowrap">
                      {mark.label}
                    </span>
                  )}
                </div>
              ))}

              {/* Playhead on ruler */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: playheadX }}
              >
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full -translate-x-[4px] -translate-y-0.5" />
              </div>
            </div>

            {/* Track rows */}
            {trackNodes.map((node) => {
              const anim = document.animations[node.id];
              const hasKeyframes = anim && Object.values(anim.tracks).some(
                (t) => t && t.keyframes.length > 0
              );

              return (
                <div
                  key={node.id}
                  className={`h-7 relative border-b border-gray-800/50 cursor-crosshair ${
                    selectedNodeIds.has(node.id) ? "bg-blue-900/10" : ""
                  }`}
                  onDoubleClick={(e) => handleTrackDoubleClick(e, node.id)}
                >
                  {/* Empty state hint */}
                  {!hasKeyframes && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-[9px] text-gray-700">
                        Double-click to add animation point
                      </span>
                    </div>
                  )}

                  {/* Keyframe dots */}
                  {anim &&
                    Object.entries(anim.tracks).map(([prop, track]) => {
                      if (!track) return null;
                      return track.keyframes.map((kf) => {
                        const x = (kf.timeMs / 1000) * timelineZoom;
                        return (
                          <div
                            key={kf.id}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1.5 z-[5]"
                            style={{ left: x }}
                            title={`${prop}: ${Math.round(kf.value * 100) / 100} @ ${formatTimecode(kf.timeMs, fps)}`}
                            onContextMenu={(e) =>
                              handleKeyframeContextMenu(
                                e,
                                node.id,
                                prop as AnimatableProperty,
                                kf.id
                              )
                            }
                          >
                            <div className="w-3 h-3 bg-yellow-400 rotate-45 hover:bg-yellow-300 hover:scale-125 cursor-pointer transition-all rounded-[1px] shadow-sm shadow-yellow-400/20" />
                          </div>
                        );
                      });
                    })}

                  {/* Playhead line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500/50 z-10 pointer-events-none"
                    style={{ left: playheadX }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[10px] text-gray-500 border-b border-gray-700">
            {contextMenu.property} animation point
          </div>
          <button
            onClick={handleDeleteKeyframe}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Remove animation point
          </button>
        </div>
      )}
    </div>
  );
}
