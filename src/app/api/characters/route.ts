import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const createCharacterSchema = z.object({
  name: z.string().min(1).max(100),
  shapeData: z.string().min(2), // JSON string
  faceData: z.string().min(2),  // JSON string
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

  const { name, shapeData, faceData } = parsed.data;

  const character = await db.character.create({
    data: {
      userId: session.user.id,
      name,
      shapeData,
      faceData,
    },
  });

  return NextResponse.json({ id: character.id }, { status: 201 });
}
