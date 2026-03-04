import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { DEFAULT_FPS, DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, FREE_TIER_MAX_DURATION_MS } from "@/lib/constants";
import { createEmptyScene } from "@/engine/serialization";
import { createSingleClipComposition } from "@/engine/composition";

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  fps: z.number().int().refine((v) => [12, 16, 24, 30, 60].includes(v)),
  width: z.number().int().min(320).max(3840).optional(),
  height: z.number().int().min(240).max(2160).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await db.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, fps, width, height } = parsed.data;

  const project = await db.$transaction(async (tx) => {
    const createdProject = await tx.project.create({
      data: {
        userId: session.user.id,
        name,
        fps: fps ?? DEFAULT_FPS,
        width: width ?? DEFAULT_CANVAS_WIDTH,
        height: height ?? DEFAULT_CANVAS_HEIGHT,
        durationMs: FREE_TIER_MAX_DURATION_MS,
      },
    });

    const scene = await tx.scene.create({
      data: {
        projectId: createdProject.id,
        name: "Scene 1",
        order: 0,
        data: JSON.stringify(createEmptyScene()),
      },
    });

    const timelineData = createSingleClipComposition(
      scene.id,
      createdProject.durationMs
    );

    return tx.project.update({
      where: { id: createdProject.id },
      data: { timelineData: JSON.stringify(timelineData) },
    });
  });

  return NextResponse.json({ id: project.id }, { status: 201 });
}
