"""
Configuration — loads from environment variables (Railway injects these).
Source-specific API keys (Elsevier, NCBI) are stored encrypted in
articles.credentials and decrypted at runtime — NOT from env vars.
"""

import os
from pathlib import Path

# ─── Supabase ────────────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

# ─── Encryption ──────────────────────────────────────────────────
ENCRYPTION_KEY = os.environ["ENCRYPTION_KEY"]

# ─── Worker Settings ─────────────────────────────────────────────
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
CRON_SCHEDULE = os.getenv("CRON_SCHEDULE", "0 3 * * *")
TIMEZONE = os.getenv("TIMEZONE", "America/Chicago")

# ─── Anthropic (for Layer 3 LLM tagging) ─────────────────────────
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-haiku-4-5-20251001")
TAGGING_MODE = os.getenv("TAGGING_MODE", "full")  # "full" or "local"

# ─── PubMed Settings ─────────────────────────────────────────────
PUBMED_ESEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_EFETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
PUBMED_BATCH_SIZE = 50
MAX_RETRIES = 3
RETRY_BACKOFF = 2.0

# ─── Journals ────────────────────────────────────────────────────
JOURNALS = {
    "AJOG": {
        "query": '"Am J Obstet Gynecol"[Journal]',
        "issn": "0002-9378",
    },
    "AJOG MFM": {
        "query": '"Am J Obstet Gynecol MFM"[Journal]',
        "issn": "2589-9333",
    },
}

SEARCH_TERMS = "(pregnancy OR prenatal OR pediatric OR neonatal)"
DATE_RANGE = "1990/01/01:2030/12/31"
