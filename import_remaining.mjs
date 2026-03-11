import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mxxkvtavdwujfbucnrnf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14eGt2dGF2ZHd1amZidWNucm5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDg1OTAyMCwiZXhwIjoyMDg2NDM1MDIwfQ.HmEKZ6SBjAlVm2PnUjP7v3bx5iTGOmEgTBrFI3eLZA4',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const missingResources = [
  {
    title: "Navigating Sleep Regressions",
    slug: "navigating-sleep-regressions",
    summary: "Understand common sleep regressions, their developmental basis, and strategies for managing them.",
    body: `# Navigating Sleep Regressions

Sleep regressions—temporary periods of disrupted sleep despite previously established good sleep habits—are normal developmental phenomena that occur as infants' brains undergo significant maturation. Understanding the developmental basis and expected duration of regressions helps parents respond calmly rather than abandoning effective sleep strategies during temporary setbacks.

## Common Regression Periods

The 4-month sleep regression coincides with major changes in sleep architecture as REM sleep organization matures. Infants' sleep cycles consolidate and deepen, temporarily disrupting the light, easily maintained sleep of younger infants. This regression affects most infants, typically lasting 2-6 weeks.

The 8-month regression often coincides with separation anxiety development and increased mobility. Infants become more aware of caregiver absence and more mobile in the crib, both factors disrupting sleep. The 12-month regression frequently accompanies language development, cognitive leaps, and the neurological changes supporting increased motor skills.

Other sleep regressions occur around 18 months and 2-3 years, coinciding with language explosions, toilet training readiness, and increased autonomy and independence. While exact timing varies individually, awareness of these developmental windows helps parents recognize regressions as temporary rather than permanent setbacks.

## Recognizing Regression vs. Illness or Hunger

Actual regressions appear suddenly in infants previously sleeping well without obvious cause. The infant returns to patterns from earlier developmental stages—frequent waking, difficulty falling asleep, or extended nighttime wake periods—without fever, pain, or other signs of acute illness.

Before assuming a regression, rule out other causes of sleep disruption. Teething pain, ear infections, gastroesophageal reflux, hunger (particularly during growth spurts), developmental discomfort from new mobility, or environmental changes might explain sleep changes and warrant specific interventions beyond standard regression management.

## Response Strategies

During regressions, parents should maintain established sleep routines and consistent responses while showing extra patience and empathy. The infant is not behaving badly intentionally but rather struggling with developmental changes affecting sleep capacity. Temporary increases in nighttime parental involvement—such as additional soothing or brief bed-sharing—can ease the transition without permanently disrupting sleep habits.

Consistently implementing the same responses used during better-sleep periods signals to the infant that sleep expectations remain unchanged. If sleep training methods were previously used, maintaining consistency proves important, as regressive behavior typically resolves more quickly when expectations stay constant.

## Duration and Resolution

Most regressions resolve within 1-6 weeks as the infant's nervous system adjusts to new developmental capabilities. Sleep typically improves as rapidly as it deteriorated without requiring intervention changes. Some regression periods extend longer if concurrent developmental challenges occur simultaneously.

Keeping sleep logs during regressions helps parents track patterns and recognize when the disruption is resolving. This objective documentation prevents the tendency to catastrophize temporary setbacks. Communicating with your pediatrician about regression timing and characteristics provides reassurance and guidance specific to your infant's individual development.`,
    resource_type: "article",
    source_url: "https://www.aap.org/en/patient-care-and-public-health/aap-healthy-children-magazine/",
    age_start_weeks: 16,
    age_end_weeks: 104,
    status: "published",
    is_premium: false
  },
  {
    title: "Childproofing Your Home Room by Room",
    slug: "childproofing-home-room-room",
    summary: "Complete checklist for identifying and eliminating hazards throughout your home.",
    body: `# Childproofing Your Home Room by Room

## Kitchen Hazards and Safety Measures

The kitchen presents multiple hazards requiring systematic attention. Store all medications, cleaning supplies, and dangerous substances in locked cabinets or high shelves beyond reach. Ensure cabinet locks are sturdy and resist repeated testing by curious toddlers.

Knobs and handles on ovens, stovetops, and drawers containing sharp objects need protective devices. Use back burners when cooking and keep pot handles turned inward to prevent reaching. Keep electrical cords from appliances wrapped or secured to prevent pulling. Secure the refrigerator if your child can access it to prevent weight-related tipping hazards.

## Living Areas and General Spaces

Remove or secure furniture that could tip when climbed or pulled, including bookshelves, dressers, and entertainment units. Use furniture anchors to secure pieces to walls. Remove decorative items from low tables that could be pulled down. Ensure all electrical outlets are covered with tamper-resistant outlet covers or dummy plugs.

Secure window blind cords and drape cords out of reach to prevent strangulation hazards. Install window guards on windows above the first floor. Cover hard furniture corners with edge guards or corner protectors. Keep houseplants, including toxic varieties like philodendron and dieffenbachia, out of reach or eliminate them entirely.

## Bathrooms

Never leave standing water in tubs or buckets, as infants and toddlers can drown in 1-2 inches of water. Set water heater temperature to 120 degrees Fahrenheit to prevent scalding. Install tub temperature monitors to alert caregivers to dangerous water temperatures.

Store all medications, supplements, and toiletries in locked cabinets. Drain and store toilet seats in locked position or install automatic toilet-seat locks. Ensure bath toys are free of mold and stored in mesh bags allowing drainage. Remove extension cords and electrical appliances from bathroom access areas.

## Bedrooms and Sleep Areas

Keep cribs away from windows with corded blinds. Do not hang wall decorations above sleep surfaces. Ensure bumper pads are firmly secured if used. Once infants show climbing ability, remove decorative items from dresser tops and ensure dressers are anchored.

Secure pillows, blankets, and soft objects in a separate location rather than the sleep space. Inspect mattresses regularly for wear or exposed springs. Keep nightlights dimly lit and positioned away from the infant's direct line of sight to prevent visual stimulation.

## Stairways and Falls

Install safety gates at the top and bottom of all stairways. Ensure gates are properly installed and cannot be pushed open by a determined toddler. Keep stairs clear of toys and other tripping hazards. Install handrails at appropriate height for toddlers to use when learning to navigate stairs independently.

Remove throw rugs from stairs and slippery flooring. Ensure stair treads have adequate traction. Close off access to balconies and decks with secure barriers. Test all gates, railings, and protective barriers regularly to ensure they remain secure.

## Specific Equipment and Hazard Prevention

Choking hazards include small objects, coins, small toys, and foods. Perform a thorough floor search on hands and knees, viewing the space from a toddler's perspective. Remove balloons, plastic bags, and small parts from toys. Cut grapes and hot dogs lengthwise and then in quarters to prevent choking.

Regularly inspect toys for age-appropriateness and signs of wear. Keep cords, strings, and ribbons inaccessible. Store heavy objects securely to prevent tipping. Install carbon monoxide detectors and smoke detectors, testing regularly and replacing batteries twice yearly.`,
    resource_type: "checklist",
    source_url: "https://www.aap.org/en/patient-care-and-public-health/aap-healthy-children-magazine/",
    age_start_weeks: 20,
    age_end_weeks: 156,
    status: "published",
    is_premium: false
  },
  {
    title: "Herd Immunity and Why Vaccination Rates Matter",
    slug: "herd-immunity-community-protection",
    summary: "Understand how community vaccination rates protect vulnerable individuals who cannot be vaccinated and why population-level immunization is crucial for disease control.",
    body: `# Herd Immunity and Why Vaccination Rates Matter

Vaccination creates protection at two levels: individual and community. Herd immunity—also called community immunity—is a critical public health concept that explains why vaccination rates matter even for healthy, well-protected individuals.

## How Herd Immunity Works

When a sufficient percentage of a population is vaccinated against a contagious disease, transmission becomes difficult. The virus or bacterium cannot find enough susceptible hosts to establish chains of transmission. This creates a protective barrier around vulnerable individuals—newborns too young for certain vaccines, people with immunosuppression, those with severe allergies to vaccine components, and the small percentage of vaccinated individuals whose immune systems don't develop adequate protection.

The threshold varies by disease. Measles requires approximately 95% population immunity to maintain herd immunity. Polio requires roughly 85-95%. Whooping cough requires approximately 85%. When communities fall below these thresholds, outbreaks occur, often affecting the most vulnerable first.

## Why Vulnerable Populations Depend on Herd Immunity

Newborns cannot receive many vaccines until specific ages when their immune systems are mature enough to respond effectively. During the first weeks and months, protection relies heavily on herd immunity and maternal antibodies. Infants hospitalized in neonatal intensive care units are particularly vulnerable and depend entirely on community protection.

Immunocompromised individuals—children undergoing cancer treatment, those with primary immunodeficiency disorders, organ transplant recipients—cannot be vaccinated or may not develop adequate immunity even with vaccination. These individuals' survival depends on robust community vaccination rates.

Pregnant individuals cannot receive live attenuated vaccines and may have other vaccination limitations. Their fetuses, particularly in the first and early second trimester when many organs are developing, depend on community-level disease control.

## The Obligation to Community

When vaccination rates decline in communities, protection erodes systematically. Historical data demonstrates this principle: following reductions in measles vaccination rates in specific communities, measles outbreaks occurred, sometimes resulting in deaths among unvaccinated and vulnerable individuals.

Maintaining herd immunity represents a collective responsibility. Each vaccination decision affects not only the individual child but also the surrounding community. This is particularly important when families have choice about vaccination—those with medical access and ability to vaccinate have a special responsibility to ensure community protection for those without equivalent access.

## Vaccination and Disease Elimination

Several diseases have been eliminated or nearly eliminated globally through sustained high vaccination rates. Smallpox is eradicated. Polio exists in only a handful of countries. These achievements demonstrate the power of sustained, community-wide vaccination commitment.

Maintaining vaccination rates sufficient for herd immunity is essential to prevent the return of diseases that once killed thousands of children annually.`,
    resource_type: "article",
    source_url: "https://www.who.int/news-room/questions-and-answers/item/vaccines-and-immunization-herd-immunity",
    age_start_weeks: 0,
    age_end_weeks: 260,
    status: "published",
    is_premium: false
  }
];

