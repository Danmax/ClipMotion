import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

interface SharedCharacterPageProps {
  params: Promise<{ id: string }>;
}

function getShapeFill(shapeData: string): string {
  try {
    const parsed = JSON.parse(shapeData) as { fill?: unknown };
    if (typeof parsed.fill === "string" && parsed.fill.length > 0) return parsed.fill;
  } catch {
    // ignore malformed data
  }
  return "#64748b";
}

export default async function SharedCharacterPage({ params }: SharedCharacterPageProps) {
  const { id } = await params;
  const session = await auth();

  const character = await db.character.findFirst({
    where: {
      id,
      ...(session?.user?.id
        ? { OR: [{ userId: session.user.id }, { isPublic: true }] }
        : { isPublic: true }),
    },
    include: {
      user: { select: { name: true } },
    },
  });

  if (!character) notFound();
  const fill = getShapeFill(character.shapeData);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-xs text-cyan-300 uppercase tracking-wider">Shared Character</p>
        <h1 className="mt-2 text-3xl font-semibold">{character.name}</h1>
        <p className="mt-3 text-sm text-gray-400">
          By {character.user.name ?? "ClipMotion user"}
        </p>

        <div className="mt-6 rounded-xl border border-gray-800 bg-gray-900/70 p-8 flex items-center justify-center">
          <div className="h-40 w-40 rounded-2xl" style={{ backgroundColor: fill }} />
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
