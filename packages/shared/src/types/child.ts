export interface Child {
  id: string;
  user_id: string;
  name: string;
  due_date: string | null; // ISO date string, for prenatal tracking
  dob: string | null; // ISO date string, set once born
  is_born: boolean;
  created_at: string;
}

export interface ChildWithAge extends Child {
  age_in_weeks: number; // negative = prenatal, 0 = birth, positive = postnatal
  age_label: string; // e.g., "32 weeks pregnant", "3 months old", "2 years old"
}

export interface BirthUpdate {
  dob: string; // ISO date string
  name?: string; // optional name update (some parents use placeholder names during pregnancy)
}

export interface BirthUpdateSuggestion {
  child_name: string;
  dob: string; // ISO date string, or "unknown" if not mentioned
  detected_phrase: string;
}
