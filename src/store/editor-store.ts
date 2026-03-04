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
  TimelineComposition,
} from "@/engine/types";
import { EMPTY_TIMELINE_COMPOSITION } from "@/engine/types";
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
import {
  createSingleClipComposition,
  createCompositionFromScenes,
  normalizeComposition,
  computeCompositionDuration,
} from "@/engine/composition";

interface EditorSceneState {
  id: string;
  name: string;
  order: number;
  document: SceneDocument;
}

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
  scenes: Record<string, EditorSceneState>;
  sceneOrder: string[];
  timelineComposition: TimelineComposition;
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
    scenes: {
      id: string;
      name: string;
      order: number;
      data: unknown;
    }[];
    timelineData?: Record<string, unknown> | null;
  }) => void;
  setActiveScene: (sceneId: string) => void;
  setTimelineComposition: (composition: TimelineComposition) => void;

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

function tryDeserializeSceneData(data: unknown): SceneDocument {
  try {
    return deserializeScene(data);
  } catch {
    return createSceneDocument();
  }
}

function applyDocumentToActiveScene(
  state: {
    sceneId: string | null;
    document: SceneDocument;
    scenes: Record<string, EditorSceneState>;
    dirty: boolean;
  },
  nextDocument: SceneDocument
) {
  state.document = nextDocument;
  if (state.sceneId && state.scenes[state.sceneId]) {
    state.scenes[state.sceneId] = {
      ...state.scenes[state.sceneId],
      document: nextDocument,
    };
  }
  state.dirty = true;
}

function parseTimelineData(
  timelineData: Record<string, unknown> | null | undefined,
  scenes: { id: string; order: number }[],
  durationMs: number
): TimelineComposition {
  const sceneIds = new Set(scenes.map((s) => s.id));

  if (timelineData && typeof timelineData === "object") {
    const maybeComposition = timelineData as unknown as TimelineComposition;
    if (maybeComposition.version === 1 && Array.isArray(maybeComposition.clips)) {
      const normalized = normalizeComposition(maybeComposition);
      const filtered = {
        version: 1 as const,
        clips: normalized.clips.filter((clip) => sceneIds.has(clip.sceneId)),
      };
      if (filtered.clips.length > 0 || scenes.length === 0) {
        return filtered;
      }
    }
  }

  if (scenes.length === 0) return EMPTY_TIMELINE_COMPOSITION;
  if (scenes.length === 1) return createSingleClipComposition(scenes[0].id, durationMs);

  const defaultClipDuration = Math.max(1000, Math.floor(durationMs / scenes.length));
  return createCompositionFromScenes(scenes, defaultClipDuration);
}

