import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      _count: {
        select: {
          projects: true,
          characters: true,
          assets: true,
        },
      },
    },
  });
  if (!user) redirect("/sign-in");

  async function updateProfile(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) redirect("/sign-in");

    const nextNameRaw = formData.get("name");
    const nextName = typeof nextNameRaw === "string" ? nextNameRaw.trim() : "";
    if (!nextName) return;

    await db.user.update({
      where: { id: session.user.id },
      data: { name: nextName.slice(0, 100) },
    });

    revalidatePath("/settings");
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">
          Manage your profile and workspace account details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
          <h2 className="text-lg font-semibold text-white">Profile</h2>
          <p className="text-xs text-gray-500 mt-1">Update your display name used across projects.</p>

          <form action={updateProfile} className="mt-5 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm text-gray-300 mb-1.5">
                Display Name
              </label>
              <input
                id="name"
                name="name"
                defaultValue={user.name ?? ""}
                maxLength={100}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Email</label>
              <input
                value={user.email}
                readOnly
                className="w-full rounded-lg bg-gray-900 border border-gray-800 px-3 py-2 text-gray-400"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors"
            >
              Save Profile
            </button>
          </form>
        </section>

        <div className="space-y-6">
          <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-5">
            <h2 className="text-lg font-semibold text-white">Workspace</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard label="Tier" value={user.tier} />
              <StatCard label="Projects" value={String(user._count.projects)} />
              <StatCard label="Characters" value={String(user._count.characters)} />
              <StatCard label="Assets" value={String(user._count.assets)} />
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </section>

          <section className="rounded-xl border border-red-900/50 bg-red-950/20 p-5">
            <h2 className="text-lg font-semibold text-red-300">Session</h2>
            <p className="text-sm text-red-200/80 mt-1">
              Use the top-right profile menu to sign out of Clerk.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className="text-base font-semibold text-white mt-1">{value}</p>
    </div>
  );
}
