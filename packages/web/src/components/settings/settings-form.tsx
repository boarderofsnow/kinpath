"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  enrichChildWithAge,
  TOPICS,
  TOPIC_KEYS,
  TAG_NAMESPACES,
  type TopicKey,
  type ChildWithAge,
} from "@kinpath/shared";
import { Edit2, Plus, Check } from "lucide-react";

interface User {
  id: string;
  display_name: string | null;
  email: string;
}

interface Preferences {
  birth_preference: string | null;
  feeding_preference: string | null;
  vaccine_stance: string | null;
  religion: string | null;
  dietary_preference: string | null;
  parenting_style: string | null;
  topics_of_interest: TopicKey[];
}

interface SettingsFormProps {
  user: User | null;
  childProfiles: ChildWithAge[];
  preferences: Preferences | null;
}

export function SettingsForm({
  user,
  childProfiles: initialChildren,
  preferences: initialPreferences,
}: SettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();

  // Profile state
  const [displayName, setDisplayName] = useState(user?.display_name ?? "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Children state
  const [children, setChildren] = useState(initialChildren);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editChildName, setEditChildName] = useState("");
  const [editChildDate, setEditChildDate] = useState("");
  const [childrenLoading, setChildrenLoading] = useState(false);

  // Preferences state
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
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(
    null
  );

  const [accountLoading, setAccountLoading] = useState(false);

  // Profile save
  async function handleSaveProfile() {
    setProfileLoading(true);
    setProfileMessage(null);

    try {
      await supabase
        .from("users")
        .update({ display_name: displayName })
        .eq("id", user!.id);

      setProfileMessage("Saved!");
      setTimeout(() => setProfileMessage(null), 2000);
    } catch (error) {
      console.error("Failed to save profile:", error);
      setProfileMessage("Error saving profile");
    } finally {
      setProfileLoading(false);
    }
  }

  // Child edit handlers
  function startEditChild(child: ChildWithAge) {
    setEditingChildId(child.id);
    setEditChildName(child.name);
    setEditChildDate(child.is_born ? child.dob! : child.due_date!);
  }

  async function handleSaveChild() {
    if (!editingChildId) return;

    setChildrenLoading(true);
    try {
      await supabase
        .from("children")
        .update({
          name: editChildName,
          [children.find((c) => c.id === editingChildId)?.is_born
            ? "dob"
            : "due_date"]: editChildDate,
        })
        .eq("id", editingChildId);

      // Update local state
      const updatedChildren = children.map((c) =>
        c.id === editingChildId
          ? enrichChildWithAge({
              ...c,
              name: editChildName,
              dob: c.is_born ? editChildDate : c.dob,
              due_date: !c.is_born ? editChildDate : c.due_date,
            })
          : c
      );
      setChildren(updatedChildren);
      setEditingChildId(null);
    } catch (error) {
      console.error("Failed to save child:", error);
    } finally {
      setChildrenLoading(false);
    }
  }

  function handleCancelEdit() {
    setEditingChildId(null);
    setEditChildName("");
    setEditChildDate("");
  }

  // Add child
  async function handleAddChild() {
    const newChildName = prompt("Child's name (or nickname):");
    if (!newChildName) return;

    const isBorn = confirm("Has this baby been born yet?");
    const dateStr = prompt(isBorn ? "Date of birth (YYYY-MM-DD):" : "Due date (YYYY-MM-DD):");
    if (!dateStr) return;

    setChildrenLoading(true);
    try {
      const { data: newChild } = await supabase
        .from("children")
        .insert({
          user_id: user!.id,
          name: newChildName,
          is_born: isBorn,
          dob: isBorn ? dateStr : null,
          due_date: !isBorn ? dateStr : null,
        })
        .select()
        .single();

      if (newChild) {
        setChildren([...children, enrichChildWithAge(newChild)]);
      }
    } catch (error) {
      console.error("Failed to add child:", error);
      alert("Failed to add child");
    } finally {
      setChildrenLoading(false);
    }
  }

  // Preferences save
  async function handleSavePreferences() {
    setPreferencesLoading(true);
    setPreferencesMessage(null);

    try {
      await supabase.from("user_preferences").upsert({
        user_id: user!.id,
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
  }

  // Preferences update helpers
  function updatePreference<K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }

  function toggleTopic(topic: TopicKey) {
    setPreferences((prev) => ({
      ...prev,
      topics_of_interest: prev.topics_of_interest.includes(topic)
        ? prev.topics_of_interest.filter((t) => t !== topic)
        : [...prev.topics_of_interest, topic],
    }));
  }

  // Sign out
  async function handleSignOut() {
    setAccountLoading(true);
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-stone-900">Settings</h1>
        <p className="mt-1 text-stone-600">
          Manage your profile, children, and preferences
        </p>
      </div>

      {/* A. Profile Section */}
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
              <span className="text-stone-600">{user?.email}</span>
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

      {/* B. Children Section */}
      <section className="rounded-2xl border border-stone-200/60 bg-white shadow-card p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Your Children</h2>

        {children.length > 0 ? (
          <div className="space-y-3 mb-4">
            {children.map((child) => (
              <div
                key={child.id}
                className="rounded-xl border border-stone-200 p-4"
              >
                {editingChildId === child.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={editChildName}
                        onChange={(e) => setEditChildName(e.target.value)}
                        className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-1">
                        {child.is_born ? "Date of birth" : "Due date"}
                      </label>
                      <input
                        type="date"
                        value={editChildDate}
                        onChange={(e) => setEditChildDate(e.target.value)}
                        className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveChild}
                        disabled={childrenLoading}
                        className="rounded-xl bg-brand-500 text-white px-3 py-1 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="rounded-xl border border-stone-300 text-stone-600 px-3 py-1 text-sm font-medium hover:bg-stone-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-stone-900">
                        {child.name}
                      </h3>
                      <p className="text-sm text-stone-500">{child.age_label}</p>
                      <span className="mt-1 inline-flex items-center rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700">
                        {child.is_born ? "Born" : "Expecting"}
                      </span>
                    </div>
                    <button
                      onClick={() => startEditChild(child)}
                      className="rounded-lg hover:bg-stone-100 p-2 transition-colors"
                      title="Edit child"
                    >
                      <Edit2 className="h-4 w-4 text-stone-600" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-500 mb-4">
            No children added yet.
          </p>
        )}

        <button
          onClick={handleAddChild}
          disabled={childrenLoading}
          className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 px-4 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors w-full justify-center disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Add Another Child
        </button>
      </section>

      {/* C. Preferences Section */}
      <section className="rounded-2xl border border-stone-200/60 bg-white shadow-card p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">
          Your Preferences
        </h2>

        <div className="space-y-6">
          {/* Topics of Interest */}
          <div>
            <h3 className="text-sm font-semibold text-stone-900 mb-3">
              Topics of Interest
            </h3>
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
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Birth Preference
            </label>
            <select
              value={preferences.birth_preference ?? ""}
              onChange={(e) =>
                updatePreference(
                  "birth_preference",
                  e.target.value || null
                )
              }
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Not selected</option>
              {TAG_NAMESPACES.birth.values.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Feeding Preference */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Feeding Preference
            </label>
            <select
              value={preferences.feeding_preference ?? ""}
              onChange={(e) =>
                updatePreference(
                  "feeding_preference",
                  e.target.value || null
                )
              }
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Not selected</option>
              {TAG_NAMESPACES.feeding.values.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Vaccine Stance */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Vaccination Approach
            </label>
            <select
              value={preferences.vaccine_stance ?? ""}
              onChange={(e) =>
                updatePreference(
                  "vaccine_stance",
                  e.target.value || null
                )
              }
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
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Religious or Spiritual Tradition
            </label>
            <select
              value={preferences.religion ?? ""}
              onChange={(e) =>
                updatePreference(
                  "religion",
                  e.target.value || null
                )
              }
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Prefer not to say</option>
              {TAG_NAMESPACES.faith.values.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dietary Preference */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Dietary Preferences
            </label>
            <select
              value={preferences.dietary_preference ?? "omnivore"}
              onChange={(e) =>
                updatePreference(
                  "dietary_preference",
                  e.target.value as any
                )
              }
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
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Parenting Philosophy
            </label>
            <select
              value={preferences.parenting_style ?? "no_preference"}
              onChange={(e) =>
                updatePreference(
                  "parenting_style",
                  e.target.value || null
                )
              }
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              <option value="no_preference">No strong preference</option>
              {TAG_NAMESPACES.parenting.values.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
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

      {/* D. Account Section */}
      <section className="rounded-2xl border border-stone-200/60 bg-white shadow-card p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Account</h2>

        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            disabled={accountLoading}
            className="w-full rounded-xl bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {accountLoading ? "Signing out..." : "Sign Out"}
          </button>

          <button
            disabled
            className="w-full rounded-xl px-4 py-2 text-sm font-medium text-stone-500 cursor-not-allowed"
          >
            Delete Account
          </button>
        </div>
      </section>
    </div>
  );
}
