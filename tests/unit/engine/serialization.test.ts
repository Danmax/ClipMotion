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
  });
});
