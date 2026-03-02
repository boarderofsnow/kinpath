-- Migration 006: Change embedding column from vector(1536) to vector(1024)
-- Required for BAAI/bge-large-en-v1.5 which outputs 1024-dimensional vectors.
-- Run this in the Supabase SQL Editor before using the local embedder tool.

-- Step 1: Drop the existing HNSW index (cannot alter column type with index present)
DROP INDEX IF EXISTS articles.idx_articles_embedding;

-- Step 2: Alter the column dimension
ALTER TABLE articles.articles
  ALTER COLUMN embedding TYPE vector(1024);

-- Step 3: Recreate the HNSW index for 1024-dimensional vectors
CREATE INDEX idx_articles_embedding
  ON articles.articles
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
