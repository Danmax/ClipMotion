import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const sceneSnapshotSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  order: z.number().int().min(0),
  durationMs: z.number().int().min(500),
  data: z.record(z.string(), z.unknown()),
});

const updateScenesSchema = z.object({
  activeSceneId: z.string().optional(),
  scenes: z.array(sceneSnapshotSchema).min(1),
});

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
  const parsed = updateScenesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Verify project ownership
  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.user.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const incomingScenes = [...parsed.data.scenes].sort((a, b) => a.order - b.order);
  const incomingIds = incomingScenes.map((s) => s.id);

  // Guard against accidental cross-project writes.
  const existingByIds = incomingIds.length
    ? await db.scene.findMany({
        where: { id: { in: incomingIds } },
        select: { id: true, projectId: true },
      })
    : [];
  const foreignScene = existingByIds.find((scene) => scene.projectId !== projectId);
  if (foreignScene) {
    return NextResponse.json(
      { error: "Scene id belongs to another project", sceneId: foreignScene.id },
      { status: 409 }
    );
  }

  await db.$transaction(async (tx) => {
    // Remove deleted scenes.
    await tx.scene.deleteMany({
      where: {
        projectId,
        id: { notIn: incomingIds },
      },
    });

    // Upsert incoming scenes.
    for (const scene of incomingScenes) {
      await tx.scene.upsert({
        where: { id: scene.id },
        create: {
          id: scene.id,
          projectId,
          name: scene.name,
          order: scene.order,
          durationMs: scene.durationMs,
          data: JSON.stringify(scene.data),
        },
        update: {
          name: scene.name,
          order: scene.order,
          durationMs: scene.durationMs,
          data: JSON.stringify(scene.data),
          updatedAt: new Date(),
        },
      });
    }

    // Touch project updatedAt.
    await tx.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });
  });

  return NextResponse.json({ success: true, count: incomingScenes.length });
}
