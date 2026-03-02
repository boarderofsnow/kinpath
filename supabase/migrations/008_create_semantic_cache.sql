-- Migration 008: Semantic Cache for RAG Query Responses
-- Stores previously answered questions with their embeddings so identical
-- (or near-identical) future queries can be served instantly without
-- hitting the Claude API again. Typically saves 50-70% of LLM costs at scale.
--
-- Run in Supabase SQL Editor.

-- ═══════════════════════════════════════════════════════════════
-- TABLE: query_cache
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS articles.query_cache (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The original user question (verbatim)
    query_text      TEXT NOT NULL,

    -- Embedding of the question (same model/dim as article embeddings)
    query_embedding vector(1024) NOT NULL,

    -- Claude's generated response (the cached answer)
    response_text   TEXT NOT NULL,

    -- Which articles were cited in the response (for provenance)
    article_ids     UUID[] DEFAULT '{}',

    -- Which Claude model generated this response
    model_used      TEXT,

    -- How many times this cache entry has been served
    hit_count       INT DEFAULT 0,

    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),

    -- Auto-expiry (default 30 days; stale medical info should refresh)
    expires_at      TIMESTAMPTZ DEFAULT now() + interval '30 days',

    -- Flexible metadata: tag filters used, user context, child age, etc.
    metadata        JSONB DEFAULT '{}'
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════

-- HNSW index for fast similarity search on cached query embeddings
-- (same params as the article embedding index)
CREATE INDEX IF NOT EXISTS idx_query_cache_embedding
    ON articles.query_cache
    USING hnsw (query_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- B-tree on expires_at for efficient cache cleanup
CREATE INDEX IF NOT EXISTS idx_query_cache_expires
    ON articles.query_cache (expires_at);

-- B-tree on created_at for recency queries
CREATE INDEX IF NOT EXISTS idx_query_cache_created
    ON articles.query_cache (created_at DESC);

-- ═══════════════════════════════════════════════════════════════
-- ROW-LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE articles.query_cache ENABLE ROW LEVEL SECURITY;

-- Service role only — cache is internal infrastructure, not user-facing.
-- The API backend uses the service role key to read/write cache entries.
-- No public or authenticated user should access the cache directly.
CREATE POLICY "Service role full access to query_cache"
    ON articles.query_cache
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════

COMMENT ON TABLE articles.query_cache IS
    'Semantic cache for RAG responses. Stores question embeddings + Claude answers '
    'so near-identical future queries skip the LLM entirely. 30-day TTL by default.';

COMMENT ON COLUMN articles.query_cache.query_embedding IS
    'Qwen3-Embedding-8B vector (1024 dims, Matryoshka truncated). '
    'Used for cosine similarity lookup against incoming queries.';

COMMENT ON COLUMN articles.query_cache.hit_count IS
    'Incremented each time this cache entry serves a response. '
    'Useful for analytics and identifying popular questions.';

COMMENT ON COLUMN articles.query_cache.metadata IS
    'Flexible JSON for contextual filters: tag slugs used, child age range, '
    'life stage, or any other parameters that scoped the original search.';
