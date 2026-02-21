"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ReviewStatus = "approved" | "rejected" | "needs_revision";

interface ExistingReview {
  id: string;
  status: ReviewStatus;
  review_notes: string;
  credentials_verified: boolean;
}

interface ReviewFormProps {
  resourceId: string;
  resourceSlug: string;
  reviewerId: string;
  existingReview: ExistingReview | null;
}

const STATUS_OPTIONS: { value: ReviewStatus; label: string; description: string }[] = [
  {
    value: "approved",
    label: "Approve",
    description: "Content is accurate and safe to publish.",
  },
  {
    value: "needs_revision",
    label: "Needs Revision",
    description: "Content needs edits before it can be published.",
  },
  {
    value: "rejected",
    label: "Reject",
    description: "Content should not be published.",
  },
];

const STATUS_COLORS: Record<ReviewStatus, string> = {
  approved: "border-green-400 bg-green-50 text-green-800",
  needs_revision: "border-amber-400 bg-amber-50 text-amber-800",
  rejected: "border-red-400 bg-red-50 text-red-800",
};

export function ReviewForm({
  resourceId,
  resourceSlug,
  reviewerId,
  existingReview,
}: ReviewFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus | null>(
    existingReview?.status ?? null
  );
  const [notes, setNotes] = useState(existingReview?.review_notes ?? "");
  const [credentialsVerified, setCredentialsVerified] = useState(
    existingReview?.credentials_verified ?? false
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selectedStatus) {
      setError("Please select a review decision.");
      return;
    }
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/review/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resource_id: resourceId,
            reviewer_id: reviewerId,
            status: selectedStatus,
            review_notes: notes.trim() || null,
            credentials_verified: credentialsVerified,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Failed to submit review.");
          return;
        }

        setSuccess(
          existingReview ? "Review updated!" : "Review submitted!"
        );
        router.refresh();
      } catch {
        setError("Network error. Please try again.");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-card">
      <h3 className="text-sm font-semibold text-stone-800">
        {existingReview ? "Update Your Review" : "Submit Review"}
      </h3>

      {existingReview && (
        <p className="mt-1 text-xs text-stone-400">
          Last submitted:{" "}
          <span className="capitalize">{existingReview.status.replace("_", " ")}</span>
        </p>
      )}

      {/* Decision radio */}
      <div className="mt-4 space-y-2">
        <p className="text-xs font-medium text-stone-500">Decision</p>
        {STATUS_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 transition-colors ${
              selectedStatus === opt.value
                ? STATUS_COLORS[opt.value]
                : "border-stone-200 hover:border-stone-300"
            }`}
          >
            <input
              type="radio"
              name="review-status"
              value={opt.value}
              checked={selectedStatus === opt.value}
              onChange={() => setSelectedStatus(opt.value)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
            />
            <div>
              <p className="text-sm font-medium">{opt.label}</p>
              <p className="text-xs text-current opacity-70">{opt.description}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Notes */}
      <div className="mt-4">
        <label className="text-xs font-medium text-stone-500">
          Notes{" "}
          <span className="font-normal text-stone-400">
            {selectedStatus === "needs_revision" ? "(required)" : "(optional)"}
          </span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Add notes for the editorial team…"
          className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-800 placeholder-stone-300 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 resize-none"
        />
      </div>

      {/* Credentials verified */}
      <label className="mt-3 flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={credentialsVerified}
          onChange={(e) => setCredentialsVerified(e.target.checked)}
          className="h-4 w-4 rounded accent-brand-500"
        />
        <span className="text-xs text-stone-600">
          I confirm this review reflects my professional expertise.
        </span>
      </label>

      {/* Feedback */}
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {success && <p className="mt-3 text-xs text-green-600">{success}</p>}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending || !selectedStatus}
        className="mt-5 w-full rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
      >
        {isPending
          ? "Submitting…"
          : existingReview
          ? "Update Review"
          : "Submit Review"}
      </button>
    </div>
  );
}
