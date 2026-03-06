import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const updateCharacterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isPublic: z.boolean().optional(),
  shapeData: z.string().min(2).optional(),
  faceData: z.string().min(2).optional(),
  limbsData: z.string().min(2).nullable().optional(),
  accessoriesData: z.string().min(2).nullable().optional(),
  sourceImageUrl: z.string().max(1000).nullable().optional(),
  digitizationMeta: z.string().min(2).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.character.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = updateCharacterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const character = await db.character.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(character);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  const character = await db.character.findFirst({
    where: {
      id,
      ...(session?.user?.id
        ? { OR: [{ userId: session.user.id }, { isPublic: true }] }
        : { isPublic: true }),
    },
  });

  if (!character) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(character);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await db.character.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.character.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
