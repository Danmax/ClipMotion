import Link from "next/link";
import { Play, Layers, Clock, Download, Sparkles, ArrowRight } from "lucide-react";
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
                <Link href="/sign-in" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-sm font-medium hover:bg-blue-500 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="py-14 sm:py-20">
          <div className="relative overflow-hidden rounded-3xl border border-[#263146] bg-gradient-to-b from-[#0f172a] via-[#0c162b] to-[#0a1120] p-6 sm:p-10">
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200 mb-5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Animation studio in your browser
                </div>
                <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight leading-[1.05] mb-5">
                  Build scroll-stopping
                  <span className="block text-cyan-300">animated stories fast</span>
                </h1>
                <p className="text-[15px] sm:text-lg text-slate-300/90 max-w-xl mb-8">
                  Create scenes, add characters, keyframe motion, and export in one flow.
                  No desktop app required.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  {isLoggedIn ? (
                    <>
                      <Link
                        href="/projects"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 text-sm sm:text-base font-semibold hover:bg-cyan-400 transition-colors"
                      >
                        Open Studio
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/characters/new"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 bg-slate-900/70 text-white text-sm sm:text-base font-medium hover:bg-slate-800 transition-colors"
                      >
                        New Character
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/sign-up"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-slate-950 text-sm sm:text-base font-semibold hover:bg-cyan-400 transition-colors"
                      >
                        Start Free
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/sign-in"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-700 bg-slate-900/70 text-white text-sm sm:text-base font-medium hover:bg-slate-800 transition-colors"
                      >
                        Sign In
                      </Link>
                    </>
                  )}
                </div>

                <p className="mt-4 text-xs text-slate-400">
                  Free tier: 30-second timeline and 720p exports.
                </p>
              </div>

              <div className="relative">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3 shadow-2xl shadow-black/30">
                  <div className="h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center px-3 gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                    <div className="text-[11px] text-slate-400 ml-2">ClipMotion Editor</div>
                  </div>
                  <div className="aspect-[16/10] rounded-xl border border-slate-700 bg-[#d9dee6] p-4 relative overflow-hidden">
                    <div className="absolute left-4 top-4 bottom-4 w-20 rounded-lg bg-[#101827] border border-[#1f2a3d]" />
                    <div className="absolute right-4 top-4 bottom-24 left-28 rounded-lg bg-[#cfd6df] border border-[#bdc6d2] flex items-center justify-center">
                      <div className="w-20 h-20 rounded-2xl bg-cyan-500/80" />
                    </div>
                    <div className="absolute right-4 bottom-4 left-28 h-16 rounded-lg bg-white/80 border border-[#d0d7e2] flex items-center px-3 gap-2">
                      <div className="w-5 h-5 rounded-full bg-slate-300" />
                      <div className="h-1.5 flex-1 rounded-full bg-slate-300/70" />
                      <div className="w-8 h-5 rounded bg-cyan-500/50" />
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex absolute -left-6 -bottom-6 rounded-xl border border-cyan-300/30 bg-cyan-500/10 backdrop-blur px-3 py-2 text-xs text-cyan-100 items-center gap-2">
                  <Play className="w-3.5 h-3.5" />
                  Live timeline preview
                </div>
              </div>
            </div>
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
              href="/sign-up"
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
