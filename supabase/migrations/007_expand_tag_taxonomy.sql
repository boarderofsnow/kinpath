-- Migration 007: Expand tag taxonomy from 39 → ~168 tags across 9 dimensions
-- Non-breaking: adds columns, inserts new tags, remaps existing ones.
-- Run in Supabase SQL Editor.

-- ═══════════════════════════════════════════════════════════════
-- STEP 1: Schema changes
-- ═══════════════════════════════════════════════════════════════

-- Drop the CHECK constraint on category so we can add new dimension values
ALTER TABLE articles.tags DROP CONSTRAINT IF EXISTS tags_category_check;

-- Add dimension column (will replace category over time)
ALTER TABLE articles.tags ADD COLUMN IF NOT EXISTS dimension TEXT;

-- Add display_name for parent-facing labels
ALTER TABLE articles.tags ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Populate dimension from existing category for all current tags
UPDATE articles.tags SET dimension = category WHERE dimension IS NULL;

-- Index for dimension-based queries
CREATE INDEX IF NOT EXISTS idx_tags_dimension ON articles.tags(dimension);

-- ═══════════════════════════════════════════════════════════════
-- STEP 2: Upsert existing tags with updated descriptions/dimensions
-- (ON CONFLICT updates existing rows, inserts new ones)
-- ═══════════════════════════════════════════════════════════════

-- ---------------------------------------------------------------
-- DIMENSION 1: Life Stage (22 tags)
-- ---------------------------------------------------------------
INSERT INTO articles.tags (name, slug, category, dimension, display_name, description, sort_order) VALUES
  ('Pre-Conception & Fertility',   'pre-conception',       'life_stage', 'life_stage', 'Trying to Conceive',            'Fertility, preparing for pregnancy, genetic counseling', 1),
  ('Pregnancy (General)',          'pregnancy',            'life_stage', 'life_stage', 'Pregnancy',                     'General pregnancy topics', 2),
  ('First Trimester',              'first-trimester',      'life_stage', 'life_stage', 'First Trimester (Weeks 1-13)',  'Weeks 1-13, early symptoms, first appointments', 3),
  ('Second Trimester',             'second-trimester',     'life_stage', 'life_stage', 'Second Trimester (Weeks 14-27)','Weeks 14-27, anatomy scan, quickening', 4),
  ('Third Trimester',              'third-trimester',      'life_stage', 'life_stage', 'Third Trimester (Weeks 28-40)', 'Weeks 28-40, birth prep, nesting', 5),
  ('High-Risk Pregnancy',          'high-risk-pregnancy',  'life_stage', 'life_stage', 'High-Risk Pregnancy',           'Multiples, AMA, complications requiring monitoring', 6),
  ('Labor & Delivery',             'labor-delivery',       'life_stage', 'life_stage', 'Labor & Delivery',              'Active labor, birth, immediate postpartum', 7),
  ('Postpartum (General)',         'postpartum',           'life_stage', 'life_stage', 'Postpartum',                    'General postpartum topics', 8),
  ('Postpartum Recovery',          'postpartum-recovery',  'life_stage', 'life_stage', 'Postpartum Recovery',           'Physical healing, C-section recovery, pelvic floor', 9),
  ('Fourth Trimester',             'fourth-trimester',     'life_stage', 'life_stage', 'Fourth Trimester (0-3 months)', 'First 3 months adjustment, baby blues, bonding', 10),
  ('Newborn (0-28 days)',          'newborn',              'life_stage', 'life_stage', 'Newborn',                       'Neonatal period', 11),
  ('Infant (1-12 months)',         'infant',               'life_stage', 'life_stage', 'Infant',                        'First year', 12),
  ('Toddler (1-3 years)',          'toddler',              'life_stage', 'life_stage', 'Toddler',                       'Early childhood', 13),
  ('Preschool (3-5 years)',        'preschool',            'life_stage', 'life_stage', 'Preschool',                     'Pre-kindergarten', 14),
  ('School Age (5-12 years)',      'school-age',           'life_stage', 'life_stage', 'School Age',                    'Elementary years', 15),
  ('Tween (10-13 years)',          'tween',                'life_stage', 'life_stage', 'Tween',                         'Puberty, social shift, bridge to teen', 16),
  ('Adolescent (13-18 years)',     'adolescent',           'life_stage', 'life_stage', 'Adolescent',                    'Teen years', 17),
  ('Maternal Health',              'maternal-health',      'life_stage', 'life_stage', 'Maternal Health',               'Mother''s health not tied to specific child stage', 18),
  ('Paternal Health',              'paternal-health',      'life_stage', 'life_stage', 'Paternal Health',               'Father/partner health, involvement, adjustment', 19),
  ('Family System',                'family-system',        'life_stage', 'life_stage', 'Family',                        'Sibling dynamics, co-parenting, blended families', 20),
  ('Caregiver Wellness',           'caregiver-wellness',   'life_stage', 'life_stage', 'Caregiver Wellness',            'Burnout, self-care, mental load, support systems', 21)
