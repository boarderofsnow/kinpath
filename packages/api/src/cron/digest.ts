import cron from "node-cron";
import { createServiceRoleClient } from "../lib/supabase";
import { sendWeeklyDigest, WeeklyDigestData } from "../lib/email/dispatch";
import {
  getBabySizeComparison,
  getDueDateCountdown,
  getPlanningTips,
  getMaternalChanges,
} from "@kinpath/shared";

interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  email_frequency: "daily" | "weekly" | "monthly" | "off";
  preferred_day: number;
  preferred_hour: number;
  last_email_sent_at: string | null;
}

interface User {
  id: string;
  email: string;
  display_name: string | null;
}

interface Child {
  id: string;
  user_id: string;
  name: string;
  due_date: string | null;
  dob: string | null;
  is_born: boolean;
  created_at: string;
}

interface Resource {
  id: string;
  slug: string;
  title: string;
  summary: string;
  created_at: string;
}

function shouldSend(
  pref: NotificationPreferences,
  currentDayOfWeek: number,
  currentDayOfMonth: number
): boolean {
  switch (pref.email_frequency) {
    case "daily":
      return true;
    case "weekly":
      return currentDayOfWeek === pref.preferred_day;
    case "monthly":
      return currentDayOfMonth === 1;
    case "off":
    default:
      return false;
  }
}

export async function runWeeklyDigest(): Promise<{
  sentCount: number;
  errorCount: number;
  errors: string[];
}> {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayOfWeek = today.getDay();
  const dayOfMonth = today.getDate();

  const { data: prefs, error: prefsError } = await supabase
    .from("notification_preferences")
    .select("*, users!inner(id, email, display_name)")
    .eq("email_enabled", true)
    .neq("email_frequency", "off");

  if (prefsError) {
    console.error("[digest] Error fetching notification preferences:", prefsError);
    throw new Error("Failed to fetch notification preferences");
  }

  const preferences = prefs as Array<NotificationPreferences & { users: User }>;
  let sentCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const pref of preferences) {
    try {
      if (!shouldSend(pref, dayOfWeek, dayOfMonth)) continue;

      const user = pref.users;
      const userId = user.id;
      const displayName = user.display_name || user.email.split("@")[0];

      const { data: children, error: childrenError } = await supabase
        .from("children")
        .select("*")
        .eq("user_id", userId);

      if (childrenError) {
        errorCount++;
        errors.push(`Failed to fetch children for user ${userId}`);
        continue;
      }

      const prenatalChildren = ((children || []) as Child[]).filter(
        (c) => !c.is_born && c.due_date
      );

      if (prenatalChildren.length === 0) continue;

      for (const child of prenatalChildren) {
        try {
          const countdown = getDueDateCountdown(child, now);
          if (!countdown) continue;

          const { gestationalWeek } = countdown;
          const babySize = getBabySizeComparison(gestationalWeek);
          const maternalChange = getMaternalChanges(gestationalWeek);
          const planningTips = getPlanningTips(gestationalWeek, 1);

          const lastEmailDate = pref.last_email_sent_at
            ? new Date(pref.last_email_sent_at)
            : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

          const { data: resources, error: resourcesError } = await supabase
            .from("resources")
            .select("id, slug, title, summary, created_at")
            .eq("status", "published")
            .gte("created_at", lastEmailDate.toISOString())
            .order("created_at", { ascending: false })
            .limit(3);

          if (resourcesError) {
            errorCount++;
            errors.push(`Failed to fetch resources for user ${userId}`);
            continue;
          }

          const newResources = ((resources || []) as Resource[]).map((r) => ({
            title: r.title,
            slug: r.slug,
            summary: r.summary,
          }));

          const appUrl = process.env.APP_URL || "https://kinpath.family";
          const emailData: WeeklyDigestData = {
            displayName,
            childName: child.name,
            gestationalWeek,
            babySize: babySize ? { object: babySize.object, emoji: babySize.emoji } : null,
            encouragement: countdown.encouragement,
            weeksRemaining: countdown.weeksRemaining,
            maternalBody: maternalChange?.body ?? null,
            maternalTip: maternalChange?.tip ?? null,
            planningTips: planningTips.map((tip) => ({
              tip: tip.tip,
              category: tip.category,
            })),
            newResources,
            dashboardUrl: appUrl,
            settingsUrl: `${appUrl}/settings/notifications`,
          };

          const result = await sendWeeklyDigest(user.email, emailData);

          if (result.error) {
            errorCount++;
            errors.push(`Failed to send email to ${user.email}: ${result.error.message}`);
            continue;
          }

          await supabase
            .from("notification_preferences")
            .update({ last_email_sent_at: now.toISOString() })
            .eq("id", pref.id);

          sentCount++;
        } catch (childError) {
          errorCount++;
          errors.push(`Failed to process child ${child.name}`);
        }
      }
    } catch (userError) {
      errorCount++;
      errors.push(`Failed to process user ${pref.user_id}`);
    }
  }

  return { sentCount, errorCount, errors };
}

export function startCronJobs(): void {
  // Run every day at 9am UTC — the shouldSend() logic filters by user preference
  cron.schedule("0 9 * * *", async () => {
    console.log("[cron] Starting weekly digest run...");
    try {
      const result = await runWeeklyDigest();
      console.log(
        `[cron] Digest complete — sent: ${result.sentCount}, errors: ${result.errorCount}`
      );
      if (result.errors.length > 0) {
        console.error("[cron] Digest errors:", result.errors);
      }
    } catch (err) {
      console.error("[cron] Digest run failed:", err);
    }
  });

  console.log("[cron] Digest job scheduled (daily at 09:00 UTC)");
}
