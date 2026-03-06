import { describe, expect, it } from "vitest";
import { parseDrawingToCharacter } from "@/lib/digitize/drawing-parser";

describe("drawing parser", () => {
  it("throws on empty input", async () => {
    await expect(
      parseDrawingToCharacter({
        fileName: "empty.png",
        mimeType: "image/png",
        bytes: new Uint8Array(),
      })
    ).rejects.toThrow(/empty/i);
  });

  it("returns a draft payload with detected accessories from filename", async () => {
    const result = await parseDrawingToCharacter({
      fileName: "happy_hat_glasses.png",
      mimeType: "image/png",
      bytes: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
      removeBackground: true,
    });

    expect(result.shape.width).toBeGreaterThan(0);
    expect(result.shape.height).toBeGreaterThan(0);
    expect(result.face.expression).toBe("happy");
    expect(result.accessories.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => /background/i.test(w))).toBe(true);
  });

  it("flags svg-specific warning", async () => {
    const result = await parseDrawingToCharacter({
      fileName: "character.svg",
      mimeType: "image/svg+xml",
      bytes: new Uint8Array([9, 8, 7, 6]),
    });

    expect(result.warnings.some((w) => /svg/i.test(w))).toBe(true);
  });

  it("infers rectangle body from wide png dimensions", async () => {
    // Minimal PNG header + IHDR with width=300, height=100.
    const bytes = new Uint8Array([
      137, 80, 78, 71, 13, 10, 26, 10, // signature
      0, 0, 0, 13, // IHDR length
      73, 72, 68, 82, // "IHDR"
      0, 0, 1, 44, // width 300
      0, 0, 0, 100, // height 100
      8, 6, 0, 0, 0, // bit depth, color type, compression, filter, interlace
      0, 0, 0, 0, // CRC placeholder
    ]);

    const result = await parseDrawingToCharacter({
      fileName: "wide-body.png",
      mimeType: "image/png",
      bytes,
    });

    expect(result.meta.image.width).toBe(300);
    expect(result.meta.image.height).toBe(100);
    expect(result.shape.shapeType).toBe("rectangle");
  });

  it("infers ellipse body from svg circle primitive", async () => {
    const svg = `<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="40" fill="#ff0000"/></svg>`;
    const result = await parseDrawingToCharacter({
      fileName: "circle.svg",
      mimeType: "image/svg+xml",
      bytes: new TextEncoder().encode(svg),
    });

    expect(result.meta.image.format).toBe("svg");
    expect(result.shape.shapeType).toBe("ellipse");
  });
});
