export type EmailFrequency = "daily" | "weekly" | "monthly" | "off";

export interface NotificationPreferences {
  id: string;
  user_id: string;

  // Master toggle
  email_enabled: boolean;

  // Content types
  pregnancy_updates: boolean;
  new_resources: boolean;
  planning_reminders: boolean;
  product_updates: boolean;

  // Schedule
  email_frequency: EmailFrequency;
  preferred_day: number; // 0=Sun … 6=Sat
  preferred_hour: number; // 0-23

  // Tracking
  last_email_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Shape for creating/updating notification preferences (omit server fields). */
export interface NotificationPreferencesInput {
  email_enabled?: boolean;
  pregnancy_updates?: boolean;
  new_resources?: boolean;
  planning_reminders?: boolean;
  product_updates?: boolean;
  email_frequency?: EmailFrequency;
  preferred_day?: number;
  preferred_hour?: number;
}
