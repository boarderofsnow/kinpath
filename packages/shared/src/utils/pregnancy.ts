import type { Child } from "../types/child";

// =============================================================================
// Baby Size Comparisons
// =============================================================================

export interface BabySizeComparison {
  week: number;
  object: string;
  lengthCm: number;
  weightDescription: string;
  emoji: string;
}

/**
 * Gestational week → relatable size comparison.
 * Sizes based on standard fetal development references.
 */
const SIZE_COMPARISONS: BabySizeComparison[] = [
  { week: 4, object: "poppy seed", lengthCm: 0.1, weightDescription: "less than 1g", emoji: "🌱" },
  { week: 5, object: "sesame seed", lengthCm: 0.2, weightDescription: "less than 1g", emoji: "🌱" },
  { week: 6, object: "lentil", lengthCm: 0.6, weightDescription: "less than 1g", emoji: "🫘" },
  { week: 7, object: "blueberry", lengthCm: 1.3, weightDescription: "less than 1g", emoji: "🫐" },
  { week: 8, object: "raspberry", lengthCm: 1.6, weightDescription: "about 1g", emoji: "🫐" },
  { week: 9, object: "cherry", lengthCm: 2.3, weightDescription: "about 2g", emoji: "🍒" },
  { week: 10, object: "strawberry", lengthCm: 3.1, weightDescription: "about 4g", emoji: "🍓" },
  { week: 11, object: "fig", lengthCm: 4.1, weightDescription: "about 7g", emoji: "🍇" },
  { week: 12, object: "lime", lengthCm: 5.4, weightDescription: "about 14g", emoji: "🍋" },
  { week: 13, object: "peach", lengthCm: 7.4, weightDescription: "about 23g", emoji: "🍑" },
  { week: 14, object: "lemon", lengthCm: 8.7, weightDescription: "about 43g", emoji: "🍋" },
  { week: 15, object: "apple", lengthCm: 10.1, weightDescription: "about 70g", emoji: "🍎" },
  { week: 16, object: "avocado", lengthCm: 11.6, weightDescription: "about 100g", emoji: "🥑" },
  { week: 17, object: "pear", lengthCm: 13.0, weightDescription: "about 140g", emoji: "🍐" },
  { week: 18, object: "bell pepper", lengthCm: 14.2, weightDescription: "about 190g", emoji: "🫑" },
  { week: 19, object: "mango", lengthCm: 15.3, weightDescription: "about 240g", emoji: "🥭" },
  { week: 20, object: "banana", lengthCm: 25.6, weightDescription: "about 300g", emoji: "🍌" },
  { week: 21, object: "carrot", lengthCm: 26.7, weightDescription: "about 360g", emoji: "🥕" },
  { week: 22, object: "papaya", lengthCm: 27.8, weightDescription: "about 430g", emoji: "🍈" },
  { week: 23, object: "grapefruit", lengthCm: 28.9, weightDescription: "about 500g", emoji: "🍊" },
  { week: 24, object: "ear of corn", lengthCm: 30.0, weightDescription: "about 600g", emoji: "🌽" },
  { week: 25, object: "rutabaga", lengthCm: 34.6, weightDescription: "about 660g", emoji: "🥔" },
  { week: 26, object: "zucchini", lengthCm: 35.6, weightDescription: "about 760g", emoji: "🥒" },
  { week: 27, object: "cauliflower", lengthCm: 36.6, weightDescription: "about 875g", emoji: "🥦" },
  { week: 28, object: "eggplant", lengthCm: 37.6, weightDescription: "about 1kg", emoji: "🍆" },
  { week: 29, object: "butternut squash", lengthCm: 38.6, weightDescription: "about 1.15kg", emoji: "🎃" },
  { week: 30, object: "coconut", lengthCm: 39.9, weightDescription: "about 1.3kg", emoji: "🥥" },
  { week: 31, object: "pineapple", lengthCm: 41.1, weightDescription: "about 1.5kg", emoji: "🍍" },
  { week: 32, object: "jicama", lengthCm: 42.4, weightDescription: "about 1.7kg", emoji: "🥔" },
  { week: 33, object: "celery bunch", lengthCm: 43.7, weightDescription: "about 1.9kg", emoji: "🥬" },
  { week: 34, object: "cantaloupe", lengthCm: 45.0, weightDescription: "about 2.1kg", emoji: "🍈" },
  { week: 35, object: "honeydew melon", lengthCm: 46.2, weightDescription: "about 2.4kg", emoji: "🍈" },
  { week: 36, object: "romaine lettuce", lengthCm: 47.4, weightDescription: "about 2.6kg", emoji: "🥬" },
  { week: 37, object: "Swiss chard bunch", lengthCm: 48.6, weightDescription: "about 2.9kg", emoji: "🥬" },
  { week: 38, object: "leek", lengthCm: 49.8, weightDescription: "about 3.0kg", emoji: "🥬" },
  { week: 39, object: "small watermelon", lengthCm: 50.7, weightDescription: "about 3.3kg", emoji: "🍉" },
  { week: 40, object: "watermelon", lengthCm: 51.2, weightDescription: "about 3.5kg", emoji: "🍉" },
];

