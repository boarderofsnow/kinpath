-- Migration 003: Performance indexes
-- SAFETY: Only creates indexes on articles.* tables.

-- Article lookups
CREATE INDEX IF NOT EXISTS idx_articles_doi ON articles.articles(doi);
CREATE INDEX IF NOT EXISTS idx_articles_pmid ON articles.articles(pmid);
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles.articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles.articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_pub_date ON articles.articles(publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_articles_journal ON articles.articles(journal_issn);

-- Array indexes (GIN for keywords & mesh_terms array ops)
CREATE INDEX IF NOT EXISTS idx_articles_keywords ON articles.articles USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_articles_mesh ON articles.articles USING GIN(mesh_terms);

-- Full-text search: generated tsvector column + GIN index
ALTER TABLE articles.articles
    ADD COLUMN IF NOT EXISTS fts tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(abstract, '')), 'B')
    ) STORED;
CREATE INDEX IF NOT EXISTS idx_articles_fts ON articles.articles USING GIN(fts);

-- Vector similarity (HNSW for fast approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_articles_embedding ON articles.articles
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Tag lookups
CREATE INDEX IF NOT EXISTS idx_article_tags_tag ON articles.article_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_article_tags_confidence
    ON articles.article_tags(tag_id, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_tags_category ON articles.tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_parent ON articles.tags(parent_id);

-- Job history
CREATE INDEX IF NOT EXISTS idx_jobs_source ON articles.ingestion_jobs(source_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON articles.ingestion_jobs(status);
