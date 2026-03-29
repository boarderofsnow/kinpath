"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import {
  TOPICS,
  TOPIC_KEYS,
  TAG_NAMESPACES,
  TIER_PRICING,
  type UserPreferencesInput,
  type OnboardingStep,
} from "@kinpath/shared";
import { api } from "@/lib/api";

type Step =
  | "child"
  | "birth"
  | "feeding"
  | "vaccines"
  | "lifestyle"
  | "topics"
  | "paywall"
  | "partner_invite";

const STEPS: Step[] = [
  "child",
  "birth",
  "feeding",
  "vaccines",
  "lifestyle",
  "topics",
  "paywall",
  "partner_invite",
];

/** Map DB onboarding_step to UI step index */
function dbStepToIndex(dbStep: OnboardingStep): number {
  switch (dbStep) {
    case "child":
      return 0;
    case "preferences":
      return 0; // let user redo from start of child/prefs group
    case "paywall":
      return 6;
    case "partner_invite":
      return 7;
    case "complete":
      return -1; // should redirect, not render
    default:
      return 0;
  }
}

/** Map UI step name to the corresponding DB step for query params */
function uiStepToIndex(step: string): number | null {
  const idx = STEPS.indexOf(step as Step);
  return idx >= 0 ? idx : null;
}

