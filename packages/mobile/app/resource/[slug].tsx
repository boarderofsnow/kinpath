import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
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
import { ResourceCardSkeleton } from "../../components/skeleton";

// ── Topic color mapping ────────────────────────────────────
const TOPIC_COLORS: Record<string, { bg: string; text: string }> = {
  prenatal: { bg: colors.brand[50], text: colors.brand[600] },
  newborn_care: { bg: colors.sage[50], text: colors.sage[600] },
  nutrition_and_diet: { bg: colors.accent[50], text: colors.accent[700] },
  vaccinations: { bg: colors.brand[100], text: colors.brand[700] },
  breastfeeding: { bg: colors.sage[100], text: colors.sage[700] },
  emotional_wellness: { bg: "#ede9fe", text: "#7c3aed" },
  sleep: { bg: "#dbeafe", text: "#2563eb" },
  milestones: { bg: colors.accent[100], text: colors.accent[800] },
  safety: { bg: "#fef2f2", text: "#dc2626" },
  postpartum: { bg: "#ffe4e6", text: "#e11d48" },
  infant_development: { bg: colors.brand[50], text: colors.brand[700] },
  toddler_development: { bg: colors.sage[50], text: colors.sage[700] },
  relationships: { bg: "#fce7f3", text: "#be185d" },
};

const getTopicColor = (topicId: string) =>
  TOPIC_COLORS[topicId] || { bg: colors.stone[100], text: colors.stone[600] };

// ── Type badge color mapping ───────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  article: { bg: colors.brand[50], text: colors.brand[600] },
  guide: { bg: colors.sage[50], text: colors.sage[600] },
  video: { bg: "#dbeafe", text: "#2563eb" },
  checklist: { bg: colors.accent[50], text: colors.accent[700] },
  tool: { bg: "#ede9fe", text: "#7c3aed" },
};

