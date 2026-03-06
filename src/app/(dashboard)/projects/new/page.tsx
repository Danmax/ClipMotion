"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_FPS, DEFAULT_PROJECT_DURATION_MS } from "@/lib/constants";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name || "Untitled Project", fps: DEFAULT_FPS }),
      });

      if (res.ok) {
        const { id } = await res.json();
        router.push(`/editor/${id}`);
        return;
      }

      const payload = (await res.json().catch(() => null)) as
        | { error?: string; code?: string; hint?: string; details?: string }
        | null;
      setError(
        payload?.hint ??
          payload?.details ??
          payload?.error ??
          `Could not create project (HTTP ${res.status}).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error while creating project.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Project</h1>

      <form onSubmit={handleCreate} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
            Project Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled Project"
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Frame Rate
          </label>
          <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
            {DEFAULT_FPS} fps
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Clip Length
          </label>
          <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
            {Math.round(DEFAULT_PROJECT_DURATION_MS / 1000)} seconds
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
          <p className="text-sm text-gray-400">
            <span className="text-white font-medium">Defaults:</span> {DEFAULT_FPS} fps and {Math.round(DEFAULT_PROJECT_DURATION_MS / 1000)} second clips.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            <span className="text-white font-medium">Free tier:</span> Up to 30 seconds, 720p max export with watermark.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Creating..." : "Create Project"}
        </button>
      </form>
    </div>
  );
}
