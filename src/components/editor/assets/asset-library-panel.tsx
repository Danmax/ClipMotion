"use client";

import { useState, useEffect } from "react";
import {
  Square,
  Circle,
  Triangle,
  Star,
  Hexagon,
  Type,
  FolderOpen,
  PersonStanding,
  Plus,
} from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { useSelectionStore } from "@/store/selection-store";
import type { ShapeProps, TextProps, FaceProps } from "@/engine/types";
import { applyPreset } from "@/engine/face-presets";
import Link from "next/link";

interface BuiltinAsset {
  id: string;
  name: string;
  icon: React.ElementType;
  category: "shape" | "text";
  shape?: ShapeProps;
  text?: TextProps;
  face?: FaceProps;
}

const BUILTIN_SHAPES: BuiltinAsset[] = [
  {
    id: "rect",
    name: "Rectangle",
    icon: Square,
    category: "shape",
    shape: {
      shapeType: "rectangle",
      width: 160,
      height: 120,
      fill: "#4a90d9",
      cornerRadius: 0,
    },
  },
  {
    id: "rounded-rect",
    name: "Rounded Rect",
    icon: Square,
    category: "shape",
    shape: {
      shapeType: "rectangle",
      width: 160,
      height: 120,
      fill: "#50b583",
      cornerRadius: 16,
    },
  },
  {
    id: "ellipse",
    name: "Ellipse",
    icon: Circle,
    category: "shape",
    shape: {
      shapeType: "ellipse",
      width: 140,
      height: 140,
      fill: "#e06c75",
    },
  },
  {
    id: "triangle",
    name: "Triangle",
    icon: Triangle,
    category: "shape",
    shape: {
      shapeType: "triangle",
      width: 140,
      height: 130,
      fill: "#e5c07b",
    },
  },
  {
    id: "star",
    name: "Star",
    icon: Star,
    category: "shape",
    shape: {
      shapeType: "star",
      width: 140,
      height: 140,
      fill: "#c678dd",
      points: 5,
    },
  },
  {
    id: "polygon",
    name: "Hexagon",
    icon: Hexagon,
    category: "shape",
    shape: {
      shapeType: "polygon",
      width: 140,
      height: 140,
      fill: "#56b6c2",
      points: 6,
    },
  },
  {
    id: "stickfigure",
    name: "Stick Figure",
    icon: PersonStanding,
    category: "shape",
    shape: {
      shapeType: "stickfigure",
      width: 100,
      height: 160,
      fill: "#ffffff",
    },
  },
];

// BFDI-style characters (Battle for Dream Island)
const BFDI_CHARACTERS: BuiltinAsset[] = [
  {
    id: "bfdi-tennis-ball",
    name: "Tennis Ball",
    icon: Circle,
    category: "shape",
    shape: { shapeType: "ellipse", width: 120, height: 120, fill: "#ccff00" },
    face: applyPreset("neutral"),
  },
  {
    id: "bfdi-leafy",
    name: "Leafy",
    icon: Circle,
    category: "shape",
    shape: { shapeType: "ellipse", width: 100, height: 140, fill: "#00cc33" },
    face: applyPreset("happy"),
  },
  {
    id: "bfdi-woody",
    name: "Woody",
    icon: Square,
    category: "shape",
    shape: { shapeType: "rectangle", width: 80, height: 120, fill: "#8b4513", cornerRadius: 8 },
    face: applyPreset("scared"),
  },
  {
    id: "bfdi-bubble",
    name: "Bubble",
    icon: Circle,
    category: "shape",
    shape: { shapeType: "ellipse", width: 130, height: 130, fill: "#ff69b4" },
    face: applyPreset("happy"),
  },
  {
    id: "bfdi-pencil",
    name: "Pencil",
    icon: Square,
    category: "shape",
    shape: { shapeType: "rectangle", width: 40, height: 150, fill: "#ffff00" },
    face: applyPreset("smug"),
  },
];

