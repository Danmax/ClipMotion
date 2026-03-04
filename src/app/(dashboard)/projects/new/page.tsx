"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FPS_OPTIONS, DEFAULT_FPS } from "@/lib/constants";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [fps, setFps] = useState<number>(DEFAULT_FPS);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "Untitled Project", fps }),
    });

    if (res.ok) {
      const { id } = await res.json();
      router.push(`/editor/${id}`);
    } else {
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
          <div className="flex gap-2">
            {FPS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFps(option)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  fps === option
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
              >
                {option} fps
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
          <p className="text-sm text-gray-400">
            <span className="text-white font-medium">Free tier:</span> Up to 30 seconds, 720p max export with watermark.
          </p>
        </div>

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
