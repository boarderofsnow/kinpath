export interface DevelopmentalMilestone {
  id: string;
  domain: "motor" | "language" | "cognitive" | "social";
  title: string;
  description: string;
  min_weeks: number;
  max_weeks: number;
}

const DOMAIN_LABELS = {
  motor: "Motor Skills",
  language: "Language",
  cognitive: "Cognitive",
  social: "Social & Emotional",
} as const;

export { DOMAIN_LABELS };

export const DEVELOPMENTAL_MILESTONES: DevelopmentalMilestone[] = [
  // ── 0-1 months (0-4 weeks) ──
  { id: "m-0-1", domain: "motor", title: "Lifts head briefly during tummy time", description: "Baby can raise head for a few seconds while on stomach", min_weeks: 0, max_weeks: 6 },
  { id: "m-0-2", domain: "motor", title: "Brings hands to face", description: "Baby discovers their hands and brings them near mouth or eyes", min_weeks: 0, max_weeks: 6 },
  { id: "l-0-1", domain: "language", title: "Reacts to loud sounds", description: "Baby startles or quiets in response to sudden noises", min_weeks: 0, max_weeks: 6 },
  { id: "s-0-1", domain: "social", title: "Recognizes caregiver's voice", description: "Baby calms down when hearing a familiar voice", min_weeks: 0, max_weeks: 6 },
  { id: "c-0-1", domain: "cognitive", title: "Focuses on faces 8-12 inches away", description: "Baby can focus on objects and faces at close range", min_weeks: 0, max_weeks: 6 },

  // ── 2 months (5-12 weeks) ──
  { id: "m-2-1", domain: "motor", title: "Holds head up during tummy time", description: "Baby can sustain head lift while on stomach", min_weeks: 5, max_weeks: 12 },
  { id: "s-2-1", domain: "social", title: "First social smile", description: "Baby smiles in response to interaction, not just reflexively", min_weeks: 5, max_weeks: 12 },
  { id: "l-2-1", domain: "language", title: "Coos and makes gurgling sounds", description: "Baby begins making vowel-like sounds", min_weeks: 5, max_weeks: 12 },
  { id: "c-2-1", domain: "cognitive", title: "Follows objects with eyes", description: "Baby tracks a moving toy or face with their gaze", min_weeks: 5, max_weeks: 12 },

  // ── 4 months (13-20 weeks) ──
  { id: "m-4-1", domain: "motor", title: "Pushes up on elbows during tummy time", description: "Baby lifts chest off the floor with arm support", min_weeks: 13, max_weeks: 20 },
  { id: "m-4-2", domain: "motor", title: "Grasps toys placed in hand", description: "Baby can hold and briefly shake a rattle or toy", min_weeks: 13, max_weeks: 20 },
  { id: "l-4-1", domain: "language", title: "Babbles with expression", description: "Baby strings together vowels and varies pitch", min_weeks: 13, max_weeks: 20 },
  { id: "s-4-1", domain: "social", title: "Laughs out loud", description: "Baby responds to playful interaction with laughter", min_weeks: 13, max_weeks: 20 },
  { id: "c-4-1", domain: "cognitive", title: "Reaches for toys", description: "Baby purposefully reaches toward objects of interest", min_weeks: 13, max_weeks: 20 },

  // ── 6 months (21-30 weeks) ──
  { id: "m-6-1", domain: "motor", title: "Rolls over (both directions)", description: "Baby can roll from tummy to back and back to tummy", min_weeks: 21, max_weeks: 30 },
  { id: "m-6-2", domain: "motor", title: "Sits with support", description: "Baby can sit upright when propped or supported", min_weeks: 21, max_weeks: 30 },
  { id: "l-6-1", domain: "language", title: "Responds to own name", description: "Baby turns head when their name is called", min_weeks: 21, max_weeks: 30 },
  { id: "s-6-1", domain: "social", title: "Shows interest in mirror reflection", description: "Baby is fascinated by their own reflection", min_weeks: 21, max_weeks: 30 },
  { id: "c-6-1", domain: "cognitive", title: "Passes objects between hands", description: "Baby transfers a toy from one hand to the other", min_weeks: 21, max_weeks: 30 },

  // ── 9 months (31-43 weeks) ──
  { id: "m-9-1", domain: "motor", title: "Sits without support", description: "Baby sits steadily on their own", min_weeks: 31, max_weeks: 43 },
  { id: "m-9-2", domain: "motor", title: "Crawls or scoots", description: "Baby moves across the floor using hands and knees or other methods", min_weeks: 31, max_weeks: 43 },
  { id: "m-9-3", domain: "motor", title: "Pulls to stand", description: "Baby uses furniture to pull themselves up to standing", min_weeks: 31, max_weeks: 43 },
  { id: "l-9-1", domain: "language", title: "Says 'mama' or 'dada' (nonspecific)", description: "Baby uses babbling sounds that resemble words", min_weeks: 31, max_weeks: 43 },
  { id: "s-9-1", domain: "social", title: "Shows stranger anxiety", description: "Baby is wary of unfamiliar people, prefers known caregivers", min_weeks: 31, max_weeks: 43 },
  { id: "c-9-1", domain: "cognitive", title: "Looks for hidden objects", description: "Baby searches for a toy that was partially hidden — object permanence", min_weeks: 31, max_weeks: 43 },
  { id: "c-9-2", domain: "cognitive", title: "Uses pincer grasp", description: "Baby picks up small objects between thumb and forefinger", min_weeks: 31, max_weeks: 43 },

  // ── 12 months (44-60 weeks) ──
  { id: "m-12-1", domain: "motor", title: "Stands without holding on", description: "Baby can balance on their own two feet briefly", min_weeks: 44, max_weeks: 60 },
  { id: "m-12-2", domain: "motor", title: "Takes first steps", description: "Baby walks a few steps independently", min_weeks: 44, max_weeks: 65 },
  { id: "l-12-1", domain: "language", title: "Says 1-3 words meaningfully", description: "Baby uses 'mama', 'dada', or another word with intent", min_weeks: 44, max_weeks: 60 },
  { id: "l-12-2", domain: "language", title: "Follows simple instructions", description: "Baby understands 'give me' or 'come here' with gestures", min_weeks: 44, max_weeks: 60 },
  { id: "s-12-1", domain: "social", title: "Waves bye-bye", description: "Baby imitates waving gesture when prompted or spontaneously", min_weeks: 44, max_weeks: 60 },
  { id: "c-12-1", domain: "cognitive", title: "Points to things of interest", description: "Baby uses index finger to show or request", min_weeks: 44, max_weeks: 60 },

  // ── 18 months (65-86 weeks) ──
  { id: "m-18-1", domain: "motor", title: "Walks steadily", description: "Toddler walks with confidence and rarely falls", min_weeks: 65, max_weeks: 86 },
  { id: "m-18-2", domain: "motor", title: "Stacks 2-3 blocks", description: "Child can balance blocks on top of each other", min_weeks: 65, max_weeks: 86 },
  { id: "l-18-1", domain: "language", title: "Uses 10-20 words", description: "Toddler has a growing vocabulary of recognizable words", min_weeks: 65, max_weeks: 86 },
  { id: "l-18-2", domain: "language", title: "Points to body parts", description: "Child can identify nose, eyes, ears when asked", min_weeks: 65, max_weeks: 86 },
  { id: "s-18-1", domain: "social", title: "Plays simple pretend", description: "Toddler pretends to feed a doll or talk on a phone", min_weeks: 65, max_weeks: 86 },
  { id: "c-18-1", domain: "cognitive", title: "Knows what everyday objects are for", description: "Child uses a phone, cup, or brush correctly", min_weeks: 65, max_weeks: 86 },

  // ── 2 years (87-120 weeks) ──
  { id: "m-24-1", domain: "motor", title: "Kicks a ball", description: "Child can kick a ball forward with some accuracy", min_weeks: 87, max_weeks: 120 },
  { id: "m-24-2", domain: "motor", title: "Runs", description: "Child can run, though may be unsteady", min_weeks: 87, max_weeks: 120 },
  { id: "l-24-1", domain: "language", title: "Uses 2-word phrases", description: "Child combines words: 'more milk', 'daddy go'", min_weeks: 87, max_weeks: 120 },
  { id: "l-24-2", domain: "language", title: "Names pictures in books", description: "Child can identify and name common objects in pictures", min_weeks: 87, max_weeks: 120 },
  { id: "s-24-1", domain: "social", title: "Plays alongside other children", description: "Child engages in parallel play near other kids", min_weeks: 87, max_weeks: 120 },
  { id: "c-24-1", domain: "cognitive", title: "Sorts shapes and colors", description: "Child can match basic shapes and group by color", min_weeks: 87, max_weeks: 120 },
  { id: "c-24-2", domain: "cognitive", title: "Completes simple puzzles", description: "Child can fit pieces into a 3-4 piece puzzle", min_weeks: 87, max_weeks: 120 },

  // ── 3 years (121-170 weeks) ──
  { id: "m-36-1", domain: "motor", title: "Pedals a tricycle", description: "Child can pedal and steer a three-wheeled bike", min_weeks: 121, max_weeks: 170 },
  { id: "m-36-2", domain: "motor", title: "Climbs well", description: "Child climbs playground structures and stairs with alternating feet", min_weeks: 121, max_weeks: 170 },
  { id: "l-36-1", domain: "language", title: "Speaks in 3-4 word sentences", description: "Child forms simple sentences: 'I want juice'", min_weeks: 121, max_weeks: 170 },
  { id: "l-36-2", domain: "language", title: "Strangers can understand most speech", description: "About 75% of speech is understandable to unfamiliar listeners", min_weeks: 121, max_weeks: 170 },
  { id: "s-36-1", domain: "social", title: "Takes turns in games", description: "Child understands and practices turn-taking", min_weeks: 121, max_weeks: 170 },
  { id: "s-36-2", domain: "social", title: "Shows a range of emotions", description: "Child expresses happiness, sadness, frustration, and empathy", min_weeks: 121, max_weeks: 170 },
  { id: "c-36-1", domain: "cognitive", title: "Engages in fantasy play", description: "Child creates imaginative scenarios with toys and characters", min_weeks: 121, max_weeks: 170 },
  { id: "c-36-2", domain: "cognitive", title: "Understands 'same' and 'different'", description: "Child can compare objects and identify matches", min_weeks: 121, max_weeks: 170 },

  // ── 4 years (171-220 weeks) ──
  { id: "m-48-1", domain: "motor", title: "Hops on one foot", description: "Child can hop several times on one foot", min_weeks: 171, max_weeks: 220 },
  { id: "m-48-2", domain: "motor", title: "Uses scissors", description: "Child can cut along a line with child-safe scissors", min_weeks: 171, max_weeks: 220 },
  { id: "l-48-1", domain: "language", title: "Tells stories", description: "Child narrates events and creates simple stories", min_weeks: 171, max_weeks: 220 },
  { id: "l-48-2", domain: "language", title: "Knows some letters and numbers", description: "Child can recognize and name several letters and count objects", min_weeks: 171, max_weeks: 220 },
  { id: "s-48-1", domain: "social", title: "Cooperates with other children", description: "Child plays together with others, shares, and negotiates", min_weeks: 171, max_weeks: 220 },
  { id: "s-48-2", domain: "social", title: "Talks about interests and preferences", description: "Child can express what they like and dislike", min_weeks: 171, max_weeks: 220 },
  { id: "c-48-1", domain: "cognitive", title: "Counts to 10+", description: "Child can count objects and understand basic quantity", min_weeks: 171, max_weeks: 220 },
  { id: "c-48-2", domain: "cognitive", title: "Draws a person with 2-4 body parts", description: "Child creates recognizable figure drawings", min_weeks: 171, max_weeks: 220 },

  // ── 5 years (221-260 weeks) ──
  { id: "m-60-1", domain: "motor", title: "Skips and jumps", description: "Child can skip, hop, and jump with coordination", min_weeks: 221, max_weeks: 260 },
  { id: "m-60-2", domain: "motor", title: "Writes some letters and numbers", description: "Child can print their name and draw recognizable shapes", min_weeks: 221, max_weeks: 260 },
  { id: "l-60-1", domain: "language", title: "Speaks in full sentences", description: "Child uses complex sentences and correct grammar most of the time", min_weeks: 221, max_weeks: 260 },
  { id: "l-60-2", domain: "language", title: "Retells a story", description: "Child can summarize a familiar story with key details", min_weeks: 221, max_weeks: 260 },
  { id: "s-60-1", domain: "social", title: "Understands rules and fairness", description: "Child grasps concepts of rules, taking turns, and fair play", min_weeks: 221, max_weeks: 260 },
  { id: "c-60-1", domain: "cognitive", title: "Understands time concepts", description: "Child comprehends yesterday, today, tomorrow, and days of the week", min_weeks: 221, max_weeks: 260 },
  { id: "c-60-2", domain: "cognitive", title: "Counts to 20+ and does simple addition", description: "Child understands basic math concepts", min_weeks: 221, max_weeks: 260 },
];