/**
 * Get the baby size comparison for a given gestational week.
 */
export function getBabySizeComparison(gestationalWeek: number): BabySizeComparison | null {
  const clampedWeek = Math.max(4, Math.min(40, Math.round(gestationalWeek)));
  return SIZE_COMPARISONS.find((s) => s.week === clampedWeek) ?? null;
}

// =============================================================================
// Due Date Countdown
// =============================================================================

export interface DueDateCountdown {
  totalDaysRemaining: number;
  weeksRemaining: number;
  daysRemainder: number;
  percentComplete: number; // 0-100
  trimester: 1 | 2 | 3;
  gestationalWeek: number;
  milestone: string | null; // Current or upcoming milestone
  encouragement: string; // Weekly encouragement message
}

const MILESTONES: { week: number; label: string }[] = [
  { week: 8, label: "First ultrasound window" },
  { week: 12, label: "End of first trimester" },
  { week: 13, label: "Second trimester begins" },
  { week: 16, label: "You might feel movement soon" },
  { week: 20, label: "Halfway there!" },
  { week: 24, label: "Viability milestone" },
  { week: 27, label: "Third trimester begins" },
  { week: 28, label: "Third trimester" },
  { week: 32, label: "Baby shower time" },
  { week: 36, label: "Full term in one month" },
  { week: 37, label: "Early term — baby could arrive any day" },
  { week: 39, label: "Full term" },
  { week: 40, label: "Due date week" },
];

const WEEKLY_ENCOURAGEMENTS: Record<number, string> = {
  4: "A tiny miracle is just beginning. Take it one day at a time.",
  5: "Your baby's heart is starting to form this week.",
  6: "Tiny arms and legs are budding. You're doing amazing.",
  7: "Baby's brain is growing rapidly. Rest when you need to.",
  8: "Fingers and toes are forming. What a journey you're on.",
  9: "Baby can make tiny movements now, even if you can't feel them yet.",
  10: "All major organs are formed. The foundation is set.",
  11: "Baby is starting to look more human-shaped. Almost out of the first trimester!",
  12: "The first trimester finish line is in sight. You made it through the toughest part.",
  13: "Welcome to the second trimester! Energy levels often improve from here.",
  14: "Baby might be making facial expressions. The adventure continues.",
  15: "Baby can sense light now. Things are getting exciting.",
  16: "You might start feeling those first little flutters soon.",
  17: "Baby's skeleton is hardening from cartilage to bone.",
  18: "Baby might be yawning and stretching in there. So cozy.",
  19: "Almost halfway! Take a moment to celebrate how far you've come.",
  20: "Halfway milestone! Baby can hear your voice now.",
  21: "Baby's movements are getting stronger. Such an incredible feeling.",
  22: "Baby's senses are developing rapidly. Talk and sing to them.",
  23: "Baby's face is fully formed. They look like a tiny human.",
  24: "A big milestone — baby has reached viability. You're incredible.",
  25: "Baby is gaining weight and getting stronger every day.",
  26: "Baby's eyes are opening. They're starting to see the world.",
  27: "Welcome to the third trimester! The home stretch.",
  28: "Baby is dreaming now. Sweet dreams, little one.",
  29: "Baby's bones are soaking up calcium. Keep up the good nutrition.",
  30: "Ten weeks to go. Baby is getting ready to meet you.",
  31: "Baby's brain is making billions of connections. Incredible.",
  32: "Baby is practicing breathing motions. Almost ready.",
  33: "Baby's immune system is developing. You're giving them a great start.",
  34: "Baby's lungs are maturing. Almost there.",
  35: "Baby is gaining about half a pound per week now.",
  36: "Full term is just around the corner. You've got this.",
  37: "Baby is officially early term. They could arrive any day.",
  38: "Baby is shedding the waxy coating. Getting ready for their debut.",
  39: "Full term! Baby is ready when they're ready.",
  40: "Due date week! Remember, only 5% of babies arrive on their due date.",
};

/**
 * Calculate the full due date countdown for a prenatal child.
 */