ON CONFLICT (slug) DO UPDATE SET
  dimension = EXCLUDED.dimension,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- Set parent_id for life stage hierarchy
UPDATE articles.tags SET parent_id = (SELECT id FROM articles.tags WHERE slug = 'pregnancy')
WHERE slug IN ('first-trimester', 'second-trimester', 'third-trimester', 'high-risk-pregnancy');

UPDATE articles.tags SET parent_id = (SELECT id FROM articles.tags WHERE slug = 'postpartum')
WHERE slug IN ('postpartum-recovery', 'fourth-trimester');


-- ---------------------------------------------------------------
-- DIMENSION 2: Topic (42 tags)
-- ---------------------------------------------------------------
INSERT INTO articles.tags (name, slug, category, dimension, display_name, description, sort_order) VALUES
  -- Feeding & Nutrition
  ('Breastfeeding & Lactation',    'breastfeeding',        'topic', 'topic', 'Breastfeeding',       'Latch, supply, pumping, weaning, nursing positions', 1),
  ('Formula Feeding',              'formula-feeding',      'topic', 'topic', 'Formula Feeding',     'Formula selection, preparation, combination feeding', 2),
  ('Pumping',                      'pumping',              'topic', 'topic', 'Pumping',             'Exclusive pumping, pump selection, storage, supply', 3),
  ('Solids Introduction',          'solids-introduction',  'topic', 'topic', 'Starting Solids',     'Baby-led weaning, purees, first foods, allergen intro', 4),
  ('Maternal Nutrition',           'maternal-nutrition',   'topic', 'topic', 'Nutrition (Pregnancy)','Prenatal vitamins, pregnancy diet, foods to avoid', 5),
  ('Pediatric Nutrition',          'pediatric-nutrition',  'topic', 'topic', 'Nutrition (Kids)',     'Toddler/child diet, picky eating, meal planning', 6),
  ('Feeding Difficulties',         'feeding-difficulties', 'topic', 'topic', 'Feeding Difficulties', 'Tongue tie, feeding aversion, failure to thrive', 7),
  -- Sleep
  ('Sleep Safety',                 'sleep-safety',         'topic', 'topic', 'Sleep Safety',        'SIDS prevention, safe sleep position, co-sleeping risks', 8),
  ('Sleep Training',               'sleep-training',       'topic', 'topic', 'Sleep Training',      'Methods, schedules, regressions, night weaning', 9),
  ('Sleep Environment',            'sleep-environment',    'topic', 'topic', 'Sleep Environment',   'Room setup, white noise, temperature, room-sharing', 10),
  -- Development
  ('Gross Motor Development',      'gross-motor',          'topic', 'topic', 'Gross Motor',         'Rolling, crawling, walking, running, sports skills', 11),
  ('Fine Motor Development',       'fine-motor',           'topic', 'topic', 'Fine Motor',          'Grasping, drawing, writing, tool use', 12),
  ('Cognitive Development',        'cognitive-development','topic', 'topic', 'Cognitive Development','Problem-solving, memory, attention, executive function', 13),
  ('Speech & Language',            'speech-language',      'topic', 'topic', 'Speech & Language',   'First words, language delay, communication, stuttering', 14),
  ('Social-Emotional Development', 'social-emotional',     'topic', 'topic', 'Social-Emotional',    'Attachment, temperament, emotional regulation, empathy', 15),
  ('Adaptive Skills',              'adaptive-skills',      'topic', 'topic', 'Life Skills',         'Self-feeding, dressing, toileting, hygiene, independence', 16),
  ('Developmental Screening',      'developmental-screening','topic','topic','Dev Screening',       'ASQ-3, M-CHAT-R, Denver II, Bayley-4, milestones', 17),
  -- Behavior
  ('Behavioral Health',            'behavioral-health',    'topic', 'topic', 'Behavioral Health',   'ADHD, autism spectrum, conduct, sensory processing', 18),
  ('Tantrums & Discipline',        'tantrums-discipline',  'topic', 'topic', 'Tantrums & Discipline','Meltdowns, limit-setting, consequences, positive discipline', 19),
  ('Potty Training',               'potty-training',       'topic', 'topic', 'Potty Training',     'Readiness signs, methods, regression', 20),
  ('School Readiness',             'school-readiness',     'topic', 'topic', 'School Readiness',   'Pre-academic skills, kindergarten prep, learning differences', 21),
  ('Screen Time',                  'screen-time',          'topic', 'topic', 'Screen Time',        'Media guidelines, digital wellness, age-appropriate content', 22),
  -- Physical Health
  ('Vaccinations & Immunizations', 'vaccinations',         'topic', 'topic', 'Vaccinations',       'Schedules, safety, catch-up, exemptions', 23),
  ('Dental Health',                'dental-health',        'topic', 'topic', 'Dental Health',      'Teething, first dental visit, fluoride, thumb sucking', 24),
  ('Skin Care',                    'skin-care',            'topic', 'topic', 'Skin Care',          'Eczema, diaper rash, cradle cap, sun protection', 25),
  ('Growth Monitoring',            'growth-monitoring',    'topic', 'topic', 'Growth & Weight',    'Percentiles, growth charts, failure to thrive, obesity', 26),
  ('Vision & Hearing',             'vision-hearing',       'topic', 'topic', 'Vision & Hearing',   'Newborn screening, eye exams, ear infections, tubes', 27),
  ('Exercise & Activity',          'exercise-activity',    'topic', 'topic', 'Activity & Play',    'Tummy time, active play, sports safety, screen time limits', 28),
  -- Mental Health & Wellness
  ('Perinatal Mood Disorders',     'perinatal-mood-disorders','topic','topic','Perinatal Mood',     'PPD, PPA, postpartum OCD, postpartum psychosis, PTSD', 29),
  ('Prenatal Mental Health',       'prenatal-mental-health','topic', 'topic', 'Prenatal Mental Health','Depression/anxiety during pregnancy, prenatal bonding', 30),
  ('Paternal Mental Health',       'paternal-mental-health','topic', 'topic', 'Dad''s Mental Health','Dad''s depression, anxiety, adjustment, bonding', 31),
  ('Infant Mental Health',         'infant-mental-health', 'topic', 'topic', 'Infant Mental Health','Attachment disorders, regulatory disorders, early trauma', 32),
  ('Child Mental Health',          'child-mental-health',  'topic', 'topic', 'Child Mental Health', 'Anxiety, depression, OCD, self-harm, school refusal', 33),
  ('Adolescent Mental Health',     'adolescent-mental-health','topic','topic','Teen Mental Health',  'Identity, mood disorders, eating disorders, substance use', 34),
  ('Grief & Loss',                 'grief-loss',           'topic', 'topic', 'Grief & Loss',       'Miscarriage, stillbirth, infant loss, pregnancy after loss', 35),
  ('Relationship Wellness',        'relationship-wellness','topic', 'topic', 'Relationships',      'Partner communication, intimacy changes, co-parenting', 36),
  -- Pregnancy-Specific
  ('Prenatal Care',                'prenatal-care',        'topic', 'topic', 'Prenatal Care',      'Appointments, tests, what to expect at each visit', 37),
  ('Fetal Development',            'fetal-development',    'topic', 'topic', 'Fetal Development',  'Week-by-week development, ultrasound findings', 38),
  ('Birth Planning',               'birth-planning',       'topic', 'topic', 'Birth Planning',     'Birth plans, birth classes, choosing a provider', 39),
  -- Safety & Environment
  ('Injury Prevention',            'injury-prevention',    'topic', 'topic', 'Injury Prevention',  'Childproofing, car seats, water safety, poison control', 40),
  ('Environmental Health',         'environmental-health', 'topic', 'topic', 'Environmental Health','Toxins, lead, household chemicals, air quality, plastics', 41),
  -- Practical & Lifestyle
  ('Childcare',                    'childcare',            'topic', 'topic', 'Childcare',          'Daycare, nannies, choosing a provider, separation anxiety', 42),
  ('Travel',                       'travel',               'topic', 'topic', 'Travel',             'Traveling with baby/kids, car trips, flying', 43),
  ('Education & Schooling',        'education-schooling',  'topic', 'topic', 'Education',          'School choice, IEPs, learning support, homeschool', 44)
