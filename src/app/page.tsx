import Link from "next/link";
import { Play, Layers, Clock, Download } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";

function getCharacterFill(shapeData: string): string {
  try {
    const parsed = JSON.parse(shapeData) as { fill?: unknown };
    if (typeof parsed.fill === "string" && parsed.fill.length > 0) {
      return parsed.fill;
    }
  } catch {
    // ignore malformed legacy data
  }
  return "#64748b";
}

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user?.id;

  let characters: {
    id: string;
    name: string;
    shapeData: string;
    updatedAt: Date;
  }[] = [];

  if (isLoggedIn) {
    try {
      characters = await db.character.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        take: 6,
      });
    } catch (error) {
      console.error("Home characters query failed:", error);
      characters = [];
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-xl font-bold">ClipMotion</span>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Link href="/projects" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
                <Link
                  href="/characters"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-sm font-medium hover:bg-blue-500 transition-colors"
                >
                  Characters
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-sm font-medium hover:bg-blue-500 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6">
        <section className="py-24 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-6">
            Animate your stories.
            <br />
            <span className="text-blue-400">In 30 seconds.</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10">
            ClipMotion is a web-based animation studio for creating short animated clips.
            Set keyframes, rig characters, and export professional-quality animations — all from your browser.
          </p>
          <div className="flex gap-4 justify-center">
            {isLoggedIn ? (
              <>
                <Link
                  href="/projects"
                  className="px-6 py-3 rounded-xl bg-blue-600 text-base font-medium hover:bg-blue-500 transition-colors"
                >
                  Open Dashboard
                </Link>
                <Link
                  href="/characters/new"
                  className="px-6 py-3 rounded-xl bg-gray-800 text-base font-medium hover:bg-gray-700 transition-colors"
                >
                  Create Character
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-6 py-3 rounded-xl bg-blue-600 text-base font-medium hover:bg-blue-500 transition-colors"
                >
                  Start Animating - Free
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-xl bg-gray-800 text-base font-medium hover:bg-gray-700 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </section>

        {isLoggedIn && (
          <section className="pb-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Current Characters</h2>
              <Link href="/characters" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                View all
              </Link>
            </div>

            {characters.length === 0 ? (
              <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-8 text-center">
                <p className="text-sm text-gray-400">You have no characters yet.</p>
                <Link
                  href="/characters/new"
                  className="inline-flex mt-4 px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium hover:bg-blue-500 transition-colors"
                >
                  Create your first character
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {characters.map((character) => {
                  const fill = getCharacterFill(character.shapeData);
                  return (
                    <Link
                      key={character.id}
                      href={`/characters/${character.id}/edit`}
                      className="group rounded-xl border border-gray-800 bg-gray-900/60 hover:border-gray-700 transition-colors overflow-hidden"
                    >
                      <div className="h-20 flex items-center justify-center" style={{ backgroundColor: `${fill}22` }}>
                        <div className="w-10 h-10 rounded-md" style={{ backgroundColor: fill }} />
                      </div>
                      <div className="px-2.5 py-2">
                        <p className="text-xs font-medium text-white truncate">{character.name}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Editor Preview */}
        <section className="pb-20">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden aspect-video flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-gray-500">Editor preview</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 border-t border-gray-800/50">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to animate
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon={<Layers className="w-6 h-6" />}
              title="Scene Graph"
              description="Hierarchical layer system with parent-child relationships and transform inheritance."
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="Timeline Editor"
              description="Frame-by-frame keyframe animation with easing curves and onion skinning."
            />
            <FeatureCard
              icon={<Play className="w-6 h-6" />}
              title="Real-time Preview"
              description="WebGL-accelerated playback at 12, 16, 24, 30, or 60 fps."
            />
            <FeatureCard
              icon={<Download className="w-6 h-6" />}
              title="Export"
              description="Export to MP4, WebM, or GIF at up to 1080p resolution."
            />
          </div>
        </section>

        {/* CTA */}
        {!isLoggedIn && (
          <section className="py-20 text-center border-t border-gray-800/50">
            <h2 className="text-3xl font-bold mb-4">Ready to create?</h2>
            <p className="text-gray-400 mb-8">
              Free accounts include 30-second clips and 720p export.
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-3 rounded-xl bg-blue-600 text-base font-medium hover:bg-blue-500 transition-colors"
            >
              Create Your Free Account
            </Link>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-600">
          ClipMotion
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-gray-800 bg-gray-900/50">
      <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
