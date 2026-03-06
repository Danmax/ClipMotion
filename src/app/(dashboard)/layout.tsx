import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white">
            ClipMotion
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/projects"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/characters"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Characters
            </Link>
            <Link
              href="/settings"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Settings
            </Link>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
              {session.user.name?.[0]?.toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
