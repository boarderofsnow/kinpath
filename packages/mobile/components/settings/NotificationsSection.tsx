import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../lib/supabase";
import type { NotificationPreferences } from "@kinpath/shared";
import { colors, fonts, typography, spacing, radii } from "../../lib/theme";
import { PressableScale } from "../motion";
import { PickerModal, type PickerOption } from "./PickerModal";

interface NotificationsSectionProps {
  notificationPrefs: NotificationPreferences | null;
  userId: string;
  onNotificationPrefsChange: (prefs: NotificationPreferences) => void;
}

const DAY_OPTIONS: PickerOption[] = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

const FREQUENCY_OPTIONS = ["daily", "weekly", "monthly"] as const;

const CONTENT_TOGGLES = [
  { key: "pregnancy_updates" as const, label: "Pregnancy progress", desc: "Weekly pregnancy updates and tips" },
  { key: "new_resources" as const, label: "New resources", desc: "When new articles or guides are published" },
  { key: "planning_reminders" as const, label: "Planning reminders", desc: "Upcoming checklist items and deadlines" },
  { key: "product_updates" as const, label: "Product updates", desc: "New features and improvements" },
];

type ContentKey = "pregnancy_updates" | "new_resources" | "planning_reminders" | "product_updates";

export function NotificationsSection({
  notificationPrefs,
  userId,
  onNotificationPrefsChange,
}: NotificationsSectionProps) {
  const [emailEnabled, setEmailEnabled] = useState(notificationPrefs?.email_enabled ?? true);
  const [frequency, setFrequency] = useState(notificationPrefs?.email_frequency ?? "weekly");
  const [preferredDay, setPreferredDay] = useState(notificationPrefs?.preferred_day ?? 1);
  const [contentPrefs, setContentPrefs] = useState({
    pregnancy_updates: notificationPrefs?.pregnancy_updates ?? true,
    new_resources: notificationPrefs?.new_resources ?? true,
    planning_reminders: notificationPrefs?.planning_reminders ?? true,
    product_updates: notificationPrefs?.product_updates ?? false,
  });

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [showDayPicker, setShowDayPicker] = useState(false);

  // Sync with props
  useEffect(() => {
    if (notificationPrefs) {
      setEmailEnabled(notificationPrefs.email_enabled);
      setFrequency(notificationPrefs.email_frequency);
      setPreferredDay(notificationPrefs.preferred_day);
      setContentPrefs({
        pregnancy_updates: notificationPrefs.pregnancy_updates,
        new_resources: notificationPrefs.new_resources,
        planning_reminders: notificationPrefs.planning_reminders,
        product_updates: notificationPrefs.product_updates,
      });
    }
  }, [notificationPrefs]);

  const toggleContent = (key: ContentKey) => {
    setContentPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg("");

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: userId,
            email_enabled: emailEnabled,
            email_frequency: frequency,
            preferred_day: preferredDay,
            ...contentPrefs,
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();

      if (error) {
        setSavedMsg(`Error: ${error.message}`);
      } else {
        setSavedMsg("Notifications saved");
        if (data) onNotificationPrefsChange(data as NotificationPreferences);
        setTimeout(() => setSavedMsg(""), 2500);
      }
    } catch {
      setSavedMsg("Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  };

  const dayLabel = DAY_OPTIONS.find((d) => d.value === String(preferredDay))?.label ?? "Monday";

  return (
    <View>
      {/* Master toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleInfo}>
          <Text style={styles.toggleLabel}>Email notifications</Text>
          <Text style={styles.toggleDesc}>Receive email updates about your child's development</Text>
        </View>
        <Switch
          value={emailEnabled}
          onValueChange={setEmailEnabled}
          trackColor={{ false: colors.stone[200], true: colors.brand[400] }}
          thumbColor={colors.white}
        />
      </View>

      {/* Controls (dim when email disabled) */}
      <View style={!emailEnabled ? styles.disabled : undefined} pointerEvents={emailEnabled ? "auto" : "none"}>
        {/* Frequency */}
        <Text style={styles.subsectionTitle}>Email frequency</Text>
        <View style={styles.frequencyRow}>
          {FREQUENCY_OPTIONS.map((opt) => {
            const selected = frequency === opt;
            return (
              <PressableScale
                key={opt}
                style={[styles.frequencyPill, selected && styles.frequencyPillSelected]}
                onPress={() => setFrequency(opt)}
              >
                <Text
                  style={[
                    styles.frequencyText,
                    selected && styles.frequencyTextSelected,
                  ]}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </PressableScale>
            );
          })}
        </View>

        {/* Preferred day (weekly only) */}
        {frequency === "weekly" && (
          <View style={styles.dayRow}>
            <Text style={styles.dayLabel}>Preferred day</Text>
            <PressableScale
              style={styles.dayButton}
              onPress={() => setShowDayPicker(true)}
            >
              <Text style={styles.dayValue}>{dayLabel}</Text>
            </PressableScale>
            <PickerModal
              visible={showDayPicker}
              title="Preferred Day"
              options={DAY_OPTIONS}
              selectedValue={String(preferredDay)}
              onSelect={(v) => {
                if (v !== null) setPreferredDay(parseInt(v, 10));
                setShowDayPicker(false);
              }}
              onClose={() => setShowDayPicker(false)}
              allowClear={false}
            />
          </View>
        )}

        {/* Content toggles */}
        <Text style={[styles.subsectionTitle, { marginTop: spacing.xl }]}>
          What to include
        </Text>
        {CONTENT_TOGGLES.map((toggle) => (
          <View key={toggle.key} style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>{toggle.label}</Text>
              <Text style={styles.toggleDesc}>{toggle.desc}</Text>
            </View>
            <Switch
              value={contentPrefs[toggle.key]}
              onValueChange={() => toggleContent(toggle.key)}
              trackColor={{ false: colors.stone[200], true: colors.brand[400] }}
              thumbColor={colors.white}
            />
          </View>
        ))}
      </View>

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
            <Text style={styles.saveButtonText}>Save Notifications</Text>
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.stone[200]}66`,
  },
  toggleInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  toggleLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.foreground,
  },
  toggleDesc: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.stone[500],
    marginTop: 2,
  },
  disabled: {
    opacity: 0.4,
  },
  subsectionTitle: {
    ...typography.headingSmall,
    color: colors.foreground,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  frequencyRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  frequencyPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.stone[200],
    backgroundColor: colors.white,
  },
  frequencyPillSelected: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[50],
  },
  frequencyText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.stone[500],
  },
  frequencyTextSelected: {
    fontFamily: fonts.sansSemiBold,
    color: colors.brand[600],
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  dayLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.foreground,
  },
  dayButton: {
    borderWidth: 1,
    borderColor: colors.stone[200],
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  dayValue: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.brand[600],
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
