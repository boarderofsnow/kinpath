import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, typography, spacing, radii } from "../../lib/theme";
import { PressableScale } from "../motion";
import { api } from "../../lib/api";

interface AccountSectionProps {
  onSignOut: () => Promise<{ data?: any; error?: { message: string } }>;
}

export function AccountSection({ onSignOut }: AccountSectionProps) {
  const [signingOut, setSigningOut] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setSigningOut(true);
          try {
            const { error } = await onSignOut();
            if (error) {
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          } catch {
            Alert.alert("Error", "An unexpected error occurred.");
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    setDeleteLoading(true);
    try {
      const { error } = await api.account.delete();
      if (error) {
        Alert.alert("Error", error);
        setDeleteLoading(false);
        setDeleteConfirm(false);
        return;
      }
      // Sign out after deletion
      await onSignOut();
    } catch {
      Alert.alert("Error", "Failed to delete account. Please try again.");
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  };

  return (
    <View>
      {/* Sign Out */}
      <PressableScale
        style={styles.signOutButton}
        onPress={handleSignOut}
        disabled={signingOut}
      >
        {signingOut ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={18} color={colors.white} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </>
        )}
      </PressableScale>

      {/* Delete Account */}
      <View style={styles.deleteSection}>
        {deleteConfirm ? (
          <View style={styles.deleteConfirmRow}>
            <PressableScale
              style={styles.deleteConfirmButton}
              onPress={handleDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.deleteConfirmText}>
                  Confirm: Delete my account permanently
                </Text>
              )}
            </PressableScale>
            <PressableScale
              style={styles.cancelDeleteButton}
              onPress={() => setDeleteConfirm(false)}
            >
              <Text style={styles.cancelDeleteText}>Cancel</Text>
            </PressableScale>
          </View>
        ) : (
          <PressableScale onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </PressableScale>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: radii.md,
    paddingVertical: 14,
  },
  signOutText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.white,
  },
  deleteSection: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  deleteText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.stone[400],
  },
  deleteConfirmRow: {
    width: "100%",
    gap: spacing.md,
  },
  deleteConfirmButton: {
    backgroundColor: colors.error,
    borderRadius: radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteConfirmText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.white,
  },
  cancelDeleteButton: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  cancelDeleteText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.stone[500],
  },
});
