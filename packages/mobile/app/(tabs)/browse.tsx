import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Alert,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import { calculateAgeInWeeks } from "@kinpath/shared";
import type { Child, ResourceWithMeta } from "@kinpath/shared";
import { colors, fonts, typography, spacing, radii, shadows, cardBase } from "../../lib/theme";
import { FadeIn, FadeInUp, StaggerItem, PressableScale } from "../../components/motion";
import { ResourceCardSkeleton } from "../../components/skeleton";

const TOPICS = [
  { id: "prenatal", label: "Prenatal" },
  { id: "newborn_care", label: "Newborn Care" },
  { id: "nutrition_and_diet", label: "Nutrition" },
  { id: "vaccinations", label: "Vaccinations" },
  { id: "breastfeeding", label: "Breastfeeding" },
  { id: "emotional_wellness", label: "Wellness" },
  { id: "sleep", label: "Sleep" },
  { id: "milestones", label: "Milestones" },
  { id: "safety", label: "Safety" },
  { id: "postpartum", label: "Postpartum" },
  { id: "infant_development", label: "Infant Dev" },
  { id: "toddler_development", label: "Toddler Dev" },
  { id: "relationships", label: "Relationships" },
];

// Topic pill color mapping for variety
const TOPIC_COLORS: Record<string, { bg: string; text: string }> = {
  prenatal: { bg: colors.accent[50], text: colors.accent[700] },
  newborn_care: { bg: colors.brand[50], text: colors.brand[700] },
  nutrition_and_diet: { bg: colors.sage[50], text: colors.sage[700] },
  vaccinations: { bg: "#ede9fe", text: "#7c3aed" },
  breastfeeding: { bg: colors.brand[50], text: colors.brand[600] },
  emotional_wellness: { bg: "#ffe4e6", text: "#e11d48" },
  sleep: { bg: "#dbeafe", text: "#2563eb" },
  milestones: { bg: colors.accent[50], text: colors.accent[700] },
  safety: { bg: "#fef3c7", text: "#b45309" },
  postpartum: { bg: colors.sage[50], text: colors.sage[600] },
  infant_development: { bg: colors.brand[50], text: colors.brand[600] },
  toddler_development: { bg: colors.brand[50], text: colors.brand[700] },
  relationships: { bg: "#ffe4e6", text: "#e11d48" },
};

interface EnrichedResource extends ResourceWithMeta {
  topics: string[];
}

