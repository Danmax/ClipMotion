import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  fps: z
    .number()
    .int()
    .refine((v) => [12, 16, 24, 30, 60].includes(v))
    .optional(),
  timelineData: z.record(z.string(), z.unknown()).optional(),
  version: z.number().int().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { scenes: { orderBy: { order: "asc" } } },
  });

  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Verify ownership
  const existing = await db.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Optimistic locking
  if (parsed.data.version !== undefined && parsed.data.version !== existing.version) {
    return NextResponse.json(
      { error: "Version conflict. Please reload." },
      { status: 409 }
    );
  }

  const updated = await db.project.update({
    where: { id: projectId },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.fps && { fps: parsed.data.fps }),
      ...(parsed.data.timelineData && {
        timelineData: JSON.stringify(parsed.data.timelineData),
      }),
      version: { increment: 1 },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await db.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.project.delete({ where: { id: projectId } });

  return NextResponse.json({ success: true });
}
