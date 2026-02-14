import { createServerSupabaseClient } from "./supabase/server";
import type { ResourceWithMeta, UserPreferences } from "@kinpath/shared";
import { rankResources } from "@kinpath/shared";

/**
 * Default preferences object for users who haven't saved preferences yet.
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  id: "",
  user_id: "",
  birth_preference: null,
  feeding_preference: null,
  vaccine_stance: null,
  religion: null,
  dietary_preference: null,
  parenting_style: null,
  topics_of_interest: [],
  updated_at: "",
};

/**
 * Fetch age-appropriate, personalized resources for a user's child.
 *
 * How it works:
 * 1. Fetches published resources whose age range overlaps the child's age (with buffer)
 * 2. Joins resource_topics to get topic associations
 * 3. Transforms to ResourceWithMeta
 * 4. Scores and ranks by relevance (age proximity + topic match + tag match)
 *
 * @param userId - The authenticated user's ID
 * @param ageInWeeks - The child's age in weeks (negative = prenatal)
 * @param limit - Max resources to return (default 20)
 */
export async function getPersonalizedFeed(
  userId: string,
  ageInWeeks: number,
  limit = 20
): Promise<{ resources: ResourceWithMeta[]; preferences: UserPreferences }> {
  const supabase = await createServerSupabaseClient();

  // Fetch user preferences for scoring
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  const preferences: UserPreferences = prefs ?? {
    ...DEFAULT_PREFERENCES,
    user_id: userId,
  };

  // Use a wider window to get more content, then let scoring handle ranking.
  // Prenatal: wider buffer since trimesters span larger ranges
  // Postnatal: tighter buffer for more focused content
  const buffer = ageInWeeks < 0 ? 16 : 12;
  const minAge = ageInWeeks - buffer;
  const maxAge = ageInWeeks + buffer;

  // Fetch published resources whose age range overlaps the child's age window.
  // A resource overlaps if: resource.age_start_weeks <= maxAge AND resource.age_end_weeks >= minAge
  const { data: resources, error } = await supabase
    .from("resources")
    .select(`
      *,
      resource_topics(topic_id)
    `)
    .eq("status", "published")
    .lte("age_start_weeks", maxAge)
    .gte("age_end_weeks", minAge)
    .order("created_at", { ascending: false })
    .limit(60); // Fetch extra, then rank and trim

  if (error || !resources?.length) {
    return { resources: [], preferences };
  }

  // Transform Supabase rows into ResourceWithMeta objects
  const resourcesWithMeta: ResourceWithMeta[] = resources.map(
    (r: Record<string, unknown>) => {
      const resourceTopics = (
        r.resource_topics as { topic_id: string }[] | null
      ) ?? [];

      return {
        id: r.id as string,
        title: r.title as string,
        slug: r.slug as string,
        summary: r.summary as string,
        body: r.body as string,
        resource_type: r.resource_type as ResourceWithMeta["resource_type"],
        source_url: r.source_url as string | null,
        age_start_weeks: r.age_start_weeks as number,
        age_end_weeks: r.age_end_weeks as number,
        status: r.status as ResourceWithMeta["status"],
        vetted_at: r.vetted_at as string | null,
        vetted_by: r.vetted_by as string | null,
        is_premium: r.is_premium as boolean,
        created_at: r.created_at as string,
        updated_at: r.updated_at as string,
        topics: resourceTopics.map((t) => t.topic_id),
        tags: [], // Tags not seeded yet
        is_vetted: !!(r.vetted_at),
        vetting_info: r.vetted_at
          ? {
              vetted_at: r.vetted_at as string,
              reviewer_name: "Professional Reviewer",
              reviewer_credentials: "",
            }
          : undefined,
      };
    }
  );

  // Score and rank based on user preferences and child age
  const ranked = rankResources(resourcesWithMeta, preferences, ageInWeeks);

  return {
    resources: ranked.slice(0, limit),
    preferences,
  };
}
