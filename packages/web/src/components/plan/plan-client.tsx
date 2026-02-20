"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  MILESTONE_TEMPLATES,
  calculateMilestoneDate,
  getRelevantMilestones,
  groupByTimeframe,
  toISODateString,
} from "@kinpath/shared";
import type { ChecklistItem, MilestoneTemplate, ChildWithAge } from "@kinpath/shared";
import { ChecklistItemRow } from "./checklist-item-row";
import { AddItemForm } from "./add-item-form";
import { AlertCircle, Clock, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Plus } from "lucide-react";

interface PlanClientProps {
  userId: string;
  children: ChildWithAge[];
  activeChildId: string;
  initialItems: ChecklistItem[];
}

export function PlanClient({
  userId,
  children,
  activeChildId,
  initialItems,
}: PlanClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addingMilestone, setAddingMilestone] = useState<string | null>(null);

  const activeChild = children.find((c) => c.id === activeChildId) ?? children[0];

  // Group items by timeframe
  const grouped = useMemo(() => groupByTimeframe(items), [items]);

  // Get milestone keys already in the list
  const existingKeys = useMemo(
    () => new Set(items.filter((i) => i.milestone_key).map((i) => i.milestone_key!)),
    [items]
  );

  // Relevant suggested milestones not yet added
  const suggestions = useMemo(
    () => getRelevantMilestones(activeChild, MILESTONE_TEMPLATES, existingKeys),
    [activeChild, existingKeys]
  );

  // Progress calculation
  const total = items.length;
  const completedCount = items.filter((i) => i.is_completed).length;
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Toggle completion
  const handleToggle = useCallback(
    async (itemId: string, completed: boolean) => {
      // Optimistic update
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                is_completed: completed,
                completed_at: completed ? new Date().toISOString() : null,
              }
            : i
        )
      );

      await supabase
        .from("checklist_items")
        .update({
          is_completed: completed,
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", itemId);
    },
    [supabase]
  );

  // Update due date
  const handleDateChange = useCallback(
    async (itemId: string, newDate: string) => {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, due_date: newDate } : i))
      );

      await supabase
        .from("checklist_items")
        .update({ due_date: newDate })
        .eq("id", itemId);
    },
    [supabase]
  );

  // Delete item
  const handleDelete = useCallback(
    async (itemId: string) => {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      await supabase.from("checklist_items").delete().eq("id", itemId);
    },
    [supabase]
  );

  // Add custom item
  const handleAddCustom = useCallback(
    async (title: string, description: string, dueDate: string | null) => {
      const newItem = {
        child_id: activeChildId,
        user_id: userId,
        title,
        description: description || null,
        item_type: "custom" as const,
        milestone_key: null,
        suggested_date: null,
        due_date: dueDate,
        is_completed: false,
        completed_at: null,
        sort_order: items.length,
      };

      const { data, error } = await supabase
        .from("checklist_items")
        .insert(newItem)
        .select()
        .single();

      if (data && !error) {
        setItems((prev) => [...prev, data]);
      }
      setShowAddForm(false);
    },
    [supabase, activeChildId, userId, items.length]
  );

  // Add suggested milestone
  const handleAddMilestone = useCallback(
    async (template: MilestoneTemplate) => {
      setAddingMilestone(template.key);
      const date = calculateMilestoneDate(activeChild, template);
      const dateStr = date ? toISODateString(date) : null;

      const newItem = {
        child_id: activeChildId,
        user_id: userId,
        title: template.title,
        description: template.description,
        item_type: "milestone" as const,
        milestone_key: template.key,
        suggested_date: dateStr,
        due_date: dateStr,
        is_completed: false,
        completed_at: null,
        sort_order: items.length,
      };

      const { data, error } = await supabase
        .from("checklist_items")
        .insert(newItem)
        .select()
        .single();

      if (data && !error) {
        setItems((prev) => [...prev, data]);
      }
      setAddingMilestone(null);
    },
    [supabase, activeChild, activeChildId, userId, items.length]
  );

  return (
    <div>
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-stone-900">Plan</h1>
        <p className="mt-1 text-sm text-stone-500">
          Track milestones and tasks for {activeChild.name}
        </p>
      </header>

      {/* Child tabs */}
      {children.length > 1 && (
        <div className="mt-4 flex gap-2">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/plan?child=${child.id}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium shadow-sm transition-colors ${
                activeChildId === child.id
                  ? "bg-brand-500 text-white"
                  : "bg-white text-stone-700 hover:bg-brand-50"
              }`}
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}

      {/* Progress bar */}
      {total > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-stone-600">
            <span>
              {completedCount} of {total} completed
            </span>
            <span className="font-medium">{progressPct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Overdue section */}
      {grouped.overdue.length > 0 && (
        <Section
          title="Overdue"
          icon={<AlertCircle className="h-4 w-4 text-red-500" />}
          count={grouped.overdue.length}
          accentClass="border-red-200 bg-red-50/50"
        >
          {grouped.overdue.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onDateChange={handleDateChange}
              onDelete={handleDelete}
            />
          ))}
        </Section>
      )}

      {/* This Month section */}
      {grouped.thisMonth.length > 0 && (
        <Section
          title="This Month"
          icon={<Clock className="h-4 w-4 text-brand-500" />}
          count={grouped.thisMonth.length}
        >
          {grouped.thisMonth.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onDateChange={handleDateChange}
              onDelete={handleDelete}
            />
          ))}
        </Section>
      )}

      {/* Coming Up section */}
      {grouped.comingUp.length > 0 && (
        <Section
          title="Coming Up"
          icon={<Clock className="h-4 w-4 text-stone-400" />}
          count={grouped.comingUp.length}
        >
          {grouped.comingUp.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onDateChange={handleDateChange}
              onDelete={handleDelete}
            />
          ))}
        </Section>
      )}

      {/* Empty state */}
      {total === 0 && !showAddForm && (
        <div className="mt-8 rounded-2xl border border-stone-200/60 bg-white p-8 text-center shadow-card">
          <p className="text-stone-500">
            No items yet. Add a custom task or browse suggested milestones below.
          </p>
        </div>
      )}

      {/* Add custom item */}
      <div className="mt-6">
        {showAddForm ? (
          <AddItemForm
            onSave={handleAddCustom}
            onCancel={() => setShowAddForm(false)}
          />
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-600 transition-colors hover:border-brand-400 hover:text-brand-600 w-full"
          >
            <Plus className="h-4 w-4" />
            Add custom item
          </button>
        )}
      </div>

      {/* Suggested milestones */}
      {suggestions.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowSuggestions((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl bg-sage-50 px-4 py-3 text-sm font-medium text-sage-800 transition-colors hover:bg-sage-100"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sage-600" />
              Suggested milestones ({suggestions.length})
            </span>
            {showSuggestions ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showSuggestions && (
            <div className="mt-2 space-y-2">
              {suggestions.map((t) => {
                const date = calculateMilestoneDate(activeChild, t);
                return (
                  <div
                    key={t.key}
                    className="flex items-center justify-between rounded-xl border border-stone-200/60 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-stone-800">
                        {t.title}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500 truncate">
                        {t.description}
                        {date && (
                          <span className="ml-2 text-stone-400">
                            &middot; ~{date.toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleAddMilestone(t)}
                      disabled={addingMilestone === t.key}
                      className="ml-3 shrink-0 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
                    >
                      {addingMilestone === t.key ? "Adding..." : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Completed section */}
      {grouped.completed.length > 0 && (
        <Section
          title="Completed"
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
          count={grouped.completed.length}
          defaultCollapsed
          accentClass="opacity-75"
        >
          {grouped.completed.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              onToggle={handleToggle}
              onDateChange={handleDateChange}
              onDelete={handleDelete}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

/* ─── Section wrapper ─── */

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
  accentClass?: string;
  defaultCollapsed?: boolean;
}

function Section({
  title,
  icon,
  count,
  children,
  accentClass,
  defaultCollapsed = false,
}: SectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`mt-6 rounded-2xl border border-stone-200/60 bg-white shadow-card overflow-hidden ${accentClass ?? ""}`}>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-stone-800">
          {icon}
          {title}
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
            {count}
          </span>
        </span>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-stone-400" />
        ) : (
          <ChevronUp className="h-4 w-4 text-stone-400" />
        )}
      </button>
      {!collapsed && <div className="border-t border-stone-100">{children}</div>}
    </div>
  );
}
