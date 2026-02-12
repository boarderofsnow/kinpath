import type { SubscriptionTier } from "./subscription";

export type BirthPreference = "home" | "hospital" | "birth_center" | "undecided";
export type FeedingPreference = "breastfeeding" | "formula" | "combination" | "undecided";
export type VaccineStance = "standard" | "delayed" | "selective" | "hesitant" | "prefer_not_to_say";
export type ParentingStyle = "attachment" | "gentle" | "montessori" | "rie" | "no_preference";
export type DietaryPreference = "omnivore" | "vegetarian" | "vegan" | "kosher" | "halal" | "other";

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  onboarding_complete: boolean;
  subscription_tier: SubscriptionTier;
  stripe_customer_id: string | null;
  rc_customer_id: string | null;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  birth_preference: BirthPreference | null;
  feeding_preference: FeedingPreference | null;
  vaccine_stance: VaccineStance | null;
  religion: string | null;
  dietary_preference: DietaryPreference | null;
  parenting_style: ParentingStyle | null;
  topics_of_interest: string[];
  updated_at: string;
}
