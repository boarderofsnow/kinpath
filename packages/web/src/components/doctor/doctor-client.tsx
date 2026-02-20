"use client";

import { useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { groupDoctorItems } from "@kinpath/shared";
import type { DoctorDiscussionItem, ChildWithAge } from "@kinpath/shared";
import { DoctorItemRow } from "./doctor-item-row";
import { AddDoctorItemForm } from "./add-doctor-item-form";
import { Plus, Stethoscope, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

interface DoctorClientProps {
  userId: string;
  childProfiles: ChildWithAge[];
  filterChildId: string | "all";
  initialItems: DoctorDiscussionItem[];
}

export function DoctorClient({
  userId,
  childProfiles,
  filterChildId,
  initialItems,
}: DoctorClientProps) {
  const supabase = createClient();
  const [items, setItems] = useState<DoctorDiscussionItem[]>(initialItems);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDiscussed, setShowDiscussed] = useState(false);

  // Filter by selected child
  const filteredItems = useMemo(() => {
    if (filterChildId === "all") return items;
    return items.filter((item) => {
      if (item.child_ids && item.child_ids.length > 0) {
        return item.child_ids.includes(filterChildId);
      }
      return true;
    });
  }, [items, filterChildId]);

  const { toDiscuss, discussed } = useMemo(() => groupDoctorItems(filteredItems), [filteredItems]);

  const handleToggleDiscussed = useCallback(
    async (id: string, discussed: boolean) => {
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                is_discussed: discussed,
                discussed_at: discussed ? now : null,
              }
            : i
        )
      );
      await supabase
        .from("doctor_discussion_items")
        .update({
          is_discussed: discussed,
          discussed_at: discussed ? now : null,
          updated_at: now,
        })
        .eq("id", id);
    },
    [supabase]
  );

  const handleUpdateResponse = useCallback(
    async (id: string, response: string) => {
      const now = new Date().toISOString();
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, doctor_response: response || null } : i
        )
      );
      await supabase
        .from("doctor_discussion_items")
        .update({ doctor_response: response || null, updated_at: now })
        .eq("id", id);
    },
    [supabase]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      await supabase.from("doctor_discussion_items").delete().eq("id", id);
    },
    [supabase]
  );

  const handleAddItem = useCallback(
    async (
      title: string,
      notes: string | null,
      priority: "low" | "normal" | "high",
      childIds: string[]
    ) => {
      const newItem = {
        user_id: userId,
        title,
        notes,
        priority,
        is_discussed: false,
        sort_order: items.length,
      };

      const { data, error } = await supabase
        .from("doctor_discussion_items")
        .insert(newItem)
        .select()
        .single();

      if (data && !error) {
        if (childIds.length > 0) {
          await supabase.from("doctor_item_children").insert(
            childIds.map((cid) => ({ doctor_item_id: data.id, child_id: cid }))
          );
        }
        setItems((prev) => [...prev, { ...data, child_ids: childIds }]);
      }
      setShowAddForm(false);
    },
    [supabase, userId, items.length]
  );

  return (
    <div>
      {/* To Discuss section */}
      {toDiscuss.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-card">
          <div className="flex items-center gap-2 px-5 py-3">
            <Stethoscope className="h-4 w-4 text-brand-500" />
            <span className="text-sm font-semibold text-stone-800">To Discuss</span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              {toDiscuss.length}
            </span>
          </div>
          <div className="border-t border-stone-100">
            {toDiscuss.map((item) => (
              <DoctorItemRow
                key={item.id}
                item={item}
                childProfiles={childProfiles}
                onToggleDiscussed={handleToggleDiscussed}
                onUpdateResponse={handleUpdateResponse}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {toDiscuss.length === 0 && !showAddForm && (
        <div className="mt-8 rounded-2xl border border-stone-200/60 bg-white p-8 text-center shadow-card">
          <Stethoscope className="mx-auto mb-4 h-12 w-12 text-stone-300" />
          <p className="text-stone-500">No topics to discuss yet.</p>
          <p className="mt-1 text-sm text-stone-400">
            Add questions or concerns for your next doctor&apos;s appointment.
          </p>
        </div>
      )}

      {/* Add item */}
      <div className="mt-6">
        {showAddForm ? (
          <AddDoctorItemForm
            onSave={handleAddItem}
            onCancel={() => setShowAddForm(false)}
            childProfiles={childProfiles}
            defaultChildIds={
              filterChildId !== "all" ? [filterChildId] : childProfiles.map((c) => c.id)
            }
          />
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-600 transition-colors hover:border-brand-400 hover:text-brand-600"
          >
            <Plus className="h-4 w-4" />
            Add topic to discuss
          </button>
        )}
      </div>

      {/* Discussed section */}
      {discussed.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200/60 bg-white opacity-75 shadow-card">
          <button
            onClick={() => setShowDiscussed((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-stone-800">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Discussed
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                {discussed.length}
              </span>
            </span>
            {showDiscussed ? (
              <ChevronUp className="h-4 w-4 text-stone-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-stone-400" />
            )}
          </button>
          {showDiscussed && (
            <div className="border-t border-stone-100">
              {discussed.map((item) => (
                <DoctorItemRow
                  key={item.id}
                  item={item}
                  childProfiles={childProfiles}
                  onToggleDiscussed={handleToggleDiscussed}
                  onUpdateResponse={handleUpdateResponse}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
