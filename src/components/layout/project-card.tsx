"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Trash2, Edit3, Globe, Lock, Link2 } from "lucide-react";
import type { SceneDocument, SceneNode } from "@/engine/types";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    isPublic: boolean;
    fps: number;
    updatedAt: Date | string;
    thumbnail: string | null;
    width: number;
    height: number;
    previewSceneData?: Record<string, unknown> | null;
  };
  onDeleted?: () => void;
}

function toSceneDocument(data: Record<string, unknown> | null | undefined): SceneDocument | null {
  if (!data || typeof data !== "object") return null;
  const maybe = data as Partial<SceneDocument>;
  if (!maybe.rootNodeId || !maybe.nodes || typeof maybe.nodes !== "object") return null;
  return maybe as SceneDocument;
}

function getLayerOrder(node: SceneNode): number {
  if (node.layer === "background") return 0;
  if (node.layer === "foreground") return 2;
  return 1;
}

function renderNodePreview(node: SceneNode, index: number, canvasWidth: number, canvasHeight: number) {
  const xPct = ((node.transform.x + canvasWidth / 2) / canvasWidth) * 100;
  const yPct = ((node.transform.y + canvasHeight / 2) / canvasHeight) * 100;
  const scale = Math.max(0.1, Math.min(3, ((node.transform.scaleX ?? 1) + (node.transform.scaleY ?? 1)) / 2));
  const opacity = Math.max(0, Math.min(1, node.transform.opacity ?? 1));
  const rotation = node.transform.rotation ?? 0;
  const z = getLayerOrder(node) * 100 + index;

  if (node.type === "shape" && node.shape) {
    const w = Math.max(6, node.shape.width * 0.18 * scale);
    const h = Math.max(6, node.shape.height * 0.18 * scale);
    const common = {
      left: `${xPct}%`,
      top: `${yPct}%`,
      width: `${w}px`,
      height: `${h}px`,
      opacity,
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      zIndex: z,
      border: node.shape.stroke ? `1px solid ${node.shape.stroke}` : undefined,
    } as const;

    if (node.shape.shapeType === "ellipse") {
      return <div key={node.id} className="absolute rounded-full" style={{ ...common, background: node.shape.fill }} />;
    }

    if (node.shape.shapeType === "triangle") {
      return (
        <div
          key={node.id}
          className="absolute"
          style={{
            left: `${xPct}%`,
            top: `${yPct}%`,
            width: 0,
            height: 0,
            zIndex: z,
            opacity,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            borderLeft: `${Math.max(4, w / 2)}px solid transparent`,
            borderRight: `${Math.max(4, w / 2)}px solid transparent`,
            borderBottom: `${Math.max(6, h)}px solid ${node.shape.fill}`,
          }}
        />
      );
    }

    return (
      <div
        key={node.id}
        className="absolute rounded-sm"
        style={{
          ...common,
          borderRadius: node.shape.shapeType === "rectangle" ? `${node.shape.cornerRadius ?? 2}px` : "6px",
          background: node.shape.fill,
        }}
      />
    );
  }

  if (node.type === "text" && node.text) {
    const fontSize = Math.max(8, node.text.fontSize * 0.2 * scale);
    return (
      <div
        key={node.id}
        className="absolute whitespace-nowrap font-medium"
        style={{
          left: `${xPct}%`,
          top: `${yPct}%`,
          zIndex: z,
          opacity,
          color: node.text.fill,
          fontSize: `${fontSize}px`,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          textShadow: "0 1px 1px rgba(0,0,0,0.35)",
        }}
      >
        {node.text.content}
      </div>
    );
  }

  if (node.type === "sprite") {
    return (
      <div
        key={node.id}
        className="absolute rounded border border-white/25 bg-white/10"
        style={{
          left: `${xPct}%`,
          top: `${yPct}%`,
          width: `${Math.max(8, 28 * scale)}px`,
          height: `${Math.max(8, 28 * scale)}px`,
          zIndex: z,
          opacity,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        }}
      />
    );
  }

  return null;
}