ON CONFLICT (slug) DO UPDATE SET
  dimension = EXCLUDED.dimension,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;

-- Remap old broad tags: keep them but update their descriptions
UPDATE articles.tags SET
  display_name = 'Nutrition (General)',
  description = 'General nutrition — see maternal-nutrition and pediatric-nutrition for specific tags'
WHERE slug = 'nutrition' AND display_name IS NULL;

UPDATE articles.tags SET
  display_name = 'Sleep (General)',
  description = 'General sleep — see sleep-safety, sleep-training, sleep-environment for specific tags'
WHERE slug = 'sleep' AND display_name IS NULL;

UPDATE articles.tags SET
  display_name = 'Safety (General)',
  description = 'General safety — see injury-prevention for specific tag'
WHERE slug = 'safety' AND display_name IS NULL;

UPDATE articles.tags SET
  display_name = 'Growth (General)',
  description = 'General growth — see growth-monitoring for specific tag'
WHERE slug = 'growth' AND display_name IS NULL;

-- Remap old mental health tags
UPDATE articles.tags SET
  display_name = 'Maternal Mental Health (Legacy)',
  description = 'Legacy tag — see perinatal-mood-disorders, prenatal-mental-health for specific tags'
WHERE slug = 'maternal-mental-health' AND display_name IS NULL;

