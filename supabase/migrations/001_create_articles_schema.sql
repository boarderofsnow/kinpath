-- Migration 001: Create articles schema + extensions
-- SAFETY: This creates a new schema. Your existing "public" schema is NOT touched.

CREATE SCHEMA IF NOT EXISTS articles;

-- Enable extensions (project-wide, safe to run if already exist)
CREATE EXTENSION IF NOT EXISTS "vector" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
