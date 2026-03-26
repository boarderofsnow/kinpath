"use client";

import { useState, useEffect } from "react";
import { Heart, X } from "lucide-react";
import type { ChildWithAge } from "@kinpath/shared";

interface BirthCelebrationProps {
  child: ChildWithAge;
}

const STORAGE_KEY_PREFIX = "kinpath_birth_celebrated_";

export function BirthCelebration({ child }: BirthCelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!child.is_born) return;
    const key = `${STORAGE_KEY_PREFIX}${child.id}`;
    const celebrated = localStorage.getItem(key);
    if (!celebrated) {
      setVisible(true);
    }
  }, [child.id, child.is_born]);

  function dismiss() {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${child.id}`, "dashboard");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-amber-50 border border-amber-100/60 shadow-sm">
      <div className="relative flex items-start gap-4 px-5 py-4">
        {/* Icon */}
        <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 mt-0.5">
          <Heart className="h-5 w-5 text-[#C4956A]" fill="currentColor" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-bold text-stone-900 leading-snug">
            Welcome, {child.name}!
          </h3>
          <p className="mt-0.5 text-sm text-stone-600 leading-relaxed">
            What a beautiful new chapter. Your Kinpath experience has been
            updated with everything you need for this next stage.
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="flex-shrink-0 rounded-lg p-1.5 text-stone-400 hover:bg-white/60 hover:text-stone-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