const BUILTIN_TEXT: BuiltinAsset[] = [
  {
    id: "heading",
    name: "Heading",
    icon: Type,
    category: "text",
    text: {
      content: "Heading",
      fontSize: 48,
      fontFamily: "system-ui, sans-serif",
      fill: "#ffffff",
      fontWeight: "bold",
      textAlign: "center",
    },
  },
  {
    id: "body-text",
    name: "Body Text",
    icon: Type,
    category: "text",
    text: {
      content: "Body text here",
      fontSize: 24,
      fontFamily: "system-ui, sans-serif",
      fill: "#cccccc",
      fontWeight: "normal",
      textAlign: "left",
    },
  },
];

const COLOR_PRESETS = [
  "#4a90d9",
  "#e06c75",
  "#50b583",
  "#e5c07b",
  "#c678dd",
  "#56b6c2",
  "#ffffff",
  "#888888",
];

interface BackgroundLayerSpec {
  name: string;
  fill: string;
  wFrac: number;   // fraction of canvasWidth
  hFrac: number;   // fraction of canvasHeight
  xFrac: number;   // x center as fraction of canvasWidth (0 = center)
  yFrac: number;   // y center as fraction of canvasHeight (0 = center)
}

interface SceneBackground {
  id: string;
  name: string;
  preview: string;    // dominant color for the preview swatch
  layers: BackgroundLayerSpec[];
}

