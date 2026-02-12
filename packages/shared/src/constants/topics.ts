export const TOPICS = {
  prenatal: { label: "Prenatal Care", icon: "baby" },
  newborn_care: { label: "Newborn Care", icon: "heart" },
  nutrition_and_diet: { label: "Nutrition & Diet", icon: "apple" },
  vaccinations: { label: "Vaccinations", icon: "syringe" },
  breastfeeding: { label: "Breastfeeding & Feeding", icon: "droplet" },
  emotional_wellness: { label: "Emotional Wellness", icon: "smile" },
  sleep: { label: "Sleep", icon: "moon" },
  milestones: { label: "Milestones", icon: "flag" },
  safety: { label: "Safety", icon: "shield" },
  postpartum: { label: "Postpartum", icon: "flower" },
  infant_development: { label: "Infant Development", icon: "trending-up" },
  toddler_development: { label: "Toddler Development", icon: "footprints" },
  relationships: { label: "Relationships & Co-Parenting", icon: "users" },
} as const;

export type TopicKey = keyof typeof TOPICS;
export const TOPIC_KEYS = Object.keys(TOPICS) as TopicKey[];
