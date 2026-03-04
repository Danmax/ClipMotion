import { nanoid } from "nanoid";
import type {
  SceneDocument,
  SceneNode,
  NodeType,
  Transform,
  NodeAnimation,
} from "./types";
import { DEFAULT_TRANSFORM } from "./types";

// ─── Document Creation ───────────────────────────────────────

/** Create a new empty scene document with a root container */
export function createSceneDocument(): SceneDocument {
  const rootId = nanoid();
  return {
    version: 1,
    rootNodeId: rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        name: "Root",
        type: "container",
        parentId: null,
        childIds: [],
        visible: true,
        locked: false,
        showLabel: true,
        layer: "normal",
        transform: { ...DEFAULT_TRANSFORM },
        pivot: { x: 0.5, y: 0.5 },
      },
    },
    animations: {},
  };
}

// ─── Node Operations ─────────────────────────────────────────

/** Create a new scene node (not yet added to the document) */
export function createNode(
  name: string,
  type: NodeType,
  overrides?: Partial<SceneNode>
): SceneNode {
  return {
    id: nanoid(),
    name,
    type,
    parentId: null,
    childIds: [],
    visible: true,
    locked: false,
    showLabel: true,
    layer: "normal",
    transform: { ...DEFAULT_TRANSFORM },
    pivot: { x: 0.5, y: 0.5 },
    ...overrides,
  };
}

/**
 * Add a node to the document under the specified parent.
 * Returns a new document (immutable).
 */
export function addNode(
  doc: SceneDocument,
  node: SceneNode,
  parentId: string,
  index?: number
): SceneDocument {
  const parent = doc.nodes[parentId];
  if (!parent) throw new Error(`Parent node ${parentId} not found`);

  const newChildIds = [...parent.childIds];
  if (index !== undefined && index >= 0 && index <= newChildIds.length) {
    newChildIds.splice(index, 0, node.id);
  } else {
    newChildIds.push(node.id);
  }

  return {
    ...doc,
    nodes: {
      ...doc.nodes,
      [node.id]: { ...node, parentId },
      [parentId]: { ...parent, childIds: newChildIds },
    },
  };
}

/**
 * Remove a node and all its descendants from the document.
 * Returns a new document.
 */
export function removeNode(
  doc: SceneDocument,
  nodeId: string
): SceneDocument {
  if (nodeId === doc.rootNodeId) {
    throw new Error("Cannot remove root node");
  }

  const node = doc.nodes[nodeId];
  if (!node) return doc;

  // Collect all descendant IDs
  const toRemove = new Set<string>();
  collectDescendants(doc, nodeId, toRemove);

  // Remove from parent's childIds
  const newNodes = { ...doc.nodes };
  const newAnimations = { ...doc.animations };

  if (node.parentId && newNodes[node.parentId]) {
    newNodes[node.parentId] = {
      ...newNodes[node.parentId],
      childIds: newNodes[node.parentId].childIds.filter(
        (id) => !toRemove.has(id)
      ),
    };
  }

  // Delete all removed nodes and their animations
  for (const id of toRemove) {
    delete newNodes[id];
    delete newAnimations[id];
  }

  return { ...doc, nodes: newNodes, animations: newAnimations };
}

/** Collect a node and all its descendants into a set */
function collectDescendants(
  doc: SceneDocument,
  nodeId: string,
  result: Set<string>
): void {
  result.add(nodeId);
  const node = doc.nodes[nodeId];
  if (node) {
    for (const childId of node.childIds) {
      collectDescendants(doc, childId, result);
    }
  }
}

/**
 * Reparent a node to a new parent.
 * Returns a new document.
 */
export function reparentNode(
  doc: SceneDocument,
  nodeId: string,
  newParentId: string,
  index?: number
): SceneDocument {
  if (nodeId === doc.rootNodeId) {
    throw new Error("Cannot reparent root node");
  }

  const node = doc.nodes[nodeId];
  if (!node) throw new Error(`Node ${nodeId} not found`);

  // Prevent reparenting to a descendant
  if (isDescendantOf(doc, newParentId, nodeId)) {
    throw new Error("Cannot reparent a node to its own descendant");
  }

  const newParent = doc.nodes[newParentId];
  if (!newParent) throw new Error(`New parent ${newParentId} not found`);

  const newNodes = { ...doc.nodes };

  // Remove from old parent
  if (node.parentId && newNodes[node.parentId]) {
    newNodes[node.parentId] = {
      ...newNodes[node.parentId],
      childIds: newNodes[node.parentId].childIds.filter((id) => id !== nodeId),
    };
  }

  // Add to new parent
  const newChildIds = [...newParent.childIds];
  if (index !== undefined && index >= 0 && index <= newChildIds.length) {
    newChildIds.splice(index, 0, nodeId);
  } else {
    newChildIds.push(nodeId);
  }
  newNodes[newParentId] = { ...newNodes[newParentId], childIds: newChildIds };

  // Update node's parentId
  newNodes[nodeId] = { ...node, parentId: newParentId };

  return { ...doc, nodes: newNodes };
}

/**
 * Reorder children of a parent node.
 * Moves a child from one index to another.
 */
export function reorderChild(
  doc: SceneDocument,
  parentId: string,
  fromIndex: number,
  toIndex: number
): SceneDocument {
  const parent = doc.nodes[parentId];
  if (!parent) throw new Error(`Parent ${parentId} not found`);

  const newChildIds = [...parent.childIds];
  const [moved] = newChildIds.splice(fromIndex, 1);
  newChildIds.splice(toIndex, 0, moved);

  return {
    ...doc,
    nodes: {
      ...doc.nodes,
      [parentId]: { ...parent, childIds: newChildIds },
    },
  };
}

