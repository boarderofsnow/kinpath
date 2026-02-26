"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";

interface User {
  id: string;
  display_name: string | null;
  email: string;
}

interface ProfileSectionProps {
  user: User;
}

export function ProfileSection({ user }: ProfileSectionProps) {
  const supabase = createClient();
  const [displayName, setDisplayName] = useState(user.display_name ?? "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const handleSaveProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      await supabase
        .from("users")
        .update({ display_name: displayName })
        .eq("id", user.id);

      setProfileMessage("Saved!");
      setTimeout(() => setProfileMessage(null), 2000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      setProfileMessage("Error saving profile");
    } finally {
      setProfileLoading(false);
    }
  }, [supabase, displayName, user.id]);

  return (
    <section className="rounded-2xl border border-stone-200/60 bg-white shadow-card p-6">
      <h2 className="text-lg font-semibold text-stone-900 mb-4">
        Your Profile
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Email
          </label>
          <div className="rounded-xl border border-stone-300 px-3 py-2 text-sm bg-stone-50">
            <span className="text-stone-600">{user.email}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleSaveProfile}
            disabled={profileLoading}
            className="rounded-xl bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {profileLoading ? "Saving..." : "Save Profile"}
          </button>
          {profileMessage && (
            <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <Check className="h-4 w-4" />
              {profileMessage}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
