import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import { calculateAgeInWeeks } from "@kinpath/shared";
import type { Child, ResourceWithMeta } from "@kinpath/shared";

const COLORS = {
  primary: "#10b89f",
  secondary: "#5f8253",
  accent: "#f59e0b",
  background: "#f0eeec",
  dark: "#1c1917",
  stone200: "#e7e5e4",
  lightGray: "#f9f9f9",
  white: "#ffffff",
  gray: "#999999",
};

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 16,
  },
  topicFilterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginBottom: 8,
  },
  topicChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.stone200,
    backgroundColor: COLORS.white,
  },
  topicChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  topicChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.dark,
  },
  topicChipTextActive: {
    color: COLORS.white,
  },
  resourceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resourceCardTouchable: {
    borderRadius: 12,
    overflow: "hidden",
  },
  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(16, 184, 159, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 8,
  },
  resourceSummary: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 10,
  },
  topicsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  topicPill: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  topicPillText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "500",
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topicScrollView: {
    paddingLeft: 16,
  },
});

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
      // Fetch user's first child to get active child's age
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

      // Fetch published resources
      const { data: resourcesData } = await supabase
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
        .eq("status", "published")
        .gte("age_end_weeks", activeChildAge)
        .lte("age_start_weeks", activeChildAge);

      if (resourcesData) {
        // Transform resources to include topic IDs
        const enrichedResources: EnrichedResource[] = resourcesData.map(
          (resource: any) => ({
            ...resource,
            topics: (resource.resource_topics || []).map(
              (rt: any) => rt.topic_id
            ),
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

  // Filter resources by selected topic
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

  const renderResourceCard = ({ item }: { item: EnrichedResource }) => (
    <TouchableOpacity
      style={[styles.resourceCard, styles.resourceCardTouchable]}
      onPress={() => handleResourcePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>
          {item.resource_type.toUpperCase()}
        </Text>
      </View>
      <Text style={styles.resourceTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.resourceSummary} numberOfLines={2}>
        {item.summary}
      </Text>
      {item.topics && item.topics.length > 0 && (
        <View style={styles.topicsRow}>
          {item.topics.slice(0, 3).map((topicId) => (
            <View key={topicId} style={styles.topicPill}>
              <Text style={styles.topicPillText}>
                {getTopicLabel(topicId)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  if (authLoading || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Browse Resources</Text>
        </View>

        {/* Topic Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.topicScrollView}
          scrollEventThrottle={16}
        >
          <TouchableOpacity
            style={[
              styles.topicChip,
              selectedTopic === null && styles.topicChipActive,
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
          </TouchableOpacity>
          {TOPICS.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.topicChip,
                selectedTopic === topic.id && styles.topicChipActive,
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
            </TouchableOpacity>
          ))}
        </ScrollView>

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
                tintColor={COLORS.primary}
              />
            }
            contentContainerStyle={styles.scrollContent}
            scrollEventThrottle={16}
          />
        ) : (
          <ScrollView
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
              />
            }
          >
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No resources found</Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedTopic
                  ? "Try selecting a different topic"
                  : "Resources will appear as you add children"}
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
