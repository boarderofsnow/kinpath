-- Migration 005: Seed the 39-tag taxonomy
-- Matches exactly what exists in the local SQLite platform.

-- ═══════════════════════════════════════════════════
-- Life Stages (12 tags)
-- ═══════════════════════════════════════════════════
INSERT INTO articles.tags (name, slug, category, description, sort_order) VALUES
    ('Pre-Conception & Fertility', 'pre-conception', 'life_stage', 'Planning pregnancy, fertility, IVF', 1),
    ('Pregnancy (General)', 'pregnancy', 'life_stage', 'General pregnancy topics', 2),
    ('First Trimester', 'first-trimester', 'life_stage', 'Weeks 1-13', 3),
    ('Second Trimester', 'second-trimester', 'life_stage', 'Weeks 14-27', 4),
    ('Third Trimester', 'third-trimester', 'life_stage', 'Weeks 28-40+', 5),
    ('Labor & Delivery', 'labor-delivery', 'life_stage', 'Birth process', 6),
    ('Postpartum', 'postpartum', 'life_stage', 'After birth / fourth trimester', 7),
    ('Newborn (0-28 days)', 'newborn', 'life_stage', 'Neonatal period', 8),
    ('Infant (1-12 months)', 'infant', 'life_stage', 'First year', 9),
    ('Toddler (1-3 years)', 'toddler', 'life_stage', 'Early childhood', 10),
    ('Preschool (3-5 years)', 'preschool', 'life_stage', 'Pre-kindergarten', 11),
    ('School Age (6-12 years)', 'school-age', 'life_stage', 'Elementary years', 12)
ON CONFLICT (slug) DO NOTHING;

-- Set parent_id for trimester tags (children of "Pregnancy")
UPDATE articles.tags
SET parent_id = (SELECT id FROM articles.tags WHERE slug = 'pregnancy')
WHERE slug IN ('first-trimester', 'second-trimester', 'third-trimester');

-- ═══════════════════════════════════════════════════
-- Topics (14 tags)
-- ═══════════════════════════════════════════════════
INSERT INTO articles.tags (name, slug, category, description, sort_order) VALUES
    ('Nutrition & Diet', 'nutrition', 'topic', 'Diet, supplements, micronutrients', 1),
    ('Vaccinations & Immunizations', 'vaccinations', 'topic', 'Immunizations for mother and child', 2),
    ('Maternal Mental Health', 'maternal-mental-health', 'topic', 'Perinatal mood disorders', 3),
    ('Pediatric Mental Health', 'pediatric-mental-health', 'topic', 'Child psychology', 4),
    ('Developmental Milestones', 'developmental-milestones', 'topic', 'Motor, cognitive, language', 5),
    ('Sleep', 'sleep', 'topic', 'Sleep patterns, safety, disorders', 6),
    ('Breastfeeding & Lactation', 'breastfeeding', 'topic', 'Lactation and human milk', 7),
    ('Safety & Injury Prevention', 'safety', 'topic', 'Injury prevention, childproofing', 8),
    ('Growth & Anthropometrics', 'growth', 'topic', 'Growth charts, anthropometrics', 9),
    ('Prenatal Care', 'prenatal-care', 'topic', 'Routine prenatal visits and screening', 10),
    ('Fetal Development', 'fetal-development', 'topic', 'Embryonic and fetal growth', 11),
    ('Speech & Language', 'speech-language', 'topic', 'Communication development', 12),
    ('Behavioral Health', 'behavioral-health', 'topic', 'ADHD, ASD, conduct', 13),
    ('Childhood Obesity', 'childhood-obesity', 'topic', 'Pediatric weight management', 14)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════
-- Conditions (6 tags)
-- ═══════════════════════════════════════════════════
INSERT INTO articles.tags (name, slug, category, description, sort_order) VALUES
    ('Gestational Diabetes', 'gestational-diabetes', 'condition', 'GDM', 1),
    ('Preeclampsia & Hypertension', 'preeclampsia', 'condition', 'Hypertensive disorders of pregnancy', 2),
    ('Genetic Screening', 'genetic-screening', 'condition', 'NIPT, amniocentesis, karyotype', 3),
    ('Allergies & Asthma', 'allergies-asthma', 'condition', 'Atopy, allergic disease', 4),
    ('Infectious Disease', 'infectious-disease', 'condition', 'Viral/bacterial infections', 5),
    ('NICU & Prematurity', 'nicu-prematurity', 'condition', 'Preterm birth, NICU care', 6)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════
-- Evidence Levels (7 tags)
-- ═══════════════════════════════════════════════════
INSERT INTO articles.tags (name, slug, category, description, sort_order) VALUES
    ('Systematic Review / Meta-Analysis', 'systematic-review', 'evidence_level', 'Highest evidence', 1),
    ('Randomized Controlled Trial', 'rct', 'evidence_level', 'Gold standard experimental', 2),
    ('Cohort Study', 'cohort-study', 'evidence_level', 'Prospective/longitudinal', 3),
    ('Case-Control Study', 'case-control', 'evidence_level', 'Retrospective comparison', 4),
    ('Clinical Guidelines', 'clinical-guidelines', 'evidence_level', 'Practice bulletins, recommendations', 5),
    ('Case Report / Series', 'case-report', 'evidence_level', 'Individual case documentation', 6),
    ('Expert Opinion / Editorial', 'expert-opinion', 'evidence_level', 'Commentary, editorials, letters', 7)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════
-- Seed default data sources
-- ═══════════════════════════════════════════════════
INSERT INTO articles.sources (name, slug, base_url, source_type, config) VALUES
    ('PubMed / NCBI', 'pubmed-ncbi', 'https://eutils.ncbi.nlm.nih.gov', 'api',
     '{"journals": {"AJOG": {"query": "\"Am J Obstet Gynecol\"[Journal]", "issn": "0002-9378"}, "AJOG MFM": {"query": "\"Am J Obstet Gynecol MFM\"[Journal]", "issn": "2589-9333"}}}'::jsonb),
    ('Elsevier ScienceDirect', 'elsevier-sciencedirect', 'https://api.elsevier.com', 'api',
     '{"target_issns": ["0002-9378", "2589-9333"]}'::jsonb)
ON CONFLICT (slug) DO NOTHING;
