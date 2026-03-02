-- Migration 004: Row-Level Security policies
-- SAFETY: Only applies to articles.* tables. Your public.* RLS is untouched.

-- Enable RLS on all tables
ALTER TABLE articles.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles.ingestion_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles.scraper_configs ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════
-- PUBLIC READ: Anyone can read verified articles and tags
-- ═══════════════════════════════════════════════════════════════

CREATE POLICY "Public can read verified articles"
    ON articles.articles FOR SELECT
    USING (status = 'verified');

CREATE POLICY "Public can read tags"
    ON articles.tags FOR SELECT
    USING (true);

CREATE POLICY "Public can read article_tags for verified articles"
    ON articles.article_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM articles.articles a
            WHERE a.id = article_id AND a.status = 'verified'
        )
    );

-- ═══════════════════════════════════════════════════════════════
-- ADMIN: Authenticated users with admin role can do everything
-- ═══════════════════════════════════════════════════════════════

-- Helper function to check admin status
CREATE OR REPLACE FUNCTION articles.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can do everything on articles"
    ON articles.articles FOR ALL
    USING (articles.is_admin());

CREATE POLICY "Admins can do everything on tags"
    ON articles.tags FOR ALL
    USING (articles.is_admin());

CREATE POLICY "Admins can do everything on article_tags"
    ON articles.article_tags FOR ALL
    USING (articles.is_admin());

CREATE POLICY "Admins can manage sources"
    ON articles.sources FOR ALL
    USING (articles.is_admin());

CREATE POLICY "Admins can manage credentials"
    ON articles.credentials FOR ALL
    USING (articles.is_admin());

CREATE POLICY "Admins can view jobs"
    ON articles.ingestion_jobs FOR ALL
    USING (articles.is_admin());

CREATE POLICY "Admins can view audit log"
    ON articles.audit_log FOR SELECT
    USING (articles.is_admin());

CREATE POLICY "Admins can manage scraper configs"
    ON articles.scraper_configs FOR ALL
    USING (articles.is_admin());

-- ═══════════════════════════════════════════════════════════════
-- NOTE: Service role key (used by the ingestion worker) bypasses
-- RLS entirely in Supabase. No extra policies needed for workers.
-- ═══════════════════════════════════════════════════════════════