UPDATE articles.tags SET
  display_name = 'Pediatric Mental Health (Legacy)',
  description = 'Legacy tag — see child-mental-health, adolescent-mental-health for specific tags'
WHERE slug = 'pediatric-mental-health' AND display_name IS NULL;

UPDATE articles.tags SET
  display_name = 'Developmental Milestones (Legacy)',
  description = 'Legacy tag — see gross-motor, fine-motor, cognitive-development, developmental-screening'
WHERE slug = 'developmental-milestones' AND display_name IS NULL;

UPDATE articles.tags SET
  display_name = 'Childhood Obesity (Legacy)',
  description = 'Legacy tag — see growth-monitoring, pediatric-nutrition'
WHERE slug = 'childhood-obesity' AND display_name IS NULL;


-- ---------------------------------------------------------------
-- DIMENSION 3: Condition / Concern (45 tags)
-- ---------------------------------------------------------------
INSERT INTO articles.tags (name, slug, category, dimension, display_name, description, sort_order) VALUES
  -- Maternal – Pregnancy
  ('Gestational Diabetes',         'gestational-diabetes',     'condition', 'condition', 'Gestational Diabetes',  'GDM screening, management, diet, insulin', 1),
  ('Preeclampsia & Hypertension',  'preeclampsia',             'condition', 'condition', 'Preeclampsia',          'High BP in pregnancy, HELLP, eclampsia', 2),
  ('Placenta Disorders',           'placenta-disorders',       'condition', 'condition', 'Placenta Problems',     'Previa, accreta, abruption', 3),
  ('Hyperemesis Gravidarum',       'hyperemesis',              'condition', 'condition', 'Severe Morning Sickness','HG management, dehydration, antiemetics', 4),
  ('Pregnancy Complications',      'pregnancy-complications',  'condition', 'condition', 'Pregnancy Complications','Ectopic, molar, cervical insufficiency, PPROM', 5),
  ('Cholestasis of Pregnancy',     'cholestasis',              'condition', 'condition', 'Cholestasis',           'Intrahepatic cholestasis, itching, bile acids', 6),
  ('Gestational Hypertension',     'gestational-hypertension', 'condition', 'condition', 'Gestational Hypertension','Chronic HTN in pregnancy, monitoring', 7),
  ('Morning Sickness',             'morning-sickness',         'condition', 'condition', 'Morning Sickness',      'Nausea/vomiting (non-HG), remedies, diet tips', 8),
  ('Growth Restriction (IUGR)',    'iugr-growth-restriction',  'condition', 'condition', 'Growth Restriction',    'IUGR, monitoring, delivery timing', 9),
  -- Maternal – Postpartum
  ('Postpartum Hemorrhage',        'postpartum-hemorrhage',    'condition', 'condition', 'Postpartum Hemorrhage', 'PPH risk, prevention, management', 10),
  ('Postpartum Infection',         'postpartum-infection',     'condition', 'condition', 'Postpartum Infection',  'Endometritis, wound infection, mastitis', 11),
  ('Pelvic Floor Dysfunction',     'pelvic-floor-dysfunction', 'condition', 'condition', 'Pelvic Floor',          'Incontinence, prolapse, diastasis recti, PT', 12),
  -- Newborn/Infant
  ('Newborn Jaundice',             'jaundice',                 'condition', 'condition', 'Jaundice',              'Phototherapy, bilirubin levels', 13),
  ('Reflux & Colic',               'reflux-colic',             'condition', 'condition', 'Reflux & Colic',        'Spit-up, GERD, colic, fussiness', 14),
  ('Tongue & Lip Tie',             'tongue-lip-tie',           'condition', 'condition', 'Tongue/Lip Tie',        'Diagnosis, impact on feeding, frenotomy', 15),
  ('NICU & Prematurity',           'nicu-prematurity',         'condition', 'condition', 'NICU & Prematurity',    'Preterm birth, NICU care, developmental follow-up', 16),
  ('Congenital Conditions',        'congenital-conditions',    'condition', 'condition', 'Birth Defects',         'Heart defects, structural anomalies, chromosomal', 17),
  ('Newborn Skin Conditions',      'newborn-skin',             'condition', 'condition', 'Newborn Skin',          'Cradle cap, baby acne, milia, birthmarks', 18),
  ('Umbilical Cord Issues',        'umbilical-cord-issues',    'condition', 'condition', 'Cord Care',             'Cord care, omphalitis, granuloma, hernia', 19),
  ('Plagiocephaly',                'plagiocephaly',            'condition', 'condition', 'Flat Head',             'Flat head, torticollis, helmet therapy', 20),
  ('Hip Dysplasia',                'hip-dysplasia',            'condition', 'condition', 'Hip Dysplasia',         'DDH screening, Pavlik harness, swaddling safety', 21),
  -- Childhood – Acute
  ('Allergies & Asthma',           'allergies-asthma',         'condition', 'condition', 'Allergies & Asthma',    'Food allergies, environmental, anaphylaxis, asthma', 22),
  ('Infectious Disease',           'infectious-disease',       'condition', 'condition', 'Infections',            'RSV, flu, COVID, strep, croup, HFM, bronchiolitis', 23),
  ('Fever & Illness',              'fever-illness',            'condition', 'condition', 'Fever & Illness',       'When to call doctor, fever management', 24),
  ('Ear Infections',               'ear-infections',           'condition', 'condition', 'Ear Infections',        'Otitis media, tubes, hearing impact, recurrence', 25),
  ('Rashes & Skin Conditions',     'rashes-skin-conditions',   'condition', 'condition', 'Rashes & Skin',         'Eczema flares, hives, ringworm, impetigo', 26),
  ('GI Issues',                    'gi-issues',                'condition', 'condition', 'Stomach & GI',          'Constipation, diarrhea, vomiting, stomach bugs', 27),
  ('UTI in Children',              'uti-infections',           'condition', 'condition', 'UTIs',                  'UTI in children, symptoms, recurrence, imaging', 28),
  -- Childhood – Chronic
  ('Chronic Conditions',           'chronic-conditions',       'condition', 'condition', 'Chronic Conditions',    'Type 1 diabetes, epilepsy, JIA, sickle cell, CF', 29),
  ('Genetic Screening',            'genetic-screening',        'condition', 'condition', 'Genetic Screening',     'NIPT, carrier screening, newborn screening', 30),
  -- Neurodevelopmental
  ('Autism Spectrum Disorder',     'autism-spectrum',           'condition', 'condition', 'Autism Spectrum',       'ASD screening, diagnosis, support, therapies', 31),
  ('ADHD',                         'adhd',                     'condition', 'condition', 'ADHD',                  'Attention/hyperactivity, diagnosis, treatment', 32),
  ('Learning Disabilities',        'learning-disabilities',    'condition', 'condition', 'Learning Disabilities', 'Dyslexia, dyscalculia, dysgraphia', 33),
  ('Sensory Processing',           'sensory-processing',       'condition', 'condition', 'Sensory Processing',    'SPD, sensory seeking/avoiding, OT support', 34),
  ('Speech Delay',                 'speech-delay',             'condition', 'condition', 'Speech Delay',          'Language delay, apraxia, stuttering, articulation', 35),
  ('Cerebral Palsy',               'cerebral-palsy',           'condition', 'condition', 'Cerebral Palsy',        'Motor differences, tone, therapy, adaptive equipment', 36),
  ('Down Syndrome',                'down-syndrome',            'condition', 'condition', 'Down Syndrome',         'Trisomy 21, health monitoring, early intervention', 37),
  ('Intellectual Disability',      'intellectual-disability',  'condition', 'condition', 'Intellectual Disability','Developmental delay, adaptive functioning, support', 38),
  -- Cross-Cutting
  ('Pain Management',              'pain-management',          'condition', 'condition', 'Pain Management',       'Labor pain, pediatric pain, procedural comfort', 39),
  ('Disability & Special Needs',   'disability-special-needs', 'condition', 'condition', 'Special Needs',         'Adaptive equipment, IEP/504, therapy access', 40),
  ('Emergency & First Aid',        'emergency-first-aid',      'condition', 'condition', 'Emergency & First Aid', 'Choking, CPR, when to go to ER', 41),
  ('Surgery & Procedures',         'surgery-procedures',       'condition', 'condition', 'Surgery & Procedures',  'Circumcision, ear tubes, tonsils, prenatal procedures', 42),
  ('Mental Health Crisis',         'mental-health-crisis',     'condition', 'condition', 'Mental Health Crisis',  'Suicidal ideation, self-harm, psychiatric emergency', 43)
