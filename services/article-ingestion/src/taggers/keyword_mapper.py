"""
Layer 1: Keyword/regex pattern matching.
Layer 2: MeSH descriptor mapping.
Expanded for 9-dimension taxonomy (~168 tags).
"""

import re
from typing import List, Tuple

# ═══════════════════════════════════════════════════════════════
# LAYER 1: Keyword regex patterns → tag slugs
# Each rule: (compiled_regex, tag_slug, confidence)
# ═══════════════════════════════════════════════════════════════

_KEYWORD_RULES = [
    # ---------------------------------------------------------------
    # DIMENSION 1: Life Stages
    # ---------------------------------------------------------------
    (r"(?i)\b(pre-?concept|infertil|IVF|in.vitro|fertil|ovulat|sperm)\b", "pre-conception", 0.85),
    (r"(?i)\b(pregnan|gestat|antenat|maternal)\b", "pregnancy", 0.80),
    (r"(?i)\b(first.trimester|trimester.1|weeks?\s*[4-9]\b|weeks?\s*1[0-3]\b)", "first-trimester", 0.85),
    (r"(?i)\b(second.trimester|trimester.2|weeks?\s*1[4-9]\b|weeks?\s*2[0-7]\b)", "second-trimester", 0.85),
    (r"(?i)\b(third.trimester|trimester.3|weeks?\s*2[8-9]\b|weeks?\s*3\d\b|weeks?\s*40\b)", "third-trimester", 0.85),
    (r"(?i)\b(high.risk.pregnan|advanced.maternal.age|AMA.pregnan|multip(?:le|arous).gestat)", "high-risk-pregnancy", 0.85),
    (r"(?i)\b(labor|deliver|birth|intrapart|cesare|c-section|vaginal.deliver|induc)", "labor-delivery", 0.85),
    (r"(?i)\b(postpartum|postnatal|puerper)", "postpartum", 0.85),
    (r"(?i)\b(postpartum.recover|c-section.recover|pelvic.floor.recover|episiotom)", "postpartum-recovery", 0.85),
    (r"(?i)\b(fourth.trimester|first.three.months|newborn.adjust)", "fourth-trimester", 0.80),
    (r"(?i)\b(newborn|neonat)", "newborn", 0.85),
    (r"(?i)\b(infant|infancy)\b", "infant", 0.80),
    (r"(?i)\b(toddler)\b", "toddler", 0.80),
    (r"(?i)\b(preschool|pre-school)\b", "preschool", 0.80),
    (r"(?i)\b(school.age|school-age|elementary)\b", "school-age", 0.80),
    (r"(?i)\b(tween|pre-?teen|puberty|pubert)\b", "tween", 0.80),
    (r"(?i)\b(adolescen|teenage|teen.health)\b", "adolescent", 0.80),
    (r"(?i)\b(maternal.health|mother.?s.health|women.?s.health.postpartum)\b", "maternal-health", 0.80),
    (r"(?i)\b(paternal|father|dad.?s.health|fatherhood)\b", "paternal-health", 0.80),
    (r"(?i)\b(sibling|co-?parent|blended.famil|family.dynamic|family.system)\b", "family-system", 0.80),
    (r"(?i)\b(caregiver.burnout|parental.burnout|mental.load|parent.self-?care)\b", "caregiver-wellness", 0.80),

    # ---------------------------------------------------------------
    # DIMENSION 2: Topics — Feeding & Nutrition
    # ---------------------------------------------------------------
    (r"(?i)\b(breastfeed|lactation|human.milk|breast.milk|nursing.mother)\b", "breastfeeding", 0.85),
    (r"(?i)\b(formula.feed|infant.formula|bottle.feed)\b", "formula-feeding", 0.85),
    (r"(?i)\b(pump|express.milk|breast.pump|exclusive.pump)\b", "pumping", 0.85),
    (r"(?i)\b(solid.food|first.food|baby.led.wean|BLW|puree|complementary.feed|allergen.intro)\b", "solids-introduction", 0.85),
    (r"(?i)\b(prenatal.vitamin|pregnan.+diet|maternal.nutrit|folate|folic.acid|prenatal.nutrit)\b", "maternal-nutrition", 0.85),
    (r"(?i)\b(child.+diet|toddler.+nutrit|picky.eat|pediatric.nutrit|child.+meal)\b", "pediatric-nutrition", 0.85),
    (r"(?i)\b(feeding.difficult|feeding.aversion|failure.to.thrive|poor.weight.gain|latch.difficult)\b", "feeding-difficulties", 0.85),

    # Topics — Sleep
    (r"(?i)\b(SIDS|sudden.infant.death|safe.sleep|sleep.position|back.to.sleep)\b", "sleep-safety", 0.90),
    (r"(?i)\b(sleep.train|ferber|cry.it.out|extinction.method|sleep.regression|night.wean)\b", "sleep-training", 0.85),
    (r"(?i)\b(sleep.environment|white.noise|room.shar|co-?sleep|bed.shar|bassinet)\b", "sleep-environment", 0.85),

    # Topics — Development
    (r"(?i)\b(gross.motor|crawl|walk|roll.over|sit.up|pull.to.stand)\b", "gross-motor", 0.85),
    (r"(?i)\b(fine.motor|pincer.grasp|scribbl|hand.eye.coordin|manipulat)\b", "fine-motor", 0.85),
    (r"(?i)\b(cognitive.develop|problem.solv|object.permanen|executive.function|piaget)\b", "cognitive-development", 0.85),
    (r"(?i)\b(speech|language.develop|stutter|aphasia|communication.disorder|first.word|babbl)\b", "speech-language", 0.85),
    (r"(?i)\b(social.emotional|attachment|temperament|emotional.regulat|empathy.develop|separation.anxi)\b", "social-emotional", 0.85),
    (r"(?i)\b(self-?feed|dress.self|toilet|self-?help.skill|adaptive.skill|independen.+child)\b", "adaptive-skills", 0.80),
    (r"(?i)\b(ASQ-?3|M-?CHAT|Denver.II|Bayley|developmental.screen|milestone.screen)\b", "developmental-screening", 0.90),

    # Topics — Behavior
    (r"(?i)\b(ADHD|autism|ASD|conduct.disorder|behavioral.health|oppositional)\b", "behavioral-health", 0.85),
    (r"(?i)\b(tantrum|meltdown|discipline|time-?out|positive.discipline|limit.set|consequence)\b", "tantrums-discipline", 0.85),
    (r"(?i)\b(potty.train|toilet.train|diaper.free|readiness.sign)\b", "potty-training", 0.85),
    (r"(?i)\b(school.readiness|kindergarten.prep|pre-?academic|learning.differ)\b", "school-readiness", 0.85),
    (r"(?i)\b(screen.time|digital.media|media.guideline|TV.+child|tablet.+child)\b", "screen-time", 0.85),

    # Topics — Physical Health
    (r"(?i)\b(vaccin|immuniz|inoculat)\b", "vaccinations", 0.85),
    (r"(?i)\b(dental|teeth|teething|fluoride|cavity|oral.health|first.dental)\b", "dental-health", 0.85),
    (r"(?i)\b(eczema|diaper.rash|cradle.cap|sun.protect|skin.care.child|atopic.dermat)\b", "skin-care", 0.85),
    (r"(?i)\b(growth.chart|percentile|BMI.child|height.weight|failure.to.thrive|growth.monitor)\b", "growth-monitoring", 0.85),
    (r"(?i)\b(vision.screen|hearing.screen|eye.exam.child|ear.tube|amblyopia|strabism)\b", "vision-hearing", 0.85),
    (r"(?i)\b(tummy.time|active.play|sports.safety|physical.activ.+child|exercise.+child)\b", "exercise-activity", 0.85),

    # Topics — Mental Health
    (r"(?i)\b(postpartum.depress|PPD|postpartum.anxi|PPA|postpartum.OCD|postpartum.psycho|perinatal.mood)\b", "perinatal-mood-disorders", 0.90),
    (r"(?i)\b(prenatal.depress|prenatal.anxi|depression.+pregnan|anxiety.+pregnan)\b", "prenatal-mental-health", 0.85),
    (r"(?i)\b(paternal.depress|father.+depress|dad.+depress|paternal.mental)\b", "paternal-mental-health", 0.85),
    (r"(?i)\b(infant.mental.health|attachment.disorder|reactive.attachment|regulatory.disorder)\b", "infant-mental-health", 0.85),
    (r"(?i)\b(child.+anxiety|child.+depress|child.+OCD|school.refusal|child.+mental.health)\b", "child-mental-health", 0.85),
    (r"(?i)\b(adolescent.+mental|teen.+depress|teen.+anxi|eating.disorder|self-?harm|teen.+suicid)\b", "adolescent-mental-health", 0.85),
    (r"(?i)\b(miscarriage|stillbirth|infant.loss|pregnancy.loss|perinatal.loss|grief.+pregnan)\b", "grief-loss", 0.90),
    (r"(?i)\b(partner.communicat|intimacy.+postpartum|co-?parent|relationship.+baby)\b", "relationship-wellness", 0.80),

    # Topics — Pregnancy-Specific
    (r"(?i)\b(prenatal.care|prenatal.visit|antenatal.care|prenatal.screen)\b", "prenatal-care", 0.85),
    (r"(?i)\b(fetal.develop|embryo|organogen|fetal.growth|intrauterin)\b", "fetal-development", 0.85),
    (r"(?i)\b(birth.plan|birth.class|choos.+provider|birth.prefer|doula.select)\b", "birth-planning", 0.85),

    # Topics — Safety & Environment
    (r"(?i)\b(childproof|car.seat|water.safety|poison|drown|injury.prevent|child.safety)\b", "injury-prevention", 0.85),
    (r"(?i)\b(toxin|lead.expos|household.chemical|air.quality|BPA|phthalate|plastic.+baby)\b", "environmental-health", 0.85),

    # Topics — Practical & Lifestyle
    (r"(?i)\b(daycare|nanny|childcare|child.care.provider)\b", "childcare", 0.85),
    (r"(?i)\b(travel.+baby|travel.+child|fly.+infant|car.trip.+child)\b", "travel", 0.80),
    (r"(?i)\b(homeschool|IEP|504.plan|school.choice|learning.support|special.education)\b", "education-schooling", 0.85),

    # ---------------------------------------------------------------
    # DIMENSION 3: Conditions
    # ---------------------------------------------------------------
    # Maternal — Pregnancy
    (r"(?i)\b(gestational.diabet|GDM|glucose.toleran)\b", "gestational-diabetes", 0.90),
    (r"(?i)\b(pre-?eclamps|eclamps|HELLP|hypertens.+pregn)\b", "preeclampsia", 0.90),
    (r"(?i)\b(placenta.previa|placenta.accreta|placent.+abrupt)\b", "placenta-disorders", 0.90),
    (r"(?i)\b(hyperemesis|severe.+morning.sickness|HG.+pregnan)\b", "hyperemesis", 0.90),
    (r"(?i)\b(ectopic.pregnan|molar.pregnan|cervical.insuffic|PPROM|premature.rupture)\b", "pregnancy-complications", 0.90),
    (r"(?i)\b(cholestasis|intrahepatic.+pregnan|ICP.+pregnan|bile.acid.+pregnan)\b", "cholestasis", 0.90),
    (r"(?i)\b(gestational.hypertens|chronic.hypertens.+pregnan)\b", "gestational-hypertension", 0.85),
    (r"(?i)\b(morning.sickness|nausea.+pregnan|NVP|nausea.vomit.pregnan)\b", "morning-sickness", 0.80),
    (r"(?i)\b(IUGR|intrauterine.growth.restrict|fetal.growth.restrict|small.for.gestat)\b", "iugr-growth-restriction", 0.90),
    # Maternal — Postpartum
    (r"(?i)\b(postpartum.hemorrh|PPH|uterine.atony|postpartum.bleed)\b", "postpartum-hemorrhage", 0.90),
    (r"(?i)\b(endometritis|postpartum.infect|wound.infect.+birth|mastitis)\b", "postpartum-infection", 0.85),
    (r"(?i)\b(pelvic.floor|diastasis.recti|urinary.incontinen|pelvic.organ.prolaps)\b", "pelvic-floor-dysfunction", 0.85),
    # Newborn/Infant
    (r"(?i)\b(jaundice|hyperbilirub|phototherapy|bilirubin)\b", "jaundice", 0.90),
    (r"(?i)\b(reflux|GERD|colic|fussy.baby|spit.up|regurgitat)\b", "reflux-colic", 0.85),
    (r"(?i)\b(tongue.tie|lip.tie|ankyloglossia|frenul|frenotomy)\b", "tongue-lip-tie", 0.90),
    (r"(?i)\b(NICU|prematur|preterm|very.low.birth|extremely.low.birth|neonatal.intensive)\b", "nicu-prematurity", 0.90),
    (r"(?i)\b(congenital.heart|birth.defect|structural.anomal|chromosom.+anomal)\b", "congenital-conditions", 0.85),
    (r"(?i)\b(cradle.cap|baby.acne|milia|birthmark|erythema.toxic|newborn.rash)\b", "newborn-skin", 0.85),
    (r"(?i)\b(umbilical.cord|omphalitis|cord.care|umbilical.granuloma|umbilical.hernia)\b", "umbilical-cord-issues", 0.85),
    (r"(?i)\b(plagiocephaly|flat.head|torticollis|helmet.therapy)\b", "plagiocephaly", 0.90),
    (r"(?i)\b(hip.dysplasia|DDH|developmental.dysplasia.+hip|Pavlik|Barlow|Ortolani)\b", "hip-dysplasia", 0.90),
    # Childhood — Acute
    (r"(?i)\b(allerg|asthma|atop|anaphyla|eczema.+child|food.allerg)\b", "allergies-asthma", 0.85),
    (r"(?i)\b(RSV|respiratory.syncytial|influenza.+child|COVID.+child|strep.throat|croup|bronchiolit|hand.foot.mouth)\b", "infectious-disease", 0.85),
    (r"(?i)\b(fever.+child|fever.+infant|when.to.call.doctor|fever.manage)\b", "fever-illness", 0.85),
    (r"(?i)\b(otitis.media|ear.infection|tympan|ear.tube|myringotomy)\b", "ear-infections", 0.90),
    (r"(?i)\b(rash.+child|hives|urticaria|molluscum|ringworm|impetigo|eczema.flare)\b", "rashes-skin-conditions", 0.85),
    (r"(?i)\b(constipat.+child|diarrhea.+child|vomit.+child|stomach.bug|gastroenter|intussuscep)\b", "gi-issues", 0.85),
    (r"(?i)\b(UTI.+child|urinary.tract.+child|pyelonephrit.+child)\b", "uti-infections", 0.85),
    # Childhood — Chronic
    (r"(?i)\b(type.1.diabet|juvenile.diabet|epilepsy.+child|juvenile.arthrit|sickle.cell|cystic.fibros)\b", "chronic-conditions", 0.85),
    (r"(?i)\b(genetic.screen|NIPT|amniocentesis|karyotype|chromosom|carrier.screen|newborn.screen)\b", "genetic-screening", 0.85),
    # Neurodevelopmental
    (r"(?i)\b(autism.spectrum|ASD|autistic|M-?CHAT|ADOS)\b", "autism-spectrum", 0.90),
    (r"(?i)\b(ADHD|attention.deficit|hyperactiv.+disorder|inattentive.type)\b", "adhd", 0.90),
    (r"(?i)\b(dyslexia|dyscalculia|dysgraphia|learning.disabil|reading.disabil)\b", "learning-disabilities", 0.90),
    (r"(?i)\b(sensory.process|SPD|sensory.seek|sensory.avoid|sensory.integrat)\b", "sensory-processing", 0.85),
    (r"(?i)\b(speech.delay|language.delay|late.talker|apraxia.+speech|articulat.+disorder)\b", "speech-delay", 0.85),
    (r"(?i)\b(cerebral.palsy|CP.+child|spastic.+child|motor.disabil)\b", "cerebral-palsy", 0.90),
    (r"(?i)\b(Down.syndrome|trisomy.21)\b", "down-syndrome", 0.95),
    (r"(?i)\b(intellectual.disabil|developmental.delay|adaptive.function)\b", "intellectual-disability", 0.85),
    # Cross-Cutting
    (r"(?i)\b(labor.pain|epidural|pain.manage.+child|procedural.comfort|pediatric.pain)\b", "pain-management", 0.85),
    (r"(?i)\b(special.needs|adaptive.equip|IEP|504.plan|disabil.+child|wheelchair.+child)\b", "disability-special-needs", 0.85),
    (r"(?i)\b(choking|CPR|first.aid|emergency.+child|when.to.go.to.ER|anaphylax.+treat)\b", "emergency-first-aid", 0.90),
    (r"(?i)\b(circumcis|ear.tubes|tonsillect|adenoid|myringotomy|surgery.+child)\b", "surgery-procedures", 0.85),
    (r"(?i)\b(suicid.+child|suicid.+teen|self-?harm|psychiatric.emergenc|crisis.+mental)\b", "mental-health-crisis", 0.90),

    # ---------------------------------------------------------------
    # DIMENSION 4: Clinical Intent
    # ---------------------------------------------------------------
    (r"(?i)\b(prevent|risk.reduc|prophylax|avoid)\b", "prevention", 0.70),
    (r"(?i)\b(screen|detect.+early|surveillance|checklist.+assess)\b", "screening", 0.70),
    (r"(?i)\b(diagnos|differential|confirm|interpret.+result)\b", "diagnosis", 0.70),
    (r"(?i)\b(treat|therap|manage|medicat|intervention|remedy|cure)\b", "treatment", 0.70),
    (r"(?i)\b(monitor|follow.up|track|ongoing.assess|check-?up)\b", "monitoring", 0.70),
    (r"(?i)\b(what.to.expect|normal.progression|timeline|anticipatory)\b", "what-to-expect", 0.75),
    (r"(?i)\b(compar|pros.and.cons|option|choice|decision|alternative)\b", "decision-support", 0.70),
    (r"(?i)\b(red.flag|call.911|emergency.sign|warning.sign|when.to.seek|urgent)\b", "safety-guidance", 0.80),

    # ---------------------------------------------------------------
    # DIMENSION 5: Approach / Preference
    # ---------------------------------------------------------------
    # Birth
    (r"(?i)\b(natural.birth|unmedicated.birth|physiologic.birth|no.epidural)\b", "natural-unmedicated", 0.85),
    (r"(?i)\b(water.birth|waterbirth|tub.birth|aquatic.birth)\b", "water-birth", 0.90),
    (r"(?i)\b(home.birth|out.of.hospital|planned.home.deliver)\b", "home-birth", 0.90),
    (r"(?i)\b(birth.center|birthing.center|freestanding.birth)\b", "birth-center", 0.90),
    (r"(?i)\b(hospital.birth|hospital.deliver)\b", "hospital-birth", 0.80),
    (r"(?i)\b(epidural|medicated.birth|pain.relief.+labor)\b", "medicated-birth", 0.80),
    (r"(?i)\b(cesarean|c-section|gentle.cesarean|planned.cesarean)\b", "cesarean-birth", 0.85),
    (r"(?i)\b(VBAC|vaginal.birth.after.cesarean)\b", "vbac", 0.95),
    (r"(?i)\b(midwif|CNM|certified.nurse.midwif|CPM|certified.professional.midwif)\b", "midwifery-model", 0.85),
    (r"(?i)\b(doula|birth.support|labor.support.person)\b", "doula-supported", 0.85),
    (r"(?i)\b(hypnobirth|self-?hypnosis.+birth|hypno.+birth)\b", "hypnobirthing", 0.90),
    (r"(?i)\b(Bradley.method|husband.coached|Bradley.+childbirth)\b", "bradley-method", 0.90),
    (r"(?i)\b(Lamaze|lamaze.+breath)\b", "lamaze", 0.90),
    # Feeding
    (r"(?i)\b(exclusive.breastfeed|EBF|exclusively.breastf)\b", "exclusive-breastfeeding", 0.90),
    (r"(?i)\b(exclusive.pump|EP.+breast|exclusively.pump)\b", "exclusive-pumping", 0.85),
    (r"(?i)\b(combination.feed|combo.feed|supplement.+formula|breast.+formula.+mix)\b", "combination-feeding", 0.85),
    (r"(?i)\b(formula.only|formula.first|exclusive.formula)\b", "exclusive-formula", 0.85),
    (r"(?i)\b(baby.led.wean|BLW|self.feed.+solid|finger.food.+baby)\b", "baby-led-weaning", 0.90),
    (r"(?i)\b(spoon.feed|puree.+baby|traditional.wean)\b", "traditional-weaning", 0.80),
    # Parenting
    (r"(?i)\b(attachment.parent|co-?sleep.+parent|baby.wear|babywear|responsive.parent)\b", "attachment-parenting", 0.85),
    (r"(?i)\b(gentle.parent|positive.discipline|emotion.coach|no.punish)\b", "gentle-parenting", 0.85),
    (r"(?i)\b(montessori.+parent|montessori.+home|montessori.+child)\b", "montessori-parenting", 0.85),
    (r"(?i)\b(RIE|resources.for.infant|Magda.Gerber)\b", "rie-parenting", 0.90),
    (r"(?i)\b(structured.parent|schedule.+baby|routine.+parent|babywise)\b", "structured-parenting", 0.80),
    (r"(?i)\b(free.range|independent.play|unsupervis.+play.+child)\b", "free-range-parenting", 0.85),
    # Medical
    (r"(?i)\b(AAP.+recommend|ACOG.+guideline|standard.of.care|evidence.based.medicine)\b", "conventional-medicine", 0.80),
    (r"(?i)\b(chiropractic|acupuncture|herbal.+remedy|complementary.+medicine|integrative.+medicine)\b", "integrative-complementary", 0.85),
    (r"(?i)\b(selective.vaccin|delayed.vaccin|minimal.intervention|vaccine.exemp)\b", "minimal-intervention", 0.80),

    # ---------------------------------------------------------------
    # DIMENSION 6: Care Level
    # ---------------------------------------------------------------
    (r"(?i)\b(call.911|emergency.room|life.threaten|cardiac.arrest|anaphylax.+emerg|seizure.+emerg)\b", "emergency", 0.90),
    (r"(?i)\b(urgent.care|see.doctor.within|seek.medical.attent|same-?day.appoint)\b", "urgent-care", 0.80),
    (r"(?i)\b(well.child.visit|routine.check|annual.exam|scheduled.appointment)\b", "routine-medical", 0.75),
    (r"(?i)\b(home.remed|manage.at.home|self-?care|over.the.counter)\b", "self-care", 0.70),
    (r"(?i)\b(wellness|health.optim|general.health|preventive.health)\b", "wellness", 0.70),

    # ---------------------------------------------------------------
    # DIMENSION 7: Evidence Level
    # ---------------------------------------------------------------
    (r"(?i)\b(systematic.review|meta-analysis|meta.analysis)\b", "systematic-review", 0.95),
    (r"(?i)\b(randomized.controlled|randomised.controlled|RCT)\b", "rct", 0.95),
    (r"(?i)\b(cohort.study|prospective.study|longitudinal.study)\b", "cohort-study", 0.90),
    (r"(?i)\b(case-control|case.control)\b", "case-control", 0.90),
    (r"(?i)\b(guideline|practice.bulletin|recommendation|consensus.statement)\b", "clinical-guidelines", 0.90),
    (r"(?i)\b(case.report|case.series)\b", "case-report", 0.85),
    (r"(?i)\b(editorial|expert.opinion|commentary|letter.to.editor)\b", "expert-opinion", 0.80),

    # ---------------------------------------------------------------
    # DIMENSION 9: Cultural / Religious
    # ---------------------------------------------------------------
    (r"(?i)\b(faith.+health|religious.+medical|spiritual.+birth|faith.based.+care)\b", "faith-based-perspective", 0.80),
    (r"(?i)\b(cultural.+birth|traditional.+birth.custom|postpartum.+tradition|cultural.+practice)\b", "cultural-birth-practice", 0.80),
    (r"(?i)\b(cultural.+feeding|traditional.+food|cultural.+diet.+child)\b", "cultural-feeding", 0.80),
    (r"(?i)\b(circumcis.+decision|circumcis.+debate|circumcis.+ethic)\b", "circumcision-decision", 0.85),
    (r"(?i)\b(palliative.+neonat|comfort.+care.+infant|end.of.life.+child|perinatal.hospice)\b", "end-of-life-decisions", 0.85),
    (r"(?i)\b(IVF.+ethic|surrogacy.+ethic|egg.donat.+ethic|sperm.donat.+ethic|fertility.+ethic)\b", "fertility-ethics", 0.85),
    (r"(?i)\b(vaccine.hesitan|anti-?vax|vaccine.refus|vaccine.concern|religious.exemp.+vaccin)\b", "vaccine-hesitancy", 0.85),
    (r"(?i)\b(LGBTQ|same-?sex.parent|two.mom|two.dad|donor.concept|rainbow.famil)\b", "lgbtq-family", 0.85),
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
    "Pregnancy, High-Risk": "high-risk-pregnancy",
    "Labor, Obstetric": "labor-delivery",
    "Delivery, Obstetric": "labor-delivery",
    "Cesarean Section": "cesarean-birth",
    "Postpartum Period": "postpartum",
    "Infant, Newborn": "newborn",
    "Infant": "infant",
    "Child, Preschool": "preschool",
    "Child": "school-age",
    "Adolescent": "adolescent",
    "Fertility": "pre-conception",
    "Fertilization in Vitro": "pre-conception",
    "Infertility": "pre-conception",
    "Fathers": "paternal-health",
    "Paternal Behavior": "paternal-health",

    # Topics — Feeding
    "Breast Feeding": "breastfeeding",
    "Milk, Human": "breastfeeding",
    "Lactation": "breastfeeding",
    "Infant Formula": "formula-feeding",
    "Bottle Feeding": "formula-feeding",
    "Weaning": "solids-introduction",
    "Infant Nutritional Physiological Phenomena": "solids-introduction",
    "Prenatal Nutritional Physiological Phenomena": "maternal-nutrition",

    # Topics — Sleep
    "Sleep": "sleep-safety",
    "Sudden Infant Death": "sleep-safety",
    "Infant Sleep": "sleep-training",

    # Topics — Development
    "Child Development": "cognitive-development",
    "Motor Skills": "gross-motor",
    "Fine Motor Skills": "fine-motor",
    "Language Development": "speech-language",
    "Speech-Language Pathology": "speech-language",
    "Object Attachment": "social-emotional",
    "Developmental Disabilities": "developmental-screening",

    # Topics — Physical Health
    "Vaccination": "vaccinations",
    "Immunization": "vaccinations",
    "Immunization Schedule": "vaccinations",
    "Dental Care": "dental-health",
    "Tooth, Deciduous": "dental-health",
    "Dermatitis, Atopic": "skin-care",
    "Growth Charts": "growth-monitoring",
    "Body Height": "growth-monitoring",
    "Body Weight": "growth-monitoring",
    "Vision Screening": "vision-hearing",
    "Hearing Tests": "vision-hearing",
    "Exercise": "exercise-activity",

    # Topics — Mental Health
    "Depression, Postpartum": "perinatal-mood-disorders",
    "Anxiety Disorders": "child-mental-health",
    "Prenatal Care": "prenatal-care",
    "Fetal Development": "fetal-development",
    "Abortion, Spontaneous": "grief-loss",
    "Stillbirth": "grief-loss",
    "Perinatal Death": "grief-loss",

    # Topics — Safety
    "Wounds and Injuries": "injury-prevention",
    "Accidents, Home": "injury-prevention",
    "Child Abuse": "injury-prevention",
    "Environmental Pollutants": "environmental-health",
    "Lead Poisoning": "environmental-health",

    # Conditions — Maternal
    "Diabetes, Gestational": "gestational-diabetes",
    "Pre-Eclampsia": "preeclampsia",
    "Eclampsia": "preeclampsia",
    "HELLP Syndrome": "preeclampsia",
    "Hypertension, Pregnancy-Induced": "gestational-hypertension",
    "Placenta Previa": "placenta-disorders",
    "Abruptio Placentae": "placenta-disorders",
    "Placenta Accreta": "placenta-disorders",
    "Hyperemesis Gravidarum": "hyperemesis",
    "Morning Sickness": "morning-sickness",
    "Pregnancy, Ectopic": "pregnancy-complications",
    "Hydatidiform Mole": "pregnancy-complications",
    "Fetal Membranes, Premature Rupture": "pregnancy-complications",
    "Uterine Cervical Incompetence": "pregnancy-complications",
    "Cholestasis, Intrahepatic": "cholestasis",
    "Fetal Growth Retardation": "iugr-growth-restriction",
    "Postpartum Hemorrhage": "postpartum-hemorrhage",
    "Endometritis": "postpartum-infection",
    "Mastitis": "postpartum-infection",
    "Pelvic Floor Disorders": "pelvic-floor-dysfunction",
    "Urinary Incontinence": "pelvic-floor-dysfunction",

    # Conditions — Newborn/Infant
    "Jaundice, Neonatal": "jaundice",
    "Hyperbilirubinemia, Neonatal": "jaundice",
    "Gastroesophageal Reflux": "reflux-colic",
    "Colic": "reflux-colic",
    "Ankyloglossia": "tongue-lip-tie",
    "Lingual Frenum": "tongue-lip-tie",
    "Premature Birth": "nicu-prematurity",
    "Infant, Premature": "nicu-prematurity",
    "Intensive Care, Neonatal": "nicu-prematurity",
    "Heart Defects, Congenital": "congenital-conditions",
    "Congenital Abnormalities": "congenital-conditions",
    "Plagiocephaly": "plagiocephaly",
    "Torticollis": "plagiocephaly",
    "Hip Dislocation, Congenital": "hip-dysplasia",

    # Conditions — Childhood
    "Asthma": "allergies-asthma",
    "Hypersensitivity": "allergies-asthma",
    "Food Hypersensitivity": "allergies-asthma",
    "Respiratory Syncytial Virus Infections": "infectious-disease",
    "Croup": "infectious-disease",
    "Hand, Foot and Mouth Disease": "infectious-disease",
    "Communicable Diseases": "infectious-disease",
    "Fever": "fever-illness",
    "Otitis Media": "ear-infections",
    "Constipation": "gi-issues",
    "Gastroenteritis": "gi-issues",
    "Urinary Tract Infections": "uti-infections",
    "Eczema": "rashes-skin-conditions",

    # Conditions — Chronic
    "Diabetes Mellitus, Type 1": "chronic-conditions",
    "Epilepsy": "chronic-conditions",
    "Arthritis, Juvenile": "chronic-conditions",
    "Anemia, Sickle Cell": "chronic-conditions",
    "Cystic Fibrosis": "chronic-conditions",

    # Conditions — Neurodevelopmental
    "Autism Spectrum Disorder": "autism-spectrum",
    "Autistic Disorder": "autism-spectrum",
    "Attention Deficit Disorder with Hyperactivity": "adhd",
    "Dyslexia": "learning-disabilities",
    "Learning Disorders": "learning-disabilities",
    "Sensory Receptor Disorders": "sensory-processing",
    "Language Development Disorders": "speech-delay",
    "Cerebral Palsy": "cerebral-palsy",
    "Down Syndrome": "down-syndrome",
    "Intellectual Disability": "intellectual-disability",

    # Conditions — Cross-cutting
    "Circumcision, Male": "surgery-procedures",

    # Genetic screening
    "Genetic Testing": "genetic-screening",
    "Prenatal Diagnosis": "genetic-screening",
    "Amniocentesis": "genetic-screening",
    "Neonatal Screening": "genetic-screening",

    # Evidence
    "Systematic Reviews as Topic": "systematic-review",
    "Meta-Analysis as Topic": "systematic-review",
    "Randomized Controlled Trials as Topic": "rct",
    "Cohort Studies": "cohort-study",
    "Case-Control Studies": "case-control",
    "Practice Guidelines as Topic": "clinical-guidelines",
    "Case Reports": "case-report",

    # Approaches
    "Home Childbirth": "home-birth",
    "Water Birth": "water-birth",
    "Natural Childbirth": "natural-unmedicated",
    "Midwifery": "midwifery-model",
    "Nurse Midwives": "midwifery-model",
    "Doulas": "doula-supported",
    "Vaginal Birth after Cesarean": "vbac",
    "Complementary Therapies": "integrative-complementary",
    "Acupuncture": "integrative-complementary",
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
