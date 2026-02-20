"use client";

import type { ChildWithAge } from "@kinpath/shared";

interface ChildTagSelectorProps {
  childProfiles: ChildWithAge[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function ChildTagSelector({
  childProfiles,
  selectedIds,
  onChange,
}: ChildTagSelectorProps) {
  const allSelected = selectedIds.length === childProfiles.length;

  const toggleAll = () => {
    if (allSelected) {
      onChange([childProfiles[0].id]);
    } else {
      onChange(childProfiles.map((c) => c.id));
    }
  };

  const toggleChild = (childId: string) => {
    if (selectedIds.includes(childId)) {
      // Don't allow deselecting the last one
      if (selectedIds.length <= 1) return;
      onChange(selectedIds.filter((id) => id !== childId));
    } else {
      onChange([...selectedIds, childId]);
    }
  };

  if (childProfiles.length <= 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-stone-500">For:</span>
      <button
        type="button"
        onClick={toggleAll}
        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
          allSelected
            ? "bg-brand-500 text-white"
            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
        }`}
      >
        All
      </button>
      {childProfiles.map((child) => (
        <button
          key={child.id}
          type="button"
          onClick={() => toggleChild(child.id)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            selectedIds.includes(child.id)
              ? "bg-brand-100 text-brand-700"
              : "bg-stone-100 text-stone-500 hover:bg-stone-200"
          }`}
        >
          {child.name}
        </button>
      ))}
    </div>
  );
}
