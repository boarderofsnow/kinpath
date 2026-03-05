"use client";

import { useState, useTransition } from "react";
import { Users, Mail, X, Clock, CheckCircle2, UserPlus, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { HouseholdMember, SubscriptionTier } from "@kinpath/shared";
import { api } from "@/lib/api";

interface HouseholdSectionProps {
  initialMembers: HouseholdMember[];
  subscriptionTier: SubscriptionTier;
  maxMembers: number;
}

const STATUS_CONFIG = {
  pending: {
    label: "Invite sent",
    icon: Clock,
    color: "text-amber-600 bg-amber-50",
  },
  accepted: {
    label: "Joined",
    icon: CheckCircle2,
    color: "text-green-600 bg-green-50",
  },
  declined: {
    label: "Declined",
    icon: X,
    color: "text-red-500 bg-red-50",
  },
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  partner: "Partner",
  caregiver: "Caregiver",
};

export function HouseholdSection({
  initialMembers,
  subscriptionTier,
  maxMembers,
}: HouseholdSectionProps) {
  const [members, setMembers] = useState<HouseholdMember[]>(initialMembers);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<"partner" | "caregiver">("partner");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const isFamily = subscriptionTier === "family";
  const activeMembers = members.filter((m) => m.status !== "declined");
  const atLimit = activeMembers.length >= maxMembers;

  const sectionTitle = isFamily ? "Family Sharing" : "Partner Sharing";
  const inviteLabel = isFamily ? "Invite Member" : "Invite Partner";
  const description = isFamily
    ? "Invite partners, grandparents, babysitters, or other caregivers to share your children\u2019s profiles, checklist, and provider discussion list."
    : "Invite your co-parent or partner to share your children\u2019s profiles, checklist, and provider discussion list.";

  const handleInvite = () => {
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      try {
        const { data, error: apiError } = await api.household.invite({
          email: email.trim(),
          display_name: displayName.trim() || null,
          ...(isFamily ? { role: selectedRole } : {}),
        });

        if (apiError) {
          setError(apiError);
          return;
        }

        const responseData = data as { member_id?: string } | null;

        // Optimistically add the new member to the list
        const newMember: HouseholdMember = {
          id: responseData?.member_id ?? "",
          household_id: "",
          user_id: null,
          invited_email: email.trim().toLowerCase(),
          display_name: displayName.trim() || null,
          role: isFamily ? selectedRole : "partner",
          status: "pending",
          invited_at: new Date().toISOString(),
          accepted_at: null,
        };
        setMembers((prev) => [...prev, newMember]);
        setEmail("");
        setDisplayName("");
        setSelectedRole("partner");
        setShowForm(false);
        setSuccess(`Invite sent to ${email.trim()}`);
      } catch {
        setError("Network error. Please try again.");
      }
    });
  };

  const handleRemove = (memberId: string) => {
    setRemovingId(memberId);
    startTransition(async () => {
      try {
        const { error: apiError } = await api.household.remove({
          member_id: memberId,
        });

        if (apiError) {
          setError(apiError);
          setRemovingId(null);
          return;
        }

        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setRemovingId(null);
      } catch {
        setError("Network error. Please try again.");
        setRemovingId(null);
      }
    });
  };

  return (
    <section className="rounded-2xl border border-stone-200/60 bg-white shadow-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-stone-700" />
          <h2 className="text-lg font-semibold text-stone-900">{sectionTitle}</h2>
          <span className="text-xs font-medium text-stone-400">
            {activeMembers.length}/{maxMembers}
          </span>
        </div>
        {atLimit ? (
          isFamily ? (
            <span className="text-xs font-medium text-stone-400">Member limit reached</span>
          ) : (
            <Link
              href="/pricing"
              className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              Upgrade for more
              <ArrowRight className="h-3 w-3" />
            </Link>
          )
        ) : (
          <button
            onClick={() => {
              setShowForm((v) => !v);
              setError(null);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {inviteLabel}
          </button>
        )}
      </div>

      <p className="text-sm text-stone-500 mb-4">{description}</p>

      {/* Invite form */}
      {showForm && (
        <div className="mb-4 rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-stone-500">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@example.com"
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500">
              Display name{" "}
              <span className="font-normal text-stone-400">(optional)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex"
              className="mt-1 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
          {/* Role selector — family tier only */}
          {isFamily && (
            <div>
              <label className="text-xs font-medium text-stone-500">Role</label>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole("partner")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedRole === "partner"
                      ? "bg-brand-500 text-white"
                      : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  Partner
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("caregiver")}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedRole === "caregiver"
                      ? "bg-brand-500 text-white"
                      : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  Caregiver
                </button>
              </div>
              <p className="mt-1 text-[11px] text-stone-400">
                {selectedRole === "partner"
                  ? "Co-parent with full shared access"
                  : "Grandparent, babysitter, nanny, or other caregiver"}
              </p>
            </div>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleInvite}
              disabled={isPending || !email.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              <Mail className="h-3.5 w-3.5" />
              {isPending ? "Sending\u2026" : "Send Invite"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-500 hover:bg-stone-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success message */}
      {success && !showForm && (
        <p className="mb-3 text-xs text-green-600">{success}</p>
      )}

      {/* Members list */}
      {members.filter((m) => m.status !== "declined").length > 0 ? (
        <div className="space-y-2">
          {members
            .filter((m) => m.status !== "declined")
            .map((member) => {
              const config = STATUS_CONFIG[member.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-stone-800 truncate">
                        {member.display_name ?? member.invited_email}
                      </p>
                      {isFamily && (
                        <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                      )}
                    </div>
                    {member.display_name && (
                      <p className="text-xs text-stone-400 truncate">
                        {member.invited_email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                    <button
                      onClick={() => handleRemove(member.id)}
                      disabled={removingId === member.id}
                      className="rounded p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-600 disabled:opacity-50"
                      title={member.status === "accepted" ? "Remove member" : "Cancel invite"}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <p className="text-sm text-stone-400 text-center py-4">
          {isFamily ? "No members invited yet." : "No partners invited yet."}
        </p>
      )}
    </section>
  );
}