export const useEditorStore = create<EditorState>()(
  immer((set) => ({
    projectId: null,
    projectName: "Untitled",
    fps: 24,
    durationMs: 30000,
    canvasWidth: 1920,
    canvasHeight: 1080,
    version: 1,
    sceneId: null,
    document: createSceneDocument(),
    scenes: {},
    sceneOrder: [],
    timelineComposition: EMPTY_TIMELINE_COMPOSITION,
    dirty: false,

    loadProject: (params) => {
      const sortedScenes = [...params.scenes].sort((a, b) => a.order - b.order);
      const sceneEntries = sortedScenes.map((scene) => ({
        id: scene.id,
        name: scene.name,
        order: scene.order,
        document: tryDeserializeSceneData(scene.data),
      }));

      const scenesById: Record<string, EditorSceneState> = {};
      for (const scene of sceneEntries) {
        scenesById[scene.id] = scene;
      }

      const timeline = parseTimelineData(
        params.timelineData ?? null,
        sceneEntries.map((s) => ({ id: s.id, order: s.order })),
        params.durationMs
      );
      const timelineDurationMs = computeCompositionDuration(timeline);

      const activeSceneId = sceneEntries[0]?.id ?? null;
      const activeDocument = activeSceneId
        ? scenesById[activeSceneId].document
        : createSceneDocument();

      set((state) => {
        state.projectId = params.projectId;
        state.projectName = params.name;
        state.fps = params.fps;
        state.durationMs = Math.max(params.durationMs, timelineDurationMs);
        state.canvasWidth = params.width;
        state.canvasHeight = params.height;
        state.version = params.version;
        state.sceneId = activeSceneId;
        state.document = activeDocument;
        state.scenes = scenesById;
        state.sceneOrder = sceneEntries.map((s) => s.id);
        state.timelineComposition = timeline;
        state.dirty = false;
      });
    },

    setActiveScene: (sceneId) => {
      set((state) => {
        const scene = state.scenes[sceneId];
        if (!scene) return;
        state.sceneId = sceneId;
        state.document = scene.document;
      });
    },

    setTimelineComposition: (composition) => {
      set((state) => {
        state.timelineComposition = normalizeComposition(composition);
        const computedDuration = computeCompositionDuration(state.timelineComposition);
        if (computedDuration > 0) {
          state.durationMs = computedDuration;
        }
        state.dirty = true;
      });
    },

    addSpriteNode: (name, assetId, transform) => {
      const node = createNode(name, "sprite" as NodeType, {
        assetId,
        transform: {
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          ...transform,
        },
      });
      set((state) => {
        const nextDoc = addNode(state.document, node, state.document.rootNodeId);
        applyDocumentToActiveScene(state, nextDoc);
      });
      return node.id;
    },

    addShapeNode: (name, shape, transform) => {
      const node = createNode(name, "shape" as NodeType, {
        shape,
        transform: {
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          ...transform,
        },
      });
      set((state) => {
        const nextDoc = addNode(state.document, node, state.document.rootNodeId);
        applyDocumentToActiveScene(state, nextDoc);
      });
      return node.id;
    },

    addShapeNodeWithFace: (name, shape, face, transform) => {
      const node = createNode(name, "shape" as NodeType, {
        shape,
        face,
        transform: {
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          ...transform,
        },
      });
      set((state) => {
        const nextDoc = addNode(state.document, node, state.document.rootNodeId);
        applyDocumentToActiveScene(state, nextDoc);
      });
      return node.id;
    },

    addTextNode: (name, text, transform) => {
      const node = createNode(name, "text" as NodeType, {
        text,
        transform: {
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          ...transform,
        },
      });
      set((state) => {
        const nextDoc = addNode(state.document, node, state.document.rootNodeId);
        applyDocumentToActiveScene(state, nextDoc);
      });
      return node.id;
    },

    addContainerNode: (name) => {
      const node = createNode(name, "container" as NodeType);
      set((state) => {
        const nextDoc = addNode(state.document, node, state.document.rootNodeId);
        applyDocumentToActiveScene(state, nextDoc);
      });
      return node.id;
    },

    removeNodeById: (nodeId) => {
      set((state) => {
        const nextDoc = removeNode(state.document, nodeId);
        applyDocumentToActiveScene(state, nextDoc);
      });
    },

    updateNodeTransform: (nodeId, transform) => {
      set((state) => {
        const nextDoc = updateTransform(state.document, nodeId, transform);
        applyDocumentToActiveScene(state, nextDoc);
      });
    },

    updateNodeProps: (nodeId, updates) => {
      set((state) => {
        const nextDoc = updateNode(state.document, nodeId, updates);
        applyDocumentToActiveScene(state, nextDoc);
      });
    },

    reparentNodeTo: (nodeId, newParentId, index) => {
      set((state) => {
        const nextDoc = reparentNode(state.document, nodeId, newParentId, index);
        applyDocumentToActiveScene(state, nextDoc);
      });
    },

    reorderChildNode: (parentId, fromIndex, toIndex) => {
      set((state) => {
        const nextDoc = reorderChild(state.document, parentId, fromIndex, toIndex);
        applyDocumentToActiveScene(state, nextDoc);
      });
    },

    duplicateNodeById: (nodeId) => {
      let newId: string | null = null;
      set((state) => {
        const [nextDoc, id] = duplicateNode(state.document, nodeId);
        applyDocumentToActiveScene(state, nextDoc);
        newId = id;
      });
      return newId;
    },

    setKeyframeAt: (nodeId, property, timeMs, value, easing) => {
      set((state) => {
        const nextDoc = setKeyframe(state.document, nodeId, property, timeMs, value, easing);
        applyDocumentToActiveScene(state, nextDoc);
      });
    },

    removeKeyframeById: (nodeId, property, keyframeId) => {
      set((state) => {
        const nextDoc = removeKf(state.document, nodeId, property, keyframeId);
        applyDocumentToActiveScene(state, nextDoc);
      });
    },

    moveKeyframeTo: (nodeId, property, keyframeId, newTimeMs) => {
      set((state) => {
        const nextDoc = moveKeyframe(state.document, nodeId, property, keyframeId, newTimeMs);
        applyDocumentToActiveScene(state, nextDoc);
      });
    },

    updateKeyframeEasingById: (nodeId, property, keyframeId, easing) => {
      set((state) => {
        const nextDoc = updateKeyframeEasing(state.document, nodeId, property, keyframeId, easing);
        applyDocumentToActiveScene(state, nextDoc);
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
