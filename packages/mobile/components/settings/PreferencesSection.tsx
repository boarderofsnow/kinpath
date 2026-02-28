import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { TOPICS, TOPIC_KEYS, TAG_NAMESPACES } from "@kinpath/shared";
import type { UserPreferences, TopicKey } from "@kinpath/shared";
import { colors, fonts, typography, spacing, radii } from "../../lib/theme";
import { PressableScale } from "../motion";
import { PickerModal, type PickerOption } from "./PickerModal";

interface PreferencesSectionProps {
  preferences: UserPreferences | null;
  userId: string;
  onPreferencesChange: (prefs: UserPreferences) => void;
}

// ── Dropdown options (match web) ──────────────────────

const BIRTH_OPTIONS: PickerOption[] = [
  ...TAG_NAMESPACES.birth.values.map((v) => ({ value: v.value, label: v.label })),
  { value: "undecided", label: "Undecided" },
];

const FEEDING_OPTIONS: PickerOption[] = [
  ...TAG_NAMESPACES.feeding.values.map((v) => ({ value: v.value, label: v.label })),
  { value: "undecided", label: "Undecided" },
];

const VACCINE_OPTIONS: PickerOption[] = [
  { value: "standard", label: "Standard CDC Schedule" },
  { value: "delayed", label: "Delayed Schedule" },
  { value: "selective", label: "Selective Vaccination" },
  { value: "hesitant", label: "Vaccine-hesitant" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const FAITH_OPTIONS: PickerOption[] = TAG_NAMESPACES.faith.values.map((v) => ({
  value: v.value,
  label: v.label,
}));

const DIET_OPTIONS: PickerOption[] = [
  { value: "omnivore", label: "No restrictions (omnivore)" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "kosher", label: "Kosher" },
  { value: "halal", label: "Halal" },
  { value: "other", label: "Other" },
];

const PARENTING_OPTIONS: PickerOption[] = [
  ...TAG_NAMESPACES.parenting.values.map((v) => ({ value: v.value, label: v.label })),
  { value: "no_preference", label: "No preference" },
];

// ── Ionicons name mapping for topics ──────────────────
const TOPIC_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  prenatal: "body-outline",
  newborn_care: "heart-outline",
  nutrition_and_diet: "nutrition-outline",
  vaccinations: "medkit-outline",
  breastfeeding: "water-outline",
  emotional_wellness: "happy-outline",
  sleep: "moon-outline",
  milestones: "flag-outline",
  safety: "shield-outline",
  postpartum: "flower-outline",
  infant_development: "trending-up-outline",
  toddler_development: "footsteps-outline",
  relationships: "people-outline",
};

export function PreferencesSection({
  preferences,
  userId,
  onPreferencesChange,
}: PreferencesSectionProps) {
  // Local editable state
  const [topics, setTopics] = useState<string[]>(preferences?.topics_of_interest ?? []);
  const [birthPref, setBirthPref] = useState<string | null>(preferences?.birth_preference ?? null);
  const [feedingPref, setFeedingPref] = useState<string | null>(preferences?.feeding_preference ?? null);
  const [vaccinePref, setVaccinePref] = useState<string | null>(preferences?.vaccine_stance ?? null);
  const [faithPref, setFaithPref] = useState<string | null>(preferences?.religion ?? null);
  const [dietPref, setDietPref] = useState<string | null>(preferences?.dietary_preference ?? null);
  const [parentingPref, setParentingPref] = useState<string | null>(preferences?.parenting_style ?? null);

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // Active picker
  const [activePicker, setActivePicker] = useState<string | null>(null);

  // Sync with props when they change (e.g., pull-to-refresh)
  useEffect(() => {
    setTopics(preferences?.topics_of_interest ?? []);
    setBirthPref(preferences?.birth_preference ?? null);
    setFeedingPref(preferences?.feeding_preference ?? null);
    setVaccinePref(preferences?.vaccine_stance ?? null);
    setFaithPref(preferences?.religion ?? null);
    setDietPref(preferences?.dietary_preference ?? null);
    setParentingPref(preferences?.parenting_style ?? null);
  }, [preferences]);

  const toggleTopic = (key: string) => {
    setTopics((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg("");

    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: userId,
          topics_of_interest: topics,
          birth_preference: birthPref,
          feeding_preference: feedingPref,
          vaccine_stance: vaccinePref,
          religion: faithPref,
          dietary_preference: dietPref,
          parenting_style: parentingPref,
        })
        .select()
        .single();

      if (error) {
        setSavedMsg(`Error: ${error.message}`);
      } else {
        setSavedMsg("Preferences saved");
        if (data) onPreferencesChange(data as UserPreferences);
        setTimeout(() => setSavedMsg(""), 2500);
      }
    } catch {
      setSavedMsg("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  // Helper to get label for a selected value
  const getLabel = (options: PickerOption[], value: string | null): string => {
    if (!value) return "Not selected";
    return options.find((o) => o.value === value)?.label ?? value;
  };

  // Picker config for each dropdown
  const pickers: {
    key: string;
    label: string;
    options: PickerOption[];
    value: string | null;
    onSelect: (v: string | null) => void;
  }[] = [
    { key: "birth", label: "Birth Preference", options: BIRTH_OPTIONS, value: birthPref, onSelect: setBirthPref },
    { key: "feeding", label: "Feeding Preference", options: FEEDING_OPTIONS, value: feedingPref, onSelect: setFeedingPref },
    { key: "vaccine", label: "Vaccination Approach", options: VACCINE_OPTIONS, value: vaccinePref, onSelect: setVaccinePref },
    { key: "faith", label: "Faith & Spirituality", options: FAITH_OPTIONS, value: faithPref, onSelect: setFaithPref },
    { key: "diet", label: "Dietary Preferences", options: DIET_OPTIONS, value: dietPref, onSelect: setDietPref },
    { key: "parenting", label: "Parenting Philosophy", options: PARENTING_OPTIONS, value: parentingPref, onSelect: setParentingPref },
  ];

  return (
    <View>
      {/* Topics of Interest */}
      <Text style={styles.subsectionTitle}>Topics of Interest</Text>
      <Text style={styles.subsectionHint}>
        Select topics you're interested in to personalize your experience.
      </Text>
      <View style={styles.pillGrid}>
        {TOPIC_KEYS.map((key) => {
          const topic = TOPICS[key];
          const selected = topics.includes(key);
          const iconName = TOPIC_ICONS[key] || "ellipse-outline";
          return (
            <PressableScale
              key={key}
              style={[styles.pill, selected && styles.pillSelected]}
              onPress={() => toggleTopic(key)}
            >
              <Ionicons
                name={iconName}
                size={14}
                color={selected ? colors.brand[600] : colors.stone[400]}
              />
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>
                {topic.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      {/* Preference Dropdowns */}
      <Text style={[styles.subsectionTitle, { marginTop: spacing.xl }]}>
        Your Preferences
      </Text>

      {pickers.map((picker) => (
        <View key={picker.key} style={styles.dropdownRow}>
          <Text style={styles.dropdownLabel}>{picker.label}</Text>
          <PressableScale
            style={styles.dropdownButton}
            onPress={() => setActivePicker(picker.key)}
          >
            <Text
              style={[
                styles.dropdownValue,
                !picker.value && styles.dropdownPlaceholder,
              ]}
              numberOfLines={1}
            >
              {getLabel(picker.options, picker.value)}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.stone[400]} />
          </PressableScale>

          <PickerModal
            visible={activePicker === picker.key}
            title={picker.label}
            options={picker.options}
            selectedValue={picker.value}
            onSelect={(v) => {
              picker.onSelect(v);
              setActivePicker(null);
            }}
            onClose={() => setActivePicker(null)}
          />
        </View>
      ))}

      {/* Save */}
      <View style={styles.saveRow}>
        <PressableScale
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Preferences</Text>
          )}
        </PressableScale>
        {savedMsg ? (
          <Text
            style={[
              styles.savedMsg,
              savedMsg.startsWith("Error") && { color: colors.error },
            ]}
          >
            {savedMsg}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subsectionTitle: {
    ...typography.headingSmall,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  subsectionHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.stone[500],
    marginBottom: spacing.md,
  },
  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.stone[200],
    backgroundColor: colors.white,
  },
  pillSelected: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[50],
  },
  pillText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.stone[500],
  },
  pillTextSelected: {
    fontFamily: fonts.sansSemiBold,
    color: colors.brand[600],
  },

  // ── Dropdowns ───────────────────────────────
  dropdownRow: {
    marginBottom: spacing.lg,
  },
  dropdownLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.stone[200],
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  dropdownValue: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.foreground,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: colors.stone[400],
  },

  // ── Save ────────────────────────────────────
  saveRow: {
    marginTop: spacing.xl,
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.brand[500],
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: spacing["2xl"],
    alignItems: "center",
  },
  saveButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.white,
  },
  savedMsg: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.brand[600],
  },
});