const SCENE_BACKGROUNDS: SceneBackground[] = [
  {
    id: "sandbox", name: "Sandbox", preview: "#f0f0f0",
    layers: [
      { name: "Background", fill: "#f0f0f0", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
    ],
  },
  {
    id: "outside", name: "Outside", preview: "#87ceeb",
    layers: [
      { name: "Sky",    fill: "#87ceeb", wFrac: 1, hFrac: 0.5, xFrac: 0, yFrac: -0.25 },
      { name: "Ground", fill: "#3a7d44", wFrac: 1, hFrac: 0.5, xFrac: 0, yFrac: 0.25  },
    ],
  },
  {
    id: "moon", name: "Moon", preview: "#0a0a1a",
    layers: [
      { name: "Space",   fill: "#0a0a1a", wFrac: 1, hFrac: 0.7, xFrac: 0, yFrac: -0.15 },
      { name: "Surface", fill: "#9e9e9e", wFrac: 1, hFrac: 0.3, xFrac: 0, yFrac: 0.35  },
    ],
  },
  {
    id: "lab", name: "Lab", preview: "#2d3436",
    layers: [
      { name: "Walls", fill: "#2d3436", wFrac: 1, hFrac: 1,    xFrac: 0, yFrac: 0    },
      { name: "Floor", fill: "#636e72", wFrac: 1, hFrac: 0.28, xFrac: 0, yFrac: 0.36 },
    ],
  },
];

interface UserCharacter {
  id: string;
  name: string;
  shapeData: string;
  faceData: string;
}

export function AssetLibraryPanel() {
  const addShapeNode = useEditorStore((s) => s.addShapeNode);
  const addShapeNodeWithFace = useEditorStore((s) => s.addShapeNodeWithFace);
  const addTextNode = useEditorStore((s) => s.addTextNode);
  const addContainerNode = useEditorStore((s) => s.addContainerNode);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const selectNode = useSelectionStore((s) => s.selectNode);

  const [userCharacters, setUserCharacters] = useState<UserCharacter[]>([]);

  useEffect(() => {
    fetch("/api/characters")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setUserCharacters(data))
      .catch(() => {});
  }, []);

  const handleAddAsset = (asset: BuiltinAsset) => {
    const offsetX = (Math.random() - 0.5) * 60;
    const offsetY = (Math.random() - 0.5) * 60;
    const pos = { x: offsetX, y: offsetY };

    let nodeId: string;

    if (asset.category === "shape" && asset.shape) {
      if (asset.face) {
        nodeId = addShapeNodeWithFace(asset.name, asset.shape, asset.face, pos);
      } else {
        nodeId = addShapeNode(asset.name, asset.shape, pos);
      }
    } else if (asset.category === "text" && asset.text) {
      nodeId = addTextNode(asset.name, asset.text, pos);
    } else {
      return;
    }

    selectNode(nodeId);
  };

  const handleAddContainer = () => {
    const id = addContainerNode("Group");
    selectNode(id);
  };

  const handleAddUserCharacter = (char: UserCharacter) => {
    try {
      const shape = JSON.parse(char.shapeData) as ShapeProps;
      const face = JSON.parse(char.faceData) as FaceProps;
      const offsetX = (Math.random() - 0.5) * 60;
      const offsetY = (Math.random() - 0.5) * 60;
      const nodeId = addShapeNodeWithFace(char.name, shape, face, { x: offsetX, y: offsetY });
      selectNode(nodeId);
    } catch {
      // ignore parse errors
    }
  };

  const handleAddBackground = (bg: SceneBackground) => {
    for (const layer of bg.layers) {
      const nodeId = addShapeNode(
        layer.name,
        {
          shapeType: "rectangle",
          width:  Math.round(layer.wFrac * canvasWidth),
          height: Math.round(layer.hFrac * canvasHeight),
          fill:   layer.fill,
        },
        { x: layer.xFrac * canvasWidth, y: layer.yFrac * canvasHeight }
      );
      updateNodeProps(nodeId, { layer: "background" });
    }
  };

  return (
    <div className="h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Add Stuff
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Backgrounds — first, since it's the most common first step */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2">Backgrounds</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {SCENE_BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => handleAddBackground(bg)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-800 transition-colors group"
                title={`Add ${bg.name} background`}
              >
                <div
                  className="w-10 h-6 rounded-md border border-gray-700"
                  style={{ backgroundColor: bg.preview }}
                />
                <span className="text-[10px] text-gray-500 group-hover:text-gray-300 truncate w-full text-center">
                  {bg.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Characters */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500">Characters</h3>
            <Link
              href="/characters/new"
              target="_blank"
              className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Create
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {/* User-created characters */}
            {userCharacters.map((char) => {
              let fill = "#666";
              try { fill = (JSON.parse(char.shapeData) as ShapeProps).fill; } catch {}
              return (
                <button
                  key={char.id}
                  onClick={() => handleAddUserCharacter(char)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-800 transition-colors group"
                  title={`Add ${char.name}`}
                >
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center"
                    style={{ backgroundColor: fill + "22" }}
                  >
                    <div
                      className="w-5 h-5 rounded-sm"
                      style={{ backgroundColor: fill }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 group-hover:text-gray-300 truncate w-full text-center">
                    {char.name}
                  </span>
                </button>
              );
            })}

            {/* Built-in characters */}
            {BFDI_CHARACTERS.map((asset) => (
              <button
                key={asset.id}
                onClick={() => handleAddAsset(asset)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-800 transition-colors group"
                title={`Add ${asset.name}`}
              >
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: asset.shape?.fill + "22" }}
                >
                  <asset.icon
                    className="w-5 h-5"
                    style={{ color: asset.shape?.fill }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 group-hover:text-gray-300 truncate w-full text-center">
                  {asset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Shapes */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2">Shapes</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {BUILTIN_SHAPES.map((asset) => (
              <button
                key={asset.id}
                onClick={() => handleAddAsset(asset)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-800 transition-colors group"
                title={`Add ${asset.name}`}
              >
                <div
                  className="w-10 h-10 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: asset.shape?.fill + "22" }}
                >
                  <asset.icon
                    className="w-5 h-5"
                    style={{ color: asset.shape?.fill }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 group-hover:text-gray-300 truncate w-full text-center">
                  {asset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Text */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2">Text</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {BUILTIN_TEXT.map((asset) => (
              <button
                key={asset.id}
                onClick={() => handleAddAsset(asset)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-800 transition-colors group"
                title={`Add ${asset.name}`}
              >
                <div className="w-10 h-10 rounded-md bg-gray-800 flex items-center justify-center">
                  <asset.icon className="w-5 h-5 text-gray-400" />
                </div>
                <span className="text-[10px] text-gray-500 group-hover:text-gray-300 truncate w-full text-center">
                  {asset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Group container */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 mb-2">Structure</h3>
          <button
            onClick={handleAddContainer}
            className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-gray-800 transition-colors group"
            title="Add Group"
          >
            <div className="w-10 h-10 rounded-md bg-gray-800 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-xs text-gray-500 group-hover:text-gray-300">
              Group
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
