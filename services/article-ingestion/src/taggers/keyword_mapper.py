"""
Layer 1: Keyword/regex pattern matching.
Layer 2: MeSH descriptor mapping.
Ported from the local platform's tagging/layer1_keyword.py + layer2_mesh.py.
Combined into a single module for the production worker.
"""

import re
from typing import List, Tuple

# ═══════════════════════════════════════════════════════════════
# LAYER 1: Keyword regex patterns → tag slugs
# Each rule: (compiled_regex, tag_slug, confidence)
# ═══════════════════════════════════════════════════════════════

_KEYWORD_RULES = [
    # Life stages
    (r"(?i)\b(pre-?concept|infertil|IVF|in.vitro|fertil|ovulat|sperm)\b", "pre-conception", 0.85),
    (r"(?i)\b(pregnan|gestat|antenat|maternal)\b", "pregnancy", 0.80),
    (r"(?i)\b(first.trimester|trimester.1|weeks?\s*[4-9]\b|weeks?\s*1[0-3]\b)", "first-trimester", 0.85),
    (r"(?i)\b(second.trimester|trimester.2|weeks?\s*1[4-9]\b|weeks?\s*2[0-7]\b)", "second-trimester", 0.85),
    (r"(?i)\b(third.trimester|trimester.3|weeks?\s*2[8-9]\b|weeks?\s*3\d\b|weeks?\s*40\b)", "third-trimester", 0.85),
    (r"(?i)\b(labor|deliver|birth|intrapart|cesare|c-section|vaginal.deliver|induc)", "labor-delivery", 0.85),
    (r"(?i)\b(postpartum|postnatal|puerper|fourth.trimester)", "postpartum", 0.85),
    (r"(?i)\b(newborn|neonat|NICU)", "newborn", 0.85),
    (r"(?i)\b(infant|infancy)", "infant", 0.80),
    (r"(?i)\b(toddler)", "toddler", 0.80),
    (r"(?i)\b(preschool|pre-school)", "preschool", 0.80),
    (r"(?i)\b(school.age|school-age|elementary)", "school-age", 0.80),

    # Topics
    (r"(?i)\b(nutrition|diet|vitamin|folate|folic|micronutr|supplement|iron.defic)", "nutrition", 0.85),
    (r"(?i)\b(vaccin|immuniz|inoculat)", "vaccinations", 0.85),
    (r"(?i)\b(maternal.mental|perinatal.mood|postpartum.depress|prenatal.depress|maternal.anxi)", "maternal-mental-health", 0.85),
    (r"(?i)\b(child.psych|pediatric.mental|pediatric.psych|child.mental)", "pediatric-mental-health", 0.85),
    (r"(?i)\b(milestone|developmental.delay|motor.develop|cognitive.develop)", "developmental-milestones", 0.85),
    (r"(?i)\b(sleep|insomnia|circadian|SIDS|cosleep|co-sleep)", "sleep", 0.85),
    (r"(?i)\b(breastfeed|lactation|human.milk|breast.milk)", "breastfeeding", 0.85),
    (r"(?i)\b(safety|injury.prevent|childproof|car.seat|poison|drown)", "safety", 0.85),
    (r"(?i)\b(growth.chart|anthropometr|percentile|BMI.child|height.weight)", "growth", 0.85),
    (r"(?i)\b(prenatal.care|prenatal.visit|antenatal.care|prenatal.screen)", "prenatal-care", 0.85),
    (r"(?i)\b(fetal.develop|embryo|organogen|fetal.growth|intrauterin)", "fetal-development", 0.85),
    (r"(?i)\b(speech|language.develop|stutter|aphasia|communication.disorder)", "speech-language", 0.85),
    (r"(?i)\b(ADHD|autism|ASD|conduct.disorder|behavioral)", "behavioral-health", 0.85),
    (r"(?i)\b(childhood.obes|pediatric.obes|child.obes|overweight.child)", "childhood-obesity", 0.85),

    # Conditions
    (r"(?i)\b(gestational.diabet|GDM|glucose.toleran)", "gestational-diabetes", 0.90),
    (r"(?i)\b(pre-?eclamps|eclamps|HELLP|hypertens.pregn)", "preeclampsia", 0.90),
    (r"(?i)\b(genetic.screen|NIPT|amniocentesis|karyotype|chromosom|Down.syndrome|trisomy)", "genetic-screening", 0.85),
    (r"(?i)\b(allerg|asthma|atop|anaphyla|eczema.child)", "allergies-asthma", 0.85),
    (r"(?i)\b(infect|viral|bacterial|sepsis|RSV|COVID|influenza|CMV|Zika|Group.B.Strep)", "infectious-disease", 0.85),
    (r"(?i)\b(NICU|prematur|preterm|very.low.birth|extremely.low.birth|neonatal.intensive)", "nicu-prematurity", 0.90),

    # Evidence levels
    (r"(?i)\b(systematic.review|meta-analysis|meta.analysis)\b", "systematic-review", 0.95),
    (r"(?i)\b(randomized.controlled|randomised.controlled|RCT)\b", "rct", 0.95),
    (r"(?i)\b(cohort.study|prospective.study|longitudinal.study)\b", "cohort-study", 0.90),
    (r"(?i)\b(case-control|case.control)\b", "case-control", 0.90),
    (r"(?i)\b(guideline|practice.bulletin|recommendation|consensus.statement)\b", "clinical-guidelines", 0.90),
    (r"(?i)\b(case.report|case.series)\b", "case-report", 0.85),
    (r"(?i)\b(editorial|expert.opinion|commentary|letter.to.editor)\b", "expert-opinion", 0.80),
]