const getTypeColor = (type: string) =>
  TYPE_COLORS[type] || { bg: colors.brand[50], text: colors.brand[600] };

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // ── Header ──────────────────────────────────────────
  headerBar: {
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
    fontSize: 15,
    lineHeight: 20,
    color: colors.foreground,
  },
  // ── Hero section ────────────────────────────────────
  heroSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.xl,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  typeBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  premiumBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: colors.accent[50],
  },
  premiumBadgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.accent[700],
  },
  vetBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: colors.sage[50],
  },
  vetBadgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.sage[600],
  },
  title: {
    ...typography.displayMedium,
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  summary: {
    fontFamily: fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.stone[500],
    marginBottom: spacing.xl,
  },
  // ── Topics ──────────────────────────────────────────
  topicsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  topicPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  topicPillText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  // ── Content card ────────────────────────────────────
  contentCard: {
    ...cardBase,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  contentCardHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.stone[200]}60`,
  },
  contentCardHeaderText: {
    ...typography.overline,
    color: colors.stone[500],
  },
  contentCardBody: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  bodyContent: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 24,
    color: colors.foreground,
  },
  // ── Meta card ───────────────────────────────────────
  metaCard: {
    ...cardBase,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  metaCardInner: {
    padding: spacing.lg,
  },
  metaRow: {
    marginBottom: spacing.lg,
  },
  metaRowLast: {
    marginBottom: 0,
  },
  metaLabel: {
    ...typography.overline,
    color: colors.stone[400],
    marginBottom: spacing.xs,
  },
  metaValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.foreground,
  },
  // ── Source link ──────────────────────────────────────
  sourceCard: {
    ...cardBase,
    marginHorizontal: spacing.lg,
    marginBottom: spacing["3xl"],
    overflow: "hidden",
  },
  sourceCardInner: {
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sourceInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  sourceLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.brand[600],
    marginBottom: 2,
  },
  sourceUrl: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    color: colors.stone[400],
  },
  // ── Loading / empty states ──────────────────────────
  loadingContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["2xl"],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing["3xl"],
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.stone[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.displaySmall,
    color: colors.foreground,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.bodyMedium,
    color: colors.stone[400],
    textAlign: "center",
  },
});

interface ResourceDetailData {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  resource_type: string;
  source_url: string | null;
  age_start_weeks: number;
  age_end_weeks: number;
  status: string;
  is_premium: boolean;
  vetted_at: string | null;
  vetted_by: string | null;
  created_at: string;
  updated_at: string;
  topics: string[];
}

const TOPIC_LABELS: Record<string, string> = {
  prenatal: "Prenatal",
  newborn_care: "Newborn Care",
  nutrition_and_diet: "Nutrition",
  vaccinations: "Vaccinations",
  breastfeeding: "Breastfeeding",
  emotional_wellness: "Wellness",
  sleep: "Sleep",
  milestones: "Milestones",
  safety: "Safety",
  postpartum: "Postpartum",
  infant_development: "Infant Dev",
  toddler_development: "Toddler Dev",
  relationships: "Relationships",
};

export default function ResourceDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const [resource, setResource] = useState<ResourceDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResource();
  }, [slug]);

  const loadResource = async () => {
    if (!slug) return;

    try {
      const { data, error } = await supabase
        .from("resources")
        .select(
          `
          id,
          title,
          slug,
          summary,
          body,
          resource_type,
          source_url,
          age_start_weeks,
          age_end_weeks,
          status,
          vetted_at,
          vetted_by,
          is_premium,
          created_at,
          updated_at,
          resource_topics (
            topic_id
          )
        `
        )
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) {
        console.error("Error loading resource:", error);
        Alert.alert("Error", "Failed to load resource details.");
        return;
      }

      if (data) {
        const enrichedResource: ResourceDetailData = {
          ...data,
          topics: (data.resource_topics || []).map((rt: any) => rt.topic_id),
        };
        setResource(enrichedResource);
      }
    } catch (error) {
      console.error("Error fetching resource:", error);
      Alert.alert("Error", "Failed to load resource. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTopicLabel = (topicId: string): string => {
    return TOPIC_LABELS[topicId] || topicId;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Unknown date";
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  // ── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <PressableScale style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </PressableScale>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ResourceCardSkeleton />
          <View style={{ height: spacing.lg }} />
          <ResourceCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty / not found state ────────────────────────
  if (!resource) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <PressableScale style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={20} color={colors.foreground} />
          </PressableScale>
          <Text style={styles.headerTitle}>Resource</Text>
        </View>
        <FadeIn>
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBg}>
              <Ionicons
                name="document-text-outline"
                size={28}
                color={colors.stone[400]}
              />
            </View>
            <Text style={styles.emptyTitle}>Not Found</Text>
            <Text style={styles.emptySubtext}>
              This resource could not be loaded. It may have been removed or is
              no longer available.
            </Text>
          </View>
        </FadeIn>
      </SafeAreaView>
    );
  }

  const typeColor = getTypeColor(resource.resource_type);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header Bar ───────────────────────────────── */}
      <View style={styles.headerBar}>
        <PressableScale style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </PressableScale>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {resource.title}
        </Text>
      </View>

      {/* ── Content ──────────────────────────────────── */}
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <FadeInUp delay={0}>
          <View style={styles.heroSection}>
            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <View
                style={[styles.typeBadge, { backgroundColor: typeColor.bg }]}
              >
                <Text
                  style={[styles.typeBadgeText, { color: typeColor.text }]}
                >
                  {resource.resource_type.toUpperCase()}
                </Text>
              </View>

              {resource.is_premium && (
                <View style={styles.premiumBadge}>
                  <Ionicons
                    name="star"
                    size={12}
                    color={colors.accent[600]}
                  />
                  <Text style={styles.premiumBadgeText}>Premium</Text>
                </View>
              )}

              {resource.vetted_at && (
                <View style={styles.vetBadge}>
                  <Ionicons
                    name="shield-checkmark"
                    size={12}
                    color={colors.sage[600]}
                  />
                  <Text style={styles.vetBadgeText}>Vetted</Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={styles.title}>{resource.title}</Text>

            {/* Summary */}
            <Text style={styles.summary}>{resource.summary}</Text>

            {/* Topics */}
            {resource.topics && resource.topics.length > 0 && (
              <View style={styles.topicsRow}>
                {resource.topics.map((topicId) => {
                  const tc = getTopicColor(topicId);
                  return (
                    <View
                      key={topicId}
                      style={[styles.topicPill, { backgroundColor: tc.bg }]}
                    >
                      <Text
                        style={[styles.topicPillText, { color: tc.text }]}
                      >
                        {getTopicLabel(topicId)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </FadeInUp>

        {/* Content Card */}
        <FadeInUp delay={100}>
          <View style={styles.contentCard}>
            <View style={styles.contentCardHeader}>
              <Text style={styles.contentCardHeaderText}>Content</Text>
            </View>
            <View style={styles.contentCardBody}>
              <Text style={styles.bodyContent}>{resource.body}</Text>
            </View>
          </View>
        </FadeInUp>

        {/* Meta Information Card */}
        <FadeInUp delay={200}>
          <View style={styles.metaCard}>
            <LinearGradient
              colors={[colors.stone[50], colors.white]}
              style={styles.metaCardInner}
            >
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Published</Text>
                <Text style={styles.metaValue}>
                  {formatDate(resource.created_at)}
                </Text>
              </View>

              {resource.updated_at !== resource.created_at && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Last Updated</Text>
                  <Text style={styles.metaValue}>
                    {formatDate(resource.updated_at)}
                  </Text>
                </View>
              )}

              {resource.vetted_at && (
                <View style={[styles.metaRow, styles.metaRowLast]}>
                  <Text style={styles.metaLabel}>Vetting Status</Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={16}
                      color={colors.sage[500]}
                    />
                    <Text
                      style={{
                        fontFamily: fonts.sansMedium,
                        fontSize: 14,
                        lineHeight: 20,
                        color: colors.sage[600],
                      }}
                    >
                      Professionally reviewed
                    </Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>
        </FadeInUp>

        {/* Source Link Card */}
        {resource.source_url && (
          <FadeInUp delay={300}>
            <PressableScale style={styles.sourceCard}>
              <View style={styles.sourceCardInner}>
                <View style={styles.sourceInfo}>
                  <Text style={styles.sourceLabel}>View Source</Text>
                  <Text style={styles.sourceUrl} numberOfLines={1}>
                    {resource.source_url}
                  </Text>
                </View>
                <Ionicons
                  name="open-outline"
                  size={18}
                  color={colors.brand[500]}
                />
              </View>
            </PressableScale>
          </FadeInUp>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
