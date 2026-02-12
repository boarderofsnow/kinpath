import type { ResourceWithMeta } from "../types/resource";
import type { UserPreferences } from "../types/user";

/**
 * Score a resource based on how well it matches user preferences.
 * Higher score = more relevant.
 */
export function scoreResource(
  resource: ResourceWithMeta,
  preferences: UserPreferences,
  ageInWeeks: number
): number {
  let score = 0;

  // Age relevance (base score) — tighter match = higher score
  const ageCenter =
    (resource.age_start_weeks + resource.age_end_weeks) / 2;
  const ageRange = resource.age_end_weeks - resource.age_start_weeks;
  const ageDistance = Math.abs(ageInWeeks - ageCenter);
  // Normalize: resources centered on current age score highest
  score += Math.max(0, 100 - (ageDistance / Math.max(ageRange, 1)) * 100);

  // Topic interest match (+20 per matching topic)
  if (preferences.topics_of_interest?.length) {
    const matchingTopics = resource.topics.filter((t) =>
      preferences.topics_of_interest.includes(t)
    );
    score += matchingTopics.length * 20;
  }

  // Belief/lifestyle tag match (+15 per matching tag)
  const userTags = buildUserTags(preferences);
  const matchingTags = resource.tags.filter((t) => userTags.includes(t));
  score += matchingTags.length * 15;

  return score;
}

/**
 * Convert user preferences into tag strings for matching.
 */
function buildUserTags(preferences: UserPreferences): string[] {
  const tags: string[] = [];

  if (preferences.birth_preference && preferences.birth_preference !== "undecided") {
    tags.push(`birth:${preferences.birth_preference}`);
  }
  if (preferences.feeding_preference && preferences.feeding_preference !== "undecided") {
    tags.push(`feeding:${preferences.feeding_preference}`);
  }
  if (preferences.vaccine_stance && preferences.vaccine_stance !== "prefer_not_to_say") {
    tags.push(`vaccine:${preferences.vaccine_stance}`);
  }
  if (preferences.dietary_preference && preferences.dietary_preference !== "omnivore") {
    tags.push(`diet:${preferences.dietary_preference}`);
  }
  if (preferences.religion) {
    tags.push(`faith:${preferences.religion}`);
  }

  return tags;
}

/**
 * Sort resources by relevance score (descending).
 */
export function rankResources(
  resources: ResourceWithMeta[],
  preferences: UserPreferences,
  ageInWeeks: number
): ResourceWithMeta[] {
  return resources
    .map((r) => ({
      ...r,
      relevance_score: scoreResource(r, preferences, ageInWeeks),
    }))
    .sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));
}
