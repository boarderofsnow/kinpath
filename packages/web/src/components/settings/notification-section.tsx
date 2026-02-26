"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NotificationPreferences, EmailFrequency } from "@kinpath/shared";
import { Bell, Check } from "lucide-react";

interface NotificationSectionProps {
  userId: string;
  initialNotificationPrefs: NotificationPreferences | null;
}

export function NotificationSection({ userId, initialNotificationPrefs }: NotificationSectionProps) {
  const supabase = createClient();

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    initialNotificationPrefs ?? {
      id: "",
      user_id: userId,
      email_enabled: true,
      email_frequency: "weekly" as EmailFrequency,
      preferred_day: 1,
      preferred_hour: 8,
      pregnancy_updates: true,
      new_resources: true,
      planning_reminders: true,
      product_updates: false,
      last_email_sent_at: null,
      created_at: "",
      updated_at: "",
    }
  );
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  const updateNotificationPref = useCallback(<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setNotificationPrefs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleNotificationContent = useCallback(
    (key: "pregnancy_updates" | "new_resources" | "planning_reminders" | "product_updates") => {
      setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    },
    []
  );

  const handleSaveNotifications = useCallback(async () => {
    setNotificationLoading(true);
    setNotificationMessage(null);

    try {
      const { id: _id, created_at: _ca, updated_at: _ua, last_email_sent_at: _le, ...prefsToSave } = notificationPrefs;
      await supabase.from("notification_preferences").upsert({
        ...prefsToSave,
        user_id: userId,
      });

      setNotificationMessage("Saved!");
      setTimeout(() => setNotificationMessage(null), 2000);
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
      setNotificationMessage("Error saving preferences");
    } finally {
      setNotificationLoading(false);
    }
  }, [supabase, userId, notificationPrefs]);

  return (
    <section className="rounded-2xl border border-stone-200/60 bg-white shadow-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-brand-500" />
        <h2 className="text-lg font-semibold text-stone-900">Email Notifications</h2>
      </div>

      <div className={`space-y-6 ${!notificationPrefs.email_enabled ? "opacity-50 pointer-events-none" : ""}`}>
        {/* Master Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Email notifications</label>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={notificationPrefs.email_enabled}
              onChange={(e) => updateNotificationPref("email_enabled", e.target.checked)}
            />
            <div className="w-9 h-5 bg-stone-300 rounded-full peer peer-checked:bg-brand-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
          </label>
        </div>

        {/* Email Frequency */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-3">Email frequency</label>
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as EmailFrequency[]).map((freq) => (
              <button
                key={freq}
                onClick={() => updateNotificationPref("email_frequency", freq)}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  notificationPrefs.email_frequency === freq
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-stone-200 text-stone-600 hover:border-stone-300"
                }`}
              >
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Day (only when weekly) */}
        {notificationPrefs.email_frequency === "weekly" && (
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Preferred day</label>
            <select
              value={notificationPrefs.preferred_day}
              onChange={(e) => updateNotificationPref("preferred_day", parseInt(e.target.value))}
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>
          </div>
        )}

        {/* Content Toggles */}
        <div className="space-y-4 pt-4 border-t border-stone-200">
          {([
            { key: "pregnancy_updates" as const, title: "Pregnancy progress", desc: "Weekly updates about your baby\u2019s development and your body" },
            { key: "new_resources" as const, title: "New resources", desc: "When new articles match your interests and child\u2019s age" },
            { key: "planning_reminders" as const, title: "Planning reminders", desc: "Upcoming milestones and things to prepare" },
            { key: "product_updates" as const, title: "Product updates", desc: "New features and KinPath news" },
          ]).map(({ key, title, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-stone-900">{title}</h3>
                <p className="text-xs text-stone-500 mt-0.5">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationPrefs[key]}
                  onChange={() => toggleNotificationContent(key)}
                />
                <div className="w-9 h-5 bg-stone-300 rounded-full peer peer-checked:bg-brand-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-6 mt-6 border-t border-stone-200">
        <button
          onClick={handleSaveNotifications}
          disabled={notificationLoading}
          className="rounded-xl bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {notificationLoading ? "Saving..." : "Save Notifications"}
        </button>
        {notificationMessage && (
          <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <Check className="h-4 w-4" />
            {notificationMessage}
          </div>
        )}
      </div>
    </section>
  );
}
