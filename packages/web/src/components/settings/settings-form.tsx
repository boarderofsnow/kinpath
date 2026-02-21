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
  type NotificationPreferences,
  type EmailFrequency,
} from "@kinpath/shared";
import { Edit2, Plus, Check, Bell, CreditCard, Crown, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { HouseholdSection } from "@/components/settings/household-section";
import type { HouseholdMember } from "@kinpath/shared";

interface User {
  id: string;
  display_name: string | null;
  email: string;
  subscription_tier?: string;
  stripe_customer_id?: string | null;
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
  notificationPrefs: NotificationPreferences | null;
  householdMembers?: HouseholdMember[];
  /** True when the current user is a partner (not the household owner). */
  isPartner?: boolean;
}

export function SettingsForm({
  user,
  childProfiles: initialChildren,
  preferences: initialPreferences,
  notificationPrefs: initialNotificationPrefs,
  householdMembers = [],
  isPartner = false,
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

  // Add child form state
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildIsBorn, setNewChildIsBorn] = useState<boolean | null>(null);
  const [newChildDate, setNewChildDate] = useState("");
  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);

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

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    initialNotificationPrefs ?? {
      id: "",
      user_id: user?.id ?? "",
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

  const [accountLoading, setAccountLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

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
  function handleShowAddChild() {
    setShowAddChild(true);
    setNewChildName("");
    setNewChildIsBorn(null);
    setNewChildDate("");
  }

  function handleCancelAddChild() {
    setShowAddChild(false);
    setNewChildName("");
    setNewChildIsBorn(null);
    setNewChildDate("");
  }

  // Remove child
  async function handleRemoveChild(childId: string) {
    if (deletingChildId !== childId) {
      setDeletingChildId(childId);
      return;
    }

    setChildrenLoading(true);
    try {
      await supabase.from("children").delete().eq("id", childId);
      setChildren(children.filter((c) => c.id !== childId));
      setDeletingChildId(null);
    } catch (error) {
      console.error("Failed to remove child:", error);
    } finally {
      setChildrenLoading(false);
    }
  }

  async function handleSubmitAddChild() {
    if (!newChildName.trim() || newChildIsBorn === null || !newChildDate) return;

    setChildrenLoading(true);
    try {
      const { data: newChild } = await supabase
        .from("children")
        .insert({
          user_id: user!.id,
          name: newChildName.trim(),
          is_born: newChildIsBorn,
          dob: newChildIsBorn ? newChildDate : null,
          due_date: !newChildIsBorn ? newChildDate : null,
        })
        .select()
        .single();

      if (newChild) {
        setChildren([...children, enrichChildWithAge(newChild)]);
      }
      handleCancelAddChild();
    } catch (error) {
      console.error("Failed to add child:", error);
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

  // Notification preferences update helpers
  function updateNotificationPref<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) {
    setNotificationPrefs((prev) => ({ ...prev, [key]: value }));
  }

  function toggleNotificationContent(key: "pregnancy_updates" | "new_resources" | "planning_reminders" | "product_updates") {
    setNotificationPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Save notification preferences
  async function handleSaveNotifications() {
    setNotificationLoading(true);
    setNotificationMessage(null);

    try {
      const { id: _id, created_at: _ca, updated_at: _ua, last_email_sent_at: _le, ...prefsToSave } = notificationPrefs;
      await supabase.from("notification_preferences").upsert({
        ...prefsToSave,
        user_id: user!.id,
      });

      setNotificationMessage("Saved!");
      setTimeout(() => setNotificationMessage(null), 2000);
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
      setNotificationMessage("Error saving preferences");
    } finally {
      setNotificationLoading(false);
    }
  }

  // Sign out
  async function handleSignOut() {
    setAccountLoading(true);
    await supabase.auth.signOut();
    router.push("/");
  }

  // Delete account
  async function handleDeleteAccount() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleteLoading(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete account");
      }
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Failed to delete account:", error);
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  }

  // Manage subscription via Stripe portal
  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to open billing portal");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Portal error:", error);
      setPortalLoading(false);
    }
  }

  const tier = user?.subscription_tier ?? "free";
  const isFree = tier === "free";
  const tierLabel = tier === "family" ? "Family" : tier === "premium" ? "Premium" : "Free";

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
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEditChild(child)}
                        className="rounded-lg hover:bg-stone-100 p-2 transition-colors"
                        title="Edit child"
                      >
                        <Edit2 className="h-4 w-4 text-stone-600" />
                      </button>
                      {deletingChildId === child.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRemoveChild(child.id)}
                            disabled={childrenLoading}
                            className="rounded-lg bg-red-600 text-white px-2 py-1 text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeletingChildId(null)}
                            className="rounded-lg border border-stone-300 text-stone-600 px-2 py-1 text-xs font-medium hover:bg-stone-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRemoveChild(child.id)}
                          className="rounded-lg hover:bg-stone-100 p-2 transition-colors"
                          title="Remove child"
                        >
                          <X className="h-4 w-4 text-stone-400 hover:text-stone-600" />
                        </button>
                      )}
                    </div>
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

        {showAddChild ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50/30 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-stone-900">Add a child</h3>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Name or nickname
              </label>
              <input
                type="text"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                placeholder="e.g. Emma"
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                autoFocus
              />
            </div>

            {/* Born yet? */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Has this child been born yet?
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setNewChildIsBorn(true); setNewChildDate(""); }}
                  className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    newChildIsBorn === true
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-stone-200 text-stone-600 hover:border-stone-300"
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => { setNewChildIsBorn(false); setNewChildDate(""); }}
                  className={`flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    newChildIsBorn === false
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-stone-200 text-stone-600 hover:border-stone-300"
                  }`}
                >
                  Not yet
                </button>
              </div>
            </div>

            {/* Date input — only show after born/not-born selection */}
            {newChildIsBorn !== null && (
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  {newChildIsBorn ? "Date of birth" : "Expected due date"}
                </label>
                <input
                  type="date"
                  value={newChildDate}
                  onChange={(e) => setNewChildDate(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSubmitAddChild}
                disabled={childrenLoading || !newChildName.trim() || newChildIsBorn === null || !newChildDate}
                className="rounded-xl bg-brand-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {childrenLoading ? "Adding..." : "Add Child"}
              </button>
              <button
                onClick={handleCancelAddChild}
                className="rounded-xl border border-stone-300 text-stone-600 px-4 py-2 text-sm font-medium hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleShowAddChild}
            disabled={childrenLoading}
            className="flex items-center gap-2 rounded-xl border border-dashed border-stone-300 px-4 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors w-full justify-center disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Another Child
          </button>
        )}
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

      {/* C. Email Notifications Section */}
      <section className="rounded-2xl border border-stone-200/60 bg-white shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-brand-500" />
          <h2 className="text-lg font-semibold text-stone-900">
            Email Notifications
          </h2>
        </div>

        <div className={`space-y-6 ${!notificationPrefs.email_enabled ? "opacity-50 pointer-events-none" : ""}`}>
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Email notifications
              </label>
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
            <label className="block text-sm font-medium text-stone-700 mb-3">
              Email frequency
            </label>
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
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Preferred day
              </label>
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
            {/* Pregnancy Updates */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-stone-900">
                  Pregnancy progress
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Weekly updates about your baby&apos;s development and your body
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationPrefs.pregnancy_updates}
                  onChange={() => toggleNotificationContent("pregnancy_updates")}
                />
                <div className="w-9 h-5 bg-stone-300 rounded-full peer peer-checked:bg-brand-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            {/* New Resources */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-stone-900">
                  New resources
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  When new articles match your interests and child&apos;s age
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationPrefs.new_resources}
                  onChange={() => toggleNotificationContent("new_resources")}
                />
                <div className="w-9 h-5 bg-stone-300 rounded-full peer peer-checked:bg-brand-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            {/* Planning Reminders */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-stone-900">
                  Planning reminders
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Upcoming milestones and things to prepare
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationPrefs.planning_reminders}
                  onChange={() => toggleNotificationContent("planning_reminders")}
                />
                <div className="w-9 h-5 bg-stone-300 rounded-full peer peer-checked:bg-brand-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>

            {/* Product Updates */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-stone-900">
                  Product updates
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  New features and KinPath news
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={notificationPrefs.product_updates}
                  onChange={() => toggleNotificationContent("product_updates")}
                />
                <div className="w-9 h-5 bg-stone-300 rounded-full peer peer-checked:bg-brand-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
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

      {/* D. Subscription Section */}
      <section id="subscription" className="rounded-2xl border border-stone-200/60 bg-white shadow-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="h-5 w-5 text-stone-700" />
          <h2 className="text-lg font-semibold text-stone-900">Subscription</h2>
        </div>

        <div className="rounded-xl border border-stone-200/60 bg-stone-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                {!isFree && <Crown className="h-4 w-4 text-accent-500" />}
                <p className="font-semibold text-stone-900">
                  {tierLabel} Plan
                </p>
              </div>
              <p className="mt-1 text-sm text-stone-600">
                {isFree
                  ? "5 AI questions/month, 1 child profile, basic resources"
                  : tier === "premium"
                  ? "Unlimited AI, full library, bookmarks, email digests"
                  : "Everything in Premium plus partner sharing"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {isFree ? (
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent-500 px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-accent-600 transition-colors"
            >
              Upgrade Plan
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="w-full rounded-xl border border-stone-200/60 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                {portalLoading ? "Opening..." : "Manage Subscription & Billing"}
              </button>
              <p className="text-xs text-stone-500 text-center">
                Change plan, update payment method, or cancel
              </p>
            </>
          )}
        </div>
      </section>

      {/* E. Family Sharing Section — family tier only */}
      {user?.subscription_tier === "family" && (
        isPartner ? (
          // Partners see a read-only view — they joined someone else's household.
          <section className="rounded-2xl border border-stone-200/60 bg-white shadow-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-stone-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <h2 className="text-lg font-semibold text-stone-900">Family Sharing</h2>
            </div>
            <div className="rounded-xl border border-brand-100 bg-brand-50/40 p-4">
              <p className="text-sm font-medium text-brand-800">
                You&apos;re sharing a household
              </p>
              <p className="mt-1 text-sm text-stone-600">
                You have access to your partner&apos;s children, checklist, and doctor discussion list.
                Visit the <strong>Plan</strong> or <strong>Dashboard</strong> pages to view shared data.
              </p>
            </div>
          </section>
        ) : (
          <HouseholdSection initialMembers={householdMembers} />
        )
      )}

      {/* F. Account Section */}
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
            onClick={handleDeleteAccount}
            disabled={deleteLoading}
            className={`w-full rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              deleteConfirm
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border border-red-200 text-red-600 hover:bg-red-50"
            }`}
          >
            {deleteLoading
              ? "Deleting..."
              : deleteConfirm
              ? "Confirm: Delete my account permanently"
              : "Delete Account"}
          </button>
          {deleteConfirm && !deleteLoading && (
            <button
              onClick={() => setDeleteConfirm(false)}
              className="w-full rounded-xl px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700"
            >
              Cancel
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
