"""
Layer 3: Claude LLM-based article classification.
Only invoked for articles with fewer than 2 tags after L1+L2.
"""

import json
import logging
from typing import List, Tuple
from src.config import ANTHROPIC_API_KEY, CLAUDE_MODEL, TAGGING_MODE

logger = logging.getLogger(__name__)

_client = None


def is_available() -> bool:
    """Check if LLM tagging is configured and available."""
    return bool(ANTHROPIC_API_KEY) and TAGGING_MODE == "full"


def _get_client():
    global _client
    if _client is None:
        try:
            import anthropic
            _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        except ImportError:
            logger.error("anthropic package not installed")
            return None
    return _client


TAG_LIST = """
Life Stages: pre-conception, pregnancy, first-trimester, second-trimester, third-trimester, labor-delivery, postpartum, newborn, infant, toddler, preschool, school-age
Topics: nutrition, vaccinations, maternal-mental-health, pediatric-mental-health, developmental-milestones, sleep, breastfeeding, safety, growth, prenatal-care, fetal-development, speech-language, behavioral-health, childhood-obesity
Conditions: gestational-diabetes, preeclampsia, genetic-screening, allergies-asthma, infectious-disease, nicu-prematurity
Evidence: systematic-review, rct, cohort-study, case-control, clinical-guidelines, case-report, expert-opinion
"""

CLASSIFY_PROMPT = f"""You are a medical research classifier. Given an article title and abstract, classify it into the appropriate tags from this taxonomy. Return ONLY valid tag slugs with confidence scores (0.0-1.0).

Available tags:
{TAG_LIST}

Return a JSON array of objects: [{{"slug": "tag-slug", "confidence": 0.85}}]
Only include tags with confidence >= 0.70. Return 1-5 tags maximum.
Return ONLY the JSON array, no other text."""


def classify_article(title: str, abstract: str) -> List[Tuple[str, float]]:
    """
    Classify an article using Claude.
    Returns list of (tag_slug, confidence) tuples.
    """
    if not is_available():
        return []

    client = _get_client()
    if not client:
        return []

    try:
        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=512,
            messages=[{
                "role": "user",
                "content": f"{CLASSIFY_PROMPT}\n\nTitle: {title}\n\nAbstract: {abstract[:2000] if abstract else 'No abstract available'}"
            }],
        )

        response_text = message.content[0].text.strip()

        # Parse JSON response
        if response_text.startswith("["):
            results = json.loads(response_text)
        else:
            # Try to extract JSON from response
            import re
            match = re.search(r'\[.*\]', response_text, re.DOTALL)
            if match:
                results = json.loads(match.group())
            else:
                return []

        tags = []
        for item in results:
            slug = item.get("slug", "")
            conf = float(item.get("confidence", 0.0))
            if slug and conf >= 0.70:
                tags.append((slug, min(conf, 0.90)))  # Cap at 0.90 for LLM

        return tags

    except Exception as e:
        logger.warning(f"LLM tagging failed: {e}")
        return []
