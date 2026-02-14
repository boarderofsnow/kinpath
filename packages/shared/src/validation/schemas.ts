import { z } from "zod";

// ---- Child Schemas ----

const childBaseSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  due_date: z.string().datetime().nullable().optional(),
  dob: z.string().datetime().nullable().optional(),
  is_born: z.boolean().default(false),
});

export const createChildSchema = childBaseSchema.refine(
  (data) => data.due_date || data.dob,
  { message: "Either a due date or date of birth is required" }
);

export const updateChildSchema = childBaseSchema.partial();

// ---- Preferences Schemas ----

export const userPreferencesSchema = z.object({
  birth_preference: z
    .enum(["home", "hospital", "birth_center", "undecided"])
    .nullable()
    .optional(),
  feeding_preference: z
    .enum(["breastfeeding", "formula", "combination", "undecided"])
    .nullable()
    .optional(),
  vaccine_stance: z
    .enum(["standard", "delayed", "selective", "hesitant", "prefer_not_to_say"])
    .nullable()
    .optional(),
  religion: z.string().max(100).nullable().optional(),
  dietary_preference: z
    .enum(["omnivore", "vegetarian", "vegan", "kosher", "halal", "other"])
    .nullable()
    .optional(),
  parenting_style: z
    .enum(["attachment", "gentle", "montessori", "rie", "no_preference"])
    .nullable()
    .optional(),
  topics_of_interest: z.array(z.string()).default([]),
});

// ---- Resource Schemas ----

export const createResourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  slug: z
    .string()
    .min(1)
    .max(300)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  summary: z.string().min(1, "Summary is required").max(1000),
  body: z.string().min(1, "Body is required"),
  resource_type: z.enum(["article", "checklist", "video", "guide", "infographic"]),
  source_url: z.string().url().nullable().optional(),
  age_start_weeks: z.number().int().min(-40).max(260),
  age_end_weeks: z.number().int().min(-40).max(260),
  is_premium: z.boolean().default(false),
  topics: z.array(z.string()).min(1, "At least one topic is required"),
  tags: z.array(z.string()).default([]),
}).refine(
  (data) => data.age_end_weeks >= data.age_start_weeks,
  { message: "End age must be >= start age", path: ["age_end_weeks"] }
);

// ---- AI Chat Schemas ----

export const aiChatMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(2000),
  child_id: z.string().uuid().nullable().optional(),
});

// ---- Review Schemas ----

export const submitReviewSchema = z.object({
  resource_id: z.string().uuid(),
  status: z.enum(["approved", "rejected", "needs_revision"]),
  review_notes: z.string().max(5000).nullable().optional(),
});

// Export inferred types for convenience
export type CreateChildInput = z.infer<typeof createChildSchema>;
export type UpdateChildInput = z.infer<typeof updateChildSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type AiChatMessageInput = z.infer<typeof aiChatMessageSchema>;
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
