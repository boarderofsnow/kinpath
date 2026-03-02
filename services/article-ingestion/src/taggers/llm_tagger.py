"""
Layer 3: Claude LLM-based article classification.
Only invoked for articles with fewer than 2 tags after L1+L2.
Updated for 9-dimension taxonomy.
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


TAG_TAXONOMY = """
DIMENSION: life_stage
  pre-conception, pregnancy, first-trimester, second-trimester, third-trimester,
  high-risk-pregnancy, labor-delivery, postpartum, postpartum-recovery,
  fourth-trimester, newborn, infant, toddler, preschool, school-age, tween,
  adolescent, maternal-health, paternal-health, family-system, caregiver-wellness

DIMENSION: topic
  breastfeeding, formula-feeding, pumping, solids-introduction, maternal-nutrition,
  pediatric-nutrition, feeding-difficulties, sleep-safety, sleep-training,
  sleep-environment, gross-motor, fine-motor, cognitive-development, speech-language,
  social-emotional, adaptive-skills, developmental-screening, behavioral-health,
  tantrums-discipline, potty-training, school-readiness, screen-time, vaccinations,
  dental-health, skin-care, growth-monitoring, vision-hearing, exercise-activity,
  perinatal-mood-disorders, prenatal-mental-health, paternal-mental-health,
  infant-mental-health, child-mental-health, adolescent-mental-health, grief-loss,
  relationship-wellness, prenatal-care, fetal-development, birth-planning,
  injury-prevention, environmental-health, childcare, travel, education-schooling

DIMENSION: condition
  gestational-diabetes, preeclampsia, placenta-disorders, hyperemesis,
  pregnancy-complications, cholestasis, gestational-hypertension, morning-sickness,
  iugr-growth-restriction, postpartum-hemorrhage, postpartum-infection,
  pelvic-floor-dysfunction, jaundice, reflux-colic, tongue-lip-tie,
  nicu-prematurity, congenital-conditions, newborn-skin, umbilical-cord-issues,
  plagiocephaly, hip-dysplasia, allergies-asthma, infectious-disease,
  fever-illness, ear-infections, rashes-skin-conditions, gi-issues,
  uti-infections, chronic-conditions, genetic-screening, autism-spectrum, adhd,
  learning-disabilities, sensory-processing, speech-delay, cerebral-palsy,
  down-syndrome, intellectual-disability, pain-management, disability-special-needs,
  emergency-first-aid, surgery-procedures, mental-health-crisis

DIMENSION: intent
  prevention, screening, diagnosis, treatment, monitoring, what-to-expect,
  decision-support, safety-guidance

DIMENSION: approach
  natural-unmedicated, water-birth, home-birth, birth-center, hospital-birth,
  medicated-birth, cesarean-birth, vbac, midwifery-model, doula-supported,
  hypnobirthing, bradley-method, lamaze, exclusive-breastfeeding, exclusive-pumping,
  combination-feeding, exclusive-formula, baby-led-weaning, traditional-weaning,
  attachment-parenting, gentle-parenting, montessori-parenting, rie-parenting,
  structured-parenting, free-range-parenting, conventional-medicine,
  integrative-complementary, minimal-intervention

DIMENSION: care_level
  emergency, urgent-care, routine-medical, self-care, wellness

DIMENSION: evidence_level
  systematic-review, rct, cohort-study, case-control, clinical-guidelines,
  case-report, expert-opinion

DIMENSION: audience
  parent-friendly, clinical, research

DIMENSION: cultural
  faith-based-perspective, cultural-birth-practice, cultural-feeding,
  circumcision-decision, end-of-life-decisions, fertility-ethics,
  vaccine-hesitancy, lgbtq-family
"""

CLASSIFY_PROMPT = f"""You are a medical research classifier for a parent-facing health app. Given an article title and abstract, classify it into the appropriate tags from this multi-dimensional taxonomy. Return tags from EACH relevant dimension.

TAXONOMY:
{TAG_TAXONOMY}

Return a JSON object with dimension keys. Each value is an array of {{"slug": "tag-slug", "confidence": 0.85}} objects.

Example response:
{{
  "life_stage": [{{"slug": "infant", "confidence": 0.95}}],
  "topic": [{{"slug": "sleep-safety", "confidence": 0.90}}],
  "condition": [],
  "intent": [{{"slug": "clinical-guidelines", "confidence": 0.85}}],
  "approach": [],
  "care_level": [{{"slug": "self-care", "confidence": 0.70}}],
  "evidence_level": [{{"slug": "systematic-review", "confidence": 0.95}}],
  "audience": [{{"slug": "clinical", "confidence": 0.80}}],
  "cultural": []
}}

Rules:
- Include 1-3 tags per dimension. Leave empty array if dimension doesn't apply.
- Only include tags with confidence >= 0.70.
- For evidence_level, classify based on study design described in the text.
- For audience, assess language complexity and target reader.
- For care_level, assess whether the article discusses emergencies, urgent situations, routine care, or general wellness.
- For intent, consider what question this article answers (prevention, screening, treatment, etc.).
- Return ONLY the JSON object, no other text."""


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
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": f"{CLASSIFY_PROMPT}\n\nTitle: {title}\n\nAbstract: {abstract[:2000] if abstract else 'No abstract available'}"
            }],
        )

        response_text = message.content[0].text.strip()

        # Parse JSON response — could be flat array (legacy) or dimension-keyed object (new)
        parsed = None
        if response_text.startswith("{"):
            parsed = json.loads(response_text)
        elif response_text.startswith("["):
            # Legacy flat array format — still accept it
            parsed = {"_flat": json.loads(response_text)}
        else:
            # Try to extract JSON from response
            import re
            match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if match:
                parsed = json.loads(match.group())
            else:
                match = re.search(r'\[.*\]', response_text, re.DOTALL)
                if match:
                    parsed = {"_flat": json.loads(match.group())}

        if not parsed:
            return []

        # Flatten dimension-keyed object into (slug, confidence) list
        tags = []
        for dimension, items in parsed.items():
            if not isinstance(items, list):
                continue
            for item in items:
                slug = item.get("slug", "")
                conf = float(item.get("confidence", 0.0))
                if slug and conf >= 0.70:
                    tags.append((slug, min(conf, 0.90)))  # Cap at 0.90 for LLM

        return tags

    except Exception as e:
        logger.warning(f"LLM tagging failed: {e}")
        return []
