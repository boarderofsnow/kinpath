"use client";

import { useState } from "react";
import type { ChildWithAge, HouseholdMember } from "@kinpath/shared";
import { ChildTagSelector } from "./child-tag-selector";

interface AddItemFormProps {
  onSave: (
    title: string,
    description: string,
    dueDate: string | null,
    childIds?: string[],
    assigneeMemberId?: string | null
  ) => void;
  onCancel: () => void;
  childProfiles?: ChildWithAge[];
  defaultChildIds?: string[];
  householdMembers?: HouseholdMember[];
}

export function AddItemForm({
  onSave,
  onCancel,
  childProfiles,
  defaultChildIds,
  householdMembers,
}: AddItemFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>(
    defaultChildIds ?? []
  );
  const [assigneeMemberId, setAssigneeMemberId] = useState<string>("");

  const hasMembers = householdMembers && householdMembers.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(
      title.trim(),
      description.trim(),
      dueDate || null,
      selectedChildIds,
      assigneeMemberId || null
    );
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
        placeholder="What needs to be done?"
        autoFocus
        className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a note (optional)"
        className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
      />

      {childProfiles && childProfiles.length > 1 && (
        <div className="mt-3">
          <ChildTagSelector
            childProfiles={childProfiles}
            selectedIds={selectedChildIds}
            onChange={setSelectedChildIds}
          />
        </div>
      )}

      {hasMembers && (
        <div className="mt-3">
          <label className="text-xs font-medium text-stone-500">
            Assign to
          </label>
          <select
            value={assigneeMemberId}
            onChange={(e) => setAssigneeMemberId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          >
            <option value="">Anyone</option>
            {householdMembers!.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name ?? m.invited_email}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-600 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
        />
        <div className="flex-1" />
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
