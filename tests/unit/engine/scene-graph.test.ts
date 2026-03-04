import { describe, it, expect } from "vitest";
import {
  createSceneDocument,
  createNode,
  addNode,
  removeNode,
  reparentNode,
  reorderChild,
  updateTransform,
  duplicateNode,
  isDescendantOf,
  getDescendantIds,
  flattenSceneTree,
} from "@/engine/scene-graph";

describe("createSceneDocument", () => {
  it("should create a document with a root node", () => {
    const doc = createSceneDocument();
    expect(doc.version).toBe(1);
    expect(doc.rootNodeId).toBeTruthy();
    expect(doc.nodes[doc.rootNodeId]).toBeTruthy();
    expect(doc.nodes[doc.rootNodeId].type).toBe("container");
    expect(doc.nodes[doc.rootNodeId].parentId).toBeNull();
  });
});

describe("addNode", () => {
  it("should add a node to the root", () => {
    const doc = createSceneDocument();
    const node = createNode("Test Sprite", "sprite");
    const newDoc = addNode(doc, node, doc.rootNodeId);

    expect(newDoc.nodes[node.id]).toBeTruthy();
    expect(newDoc.nodes[node.id].parentId).toBe(doc.rootNodeId);
    expect(newDoc.nodes[doc.rootNodeId].childIds).toContain(node.id);
  });

  it("should add at a specific index", () => {
    let doc = createSceneDocument();
    const node1 = createNode("First", "sprite");
    const node2 = createNode("Second", "sprite");
    const node3 = createNode("Middle", "sprite");

    doc = addNode(doc, node1, doc.rootNodeId);
    doc = addNode(doc, node2, doc.rootNodeId);
    doc = addNode(doc, node3, doc.rootNodeId, 1); // Insert between first and second

    const children = doc.nodes[doc.rootNodeId].childIds;
    expect(children[0]).toBe(node1.id);
    expect(children[1]).toBe(node3.id);
    expect(children[2]).toBe(node2.id);
  });

  it("should not mutate the original document", () => {
    const doc = createSceneDocument();
    const node = createNode("Test", "sprite");
    const newDoc = addNode(doc, node, doc.rootNodeId);

    expect(doc.nodes[node.id]).toBeUndefined();
    expect(newDoc.nodes[node.id]).toBeTruthy();
  });
});

describe("removeNode", () => {
  it("should remove a node and update parent", () => {
    let doc = createSceneDocument();
    const node = createNode("Test", "sprite");
    doc = addNode(doc, node, doc.rootNodeId);

    const newDoc = removeNode(doc, node.id);
    expect(newDoc.nodes[node.id]).toBeUndefined();
    expect(newDoc.nodes[doc.rootNodeId].childIds).not.toContain(node.id);
  });

  it("should remove descendants recursively", () => {
    let doc = createSceneDocument();
    const parent = createNode("Parent", "container");
    const child = createNode("Child", "sprite");

    doc = addNode(doc, parent, doc.rootNodeId);
    doc = addNode(doc, child, parent.id);

    const newDoc = removeNode(doc, parent.id);
    expect(newDoc.nodes[parent.id]).toBeUndefined();
    expect(newDoc.nodes[child.id]).toBeUndefined();
  });

  it("should throw when removing root node", () => {
    const doc = createSceneDocument();
    expect(() => removeNode(doc, doc.rootNodeId)).toThrow("Cannot remove root node");
  });

  it("should remove associated animations", () => {
    let doc = createSceneDocument();
    const node = createNode("Animated", "sprite");
    doc = addNode(doc, node, doc.rootNodeId);

    // Manually add animation data
    doc = {
      ...doc,
      animations: {
        [node.id]: {
          nodeId: node.id,
          tracks: {
            x: { keyframes: [{ id: "kf1", timeMs: 0, value: 0, easing: { type: "linear" } }] },
          },
        },
      },
    };

    const newDoc = removeNode(doc, node.id);
    expect(newDoc.animations[node.id]).toBeUndefined();
  });
});

