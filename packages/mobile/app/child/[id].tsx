import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import {
  calculateAgeInWeeks,
  formatAgeLabel,
  getDevelopmentStage,
  getMilestonesForAge,
  getUpcomingMilestones,
  getPastMilestones,
  enrichMilestonesWithAchievements,
  getPostnatalTip,
  getDueDateCountdown,
  getBabySizeComparison,

  getMaternalChanges,
  DOMAIN_LABELS,
} from "@kinpath/shared";
import type {
  Child,
  ChildWithAge,
  ChecklistItem,
  DevelopmentalMilestone,
  MilestoneAchievement,
} from "@kinpath/shared";
import type { EnrichedMilestone } from "@kinpath/shared";
import {
  colors,
  fonts,
  typography,
  spacing,
  radii,
  shadows,
  cardBase,
} from "../../lib/theme";
import { FadeIn, FadeInUp, PressableScale } from "../../components/motion";
import { DashboardSkeleton } from "../../components/skeleton";
import { DatePickerInput } from "../../components/settings/DatePickerInput";

// ── Fun facts (matching web) ───────────────────────────────
function getAgeFunFact(ageInWeeks: number): string {
  if (ageInWeeks < 4) return "Newborns can recognize their mother\u2019s voice from birth!";
  if (ageInWeeks < 8) return "Babies this age can see about 8-12 inches \u2014 just far enough to see your face while feeding.";
  if (ageInWeeks < 13) return "Smiling is one of the first ways babies communicate socially.";
  if (ageInWeeks < 20) return "At this age, babies begin to discover cause and effect \u2014 shake a rattle, it makes noise!";
  if (ageInWeeks < 30) return "Babies now understand object permanence \u2014 things still exist when hidden!";
  if (ageInWeeks < 44) return "Crawling comes in many forms \u2014 scooting, rolling, army-crawling. They\u2019re all normal!";
  if (ageInWeeks < 65) return "Toddlers learn about 1-2 new words every day, even if they can\u2019t say them all yet.";
  if (ageInWeeks < 105) return "Children this age are wired to explore. Every mess is a science experiment!";
  if (ageInWeeks < 157) return "Preschoolers ask an average of 300 questions a day. Curiosity is a superpower!";
  return "Your child is building the foundation for lifelong learning. Every conversation matters.";
}

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ── Domain colors ──────────────────────────────────────────
const DOMAIN_COLORS: Record<string, { bg: string; text: string; iconName: keyof typeof Ionicons.glyphMap }> = {
  motor: { bg: "#dbeafe", text: "#2563eb", iconName: "hand-left-outline" },
  language: { bg: "#ede9fe", text: "#7c3aed", iconName: "chatbubble-outline" },
  cognitive: { bg: colors.accent[50], text: colors.accent[700], iconName: "bulb-outline" },
  social: { bg: "#ffe4e6", text: "#e11d48", iconName: "people-outline" },
};

// ── Planning tip category colors ───────────��───────────────
// (Planning tip maps removed — now using checklist items)

interface EnrichedChild extends ChildWithAge {
  age_in_weeks: number;
  age_label: string;
}

