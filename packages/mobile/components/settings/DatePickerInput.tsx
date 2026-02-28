import React, { useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing, radii } from "../../lib/theme";
import { PressableScale } from "../motion";

interface DatePickerInputProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  maximumDate?: Date;
  minimumDate?: Date;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function DatePickerInput({
  label,
  value,
  onChange,
  maximumDate,
  minimumDate,
}: DatePickerInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {Platform.OS === "ios" ? (
        /* iOS: always-visible compact picker */
        <View style={styles.iosPickerWrapper}>
          <DateTimePicker
            value={value || new Date()}
            mode="date"
            display="compact"
            onChange={handleChange}
            maximumDate={maximumDate}
            minimumDate={minimumDate}
            accentColor={colors.brand[500]}
          />
        </View>
      ) : (
        /* Android: tap to open dialog */
        <>
          <PressableScale
            style={styles.androidButton}
            onPress={() => setShowPicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={colors.stone[500]} />
            <Text style={[styles.dateText, !value && styles.placeholder]}>
              {value ? formatDate(value) : "Select a date"}
            </Text>
          </PressableScale>

          {showPicker && (
            <DateTimePicker
              value={value || new Date()}
              mode="date"
              display="default"
              onChange={handleChange}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  iosPickerWrapper: {
    alignItems: "flex-start",
  },
  androidButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.stone[200],
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  dateText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.foreground,
  },
  placeholder: {
    color: colors.stone[400],
  },
});
