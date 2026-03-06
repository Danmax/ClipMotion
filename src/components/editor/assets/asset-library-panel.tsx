"use client";

import { useState, useEffect, useRef } from "react";
import {
  Square,
  Circle,
  Triangle,
  Star,
  Hexagon,
  Diamond,
  Type,
  FolderOpen,
  PersonStanding,
  Plus,
} from "lucide-react";
import { useEditorStore } from "@/store/editor-store";
import { useSelectionStore } from "@/store/selection-store";
import type { ShapeProps, TextProps, FaceProps, LimbProps, AccessoryProps } from "@/engine/types";
import { DEFAULT_LIMBS } from "@/engine/types";
import { applyPreset } from "@/engine/face-presets";
import Link from "next/link";

interface BuiltinAsset {
  id: string;
  name: string;
  icon: React.ElementType;
  category: "shape" | "text";
  shape?: ShapeProps;
  text?: TextProps;
  limbs?: LimbProps;
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
    id: "capsule",
    name: "Capsule",
    icon: Circle,
    category: "shape",
    shape: {
      shapeType: "capsule",
      width: 170,
      height: 110,
      fill: "#7f8cff",
    },
  },
  {
    id: "diamond-shape",
    name: "Diamond",
    icon: Diamond,
    category: "shape",
    shape: {
      shapeType: "diamond",
      width: 130,
      height: 150,
      fill: "#ff5f9e",
    },
  },
  {
    id: "trapezoid",
    name: "Trapezoid",
    icon: Square,
    category: "shape",
    shape: {
      shapeType: "trapezoid",
      width: 160,
      height: 120,
      fill: "#f2a541",
    },
  },
  {
    id: "parallelogram",
    name: "Parallelogram",
    icon: Square,
    category: "shape",
    shape: {
      shapeType: "parallelogram",
      width: 160,
      height: 120,
      fill: "#2ec4b6",
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
  {
    id: "blob",
    name: "Blob",
    icon: Circle,
    category: "shape",
    shape: {
      shapeType: "blob",
      width: 150,
      height: 130,
      fill: "#9c6ade",
    },
  },
  {
    id: "asymmetric-blob",
    name: "Asym Blob",
    icon: Circle,
    category: "shape",
    shape: {
      shapeType: "asymmetric-blob",
      width: 150,
      height: 130,
      fill: "#ff8c42",
    },
  },
];

const OBJ_LIMBS: LimbProps = { ...DEFAULT_LIMBS };

// Object Show characters — everyday objects with faces and limbs
const BFDI_CHARACTERS: BuiltinAsset[] = [
  {
    id: "obj-tennis-ball",
    name: "Tennis Ball",
    icon: Circle,
    category: "shape",
    shape: { shapeType: "ellipse", width: 120, height: 120, fill: "#ccff00" },
    face: applyPreset("neutral"),
    limbs: OBJ_LIMBS,
  },
  {
    id: "obj-leafy",
    name: "Leafy",
    icon: Circle,
    category: "shape",
    shape: { shapeType: "ellipse", width: 100, height: 140, fill: "#00cc33" },
    face: applyPreset("happy"),
    limbs: OBJ_LIMBS,
  },
  {
    id: "obj-woody",
    name: "Woody",
    icon: Square,
    category: "shape",
    shape: { shapeType: "rectangle", width: 80, height: 120, fill: "#8b4513", cornerRadius: 8 },
    face: applyPreset("scared"),
    limbs: OBJ_LIMBS,
  },
  {
    id: "obj-bubble",
    name: "Bubble",
    icon: Circle,
    category: "shape",
    shape: { shapeType: "ellipse", width: 130, height: 130, fill: "#ff69b4" },
    face: applyPreset("happy"),
    limbs: OBJ_LIMBS,
  },
  {
    id: "obj-pencil",
    name: "Pencil",
    icon: Square,
    category: "shape",
    shape: { shapeType: "rectangle", width: 40, height: 150, fill: "#ffff00" },
    face: applyPreset("smug"),
    limbs: OBJ_LIMBS,
  },
  {
    id: "obj-ice-cube",
    name: "Ice Cube",
    icon: Square,
    category: "shape",
    shape: { shapeType: "rectangle", width: 100, height: 100, fill: "#87ceeb", cornerRadius: 4 },
    face: applyPreset("worried"),
    limbs: OBJ_LIMBS,
  },
  {
    id: "obj-firey",
    name: "Firey",
    icon: Star,
    category: "shape",
    shape: { shapeType: "star", width: 130, height: 130, fill: "#ff4400", points: 8 },
    face: applyPreset("happy"),
    limbs: OBJ_LIMBS,
  },
  {
    id: "obj-basketball",
    name: "Basketball",
    icon: Circle,
    category: "shape",
    shape: { shapeType: "ellipse", width: 120, height: 120, fill: "#ff8844" },
    face: applyPreset("angry"),
    limbs: OBJ_LIMBS,
  },
  {
    id: "obj-book",
    name: "Book",
    icon: Square,
    category: "shape",
    shape: { shapeType: "rectangle", width: 90, height: 120, fill: "#cc4444", cornerRadius: 4 },
    face: applyPreset("smug"),
    limbs: OBJ_LIMBS,
  },
  {
    id: "obj-lemon",
    name: "Lemon",
    icon: Circle,
    category: "shape",
    shape: { shapeType: "ellipse", width: 110, height: 100, fill: "#ffee44" },
    face: applyPreset("neutral"),
    limbs: OBJ_LIMBS,
  },
  {
    id: "obj-diamond",
    name: "Diamond",
    icon: Hexagon,
    category: "shape",
    shape: { shapeType: "polygon", width: 110, height: 110, fill: "#ff2244", points: 4 },
    face: applyPreset("angry"),
    limbs: OBJ_LIMBS,
  },
  {
    id: "obj-pizza",
    name: "Pizza",
    icon: Triangle,
    category: "shape",
    shape: { shapeType: "triangle", width: 120, height: 120, fill: "#ffaa33" },
    face: applyPreset("happy"),
    limbs: OBJ_LIMBS,
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

interface BackgroundLayerSpec {
  name: string;
  fill: string;
  targetLayer: "background" | "normal" | "foreground";
  parallaxFactor?: number;
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
      { name: "Background", fill: "#f0f0f0", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
    ],
  },
  {
    id: "outside", name: "Outside", preview: "#87ceeb",
    layers: [
      { name: "Sky",    fill: "#87ceeb", targetLayer: "background", wFrac: 1, hFrac: 0.5, xFrac: 0, yFrac: -0.25 },
      { name: "Ground", fill: "#3a7d44", targetLayer: "background", wFrac: 1, hFrac: 0.5, xFrac: 0, yFrac: 0.25  },
    ],
  },
  {
    id: "moon", name: "Moon", preview: "#0a0a1a",
    layers: [
      { name: "Space",   fill: "#0a0a1a", targetLayer: "background", wFrac: 1, hFrac: 0.7, xFrac: 0, yFrac: -0.15 },
      { name: "Surface", fill: "#9e9e9e", targetLayer: "background", wFrac: 1, hFrac: 0.3, xFrac: 0, yFrac: 0.35  },
    ],
  },
  {
    id: "lab", name: "Lab", preview: "#2d3436",
    layers: [
      { name: "Walls", fill: "#2d3436", targetLayer: "background", wFrac: 1, hFrac: 1,    xFrac: 0, yFrac: 0    },
      { name: "Floor", fill: "#636e72", targetLayer: "background", wFrac: 1, hFrac: 0.28, xFrac: 0, yFrac: 0.36 },
    ],
  },
];

interface CreativeScenePreset {
  id: string;
  name: string;
  preview: string;
  layers: BackgroundLayerSpec[];
}

const CREATIVE_SCENE_PRESETS: CreativeScenePreset[] = [
  {
    id: "sunset-city",
    name: "Sunset City",
    preview: "#f08a5d",
    layers: [
      { name: "Sky Gradient", fill: "#f08a5d", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
      { name: "Far Buildings", fill: "#6c5b7b", targetLayer: "normal", parallaxFactor: 0.6, wFrac: 1, hFrac: 0.28, xFrac: 0, yFrac: 0.28 },
      { name: "Street Foreground", fill: "#2d3142", targetLayer: "foreground", parallaxFactor: 1.2, wFrac: 1, hFrac: 0.18, xFrac: 0, yFrac: 0.41 },
    ],
  },
  {
    id: "forest-depth",
    name: "Forest Depth",
    preview: "#6a994e",
    layers: [
      { name: "Sky Mist", fill: "#a7c957", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
      { name: "Tree Line", fill: "#386641", targetLayer: "normal", parallaxFactor: 0.65, wFrac: 1, hFrac: 0.42, xFrac: 0, yFrac: 0.23 },
      { name: "Bush Foreground", fill: "#1b4332", targetLayer: "foreground", parallaxFactor: 1.25, wFrac: 1, hFrac: 0.18, xFrac: 0, yFrac: 0.41 },
    ],
  },
  {
    id: "space-station",
    name: "Space Station",
    preview: "#0b132b",
    layers: [
      { name: "Deep Space", fill: "#0b132b", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
      { name: "Station Mid", fill: "#3a506b", targetLayer: "normal", parallaxFactor: 0.7, wFrac: 1, hFrac: 0.35, xFrac: 0, yFrac: 0.26 },
      { name: "Control Deck", fill: "#1c2541", targetLayer: "foreground", parallaxFactor: 1.3, wFrac: 1, hFrac: 0.2, xFrac: 0, yFrac: 0.4 },
    ],
  },
  {
    id: "road-runner-desert-canyons",
    name: "Road Runner Desert Canyons",
    preview: "#d9822b",
    layers: [
      { name: "Desert Sky", fill: "#ffd8a8", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
      { name: "Far Canyons", fill: "#c96a2a", targetLayer: "normal", parallaxFactor: 0.55, wFrac: 1, hFrac: 0.3, xFrac: 0, yFrac: 0.26 },
      { name: "Rocky Foreground", fill: "#8f3f1f", targetLayer: "foreground", parallaxFactor: 1.3, wFrac: 1, hFrac: 0.2, xFrac: 0, yFrac: 0.4 },
    ],
  },
  {
    id: "tropical-paradise",
    name: "Tropical Paradise",
    preview: "#2ec4b6",
    layers: [
      { name: "Island Sky", fill: "#9be7ff", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
      { name: "Palm Ridge", fill: "#2f855a", targetLayer: "normal", parallaxFactor: 0.65, wFrac: 1, hFrac: 0.28, xFrac: 0, yFrac: 0.28 },
      { name: "Beach Foreground", fill: "#f4d06f", targetLayer: "foreground", parallaxFactor: 1.2, wFrac: 1, hFrac: 0.18, xFrac: 0, yFrac: 0.41 },
    ],
  },
  {
    id: "deep-forest",
    name: "Deep Forest",
    preview: "#2b4f2f",
    layers: [
      { name: "Forest Mist", fill: "#8fb996", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
      { name: "Dense Trees", fill: "#355e3b", targetLayer: "normal", parallaxFactor: 0.7, wFrac: 1, hFrac: 0.36, xFrac: 0, yFrac: 0.25 },
      { name: "Ferns Foreground", fill: "#1f3f25", targetLayer: "foreground", parallaxFactor: 1.35, wFrac: 1, hFrac: 0.2, xFrac: 0, yFrac: 0.4 },
    ],
  },
  {
    id: "industrial-factory",
    name: "Industrial Factory",
    preview: "#495057",
    layers: [
      { name: "Smoky Backdrop", fill: "#6c757d", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
      { name: "Factory Midline", fill: "#495057", targetLayer: "normal", parallaxFactor: 0.65, wFrac: 1, hFrac: 0.32, xFrac: 0, yFrac: 0.27 },
      { name: "Steel Floor", fill: "#343a40", targetLayer: "foreground", parallaxFactor: 1.25, wFrac: 1, hFrac: 0.2, xFrac: 0, yFrac: 0.4 },
    ],
  },
  {
    id: "fancy-palace",
    name: "Fancy Palace",
    preview: "#d4af37",
    layers: [
      { name: "Royal Hall Backdrop", fill: "#f6e7b8", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
      { name: "Columns & Drapes", fill: "#c9a227", targetLayer: "normal", parallaxFactor: 0.6, wFrac: 1, hFrac: 0.32, xFrac: 0, yFrac: 0.27 },
      { name: "Marble Stage", fill: "#9c7c1f", targetLayer: "foreground", parallaxFactor: 1.25, wFrac: 1, hFrac: 0.18, xFrac: 0, yFrac: 0.41 },
    ],
  },
  {
    id: "moonlight",
    name: "Moonlight",
    preview: "#334e68",
    layers: [
      { name: "Night Sky", fill: "#1d3557", targetLayer: "background", wFrac: 1, hFrac: 1, xFrac: 0, yFrac: 0 },
      { name: "Moonlit Hills", fill: "#457b9d", targetLayer: "normal", parallaxFactor: 0.6, wFrac: 1, hFrac: 0.3, xFrac: 0, yFrac: 0.28 },
      { name: "Dark Silhouette Foreground", fill: "#0b2545", targetLayer: "foreground", parallaxFactor: 1.3, wFrac: 1, hFrac: 0.2, xFrac: 0, yFrac: 0.4 },
    ],
  },
];

interface UserCharacter {
  id: string;
  name: string;
  shapeData: string;
  faceData: string;
  limbsData?: string;
  accessoriesData?: string;
}

function getDefaultParallaxForLayer(layer: "background" | "normal" | "foreground"): number {
  if (layer === "background") return 0.2;
  if (layer === "normal") return 0.65;
  return 1.2;
}

export function AssetLibraryPanel() {
  const document = useEditorStore((s) => s.document);
  const addShapeNode = useEditorStore((s) => s.addShapeNode);
  const addShapeNodeWithFace = useEditorStore((s) => s.addShapeNodeWithFace);
  const addCharacterNode = useEditorStore((s) => s.addCharacterNode);
  const addTextNode = useEditorStore((s) => s.addTextNode);
  const addContainerNode = useEditorStore((s) => s.addContainerNode);
  const removeNodeById = useEditorStore((s) => s.removeNodeById);
  const updateNodeProps = useEditorStore((s) => s.updateNodeProps);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const selectNode = useSelectionStore((s) => s.selectNode);
  const spawnCounterRef = useRef(0);

  const [userCharacters, setUserCharacters] = useState<UserCharacter[]>([]);
  const [includeBgLayer, setIncludeBgLayer] = useState(true);
  const [includeMidLayer, setIncludeMidLayer] = useState(true);
  const [includeFgLayer, setIncludeFgLayer] = useState(true);

  const nextSpawnPos = () => {
    const i = spawnCounterRef.current++;
    const angle = (i % 24) * (Math.PI / 12);
    const radius = 20 + (i % 5) * 10;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  useEffect(() => {
    fetch("/api/characters")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setUserCharacters(data))
      .catch(() => {});
  }, []);

  const handleAddAsset = (asset: BuiltinAsset) => {
    const pos = nextSpawnPos();

    let nodeId: string;

    if (asset.category === "shape" && asset.shape) {
      if (asset.face && asset.limbs) {
        nodeId = addCharacterNode(asset.name, asset.shape, asset.face, asset.limbs, undefined, pos);
      } else if (asset.face) {
        nodeId = addShapeNodeWithFace(asset.name, asset.shape, asset.face, pos);
      } else {
        nodeId = addShapeNode(asset.name, asset.shape, pos);
      }
    } else if (asset.category === "text" && asset.text) {
      nodeId = addTextNode(asset.name, asset.text, pos);
    } else {
      return;
    }

    updateNodeProps(nodeId, { layer: "foreground" });
    selectNode(nodeId);
  };

  const handleAddContainer = () => {
    const id = addContainerNode("Group");
    updateNodeProps(id, { layer: "foreground" });
    selectNode(id);
  };

  const handleAddUserCharacter = (char: UserCharacter) => {
    try {
      const shape = JSON.parse(char.shapeData) as ShapeProps;
      const face = JSON.parse(char.faceData) as FaceProps;
      const limbs = char.limbsData
        ? (() => {
            const parsed = JSON.parse(char.limbsData) as Omit<Partial<LimbProps>, "handStyle"> & {
              handStyle?: unknown;
            };
            const rawHandStyle = typeof parsed.handStyle === "string" ? parsed.handStyle : undefined;
            const handStyle =
              rawHandStyle === "yes"
                ? "thumbs-up"
                : rawHandStyle === "no"
                  ? "thumbs-down"
                  : rawHandStyle;
            return {
              ...DEFAULT_LIMBS,
              ...parsed,
              handStyle: (handStyle as LimbProps["handStyle"]) ?? DEFAULT_LIMBS.handStyle,
            } satisfies LimbProps;
          })()
        : undefined;
      const accessories = char.accessoriesData ? JSON.parse(char.accessoriesData) as AccessoryProps[] : undefined;
      const pos = nextSpawnPos();
      const nodeId = limbs
        ? addCharacterNode(char.name, shape, face, limbs, accessories, pos)
        : addShapeNodeWithFace(char.name, shape, face, pos);
      updateNodeProps(nodeId, { layer: "foreground" });
      selectNode(nodeId);
    } catch {
      // ignore parse errors
    }
  };

  const handleAddBackground = (bg: SceneBackground) => {
    const autoLayerIds = Object.values(document.nodes)
      .filter((node) => node.id !== document.rootNodeId && node.assetId?.startsWith("scene-layer:"))
      .map((node) => node.id);
    for (const nodeId of autoLayerIds) {
      removeNodeById(nodeId);
    }

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
      updateNodeProps(nodeId, {
        assetId: `scene-layer:bg:${bg.id}:${layer.name}`,
        layer: layer.targetLayer,
        parallaxFactor: layer.parallaxFactor ?? getDefaultParallaxForLayer(layer.targetLayer),
      });
    }
  };

  const shouldIncludeSceneLayer = (layer: BackgroundLayerSpec): boolean => {
    if (layer.targetLayer === "background") return includeBgLayer;
    if (layer.targetLayer === "normal") return includeMidLayer;
    return includeFgLayer;
  };

  const handleCreateCreativeScene = (preset: CreativeScenePreset) => {
    const autoLayerIds = Object.values(document.nodes)
      .filter((node) => node.id !== document.rootNodeId && node.assetId?.startsWith("scene-layer:"))
      .map((node) => node.id);
    for (const nodeId of autoLayerIds) {
      removeNodeById(nodeId);
    }

    for (const layer of preset.layers) {
      if (!shouldIncludeSceneLayer(layer)) continue;
      const nodeId = addShapeNode(
        layer.name,
        {
          shapeType: "rectangle",
          width: Math.round(layer.wFrac * canvasWidth),
          height: Math.round(layer.hFrac * canvasHeight),
          fill: layer.fill,
        },
        { x: layer.xFrac * canvasWidth, y: layer.yFrac * canvasHeight }
      );
      updateNodeProps(nodeId, {
        assetId: `scene-layer:preset:${preset.id}:${layer.name}`,
        layer: layer.targetLayer,
        parallaxFactor: layer.parallaxFactor ?? getDefaultParallaxForLayer(layer.targetLayer),
      });
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
        {/* Scene creator: background/middleground/foreground composition */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-gray-500">Scene Creator</h3>
            <span className="text-[10px] text-gray-600">BG / Mid / FG</span>
          </div>
          <div className="mb-2 flex flex-wrap gap-2">
            <label className="flex items-center gap-1 text-[10px] text-gray-500">
              <input
                type="checkbox"
                checked={includeBgLayer}
                onChange={(e) => setIncludeBgLayer(e.target.checked)}
                className="rounded border border-gray-600 bg-gray-800 cursor-pointer"
              />
              Background
            </label>
            <label className="flex items-center gap-1 text-[10px] text-gray-500">
              <input
                type="checkbox"
                checked={includeMidLayer}
                onChange={(e) => setIncludeMidLayer(e.target.checked)}
                className="rounded border border-gray-600 bg-gray-800 cursor-pointer"
              />
              Middleground
            </label>
            <label className="flex items-center gap-1 text-[10px] text-gray-500">
              <input
                type="checkbox"
                checked={includeFgLayer}
                onChange={(e) => setIncludeFgLayer(e.target.checked)}
                className="rounded border border-gray-600 bg-gray-800 cursor-pointer"
              />
              Foreground
            </label>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {CREATIVE_SCENE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleCreateCreativeScene(preset)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-800 transition-colors group"
                title={`Create ${preset.name} scene`}
              >
                <div
                  className="w-10 h-6 rounded-md border border-gray-700"
                  style={{ backgroundColor: preset.preview }}
                />
                <span className="text-[10px] text-gray-500 group-hover:text-gray-300 truncate w-full text-center">
                  {preset.name}
                </span>
              </button>
            ))}
          </div>
        </div>

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