export default function ChildDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [child, setChild] = useState<EnrichedChild | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [achievements, setAchievements] = useState<MilestoneAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error("Error loading child:", error);
        return;
      }

      const ageInWeeks = calculateAgeInWeeks(data as Child);
      const enriched: EnrichedChild = {
        ...data,
        age_in_weeks: ageInWeeks,
        age_label: formatAgeLabel(ageInWeeks),
      };
      setChild(enriched);

      // Fetch checklist items for all children
      const { data: items } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("child_id", id)
        .eq("is_completed", false)
        .order("due_date", { ascending: true })
        .limit(5);
      if (items) setChecklistItems(items as ChecklistItem[]);

      // Fetch milestone achievements for post-birth children
      if (data.is_born) {
        const { data: achData } = await supabase
          .from("milestone_achievements")
          .select("*")
          .eq("child_id", id);
        if (achData) setAchievements(achData as MilestoneAchievement[]);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading || !child) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.header}>
          <PressableScale style={s.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </PressableScale>
          <Text style={s.headerTitle}>Loading...</Text>
        </View>
        <DashboardSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      {/* Header */}
      <View style={s.header}>
        <PressableScale style={s.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </PressableScale>
        <Text style={s.headerTitle} numberOfLines={1}>
          {child.name}
        </Text>
      </View>

      <ScrollView
        style={s.container}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {child.is_born ? (
          <PostBirthDashboard
            child={child}
            checklistItems={checklistItems}
            achievements={achievements}
            onAchievementsChange={setAchievements}
          />
        ) : (
          <PregnancyDashboard child={child} checklistItems={checklistItems} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════��════════════
// POST-BIRTH DASHBOARD
// ════════════════════════════════════════════════════════════

function PostBirthDashboard({
  child,
  checklistItems,
  achievements,
  onAchievementsChange,
}: {
  child: EnrichedChild;
  checklistItems: ChecklistItem[];
  achievements: MilestoneAchievement[];
  onAchievementsChange: (achievements: MilestoneAchievement[]) => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const ageWeeks = child.age_in_weeks;
  const stage = getDevelopmentStage(ageWeeks);
  const currentMilestones = getMilestonesForAge(ageWeeks);
  const upcomingMilestones = getUpcomingMilestones(ageWeeks, 3);
  const pastMilestones = getPastMilestones(ageWeeks);
  const tip = getPostnatalTip(ageWeeks);
  const childInitial = child.name.charAt(0).toUpperCase();

  // Achievement recording modal state
  const [modalMilestone, setModalMilestone] = useState<DevelopmentalMilestone | null>(null);
  const [modalDate, setModalDate] = useState<Date>(new Date());
  const [modalNotes, setModalNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Achieved milestones section toggle
  const [showAchieved, setShowAchieved] = useState(false);

  // Enrich current milestones — filter OUT achieved ones from active display
  const enrichedCurrent = useMemo(() => {
    const enriched = enrichMilestonesWithAchievements(currentMilestones, achievements);
    return enriched.filter((m) => m.achievement === null);
  }, [currentMilestones, achievements]);

  // ALL achieved milestones (current + past age ranges)
  const allAchievedMilestones = useMemo(() => {
    const allMilestones = [...currentMilestones, ...pastMilestones];
    const enriched = enrichMilestonesWithAchievements(allMilestones, achievements);
    return enriched.filter((m) => m.achievement !== null);
  }, [currentMilestones, pastMilestones, achievements]);

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

  const openModal = useCallback((milestone: DevelopmentalMilestone, existingAchievement?: MilestoneAchievement | null) => {
    setModalMilestone(milestone);
    setModalDate(
      existingAchievement
        ? new Date(existingAchievement.achieved_date + "T00:00:00")
        : new Date()
    );
    setModalNotes(existingAchievement?.notes ?? "");
  }, []);

  const closeModal = useCallback(() => {
    setModalMilestone(null);
    setModalNotes("");
  }, []);

  const saveAchievement = useCallback(async () => {
    if (!modalMilestone || !user?.id) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("milestone_achievements")
        .upsert(
          {
            child_id: child.id,
            user_id: user.id,
            milestone_id: modalMilestone.id,
            achieved_date: toISODate(modalDate),
            notes: modalNotes || null,
          },
          { onConflict: "child_id,milestone_id" }
        )
        .select()
        .single();

      if (!error && data) {
        const updated = achievements.filter((a) => a.milestone_id !== modalMilestone.id);
        onAchievementsChange([...updated, data as MilestoneAchievement]);
      }
    } finally {
      setSaving(false);
      closeModal();
    }
  }, [modalMilestone, user?.id, child.id, modalDate, modalNotes, achievements, onAchievementsChange, closeModal]);

  const removeAchievement = useCallback(async (milestoneId: string) => {
    const existing = achievements.find((a) => a.milestone_id === milestoneId);
    if (!existing) return;

    // Optimistic removal
    onAchievementsChange(achievements.filter((a) => a.milestone_id !== milestoneId));

    const { error } = await supabase
      .from("milestone_achievements")
      .delete()
      .eq("id", existing.id);

    if (error) {
      // Revert on failure
      onAchievementsChange([...achievements]);
    }
  }, [achievements, onAchievementsChange]);

  return (
    <View style={s.dashboardContent}>
      {/* ── Hero Card ──────────────────────────────── */}
      <FadeInUp delay={0}>
        <View style={s.heroCard}>
          <LinearGradient
            colors={[colors.brand[50], colors.white, colors.sage[50]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={s.heroRow}>
            <LinearGradient
              colors={[colors.brand[400], colors.brand[500]]}
              style={s.heroAvatar}
            >
              <Text style={s.heroAvatarText}>{childInitial}</Text>
            </LinearGradient>
            <View style={s.heroInfo}>
              <Text style={s.heroStageLabel}>{stage}</Text>
              <Text style={s.heroAgeLabel}>{child.age_label}</Text>
              <View style={s.heroBadges}>
                {currentMilestones.length > 0 && (
                  <View style={[s.heroBadge, { backgroundColor: colors.sage[100] }]}>
                    <Ionicons name="bulb-outline" size={12} color={colors.sage[700]} />
                    <Text style={[s.heroBadgeText, { color: colors.sage[700] }]}>
                      {currentMilestones.length} milestone{currentMilestones.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                )}
                {checklistItems.length > 0 && (
                  <View style={[s.heroBadge, { backgroundColor: colors.brand[100] }]}>
                    <Ionicons name="calendar-outline" size={12} color={colors.brand[700]} />
                    <Text style={[s.heroBadgeText, { color: colors.brand[700] }]}>
                      {checklistItems.length} coming up
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Fun fact */}
          <View style={s.funFactBox}>
            <Text style={s.funFactText}>
              &ldquo;{getAgeFunFact(ageWeeks)}&rdquo;
            </Text>
          </View>
        </View>
      </FadeInUp>

      {/* ── This Week for You ──────────────────────── */}
      {tip && (
        <FadeInUp delay={100}>
          <View style={s.sectionCard}>
            <View style={s.sectionHeader}>
              <Ionicons name="sparkles" size={16} color={colors.brand[500]} />
              <Text style={s.sectionTitle}>This Week for You</Text>
            </View>
            <Text style={s.sectionBody}>{tip.body}</Text>
            <View style={s.selfCareBox}>
              <Ionicons name="heart" size={14} color={colors.sage[500]} style={{ marginTop: 1 }} />
              <Text style={s.selfCareText}>{tip.self_care}</Text>
            </View>
          </View>
        </FadeInUp>
      )}

      {/* ── Developmental Milestones ───────────────── */}
      {currentMilestones.length > 0 && (
        <FadeInUp delay={200}>
          <View style={s.sectionCard}>
            <Text style={s.sectionTitle}>Developmental Milestones</Text>
            <Text style={s.sectionSubtext}>
              Typical milestones for {child.name}&apos;s age. Every child develops at their own pace.
            </Text>

            <View style={s.domainList}>
              {Object.entries(milestonesByDomain).map(([domain, milestones]) => {
                const dc = DOMAIN_COLORS[domain] || DOMAIN_COLORS.cognitive;
                return (
                  <View key={domain} style={s.domainGroup}>
                    <View style={s.domainHeader}>
                      <View style={[s.domainIcon, { backgroundColor: dc.bg }]}>
                        <Ionicons name={dc.iconName} size={14} color={dc.text} />
                      </View>
                      <Text style={s.domainLabel}>
                        {DOMAIN_LABELS[domain as keyof typeof DOMAIN_LABELS]}
                      </Text>
                    </View>
                    <View style={s.milestoneList}>
                      {milestones.map((m) => {
                        const isAchieved = m.achievement !== null;
                        return (
                          <View key={m.id} style={s.milestoneItem}>
                            {/* Achievement toggle button */}
                            <PressableScale
                              style={[
                                s.milestoneToggle,
                                isAchieved && s.milestoneToggleAchieved,
                              ]}
                              onPress={() => openModal(m, m.achievement)}
                              scaleTo={0.9}
                            >
                              {isAchieved && (
                                <Ionicons name="checkmark" size={12} color={colors.sage[600]} />
                              )}
                            </PressableScale>

                            <View style={s.milestoneTextGroup}>
                              <Text style={[s.milestoneTitle, isAchieved && s.milestoneTitleAchieved]}>
                                {m.title}
                              </Text>
                              {isAchieved ? (
                                <View style={s.achievedRow}>
                                  <Text style={s.achievedDateText}>
                                    Achieved{" "}
                                    {new Date(m.achievement!.achieved_date + "T00:00:00").toLocaleDateString(undefined, {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                    {m.achievement!.notes ? ` \u2014 ${m.achievement!.notes}` : ""}
                                  </Text>
                                  <PressableScale
                                    onPress={() => removeAchievement(m.id)}
                                    scaleTo={0.9}
                                    style={s.removeBtn}
                                  >
                                    <Ionicons name="close" size={12} color={colors.stone[400]} />
                                  </PressableScale>
                                </View>
                              ) : (
                                <Text style={s.milestoneDesc}>{m.description}</Text>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Coming next */}
            {upcomingMilestones.length > 0 && (
              <View style={s.comingNextSection}>
                <Text style={s.comingNextLabel}>Coming next</Text>
                <View style={s.comingNextPills}>
                  {upcomingMilestones.map((m) => (
                    <View key={m.id} style={s.comingNextPill}>
                      <Text style={s.comingNextPillText}>{m.title}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </FadeInUp>
      )}

      {/* ── Coming Up (Checklist) ──────────────────── */}
      {checklistItems.length > 0 && (
        <FadeInUp delay={250}>
          <View style={s.sectionCard}>
            <View style={s.sectionHeaderBetween}>
              <Text style={s.sectionTitle}>Coming Up</Text>
              <PressableScale
                onPress={() => router.push("/(tabs)/plan")}
                style={s.viewAllLink}
              >
                <Text style={s.viewAllText}>View all</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.brand[600]} />
              </PressableScale>
            </View>
            <View style={s.checklistList}>
              {checklistItems.map((item) => {
                const displayDate = item.due_date ?? item.suggested_date;
                return (
                  <View key={item.id} style={s.checklistRow}>
                    <View style={s.checklistIcon}>
                      <Ionicons name="calendar-outline" size={14} color={colors.brand[600]} />
                    </View>
                    <View style={s.checklistInfo}>
                      <Text style={s.checklistTitle}>{item.title}</Text>
                      {displayDate && (
                        <Text style={s.checklistDate}>
                          {new Date(displayDate + "T00:00:00").toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </FadeInUp>
      )}

      {/* ── Achieved Milestones ────────────────────── */}
      {allAchievedMilestones.length > 0 && (
        <FadeInUp delay={300}>
          <View style={s.sectionCard}>
            <PressableScale
              onPress={() => setShowAchieved((prev) => !prev)}
              style={s.achievedToggleRow}
            >
              <View style={s.achievedToggleLeft}>
                <Ionicons name="checkmark-circle" size={18} color={colors.sage[500]} />
                <Text style={s.sectionTitle}>Achieved Milestones</Text>
                <View style={s.achievedCountBadge}>
                  <Text style={s.achievedCountText}>{allAchievedMilestones.length}</Text>
                </View>
              </View>
              <Ionicons
                name={showAchieved ? "chevron-down" : "chevron-forward"}
                size={18}
                color={colors.stone[400]}
              />
            </PressableScale>

            {showAchieved && (
              <View style={[s.domainList, { marginTop: spacing.md }]}>
                {Object.entries(achievedByDomain).map(([domain, milestones]) => {
                  const dc = DOMAIN_COLORS[domain] || DOMAIN_COLORS.cognitive;
                  return (
                    <View key={domain} style={s.domainGroup}>
                      <View style={s.domainHeader}>
                        <View style={[s.domainIcon, { backgroundColor: dc.bg }]}>
                          <Ionicons name={dc.iconName} size={14} color={dc.text} />
                        </View>
                        <Text style={s.domainLabel}>
                          {DOMAIN_LABELS[domain as keyof typeof DOMAIN_LABELS]}
                        </Text>
                      </View>
                      <View style={s.milestoneList}>
                        {milestones.map((m) => (
                          <View key={m.id} style={s.milestoneItem}>
                            <View style={[s.milestoneToggle, s.milestoneToggleAchieved]}>
                              <Ionicons name="checkmark" size={12} color={colors.sage[600]} />
                            </View>
                            <View style={s.milestoneTextGroup}>
                              <Text style={s.milestoneTitle}>{m.title}</Text>
                              <Text style={s.achievedDateText}>
                                Achieved{" "}
                                {new Date(m.achievement!.achieved_date + "T00:00:00").toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                                {m.achievement!.notes ? ` \u2014 ${m.achievement!.notes}` : ""}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </FadeInUp>
      )}

      {/* ── Achievement Recording Modal ──────────── */}
      <Modal
        visible={modalMilestone !== null}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.modalOverlay}
        >
          <PressableScale style={s.modalBackdrop} onPress={closeModal}>
            <View />
          </PressableScale>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />

            <Text style={s.modalTitle}>
              {modalMilestone?.title ?? "Record Milestone"}
            </Text>
            {modalMilestone?.description && (
              <Text style={s.modalDesc}>{modalMilestone.description}</Text>
            )}

            <DatePickerInput
              label="Date achieved"
              value={modalDate}
              onChange={setModalDate}
              maximumDate={new Date()}
            />

            <View style={s.modalNotesContainer}>
              <Text style={s.modalNotesLabel}>
                Note <Text style={s.modalNotesOptional}>(optional)</Text>
              </Text>
              <TextInput
                style={s.modalNotesInput}
                value={modalNotes}
                onChangeText={setModalNotes}
                placeholder="e.g. First time at the park!"
                placeholderTextColor={colors.stone[400]}
                multiline
              />
            </View>

            <View style={s.modalActions}>
              <PressableScale
                style={s.modalSaveBtn}
                onPress={saveAchievement}
                disabled={saving}
                scaleTo={0.97}
              >
                <Text style={s.modalSaveBtnText}>
                  {saving ? "Saving..." : "Save"}
                </Text>
              </PressableScale>
              <PressableScale
                style={s.modalCancelBtn}
                onPress={closeModal}
                scaleTo={0.97}
              >
                <Text style={s.modalCancelBtnText}>Cancel</Text>
              </PressableScale>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// PREGNANCY DASHBOARD
// ════════════════════════════════════════════════════════════

function PregnancyDashboard({ child, checklistItems }: { child: EnrichedChild; checklistItems: ChecklistItem[] }) {
  const router = useRouter();
  const countdown = getDueDateCountdown(child);
  if (!countdown) return null;

  const sizeComparison = getBabySizeComparison(countdown.gestationalWeek);
  const maternalChanges = getMaternalChanges(countdown.gestationalWeek);

  const upcomingItems = checklistItems
    .filter((item) => !item.is_completed && item.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5);

  const trimesterLabel =
    countdown.trimester === 1
      ? "First Trimester"
      : countdown.trimester === 2
        ? "Second Trimester"
        : "Third Trimester";

  return (
    <View style={s.dashboardContent}>
      {/* ── Hero Card ──────────────────────────────── */}
      <FadeInUp delay={0}>
        <View style={s.heroCard}>
          <LinearGradient
            colors={[colors.brand[50], colors.white, colors.sage[50]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          <View style={s.heroRow}>
            {/* Baby size illustration */}
            {sizeComparison && (
              <View style={s.pregnancySizeSection}>
                <View style={s.pregnancySizeCircle}>
                  <Text style={s.pregnancySizeEmoji}>{sizeComparison.emoji}</Text>
                </View>
                <Text style={s.pregnancySizeLabel}>
                  Size of a {sizeComparison.object}
                </Text>
                <Text style={s.pregnancySizeDetail}>
                  ~{sizeComparison.lengthCm}cm · {sizeComparison.weightDescription}
                </Text>
              </View>
            )}

            {/* Countdown */}
            <View style={s.heroInfo}>
              <Text style={s.heroStageLabel}>
                {trimesterLabel} · Week {countdown.gestationalWeek}
              </Text>
              <View style={s.countdownRow}>
                {countdown.weeksRemaining > 0 ? (
                  <Text style={s.countdownNumber}>
                    {countdown.weeksRemaining}{" "}
                    <Text style={s.countdownUnit}>
                      week{countdown.weeksRemaining !== 1 ? "s" : ""}
                    </Text>
                    {countdown.daysRemainder > 0 && (
                      <>
                        {" "}{countdown.daysRemainder}{" "}
                        <Text style={s.countdownUnit}>
                          day{countdown.daysRemainder !== 1 ? "s" : ""}
                        </Text>
                      </>
                    )}
                    <Text style={s.countdownUnit}> to go</Text>
                  </Text>
                ) : (
                  <Text style={[s.countdownNumber, { color: colors.brand[500] }]}>
                    Any day now!
                  </Text>
                )}
              </View>

              {/* Progress bar */}
              <View style={s.progressBarContainer}>
                <View style={s.progressBarLabels}>
                  <Text style={s.progressBarLabel}>Conception</Text>
                  <Text style={s.progressBarLabel}>{countdown.percentComplete}%</Text>
                  <Text style={s.progressBarLabel}>Due Date</Text>
                </View>
                <View style={s.progressBarTrack}>
                  <LinearGradient
                    colors={[colors.brand[400], colors.brand[500]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[s.progressBarFill, { width: `${countdown.percentComplete}%` as any }]}
                  />
                </View>
              </View>

              {countdown.milestone && (
                <Text style={s.pregnancyMilestone}>{countdown.milestone}</Text>
              )}
            </View>
          </View>

          {/* Encouragement */}
          <View style={s.funFactBox}>
            <Text style={s.funFactText}>
              &ldquo;{countdown.encouragement}&rdquo;
            </Text>
          </View>
        </View>
      </FadeInUp>

      {/* ── This Week for You ──────────────────────── */}
      {maternalChanges && (
        <FadeInUp delay={100}>
          <View style={s.sectionCard}>
            <View style={s.sectionHeader}>
              <Ionicons name="sparkles" size={16} color={colors.brand[500]} />
              <Text style={s.sectionTitle}>This Week for You</Text>
            </View>
            <Text style={s.sectionBody}>{maternalChanges.body}</Text>
            <View style={s.selfCareBox}>
              <Ionicons name="heart" size={14} color={colors.sage[500]} style={{ marginTop: 1 }} />
              <Text style={s.selfCareText}>{maternalChanges.tip}</Text>
            </View>
          </View>
        </FadeInUp>
      )}

      {/* ── Coming Up (Checklist) ─────────────────── */}
      <FadeInUp delay={200}>
        <View style={s.sectionCard}>
          <View style={s.sectionHeaderBetween}>
            <Text style={s.sectionTitle}>Coming Up</Text>
            {upcomingItems.length > 0 && (
              <PressableScale
                onPress={() => router.push("/(tabs)/plan")}
                style={s.viewAllLink}
              >
                <Text style={s.viewAllText}>View all</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.brand[600]} />
              </PressableScale>
            )}
          </View>
          {upcomingItems.length > 0 ? (
            <View style={s.checklistList}>
              {upcomingItems.map((item) => {
                const displayDate = item.due_date ?? item.suggested_date;
                return (
                  <View key={item.id} style={s.checklistRow}>
                    <View style={s.checklistIcon}>
                      <Ionicons name="calendar-outline" size={14} color={colors.brand[600]} />
                    </View>
                    <View style={s.checklistInfo}>
                      <Text style={s.checklistTitle}>{item.title}</Text>
                      {displayDate && (
                        <Text style={s.checklistDate}>
                          {new Date(displayDate + "T00:00:00").toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <PressableScale
              onPress={() => router.push("/(tabs)/plan")}
              style={s.emptyComingUp}
            >
              <Text style={s.emptyComingUpText}>
                Add items from your Plan to see them here.
              </Text>
            </PressableScale>
          )}
        </View>
      </FadeInUp>
    </View>
  );
}

// ════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // ── Header ──────────────────────────────────
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomColor: `${colors.stone[200]}80`,
    borderBottomWidth: 1,
    ...shadows.soft,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.stone[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  headerTitle: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    color: colors.foreground,
  },

  // ── Dashboard content ───────────────────────
  dashboardContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },

  // ── Hero Card ───────────────────────────────
  heroCard: {
    borderRadius: radii.lg,
    overflow: "hidden",
    padding: spacing.xl,
    ...shadows.card,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarText: {
    fontFamily: fonts.sansBold,
    fontSize: 28,
    color: colors.white,
  },
  heroInfo: {
    flex: 1,
  },
  heroStageLabel: {
    ...typography.overline,
    color: colors.brand[500],
    marginBottom: 4,
  },
  heroAgeLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 24,
    lineHeight: 30,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  heroBadgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
  },
  funFactBox: {
    marginTop: spacing.xl,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: "center",
  },
  funFactText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: "italic",
    color: colors.stone[600],
    textAlign: "center",
  },

  // ── Section Card (shared) ───────────────────
  sectionCard: {
    ...cardBase,
    padding: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionHeaderBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
    color: colors.foreground,
  },
  sectionSubtext: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.stone[500],
    marginTop: 4,
    marginBottom: spacing.md,
  },
  sectionBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
    color: colors.stone[700],
  },
  selfCareBox: {
    flexDirection: "row",
    gap: spacing.sm,
    backgroundColor: colors.sage[50],
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  selfCareText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 18,
    color: colors.sage[700],
  },

  // ── Milestones ──────────────────────────────
  domainList: {
    gap: spacing.lg,
  },
  domainGroup: {},
  domainHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  domainIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  domainLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.stone[700],
  },
  milestoneList: {
    marginLeft: 32,
    gap: spacing.sm,
  },
  milestoneItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  milestoneToggle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.stone[300],
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  milestoneToggleAchieved: {
    borderColor: colors.sage[400],
    backgroundColor: colors.sage[100],
  },
  milestoneTextGroup: {
    flex: 1,
  },
  milestoneTitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    color: colors.stone[800],
  },
  milestoneTitleAchieved: {
    color: colors.stone[600],
  },
  milestoneDesc: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 16,
    color: colors.stone[500],
  },
  achievedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  achievedDateText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 16,
    color: colors.sage[600],
    flex: 1,
  },
  removeBtn: {
    padding: 2,
  },
  comingNextSection: {
    borderTopWidth: 1,
    borderTopColor: colors.stone[100],
    paddingTop: spacing.md,
    marginTop: spacing.lg,
  },
  comingNextLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.stone[500],
    marginBottom: spacing.sm,
  },
  comingNextPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  comingNextPill: {
    backgroundColor: colors.stone[100],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  comingNextPillText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.stone[600],
  },

  // ── Achieved Milestones Toggle ──────────────
  achievedToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  achievedToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  achievedCountBadge: {
    backgroundColor: colors.sage[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  achievedCountText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.sage[700],
  },

  // ── Checklist (Coming Up) ───────────────────
  viewAllLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.brand[600],
  },
  checklistList: {
    gap: spacing.md,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  checklistIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand[100],
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checklistInfo: {
    flex: 1,
  },
  checklistTitle: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    color: colors.stone[800],
  },
  checklistDate: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.stone[400],
    marginTop: 2,
  },

  emptyComingUp: {
    paddingVertical: spacing.lg,
    alignItems: "center",
  },
  emptyComingUpText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.stone[500],
    textAlign: "center",
  },

  // ── Pregnancy-specific ──────────────────────
  pregnancySizeSection: {
    alignItems: "center",
  },
  pregnancySizeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand[100],
    alignItems: "center",
    justifyContent: "center",
  },
  pregnancySizeEmoji: {
    fontSize: 36,
  },
  pregnancySizeLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.foreground,
    textAlign: "center",
    marginTop: spacing.sm,
    maxWidth: 100,
  },
  pregnancySizeDetail: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.stone[500],
    textAlign: "center",
    marginTop: 2,
  },
  countdownRow: {
    marginBottom: spacing.md,
  },
  countdownNumber: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    lineHeight: 28,
    color: colors.foreground,
  },
  countdownUnit: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.stone[500],
  },
  progressBarContainer: {
    marginBottom: spacing.sm,
  },
  progressBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  progressBarLabel: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.stone[400],
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.stone[200],
    overflow: "hidden",
  },
  progressBarFill: {
    height: 10,
    borderRadius: 5,
  },
  pregnancyMilestone: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.sage[600],
    marginTop: spacing.sm,
  },


  // ── Achievement Modal ───────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.xl,
    paddingBottom: 40,
    ...shadows.card,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.stone[300],
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    color: colors.foreground,
    marginBottom: 4,
  },
  modalDesc: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
    color: colors.stone[500],
    marginBottom: spacing.lg,
  },
  modalNotesContainer: {
    marginBottom: spacing.lg,
  },
  modalNotesLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  modalNotesOptional: {
    fontFamily: fonts.sans,
    color: colors.stone[400],
  },
  modalNotesInput: {
    borderWidth: 1,
    borderColor: colors.stone[200],
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.foreground,
    backgroundColor: colors.white,
    minHeight: 44,
  },
  modalActions: {
    gap: spacing.sm,
  },
  modalSaveBtn: {
    backgroundColor: colors.brand[500],
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  modalSaveBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.white,
  },
  modalCancelBtn: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  modalCancelBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.stone[600],
  },
});
