"use client";

import { useState, useRef, useEffect } from "react";
import { Copy } from "lucide-react";

interface SceneCardProps {
  sceneId: string;
  name: string;
  index: number;
  durationMs: number;
  nodeCount: number;
  animationCount: number;
  isActive: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDrop: () => void;
  canDelete: boolean;
}

export function SceneCard({
  name,
  index,
  durationMs,
  nodeCount,
  animationCount,
  isActive,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  canDelete,
}: SceneCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  const handleSubmitName = () => {
    setIsEditing(false);
    if (editName.trim()) onRename(editName.trim());
  };

  const durationStr = `${(durationMs / 1000).toFixed(1)}s`;

  return (
    <div
      className={`relative shrink-0 w-40 h-[90px] rounded-lg border-2 cursor-pointer select-none transition-all ${
        isActive
          ? "border-blue-500 bg-gray-800 shadow-lg shadow-blue-500/10"
          : "border-gray-700 bg-gray-850 hover:border-gray-600 hover:bg-gray-800"
      }`}
      onClick={onSelect}
      onDoubleClick={() => {
        setEditName(name);
        setIsEditing(true);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(true);
      }}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(index);
      }}
      onDrop={onDrop}
    >
      {/* Scene number badge */}
      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded bg-gray-700 flex items-center justify-center">
        <span className="text-[10px] font-bold text-gray-300">{index + 1}</span>
      </div>

      {/* Quick duplicate action */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
        }}
        className="absolute top-1.5 right-1.5 w-5 h-5 rounded bg-gray-700/90 hover:bg-blue-600/90 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
        title="Duplicate scene"
      >
        <Copy className="w-3 h-3" />
      </button>

      {/* Content area */}
      <div className="absolute inset-0 flex flex-col justify-end p-2">
        {/* Name */}
        {isEditing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSubmitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmitName();
              if (e.key === "Escape") setIsEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 border border-gray-600 rounded px-1 py-0.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
          />
        ) : (
          <span className="text-[11px] text-gray-300 truncate font-medium">{name}</span>
        )}

        {/* Badges */}
        <div className="flex gap-1 mt-1">
          <span className="text-[9px] bg-gray-700 text-gray-400 px-1 py-0.5 rounded">
            {durationStr}
          </span>
          {nodeCount > 0 && (
            <span className="text-[9px] bg-gray-700 text-gray-400 px-1 py-0.5 rounded">
              {nodeCount} obj
            </span>
          )}
          {animationCount > 0 && (
            <span className="text-[9px] bg-blue-900/60 text-blue-300 px-1 py-0.5 rounded">
              {animationCount} anim
            </span>
          )}
        </div>
      </div>

      {/* Context menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 mt-1 w-32 bg-gray-800 border border-gray-700 rounded shadow-xl z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setShowMenu(false);
              setEditName(name);
              setIsEditing(true);
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700 rounded-t"
          >
            Rename
          </button>
          <button
            onClick={() => {
              setShowMenu(false);
              onDuplicate();
            }}
            className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700"
          >
            Duplicate
          </button>
          {canDelete && (
            <button
              onClick={() => {
                setShowMenu(false);
                onDelete();
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-gray-700 rounded-b"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