/** Descriptions for each topic shown during onboarding selection. */
const TOPIC_DESCRIPTIONS: Record<string, string> = {
  prenatal: "Pregnancy health, prenatal visits, and preparing for birth",
  newborn_care: "First weeks at home, feeding basics, and newborn essentials",
  nutrition_and_diet: "Healthy eating for you and your growing child",
  vaccinations: "Immunization schedules and vaccine information",
  breastfeeding: "Breastfeeding, bottle feeding, and introducing solids",
  emotional_wellness: "Mental health, stress management, and self-care",
  sleep: "Sleep training, routines, and solving sleep challenges",
  milestones: "Tracking development and knowing what to expect",
  safety: "Childproofing, safe sleep, and injury prevention",
  postpartum: "Recovery, hormonal changes, and adjusting to parenthood",
  infant_development: "Growth, learning, and play from 0\u201312 months",
  toddler_development: "Walking, talking, and independence from 1\u20133 years",
  relationships: "Keeping your partnership strong through parenthood",
};

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const searchParams = useSearchParams();

  // Child form state
  const [childName, setChildName] = useState("");
  const [isBorn, setIsBorn] = useState<boolean | null>(null);
  const [childDate, setChildDate] = useState("");

  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferencesInput>({
    birth_preference: null,
    feeding_preference: null,
    vaccine_stance: null,
    religion: null,
    dietary_preference: null,
    parenting_style: null,
    topics_of_interest: [],
  });

  // Partner invite state
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  // Guard + resume: check onboarding status and resume from DB step
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth/login";
        return;
      }
      const { data } = await supabase
        .from("users")
        .select("onboarding_complete, onboarding_step")
        .eq("id", user.id)
        .single();

      if (data?.onboarding_complete) {
        window.location.href = "/dashboard";
        return;
      }

      // Resume support: check query param first (Stripe return), then DB step
      const stepParam = searchParams.get("step");
      if (stepParam) {
        const idx = uiStepToIndex(stepParam);
        if (idx !== null) {
          setCurrentStep(idx);
          setReady(true);
          return;
        }
      }

      if (data?.onboarding_step) {
        const idx = dbStepToIndex(data.onboarding_step as OnboardingStep);
        if (idx >= 0) {
          setCurrentStep(idx);
        }
      }

      setReady(true);
    };
    checkOnboardingStatus();
  }, [supabase, searchParams]);

  const step = STEPS[currentStep];
  // Show preference progress as "Step X of 8" for the first 6 steps,
  // then contextual labels for paywall/partner invite
  const isPreferenceStep = currentStep < 6;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  function nextStep() {
    setError(null);
    if (currentStep < STEPS.length - 1) {
      // If advancing past topics (index 5), save data to DB first
      if (currentStep === 5) {
        handleSaveAndAdvance();
      } else {
        setCurrentStep((s) => s + 1);
      }
    }
  }

  function prevStep() {
    setError(null);
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  /** Save child + preferences after the topics step, then advance to paywall */
  async function handleSaveAndAdvance() {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/auth/login";
        return;
      }

      // Create child profile
      const { error: childError } = await supabase.from("children").insert({
        user_id: user.id,
        name: childName,
        is_born: isBorn ?? false,
        dob: isBorn ? childDate : null,
        due_date: !isBorn ? childDate : null,
      });

      if (childError) {
        setError("Failed to save child profile. Please try again.");
        setLoading(false);
        return;
      }

      // Save preferences
      const { error: prefError } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
        });

      if (prefError) {
        setError("Failed to save preferences. Please try again.");
        setLoading(false);
        return;
      }

      // Update onboarding step to 'paywall'
      await supabase
        .from("users")
        .update({ onboarding_step: "paywall" })
        .eq("id", user.id);

      setCurrentStep(6); // paywall
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /** Handle Stripe checkout redirect */
  async function handleStartTrial(plan: "premium" | "family") {
    setLoading(true);
    setError(null);
    try {
      const res = await api.stripe.checkout({
        plan,
        interval: "monthly",
        return_url: "/onboarding?step=partner_invite",
      });
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch {
      setError("Failed to start checkout. Please try again.");
      setLoading(false);
    }
  }

  /** Skip paywall and advance to partner invite */
  async function handleSkipPaywall() {
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("users")
          .update({ onboarding_step: "partner_invite" })
          .eq("id", user.id);
      }
    } catch {
      // Non-critical — still advance
    }
    setCurrentStep(7);
  }

  /** Send partner invite and complete onboarding */
  async function handleSendInvite() {
    if (!partnerEmail) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.household.invite({
        email: partnerEmail,
        display_name: partnerName || undefined,
      });
      if (res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      setInviteSent(true);
      await completeOnboarding();
    } catch {
      setError("Failed to send invite. Please try again.");
      setLoading(false);
    }
  }

  /** Complete onboarding — set both flags and redirect */
  async function completeOnboarding() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("users")
        .update({ onboarding_complete: true, onboarding_step: "complete" })
        .eq("id", user.id);
    } catch {
      // Non-critical — redirect anyway since data is already saved
    }
    window.location.href = "/dashboard";
  }

  /** Skip partner invite and complete onboarding */
  async function handleSkipPartnerInvite() {
    setLoading(true);
    await completeOnboarding();
  }

  // Don't render the form until we've confirmed onboarding is needed
  if (!ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50/50 via-white to-sage-50/50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50/50 via-white to-sage-50/50 px-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-stone-500">
            {isPreferenceStep ? (
              <>
                <span>
                  Step {currentStep + 1} of {STEPS.length}
                </span>
                <span>{Math.round(progress)}%</span>
              </>
            ) : (
              <span>Almost done!</span>
            )}
          </div>
          <div className="h-2 rounded-full bg-stone-200">
            <div
              className="h-2 rounded-full bg-brand-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step content */}
        <div
          key={step}
          className="animate-step-enter rounded-2xl border border-stone-200/60 bg-white p-8 shadow-card"
        >
          {step === "child" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Tell us about your little one
              </h2>
              <div>
                <label className="block text-sm font-medium text-stone-700">
                  Child&apos;s name (or nickname)
                </label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="e.g., Baby, Emma, Little One"
                  className="mt-1 block w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Has your baby been born yet?
                </label>
                <div className="flex gap-3">
                  {[
                    { label: "Yes, already born", value: true },
                    { label: "Not yet, expecting!", value: false },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => setIsBorn(opt.value)}
                      className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                        isBorn === opt.value
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-stone-200 text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {isBorn !== null && (
                <div>
                  <label className="block text-sm font-medium text-stone-700">
                    {isBorn ? "Date of birth" : "Expected due date"}
                  </label>
                  <input
                    type="date"
                    value={childDate}
                    onChange={(e) => setChildDate(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              )}
            </div>
          )}

          {step === "birth" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Birth preference</h2>
              <p className="text-sm text-stone-600">
                This helps us show you the most relevant resources. You can
                always change this later.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TAG_NAMESPACES.birth.values.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setPreferences((p) => ({
                        ...p,
                        birth_preference: opt.value as any,
                      }))
                    }
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      preferences.birth_preference === opt.value
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-stone-200 text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "feeding" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Feeding plans</h2>
              <p className="text-sm text-stone-600">
                Whatever you choose, we&apos;ll have resources to support you.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TAG_NAMESPACES.feeding.values.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setPreferences((p) => ({
                        ...p,
                        feeding_preference: opt.value as any,
                      }))
                    }
                    className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors ${
                      preferences.feeding_preference === opt.value
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-stone-200 text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "vaccines" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Vaccination approach</h2>
              <p className="text-sm text-stone-600">
                We respect every family&apos;s decision. This helps us present
                information in a way that&apos;s most useful to you.
              </p>
              <div className="space-y-2">
                {[
                  {
                    value: "standard",
                    label: "Standard CDC schedule",
                    desc: "Following the recommended vaccination timeline",
                  },
                  {
                    value: "delayed",
                    label: "Delayed schedule",
                    desc: "Spreading vaccines out over a longer timeline",
                  },
                  {
                    value: "selective",
                    label: "Selective",
                    desc: "Choosing some vaccines but not all",
                  },
                  {
                    value: "hesitant",
                    label: "Vaccine-hesitant",
                    desc: "Still researching and deciding",
                  },
                  {
                    value: "prefer_not_to_say",
                    label: "Prefer not to say",
                    desc: "",
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setPreferences((p) => ({
                        ...p,
                        vaccine_stance: opt.value as any,
                      }))
                    }
                    className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                      preferences.vaccine_stance === opt.value
                        ? "border-brand-500 bg-brand-50"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="text-sm font-medium text-stone-900">
                      {opt.label}
                    </div>
                    {opt.desc && (
                      <div className="text-xs text-stone-500">{opt.desc}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "lifestyle" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                A bit more about your family
              </h2>
              <div>
                <label className="block text-sm font-medium text-stone-700">
                  Religious or spiritual tradition (optional)
                </label>
                <select
                  value={preferences.religion ?? ""}
                  onChange={(e) =>
                    setPreferences((p) => ({
                      ...p,
                      religion: e.target.value || null,
                    }))
                  }
                  className="mt-1 block w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Prefer not to say</option>
                  {TAG_NAMESPACES.faith.values.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">
                  Dietary preferences
                </label>
                <select
                  value={preferences.dietary_preference ?? "omnivore"}
                  onChange={(e) =>
                    setPreferences((p) => ({
                      ...p,
                      dietary_preference: e.target.value as any,
                    }))
                  }
                  className="mt-1 block w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                >
                  <option value="omnivore">No restrictions</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="kosher">Kosher</option>
                  <option value="halal">Halal</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">
                  Parenting philosophy
                </label>
                <select
                  value={preferences.parenting_style ?? "no_preference"}
                  onChange={(e) =>
                    setPreferences((p) => ({
                      ...p,
                      parenting_style: e.target.value as any,
                    }))
                  }
                  className="mt-1 block w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
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
          )}

          {step === "topics" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                What interests you most?
              </h2>
              <p className="text-sm text-stone-600">
                Select the topics you&apos;d like to see more of in your feed.
                You&apos;ll still have access to everything &mdash; this just
                helps us personalize your experience.
              </p>
              {preferences.topics_of_interest &&
                preferences.topics_of_interest.length > 0 && (
                  <p className="text-xs text-brand-600 font-medium">
                    {preferences.topics_of_interest.length} topic
                    {preferences.topics_of_interest.length === 1 ? "" : "s"}{" "}
                    selected
                  </p>
                )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TOPIC_KEYS.map((key) => {
                  const topic = TOPICS[key];
                  const description = TOPIC_DESCRIPTIONS[key];
                  const selected =
                    preferences.topics_of_interest?.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() =>
                        setPreferences((p) => ({
                          ...p,
                          topics_of_interest: selected
                            ? (p.topics_of_interest ?? []).filter(
                                (t) => t !== key
                              )
                            : [...(p.topics_of_interest ?? []), key],
                        }))
                      }
                      className={`rounded-xl border-2 px-3 py-3 text-left transition-colors ${
                        selected
                          ? "border-brand-500 bg-brand-50"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <div
                        className={`text-sm font-medium ${selected ? "text-brand-700" : "text-stone-800"}`}
                      >
                        {topic.label}
                      </div>
                      {description && (
                        <div className="mt-0.5 text-xs text-stone-500">
                          {description}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === "paywall" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold">
                  Unlock the full Kinpath experience
                </h2>
                <p className="mt-2 text-sm text-stone-600">
                  Your preferences are saved! Upgrade for unlimited AI
                  questions, partner sharing, and more.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Premium card */}
                <div className="rounded-xl border-2 border-brand-500 bg-brand-50/30 p-5 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-brand-700">
                      Premium
                    </h3>
                    <p className="text-2xl font-bold text-stone-900">
                      ${TIER_PRICING.premium.monthly}
                      <span className="text-sm font-normal text-stone-500">
                        /mo
                      </span>
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-sm text-stone-700">
                    <li>Unlimited AI questions</li>
                    <li>Partner sharing</li>
                    <li>Email digests</li>
                    <li>Bookmarks & printables</li>
                  </ul>
                  <button
                    onClick={() => handleStartTrial("premium")}
                    disabled={loading}
                    className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Loading..." : "Start Free Trial"}
                  </button>
                </div>

                {/* Family card */}
                <div className="rounded-xl border-2 border-stone-200 p-5 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-800">
                      Family
                    </h3>
                    <p className="text-2xl font-bold text-stone-900">
                      ${TIER_PRICING.family.monthly}
                      <span className="text-sm font-normal text-stone-500">
                        /mo
                      </span>
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-sm text-stone-700">
                    <li>Everything in Premium</li>
                    <li>Up to 5 household members</li>
                    <li>Unlimited children</li>
                  </ul>
                  <button
                    onClick={() => handleStartTrial("family")}
                    disabled={loading}
                    className="w-full rounded-xl border border-stone-300 bg-white py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Loading..." : "Start Free Trial"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "partner_invite" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Invite your partner or co-parent
              </h2>
              <p className="text-sm text-stone-600">
                Share your Kinpath experience with a partner, co-parent, or
                caregiver. They&apos;ll get access to the same child profiles
                and resources.
              </p>
              {inviteSent ? (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  Invite sent! Redirecting to your dashboard...
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      Partner&apos;s email
                    </label>
                    <input
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      placeholder="partner@example.com"
                      className="mt-1 block w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700">
                      Their name (optional)
                    </label>
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="e.g., Alex"
                      className="mt-1 block w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          {/* Back button — hidden on paywall/partner_invite since those are post-save */}
          <button
            onClick={prevStep}
            disabled={currentStep === 0 || currentStep >= 6}
            className="rounded-xl px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 disabled:invisible"
          >
            Back
          </button>

          <div className="flex gap-3">
            {/* Skip button for preference steps (not child, not paywall/invite) */}
            {step !== "child" && isPreferenceStep && (
              <button
                onClick={nextStep}
                className="rounded-xl px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700"
              >
                Skip
              </button>
            )}

            {/* Continue with Free Plan — paywall skip */}
            {step === "paywall" && (
              <button
                onClick={handleSkipPaywall}
                disabled={loading}
                className="rounded-xl px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700 disabled:opacity-50"
              >
                Continue with Free Plan
              </button>
            )}

            {/* Partner invite buttons */}
            {step === "partner_invite" && !inviteSent && (
              <>
                <button
                  onClick={handleSkipPartnerInvite}
                  disabled={loading}
                  className="rounded-xl px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700 disabled:opacity-50"
                >
                  I&apos;ll do this later
                </button>
                <button
                  onClick={handleSendInvite}
                  disabled={loading || !partnerEmail}
                  className="rounded-xl bg-brand-500 px-6 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Sending..." : "Send Invite"}
                </button>
              </>
            )}

            {/* Standard continue button for preference steps */}
            {isPreferenceStep && (
              <button
                onClick={nextStep}
                disabled={
                  loading ||
                  (step === "child" &&
                    (!childName || isBorn === null || !childDate))
                }
                className="rounded-xl bg-brand-500 px-6 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                {loading
                  ? "Saving..."
                  : currentStep === 5
                    ? "Save & Continue"
                    : "Continue"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
