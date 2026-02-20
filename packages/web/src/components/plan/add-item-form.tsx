"use client";

import { useState } from "react";

interface AddItemFormProps {
  onSave: (title: string, description: string, dueDate: string | null) => void;
  onCancel: () => void;
}

export function AddItemForm({ onSave, onCancel }: AddItemFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), description.trim(), dueDate || null);
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
      <div className="mt-2 flex items-center gap-3">
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
