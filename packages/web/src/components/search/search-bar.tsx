"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";

interface SearchBarProps {
  /** Where to navigate on search (default: /resources) */
  action?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Compact mode for embedding in headers */
  compact?: boolean;
}

/**
 * Search input that navigates to the browse page with a query param.
 * Works as both a standalone search bar and a compact header version.
 */
export function SearchBar({
  action = "/resources",
  placeholder = "Search resources...",
  compact = false,
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      router.push(`${action}?${params.toString()}`);
    },
    [query, action, router]
  );

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        {/* Search icon */}
        <svg
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${
            compact ? "h-4 w-4" : "h-5 w-5"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-gray-200 bg-white pl-10 text-gray-900 placeholder-gray-400 shadow-sm transition-colors focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 ${
            compact ? "py-1.5 pr-3 text-sm" : "py-2.5 pr-4 text-sm"
          }`}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              router.push(action);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