export function getDueDateCountdown(child: Child, now: Date = new Date()): DueDateCountdown | null {
  if (child.is_born || !child.due_date) return null;

  const dueDate = new Date(child.due_date);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const totalDaysRemaining = Math.max(0, Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const weeksRemaining = Math.floor(totalDaysRemaining / 7);
  const daysRemainder = totalDaysRemaining % 7;

  // Gestational week (40 weeks total pregnancy)
  const gestationalWeek = Math.min(40, Math.max(1, 40 - weeksRemaining));
  const percentComplete = Math.min(100, Math.round((gestationalWeek / 40) * 100));

  const trimester: 1 | 2 | 3 =
    gestationalWeek <= 12 ? 1 : gestationalWeek <= 26 ? 2 : 3;

  // Find current or upcoming milestone
  const milestone = MILESTONES.find((m) => m.week >= gestationalWeek)?.label ?? "Almost there!";

  // Get encouragement for the current week
  const encouragement =
    WEEKLY_ENCOURAGEMENTS[gestationalWeek] ??
    "Every day brings you closer to meeting your little one.";

  return {
    totalDaysRemaining,
    weeksRemaining,
    daysRemainder,
    percentComplete,
    trimester,
    gestationalWeek,
    milestone,
    encouragement,
  };
}

// =============================================================================
// Planning Tips
// =============================================================================

export interface PlanningTip {
  week: number;
  category: "health" | "preparation" | "shopping" | "social" | "self_care";
  tip: string;
  icon: string;
}

/**
 * Get planning tips for the current gestational week.
 * Returns tips for the current week plus a few upcoming weeks.
 */
export function getPlanningTips(
  gestationalWeek: number,
  lookAheadWeeks: number = 2
): PlanningTip[] {
  const start = Math.max(4, gestationalWeek);
  const end = Math.min(40, gestationalWeek + lookAheadWeeks);

  return PLANNING_TIPS.filter((tip) => tip.week >= start && tip.week <= end);
}

const PLANNING_TIPS: PlanningTip[] = [
  // First trimester
  { week: 5, category: "health", tip: "Schedule your first prenatal appointment", icon: "calendar" },
  { week: 6, category: "self_care", tip: "Start a daily prenatal vitamin if you haven't already", icon: "pill" },
  { week: 8, category: "health", tip: "Your first ultrasound may be coming up — exciting!", icon: "heart" },
  { week: 9, category: "self_care", tip: "Rest is important right now. Listen to your body.", icon: "moon" },
  { week: 10, category: "social", tip: "Decide when you'd like to share the news with close family", icon: "users" },
  { week: 11, category: "health", tip: "Genetic screening tests are often offered around now", icon: "clipboard" },
  { week: 12, category: "social", tip: "Many families start sharing the news after the first trimester", icon: "megaphone" },

  // Second trimester
  { week: 13, category: "shopping", tip: "Start browsing maternity clothes — comfort matters", icon: "shopping-bag" },
  { week: 14, category: "health", tip: "Great time to start gentle prenatal exercise if cleared by your provider", icon: "activity" },
  { week: 16, category: "preparation", tip: "Start thinking about childcare options — waitlists fill up fast", icon: "search" },
  { week: 18, category: "health", tip: "Anatomy scan usually happens between weeks 18-22", icon: "scan" },
  { week: 20, category: "preparation", tip: "Start your baby registry — halfway is a great time to begin", icon: "gift" },
  { week: 22, category: "preparation", tip: "Research pediatricians in your area", icon: "search" },
  { week: 24, category: "preparation", tip: "Consider signing up for a childbirth class", icon: "book" },
  { week: 25, category: "health", tip: "Glucose screening test is usually done around weeks 24-28", icon: "clipboard" },
  { week: 26, category: "preparation", tip: "Start thinking about your birth plan", icon: "file-text" },

  // Third trimester
  { week: 28, category: "preparation", tip: "Begin setting up the nursery — nesting mode activated!", icon: "home" },
  { week: 29, category: "health", tip: "Count baby's kicks daily — 10 movements in 2 hours is typical", icon: "activity" },
  { week: 30, category: "preparation", tip: "Research car seat options and practice installation", icon: "car" },
  { week: 31, category: "preparation", tip: "Write or finalize your birth plan", icon: "file-text" },
  { week: 32, category: "shopping", tip: "Stock up on newborn essentials — diapers, onesies, burp cloths", icon: "shopping-bag" },
  { week: 33, category: "social", tip: "Baby shower time! Enjoy celebrating with loved ones", icon: "gift" },
  { week: 34, category: "preparation", tip: "Pre-register at your hospital or birth center", icon: "clipboard" },
  { week: 35, category: "preparation", tip: "Install the car seat and have it inspected", icon: "check-circle" },
  { week: 36, category: "preparation", tip: "Pack your hospital bag — it's almost go-time!", icon: "briefcase" },
  { week: 37, category: "preparation", tip: "Prep some freezer meals for postpartum recovery", icon: "utensils" },
  { week: 38, category: "self_care", tip: "Rest, relax, and soak in these last days. You're ready.", icon: "sun" },
  { week: 39, category: "health", tip: "Know the signs of labor — timing contractions, water breaking", icon: "clock" },
  { week: 40, category: "self_care", tip: "Due dates are estimates. Baby will come when ready. You've got this!", icon: "heart" },
];
