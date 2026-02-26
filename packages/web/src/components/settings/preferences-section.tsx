"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { TOPICS, TOPIC_KEYS, TAG_NAMESPACES, type TopicKey } from "@kinpath/shared";
import { Check } from "lucide-react";

interface Preferences {
  birth_preference: string | null;
  feeding_preference: string | null;
  vaccine_stance: string | null;
  religion: string | null;
  dietary_preference: string | null;
  parenting_style: string | null;
  topics_of_interest: TopicKey[];
}

interface PreferencesSectionProps {
  userId: string;
  initialPreferences: Preferences | null;
}

export function PreferencesSection({ userId, initialPreferences }: PreferencesSectionProps) {
  const supabase = createClient();

  const [preferences, setPreferences] = useState<Preferences>(
    initialPreferences ?? {
      birth_preference: null,
      feeding_preference: null,
      vaccine_stance: null,
      religion: null,
      dietary_preference: null,
      parenting_style: null,
      topics_of_interest: [],
    }
  );
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(null);

  const updatePreference = useCallback(<K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleTopic = useCallback((topic: TopicKey) => {
    setPreferences((prev) => ({
      ...prev,
      topics_of_interest: prev.topics_of_interest.includes(topic)
        ? prev.topics_of_interest.filter((t) => t !== topic)
        : [...prev.topics_of_interest, topic],
    }));
  }, []);

  const handleSavePreferences = useCallback(async () => {
    setPreferencesLoading(true);
    setPreferencesMessage(null);

    try {
      await supabase.from("user_preferences").upsert({
        user_id: userId,
        ...preferences,
      });

      setPreferencesMessage("Saved!");
      setTimeout(() => setPreferencesMessage(null), 2000);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      setPreferencesMessage("Error saving preferences");
    } finally {
      setPreferencesLoading(false);
    }
  }, [supabase, userId, preferences]);

  return (
    <section className="rounded-2xl border border-stone-200/60 bg-white shadow-card p-6">
      <h2 className="text-lg font-semibold text-stone-900 mb-4">Your Preferences</h2>

      <div className="space-y-6">
        {/* Topics of Interest */}
        <div>
          <h3 className="text-sm font-semibold text-stone-900 mb-3">Topics of Interest</h3>
          <p className="text-xs text-stone-500 mb-3">
            Select the topics you&apos;d like to see more of in your feed.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TOPIC_KEYS.map((key) => {
              const topic = TOPICS[key];
              const selected = preferences.topics_of_interest.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleTopic(key)}
                  className={`rounded-xl border-2 px-3 py-2 text-left text-sm font-medium transition-colors ${
                    selected
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-stone-200 text-stone-600 hover:border-stone-300"
                  }`}
                >
                  {topic.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-stone-500">
            {preferences.topics_of_interest.length} topic
            {preferences.topics_of_interest.length === 1 ? "" : "s"} selected
          </p>
        </div>

        {/* Birth Preference */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Birth Preference</label>
          <select
            value={preferences.birth_preference ?? ""}
            onChange={(e) => updatePreference("birth_preference", e.target.value || null)}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Not selected</option>
            {TAG_NAMESPACES.birth.values.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Feeding Preference */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Feeding Preference</label>
          <select
            value={preferences.feeding_preference ?? ""}
            onChange={(e) => updatePreference("feeding_preference", e.target.value || null)}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Not selected</option>
            {TAG_NAMESPACES.feeding.values.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Vaccine Stance */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Vaccination Approach</label>
          <select
            value={preferences.vaccine_stance ?? ""}
            onChange={(e) => updatePreference("vaccine_stance", e.target.value || null)}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Not selected</option>
            <option value="standard">Standard CDC Schedule</option>
            <option value="delayed">Delayed Schedule</option>
            <option value="selective">Selective Vaccination</option>
            <option value="hesitant">Vaccine-hesitant</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        {/* Religion */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Religious or Spiritual Tradition</label>
          <select
            value={preferences.religion ?? ""}
            onChange={(e) => updatePreference("religion", e.target.value || null)}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Prefer not to say</option>
            {TAG_NAMESPACES.faith.values.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Dietary Preference */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Dietary Preferences</label>
          <select
            value={preferences.dietary_preference ?? "omnivore"}
            onChange={(e) => updatePreference("dietary_preference", e.target.value as any)}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="omnivore">No restrictions</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="kosher">Kosher</option>
            <option value="halal">Halal</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Parenting Style */}
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">Parenting Philosophy</label>
          <select
            value={preferences.parenting_style ?? "no_preference"}
            onChange={(e) => updatePreference("parenting_style", e.target.value || null)}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            <option value="no_preference">No strong preference</option>
            {TAG_NAMESPACES.parenting.values.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-6 mt-6 border-t border-stone-200">
        <button
          onClick={handleSavePreferences}
          disabled={preferencesLoading}
          className="rounded-xl bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
        >
          {preferencesLoading ? "Saving..." : "Save Preferences"}
        </button>
        {preferencesMessage && (
          <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <Check className="h-4 w-4" />
            {preferencesMessage}
          </div>
        )}
      </div>
    </section>
  );
}
