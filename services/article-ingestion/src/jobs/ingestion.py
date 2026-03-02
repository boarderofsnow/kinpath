"""
Main ingestion pipeline: fetch → upsert → tag → update job.
Orchestrates the full flow from PubMed to Supabase.
"""

import logging
import json
from datetime import datetime

from src.db import (
    get_client, get_source_id, get_tag_map,
    upsert_article, upsert_article_tag, update_article_status,
    create_ingestion_job, update_ingestion_job, get_credential,
)
from src.adapters.pubmed import PubMedAdapter
from src.taggers.keyword_mapper import build_search_text, match_keywords, match_mesh_terms
from src.taggers.llm_tagger import classify_article, is_available as llm_available
from src.utils.crypto import decrypt
from src.config import TAGGING_MODE

logger = logging.getLogger(__name__)


def run_ingestion(job_type: str = "incremental"):
    """
    Run a full ingestion cycle:
    1. Fetch articles from PubMed
    2. Upsert into Supabase
    3. Auto-tag (L1 + L2 + optional L3)
    4. Update job record
    """
    logger.info(f"Starting {job_type} ingestion run")

    # Get source config
    source_id = get_source_id("pubmed-ncbi")

    # Create job record
    job_id = create_ingestion_job(source_id, job_type)
    logger.info(f"Created ingestion job: {job_id}")

    try:
        # Get API key from encrypted credentials
        try:
            encrypted_key = get_credential("pubmed-ncbi", "NCBI API Key")
            ncbi_api_key = decrypt(encrypted_key)
        except Exception as e:
            logger.warning(f"No NCBI credential found in DB, running without API key: {e}")
            ncbi_api_key = ""

        # Initialize adapter
        adapter = PubMedAdapter(api_key=ncbi_api_key)

        # Get source config from DB
        client = get_client()
        source_result = client.schema("articles").table("sources").select(
            "config"
        ).eq("id", source_id).single().execute()
        source_config = source_result.data.get("config", {})

        # Fetch articles
        logger.info("Fetching articles from PubMed...")
        articles = adapter.fetch_articles(source_config)
        logger.info(f"Fetched {len(articles)} articles")

        update_ingestion_job(job_id, articles_found=len(articles))

        # Upsert and tag
        tag_map = get_tag_map()
        new_count = 0
        updated_count = 0
        errors = []

        for i, article_data in enumerate(articles):
            try:
                result = upsert_article(article_data, source_id)
                article_id = result.get("id")
                if not article_id:
                    continue

                # Was this a new insert or an update?
                # (Supabase upsert doesn't distinguish, so we count all)
                new_count += 1

                # Auto-tag
                _tag_article(article_id, article_data, tag_map)

                if (i + 1) % 100 == 0:
                    logger.info(f"  Processed {i+1}/{len(articles)} articles")

            except Exception as e:
                errors.append({"pmid": article_data.get("pmid"), "error": str(e)})
                logger.error(f"Error processing article {article_data.get('pmid')}: {e}")

        # Update job as complete
        update_ingestion_job(
            job_id,
            status="completed",
            articles_new=new_count,
            articles_updated=updated_count,
            errors=json.dumps(errors) if errors else "[]",
            completed_at=datetime.utcnow().isoformat(),
        )

        logger.info(f"Ingestion complete: {new_count} articles processed, {len(errors)} errors")
        return {"job_id": job_id, "articles": new_count, "errors": len(errors)}

    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        update_ingestion_job(
            job_id,
            status="failed",
            errors=json.dumps([{"error": str(e)}]),
            completed_at=datetime.utcnow().isoformat(),
        )
        raise


def _tag_article(article_id: str, article_data: dict, tag_map: dict):
    """Run the 3-layer tagging pipeline on a single article."""
    all_tags = {}

    # Layer 1: Keyword matching
    text = build_search_text(article_data)
    l1_matches = match_keywords(text)
    for slug, conf in l1_matches:
        if slug in tag_map:
            all_tags[slug] = (conf, "auto_keyword")

    # Layer 2: MeSH mapping
    l2_matches = match_mesh_terms(article_data)
    for slug, conf in l2_matches:
        if slug in tag_map:
            if slug not in all_tags or conf > all_tags[slug][0]:
                all_tags[slug] = (conf, "auto_mesh")

    # Layer 3: LLM fallback (only if under-tagged)
    if llm_available() and len(all_tags) < 2:
        l3_matches = classify_article(
            article_data.get("title", ""),
            article_data.get("abstract", ""),
        )
        for slug, conf in l3_matches:
            if slug in tag_map and slug not in all_tags:
                all_tags[slug] = (conf, "auto_llm")

    # Write tags to Supabase
    for slug, (conf, source) in all_tags.items():
        tag_id = tag_map[slug]["id"]
        upsert_article_tag(article_id, tag_id, conf, source)

    # Update article status
    if all_tags:
        update_article_status(article_id, "auto_tagged")
