"use client";

import { useState } from "react";
import type { ChecklistItem, ChildWithAge, HouseholdMember } from "@kinpath/shared";
import { X, Calendar, User } from "lucide-react";

interface ChecklistItemRowProps {
  item: ChecklistItem;
  childProfiles?: ChildWithAge[];
  householdMembers?: HouseholdMember[];
  onToggle: (id: string, completed: boolean) => void;
  onDateChange: (id: string, newDate: string) => void;
  onDelete: (id: string) => void;
  /** When true, hides delete button and disables date editing (for household partners). */
  readOnly?: boolean;
}

export function ChecklistItemRow({
  item,
  childProfiles,
  householdMembers,
  onToggle,
  onDateChange,
  onDelete,
  readOnly = false,
}: ChecklistItemRowProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const displayDate = item.due_date ?? item.suggested_date;

  const showChildTags =
    childProfiles &&
    childProfiles.length > 1 &&
    item.child_ids &&
    item.child_ids.length > 0 &&
    item.child_ids.length < childProfiles.length;

  // Resolve assignee display name
  const assignee = item.assignee_member_id
    ? householdMembers?.find((m) => m.id === item.assignee_member_id)
    : null;
  const assigneeName =
    item.assignee_name ??
    (assignee ? (assignee.display_name ?? assignee.invited_email) : null);

  return (
    <div className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-stone-50">
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id, !item.is_completed)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          item.is_completed
            ? "border-brand-500 bg-brand-500 text-white"
            : "border-stone-300 hover:border-brand-400"
        }`}
      >
        {item.is_completed && (
          <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium ${
            item.is_completed ? "text-stone-400 line-through" : "text-stone-800"
          }`}
        >
          {item.title}
          {item.item_type === "milestone" && (
            <span className="ml-2 inline-flex items-center rounded-full bg-sage-100 px-1.5 py-0.5 text-[10px] font-medium text-sage-700">
              Milestone
            </span>
          )}
        </p>
        {item.description && (
          <p className={`mt-0.5 text-xs ${item.is_completed ? "text-stone-300" : "text-stone-500"}`}>
            {item.description}
          </p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-stone-400" />
            <input
              type="date"
              value={displayDate ?? ""}
              onChange={(e) => onDateChange(item.id, e.target.value)}
              className="rounded border-none bg-transparent p-0 text-xs text-stone-500 focus:outline-none focus:ring-0"
            />
          </div>

          {showChildTags &&
            item.child_ids!.map((cid) => {
              const child = childProfiles!.find((c) => c.id === cid);
              return child ? (
                <span
                  key={cid}
                  className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-600"
                >
                  {child.name}
                </span>
              ) : null;
            })}

          {assigneeName && (
            <span className="flex items-center gap-0.5 rounded-full bg-sage-100 px-1.5 py-0.5 text-[10px] font-medium text-sage-700">
              <User className="h-2.5 w-2.5" />
              {assigneeName}
            </span>
          )}
        </div>
      </div>

      {/* Delete — hidden for read-only (partner) users */}
      {!readOnly && (
        <div className="shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDelete(item.id)}
                className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="rounded p-1 text-stone-300 opacity-0 transition-all hover:bg-stone-100 hover:text-stone-500 group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