export function ProjectCard({ project, onDeleted }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showPropertiesDialog, setShowPropertiesDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [newName, setNewName] = useState(project.name);
  const [newFps, setNewFps] = useState(project.fps);
  const [loading, setLoading] = useState(false);
  const previewDoc = toSceneDocument(project.previewSceneData);
  const previewNodes = previewDoc
    ? Object.values(previewDoc.nodes).filter((node) => node.id !== previewDoc.rootNodeId && node.visible)
    : [];

  const handleTogglePublic = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !project.isPublic }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShareLink = async () => {
    const url = `${window.location.origin}/share/projects/${project.id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Public share link copied.");
    } catch {
      alert(url);
    }
  };

  const handleRename = async () => {
    if (!newName.trim() || newName === project.name) {
      setShowRenameDialog(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });

      if (res.ok) {
        setShowRenameDialog(false);
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProperties = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fps: newFps }),
      });

      if (res.ok) {
        setShowPropertiesDialog(false);
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setShowDeleteConfirm(false);
        onDeleted?.();
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="group relative rounded-xl border border-gray-800 bg-gray-900 overflow-hidden hover:border-gray-700 transition-colors">
        {/* Thumbnail */}
        <Link href={`/editor/${project.id}`}>
          <div className="aspect-video bg-gray-800 flex items-center justify-center cursor-pointer">
            {project.thumbnail ? (
              <img
                src={project.thumbnail}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            ) : previewNodes.length > 0 ? (
              <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900">
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.32),transparent_40%),radial-gradient(circle_at_65%_70%,rgba(56,189,248,0.24),transparent_45%)]" />
                {previewNodes.map((node, index) =>
                  renderNodePreview(node, index, project.width || 1920, project.height || 1080)
                )}
              </div>
            ) : (
              <div className="text-gray-600 text-sm">No preview</div>
            )}
          </div>
        </Link>

        {/* Card footer */}
        <div className="p-4">
          <Link href={`/editor/${project.id}`}>
            <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors cursor-pointer">
              {project.name}
            </h3>
          </Link>
          <p className="text-sm text-gray-500 mt-1">
            {project.fps} fps &middot;{" "}
            {new Date(project.updatedAt).toLocaleDateString()}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            {project.isPublic ? "Public" : "Private"}
          </p>
        </div>

        {/* Menu button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg bg-gray-900/80 border border-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Project menu"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div className="absolute top-10 right-0 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
              <button
                onClick={() => {
                  setShowRenameDialog(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors first:rounded-t-lg"
              >
                <Edit3 className="w-4 h-4" />
                Rename
              </button>
              <button
                onClick={() => {
                  setShowPropertiesDialog(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Properties
              </button>
              <button
                onClick={() => {
                  handleTogglePublic();
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
              >
                {project.isPublic ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                {project.isPublic ? "Make Private" : "Make Public"}
              </button>
              {project.isPublic && (
                <button
                  onClick={() => {
                    handleCopyShareLink();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  Copy Share Link
                </button>
              )}
              <button
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors last:rounded-b-lg"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rename Dialog */}
      {showRenameDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-96 shadow-xl">
            <h2 className="text-lg font-medium text-white mb-4">Rename Project</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setShowRenameDialog(false);
              }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowRenameDialog(false)}
                className="px-3 py-1.5 rounded text-sm text-gray-400 hover:bg-gray-800 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="px-3 py-1.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
                disabled={loading || !newName.trim()}
              >
                {loading ? "Saving..." : "Rename"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Properties Dialog */}
      {showPropertiesDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-96 shadow-xl">
            <h2 className="text-lg font-medium text-white mb-4">Project Properties</h2>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">FPS</label>
                <select
                  value={newFps}
                  onChange={(e) => setNewFps(parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={12}>12 fps</option>
                  <option value={16}>16 fps</option>
                  <option value={24}>24 fps</option>
                  <option value={30}>30 fps</option>
                  <option value={60}>60 fps</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowPropertiesDialog(false)}
                className="px-3 py-1.5 rounded text-sm text-gray-400 hover:bg-gray-800 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProperties}
                className="px-3 py-1.5 rounded text-sm bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-96 shadow-xl">
            <h2 className="text-lg font-medium text-white mb-2">Delete Project?</h2>
            <p className="text-sm text-gray-400 mb-6">
              This will permanently delete &quot;{project.name}&quot; and all its scenes. This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded text-sm text-gray-400 hover:bg-gray-800 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 rounded text-sm bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
