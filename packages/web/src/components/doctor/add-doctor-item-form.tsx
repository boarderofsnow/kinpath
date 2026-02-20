"use client";

import { useState } from "react";
import type { ChildWithAge } from "@kinpath/shared";
import { ChildTagSelector } from "@/components/plan/child-tag-selector";

interface AddDoctorItemFormProps {
  onSave: (
    title: string,
    notes: string | null,
    priority: "low" | "normal" | "high",
    childIds: string[]
  ) => void;
  onCancel: () => void;
  childProfiles: ChildWithAge[];
  defaultChildIds: string[];
}

export function AddDoctorItemForm({
  onSave,
  onCancel,
  childProfiles,
  defaultChildIds,
}: AddDoctorItemFormProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>(defaultChildIds);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), notes.trim() || null, priority, selectedChildIds);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-card"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What do you want to discuss?"
        autoFocus
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes or context (optional)"
        rows={2}
        className="mt-2 w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-500">Priority:</span>
          {(["low", "normal", "high"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                priority === p
                  ? p === "high"
                    ? "bg-red-100 text-red-700"
                    : p === "normal"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-stone-100 text-stone-600"
                  : "bg-stone-50 text-stone-400 hover:bg-stone-100"
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {childProfiles.length > 1 && (
          <ChildTagSelector
            childProfiles={childProfiles}
            selectedIds={selectedChildIds}
            onChange={setSelectedChildIds}
          />
        )}
      </div>

      <div className="mt-3 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-sm font-medium text-stone-500 hover:bg-stone-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </form>
  );
}