ON CONFLICT (slug) DO UPDATE SET
  dimension = EXCLUDED.dimension,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;


-- ---------------------------------------------------------------
-- DIMENSION 4: Clinical Intent (8 tags)
-- ---------------------------------------------------------------
INSERT INTO articles.tags (name, slug, category, dimension, display_name, description, sort_order) VALUES
  ('Prevention',       'prevention',       'intent', 'intent', 'Prevention',        'How to reduce risk or avoid a problem', 1),
  ('Screening',        'screening',        'intent', 'intent', 'Screening',         'Tests, tools, when to screen, who to screen', 2),
  ('Diagnosis',        'diagnosis',        'intent', 'intent', 'Diagnosis',         'Confirming a condition, differential, interpreting results', 3),
  ('Treatment',        'treatment',        'intent', 'intent', 'Treatment',         'Management, medication, therapy, interventions', 4),
  ('Monitoring',       'monitoring',       'intent', 'intent', 'Monitoring',        'Tracking progress, follow-up, ongoing assessment', 5),
  ('What to Expect',   'what-to-expect',   'intent', 'intent', 'What to Expect',    'Normal progression, timelines, anticipatory guidance', 6),
  ('Decision Support', 'decision-support', 'intent', 'intent', 'Comparing Options', 'Comparing options, pros/cons, informed choice', 7),
  ('Safety Guidance',  'safety-guidance',  'intent', 'intent', 'Red Flags & Safety','When to call 911, red flags, urgent action steps', 8)
