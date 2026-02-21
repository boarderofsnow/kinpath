"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  TOPICS,
  TOPIC_KEYS,
  TAG_NAMESPACES,
  type UserPreferencesInput,
} from "@kinpath/shared";

type Step = "child" | "birth" | "feeding" | "vaccines" | "lifestyle" | "topics";

const STEPS: Step[] = ["child", "birth", "feeding", "vaccines", "lifestyle", "topics"];

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
  const router = useRouter();
  const supabase = createClient();

  // Child form state
  const [childName, setChildName] = useState("");
  const [isBorn, setIsBorn] = useState<boolean | null>(null);
  const [childDate, setChildDate] = useState(""); // DOB or due date

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

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  function nextStep() {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  }

  function prevStep() {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  async function handleComplete() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create child profile
    await supabase.from("children").insert({
      user_id: user.id,
      name: childName,
      is_born: isBorn ?? false,
      dob: isBorn ? childDate : null,
      due_date: !isBorn ? childDate : null,
    });

    // Save preferences
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      ...preferences,
    });

    // Mark onboarding complete
    await supabase
      .from("users")
      .update({ onboarding_complete: true })
      .eq("id", user.id);

    router.refresh();
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-8">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-stone-500">
            <span>Step {currentStep + 1} of {STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-stone-200">
            <div
              className="h-2 rounded-full bg-brand-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-stone-200/60 bg-white p-8 shadow-card">
          {step === "child" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Tell us about your little one</h2>
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
                    { label: "Not yet — expecting!", value: false },
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
                This helps us show you the most relevant resources. You can always change this later.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {TAG_NAMESPACES.birth.values.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setPreferences((p) => ({ ...p, birth_preference: opt.value as any }))
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
                      setPreferences((p) => ({ ...p, feeding_preference: opt.value as any }))
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
                We respect every family&apos;s decision. This helps us present information in a way that&apos;s most useful to you.
              </p>
              <div className="space-y-2">
                {[
                  { value: "standard", label: "Standard CDC schedule", desc: "Following the recommended vaccination timeline" },
                  { value: "delayed", label: "Delayed schedule", desc: "Spreading vaccines out over a longer timeline" },
                  { value: "selective", label: "Selective", desc: "Choosing some vaccines but not all" },
                  { value: "hesitant", label: "Vaccine-hesitant", desc: "Still researching and deciding" },
                  { value: "prefer_not_to_say", label: "Prefer not to say", desc: "" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setPreferences((p) => ({ ...p, vaccine_stance: opt.value as any }))
                    }
                    className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                      preferences.vaccine_stance === opt.value
                        ? "border-brand-500 bg-brand-50"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    <div className="text-sm font-medium text-stone-900">{opt.label}</div>
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
              <h2 className="text-xl font-semibold">A bit more about your family</h2>
              <div>
                <label className="block text-sm font-medium text-stone-700">
                  Religious or spiritual tradition (optional)
                </label>
                <select
                  value={preferences.religion ?? ""}
                  onChange={(e) =>
                    setPreferences((p) => ({ ...p, religion: e.target.value || null }))
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
                    setPreferences((p) => ({ ...p, dietary_preference: e.target.value as any }))
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
                    setPreferences((p) => ({ ...p, parenting_style: e.target.value as any }))
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
              <h2 className="text-xl font-semibold">What interests you most?</h2>
              <p className="text-sm text-stone-600">
                Select the topics you&apos;d like to see more of in your feed.
                You&apos;ll still have access to everything &mdash; this just
                helps us personalize your experience.
              </p>
              {preferences.topics_of_interest &&
                preferences.topics_of_interest.length > 0 && (
                  <p className="text-xs text-brand-600 font-medium">
                    {preferences.topics_of_interest.length} topic
                    {preferences.topics_of_interest.length === 1 ? "" : "s"} selected
                  </p>
                )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TOPIC_KEYS.map((key) => {
                  const topic = TOPICS[key];
                  const description = TOPIC_DESCRIPTIONS[key];
                  const selected = preferences.topics_of_interest?.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() =>
                        setPreferences((p) => ({
                          ...p,
                          topics_of_interest: selected
                            ? (p.topics_of_interest ?? []).filter((t) => t !== key)
                            : [...(p.topics_of_interest ?? []), key],
                        }))
                      }
                      className={`rounded-xl border-2 px-3 py-3 text-left transition-colors ${
                        selected
                          ? "border-brand-500 bg-brand-50"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <div className={`text-sm font-medium ${selected ? "text-brand-700" : "text-stone-800"}`}>
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
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="rounded-xl px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 disabled:invisible"
          >
            Back
          </button>
          <div className="flex gap-3">
            {step !== "child" && (
              <button
                onClick={nextStep}
                className="rounded-xl px-4 py-2 text-sm font-medium text-stone-500 hover:text-stone-700"
              >
                Skip
              </button>
            )}
            <button
              onClick={nextStep}
              disabled={loading || (step === "child" && (!childName || isBorn === null || !childDate))}
              className="rounded-xl bg-brand-500 px-6 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              {loading
                ? "Saving..."
                : currentStep === STEPS.length - 1
                  ? "Finish Setup"
                  : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
