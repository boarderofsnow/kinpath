#!/usr/bin/env python3
"""
One-time setup script: encrypt and store API credentials in Supabase.
Run this AFTER migrations are applied.

Usage:
    python setup_credentials.py

Automatically loads values from supabase-deployment.env (looks in
current directory, parent directories, and the repo root).
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure we can import from src/
_script_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(_script_dir))

# ─── Auto-load .env files ────────────────────────────────────────
# Search for supabase-deployment.env walking up from this script
_found_env = False
for search_dir in [_script_dir, _script_dir.parent, _script_dir.parent.parent,
                   _script_dir.parent.parent.parent]:
    for fname in ["supabase-deployment.env", ".env"]:
        env_file = search_dir / fname
        if env_file.exists():
            print(f"Loading config from: {env_file}")
            load_dotenv(str(env_file), override=True)
            _found_env = True
            break
    if _found_env:
        break

if not _found_env:
    print("WARNING: No .env or supabase-deployment.env found.")
    print("  Place supabase-deployment.env in the repo root or set env vars manually.")

# Now import src modules (they read from os.environ, which dotenv just populated)
from src.db import get_client, get_source_id
from src.utils.crypto import encrypt


def store_credential(source_slug: str, label: str, value: str, cred_type: str = "api_key"):
    """Encrypt and store a credential."""
    if not value or value in ("YOUR_VALUE_HERE", "later", "N/A", ""):
        print(f"  SKIP: {label} (no value provided)")
        return

    client = get_client()
    source_id = get_source_id(source_slug)
    encrypted = encrypt(value)

    # Upsert: if label already exists for this source, update it
    client.schema("articles").table("credentials").upsert(
        {
            "source_id": source_id,
            "label": label,
            "credential_type": cred_type,
            "encrypted_value": encrypted,
            "is_active": True,
        },
        on_conflict="source_id,label",
    ).execute()

    print(f"  STORED: {label} for {source_slug} (encrypted, {len(encrypted)} chars)")


def main():
    print("=" * 60)
    print("  Credential Setup — Encrypting & Storing API Keys")
    print("=" * 60)
    print()

    # Verify critical config is loaded
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    enc = os.getenv("ENCRYPTION_KEY", "")

    if not url or not key or not enc:
        print("ERROR: Missing required config values:")
        if not url: print("  - SUPABASE_URL not set")
        if not key: print("  - SUPABASE_SERVICE_KEY not set")
        if not enc: print("  - ENCRYPTION_KEY not set")
        print()
        print("Make sure supabase-deployment.env is filled in and accessible.")
        sys.exit(1)

    print(f"  Supabase URL: {url[:40]}...")
    print(f"  Service key:  {key[:20]}...")
    print(f"  Encryption:   {enc[:10]}...")
    print()

    # Read API keys from environment
    ncbi_key = os.getenv("NCBI_API_KEY", "")
    elsevier_key = os.getenv("ELSEVIER_API_KEY", "")
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "")
    hf_token = os.getenv("HF_TOKEN", "")

    print("Storing PubMed credentials...")
    store_credential("pubmed-ncbi", "NCBI API Key", ncbi_key)

    print("Storing Elsevier credentials...")
    store_credential("elsevier-sciencedirect", "Elsevier API Key", elsevier_key)

    print("Storing Anthropic credentials...")
    store_credential("pubmed-ncbi", "Anthropic API Key", anthropic_key)

    print("Storing HuggingFace credentials...")
    store_credential("pubmed-ncbi", "HuggingFace Token", hf_token)

    print()
    print("Done! Credentials are encrypted and stored in articles.credentials.")
    print("The ingestion worker will decrypt them at runtime using ENCRYPTION_KEY.")
    print()
    print("IMPORTANT: You can now REMOVE these API keys from your .env file.")
    print("           Only SUPABASE_URL, SUPABASE_SERVICE_KEY, and ENCRYPTION_KEY")
    print("           need to remain as environment variables.")


if __name__ == "__main__":
    main()