ON CONFLICT (slug) DO UPDATE SET
  dimension = EXCLUDED.dimension,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;


-- ---------------------------------------------------------------
-- DIMENSION 5: Approach / Preference (28 tags)
-- ---------------------------------------------------------------
INSERT INTO articles.tags (name, slug, category, dimension, display_name, description, sort_order) VALUES
  -- Birth
  ('Natural / Unmedicated Birth',  'natural-unmedicated',      'approach', 'approach', 'Natural Birth',       'Physiologic birth, no epidural, minimal intervention', 1),
  ('Water Birth',                  'water-birth',              'approach', 'approach', 'Water Birth',         'Labor/delivery in water, tub birth', 2),
  ('Home Birth',                   'home-birth',               'approach', 'approach', 'Home Birth',          'Planned home birth, out-of-hospital', 3),
  ('Birth Center',                 'birth-center',             'approach', 'approach', 'Birth Center',        'Freestanding or attached birth center', 4),
  ('Hospital Birth',               'hospital-birth',           'approach', 'approach', 'Hospital Birth',      'Standard hospital delivery', 5),
  ('Medicated Birth',              'medicated-birth',          'approach', 'approach', 'Medicated Birth',     'Epidural, pain medication, planned interventions', 6),
  ('Cesarean Birth',               'cesarean-birth',           'approach', 'approach', 'Cesarean Birth',      'Planned C-section, gentle cesarean', 7),
  ('VBAC',                         'vbac',                     'approach', 'approach', 'VBAC',                'Vaginal birth after cesarean', 8),
  ('Midwifery Model',              'midwifery-model',          'approach', 'approach', 'Midwife-Led Care',    'Midwife-led care, CNM, CPM', 9),
  ('Doula-Supported Birth',        'doula-supported',          'approach', 'approach', 'Doula Support',       'Continuous doula support during labor', 10),
  ('Hypnobirthing',                'hypnobirthing',            'approach', 'approach', 'Hypnobirthing',       'Self-hypnosis, relaxation techniques for birth', 11),
  ('Bradley Method',               'bradley-method',           'approach', 'approach', 'Bradley Method',      'Husband-coached natural childbirth', 12),
  ('Lamaze',                       'lamaze',                   'approach', 'approach', 'Lamaze',              'Breathing and positioning techniques', 13),
  -- Feeding
  ('Exclusive Breastfeeding',      'exclusive-breastfeeding',  'approach', 'approach', 'Exclusive Breastfeeding','EBF advocacy and support', 14),
  ('Exclusive Pumping',            'exclusive-pumping',        'approach', 'approach', 'Exclusive Pumping',   'EP, pump schedules, supply, storage', 15),
  ('Combination Feeding',          'combination-feeding',      'approach', 'approach', 'Combo Feeding',       'Breast + formula, supplementation', 16),
  ('Exclusive Formula',            'exclusive-formula',        'approach', 'approach', 'Formula Feeding',     'Formula-first families, by choice or necessity', 17),
  ('Baby-Led Weaning',             'baby-led-weaning',         'approach', 'approach', 'Baby-Led Weaning',    'Self-feeding, whole foods, no purees', 18),
  ('Traditional Weaning',          'traditional-weaning',      'approach', 'approach', 'Traditional Weaning', 'Spoon-fed purees, gradual progression', 19),
  -- Parenting
  ('Attachment Parenting',         'attachment-parenting',     'approach', 'approach', 'Attachment Parenting', 'Co-sleeping, baby-wearing, responsive parenting', 20),
  ('Gentle Parenting',             'gentle-parenting',         'approach', 'approach', 'Gentle Parenting',    'Positive discipline, emotion coaching, no punishment', 21),
  ('Montessori Parenting',         'montessori-parenting',     'approach', 'approach', 'Montessori Parenting','Prepared environment, independence, child-led', 22),
  ('RIE Parenting',                'rie-parenting',            'approach', 'approach', 'RIE Parenting',       'Respectful observation, minimal intervention', 23),
  ('Structured Parenting',         'structured-parenting',     'approach', 'approach', 'Structured Parenting','Schedules, sleep training, routine-based', 24),
  ('Free-Range Parenting',         'free-range-parenting',     'approach', 'approach', 'Free-Range Parenting','Age-appropriate independence, risk tolerance', 25),
  -- Medical
  ('Conventional Medicine',        'conventional-medicine',    'approach', 'approach', 'Conventional Medicine','Standard care, AAP/ACOG guidelines', 26),
  ('Integrative / Complementary',  'integrative-complementary','approach', 'approach', 'Integrative Medicine','Chiropractic, acupuncture, herbal, alongside conventional', 27),
  ('Minimal Intervention',         'minimal-intervention',     'approach', 'approach', 'Minimal Intervention','Selective vaccination, fewer medical procedures', 28)
