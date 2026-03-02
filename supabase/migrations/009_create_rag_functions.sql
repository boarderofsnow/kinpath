-- Migration 009: RAG Search + Semantic Cache RPC Functions
-- These are the Postgres functions that the API layer calls for the
-- full RAG pipeline: cache lookup → article search → cache store.
--
-- Call via Supabase client:
--   supabase.rpc('match_articles', { query_embedding: [...], match_count: 10 })
--   supabase.rpc('cache_lookup',   { query_embedding: [...] })
--   supabase.rpc('cache_store',    { ... })
--   supabase.rpc('cache_cleanup')
--
-- Run in Supabase SQL Editor after 008.

-- ═══════════════════════════════════════════════════════════════
-- FUNCTION 1: match_articles
-- Core RAG retrieval — vector similarity search over articles.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION articles.match_articles(
    query_embedding   vector(1024),
    match_threshold   float    DEFAULT 0.5,
    match_count       int      DEFAULT 10,
    filter_tags       text[]   DEFAULT NULL
)
RETURNS TABLE (
    id          uuid,
    title       text,
    abstract    text,
    url         text,
    similarity  float,
    tags        jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = articles, public, extensions
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.title,
        a.abstract,
        a.url,
        -- Cosine similarity: 1 - cosine distance (pgvector <=> is distance)
        1 - (a.embedding <=> match_articles.query_embedding)::float AS similarity,
        -- Aggregate tags as JSON array
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'slug', t.slug,
                    'name', t.name,
                    'dimension', t.dimension,
                    'confidence', at.confidence
                )
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'::jsonb
        ) AS tags
    FROM articles.articles a
    LEFT JOIN articles.article_tags at ON a.id = at.article_id
    LEFT JOIN articles.tags t ON at.tag_id = t.id
    WHERE
        -- Must have an embedding
        a.embedding IS NOT NULL
        -- Exclude rejected articles
        AND a.status != 'rejected'
        -- Above similarity threshold
        AND 1 - (a.embedding <=> match_articles.query_embedding) > match_threshold
        -- Optional tag filter: if provided, article must have at least one matching tag
        AND (
            filter_tags IS NULL
            OR a.id IN (
                SELECT at2.article_id
                FROM articles.article_tags at2
                JOIN articles.tags t2 ON at2.tag_id = t2.id
                WHERE t2.slug = ANY(filter_tags)
            )
        )
    GROUP BY a.id, a.title, a.abstract, a.url, a.embedding
    ORDER BY a.embedding <=> match_articles.query_embedding ASC
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION articles.match_articles IS
    'Core RAG retrieval: finds the most semantically similar articles to a query embedding. '
    'Returns articles with similarity scores and aggregated tag info. '
    'Optional filter_tags parameter restricts results to articles with specific tag slugs.';


-- ═══════════════════════════════════════════════════════════════
-- FUNCTION 2: cache_lookup
-- Check semantic cache for a near-identical previous answer.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION articles.cache_lookup(
    query_embedding       vector(1024),
    similarity_threshold  float DEFAULT 0.95
)
RETURNS TABLE (
    id            uuid,
    query_text    text,
    response_text text,
    article_ids   uuid[],
    similarity    float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = articles, public, extensions
AS $$
DECLARE
    matched_id uuid;
BEGIN
    -- Find the best matching cached query (single vector scan)
    SELECT qc.id INTO matched_id
    FROM articles.query_cache qc
    WHERE qc.expires_at > now()
      AND 1 - (qc.query_embedding <=> cache_lookup.query_embedding) >= similarity_threshold
    ORDER BY qc.query_embedding <=> cache_lookup.query_embedding ASC
    LIMIT 1;

    -- If we found a match, increment hit_count and return it
    IF matched_id IS NOT NULL THEN
        UPDATE articles.query_cache
        SET hit_count = hit_count + 1,
            updated_at = now()
        WHERE articles.query_cache.id = matched_id;

        RETURN QUERY
        SELECT
            qc.id,
            qc.query_text,
            qc.response_text,
            qc.article_ids,
            1 - (qc.query_embedding <=> cache_lookup.query_embedding)::float AS similarity
        FROM articles.query_cache qc
        WHERE qc.id = matched_id;
    END IF;

    -- No match: returns empty result set automatically
END;
$$;

COMMENT ON FUNCTION articles.cache_lookup IS
    'Checks the semantic cache for a sufficiently similar previous question. '
    'Default threshold 0.95 = questions must be ~95% similar to get a cache hit. '
    'Increments hit_count on match for analytics.';


-- ═══════════════════════════════════════════════════════════════
-- FUNCTION 3: cache_store
-- Save a new RAG response to the semantic cache.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION articles.cache_store(
    p_query_text      text,
    p_query_embedding vector(1024),
    p_response_text   text,
    p_article_ids     uuid[]     DEFAULT '{}',
    p_model_used      text       DEFAULT NULL,
    p_metadata        jsonb      DEFAULT '{}',
    p_ttl_days        int        DEFAULT 30
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = articles, public, extensions
AS $$
DECLARE
    new_id uuid;
BEGIN
    INSERT INTO articles.query_cache (
        query_text,
        query_embedding,
        response_text,
        article_ids,
        model_used,
        metadata,
        expires_at
    ) VALUES (
        p_query_text,
        p_query_embedding,
        p_response_text,
        p_article_ids,
        p_model_used,
        p_metadata,
        now() + (p_ttl_days || ' days')::interval
    )
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$;

COMMENT ON FUNCTION articles.cache_store IS
    'Stores a new RAG response in the semantic cache. '
    'Default TTL is 30 days — stale medical information should be refreshed periodically. '
    'Metadata can store filter context (tags, child age, life stage) for cache segmentation.';


-- ═══════════════════════════════════════════════════════════════
-- FUNCTION 4: cache_cleanup
-- Delete expired cache entries. Call on a schedule or manually.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION articles.cache_cleanup()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = articles, public, extensions
AS $$
DECLARE
    deleted_count int;
BEGIN
    DELETE FROM articles.query_cache
    WHERE expires_at < now();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION articles.cache_cleanup IS
    'Deletes expired cache entries. Returns the number of rows removed. '
    'Call periodically (e.g. daily via pg_cron or a scheduled task) to keep the cache lean.';


-- ═══════════════════════════════════════════════════════════════
-- GRANT EXECUTE to authenticated + service_role
-- (RLS on the table still restricts direct access to service_role)
-- ═══════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION articles.match_articles     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION articles.cache_lookup        TO service_role;
GRANT EXECUTE ON FUNCTION articles.cache_store         TO service_role;
GRANT EXECUTE ON FUNCTION articles.cache_cleanup       TO service_role;

-- match_articles is granted to authenticated because the webapp/iOS app
-- may call it directly for search. The cache functions are service_role
-- only since they're called by the API backend, not the client.
