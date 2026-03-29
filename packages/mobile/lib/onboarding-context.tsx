import React, { createContext, useContext, useState, type ReactNode } from "react";
import type { UserPreferencesInput } from "@kinpath/shared";
import { supabase } from "./supabase";
import { useAuth } from "./auth-context";

interface OnboardingContextType {
  // Child form state
  childName: string;
  setChildName: (name: string) => void;
  isBorn: boolean | null;
  setIsBorn: (born: boolean | null) => void;
  childDate: string;
  setChildDate: (date: string) => void;

  // Preferences state
  preferences: UserPreferencesInput;
  updatePreferences: (updater: (p: UserPreferencesInput) => UserPreferencesInput) => void;

  // Save + advance
  saveToDatabase: () => Promise<boolean>;
  saving: boolean;
  error: string | null;
  clearError: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return ctx;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

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

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePreferences = (updater: (p: UserPreferencesInput) => UserPreferencesInput) => {
    setPreferences(updater);
  };

  const clearError = () => setError(null);

  /** Persist child + preferences to DB and advance onboarding_step to 'paywall'. */
  const saveToDatabase = async (): Promise<boolean> => {
    if (!user?.id) {
      setError("Not authenticated. Please sign in again.");
      return false;
    }

    setSaving(true);
    setError(null);

    try {
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
        return false;
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
        return false;
      }

      // Advance onboarding step to paywall
      await supabase
        .from("users")
        .update({ onboarding_step: "paywall" })
        .eq("id", user.id);

      return true;
    } catch {
      setError("Something went wrong. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        childName,
        setChildName,
        isBorn,
        setIsBorn,
        childDate,
        setChildDate,
        preferences,
        updatePreferences,
        saveToDatabase,
        saving,
        error,
        clearError,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}
