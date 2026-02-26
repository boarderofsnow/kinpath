"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TopicKey, ChildWithAge, NotificationPreferences } from "@kinpath/shared";
import { CreditCard, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { HouseholdMember } from "@kinpath/shared";
import { api } from "@/lib/api";

import { ProfileSection } from "./profile-section";
import { ChildrenSection } from "./children-section";
import { PreferencesSection } from "./preferences-section";
import { NotificationSection } from "./notification-section";
import { HouseholdSection } from "./household-section";
import { AccountSection } from "./account-section";

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
  childProfiles,
  preferences,
  notificationPrefs,
  householdMembers = [],
  isPartner = false,
}: SettingsFormProps) {
  const [portalLoading, setPortalLoading] = useState(false);

  const handleManageSubscription = useCallback(async () => {
    setPortalLoading(true);
    try {
      const { data, error: apiError } = await api.stripe.portal();
      if (apiError) throw new Error(apiError);
      const portalData = data as { url?: string } | null;
      if (portalData?.url) window.location.href = portalData.url;
    } catch (error) {
      console.error("Portal error:", error);
      setPortalLoading(false);
    }
  }, []);

  if (!user) return null;

  const tier = user.subscription_tier ?? "free";
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

      <ProfileSection user={user} />

      <ChildrenSection userId={user.id} initialChildren={childProfiles} />

      <PreferencesSection userId={user.id} initialPreferences={preferences} />

      <NotificationSection userId={user.id} initialNotificationPrefs={notificationPrefs} />

      {/* Subscription Section — kept inline since it's mostly static */}
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
                <p className="font-semibold text-stone-900">{tierLabel} Plan</p>
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

      {/* Family Sharing Section — family tier only */}
      {user.subscription_tier === "family" && (
        isPartner ? (
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

      <AccountSection userId={user.id} />
    </div>
  );
}
