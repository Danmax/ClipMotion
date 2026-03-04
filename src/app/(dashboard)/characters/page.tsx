import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Plus } from "lucide-react";
import { CharacterCard } from "@/components/character-builder/character-card";

export default async function CharactersPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const characters = await db.character.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Your Characters</h1>
          <p className="text-sm text-gray-400 mt-1">
            Create characters to use in your animations
          </p>
        </div>
        <Link
          href="/characters/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Character
        </Link>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-3xl">🎭</span>
          </div>
          <h2 className="text-lg font-medium mb-2">No characters yet</h2>
          <p className="text-gray-400 mb-6">
            Create your first character to use in animations!
          </p>
          <Link
            href="/characters/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Character
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      )}
    </div>
  );
}