export default function BrowseScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [resources, setResources] = useState<EnrichedResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<EnrichedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [childAge, setChildAge] = useState<number>(0);

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data: childrenData } = await supabase
        .from("children")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      let activeChildAge = 0;
      if (childrenData && childrenData.length > 0) {
        activeChildAge = calculateAgeInWeeks(childrenData[0] as Child);
        setChildAge(activeChildAge);
      }

      const { data: resourcesData } = await supabase
        .from("resources")
        .select(
          `
          id, title, slug, summary, body, resource_type, source_url,
          age_start_weeks, age_end_weeks, status, vetted_at, vetted_by,
          is_premium, created_at, updated_at,
          resource_topics ( topic_id )
        `
        )
        .eq("status", "published")
        .gte("age_end_weeks", activeChildAge)
        .lte("age_start_weeks", activeChildAge);

      if (resourcesData) {
        const enrichedResources: EnrichedResource[] = resourcesData.map(
          (resource: any) => ({
            ...resource,
            topics: (resource.resource_topics || []).map((rt: any) => rt.topic_id),
          })
        );
        setResources(enrichedResources);
        setFilteredResources(enrichedResources);
      }
    } catch (error) {
      console.error("Error loading resources:", error);
      Alert.alert("Error", "Failed to load resources. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [user?.id, loadData]);

  useEffect(() => {
    if (selectedTopic === null) {
      setFilteredResources(resources);
    } else {
      setFilteredResources(
        resources.filter((resource) => resource.topics.includes(selectedTopic))
      );
    }
  }, [selectedTopic, resources]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleResourcePress = (resource: EnrichedResource) => {
    router.push({
      pathname: "/resource/[slug]",
      params: { slug: resource.slug },
    });
  };

  const getTopicLabel = (topicId: string): string => {
    const topic = TOPICS.find((t) => t.id === topicId);
    return topic?.label || topicId;
  };

  const getTopicColor = (topicId: string) => {
    return TOPIC_COLORS[topicId] || { bg: colors.brand[50], text: colors.brand[600] };
  };

  const renderResourceCard = ({ item, index }: { item: EnrichedResource; index: number }) => (
    <StaggerItem index={index} staggerDelay={80}>
      <PressableScale
        style={styles.resourceCard}
        onPress={() => handleResourcePress(item)}
      >
        {/* Type badge + vetted indicator */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {item.resource_type.toUpperCase()}
            </Text>
          </View>
          {item.vetted_at && (
            <View style={styles.vettedBadge}>
              <Ionicons name="shield-checkmark" size={11} color={colors.sage[600]} />
              <Text style={styles.vettedBadgeText}>Vetted</Text>
            </View>
          )}
        </View>

        <Text style={styles.resourceTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.resourceSummary} numberOfLines={2}>
          {item.summary}
        </Text>

        {/* Topic pills */}
        {item.topics && item.topics.length > 0 && (
          <View style={styles.topicsRow}>
            {item.topics.slice(0, 3).map((topicId) => {
              const topicColor = getTopicColor(topicId);
              return (
                <View
                  key={topicId}
                  style={[styles.topicPill, { backgroundColor: topicColor.bg }]}
                >
                  <Text style={[styles.topicPillText, { color: topicColor.text }]}>
                    {getTopicLabel(topicId)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </PressableScale>
    </StaggerItem>
  );

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerArea}>
          <Text style={styles.headerTitle}>Browse Resources</Text>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md, paddingTop: spacing.md }}>
          <ResourceCardSkeleton />
          <ResourceCardSkeleton />
          <ResourceCardSkeleton />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <FadeIn>
          <View style={styles.headerArea}>
            <Text style={styles.headerTitle}>Browse Resources</Text>
          </View>
        </FadeIn>

        {/* Topic Filter Chips */}
        <View style={styles.topicScrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.topicScrollContent}
            style={styles.topicScroll}
          >
            <Pressable
              style={({ pressed }) => [
                styles.topicChip,
                selectedTopic === null && styles.topicChipActive,
                pressed && styles.topicChipPressed,
              ]}
              onPress={() => setSelectedTopic(null)}
            >
              <Text
                style={[
                  styles.topicChipText,
                  selectedTopic === null && styles.topicChipTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>
            {TOPICS.map((topic) => (
              <Pressable
                key={topic.id}
                style={({ pressed }) => [
                  styles.topicChip,
                  selectedTopic === topic.id && styles.topicChipActive,
                  pressed && styles.topicChipPressed,
                ]}
                onPress={() => setSelectedTopic(topic.id)}
              >
                <Text
                  style={[
                    styles.topicChipText,
                    selectedTopic === topic.id && styles.topicChipTextActive,
                  ]}
                >
                  {topic.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {/* Fade edge to hint at scrollability */}
          <LinearGradient
            colors={["transparent", colors.background]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.scrollFade}
            pointerEvents="none"
          />
        </View>

        {/* Resources List */}
        {filteredResources.length > 0 ? (
          <FlatList
            data={filteredResources}
            renderItem={renderResourceCard}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.brand[500]}
              />
            }
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.brand[500]}
              />
            }
          >
            <FadeInUp delay={100}>
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="book-outline" size={40} color={colors.brand[400]} />
                </View>
                <Text style={styles.emptyTitle}>No resources found</Text>
                <Text style={styles.emptySubtext}>
                  {selectedTopic
                    ? "Try selecting a different topic"
                    : "Resources will appear as you add children"}
                </Text>
              </View>
            </FadeInUp>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  headerArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    ...typography.displayMedium,
    color: colors.foreground,
  },

  // Topic filter
  topicScrollWrapper: {
    position: "relative",
    marginBottom: spacing.sm,
  },
  topicScroll: {
    flexGrow: 0,
  },
  topicScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: "center",
  },
  scrollFade: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 32,
  },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.stone[200],
  },
  topicChipActive: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  topicChipPressed: {
    opacity: 0.7,
  },
  topicChipText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.foreground,
  },
  topicChipTextActive: {
    color: colors.white,
  },

  // Resource card
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing["3xl"],
  },
  resourceCard: {
    ...cardBase,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  typeBadge: {
    backgroundColor: colors.brand[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  typeBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.brand[600],
    letterSpacing: 0.5,
  },
  vettedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.sage[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  vettedBadgeText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: colors.sage[600],
  },
  resourceTitle: {
    ...typography.headingMedium,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  resourceSummary: {
    ...typography.bodyMedium,
    color: colors.stone[500],
    marginBottom: spacing.sm,
  },
  topicsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  topicPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  topicPillText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
  },

  // Empty state
  emptyState: {
    ...cardBase,
    padding: spacing["3xl"],
    alignItems: "center",
    marginHorizontal: spacing.lg,
    marginTop: spacing["2xl"],
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.displaySmall,
    color: colors.foreground,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  emptySubtext: {
    ...typography.bodyMedium,
    color: colors.stone[500],
    textAlign: "center",
  },
});
