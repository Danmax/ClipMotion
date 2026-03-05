"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEditorStore } from "@/store/editor-store";
import { FPS_OPTIONS } from "@/lib/constants";

const CANVAS_PRESETS = [
  { label: "1080p Landscape", width: 1920, height: 1080 },
  { label: "720p Landscape", width: 1280, height: 720 },
  { label: "Square", width: 1080, height: 1080 },
  { label: "Portrait", width: 1080, height: 1920 },
  { label: "Mobile", width: 1080, height: 1920 },
] as const;

export function ProjectMenu() {
  const [isEditing, setIsEditing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const projectName = useEditorStore((s) => s.projectName);
  const setProjectName = useEditorStore((s) => s.setProjectName);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const setCanvasDimensions = useEditorStore((s) => s.setCanvasDimensions);
  const fps = useEditorStore((s) => s.fps);
  const setFps = useEditorStore((s) => s.setFps);
  const dirty = useEditorStore((s) => s.dirty);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDropdown]);

  const handleNameSubmit = () => setIsEditing(false);

  const currentPreset = CANVAS_PRESETS.find(
    (p) => p.width === canvasWidth && p.height === canvasHeight
  );

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/projects"
        className="text-sm font-bold text-cyan-600 hover:text-cyan-700 mr-1"
      >
        ClipMotion
      </Link>

      {isEditing ? (
        <input
          ref={inputRef}
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onBlur={handleNameSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleNameSubmit();
            if (e.key === "Escape") {
              setIsEditing(false);
            }
          }}
          className="bg-white border border-[#d8e0e8] rounded px-2 py-0.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
        />
      ) : (
        <button
          onClick={() => setIsEditing(true)}
          className="text-sm text-gray-700 hover:text-gray-900 truncate max-w-[200px] px-1 py-0.5 rounded hover:bg-white transition-colors"
          title="Click to rename"
        >
          {projectName}
        </button>
      )}

      {dirty && (
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Unsaved changes" />
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-1 rounded text-gray-400 hover:text-gray-900 hover:bg-white transition-colors"
          title="Project settings"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        {showDropdown && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[#d8e0e8] rounded-lg shadow-xl z-50 p-3 space-y-3">
            {/* Canvas size presets */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                Canvas Size
              </label>
              <div className="grid grid-cols-2 gap-1">
                {CANVAS_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setCanvasDimensions(preset.width, preset.height)}
                    className={`text-[11px] px-2 py-1 rounded transition-colors ${
                      canvasWidth === preset.width && canvasHeight === preset.height
                        ? "bg-cyan-500 text-white"
                        : "bg-[#eef2f6] text-gray-700 hover:bg-[#e5ebf1]"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <label className="block text-[10px] text-gray-500 mb-0.5">Width</label>
                  <input
                    type="number"
                    value={canvasWidth}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v > 0) setCanvasDimensions(v, canvasHeight);
                    }}
                    className="w-full bg-white border border-[#d8e0e8] rounded px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] text-gray-500 mb-0.5">Height</label>
                  <input
                    type="number"
                    value={canvasHeight}
                    onChange={(e) => {
                      const v = parseInt(e.target.value);
                      if (!isNaN(v) && v > 0) setCanvasDimensions(canvasWidth, v);
                    }}
                    className="w-full bg-white border border-[#d8e0e8] rounded px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
              {currentPreset && (
                <span className="text-[10px] text-gray-500 mt-1 block">
                  {currentPreset.label} ({canvasWidth}x{canvasHeight})
                </span>
              )}
            </div>

            {/* FPS */}
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                Frame Rate
              </label>
              <div className="flex gap-1">
                {FPS_OPTIONS.map((fpsOption) => (
                  <button
                    key={fpsOption}
                    onClick={() => setFps(fpsOption)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      fps === fpsOption
                        ? "bg-cyan-500 text-white"
                        : "bg-[#eef2f6] text-gray-700 hover:bg-[#e5ebf1]"
                    }`}
                  >
                    {fpsOption}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
