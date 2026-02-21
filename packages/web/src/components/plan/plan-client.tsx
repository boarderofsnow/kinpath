"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  MILESTONE_TEMPLATES,
  calculateMilestoneDate,
  getRelevantMilestones,
  groupByTimeframe,
  toISODateString,
} from "@kinpath/shared";
import type { ChecklistItem, MilestoneTemplate, ChildWithAge, DoctorDiscussionItem, HouseholdMember } from "@kinpath/shared";
import { ChecklistItemRow } from "./checklist-item-row";
import { AddItemForm } from "./add-item-form";
import { DoctorClient } from "@/components/doctor/doctor-client";
import { AlertCircle, Clock, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Plus, ClipboardList, Stethoscope } from "lucide-react";

interface PlanClientProps {
  userId: string;
  childProfiles: ChildWithAge[];
  activeChildId: string;
  initialItems: ChecklistItem[];
  initialDoctorItems: DoctorDiscussionItem[];
  initialTab?: "checklist" | "doctor";
  householdMembers?: HouseholdMember[];
}

export function PlanClient({
  userId,
  childProfiles,
  activeChildId,
  initialItems,
  initialDoctorItems,
  initialTab = "checklist",
  householdMembers = [],
}: PlanClientProps) {
  const supabase = createClient();
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addingMilestone, setAddingMilestone] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"checklist" | "doctor">(initialTab);
  const [filterChildId, setFilterChildId] = useState<string | "all">(activeChildId);

  const activeChild = childProfiles.find((c) => c.id === activeChildId) ?? childProfiles[0];
  const filterChild = filterChildId === "all" ? null : childProfiles.find((c) => c.id === filterChildId) ?? activeChild;

  // Filter items by selected child
  const filteredItems = useMemo(() => {
    if (filterChildId === "all") return items;
    return items.filter((item) => {
      if (item.child_ids && item.child_ids.length > 0) {
        return item.child_ids.includes(filterChildId);
      }
      return item.child_id === filterChildId;
    });
  }, [items, filterChildId]);

  // Group items by timeframe
  const grouped = useMemo(() => groupByTimeframe(filteredItems), [filteredItems]);

  // Get milestone keys already in the list
  const existingKeys = useMemo(
    () => new Set(items.filter((i) => i.milestone_key).map((i) => i.milestone_key!)),
    [items]
  );

  const suggestChild = filterChild ?? activeChild;
  const suggestions = useMemo(
    () => getRelevantMilestones(suggestChild, MILESTONE_TEMPLATES, existingKeys),
    [suggestChild, existingKeys]
  );

  // Progress
  const total = filteredItems.length;
  const completedCount = filteredItems.filter((i) => i.is_completed).length;
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const handleToggle = useCallback(
    async (itemId: string, completed: boolean) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, is_completed: completed, completed_at: completed ? new Date().toISOString() : null }
            : i
        )
      );
      await supabase
        .from("checklist_items")
        .update({ is_completed: completed, completed_at: completed ? new Date().toISOString() : null })
        .eq("id", itemId);
    },
    [supabase]
  );

  const handleDateChange = useCallback(
    async (itemId: string, newDate: string) => {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, due_date: newDate } : i))
      );
      await supabase.from("checklist_items").update({ due_date: newDate }).eq("id", itemId);
    },
    [supabase]
  );

  const handleDelete = useCallback(
    async (itemId: string) => {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      await supabase.from("checklist_items").delete().eq("id", itemId);
    },
    [supabase]
  );

  const handleAddCustom = useCallback(
    async (
      title: string,
      description: string,
      dueDate: string | null,
      childIds?: string[],
      assigneeMemberId?: string | null
    ) => {
      const tagChildIds = childIds && childIds.length > 0
        ? childIds
        : filterChildId !== "all"
          ? [filterChildId]
          : childProfiles.map((c) => c.id);

      // Resolve assignee name for optimistic display
      const assigneeMember = assigneeMemberId
        ? householdMembers.find((m) => m.id === assigneeMemberId)
        : null;
      const assigneeName = assigneeMember
        ? (assigneeMember.display_name ?? assigneeMember.invited_email)
        : null;

      const newItem = {
        child_id: tagChildIds[0],
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
        assignee_member_id: assigneeMemberId ?? null,
      };

      const { data, error } = await supabase
        .from("checklist_items")
        .insert(newItem)
        .select()
        .single();

      if (data && !error) {
        if (tagChildIds.length > 0) {
          await supabase.from("checklist_item_children").insert(
            tagChildIds.map((cid) => ({ checklist_item_id: data.id, child_id: cid }))
          );
        }
        setItems((prev) => [
          ...prev,
          { ...data, child_ids: tagChildIds, assignee_name: assigneeName },
        ]);
      }
      setShowAddForm(false);
    },
    [supabase, filterChildId, childProfiles, userId, items.length, householdMembers]
  );

  const handleAddMilestone = useCallback(
    async (template: MilestoneTemplate) => {
      setAddingMilestone(template.key);
      const date = calculateMilestoneDate(suggestChild, template);
      const dateStr = date ? toISODateString(date) : null;

      const tagChildIds = filterChildId !== "all"
        ? [filterChildId]
        : childProfiles.map((c) => c.id);

      const newItem = {
        child_id: tagChildIds[0],
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
        if (tagChildIds.length > 0) {
          await supabase.from("checklist_item_children").insert(
            tagChildIds.map((cid) => ({ checklist_item_id: data.id, child_id: cid }))
          );
        }
        setItems((prev) => [...prev, { ...data, child_ids: tagChildIds }]);
      }
      setAddingMilestone(null);
    },
    [supabase, suggestChild, filterChildId, childProfiles, userId, items.length]
  );

  return (
    <div>
      <header>
        <h1 className="text-2xl font-bold text-stone-900">Plan</h1>
        <p className="mt-1 text-sm text-stone-500">
          Track milestones and tasks for your family
        </p>
      </header>

      {/* Page tabs: Checklist / Doctor */}
      <div className="mt-4 flex gap-1 rounded-xl bg-stone-100 p-1">
        <button
          onClick={() => setActiveTab("checklist")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "checklist"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          Checklist
        </button>
        <button
          onClick={() => setActiveTab("doctor")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "doctor"
              ? "bg-white text-stone-900 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          <Stethoscope className="h-4 w-4" />
          Doctor
        </button>
      </div>

      {/* Child filter tabs */}
      {childProfiles.length > 1 && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setFilterChildId("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium shadow-sm transition-colors ${
              filterChildId === "all"
                ? "bg-brand-500 text-white"
                : "bg-white text-stone-700 hover:bg-brand-50"
            }`}
          >
            All
          </button>
          {childProfiles.map((child) => (
            <button
              key={child.id}
              onClick={() => setFilterChildId(child.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium shadow-sm transition-colors ${
                filterChildId === child.id
                  ? "bg-brand-500 text-white"
                  : "bg-white text-stone-700 hover:bg-brand-50"
              }`}
            >
              {child.name}
            </button>
          ))}
        </div>
      )}

      {activeTab === "checklist" && (
        <>
          {total > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-stone-600">
                <span>{completedCount} of {total} completed</span>
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
                  childProfiles={childProfiles}
                  householdMembers={householdMembers}
                  onToggle={handleToggle}
                  onDateChange={handleDateChange}
                  onDelete={handleDelete}
                />
              ))}
            </Section>
          )}

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
                  childProfiles={childProfiles}
                  householdMembers={householdMembers}
                  onToggle={handleToggle}
                  onDateChange={handleDateChange}
                  onDelete={handleDelete}
                />
              ))}
            </Section>
          )}

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
                  childProfiles={childProfiles}
                  householdMembers={householdMembers}
                  onToggle={handleToggle}
                  onDateChange={handleDateChange}
                  onDelete={handleDelete}
                />
              ))}
            </Section>
          )}

          {total === 0 && !showAddForm && (
            <div className="mt-8 rounded-2xl border border-stone-200/60 bg-white p-8 text-center shadow-card">
              <p className="text-stone-500">
                No items yet. Add a custom task or browse suggested milestones below.
              </p>
            </div>
          )}

          <div className="mt-6">
            {showAddForm ? (
              <AddItemForm
                onSave={handleAddCustom}
                onCancel={() => setShowAddForm(false)}
                childProfiles={childProfiles}
                defaultChildIds={
                  filterChildId !== "all" ? [filterChildId] : childProfiles.map((c) => c.id)
                }
                householdMembers={householdMembers}
              />
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex w-full items-center gap-2 rounded-xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-600 transition-colors hover:border-brand-400 hover:text-brand-600"
              >
                <Plus className="h-4 w-4" />
                Add custom item
              </button>
            )}
          </div>

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
                {showSuggestions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showSuggestions && (
                <div className="mt-2 space-y-2">
                  {suggestions.map((t) => {
                    const date = calculateMilestoneDate(suggestChild, t);
                    return (
                      <div
                        key={t.key}
                        className="flex items-center justify-between rounded-xl border border-stone-200/60 bg-white px-4 py-3 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-stone-800">{t.title}</p>
                          <p className="mt-0.5 truncate text-xs text-stone-500">
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
                  childProfiles={childProfiles}
                  householdMembers={householdMembers}
                  onToggle={handleToggle}
                  onDateChange={handleDateChange}
                  onDelete={handleDelete}
                />
              ))}
            </Section>
          )}
        </>
      )}

      {activeTab === "doctor" && (
        <DoctorClient
          userId={userId}
          childProfiles={childProfiles}
          filterChildId={filterChildId}
          initialItems={initialDoctorItems}
        />
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

function Section({ title, icon, count, children, accentClass, defaultCollapsed = false }: SectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div className={`mt-6 overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-card ${accentClass ?? ""}`}>
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-3"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-stone-800">
          {icon}
          {title}
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">{count}</span>
        </span>
        {collapsed ? <ChevronDown className="h-4 w-4 text-stone-400" /> : <ChevronUp className="h-4 w-4 text-stone-400" />}
      </button>
      {!collapsed && <div className="border-t border-stone-100">{children}</div>}
    </div>
  );
}
