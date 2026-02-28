import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { HouseholdMember } from "@kinpath/shared";
import { colors, fonts, typography, spacing, radii } from "../../lib/theme";
import { PressableScale } from "../motion";
import { api } from "../../lib/api";

interface FamilySharingSectionProps {
  householdMembers: HouseholdMember[];
  isPartner: boolean;
  onMembersChange: (members: HouseholdMember[]) => void;
}

const STATUS_CONFIG = {
  pending: { label: "Invite sent", icon: "time-outline" as const, bg: colors.accent[50], text: colors.accent[700] },
  accepted: { label: "Joined", icon: "checkmark-circle-outline" as const, bg: "#dcfce7", text: "#15803d" },
  declined: { label: "Declined", icon: "close-circle-outline" as const, bg: colors.errorLight, text: colors.error },
};

export function FamilySharingSection({
  householdMembers,
  isPartner,
  onMembersChange,
}: FamilySharingSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // ── Partner view ──────────────────────────────
  if (isPartner) {
    return (
      <View style={styles.partnerCard}>
        <Ionicons name="people-circle-outline" size={32} color={colors.brand[500]} />
        <Text style={styles.partnerTitle}>You're sharing a household</Text>
        <Text style={styles.partnerDesc}>
          You have access to your partner's children, checklist, and doctor discussion list.
        </Text>
      </View>
    );
  }

  // ── Owner view ────────────────────────────────
  const handleInvite = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setError(null);
    setSuccess(null);
    setSending(true);

    try {
      const { data, error: apiError } = await api.household.invite({
        email: email.trim(),
      });

      if (apiError) {
        setError(apiError);
        setSending(false);
        return;
      }

      // Optimistic add
      const newMember: HouseholdMember = {
        id: (data as any)?.member_id ?? `temp-${Date.now()}`,
        household_id: "",
        user_id: null,
        invited_email: email.trim().toLowerCase(),
        display_name: displayName.trim() || null,
        role: "partner",
        status: "pending",
        invited_at: new Date().toISOString(),
        accepted_at: null,
      };
      onMembersChange([...householdMembers, newMember]);
      setEmail("");
      setDisplayName("");
      setShowForm(false);
      setSuccess(`Invite sent to ${email.trim()}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    setRemovingId(memberId);
    try {
      const { error: apiError } = await api.household.remove({
        partner_id: memberId,
      });

      if (apiError) {
        setError(apiError);
        setRemovingId(null);
        return;
      }

      onMembersChange(householdMembers.filter((m) => m.id !== memberId));
      setRemovingId(null);
    } catch {
      setError("Network error. Please try again.");
      setRemovingId(null);
    }
  };

  return (
    <View>
      <Text style={styles.description}>
        Invite your co-parent or partner to share your children's profiles, checklist, and
        doctor discussion list.
      </Text>

      {/* Invite button */}
      {!showForm && (
        <PressableScale
          style={styles.inviteButton}
          onPress={() => {
            setShowForm(true);
            setError(null);
          }}
        >
          <Ionicons name="person-add-outline" size={18} color={colors.brand[500]} />
          <Text style={styles.inviteButtonText}>Invite Partner</Text>
        </PressableScale>
      )}

      {/* Invite form */}
      {showForm && (
        <View style={styles.formCard}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Partner's email</Text>
            <TextInput
              style={styles.input}
              placeholder="partner@example.com"
              placeholderTextColor={colors.stone[400]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Display name{" "}
              <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Alex"
              placeholderTextColor={colors.stone[400]}
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.formActions}>
            <PressableScale
              style={styles.sendButton}
              onPress={handleInvite}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="mail-outline" size={16} color={colors.white} />
                  <Text style={styles.sendButtonText}>Send Invite</Text>
                </>
              )}
            </PressableScale>
            <PressableScale
              style={styles.cancelButton}
              onPress={() => {
                setShowForm(false);
                setError(null);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </PressableScale>
          </View>
        </View>
      )}

      {/* Success message */}
      {success && !showForm && (
        <Text style={styles.success}>{success}</Text>
      )}

      {/* Members list */}
      {householdMembers.length > 0 ? (
        <View style={styles.membersList}>
          {householdMembers.map((member) => {
            const config = STATUS_CONFIG[member.status] || STATUS_CONFIG.pending;
            return (
              <View key={member.id} style={styles.memberRow}>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {member.display_name ?? member.invited_email}
                  </Text>
                  {member.display_name && (
                    <Text style={styles.memberEmail} numberOfLines={1}>
                      {member.invited_email}
                    </Text>
                  )}
                </View>

                <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                  <Ionicons name={config.icon} size={12} color={config.text} />
                  <Text style={[styles.statusText, { color: config.text }]}>
                    {config.label}
                  </Text>
                </View>

                <PressableScale
                  style={styles.removeButton}
                  onPress={() => handleRemove(member.id)}
                  disabled={removingId === member.id}
                >
                  {removingId === member.id ? (
                    <ActivityIndicator color={colors.stone[400]} size="small" />
                  ) : (
                    <Ionicons name="close" size={16} color={colors.stone[400]} />
                  )}
                </PressableScale>
              </View>
            );
          })}
        </View>
      ) : (
        !showForm && (
          <Text style={styles.emptyText}>No partners invited yet.</Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.stone[500],
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  inviteButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.brand[500],
  },
  formCard: {
    backgroundColor: colors.stone[50],
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.stone[200],
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  optional: {
    fontFamily: fonts.sans,
    color: colors.stone[400],
  },
  input: {
    borderWidth: 1,
    borderColor: colors.stone[200],
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: fonts.sans,
    color: colors.foreground,
    backgroundColor: colors.white,
  },
  error: {
    fontFamily: fonts.sansMedium,
    color: colors.error,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  success: {
    fontFamily: fonts.sansMedium,
    color: colors.brand[600],
    fontSize: 13,
    marginBottom: spacing.md,
  },
  formActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.brand[500],
    borderRadius: radii.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
  },
  sendButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.white,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.stone[500],
  },

  // ── Members ─────────────────────────────────
  membersList: {
    gap: spacing.sm,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.stone[50],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.stone[200],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.foreground,
  },
  memberEmail: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.stone[400],
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radii.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
  },
  removeButton: {
    padding: 6,
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.stone[400],
    textAlign: "center",
    paddingVertical: spacing.lg,
  },

  // ── Partner view ────────────────────────────
  partnerCard: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  partnerTitle: {
    ...typography.headingSmall,
    color: colors.foreground,
  },
  partnerDesc: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.stone[500],
    textAlign: "center",
    lineHeight: 20,
  },
});
