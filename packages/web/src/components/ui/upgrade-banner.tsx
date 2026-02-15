"use client";

import { Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UpgradeBannerProps {
  feature: string;
  compact?: boolean;
}

export function UpgradeBanner({ feature, compact = false }: UpgradeBannerProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-amber-200/60 bg-gradient-to-r from-amber-50 to-accent-50 px-3 py-2 shadow-sm">
        <Lock className="h-4 w-4 flex-shrink-0 text-amber-600" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-stone-900">
            Upgrade to unlock {feature}
          </p>
        </div>
        <Link
          href="/pricing"
          className="flex-shrink-0 inline-flex items-center gap-1 rounded-md bg-accent-500 px-2 py-1 text-xs font-semibold text-stone-900 hover:bg-accent-600 transition-colors"
        >
          Upgrade
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-accent-50 p-6 shadow-card">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 pt-1">
          <Lock className="h-6 w-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-stone-900">
            Upgrade to unlock {feature}
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            Get unlimited access with KinPath Premium
          </p>
        </div>
        <Link
          href="/pricing"
          className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-accent-500 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-accent-600 transition-colors"
        >
          Upgrade
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
