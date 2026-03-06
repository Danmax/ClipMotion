"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil, Globe, Lock, Link2 } from "lucide-react";
import type { ShapeProps } from "@/engine/types";

interface CharacterCardProps {
  character: {
    id: string;
    name: string;
    isPublic: boolean;
    shapeData: string;
    updatedAt: Date;
  };
}

export function CharacterCard({ character }: CharacterCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [sharing, setSharing] = useState(false);

  let shape: ShapeProps | null = null;
  try {
    shape = JSON.parse(character.shapeData) as ShapeProps;
  } catch {
    // ignore parse errors
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this character?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublic = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSharing(true);
    try {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !character.isPublic }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSharing(false);
    }
  };

  const handleCopyShareLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/share/characters/${character.id}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Public share link copied.");
    } catch {
      alert(url);
    }
  };

  return (
    <div className="group relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors">
      {/* Preview area */}
      <div
        className="h-32 flex items-center justify-center"
        style={{ backgroundColor: shape ? shape.fill + "18" : "#1a1a2e" }}
      >
        <div
          className="w-16 h-16 rounded-lg"
          style={{ backgroundColor: shape?.fill ?? "#666" }}
        />
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-medium text-white truncate">{character.name}</h3>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {new Date(character.updatedAt).toLocaleDateString()}
        </p>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {character.isPublic ? "Public" : "Private"}
        </p>
      </div>

      {/* Actions overlay */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a
          href={`/characters/${character.id}/edit`}
          className="p-1.5 rounded-lg bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </a>
        <button
          onClick={handleTogglePublic}
          disabled={sharing}
          className="p-1.5 rounded-lg bg-gray-800/80 text-gray-400 hover:text-cyan-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
          title={character.isPublic ? "Make private" : "Make public"}
        >
          {character.isPublic ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
        </button>
        {character.isPublic && (
          <button
            onClick={handleCopyShareLink}
            className="p-1.5 rounded-lg bg-gray-800/80 text-gray-400 hover:text-cyan-300 hover:bg-gray-700 transition-colors"
            title="Copy share link"
          >
            <Link2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1.5 rounded-lg bg-gray-800/80 text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors disabled:opacity-50"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
