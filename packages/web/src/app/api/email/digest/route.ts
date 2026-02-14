import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendWeeklyDigest } from "@/lib/email/dispatch";
import type { WeeklyDigestData } from "@/lib/email/templates/weekly-digest";
import {
  getBabySizeComparison,
  getDueDateCountdown,
  getPlanningTips,
  getMaternalChanges,
} from "@kinpath/shared";

export const dynamic = "force-dynamic";

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

export async function POST(request: NextRequest) {
  // Validate CRON_SECRET header
  const cronSecret = request.headers.get("Authorization");
  if (!cronSecret || cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const supabase = createServiceRoleClient();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = today.getDay();
    const dayOfMonth = today.getDate();

    // Fetch eligible users with notification preferences
    const { data: prefs, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("*, users!inner(id, email, display_name)")
      .eq("email_enabled", true)
      .neq("email_frequency", "off");

    if (prefsError) {
      console.error("Error fetching notification preferences:", prefsError);
      return NextResponse.json(
        { error: "Failed to fetch notification preferences" },
        { status: 500 }
      );
    }

    const preferences = prefs as Array<NotificationPreferences & { users: User }>;
    let sentCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const pref of preferences) {
      try {
        // Check if email should be sent based on frequency
        const shouldSendEmail = shouldSend(pref, dayOfWeek, dayOfMonth);
        if (!shouldSendEmail) {
          continue;
        }

        const user = pref.users;
        const userId = user.id;
        const userEmail = user.email;
        const displayName = user.display_name || user.email.split("@")[0];

        // Fetch user's children
        const { data: children, error: childrenError } = await supabase
          .from("children")
          .select("*")
          .eq("user_id", userId);

        if (childrenError) {
          console.error(`Error fetching children for user ${userId}:`, childrenError);
          errorCount++;
          errors.push(`Failed to fetch children for user ${userId}`);
          continue;
        }

        const userChildren = (children || []) as Child[];

        // Filter to prenatal children only for this implementation
        const prenatalChildren = userChildren.filter((c) => !c.is_born && c.due_date);

        if (prenatalChildren.length === 0) {
          // Skip users with no prenatal children
          continue;
        }

        // Process each child
        for (const child of prenatalChildren) {
          try {
            const countdown = getDueDateCountdown(child, now);
            if (!countdown) {
              continue;
            }

            const { gestationalWeek } = countdown;
            const babySize = getBabySizeComparison(gestationalWeek);
            const maternalChange = getMaternalChanges(gestationalWeek);
            const planningTips = getPlanningTips(gestationalWeek, 1);

            // Fetch new resources since last email
            const lastEmailDate = pref.last_email_sent_at
              ? new Date(pref.last_email_sent_at)
              : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to last week

            const { data: resources, error: resourcesError } = await supabase
              .from("resources")
              .select("id, slug, title, summary, created_at")
              .eq("status", "published")
              .gte("created_at", lastEmailDate.toISOString())
              .order("created_at", { ascending: false })
              .limit(3);

            if (resourcesError) {
              console.error(`Error fetching resources for user ${userId}:`, resourcesError);
              errorCount++;
              errors.push(`Failed to fetch resources for user ${userId}`);
              continue;
            }

            const newResources = (resources || []).map((r: Resource) => ({
              title: r.title,
              slug: r.slug,
              summary: r.summary,
            }));

            // Build email data
            const emailData: WeeklyDigestData = {
              displayName,
              childName: child.name,
              gestationalWeek,
              babySize: babySize
                ? {
                    object: babySize.object,
                    emoji: babySize.emoji,
                  }
                : null,
              encouragement: countdown.encouragement,
              weeksRemaining: countdown.weeksRemaining,
              maternalBody: maternalChange?.body ?? null,
              maternalTip: maternalChange?.tip ?? null,
              planningTips: planningTips.map((tip) => ({
                tip: tip.tip,
                category: tip.category,
              })),
              newResources,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}`,
              settingsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications`,
            };

            // Send email
            const result = await sendWeeklyDigest(userEmail, emailData);

            if (result.error) {
              console.error(`Error sending email to ${userEmail}:`, result.error);
              errorCount++;
              errors.push(`Failed to send email to ${userEmail}: ${result.error.message}`);
              continue;
            }

            // Update last_email_sent_at
            const { error: updateError } = await supabase
              .from("notification_preferences")
              .update({ last_email_sent_at: now.toISOString() })
              .eq("id", pref.id);

            if (updateError) {
              console.error(`Error updating last_email_sent_at for preference ${pref.id}:`, updateError);
            }

            sentCount++;
          } catch (childError) {
            console.error(`Error processing child ${child.id}:`, childError);
            errorCount++;
            errors.push(`Failed to process child ${child.name}`);
            continue;
          }
        }
      } catch (userError) {
        console.error(`Error processing user ${pref.user_id}:`, userError);
        errorCount++;
        errors.push(`Failed to process user ${pref.user_id}`);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Determine if an email should be sent based on frequency and timing.
 */
function shouldSend(
  pref: NotificationPreferences,
  currentDayOfWeek: number,
  currentDayOfMonth: number
): boolean {
  switch (pref.email_frequency) {
    case "daily":
      return true;

    case "weekly":
      // Send on preferred day of week
      return currentDayOfWeek === pref.preferred_day;

    case "monthly":
      // Send on first day of month
      return currentDayOfMonth === 1;

    case "off":
    default:
      return false;
  }
}
