import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { EditorShell } from "@/components/editor/editor-shell";

interface EditorPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const project = await db.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    include: { scenes: { orderBy: { order: "asc" } } },
  });

  if (!project) notFound();

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
      }}
      scenes={project.scenes.map((s) => ({
        id: s.id,
        name: s.name,
        order: s.order,
        data: typeof s.data === "string" ? JSON.parse(s.data) : s.data,
      }))}
    />
  );
}
