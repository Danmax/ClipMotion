"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Upload, Loader2, X } from "lucide-react";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";

function deriveDefaultName(fileName: string): string {
  const cleaned = fileName
    .replace(/\.[^/.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > 0 ? cleaned.slice(0, 100) : "Digitized Character";
}

export function DigitizeUploadButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState("Digitized Character");
  const [removeBackground, setRemoveBackground] = useState(true);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const openPicker = () => {
    if (uploading) return;
    inputRef.current?.click();
  };

  const resetModal = () => {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setCharacterName("Digitized Character");
    setRemoveBackground(true);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const pickedFile = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!pickedFile) return;
    setError(null);
    setFile(pickedFile);
    setCharacterName(deriveDefaultName(pickedFile.name));
  };

  const handleSubmit = async () => {
    if (!file || uploading) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      if (characterName.trim().length > 0) {
        formData.append("name", characterName.trim());
      }
      formData.append("removeBackground", removeBackground ? "true" : "false");

      const res = await fetch("/api/characters/digitize", {
        method: "POST",
        body: formData,
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok || !payload?.id) {
        setError(payload?.error ?? "Digitization failed");
        return;
      }

      resetModal();
      router.push(`/characters/${payload.id}/edit`);
      router.refresh();
    } catch {
      setError("Network error while digitizing image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        onClick={openPicker}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 bg-gray-900 text-gray-200 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ImagePlus className="w-4 h-4" />
        Upload Drawing
      </button>

      {file && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-gray-800 bg-[#0d111a] overflow-hidden shadow-2xl">
            <div className="h-12 border-b border-gray-800 px-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Digitize Drawing</h3>
              <button
                onClick={resetModal}
                disabled={uploading}
                className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid md:grid-cols-[1fr_320px] gap-0">
              <div className="p-4 border-b md:border-b-0 md:border-r border-gray-800">
                <div className="rounded-xl border border-gray-800 bg-gray-900/60 min-h-[280px] flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="Drawing preview" className="max-h-[420px] w-auto object-contain" />
                  ) : (
                    <p className="text-sm text-gray-500">No preview available</p>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Character Name</label>
                  <input
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    maxLength={100}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={removeBackground}
                    onChange={(e) => setRemoveBackground(e.target.checked)}
                    className="rounded accent-cyan-500"
                  />
                  <span className="text-sm text-gray-300">Try background removal</span>
                </label>

                <div className="text-xs text-gray-500 leading-relaxed">
                  Body shape, limbs, accessories, and expression are auto-detected into a draft you can edit.
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-600/15 px-3 py-2 text-xs text-red-300">
                    {error}
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={uploading || !file}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? "Digitizing..." : "Create Draft"}
                  </button>
                  <button
                    onClick={openPicker}
                    disabled={uploading}
                    className="px-3 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
