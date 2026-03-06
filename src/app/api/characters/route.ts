import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const createCharacterSchema = z.object({
  name: z.string().min(1).max(100),
  isPublic: z.boolean().optional(),
  shapeData: z.string().min(2), // JSON string
  faceData: z.string().min(2),  // JSON string
  limbsData: z.string().min(2).optional(), // JSON string
  accessoriesData: z.string().min(2).nullable().optional(), // JSON string
  sourceImageUrl: z.string().max(1000).nullable().optional(),
  digitizationMeta: z.string().min(2).nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const characters = await db.character.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(characters);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createCharacterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, isPublic, shapeData, faceData, limbsData, accessoriesData, sourceImageUrl, digitizationMeta } = parsed.data;

  const character = await db.character.create({
    data: {
      userId: session.user.id,
      name,
      isPublic: isPublic ?? false,
      shapeData,
      faceData,
      limbsData: limbsData ?? null,
      accessoriesData: accessoriesData ?? null,
      sourceImageUrl: sourceImageUrl ?? null,
      digitizationMeta: digitizationMeta ?? null,
    },
  });

  return NextResponse.json({ id: character.id }, { status: 201 });
}
