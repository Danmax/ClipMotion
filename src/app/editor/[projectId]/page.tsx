import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { EditorShell } from "@/components/editor/editor-shell";

interface EditorPageProps {
  params: Promise<{ projectId: string }>;
}

function parseSceneData(raw: unknown): Record<string, unknown> {
  let candidate: unknown = raw;

  for (let i = 0; i < 3; i += 1) {
    if (typeof candidate !== "string") break;
    try {
      candidate = JSON.parse(candidate);
    } catch {
      break;
    }
  }

  if (candidate && typeof candidate === "object") {
    const record = candidate as Record<string, unknown>;
    if (record.document && typeof record.document === "object") {
      return record.document as Record<string, unknown>;
    }
    if (record.scene && typeof record.scene === "object") {
      return record.scene as Record<string, unknown>;
    }
    if (record.data && typeof record.data === "object") {
      return record.data as Record<string, unknown>;
    }
    return record;
  }

  return {};
}

export default async function EditorPage({ params }: EditorPageProps) {
  const debugEditor = process.env.DEBUG_EDITOR === "1";
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { scenes: { orderBy: { order: "asc" } } },
  });

  if (!project) notFound();

  let timelineData: Record<string, unknown> | null = null;
  if (typeof project.timelineData === "string") {
    try {
      timelineData = JSON.parse(project.timelineData) as Record<string, unknown>;
    } catch {
      timelineData = null;
    }
  }

  if (debugEditor) {
    console.log("[editor/page] load", {
      projectId: project.id,
      sceneCount: project.scenes.length,
      hasTimelineData: !!timelineData,
      version: project.version,
    });
  }

  return (
    <EditorShell
      project={{
        id: project.id,
        name: project.name,
        fps: project.fps,
        durationMs: project.durationMs,
        width: project.width,
        height: project.height,
        version: project.version,
        timelineData,
      }}
      scenes={project.scenes.map((s) => ({
        id: s.id,
        name: s.name,
        order: s.order,
        data: parseSceneData(s.data),
      }))}
    />
  );
}
