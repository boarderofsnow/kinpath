export type ResourceType = "article" | "checklist" | "video" | "guide" | "infographic";

export type ResourceStatus =
  | "draft"
  | "in_review"
  | "published"
  | "rejected"
  | "archived";

export type ReviewStatus = "approved" | "rejected" | "needs_revision";

export interface Resource {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string; // Markdown content
  resource_type: ResourceType;
  source_url: string | null;
  age_start_weeks: number; // -40 (conception) to 260 (age 5)
  age_end_weeks: number;
  status: ResourceStatus;
  vetted_at: string | null;
  vetted_by: string | null;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface VettingInfo {
  vetted_at: string;
  reviewer_name: string;
  reviewer_credentials: string;
}

export interface ResourceWithMeta extends Resource {
  topics: string[];
  tags: string[];
  relevance_score?: number; // Calculated during feed personalization
  is_vetted: boolean; // Derived: true if vetted_at is not null
  vetting_info?: VettingInfo; // Populated when is_vetted is true
}

export interface ProfessionalReview {
  id: string;
  resource_id: string;
  reviewer_id: string;
  status: ReviewStatus;
  review_notes: string | null;
  credentials_verified: boolean;
  reviewed_at: string;
}

export interface Reviewer {
  id: string;
  user_id: string;
  full_name: string;
  credentials: string; // e.g., "MD", "RN", "IBCLC", "RD"
  specialty: string | null;
  verified: boolean;
  active: boolean;
}
