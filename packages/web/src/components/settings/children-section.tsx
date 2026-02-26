"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { enrichChildWithAge, type ChildWithAge } from "@kinpath/shared";
import { Edit2, Plus, X } from "lucide-react";

interface ChildrenSectionProps {
  userId: string;
  initialChildren: ChildWithAge[];
}

export function ChildrenSection({ userId, initialChildren }: ChildrenSectionProps) {
  const supabase = createClient();

  const [children, setChildren] = useState(initialChildren);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editChildName, setEditChildName] = useState("");
  const [editChildDate, setEditChildDate] = useState("");
  const [childrenLoading, setChildrenLoading] = useState(false);

  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildIsBorn, setNewChildIsBorn] = useState<boolean | null>(null);
  const [newChildDate, setNewChildDate] = useState("");
  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);

  const startEditChild = useCallback((child: ChildWithAge) => {
    setEditingChildId(child.id);
    setEditChildName(child.name);
    setEditChildDate(child.is_born ? child.dob! : child.due_date!);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingChildId(null);
    setEditChildName("");
    setEditChildDate("");
  }, []);

  const handleSaveChild = useCallback(async () => {
    if (!editingChildId) return;

    setChildrenLoading(true);
    try {
      await supabase
        .from("children")
        .update({
          name: editChildName,
          [children.find((c) => c.id === editingChildId)?.is_born
            ? "dob"
            : "due_date"]: editChildDate,
        })
        .eq("id", editingChildId);

      const updatedChildren = children.map((c) =>
        c.id === editingChildId
          ? enrichChildWithAge({
              ...c,
              name: editChildName,
              dob: c.is_born ? editChildDate : c.dob,
              due_date: !c.is_born ? editChildDate : c.due_date,
            })
          : c
      );
      setChildren(updatedChildren);
      setEditingChildId(null);
    } catch (error) {
      console.error("Failed to save child:", error);
    } finally {
      setChildrenLoading(false);
    }
  }, [supabase, editingChildId, editChildName, editChildDate, children]);

  const handleShowAddChild = useCallback(() => {
    setShowAddChild(true);
    setNewChildName("");
    setNewChildIsBorn(null);
    setNewChildDate("");
  }, []);

  const handleCancelAddChild = useCallback(() => {
    setShowAddChild(false);
    setNewChildName("");
    setNewChildIsBorn(null);
    setNewChildDate("");
  }, []);

  const handleRemoveChild = useCallback(async (childId: string) => {
    if (deletingChildId !== childId) {
      setDeletingChildId(childId);
      return;
    }

    setChildrenLoading(true);
    try {
      await supabase.from("children").delete().eq("id", childId);
      setChildren((prev) => prev.filter((c) => c.id !== childId));
      setDeletingChildId(null);
    } catch (error) {
      console.error("Failed to remove child:", error);
    } finally {
      setChildrenLoading(false);
    }
  }, [supabase, deletingChildId]);

  const handleSubmitAddChild = useCallback(async () => {
    if (!newChildName.trim() || newChildIsBorn === null || !newChildDate) return;

    setChildrenLoading(true);
    try {
      const { data: newChild } = await supabase
        .from("children")
        .insert({
          user_id: userId,
          name: newChildName.trim(),
          is_born: newChildIsBorn,
          dob: newChildIsBorn ? newChildDate : null,
          due_date: !newChildIsBorn ? newChildDate : null,
        })
        .select()
        .single();

      if (newChild) {
        setChildren((prev) => [...prev, enrichChildWithAge(newChild)]);
      }
      handleCancelAddChild();
    } catch (error) {
      console.error("Failed to add child:", error);
    } finally {
      setChildrenLoading(false);
    }
  }, [supabase, userId, newChildName, newChildIsBorn, newChildDate, handleCancelAddChild]);

  return (
    <section className="rounded-2xl border border-stone-200/60 bg-white shadow-card p-6">
      <h2 className="text-lg font-semibold text-stone-900 mb-4">Your Children</h2>

      {children.length > 0 ? (
        <div className="space-y-3 mb-4">
          {children.map((child) => (
            <div key={child.id} className="rounded-xl border border-stone-200 p-4">
              {editingChildId === child.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editChildName}
                      onChange={(e) => setEditChildName(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      {child.is_born ? "Date of birth" : "Due date"}
                    </label>
                    <input
                      type="date"
                      value={editChildDate}
                      onChange={(e) => setEditChildDate(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSaveChild}
                      disabled={childrenLoading}
                      className="rounded-xl bg-brand-500 text-white px-3 py-1 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="rounded-xl border border-stone-300 text-stone-600 px-3 py-1 text-sm font-medium hover:bg-stone-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-stone-900">{child.name}</h3>
                    <p className="text-sm text-stone-500">{child.age_label}</p>
                    <span className="mt-1 inline-flex items-center rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700">
                      {child.is_born ? "Born" : "Expecting"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditChild(child)}
                      className="rounded-lg hover:bg-stone-100 p-2 transition-colors"
                      title="Edit child"
                    >
                      <Edit2 className="h-4 w-4 text-stone-600" />
                    </button>
                    {deletingChildId === child.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleRemoveChild(child.id)}
                          disabled={childrenLoading}
                          className="rounded-lg bg-red-600 text-white px-2 py-1 text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingChildId(null)}
                          className="rounded-lg border border-stone-300 text-stone-600 px-2 py-1 text-xs font-medium hover:bg-stone-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRemoveChild(child.id)}
                        className="rounded-lg hover:bg-stone-100 p-2 transition-colors"
                        title="Remove child"
                      >
                        <X className="h-4 w-4 text-stone-400 hover:text-stone-600" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-500 mb-4">No children added yet.</p>
      )}

      {showAddChild ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-stone-900">Add a child</h3>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Name or nickname</label>
            <input
              type="text"
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              placeholder="e.g. Emma"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Has this child been born yet?</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setNewChildIsBorn(true); setNewChildDate(""); }}
                className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  newChildIsBorn === true
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-stone-200 text-stone-600 hover:border-stone-300"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => { setNewChildIsBorn(false); setNewChildDate(""); }}
                className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                  newChildIsBorn === false
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-stone-200 text-stone-600 hover:border-stone-300"
                }`}
              >
                Not yet
              </button>
            </div>
          </div>
          {newChildIsBorn !== null && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {newChildIsBorn ? "Date of birth" : "Expected due date"}
              </label>
              <input
                type="date"
                value={newChildDate}
                onChange={(e) => setNewChildDate(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSubmitAddChild}
              disabled={childrenLoading || !newChildName.trim() || newChildIsBorn === null || !newChildDate}
              className="rounded-xl bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              {childrenLoading ? "Adding..." : "Add Child"}
            </button>
            <button
              onClick={handleCancelAddChild}
              className="rounded-xl border border-stone-300 text-stone-600 px-4 py-2 text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleShowAddChild}
          disabled={childrenLoading}
          className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 px-4 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors w-full justify-center disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Another Child
        </button>
      )}
    </section>
  );
}
