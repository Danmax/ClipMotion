import { describe, expect, it } from "vitest";
import { addNode, createNode, createSceneDocument } from "@/engine/scene-graph";
import { deserializeScene, serializeScene } from "@/engine/serialization";
import { DEFAULT_FACE, DEFAULT_LIMBS } from "@/engine/types";

describe("scene serialization", () => {
  it("preserves limbs when loading a scene", () => {
    let doc = createSceneDocument();
    const node = createNode("Character", "shape", {
      shape: {
        shapeType: "ellipse",
        width: 120,
        height: 120,
        fill: "#00cc33",
        pattern: "dots",
        patternColor: "#ffffff",
        patternScale: 1.4,
      },
      face: DEFAULT_FACE,
      limbs: {
        ...DEFAULT_LIMBS,
        armStyle: "bent",
        legStyle: "straight",
        limbThickness: 4,
      },
    });
    doc = addNode(doc, node, doc.rootNodeId);

    const payload = serializeScene(doc);
    const loaded = deserializeScene(payload);

    const loadedNode = loaded.nodes[node.id];
    expect(loadedNode).toBeTruthy();
    expect(loadedNode.limbs).toBeTruthy();
    expect(loadedNode.limbs?.armStyle).toBe("bent");
    expect(loadedNode.limbs?.legStyle).toBe("straight");
    expect(loadedNode.limbs?.limbThickness).toBe(4);
    expect(loadedNode.shape?.pattern).toBe("dots");
  });

  it("backfills missing shoe fields for older scenes", () => {
    let doc = createSceneDocument();
    const node = createNode("Legacy Character", "shape", {
      shape: {
        shapeType: "ellipse",
        width: 100,
        height: 120,
        fill: "#44aaff",
      },
      limbs: {
        ...DEFAULT_LIMBS,
      },
    });
    doc = addNode(doc, node, doc.rootNodeId);

    const payload = serializeScene(doc) as {
      nodes: Record<string, { limbs?: Record<string, unknown> }>;
    };
    const legacyLimbs = payload.nodes[node.id].limbs;
    if (legacyLimbs) {
      delete legacyLimbs.shoeStyle;
      delete legacyLimbs.shoeColor;
      delete legacyLimbs.shoeSoleColor;
      delete legacyLimbs.shoeAccessory;
      delete legacyLimbs.shoeAccessoryColor;
      delete legacyLimbs.armRotationDeg;
      delete legacyLimbs.handStyle;
      delete legacyLimbs.handColor;
    }

    const loaded = deserializeScene(payload);
    const loadedNode = loaded.nodes[node.id];
    expect(loadedNode.limbs?.shoeStyle).toBe("kicks");
    expect(loadedNode.limbs?.shoeColor).toBe("#111111");
    expect(loadedNode.limbs?.shoeSoleColor).toBe("#f2f4f7");
    expect(loadedNode.limbs?.shoeAccessory).toBe("none");
    expect(loadedNode.limbs?.shoeAccessoryColor).toBe("#ffffff");
    expect(loadedNode.limbs?.armRotationDeg).toBe(0);
    expect(loadedNode.limbs?.handStyle).toBe("cartoon");
    expect(loadedNode.limbs?.handColor).toBe("#f4c29b");
  });

  it("maps legacy yes/no hand styles to current values", () => {
    let doc = createSceneDocument();
    const node = createNode("Legacy Hand Style", "shape", {
      shape: {
        shapeType: "ellipse",
        width: 110,
        height: 110,
        fill: "#ffaa44",
      },
      limbs: {
        ...DEFAULT_LIMBS,
      },
    });
    doc = addNode(doc, node, doc.rootNodeId);

    const payload = serializeScene(doc) as {
      nodes: Record<string, { limbs?: Record<string, unknown> }>;
    };

    if (payload.nodes[node.id].limbs) {
      payload.nodes[node.id].limbs!.handStyle = "no";
    }
    const loadedNo = deserializeScene(payload);
    expect(loadedNo.nodes[node.id].limbs?.handStyle).toBe("thumbs-down");

    if (payload.nodes[node.id].limbs) {
      payload.nodes[node.id].limbs!.handStyle = "yes";
    }
    const loadedYes = deserializeScene(payload);
    expect(loadedYes.nodes[node.id].limbs?.handStyle).toBe("thumbs-up");
  });

  it("preserves custom path shape points", () => {
    let doc = createSceneDocument();
    const node = createNode("Pen Shape", "shape", {
      shape: {
        shapeType: "custom-path",
        width: 120,
        height: 90,
        fill: "#58a6ff",
        customPath: [
          { x: -60, y: -20 },
          { x: -10, y: -45 },
          { x: 55, y: -10 },
          { x: 30, y: 40 },
          { x: -45, y: 30 },
        ],
      },
    });
    doc = addNode(doc, node, doc.rootNodeId);

    const payload = serializeScene(doc);
    const loaded = deserializeScene(payload);
    const loadedPath = loaded.nodes[node.id].shape?.customPath;

    expect(loaded.nodes[node.id].shape?.shapeType).toBe("custom-path");
    expect(loadedPath?.length).toBe(5);
    expect(loadedPath?.[0]).toEqual({ x: -60, y: -20 });
    expect(loadedPath?.[4]).toEqual({ x: -45, y: 30 });
  });
});
