"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import type { ChildWithAge, ChecklistItem, MilestoneAchievement } from "@kinpath/shared";
import {
  getDevelopmentStage,
  getMilestonesForAge,
  getUpcomingMilestones,
  getPastMilestones,
  enrichMilestonesWithAchievements,
  getPostnatalTip,
  DOMAIN_LABELS,
} from "@kinpath/shared";
import type { DevelopmentalMilestone } from "@kinpath/shared";
import type { EnrichedMilestone } from "@kinpath/shared";
import {
  Sparkles,
  Heart,
  Baby,
  Calendar,
  ArrowRight,
  Brain,
  MessageCircle,
  Hand,
  Users,
  Check,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PostBirthDashboardProps {
  child: ChildWithAge;
  checklistItems: ChecklistItem[];
  achievements: MilestoneAchievement[];
  userId: string;
}

const DOMAIN_ICONS: Record<string, React.ReactNode> = {
  motor: <Hand className="h-3.5 w-3.5" />,
  language: <MessageCircle className="h-3.5 w-3.5" />,
  cognitive: <Brain className="h-3.5 w-3.5" />,
  social: <Users className="h-3.5 w-3.5" />,
};

const DOMAIN_COLORS: Record<string, string> = {
  motor: "bg-blue-100 text-blue-600",
  language: "bg-violet-100 text-violet-600",
  cognitive: "bg-amber-100 text-amber-700",
  social: "bg-rose-100 text-rose-600",
};

function getAgeFunFact(ageInWeeks: number): string {
  if (ageInWeeks < 4) return "Newborns can recognize their mother's voice from birth!";
  if (ageInWeeks < 8) return "Babies this age can see about 8-12 inches, just far enough to see your face while feeding.";
  if (ageInWeeks < 13) return "Smiling is one of the first ways babies communicate socially.";
  if (ageInWeeks < 20) return "At this age, babies begin to discover cause and effect. Shake a rattle, it makes noise!";
  if (ageInWeeks < 30) return "Babies now understand object permanence: things still exist when hidden!";
  if (ageInWeeks < 44) return "Crawling comes in many forms: scooting, rolling, army-crawling. They're all normal!";
  if (ageInWeeks < 65) return "Toddlers learn about 1-2 new words every day, even if they can't say them all yet.";
  if (ageInWeeks < 105) return "Children this age are wired to explore. Every mess is a science experiment!";
  if (ageInWeeks < 157) return "Preschoolers ask an average of 300 questions a day. Curiosity is a superpower!";
  return "Your child is building the foundation for lifelong learning. Every conversation matters.";
}

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function PostBirthDashboard({ child, checklistItems, achievements, userId }: PostBirthDashboardProps) {
  const supabase = createClient();
  const ageWeeks = child.age_in_weeks;
  const stage = getDevelopmentStage(ageWeeks);
  const currentMilestones = getMilestonesForAge(ageWeeks);
  const upcomingMilestones = getUpcomingMilestones(ageWeeks, 3);
  const pastMilestones = getPastMilestones(ageWeeks);
  const tip = getPostnatalTip(ageWeeks);

  // Local achievements state for optimistic updates
  const [localAchievements, setLocalAchievements] = useState<MilestoneAchievement[]>(achievements);

  // Which milestone has the date picker open
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState(toISODate(new Date()));
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Achieved milestones section toggle
  const [showAchieved, setShowAchieved] = useState(false);

  // Upcoming checklist items (not completed, sorted by date)
  const upcomingChecklist = checklistItems
    .filter((item) => !item.is_completed && (item.due_date || item.suggested_date))
    .sort((a, b) => {
      const dateA = a.due_date ?? a.suggested_date ?? "";
      const dateB = b.due_date ?? b.suggested_date ?? "";
      return dateA.localeCompare(dateB);
    })
    .slice(0, 5);

  // Enrich current milestones — filter OUT achieved ones from active display
  const enrichedCurrent = useMemo(() => {
    const enriched = enrichMilestonesWithAchievements(currentMilestones, localAchievements);
    return enriched.filter((m) => m.achievement === null);
  }, [currentMilestones, localAchievements]);

  // ALL achieved milestones (current + past age ranges)
  const allAchievedMilestones = useMemo(() => {
    const allMilestones = [...currentMilestones, ...pastMilestones];
    const enriched = enrichMilestonesWithAchievements(allMilestones, localAchievements);
    return enriched.filter((m) => m.achievement !== null);
  }, [currentMilestones, pastMilestones, localAchievements]);

  // Group milestones by domain
  const milestonesByDomain = useMemo(() => {
    return enrichedCurrent.reduce<Record<string, EnrichedMilestone[]>>((acc, m) => {
      (acc[m.domain] ??= []).push(m);
      return acc;
    }, {});
  }, [enrichedCurrent]);

  const achievedByDomain = useMemo(() => {
    return allAchievedMilestones.reduce<Record<string, EnrichedMilestone[]>>((acc, m) => {
      (acc[m.domain] ??= []).push(m);
      return acc;
    }, {});
  }, [allAchievedMilestones]);

  const openEditor = useCallback((milestoneId: string, existingAchievement?: MilestoneAchievement | null) => {
    setEditingMilestoneId(milestoneId);
    setEditDate(existingAchievement?.achieved_date ?? toISODate(new Date()));
    setEditNotes(existingAchievement?.notes ?? "");
  }, []);

  const closeEditor = useCallback(() => {
    setEditingMilestoneId(null);
    setEditDate(toISODate(new Date()));
    setEditNotes("");
  }, []);

  const saveAchievement = useCallback(async (milestoneId: string) => {
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("milestone_achievements")
        .upsert(
          {
            child_id: child.id,
            user_id: userId,
            milestone_id: milestoneId,
            achieved_date: editDate,
            notes: editNotes || null,
          },
          { onConflict: "child_id,milestone_id" }
        )
        .select()
        .single();

      if (!error && data) {
        setLocalAchievements((prev) => {
          const filtered = prev.filter((a) => a.milestone_id !== milestoneId);
          return [...filtered, data as MilestoneAchievement];
        });
      }
    } finally {
      setSaving(false);
      closeEditor();
    }
  }, [supabase, child.id, userId, editDate, editNotes, closeEditor]);

  const removeAchievement = useCallback(async (milestoneId: string) => {
    const existing = localAchievements.find((a) => a.milestone_id === milestoneId);
    if (!existing) return;

    // Optimistic removal
    setLocalAchievements((prev) => prev.filter((a) => a.milestone_id !== milestoneId));

    const { error } = await supabase
      .from("milestone_achievements")
      .delete()
      .eq("id", existing.id);

    if (error) {
      // Revert on failure
      setLocalAchievements((prev) => [...prev, existing]);
    }
  }, [supabase, localAchievements]);

  return (
    <div className="space-y-6">
      {/* Hero: Age + Stage + Fun Fact */}
      <div className="overflow-hidden rounded-2xl bg-white p-6 shadow-card border border-stone-200/60">
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-100">
              <Baby className="h-12 w-12 text-brand-500" />
            </div>
            <p className="mt-2 text-sm font-semibold text-stone-900">
              {child.name}
            </p>
            <p className="text-xs text-stone-500">{child.age_label}</p>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="text-xs font-medium uppercase tracking-wide text-brand-500">
              {stage}
            </div>
            <div className="mt-1 text-3xl font-bold text-stone-900">
              {child.age_label}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentMilestones.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2.5 py-1 text-xs font-medium text-sage-700">
                  <Brain className="h-3 w-3" />
                  {currentMilestones.length} active milestone{currentMilestones.length !== 1 ? "s" : ""}
                </span>
              )}
              {upcomingChecklist.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700">
                  <Calendar className="h-3 w-3" />
                  {upcomingChecklist.length} coming up
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-white/70 p-4 text-center">
          <p className="text-sm italic text-stone-700">
            &ldquo;{getAgeFunFact(ageWeeks)}&rdquo;
          </p>
        </div>
      </div>

      {/* This Week for You */}
      {tip && (
        <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <h3 className="text-sm font-semibold text-stone-900">
              This Week for You
            </h3>
          </div>
          <p className="mt-2 text-sm text-stone-700">{tip.body}</p>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-sage-50 p-3">
            <Heart className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-sage-500" />
            <p className="text-xs text-sage-700">{tip.self_care}</p>
          </div>
        </div>
      )}

      {/* Developmental Milestones */}
      {currentMilestones.length > 0 && (
        <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-card">
          <h3 className="text-sm font-semibold text-stone-900">
            Developmental Milestones
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            These are typical milestones for {child.name}&apos;s age. Every child develops at their own pace.
          </p>

          <div className="mt-4 space-y-4">
            {Object.entries(milestonesByDomain).map(([domain, milestones]) => (
              <div key={domain}>
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full ${DOMAIN_COLORS[domain]}`}>
                    {DOMAIN_ICONS[domain]}
                  </div>
                  <span className="text-xs font-semibold text-stone-700">
                    {DOMAIN_LABELS[domain as keyof typeof DOMAIN_LABELS]}
                  </span>
                </div>
                <div className="mt-2 ml-8 space-y-2">
                  {milestones.map((m) => (
                    <MilestoneRow
                      key={m.id}
                      milestone={m}
                      isEditing={editingMilestoneId === m.id}
                      editDate={editDate}
                      editNotes={editNotes}
                      saving={saving}
                      onEditDateChange={setEditDate}
                      onEditNotesChange={setEditNotes}
                      onOpen={() => openEditor(m.id, m.achievement)}
                      onClose={closeEditor}
                      onSave={() => saveAchievement(m.id)}
                      onRemove={() => removeAchievement(m.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Upcoming milestones preview */}
          {upcomingMilestones.length > 0 && (
            <div className="mt-4 border-t border-stone-100 pt-4">
              <p className="text-xs font-medium text-stone-500">Coming next</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {upcomingMilestones.map((m) => (
                  <span
                    key={m.id}
                    className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600"
                  >
                    {m.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Coming Up — next checklist items */}
      {upcomingChecklist.length > 0 && (
        <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900">Coming Up</h3>
            <Link
              href="/plan"
              prefetch={false}
              className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {upcomingChecklist.map((item) => {
              const displayDate = item.due_date ?? item.suggested_date;
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-stone-800">{item.title}</p>
                    {displayDate && (
                      <p className="mt-0.5 text-xs text-stone-400">
                        {new Date(displayDate + "T00:00:00").toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achieved Milestones */}
      {allAchievedMilestones.length > 0 && (
        <div className="rounded-2xl border border-stone-200/60 bg-white p-5 shadow-card">
          <button
            type="button"
            onClick={() => setShowAchieved((prev) => !prev)}
            className="flex w-full items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-sage-500" />
              <h3 className="text-sm font-semibold text-stone-900">
                Achieved Milestones
              </h3>
              <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700">
                {allAchievedMilestones.length}
              </span>
            </div>
            {showAchieved ? (
              <ChevronDown className="h-4 w-4 text-stone-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-stone-400" />
            )}
          </button>

          {showAchieved && (
            <div className="mt-4 space-y-4">
              {Object.entries(achievedByDomain).map(([domain, milestones]) => (
                <div key={domain}>
                  <div className="flex items-center gap-2">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full ${DOMAIN_COLORS[domain]}`}>
                      {DOMAIN_ICONS[domain]}
                    </div>
                    <span className="text-xs font-semibold text-stone-700">
                      {DOMAIN_LABELS[domain as keyof typeof DOMAIN_LABELS]}
                    </span>
                  </div>
                  <div className="mt-2 ml-8 space-y-2">
                    {milestones.map((m) => (
                      <div key={m.id} className="flex items-start gap-2">
                        <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sage-100">
                          <Check className="h-2.5 w-2.5 text-sage-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-stone-800">{m.title}</p>
                          <p className="text-xs text-sage-600">
                            Achieved{" "}
                            {new Date(m.achievement!.achieved_date + "T00:00:00").toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            {m.achievement!.notes && (
                              <span className="ml-1 text-stone-400"> &mdash; {m.achievement!.notes}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Milestone Row ──────────────────────────────────────── */

interface MilestoneRowProps {
  milestone: EnrichedMilestone;
  isEditing: boolean;
  editDate: string;
  editNotes: string;
  saving: boolean;
  onEditDateChange: (date: string) => void;
  onEditNotesChange: (notes: string) => void;
  onOpen: () => void;
  onClose: () => void;
  onSave: () => void;
  onRemove: () => void;
}

function MilestoneRow({
  milestone,
  isEditing,
  editDate,
  editNotes,
  saving,
  onEditDateChange,
  onEditNotesChange,
  onOpen,
  onClose,
  onSave,
  onRemove,
}: MilestoneRowProps) {
  const achieved = milestone.achievement;

  return (
    <div className="group">
      <div className="flex items-start gap-2">
        {/* Achievement toggle button */}
        {achieved ? (
          <button
            type="button"
            onClick={onOpen}
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-100 transition-colors hover:bg-sage-200"
            title="Edit achievement date"
          >
            <Check className="h-3 w-3 text-sage-600" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-stone-300 transition-colors hover:border-brand-400 hover:bg-brand-50"
            title="Record this milestone"
          >
            <span className="sr-only">Record milestone</span>
          </button>
        )}

        <div className="flex-1">
          <p className={`text-sm ${achieved ? "text-stone-600" : "text-stone-800"}`}>
            {milestone.title}
          </p>
          {achieved ? (
            <div className="flex items-center gap-2">
              <p className="text-xs text-sage-600">
                Achieved{" "}
                {new Date(achieved.achieved_date + "T00:00:00").toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
                {achieved.notes && (
                  <span className="ml-1 text-stone-400">&mdash; {achieved.notes}</span>
                )}
              </p>
              <button
                type="button"
                onClick={onRemove}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove achievement"
              >
                <X className="h-3 w-3 text-stone-400 hover:text-stone-600" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-stone-500">{milestone.description}</p>
          )}
        </div>
      </div>

      {/* Inline editor */}
      {isEditing && (
        <div className="mt-2 ml-7 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-stone-600">
                Date achieved
              </label>
              <input
                type="date"
                value={editDate}
                onChange={(e) => onEditDateChange(e.target.value)}
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-800 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-stone-600">
                Note <span className="text-stone-400">(optional)</span>
              </label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => onEditNotesChange(e.target.value)}
                placeholder="e.g. First time at the park!"
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:bg-stone-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