const topicMappings = [
  { slug: "navigating-sleep-regressions", topic_id: "sleep" },
  { slug: "childproofing-home-room-room", topic_id: "safety" },
  { slug: "herd-immunity-community-protection", topic_id: "vaccinations" },
];

async function importRemaining() {
  console.log("Inserting 3 remaining resources...");

  for (const resource of missingResources) {
    const { data, error } = await supabase
      .from('resources')
      .upsert(resource, { onConflict: 'slug' })
      .select('id, slug');

    if (error) {
      console.error(`Error inserting "${resource.slug}":`, error.message);
    } else {
      console.log(`Inserted: ${resource.slug}`);
    }
  }

  console.log("\nInserting topic mappings...");
  for (const mapping of topicMappings) {
    const { data: resource } = await supabase
      .from('resources')
      .select('id')
      .eq('slug', mapping.slug)
      .single();

    if (resource) {
      const { error } = await supabase
        .from('resource_topics')
        .upsert({ resource_id: resource.id, topic_id: mapping.topic_id },
                { onConflict: 'resource_id,topic_id' });
      if (error) {
        console.error(`Mapping error ${mapping.slug} -> ${mapping.topic_id}:`, error.message);
      } else {
        console.log(`Mapped: ${mapping.slug} -> ${mapping.topic_id}`);
      }
    }
  }

  const { count } = await supabase
    .from('resources')
    .select('*', { count: 'exact', head: true });
  console.log(`\nTotal resources in database: ${count}`);
}

importRemaining().catch(console.error);
