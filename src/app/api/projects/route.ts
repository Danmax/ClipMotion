import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
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
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (!existingUser) {
      return NextResponse.json(
        {
          error: "Session is no longer valid for this database state",
          hint: "Please sign out and sign back in, then retry.",
        },
        { status: 401 }
      );
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

    const project = await db.project.create({
      data: {
        userId: session.user.id,
        name,
        fps: fps ?? DEFAULT_FPS,
        width: width ?? DEFAULT_CANVAS_WIDTH,
        height: height ?? DEFAULT_CANVAS_HEIGHT,
        durationMs: FREE_TIER_MAX_DURATION_MS,
        scenes: {
          create: {
            name: "Scene 1",
            order: 0,
            data: JSON.stringify(createEmptyScene()),
          },
        },
      },
      include: {
        scenes: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
    });

    // Best-effort timeline initialization. If the DB schema is behind,
    // project creation still succeeds and the editor will build a fallback timeline.
    const firstSceneId = project.scenes[0]?.id;
    if (firstSceneId) {
      const timelineData = createSingleClipComposition(firstSceneId, project.durationMs);
      try {
        await db.project.update({
          where: { id: project.id },
          data: { timelineData: JSON.stringify(timelineData) },
        });
      } catch (error) {
        console.error("Failed to initialize timelineData; continuing without it", error);
      }
    }

    return NextResponse.json({ id: project.id }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects failed", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const isSchemaDrift = error.code === "P2021" || error.code === "P2022";
      const isForeignKey = error.code === "P2003";
      const hint = isSchemaDrift
        ? "Database schema is out of date. Run `npx prisma migrate deploy && npm run prisma:generate`."
        : isForeignKey
          ? "Your session may reference a missing user. Please sign out and sign back in."
          : undefined;

      return NextResponse.json(
        {
          error: "Failed to create project",
          code: error.code,
          hint,
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create project",
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