describe("reparentNode", () => {
  it("should move a node to a new parent", () => {
    let doc = createSceneDocument();
    const container = createNode("Group", "container");
    const sprite = createNode("Sprite", "sprite");

    doc = addNode(doc, container, doc.rootNodeId);
    doc = addNode(doc, sprite, doc.rootNodeId);

    const newDoc = reparentNode(doc, sprite.id, container.id);
    expect(newDoc.nodes[sprite.id].parentId).toBe(container.id);
    expect(newDoc.nodes[container.id].childIds).toContain(sprite.id);
    expect(newDoc.nodes[doc.rootNodeId].childIds).not.toContain(sprite.id);
  });

  it("should throw when reparenting to a descendant", () => {
    let doc = createSceneDocument();
    const parent = createNode("Parent", "container");
    const child = createNode("Child", "container");

    doc = addNode(doc, parent, doc.rootNodeId);
    doc = addNode(doc, child, parent.id);

    expect(() => reparentNode(doc, parent.id, child.id)).toThrow(
      "Cannot reparent a node to its own descendant"
    );
  });
});

describe("reorderChild", () => {
  it("should reorder children within a parent", () => {
    let doc = createSceneDocument();
    const a = createNode("A", "sprite");
    const b = createNode("B", "sprite");
    const c = createNode("C", "sprite");

    doc = addNode(doc, a, doc.rootNodeId);
    doc = addNode(doc, b, doc.rootNodeId);
    doc = addNode(doc, c, doc.rootNodeId);

    // Move C from index 2 to index 0
    const newDoc = reorderChild(doc, doc.rootNodeId, 2, 0);
    const children = newDoc.nodes[doc.rootNodeId].childIds;
    expect(children[0]).toBe(c.id);
    expect(children[1]).toBe(a.id);
    expect(children[2]).toBe(b.id);
  });
});

describe("updateTransform", () => {
  it("should update transform partially", () => {
    let doc = createSceneDocument();
    const node = createNode("Test", "sprite");
    doc = addNode(doc, node, doc.rootNodeId);

    const newDoc = updateTransform(doc, node.id, { x: 100, y: 200 });
    expect(newDoc.nodes[node.id].transform.x).toBe(100);
    expect(newDoc.nodes[node.id].transform.y).toBe(200);
    expect(newDoc.nodes[node.id].transform.rotation).toBe(0); // unchanged
  });
});

describe("duplicateNode", () => {
  it("should create a copy with a new ID", () => {
    let doc = createSceneDocument();
    const node = createNode("Original", "sprite");
    doc = addNode(doc, node, doc.rootNodeId);

    const [newDoc, newId] = duplicateNode(doc, node.id);
    expect(newId).not.toBe(node.id);
    expect(newDoc.nodes[newId]).toBeTruthy();
    expect(newDoc.nodes[newId].name).toBe("Original Copy");
    expect(newDoc.nodes[doc.rootNodeId].childIds).toHaveLength(2);
  });
});

describe("isDescendantOf", () => {
  it("should detect direct children", () => {
    let doc = createSceneDocument();
    const child = createNode("Child", "sprite");
    doc = addNode(doc, child, doc.rootNodeId);

    expect(isDescendantOf(doc, child.id, doc.rootNodeId)).toBe(true);
  });

  it("should detect deep descendants", () => {
    let doc = createSceneDocument();
    const parent = createNode("Parent", "container");
    const child = createNode("Child", "sprite");

    doc = addNode(doc, parent, doc.rootNodeId);
    doc = addNode(doc, child, parent.id);

    expect(isDescendantOf(doc, child.id, doc.rootNodeId)).toBe(true);
  });

  it("should return false for non-descendants", () => {
    let doc = createSceneDocument();
    const a = createNode("A", "sprite");
    const b = createNode("B", "sprite");

    doc = addNode(doc, a, doc.rootNodeId);
    doc = addNode(doc, b, doc.rootNodeId);

    expect(isDescendantOf(doc, a.id, b.id)).toBe(false);
  });
});

describe("flattenSceneTree", () => {
  it("should return all nodes in depth-first order", () => {
    let doc = createSceneDocument();
    const a = createNode("A", "container");
    const a1 = createNode("A1", "sprite");
    const b = createNode("B", "sprite");

    doc = addNode(doc, a, doc.rootNodeId);
    doc = addNode(doc, a1, a.id);
    doc = addNode(doc, b, doc.rootNodeId);

    const flat = flattenSceneTree(doc);
    const names = flat.map((n) => n.name);
    expect(names).toEqual(["Root", "A", "A1", "B"]);
  });
});
