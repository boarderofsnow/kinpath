"use client";

import { useState } from "react";
import type { DoctorDiscussionItem, ChildWithAge } from "@kinpath/shared";
import { X, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  normal: "bg-amber-400",
  low: "bg-stone-300",
};

interface DoctorItemRowProps {
  item: DoctorDiscussionItem;
  childProfiles: ChildWithAge[];
  onToggleDiscussed: (id: string, discussed: boolean) => void;
  onUpdateResponse: (id: string, response: string) => void;
  onDelete: (id: string) => void;
}

export function DoctorItemRow({
  item,
  childProfiles,
  onToggleDiscussed,
  onUpdateResponse,
  onDelete,
}: DoctorItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [responseText, setResponseText] = useState(item.doctor_response ?? "");

  const showChildTags =
    childProfiles.length > 1 &&
    item.child_ids &&
    item.child_ids.length > 0 &&
    item.child_ids.length < childProfiles.length;

  return (
    <div className="group border-b border-stone-100 last:border-b-0">
      <div className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-stone-50">
        {/* Checkbox */}
        <button
          onClick={() => onToggleDiscussed(item.id, !item.is_discussed)}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
            item.is_discussed
              ? "border-brand-500 bg-brand-500 text-white"
              : "border-stone-300 hover:border-brand-400"
          }`}
        >
          {item.is_discussed && (
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
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[item.priority]}`} />
            <p
              className={`text-sm font-medium ${
                item.is_discussed ? "text-stone-400 line-through" : "text-stone-800"
              }`}
            >
              {item.title}
            </p>
          </div>

          {item.notes && (
            <p className={`mt-0.5 ml-4 text-xs ${item.is_discussed ? "text-stone-300" : "text-stone-500"}`}>
              {item.notes}
            </p>
          )}

          <div className="mt-1 ml-4 flex flex-wrap items-center gap-2">
            {showChildTags &&
              item.child_ids!.map((cid) => {
                const child = childProfiles.find((c) => c.id === cid);
                return child ? (
                  <span
                    key={cid}
                    className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-600"
                  >
                    {child.name}
                  </span>
                ) : null;
              })}
            {item.conversation_id && (
              <span className="flex items-center gap-0.5 text-[10px] text-stone-400">
                <MessageCircle className="h-2.5 w-2.5" />
                From chat
              </span>
            )}
          </div>
        </div>

        {/* Expand / Delete */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="rounded p-1 text-stone-300 transition-all hover:bg-stone-100 hover:text-stone-500"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
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
      </div>

      {/* Expanded: doctor response */}
      {expanded && (
        <div className="border-t border-stone-100 bg-stone-50/50 px-5 py-3 pl-12">
          <label className="text-xs font-medium text-stone-500">Doctor&apos;s response / notes</label>
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            onBlur={() => {
              if (responseText !== (item.doctor_response ?? "")) {
                onUpdateResponse(item.id, responseText);
              }
            }}
            placeholder="Record what the doctor said..."
            rows={2}
            className="mt-1 w-full resize-none rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>
      )}
    </div>
  );
}
