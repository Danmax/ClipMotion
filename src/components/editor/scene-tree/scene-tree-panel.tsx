"use client";

import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Square,
  Circle,
  Triangle,
  Star,
  Hexagon,
  Type,
  Image,
  FolderOpen,
  Bone,
  PersonStanding,
} from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { useSelectionStore } from "@/store/selection-store";
import type { SceneNode } from "@/engine/types";

function getNodeIcon(node: SceneNode) {
  if (node.type === "text") return Type;
  if (node.type === "container") return FolderOpen;
  if (node.type === "bone") return Bone;
  if (node.type === "sprite") return Image;
  if (node.type === "shape" && node.shape) {
    switch (node.shape.shapeType) {
      case "ellipse": return Circle;
      case "triangle": return Triangle;
      case "star": return Star;
      case "polygon": return Hexagon;
      case "stickfigure": return PersonStanding;
      default: return Square;
    }
  }
  return Square;
}

function getNodeIconColor(node: SceneNode): string {
  if (node.type === "shape" && node.shape) return node.shape.fill;
  if (node.type === "text" && node.text) return node.text.fill;
  return "#888888";
}

export function SceneTreePanel() {
  const document = useEditorStore((s) => s.document);
  const addContainerNode = useEditorStore((s) => s.addContainerNode);
  const addSpriteNode = useEditorStore((s) => s.addSpriteNode);
  const removeNodeById = useEditorStore((s) => s.removeNodeById);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const selectedNodeIds = useSelectionStore((s) => s.selectedNodeIds);
  const selectNode = useSelectionStore((s) => s.selectNode);

  const rootNode = document.nodes[document.rootNodeId];

  function renderTreeNode(nodeId: string, depth: number) {
    const node = document.nodes[nodeId];
    if (!node) return null;
    if (nodeId === document.rootNodeId && depth === 0) {
      return (
        <div key={nodeId}>
          {node.childIds.map((childId) => renderTreeNode(childId, 0))}
        </div>
      );
    }

    const isSelected = selectedNodeIds.has(nodeId);

    return (
      <div key={nodeId}>
        <div
          className={`flex items-center gap-1 px-2 py-1 text-sm cursor-pointer transition-colors ${
            isSelected
              ? "bg-blue-600/20 text-blue-300"
              : "text-gray-300 hover:bg-gray-800"
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={(e) => selectNode(nodeId, e.shiftKey)}
        >
          {(() => {
            const Icon = getNodeIcon(node);
            return (
              <Icon
                className="w-3 h-3 shrink-0"
                style={{ color: getNodeIconColor(node) }}
              />
            );
          })()}
          <span className="flex-1 truncate">{node.name}</span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              updateNodeProps(nodeId, { visible: !node.visible });
            }}
            className="p-0.5 hover:text-white transition-colors"
            title={node.visible ? "Hide" : "Show"}
          >
            {node.visible ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3 text-gray-600" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              updateNodeProps(nodeId, { locked: !node.locked });
            }}
            className="p-0.5 hover:text-white transition-colors"
            title={node.locked ? "Unlock" : "Lock"}
          >
            {node.locked ? (
              <Lock className="w-3 h-3 text-yellow-500" />
            ) : (
              <Unlock className="w-3 h-3 text-gray-600" />
            )}
          </button>
        </div>

        {node.childIds.map((childId) => renderTreeNode(childId, depth + 1))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Objects
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => addSpriteNode(`Object ${Object.keys(document.nodes).length}`)}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Add Object"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {selectedNodeIds.size > 0 && (
            <button
              onClick={() => {
                for (const id of selectedNodeIds) {
                  removeNodeById(id);
                }
              }}
              className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
              title="Delete selected"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {rootNode && renderTreeNode(document.rootNodeId, 0)}
      </div>
    </div>
  );
}
