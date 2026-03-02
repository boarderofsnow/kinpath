"""
Supabase client singleton.
Uses the service_role key for full access (bypasses RLS).
All operations go to the 'articles' schema.
"""

import json
import logging
from supabase import create_client, Client
from src.config import SUPABASE_URL, SUPABASE_SERVICE_KEY

logger = logging.getLogger(__name__)

_client: Client = None


def get_client() -> Client:
    """Get or create the Supabase client (singleton)."""
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        logger.info("Supabase client initialized")
    return _client


def get_source_id(slug: str) -> str:
    """Look up a source by slug, return its UUID."""
    client = get_client()
    result = client.schema("articles").table("sources").select("id").eq("slug", slug).single().execute()
    return result.data["id"]


def get_tag_map() -> dict:
    """Load all tags as {slug: {id, name, category}}."""
    client = get_client()
    result = client.schema("articles").table("tags").select("id, name, slug, category").execute()
    return {t["slug"]: t for t in result.data}


def upsert_article(article_data: dict, source_id: str) -> dict:
    """
    Insert or update an article. Upserts on DOI (unique constraint).
    Returns the upserted record.
    """
    client = get_client()

    record = {
        "source_id": source_id,
        "doi": article_data.get("doi"),
        "pii": article_data.get("pii"),
        "pmid": article_data.get("pmid"),
        "title": article_data["title"],
        "authors": json.dumps(article_data.get("authors", [])),
        "abstract": article_data.get("abstract"),
        "journal_name": article_data.get("journal_name"),
        "journal_issn": article_data.get("journal_issn"),
        "publication_date": article_data.get("publication_date"),
        "volume": article_data.get("volume"),
        "issue": article_data.get("issue"),
        "pages": article_data.get("pages"),
        "url": article_data.get("url"),
        "full_text_url": article_data.get("full_text_url"),
        "keywords": article_data.get("keywords", []),
        "mesh_terms": article_data.get("mesh_terms", []),
        "article_type": article_data.get("article_type"),
        "raw_metadata": article_data.get("raw_metadata", {}),
        "status": "pending",
    }

    # Remove None values — Supabase doesn't like explicit nulls for some types
    record = {k: v for k, v in record.items() if v is not None}

    result = client.schema("articles").table("articles").upsert(
        record,
        on_conflict="doi"
    ).execute()

    return result.data[0] if result.data else {}


def upsert_article_tag(article_id: str, tag_id: str, confidence: float, source: str):
    """Insert or update an article-tag assignment."""
    client = get_client()
    client.schema("articles").table("article_tags").upsert(
        {
            "article_id": article_id,
            "tag_id": tag_id,
            "confidence": confidence,
            "source": source,
        },
        on_conflict="article_id,tag_id"
    ).execute()


def update_article_status(article_id: str, status: str):
    """Update the status of an article."""
    client = get_client()
    client.schema("articles").table("articles").update(
        {"status": status, "updated_at": "now()"}
    ).eq("id", article_id).execute()


def create_ingestion_job(source_id: str, job_type: str = "incremental") -> str:
    """Create a new ingestion job record, return its ID."""
    client = get_client()
    result = client.schema("articles").table("ingestion_jobs").insert({
        "source_id": source_id,
        "status": "running",
        "job_type": job_type,
        "started_at": "now()",
    }).execute()
    return result.data[0]["id"]


def update_ingestion_job(job_id: str, **kwargs):
    """Update an ingestion job (status, counts, errors, etc.)."""
    client = get_client()
    client.schema("articles").table("ingestion_jobs").update(kwargs).eq("id", job_id).execute()


def get_credential(source_slug: str, label: str) -> str:
    """
    Get an encrypted credential value from the DB.
    The caller is responsible for decrypting it.
    """
    client = get_client()
    source_id = get_source_id(source_slug)
    result = client.schema("articles").table("credentials").select(
        "encrypted_value"
    ).eq("source_id", source_id).eq("label", label).eq("is_active", True).single().execute()
    return result.data["encrypted_value"]