ON CONFLICT (slug) DO UPDATE SET
  dimension = EXCLUDED.dimension,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;


-- ---------------------------------------------------------------
-- DIMENSION 6: Care Level (5 tags)
-- ---------------------------------------------------------------
INSERT INTO articles.tags (name, slug, category, dimension, display_name, description, sort_order) VALUES
  ('Emergency',       'emergency',       'care_level', 'care_level', 'Emergency',       'Call 911 / go to ER now', 1),
  ('Urgent Care',     'urgent-care',     'care_level', 'care_level', 'Urgent Care',     'See doctor within 24h', 2),
  ('Routine Medical', 'routine-medical', 'care_level', 'care_level', 'Routine Medical', 'Schedule an appointment', 3),
  ('Self-Care',       'self-care',       'care_level', 'care_level', 'Self-Care',       'Can be managed at home', 4),
  ('Wellness',        'wellness',        'care_level', 'care_level', 'Wellness',        'General health optimization', 5)
ON CONFLICT (slug) DO UPDATE SET
  dimension = EXCLUDED.dimension,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;


-- ---------------------------------------------------------------
-- DIMENSION 7: Evidence Level (7 tags) — already exist, just update
-- ---------------------------------------------------------------
INSERT INTO articles.tags (name, slug, category, dimension, display_name, description, sort_order) VALUES
  ('Systematic Review / Meta-Analysis', 'systematic-review', 'evidence_level', 'evidence_level', 'Systematic Review', 'Meta-analyses, Cochrane reviews (strongest)', 1),
  ('Randomized Controlled Trial',       'rct',               'evidence_level', 'evidence_level', 'RCT',               'Randomized controlled trials', 2),
  ('Cohort Study',                      'cohort-study',      'evidence_level', 'evidence_level', 'Cohort Study',      'Prospective/longitudinal studies', 3),
  ('Case-Control Study',                'case-control',      'evidence_level', 'evidence_level', 'Case-Control',      'Retrospective comparative studies', 4),
  ('Clinical Guidelines',              'clinical-guidelines','evidence_level', 'evidence_level', 'Clinical Guidelines','ACOG, AAP, WHO practice guidelines', 5),
  ('Case Report / Series',             'case-report',        'evidence_level', 'evidence_level', 'Case Report',       'Individual case descriptions', 6),
  ('Expert Opinion / Editorial',       'expert-opinion',     'evidence_level', 'evidence_level', 'Expert Opinion',    'Editorials, commentary (weakest)', 7)
