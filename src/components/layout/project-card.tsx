"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Trash2, Edit3 } from "lucide-react";
import type { Project } from "@prisma/client";

interface ProjectCardProps {
  project: Project;
  onDeleted?: () => void;
}

export function ProjectCard({ project, onDeleted }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showPropertiesDialog, setShowPropertiesDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [newName, setNewName] = useState(project.name);
  const [newFps, setNewFps] = useState(project.fps);
  const [loading, setLoading] = useState(false);

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
              This will permanently delete "{project.name}" and all its scenes. This action cannot be undone.
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