/**
 * Update the transform of a node.
 * Returns a new document.
 */
export function updateTransform(
  doc: SceneDocument,
  nodeId: string,
  transform: Partial<Transform>
): SceneDocument {
  const node = doc.nodes[nodeId];
  if (!node) throw new Error(`Node ${nodeId} not found`);

  return {
    ...doc,
    nodes: {
      ...doc.nodes,
      [nodeId]: {
        ...node,
        transform: { ...node.transform, ...transform },
      },
    },
  };
}

/**
 * Update arbitrary properties of a node.
 */
export function updateNode(
  doc: SceneDocument,
  nodeId: string,
  updates: Partial<Pick<SceneNode, "name" | "visible" | "locked" | "showLabel" | "layer" | "pivot" | "assetId" | "shape" | "text" | "face" | "limbs">>
): SceneDocument {
  const node = doc.nodes[nodeId];
  if (!node) throw new Error(`Node ${nodeId} not found`);

  return {
    ...doc,
    nodes: {
      ...doc.nodes,
      [nodeId]: { ...node, ...updates },
    },
  };
}

/**
 * Duplicate a node and all its descendants.
 * Returns [newDocument, newRootNodeId].
 */
export function duplicateNode(
  doc: SceneDocument,
  nodeId: string
): [SceneDocument, string] {
  const node = doc.nodes[nodeId];
  if (!node) throw new Error(`Node ${nodeId} not found`);
  if (!node.parentId) throw new Error("Cannot duplicate root node");

  // Deep clone with new IDs
  const idMap = new Map<string, string>();
  const cloned = deepCloneNode(doc, nodeId, idMap);

  let newDoc = { ...doc, nodes: { ...doc.nodes }, animations: { ...doc.animations } };

  // Add all cloned nodes
  for (const [, newNode] of cloned.nodes) {
    newDoc.nodes[newNode.id] = newNode;
  }

  // Clone animations with new IDs
  for (const [oldId, newId] of idMap) {
    const anim = doc.animations[oldId];
    if (anim) {
      newDoc.animations[newId] = {
        nodeId: newId,
        tracks: JSON.parse(JSON.stringify(anim.tracks)),
      };
      // Give new keyframe IDs
      for (const track of Object.values(newDoc.animations[newId].tracks)) {
        if (track) {
          for (const kf of track.keyframes) {
            kf.id = nanoid();
          }
        }
      }
    }
  }

  // Add to parent
  const parentId = node.parentId;
  const parentIdx = newDoc.nodes[parentId].childIds.indexOf(nodeId);
  const newChildIds = [...newDoc.nodes[parentId].childIds];
  newChildIds.splice(parentIdx + 1, 0, cloned.rootId);
  newDoc.nodes[parentId] = { ...newDoc.nodes[parentId], childIds: newChildIds };

  return [newDoc, cloned.rootId];
}

function deepCloneNode(
  doc: SceneDocument,
  nodeId: string,
  idMap: Map<string, string>
): { rootId: string; nodes: Map<string, SceneNode> } {
  const result = new Map<string, SceneNode>();
  const original = doc.nodes[nodeId];
  const newId = nanoid();
  idMap.set(nodeId, newId);

  const newChildIds: string[] = [];
  for (const childId of original.childIds) {
    const child = deepCloneNode(doc, childId, idMap);
    for (const [id, node] of child.nodes) {
      result.set(id, node);
    }
    newChildIds.push(child.rootId);

    // Update child's parentId to point to this new node
    const childNode = result.get(child.rootId);
    if (childNode) {
      result.set(child.rootId, { ...childNode, parentId: newId });
    }
  }

  result.set(newId, {
    ...original,
    id: newId,
    name: `${original.name} Copy`,
    childIds: newChildIds,
  });

  return { rootId: newId, nodes: result };
}

// ─── Queries ─────────────────────────────────────────────────

/** Check if nodeId is a descendant of ancestorId */
export function isDescendantOf(
  doc: SceneDocument,
  nodeId: string,
  ancestorId: string
): boolean {
  let current = doc.nodes[nodeId];
  while (current) {
    if (current.id === ancestorId) return true;
    if (!current.parentId) return false;
    current = doc.nodes[current.parentId];
  }
  return false;
}

/** Get all descendant node IDs (excluding the node itself) */
export function getDescendantIds(
  doc: SceneDocument,
  nodeId: string
): string[] {
  const result: string[] = [];
  const node = doc.nodes[nodeId];
  if (!node) return result;

  for (const childId of node.childIds) {
    result.push(childId);
    result.push(...getDescendantIds(doc, childId));
  }
  return result;
}

/** Get the ordered list of all nodes for rendering (depth-first) */
export function flattenSceneTree(doc: SceneDocument): SceneNode[] {
  const result: string[] = [];

  function walk(nodeId: string) {
    result.push(nodeId);
    const node = doc.nodes[nodeId];
    if (node) {
      for (const childId of node.childIds) {
        walk(childId);
      }
    }
  }

  walk(doc.rootNodeId);
  return result.map((id) => doc.nodes[id]).filter(Boolean);
}

/** Get the path from root to a node (array of node IDs) */
export function getNodePath(doc: SceneDocument, nodeId: string): string[] {
  const path: string[] = [];
  let current = doc.nodes[nodeId];
  while (current) {
    path.unshift(current.id);
    if (!current.parentId) break;
    current = doc.nodes[current.parentId];
  }
  return path;
}