ON CONFLICT (slug) DO UPDATE SET
  dimension = EXCLUDED.dimension,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;


-- ---------------------------------------------------------------
-- DIMENSION 8: Audience (3 tags)
-- ---------------------------------------------------------------
INSERT INTO articles.tags (name, slug, category, dimension, display_name, description, sort_order) VALUES
  ('Parent-Friendly',      'parent-friendly', 'audience', 'audience', 'Parent-Friendly',    'Written for/accessible to parents', 1),
  ('Clinical',             'clinical',        'audience', 'audience', 'Clinical',            'Written for healthcare providers', 2),
  ('Research / Academic',  'research',        'audience', 'audience', 'Research',            'Academic audience, methodology-focused', 3)
ON CONFLICT (slug) DO UPDATE SET
  dimension = EXCLUDED.dimension,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;


-- ---------------------------------------------------------------
-- DIMENSION 9: Cultural / Religious (8 tags)
-- ---------------------------------------------------------------
INSERT INTO articles.tags (name, slug, category, dimension, display_name, description, sort_order) VALUES
  ('Faith-Based Perspective',   'faith-based-perspective', 'cultural', 'cultural', 'Faith & Medicine',      'Intersection of faith and medical decisions', 1),
  ('Cultural Birth Practices',  'cultural-birth-practice', 'cultural', 'cultural', 'Cultural Birth',        'Traditional birth customs, cultural postpartum', 2),
  ('Cultural Feeding',          'cultural-feeding',        'cultural', 'cultural', 'Cultural Feeding',      'Cultural approaches to infant/child feeding', 3),
  ('Circumcision Decision',     'circumcision-decision',   'cultural', 'cultural', 'Circumcision',          'Medical evidence and cultural/religious context', 4),
  ('End-of-Life Decisions',     'end-of-life-decisions',   'cultural', 'cultural', 'End-of-Life',           'Perinatal palliative care, comfort care', 5),
  ('Fertility Ethics',          'fertility-ethics',        'cultural', 'cultural', 'Fertility Ethics',      'IVF, surrogacy, egg/sperm donation ethics', 6),
  ('Vaccine Hesitancy',         'vaccine-hesitancy',       'cultural', 'cultural', 'Vaccine Hesitancy',     'Addressing concerns, religious exemptions', 7),
  ('LGBTQ+ Family',             'lgbtq-family',            'cultural', 'cultural', 'LGBTQ+ Family',        'Same-sex parenting, donor conception', 8)
ON CONFLICT (slug) DO UPDATE SET
  dimension = EXCLUDED.dimension,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  category = EXCLUDED.category;


-- ═══════════════════════════════════════════════════════════════
-- STEP 3: Verify counts
-- ═══════════════════════════════════════════════════════════════
-- Run after migration to verify:
-- SELECT dimension, count(*) FROM articles.tags GROUP BY dimension ORDER BY dimension;
--
-- Expected:
--   approach       | 28
--   audience       |  3
--   care_level     |  5
--   condition      | 43
--   cultural       |  8
--   evidence_level |  7
--   intent         |  8
--   life_stage     | 21
--   topic          | 44 (includes legacy broad tags)
--   NULL           |  0 (all should have dimension set)
