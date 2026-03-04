"use client";

import { useRef, useCallback, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2, Diamond, WandSparkles, Play, Pause, Square } from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { usePlaybackStore } from "@/store/playback-store";
import { useSelectionStore } from "@/store/selection-store";
// import { useUIStore } from "@/store/ui-store"; // Deprecated: timeline replaced by storyboard
import { msToFrame, frameToMs, formatTimecode } from "@/engine/time-utils";
import { EASING_PRESETS } from "@/engine/easing";
import { ANIMATABLE_PROPERTIES } from "@/engine/types";
import type { AnimatableProperty, EasingDefinition, SceneNode } from "@/engine/types";

interface ContextMenu {
  x: number;
  y: number;
  nodeId: string;
  property: AnimatableProperty;
  keyframeId: string;
  easing: EasingDefinition;
}

const EASING_MENU_OPTIONS: { id: string; label: string; easing: EasingDefinition }[] = [
  { id: "linear", label: "Linear", easing: EASING_PRESETS.linear },
  { id: "easeIn", label: "Ease In", easing: EASING_PRESETS.easeIn },
  { id: "easeOut", label: "Ease Out", easing: EASING_PRESETS.easeOut },
  { id: "easeInOut", label: "Ease In Out", easing: EASING_PRESETS.easeInOut },
  { id: "step", label: "Step", easing: EASING_PRESETS.step },
];

function isSameEasing(a: EasingDefinition, b: EasingDefinition): boolean {
  if (a.type !== b.type) return false;
  if (a.type !== "cubicBezier") return true;
  if (!a.controlPoints || !b.controlPoints) return false;
  return a.controlPoints.every((v, i) => Math.abs(v - b.controlPoints![i]) < 0.0001);
}

export function TimelinePanel() {
  const document = useEditorStore((s) => s.document);
  const fps = useEditorStore((s) => s.fps);
  const durationMs = useEditorStore((s) => s.durationMs);
  const setKeyframeAt = useEditorStore((s) => s.setKeyframeAt);
  const removeKeyframeById = useEditorStore((s) => s.removeKeyframeById);
  const updateKeyframeEasingById = useEditorStore((s) => s.updateKeyframeEasingById);
  const fillInbetweenKeyframes = useEditorStore((s) => s.fillInbetweenKeyframes);
  const currentTimeMs = usePlaybackStore((s) => s.currentTimeMs);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const togglePlay = usePlaybackStore((s) => s.togglePlay);
  const stop = usePlaybackStore((s) => s.stop);
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime);
  const selectedNodeIds = useSelectionStore((s) => s.selectedNodeIds);
  const selectNode = useSelectionStore((s) => s.selectNode);
  const timelineZoom = 100; // Deprecated: timeline replaced by storyboard

  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [fillStepFrames, setFillStepFrames] = useState(1);
  const rulerRef = useRef<HTMLDivElement>(null);

  // Total width in pixels
  const totalWidth = (durationMs / 1000) * timelineZoom;
  const playheadX = (currentTimeMs / 1000) * timelineZoom;

  // Handle ruler click to scrub
  const scrubByClientX = useCallback(
    (clientX: number, rect: DOMRect) => {
      const x = clientX - rect.left;
      const timeMs = (x / timelineZoom) * 1000;
      const frame = msToFrame(Math.max(0, Math.min(durationMs, timeMs)), fps);
      setCurrentTime(frameToMs(frame, fps));
    },
    [timelineZoom, durationMs, fps, setCurrentTime]
  );

  const stepFrame = useCallback(
    (direction: 1 | -1) => {
      const frame = msToFrame(currentTimeMs, fps);
      const nextFrame = Math.max(0, Math.min(msToFrame(durationMs, fps), frame + direction));
      setCurrentTime(frameToMs(nextFrame, fps));
    },
    [currentTimeMs, fps, durationMs, setCurrentTime]
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
    (
      e: React.MouseEvent,
      nodeId: string,
      property: AnimatableProperty,
      keyframeId: string,
      easing: EasingDefinition
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId, property, keyframeId, easing });
    },
    []
  );

  // Delete a keyframe from context menu
  const handleDeleteKeyframe = useCallback(() => {
    if (!contextMenu) return;
    removeKeyframeById(contextMenu.nodeId, contextMenu.property, contextMenu.keyframeId);
    setContextMenu(null);
  }, [contextMenu, removeKeyframeById]);

  const handleSetKeyframeEasing = useCallback(
    (easing: EasingDefinition) => {
      if (!contextMenu) return;
      updateKeyframeEasingById(
        contextMenu.nodeId,
        contextMenu.property,
        contextMenu.keyframeId,
        easing
      );
      setContextMenu(null);
    },
    [contextMenu, updateKeyframeEasingById]
  );

  // Close context menu on any click
  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Get nodes to show in timeline (exclude root)
  const rootNode = document.nodes[document.rootNodeId];
  const trackNodes = useMemo(
    () => {
      if (!rootNode) return [];
      const result: SceneNode[] = [];

      const walk = (nodeId: string) => {
        const node = document.nodes[nodeId];
        if (!node) return;
        result.push(node);
        for (const childId of node.childIds) {
          walk(childId);
        }
      };

      for (const childId of rootNode.childIds) {
        walk(childId);
      }
      return result;
    },
    [rootNode, document.nodes]
  );

  const handleFillInbetweens = useCallback(() => {
    const targetNodeIds = selectedNodeIds.size > 0
      ? [...selectedNodeIds]
      : trackNodes.length > 0
        ? [trackNodes[0].id]
        : [];

    for (const nodeId of targetNodeIds) {
      fillInbetweenKeyframes(nodeId, fillStepFrames);
    }
  }, [selectedNodeIds, trackNodes, fillInbetweenKeyframes, fillStepFrames]);

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
        <button
          onClick={() => stepFrame(-1)}
          className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          title="Previous frame"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => stepFrame(1)}
          className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          title="Next frame"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={togglePlay}
          className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          title={isPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={stop}
          className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          title="Stop"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1" />
        <label className="text-[10px] text-gray-600">Fill step</label>
        <select
          value={fillStepFrames}
          onChange={(e) => setFillStepFrames(parseInt(e.target.value, 10))}
          className="bg-gray-800 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-gray-300"
        >
          <option value={1}>1f</option>
          <option value={2}>2f</option>
          <option value={4}>4f</option>
        </select>
        <button
          onClick={handleFillInbetweens}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-gray-800 text-blue-300 hover:bg-gray-700 transition-colors"
          title="Fill in-between keys for selected node(s) using existing easing"
        >
          <WandSparkles className="w-3 h-3" />
          Fill In-Betweens
        </button>
        <span className="text-[10px] text-gray-600">
          Double-click track to key all transforms
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
              onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                scrubByClientX(e.clientX, rect);
              }}
              onMouseMove={(e) => {
                if (e.buttons !== 1) return;
                const rect = e.currentTarget.getBoundingClientRect();
                scrubByClientX(e.clientX, rect);
              }}
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
                                kf.id,
                                kf.easing
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
          <div className="px-3 py-1 text-[10px] text-gray-500">
            Easing
          </div>
          {EASING_MENU_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSetKeyframeEasing(option.easing)}
              className={`w-full text-left px-3 py-1 text-xs transition-colors ${
                isSameEasing(contextMenu.easing, option.easing)
                  ? "text-blue-300 bg-blue-500/10"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              {option.label}
            </button>
          ))}
          <div className="my-1 border-t border-gray-700" />
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
