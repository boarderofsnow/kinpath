"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const ALL_STATUSES = ["draft", "in_review", "published", "rejected", "archived"] as const;
type ResourceStatus = typeof ALL_STATUSES[number];

const STATUS_LABELS: Record<ResourceStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  published: "Published",
  rejected: "Rejected",
  archived: "Archived",
};

interface Reviewer {
  id: string;
  full_name: string;
  credentials: string;
  specialty?: string | null;
}

interface AdminResourceActionsProps {
  resourceId: string;
  resourceSlug: string;
  currentStatus: string;
  assignedReviewerId: string | null;
  assignedReviewer: Reviewer | null;
  reviewers: Reviewer[];
  vettedAt: string | null;
}

export function AdminResourceActions({
  resourceId,
  resourceSlug,
  currentStatus,
  assignedReviewerId,
  reviewers,
  vettedAt,
}: AdminResourceActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);
  const [reviewerId, setReviewerId] = useState(assignedReviewerId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/resources/${resourceSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            assigned_reviewer_id: reviewerId || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to save changes.");
          return;
        }
        setSuccess("Changes saved.");
        router.refresh();
      } catch {
        setError("Network error. Please try again.");
      }
    });
  };

  const handlePublish = () => {
    setStatus("published");
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/resources/${resourceSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "published",
            assigned_reviewer_id: reviewerId || null,
            publish: true,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to publish.");
          return;
        }
        setSuccess("Resource published!");
        router.refresh();
      } catch {
        setError("Network error. Please try again.");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-card">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
        Manage Resource
      </h3>

      {/* Status */}
      <div className="mt-4">
        <label className="text-xs font-medium text-stone-500">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Reviewer assignment */}
      <div className="mt-4">
        <label className="text-xs font-medium text-stone-500">Assign Reviewer</label>
        <select
          value={reviewerId}
          onChange={(e) => setReviewerId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        >
          <option value="">Unassigned</option>
          {reviewers.map((r) => (
            <option key={r.id} value={r.id}>
              {r.full_name} ({r.credentials})
            </option>
          ))}
        </select>
      </div>

      {/* Feedback */}
      {error && (
        <p className="mt-3 text-xs text-red-600">{error}</p>
      )}
      {success && (
        <p className="mt-3 text-xs text-green-600">{success}</p>
      )}

      {/* Actions */}
      <div className="mt-5 space-y-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </button>

        {status !== "published" && (
          <button
            onClick={handlePublish}
            disabled={isPending}
            className="w-full rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? "Publishing…" : "Publish Now"}
          </button>
        )}

        {vettedAt && (
          <p className="text-center text-xs text-stone-400">
            Vetted {new Date(vettedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
