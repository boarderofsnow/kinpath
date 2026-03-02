"""
Main ingestion pipeline: fetch → upsert → tag → update job.
Orchestrates the full flow from PubMed to Supabase.

Incremental runs (the default 3 AM cron) look up the last successful
job's start time and only fetch articles published since then, with
a 7-day overlap to catch late-indexed papers.  Backfill runs fetch
the entire configured date range.
"""

import logging
import json
from datetime import datetime, timedelta

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

# How many days of overlap to keep when running incrementally.
# PubMed can be slow to index some articles, so a 7-day buffer
# ensures we don't miss anything.  Duplicates are harmless thanks
# to the DOI-based upsert.
INCREMENTAL_OVERLAP_DAYS = 7


def _get_last_successful_job_time(source_id: str):
    """
    Look up the started_at timestamp of the most recent completed
    ingestion job for this source.  Returns a datetime or None.
    """
    try:
        client = get_client()
        result = (
            client.schema("articles")
            .table("ingestion_jobs")
            .select("started_at")
            .eq("source_id", source_id)
            .eq("status", "completed")
            .order("started_at", desc=True)
            .limit(1)
            .execute()
        )
        if result.data:
            ts = result.data[0]["started_at"]
            # Handle both ISO formats (with/without timezone)
            for fmt in ("%Y-%m-%dT%H:%M:%S.%f%z", "%Y-%m-%dT%H:%M:%S%z",
                        "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"):
                try:
                    return datetime.strptime(ts.replace("+00:00", "").replace("Z", ""), fmt.replace("%z", ""))
                except ValueError:
                    continue
            logger.warning(f"Could not parse last job timestamp: {ts}")
    except Exception as e:
        logger.warning(f"Could not look up last job time: {e}")
    return None


def run_ingestion(job_type: str = "incremental"):
    """
    Run a full ingestion cycle:
    1. Fetch articles from PubMed (incrementally if possible)
    2. Upsert into Supabase
    3. Auto-tag (L1 + L2 + optional L3)
    4. Update job record

    job_type:
      "incremental" — fetch only articles since last successful run
                      (minus a 7-day overlap for late indexing).
      "backfill"    — fetch the full configured date range.
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

        # Determine the "since" date for incremental runs
        since = None
        if job_type == "incremental":
            last_run = _get_last_successful_job_time(source_id)
            if last_run:
                since = last_run - timedelta(days=INCREMENTAL_OVERLAP_DAYS)
                logger.info(f"Last successful run: {last_run.isoformat()}.  "
                            f"Fetching since {since.strftime('%Y-%m-%d')} "
                            f"({INCREMENTAL_OVERLAP_DAYS}-day overlap)")
            else:
                logger.info("No previous successful job found — running full backfill this time")

        # Fetch articles
        logger.info("Fetching articles from PubMed...")
        articles = adapter.fetch_articles(source_config, since=since)
        logger.info(f"Fetched {len(articles)} articles")

        update_ingestion_job(job_id, articles_found=len(articles))

        # Upsert and tag
        tag_map = get_tag_map()
        new_count = 0
        skipped_count = 0
        errors = []

        for i, article_data in enumerate(articles):
            try:
                result = upsert_article(article_data, source_id)
                article_id = result.get("id")
                if not article_id:
                    continue

                # Skip tagging if article is already tagged/verified/etc.
                # Only tag articles that are still "pending" (newly inserted
                # or never successfully tagged).  This avoids redundant L3
                # API calls and DB writes for articles in the overlap window.
                article_status = result.get("status", "pending")
                if article_status != "pending":
                    skipped_count += 1
                    continue

                new_count += 1

                # Auto-tag (only pending articles reach here)
                _tag_article(article_id, article_data, tag_map)

                if (i + 1) % 100 == 0:
                    logger.info(f"  Processed {i+1}/{len(articles)} articles "
                                f"({skipped_count} already tagged, skipped)")

            except Exception as e:
                errors.append({"pmid": article_data.get("pmid"), "error": str(e)})
                logger.error(f"Error processing article {article_data.get('pmid')}: {e}")

        # Update job as complete
        update_ingestion_job(
            job_id,
            status="completed",
            articles_found=len(articles),
            articles_new=new_count,
            articles_updated=skipped_count,
            errors=json.dumps(errors) if errors else "[]",
            completed_at=datetime.utcnow().isoformat(),
        )

        logger.info(f"Ingestion complete: {len(articles)} fetched, "
                     f"{new_count} new/tagged, {skipped_count} already tagged (skipped), "
                     f"{len(errors)} errors")
        return {"job_id": job_id, "articles": new_count,
                "skipped": skipped_count, "errors": len(errors)}

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
