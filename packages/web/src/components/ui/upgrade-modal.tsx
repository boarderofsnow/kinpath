"use client";

import { X, Sparkles, MessageCircle, BookOpen, Users } from "lucide-react";
import Link from "next/link";

interface UpgradeModalProps {
  onClose: () => void;
  questionsUsed?: number;
  questionsLimit?: number;
}

export function UpgradeModal({
  onClose,
  questionsUsed = 5,
  questionsLimit = 5,
}: UpgradeModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative mx-4 w-full max-w-md rounded-2xl border border-stone-200/60 bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-accent-100">
          <Sparkles className="h-7 w-7 text-accent-600" />
        </div>

        {/* Heading */}
        <h2 className="text-center text-xl font-bold text-stone-900">
          You&apos;ve used all {questionsLimit} free questions
        </h2>
        <p className="mt-2 text-center text-sm text-stone-500">
          Upgrade to Premium for unlimited AI-powered parenting guidance.
        </p>

        {/* Features */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-stone-50 px-3 py-2.5">
            <MessageCircle className="h-4 w-4 flex-shrink-0 text-brand-500" />
            <span className="text-sm text-stone-700">Unlimited AI questions</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-stone-50 px-3 py-2.5">
            <BookOpen className="h-4 w-4 flex-shrink-0 text-brand-500" />
            <span className="text-sm text-stone-700">Full resource library with child filtering</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-stone-50 px-3 py-2.5">
            <Users className="h-4 w-4 flex-shrink-0 text-brand-500" />
            <span className="text-sm text-stone-700">Partner sharing included</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-6 space-y-3">
          <Link
            href="/pricing"
            className="block w-full rounded-xl bg-accent-500 py-3 text-center text-sm font-semibold text-stone-900 shadow-sm hover:bg-accent-600 transition-colors"
          >
            Upgrade to Premium
          </Link>
          <button
            onClick={onClose}
            className="block w-full rounded-xl py-2.5 text-center text-sm font-medium text-stone-500 hover:bg-stone-50 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
