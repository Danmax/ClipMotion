import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ALLOWED_IMAGE_TYPES, MAX_ASSET_SIZE_BYTES } from "@/lib/constants";
import { parseDrawingToCharacter } from "../../../../lib/digitize/drawing-parser";

const ACCEPTED_IMAGE_TYPES = new Set<string>(ALLOWED_IMAGE_TYPES);

function sanitizeName(input: string): string {
  return input
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const image = formData.get("image");
    const rawName = formData.get("name");
    const rawRemoveBackground = formData.get("removeBackground");
    const nameInput = typeof rawName === "string" ? rawName.trim() : "";
    const removeBackground =
      typeof rawRemoveBackground === "string"
        ? rawRemoveBackground === "true"
        : false;

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Missing image upload" }, { status: 400 });
    }
    if (!ACCEPTED_IMAGE_TYPES.has(image.type)) {
      return NextResponse.json(
        { error: "Unsupported image type", accepted: [...ACCEPTED_IMAGE_TYPES] },
        { status: 400 }
      );
    }
    if (image.size <= 0 || image.size > MAX_ASSET_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "Invalid image size",
          maxBytes: MAX_ASSET_SIZE_BYTES,
        },
        { status: 400 }
      );
    }

    const bytes = new Uint8Array(await image.arrayBuffer());
    const parsed = await parseDrawingToCharacter({
      fileName: image.name || "drawing",
      mimeType: image.type,
      bytes,
      removeBackground,
    });

    const fallbackName = sanitizeName(image.name || "Digitized Character");
    const characterName = nameInput.length > 0 ? sanitizeName(nameInput) : fallbackName || "Digitized Character";
    const sourceImageUrl = `upload://${Date.now()}-${image.name || "drawing"}`;

    const character = await db.character.create({
      data: {
        userId: session.user.id,
        name: characterName,
        shapeData: JSON.stringify(parsed.shape),
        faceData: JSON.stringify(parsed.face),
        limbsData: JSON.stringify(parsed.limbs),
        sourceImageUrl,
        accessoriesData: JSON.stringify(parsed.accessories),
        digitizationMeta: JSON.stringify({
          confidence: parsed.confidence,
          warnings: parsed.warnings,
          modelVersion: parsed.meta.modelVersion,
          detectedParts: parsed.meta.detectedParts,
          sourceMimeType: image.type,
          sourceFileName: image.name,
          removeBackground,
          createdAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json(
      {
        id: character.id,
        confidence: parsed.confidence,
        warnings: parsed.warnings,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/characters/digitize failed", error);
    return NextResponse.json(
      {
        error: "Failed to digitize drawing",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
