"use client";

import { useState } from "react";
import { X, Sparkles, Heart } from "lucide-react";
import { api } from "@/lib/api";
import { enrichChildWithAge, type ChildWithAge } from "@kinpath/shared";

interface BabyArrivedModalProps {
  child: ChildWithAge;
  onClose: () => void;
  onSuccess: (updatedChild: ChildWithAge) => void;
}

export function BabyArrivedModal({
  child,
  onClose,
  onSuccess,
}: BabyArrivedModalProps) {
  const [dob, setDob] = useState("");
  const [name, setName] = useState(child.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrated, setCelebrated] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  async function handleConfirm() {
    if (!dob) {
      setError("Please enter the date of birth");
      return;
    }

    setLoading(true);
    setError(null);

    const body: { dob: string; name?: string } = { dob };
    if (name.trim() && name.trim() !== child.name) {
      body.name = name.trim();
    }

    const { data, error: apiError } = await api.children.markBorn(
      child.id,
      body
    );

    setLoading(false);

    if (apiError) {
      setError(apiError);
      return;
    }

    // Transition to celebration state
    const updatedChild = enrichChildWithAge({
      ...child,
      is_born: true,
      dob,
      ...(body.name ? { name: body.name } : {}),
    });

    // Set localStorage flag for dashboard celebration
    localStorage.setItem(`kinpath_birth_celebrated_${child.id}`, "settings");

    setCelebrated(true);

    // After a moment, close and notify parent
    setTimeout(() => {
      onSuccess(updatedChild);
    }, 3000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>

        {celebrated ? (
          /* ── Celebration state ────────────────────────────────── */
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-stone-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100">
              <Heart className="h-8 w-8 text-[#C4956A]" fill="currentColor" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">
              Welcome, {name || child.name}!
            </h2>
            <p className="text-stone-600 leading-relaxed">
              What a beautiful new chapter. We&apos;re here for every moment.
            </p>
            <div className="mt-6 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-sm text-stone-500">
                <Sparkles className="h-3.5 w-3.5 text-[#C4956A]" />
                Updating your experience...
              </span>
            </div>
          </div>
        ) : (
          /* ── Form state ──────────────────────────────────────── */
          <>
            {/* Header with warm gradient */}
            <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-stone-50 px-6 pt-6 pb-5">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-[#C4956A]" />
                <span className="text-sm font-medium text-[#C4956A]">
                  A milestone moment
                </span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-stone-900">
                Welcome to the world!
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Let&apos;s record this special moment for {child.name}.
              </p>
            </div>

            {/* Form body */}
            <div className="px-6 py-5 space-y-4">
              {/* Name update (optional) */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Baby&apos;s name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={child.name}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#C4956A] focus:ring-1 focus:ring-[#C4956A] transition-colors"
                />
                <p className="mt-1 text-xs text-stone-400">
                  Update if you&apos;ve chosen a different name
                </p>
              </div>

              {/* Birth date */}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Date of birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  max={today}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#C4956A] focus:ring-1 focus:ring-[#C4956A] transition-colors"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={loading || !dob}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#8B6F47] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#7a6240] transition-colors disabled:opacity-50"
              >
                {loading ? (
                  "Recording..."
                ) : (
                  <>
                    <Heart className="h-4 w-4" />
                    Record this moment
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