# Pre-compile
_COMPILED_RULES = [(re.compile(pattern), slug, conf) for pattern, slug, conf in _KEYWORD_RULES]


# ═══════════════════════════════════════════════════════════════
# LAYER 2: MeSH descriptor → tag slug mapping
# ═══════════════════════════════════════════════════════════════

_MESH_MAP = {
    # Life stages
    "Pregnancy": "pregnancy",
    "Pregnancy Trimester, First": "first-trimester",
    "Pregnancy Trimester, Second": "second-trimester",
    "Pregnancy Trimester, Third": "third-trimester",
    "Labor, Obstetric": "labor-delivery",
    "Delivery, Obstetric": "labor-delivery",
    "Cesarean Section": "labor-delivery",
    "Postpartum Period": "postpartum",
    "Infant, Newborn": "newborn",
    "Infant": "infant",
    "Fertility": "pre-conception",
    "Fertilization in Vitro": "pre-conception",
    "Infertility": "pre-conception",

    # Topics
    "Diet": "nutrition",
    "Nutrition Assessment": "nutrition",
    "Folic Acid": "nutrition",
    "Micronutrients": "nutrition",
    "Vaccination": "vaccinations",
    "Immunization": "vaccinations",
    "Depression, Postpartum": "maternal-mental-health",
    "Anxiety Disorders": "maternal-mental-health",
    "Child Development": "developmental-milestones",
    "Sleep": "sleep",
    "Sudden Infant Death": "sleep",
    "Breast Feeding": "breastfeeding",
    "Milk, Human": "breastfeeding",
    "Lactation": "breastfeeding",
    "Prenatal Care": "prenatal-care",
    "Fetal Development": "fetal-development",

    # Conditions
    "Diabetes, Gestational": "gestational-diabetes",
    "Pre-Eclampsia": "preeclampsia",
    "Eclampsia": "preeclampsia",
    "HELLP Syndrome": "preeclampsia",
    "Hypertension, Pregnancy-Induced": "preeclampsia",
    "Genetic Testing": "genetic-screening",
    "Prenatal Diagnosis": "genetic-screening",
    "Amniocentesis": "genetic-screening",
    "Asthma": "allergies-asthma",
    "Hypersensitivity": "allergies-asthma",
    "Premature Birth": "nicu-prematurity",
    "Infant, Premature": "nicu-prematurity",
    "Intensive Care, Neonatal": "nicu-prematurity",
    "Communicable Diseases": "infectious-disease",

    # Evidence
    "Systematic Reviews as Topic": "systematic-review",
    "Meta-Analysis as Topic": "systematic-review",
    "Randomized Controlled Trials as Topic": "rct",
    "Cohort Studies": "cohort-study",
    "Case-Control Studies": "case-control",
    "Practice Guidelines as Topic": "clinical-guidelines",
    "Case Reports": "case-report",
}


def build_search_text(article: dict) -> str:
    """Build a combined text block from article fields for keyword matching."""
    parts = [
        article.get("title", ""),
        article.get("abstract", ""),
    ]
    keywords = article.get("keywords", [])
    if isinstance(keywords, list):
        parts.append(" ".join(keywords))
    mesh = article.get("mesh_terms", [])
    if isinstance(mesh, list):
        parts.append(" ".join(mesh))
    return " ".join(parts)


def match_keywords(text: str) -> List[Tuple[str, float]]:
    """Layer 1: Run keyword regex patterns against text."""
    matches = {}
    for pattern, slug, conf in _COMPILED_RULES:
        if pattern.search(text):
            if slug not in matches or conf > matches[slug]:
                matches[slug] = conf
    return [(slug, conf) for slug, conf in matches.items()]


def match_mesh_terms(article: dict) -> List[Tuple[str, float]]:
    """Layer 2: Map MeSH terms to tag slugs."""
    mesh_terms = article.get("mesh_terms", [])
    if not isinstance(mesh_terms, list):
        return []

    matches = {}
    for term in mesh_terms:
        slug = _MESH_MAP.get(term)
        if slug and (slug not in matches or 0.90 > matches[slug]):
            matches[slug] = 0.90  # MeSH matches get 0.90 confidence

    return [(slug, conf) for slug, conf in matches.items()]
