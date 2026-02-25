import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { supabase } from "../../lib/supabase";
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomColor: COLORS.stone200,
    borderBottomWidth: 1,
  },
  headerBackButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
  },
  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(16, 184, 159, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 16,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.dark,
    marginBottom: 12,
    lineHeight: 32,
  },
  summary: {
    fontSize: 16,
    color: COLORS.gray,
    lineHeight: 24,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.stone200,
    marginVertical: 20,
  },
  bodyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
    marginBottom: 12,
  },
  bodyContent: {
    fontSize: 15,
    color: COLORS.dark,
    lineHeight: 24,
    marginBottom: 16,
  },
  topicsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  topicPill: {
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  topicPillText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: "500",
  },
  sourceLink: {
    marginTop: 20,
    paddingTop: 20,
    borderTopColor: COLORS.stone200,
    borderTopWidth: 1,
  },
  sourceLinkText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
    marginBottom: 8,
  },
  sourceLinkUrl: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "400",
  },
  metaInfo: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.gray,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: "500",
  },
  vetBadge: {
    backgroundColor: "rgba(95, 130, 83, 0.1)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  vetBadgeText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  premiumBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  premiumBadgeText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: "600",
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!resource) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={handleBackPress}
          >
            <ArrowLeft size={24} color={COLORS.dark} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 16, fontWeight: "600", color: COLORS.dark }}>
            Resource
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={{ color: COLORS.gray, fontSize: 16 }}>
            Resource not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar with Back Button */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={handleBackPress}
        >
          <ArrowLeft size={24} color={COLORS.dark} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: "600", color: COLORS.dark }}>
          {resource.title.length > 30
            ? resource.title.substring(0, 27) + "..."
            : resource.title}
        </Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContent}>
          {/* Type Badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {resource.resource_type.toUpperCase()}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{resource.title}</Text>

          {/* Premium Badge (if applicable) */}
          {resource.is_premium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>Premium Content</Text>
            </View>
          )}

          {/* Summary */}
          <Text style={styles.summary}>{resource.summary}</Text>

          {/* Topics */}
          {resource.topics && resource.topics.length > 0 && (
            <View style={styles.topicsRow}>
              {resource.topics.map((topicId) => (
                <View key={topicId} style={styles.topicPill}>
                  <Text style={styles.topicPillText}>
                    {getTopicLabel(topicId)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />

          {/* Body Content */}
          <Text style={styles.bodyTitle}>Content</Text>
          <Text style={styles.bodyContent}>{resource.body}</Text>

          {/* Meta Information */}
          <View style={styles.metaInfo}>
            <Text style={styles.metaLabel}>Published</Text>
            <Text style={styles.metaValue}>
              {formatDate(resource.created_at)}
            </Text>

            {resource.vetted_at && (
              <>
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.metaLabel}>Vetting Status</Text>
                  <View style={styles.vetBadge}>
                    <Text style={styles.vetBadgeText}>
                      ✓ Professionally reviewed
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Source Link */}
          {resource.source_url && (
            <View style={styles.sourceLink}>
              <Text style={styles.sourceLinkText}>Source</Text>
              <Text style={styles.sourceLinkUrl} numberOfLines={2}>
                {resource.source_url}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
