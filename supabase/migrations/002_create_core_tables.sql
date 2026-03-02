-- Migration 002: Core tables in articles schema
-- SAFETY: All tables are in the "articles" schema. Nothing in "public" is touched.

-- Sources: where articles come from (PubMed, Elsevier, etc.)
CREATE TABLE IF NOT EXISTS articles.sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    slug            TEXT NOT NULL UNIQUE,
    base_url        TEXT NOT NULL,
    source_type     TEXT NOT NULL CHECK (source_type IN ('api', 'scraper', 'bulk')),
    config          JSONB DEFAULT '{}'::jsonb,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Encrypted credential storage
CREATE TABLE IF NOT EXISTS articles.credentials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID REFERENCES articles.sources(id) ON DELETE CASCADE,
    label           TEXT NOT NULL,
    credential_type TEXT NOT NULL CHECK (credential_type IN (
                      'api_key', 'oauth_token', 'session_cookie', 'username_password'
                    )),
    encrypted_value TEXT NOT NULL,
    metadata        JSONB DEFAULT '{}'::jsonb,
    expires_at      TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Main articles table
CREATE TABLE IF NOT EXISTS articles.articles (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id         UUID REFERENCES articles.sources(id),
    doi               TEXT UNIQUE,
    pii               TEXT,
    pmid              TEXT,
    title             TEXT NOT NULL,
    authors           JSONB DEFAULT '[]'::jsonb,
    abstract          TEXT,
    journal_name      TEXT,
    journal_issn      TEXT,
    publication_date  DATE,
    volume            TEXT,
    issue             TEXT,
    pages             TEXT,
    url               TEXT,
    full_text_url     TEXT,
    license           TEXT,
    keywords          TEXT[] DEFAULT '{}',
    mesh_terms        TEXT[] DEFAULT '{}',
    article_type      TEXT,
    raw_metadata      JSONB DEFAULT '{}'::jsonb,
    embedding         vector(1536),
    status            TEXT DEFAULT 'pending' CHECK (status IN (
                        'pending', 'auto_tagged', 'verified', 'rejected', 'archived'
                      )),
    ingested_at       TIMESTAMPTZ DEFAULT now(),
    verified_at       TIMESTAMPTZ,
    verified_by       UUID,
    updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Tag taxonomy
CREATE TABLE IF NOT EXISTS articles.tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    category    TEXT CHECK (category IN (
                  'life_stage', 'condition', 'topic', 'specialty', 'evidence_level'
                )),
    parent_id   UUID REFERENCES articles.tags(id),
    description TEXT,
    sort_order  INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Many-to-many: articles <-> tags
CREATE TABLE IF NOT EXISTS articles.article_tags (
    article_id  UUID REFERENCES articles.articles(id) ON DELETE CASCADE,
    tag_id      UUID REFERENCES articles.tags(id) ON DELETE CASCADE,
    confidence  FLOAT DEFAULT 1.0,
    source      TEXT DEFAULT 'manual' CHECK (source IN (
                  'auto_keyword', 'auto_mesh', 'auto_rules', 'auto_llm', 'manual'
                )),
    created_by  UUID,
    created_at  TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (article_id, tag_id)
);

-- Ingestion job tracking
CREATE TABLE IF NOT EXISTS articles.ingestion_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id       UUID REFERENCES articles.sources(id),
    status          TEXT DEFAULT 'queued' CHECK (status IN (
                      'queued', 'running', 'completed', 'failed', 'cancelled'
                    )),
    job_type        TEXT DEFAULT 'incremental' CHECK (job_type IN (
                      'incremental', 'full', 'backfill', 'reprocess'
                    )),
    config_snapshot JSONB DEFAULT '{}'::jsonb,
    articles_found  INT DEFAULT 0,
    articles_new    INT DEFAULT 0,
    articles_updated INT DEFAULT 0,
    errors          JSONB DEFAULT '[]'::jsonb,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Admin audit trail
CREATE TABLE IF NOT EXISTS articles.audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID,
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   UUID,
    old_value   JSONB,
    new_value   JSONB,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Scraper configuration
CREATE TABLE IF NOT EXISTS articles.scraper_configs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id   UUID REFERENCES articles.sources(id) ON DELETE CASCADE,
    version     INT DEFAULT 1,
    config      JSONB NOT NULL,
    is_active   BOOLEAN DEFAULT true,
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    created_by  UUID
);
