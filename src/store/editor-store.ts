import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type {
  SceneDocument,
  SceneNode,
  NodeType,
  Transform,
  AnimatableProperty,
  EasingDefinition,
  ShapeProps,
  TextProps,
  FaceProps,
} from "@/engine/types";
import {
  createSceneDocument,
  createNode,
  addNode,
  removeNode,
  reparentNode,
  reorderChild,
  updateTransform,
  updateNode,
  duplicateNode,
} from "@/engine/scene-graph";
import {
  setKeyframe,
  removeKeyframe as removeKf,
  moveKeyframe,
  updateKeyframeEasing,
} from "@/engine/keyframe-engine";
import { deserializeScene } from "@/engine/serialization";

interface EditorState {
  // Project metadata
  projectId: string | null;
  projectName: string;
  fps: number;
  durationMs: number;
  canvasWidth: number;
  canvasHeight: number;
  version: number;

  // Scene data
  sceneId: string | null;
  document: SceneDocument;
  dirty: boolean;

  // Actions
  loadProject: (params: {
    projectId: string;
    name: string;
    fps: number;
    durationMs: number;
    width: number;
    height: number;
    version: number;
    sceneId: string;
    sceneData: unknown;
  }) => void;

  // Node operations
  addSpriteNode: (name: string, assetId?: string, transform?: Partial<Transform>) => string;
  addShapeNode: (name: string, shape: ShapeProps, transform?: Partial<Transform>) => string;
  addTextNode: (name: string, text: TextProps, transform?: Partial<Transform>) => string;
  addContainerNode: (name: string) => string;
  removeNodeById: (nodeId: string) => void;
  updateNodeTransform: (nodeId: string, transform: Partial<Transform>) => void;
  addShapeNodeWithFace: (name: string, shape: ShapeProps, face: FaceProps, transform?: Partial<Transform>) => string;
  updateNodeProps: (nodeId: string, updates: Partial<Pick<SceneNode, "name" | "visible" | "locked" | "showLabel" | "layer" | "pivot" | "assetId" | "shape" | "text" | "face">>) => void;
  reparentNodeTo: (nodeId: string, newParentId: string, index?: number) => void;
  reorderChildNode: (parentId: string, fromIndex: number, toIndex: number) => void;
  duplicateNodeById: (nodeId: string) => string | null;

  // Keyframe operations
  setKeyframeAt: (nodeId: string, property: AnimatableProperty, timeMs: number, value: number, easing?: EasingDefinition) => void;
  removeKeyframeById: (nodeId: string, property: AnimatableProperty, keyframeId: string) => void;
  moveKeyframeTo: (nodeId: string, property: AnimatableProperty, keyframeId: string, newTimeMs: number) => void;
  updateKeyframeEasingById: (nodeId: string, property: AnimatableProperty, keyframeId: string, easing: EasingDefinition) => void;

