import { createServerSupabaseClient } from "./supabase/server";
import type { ResourceWithMeta } from "@kinpath/shared";

/**
 * Search and browse resources across the full library.
 * Unlike getPersonalizedFeed (which filters by child age), this shows
 * ALL published resources matching the search criteria.
 *
 * @param query - Text search string (searches title and summary)
 * @param topic - Optional topic filter
 * @param limit - Max results (default 40)
 * @param offset - Pagination offset (default 0)
 */
export async function searchResources({
  query,
  topic,
  limit = 40,
  offset = 0,
}: {
  query?: string;
  topic?: string;
  limit?: number;
  offset?: number;
}): Promise<{ resources: ResourceWithMeta[]; total: number }> {
  const supabase = await createServerSupabaseClient();

  // Build the base query
  let dbQuery = supabase
    .from("resources")
    .select("*, resource_topics(topic_id)", { count: "exact" })
    .eq("status", "published")
    .order("created_at", { ascending: false });

  // Text search: use ilike on title and summary
  if (query && query.trim().length > 0) {
    const searchTerm = `%${query.trim()}%`;
    dbQuery = dbQuery.or(`title.ilike.${searchTerm},summary.ilike.${searchTerm}`);
  }

  // Pagination
  dbQuery = dbQuery.range(offset, offset + limit - 1);

  const { data: resources, error, count } = await dbQuery;

  if (error || !resources) {
    return { resources: [], total: 0 };
  }

  // Transform to ResourceWithMeta
  let results: ResourceWithMeta[] = resources.map(
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
        tags: [],
        is_vetted: !!(r.vetted_at),
        vetting_info: undefined,
      };
    }
  );

  // Topic filter (applied client-side after join, since Supabase can't
  // filter by a joined table's column directly in this query pattern)
  if (topic) {
    results = results.filter((r) => r.topics.includes(topic));
  }

  return {
    resources: results,
    total: topic ? results.length : (count ?? results.length),
  };
}
