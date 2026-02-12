"use client";

import { useState } from "react";
import type { VettingInfo } from "@kinpath/shared";

interface VettedBadgeProps {
  vettingInfo: VettingInfo;
  size?: "sm" | "md";
}

/**
 * A trust badge indicating a resource has been professionally vetted.
 * Shows reviewer credentials on hover/tap.
 */
export function VettedBadge({ vettingInfo, size = "sm" }: VettedBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  const reviewDate = new Date(vettingInfo.vetted_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
        onClick={() => setShowDetails((s) => !s)}
        className={`inline-flex items-center gap-1 rounded-full bg-sage-100 text-sage-700 font-medium transition-colors hover:bg-sage-200 ${
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
        }`}
        aria-label="Professionally vetted resource"
      >
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className={size === "sm" ? "h-3 w-3" : "h-4 w-4"}
        >
          <path
            fillRule="evenodd"
            d="M8 1a.75.75 0 0 1 .672.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327 1.418A.75.75 0 0 1 8 1Z"
          />
        </svg>
        Vetted
      </button>

      {/* Tooltip with reviewer details */}
      {showDetails && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
          <div className="font-medium">Professionally Vetted</div>
          <div className="mt-1 text-gray-300">
            Reviewed by {vettingInfo.reviewer_name}, {vettingInfo.reviewer_credentials}
          </div>
          <div className="text-gray-400">{reviewDate}</div>
          {/* Tooltip arrow */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

/**
 * Placeholder badge shown on unvetted resources.
 * Subtle, non-judgmental — just indicates no professional review yet.
 */
export function UnvettedIndicator() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
      Community resource
    </span>
  );
}