  // Project settings
  setFps: (fps: number) => void;
  setProjectName: (name: string) => void;
  setVersion: (version: number) => void;
  setCanvasDimensions: (width: number, height: number) => void;
  markClean: () => void;
}

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    projectId: null,
    projectName: "Untitled",
    fps: 24,
    durationMs: 30000,
    canvasWidth: 1920,
    canvasHeight: 1080,
    version: 1,
    sceneId: null,
    document: createSceneDocument(),
    dirty: false,

    loadProject: (params) => {
      const doc = deserializeScene(params.sceneData);
      set((state) => {
        state.projectId = params.projectId;
        state.projectName = params.name;
        state.fps = params.fps;
        state.durationMs = params.durationMs;
        state.canvasWidth = params.width;
        state.canvasHeight = params.height;
        state.version = params.version;
        state.sceneId = params.sceneId;
        state.document = doc;
        state.dirty = false;
      });
    },

    addSpriteNode: (name, assetId, transform) => {
      const node = createNode(name, "sprite" as NodeType, {
        assetId,
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, ...transform },
      });
      set((state) => {
        state.document = addNode(state.document, node, state.document.rootNodeId);
        state.dirty = true;
      });
      return node.id;
    },

    addShapeNode: (name, shape, transform) => {
      const node = createNode(name, "shape" as NodeType, {
        shape,
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, ...transform },
      });
      set((state) => {
        state.document = addNode(state.document, node, state.document.rootNodeId);
        state.dirty = true;
      });
      return node.id;
    },

    addShapeNodeWithFace: (name, shape, face, transform) => {
      const node = createNode(name, "shape" as NodeType, {
        shape,
        face,
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, ...transform },
      });
      set((state) => {
        state.document = addNode(state.document, node, state.document.rootNodeId);
        state.dirty = true;
      });
      return node.id;
    },

    addTextNode: (name, text, transform) => {
      const node = createNode(name, "text" as NodeType, {
        text,
        transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, ...transform },
      });
      set((state) => {
        state.document = addNode(state.document, node, state.document.rootNodeId);
        state.dirty = true;
      });
      return node.id;
    },

    addContainerNode: (name) => {
      const node = createNode(name, "container" as NodeType);
      set((state) => {
        state.document = addNode(state.document, node, state.document.rootNodeId);
        state.dirty = true;
      });
      return node.id;
    },

    removeNodeById: (nodeId) => {
      set((state) => {
        state.document = removeNode(state.document, nodeId);
        state.dirty = true;
      });
    },

    updateNodeTransform: (nodeId, transform) => {
      set((state) => {
        state.document = updateTransform(state.document, nodeId, transform);
        state.dirty = true;
      });
    },

    updateNodeProps: (nodeId, updates) => {
      set((state) => {
        state.document = updateNode(state.document, nodeId, updates);
        state.dirty = true;
      });
    },

    reparentNodeTo: (nodeId, newParentId, index) => {
      set((state) => {
        state.document = reparentNode(state.document, nodeId, newParentId, index);
        state.dirty = true;
      });
    },

    reorderChildNode: (parentId, fromIndex, toIndex) => {
      set((state) => {
        state.document = reorderChild(state.document, parentId, fromIndex, toIndex);
        state.dirty = true;
      });
    },

    duplicateNodeById: (nodeId) => {
      let newId: string | null = null;
      set((state) => {
        const [newDoc, id] = duplicateNode(state.document, nodeId);
        state.document = newDoc;
        state.dirty = true;
        newId = id;
      });
      return newId;
    },

    setKeyframeAt: (nodeId, property, timeMs, value, easing) => {
      set((state) => {
        state.document = setKeyframe(state.document, nodeId, property, timeMs, value, easing);
        state.dirty = true;
      });
    },

    removeKeyframeById: (nodeId, property, keyframeId) => {
      set((state) => {
        state.document = removeKf(state.document, nodeId, property, keyframeId);
        state.dirty = true;
      });
    },

    moveKeyframeTo: (nodeId, property, keyframeId, newTimeMs) => {
      set((state) => {
        state.document = moveKeyframe(state.document, nodeId, property, keyframeId, newTimeMs);
        state.dirty = true;
      });
    },

    updateKeyframeEasingById: (nodeId, property, keyframeId, easing) => {
      set((state) => {
        state.document = updateKeyframeEasing(state.document, nodeId, property, keyframeId, easing);
        state.dirty = true;
      });
    },

    setFps: (fps) => {
      set((state) => {
        state.fps = fps;
        state.dirty = true;
      });
    },

    setProjectName: (name) => {
      set((state) => {
        state.projectName = name;
        state.dirty = true;
      });
    },

    setVersion: (version) => {
      set((state) => {
        state.version = version;
      });
    },

    setCanvasDimensions: (width, height) => {
      set((state) => {
        state.canvasWidth = width;
        state.canvasHeight = height;
        state.dirty = true;
      });
    },

    markClean: () => {
      set((state) => {
        state.dirty = false;
      });
    },
  }))
);
