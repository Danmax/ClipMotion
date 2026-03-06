import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface SharedProjectPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function SharedProjectPage({ params }: SharedProjectPageProps) {
  const { projectId } = await params;
  const session = await auth();

  const project = await db.project.findFirst({
    where: {
      id: projectId,
      ...(session?.user?.id
        ? { OR: [{ userId: session.user.id }, { isPublic: true }] }
        : { isPublic: true }),
    },
    include: {
      user: { select: { name: true } },
      scenes: { orderBy: { order: "asc" } },
    },
  });

  if (!project) notFound();

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-xs text-cyan-300 uppercase tracking-wider">Shared Project</p>
        <h1 className="mt-2 text-3xl font-semibold">{project.name}</h1>
        <p className="mt-3 text-sm text-gray-400">
          By {project.user.name ?? "ClipMotion user"} · {project.fps} fps · {project.durationMs / 1000}s
        </p>
        <p className="text-sm text-gray-400">
          {project.width}x{project.height} · {project.scenes.length} scene{project.scenes.length === 1 ? "" : "s"}
        </p>

        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/70 p-4">
          <h2 className="text-sm font-medium text-gray-200">Scenes</h2>
          <ul className="mt-3 space-y-2">
            {project.scenes.map((scene) => (
              <li key={scene.id} className="rounded-md border border-gray-800 bg-gray-950/70 px-3 py-2 text-sm text-gray-300">
                {scene.order + 1}. {scene.name}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
            Back to ClipMotion
          </Link>
        </div>
      </div>
    </main>
  );
}
