import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";
import { calculateAgeInWeeks, formatAgeLabel } from "@kinpath/shared";
import type { Child } from "@kinpath/shared";
import { colors, fonts, typography, spacing, radii } from "../../lib/theme";
import { PressableScale } from "../motion";
import { DatePickerInput } from "./DatePickerInput";

interface ChildrenSectionProps {
  children: Child[];
  userId: string;
  onChildrenChange: (children: Child[]) => void;
}

export function ChildrenSection({
  children: childList,
  userId,
  onChildrenChange,
}: ChildrenSectionProps) {
  // ── Add form state ─────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIsBorn, setNewIsBorn] = useState<boolean | null>(null);
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // ── Edit state ─────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // ── Delete state ───────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Helpers ────────────────────────────────────
  const resetAddForm = () => {
    setShowAddForm(false);
    setNewName("");
    setNewIsBorn(null);
    setNewDate(null);
    setAddError("");
  };

  const toISODate = (d: Date): string => d.toISOString().split("T")[0];

  // ── Add child ──────────────────────────────────
  const handleAddChild = async () => {
    if (!newName.trim()) {
      setAddError("Name is required");
      return;
    }
    if (newIsBorn === null) {
      setAddError("Please select if your child has been born");
      return;
    }
    if (!newDate) {
      setAddError(newIsBorn ? "Date of birth is required" : "Due date is required");
      return;
    }

    setAddLoading(true);
    setAddError("");

    try {
      const { data, error } = await supabase
        .from("children")
        .insert({
          user_id: userId,
          name: newName.trim(),
          is_born: newIsBorn,
          dob: newIsBorn ? toISODate(newDate) : null,
          due_date: !newIsBorn ? toISODate(newDate) : null,
        })
        .select()
        .single();

      if (error) {
        setAddError(error.message);
      } else if (data) {
        onChildrenChange([...childList, data]);
        resetAddForm();
      }
    } catch {
      setAddError("Failed to add child");
    } finally {
      setAddLoading(false);
    }
  };

  // ── Edit child ─────────────────────────────────
  const startEdit = (child: Child) => {
    setEditingId(child.id);
    setEditName(child.name);
    const dateStr = child.is_born ? child.dob : child.due_date;
    setEditDate(dateStr ? new Date(dateStr) : null);
    // Close any delete confirmation
    setDeletingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDate(null);
  };

  const handleSaveEdit = async (child: Child) => {
    if (!editName.trim()) return;

    setEditLoading(true);
    try {
      const updateData: Record<string, any> = {
        name: editName.trim(),
      };
      if (editDate) {
        if (child.is_born) {
          updateData.dob = toISODate(editDate);
        } else {
          updateData.due_date = toISODate(editDate);
        }
      }

      const { error } = await supabase
        .from("children")
        .update(updateData)
        .eq("id", child.id);

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        const updated = childList.map((c) =>
          c.id === child.id ? { ...c, ...updateData } : c
        );
        onChildrenChange(updated);
        cancelEdit();
      }
    } catch {
      Alert.alert("Error", "Failed to save changes");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete child ───────────────────────────────
  const handleDelete = async (childId: string) => {
    if (deletingId !== childId) {
      setDeletingId(childId);
      return;
    }

    setDeleteLoading(true);
    try {
      const { error } = await supabase.from("children").delete().eq("id", childId);

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        onChildrenChange(childList.filter((c) => c.id !== childId));
        setDeletingId(null);
      }
    } catch {
      Alert.alert("Error", "Failed to delete child");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <View>
      {/* Add Child Button */}
      {!showAddForm && (
        <PressableScale
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.brand[500]} />
          <Text style={styles.addButtonText}>Add Child</Text>
        </PressableScale>
      )}

      {/* Add Child Form */}
      {showAddForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add a child</Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Name or nickname</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Olivia"
              placeholderTextColor={colors.stone[400]}
              value={newName}
              onChangeText={setNewName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Has this child been born?</Text>
            <View style={styles.toggleRow}>
              <PressableScale
                style={[
                  styles.toggleOption,
                  newIsBorn === true && styles.toggleOptionSelected,
                ]}
                onPress={() => setNewIsBorn(true)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    newIsBorn === true && styles.toggleTextSelected,
                  ]}
                >
                  Yes
                </Text>
              </PressableScale>
              <PressableScale
                style={[
                  styles.toggleOption,
                  newIsBorn === false && styles.toggleOptionSelected,
                ]}
                onPress={() => setNewIsBorn(false)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    newIsBorn === false && styles.toggleTextSelected,
                  ]}
                >
                  Not yet
                </Text>
              </PressableScale>
            </View>
          </View>

          {newIsBorn !== null && (
            <DatePickerInput
              label={newIsBorn ? "Date of birth" : "Due date"}
              value={newDate}
              onChange={setNewDate}
              maximumDate={newIsBorn ? new Date() : undefined}
              minimumDate={!newIsBorn ? new Date() : undefined}
            />
          )}

          {addError ? <Text style={styles.error}>{addError}</Text> : null}

          <View style={styles.formActions}>
            <PressableScale
              style={styles.primaryButton}
              onPress={handleAddChild}
              disabled={addLoading}
            >
              {addLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Add Child</Text>
              )}
            </PressableScale>
            <PressableScale style={styles.textButton} onPress={resetAddForm}>
              <Text style={styles.textButtonText}>Cancel</Text>
            </PressableScale>
          </View>
        </View>
      )}

      {/* Children List */}
      {childList.length === 0 && !showAddForm ? (
        <Text style={styles.emptyText}>
          No children added yet. Tap "Add Child" above to get started.
        </Text>
      ) : (
        childList.map((child) => {
          const isEditing = editingId === child.id;
          const isDeleting = deletingId === child.id;
          const ageInWeeks = calculateAgeInWeeks(child);
          const ageLabel = formatAgeLabel(ageInWeeks);
          const initial = child.name.charAt(0).toUpperCase();

          return (
            <View key={child.id} style={styles.childRow}>
              {isEditing ? (
                /* ── Edit mode ──────────────────── */
                <View style={styles.editForm}>
                  <TextInput
                    style={styles.input}
                    value={editName}
                    onChangeText={setEditName}
                    autoCapitalize="words"
                  />
                  <DatePickerInput
                    label={child.is_born ? "Date of birth" : "Due date"}
                    value={editDate}
                    onChange={setEditDate}
                    maximumDate={child.is_born ? new Date() : undefined}
                    minimumDate={!child.is_born ? new Date() : undefined}
                  />
                  <View style={styles.editActions}>
                    <PressableScale
                      style={styles.smallPrimaryButton}
                      onPress={() => handleSaveEdit(child)}
                      disabled={editLoading}
                    >
                      {editLoading ? (
                        <ActivityIndicator color={colors.white} size="small" />
                      ) : (
                        <Text style={styles.smallPrimaryButtonText}>Save</Text>
                      )}
                    </PressableScale>
                    <PressableScale style={styles.textButton} onPress={cancelEdit}>
                      <Text style={styles.textButtonText}>Cancel</Text>
                    </PressableScale>
                  </View>
                </View>
              ) : (
                /* ── Display mode ───────────────── */
                <>
                  <View style={styles.childInfo}>
                    <LinearGradient
                      colors={
                        child.is_born
                          ? [colors.brand[400], colors.brand[500]]
                          : [colors.accent[400], colors.accent[500]]
                      }
                      style={styles.childAvatar}
                    >
                      <Text style={styles.childAvatarText}>{initial}</Text>
                    </LinearGradient>
                    <View style={styles.childDetails}>
                      <Text style={styles.childName}>{child.name}</Text>
                      <Text style={styles.childAge}>
                        {ageLabel}
                        {!child.is_born && "  ·  Expecting"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.childActions}>
                    <PressableScale
                      style={styles.iconButton}
                      onPress={() => startEdit(child)}
                    >
                      <Ionicons name="pencil-outline" size={18} color={colors.stone[500]} />
                    </PressableScale>

                    {isDeleting ? (
                      <View style={styles.deleteConfirmRow}>
                        <PressableScale
                          style={styles.deleteConfirmButton}
                          onPress={() => handleDelete(child.id)}
                          disabled={deleteLoading}
                        >
                          {deleteLoading ? (
                            <ActivityIndicator color={colors.white} size="small" />
                          ) : (
                            <Text style={styles.deleteConfirmText}>Confirm</Text>
                          )}
                        </PressableScale>
                        <PressableScale
                          style={styles.iconButton}
                          onPress={() => setDeletingId(null)}
                        >
                          <Ionicons name="close" size={18} color={colors.stone[500]} />
                        </PressableScale>
                      </View>
                    ) : (
                      <PressableScale
                        style={styles.iconButton}
                        onPress={() => handleDelete(child.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.error} />
                      </PressableScale>
                    )}
                  </View>
                </>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  addButtonText: {
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
  formTitle: {
    ...typography.headingSmall,
    color: colors.foreground,
    marginBottom: spacing.lg,
  },
  fieldContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: spacing.sm,
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
  toggleRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  toggleOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.stone[200],
    backgroundColor: colors.white,
  },
  toggleOptionSelected: {
    borderColor: colors.brand[500],
    backgroundColor: colors.brand[50],
  },
  toggleText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.stone[500],
  },
  toggleTextSelected: {
    fontFamily: fonts.sansSemiBold,
    color: colors.brand[600],
  },
  error: {
    fontFamily: fonts.sansMedium,
    color: colors.error,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  formActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.brand[500],
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: spacing["2xl"],
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.white,
  },
  textButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  textButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.stone[500],
  },
  emptyText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.stone[400],
    textAlign: "center",
    paddingVertical: spacing.lg,
  },

  // ── Child row ───────────────────────────────
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.stone[200]}66`,
  },
  childInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  childAvatarText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    color: colors.white,
  },
  childDetails: {
    flex: 1,
  },
  childName: {
    ...typography.headingSmall,
    color: colors.foreground,
  },
  childAge: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.stone[500],
    marginTop: 2,
  },
  childActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  iconButton: {
    padding: spacing.sm,
  },
  deleteConfirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  deleteConfirmButton: {
    backgroundColor: colors.error,
    borderRadius: radii.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  deleteConfirmText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.white,
  },

  // ── Edit form ───────────────────────────────
  editForm: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  editActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  smallPrimaryButton: {
    backgroundColor: colors.brand[500],
    borderRadius: radii.sm,
    paddingVertical: 8,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  smallPrimaryButtonText: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.white,
  },
});
