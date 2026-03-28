"use client";

import { useCallback, useRef } from "react";
import { Users } from "lucide-react";
import type { ChildWithAge } from "@kinpath/shared";

interface ChildPillSelectorProps {
  childProfiles: ChildWithAge[];
  selectedChildId: string | "all";
  onSelect: (id: string | "all") => void;
  showAll?: boolean;
}

/** Shorten "4 months old" → "4 mo", "2 years old" → "2 yr", etc. */
function abbreviateAge(label: string): string {
  if (label === "Newborn") return "newborn";

  const weekMatch = label.match(/^(\d+)\s*weeks?\s*(?:old|pregnant)$/);
  if (weekMatch) return `${weekMatch[1]} wk`;

  const monthMatch = label.match(/^(\d+)\s*months?\s*old$/);
  if (monthMatch) return `${monthMatch[1]} mo`;

  const yearMonthMatch = label.match(/^(\d+)\s*years?,\s*(\d+)\s*months?\s*old$/);
  if (yearMonthMatch) return `${yearMonthMatch[1]} yr`;

  const yearMatch = label.match(/^(\d+)\s*years?\s*old$/);
  if (yearMatch) return `${yearMatch[1]} yr`;

  return label;
}

export function ChildPillSelector({
  childProfiles,
  selectedChildId,
  onSelect,
  showAll = true,
}: ChildPillSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items: (string | "all")[] = [];
      if (showAll) items.push("all");
      childProfiles.forEach((c) => items.push(c.id));

      const currentIndex = items.indexOf(selectedChildId);
      let nextIndex = currentIndex;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % items.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + items.length) % items.length;
      } else {
        return;
      }

      onSelect(items[nextIndex]);

      // Move focus to the newly selected pill
      const container = containerRef.current;
      if (container) {
        const buttons = container.querySelectorAll<HTMLButtonElement>('[role="radio"]');
        buttons[nextIndex]?.focus();
      }
    },
    [childProfiles, selectedChildId, onSelect, showAll],
  );

  if (childProfiles.length === 0) return null;

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label="Select child"
      onKeyDown={handleKeyDown}
      className="scrollbar-hide flex items-center gap-2 overflow-x-auto px-1 py-1"
    >
      {showAll && (
        <PillButton
          selected={selectedChildId === "all"}
          onClick={() => onSelect("all")}
          tabIndex={selectedChildId === "all" ? 0 : -1}
        >
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          <span>All</span>
        </PillButton>
      )}

      {childProfiles.map((child) => {
        const isSelected = selectedChildId === child.id;
        return (
          <PillButton
            key={child.id}
            selected={isSelected}
            onClick={() => onSelect(child.id)}
            tabIndex={isSelected ? 0 : -1}
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                isSelected
                  ? "bg-brand-500 text-white"
                  : "bg-brand-100 text-brand-600"
              }`}
            >
              {child.name.charAt(0).toUpperCase()}
            </span>
            <span className="whitespace-nowrap font-medium">{child.name}</span>
            <span className="whitespace-nowrap text-stone-400">
              {abbreviateAge(child.age_label)}
            </span>
          </PillButton>
        );
      })}
    </div>
  );
}

function PillButton({
  selected,
  onClick,
  tabIndex,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  tabIndex: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={tabIndex}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${
        selected
          ? "border-2 border-brand-500 bg-brand-50 text-brand-700 shadow-soft"
          : "border border-stone-200 bg-white text-stone-600 hover:border-brand-300 hover:bg-brand-50/50"
      }`}
    >
      {children}
    </button>
  );
}
