"""
Configuration — loads from .env files or environment variables.
On Railway, env vars are injected automatically.
Locally, reads from supabase-deployment.env in the project root.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# ─── Load .env files ─────────────────────────────────────────────
# Walk up from this file to find supabase-deployment.env or .env
_this_dir = Path(__file__).resolve().parent
_project_root = _this_dir.parent  # services/article-ingestion/

# Try loading from multiple possible locations
for env_file in [
    _project_root / ".env",
    _project_root / "supabase-deployment.env",
    _project_root.parent.parent / "supabase-deployment.env",  # kinpath root
]:
    if env_file.exists():
        load_dotenv(env_file, override=True)

# ─── Supabase ────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# ─── Encryption ──────────────────────────────────────────────────
ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY", "")

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
DATE_RANGE = "1900/01/01:2026/12/31"
