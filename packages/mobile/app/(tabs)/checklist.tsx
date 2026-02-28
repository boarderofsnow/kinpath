import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  SectionList,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";
import { ChecklistItem, Child } from "@kinpath/shared";
import {
  colors,
  fonts,
  typography,
  spacing,
  radii,
  shadows,
  cardBase,
} from "../../lib/theme";
import { FadeInUp, PressableScale } from "../../components/motion";
import { SimpleMarkdown } from "../../components/SimpleMarkdown";
import { DatePickerInput } from "../../components/settings/DatePickerInput";

// ── Types ──────────────────────────────────────────────────

interface ChecklistSection {
  title: string;
  key: string;
  data: ChecklistItem[];
}

// ════════════════════════════════════════════════════════════
// CHECKLIST SCREEN
// ════════════════════════════════════════════════════════════

export default function ChecklistScreen() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemChildId, setNewItemChildId] = useState<string | null>(null);

  // Completed section collapsed by default
  const [completedCollapsed, setCompletedCollapsed] = useState(true);

  // Item detail modal
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState<Date | null>(null);
  const [detailSaving, setDetailSaving] = useState(false);

  // ── Data Fetching ──────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    fetchChildren();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchChecklist();
  }, [user, selectedChildId]);

  const fetchChildren = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error("Error fetching children:", error);
    }
  };

  const fetchChecklist = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from("checklist_items")
        .select("*")
        .eq("user_id", user.id);

      if (selectedChildId && selectedChildId !== "all") {
        query = query.eq("child_id", selectedChildId);
      }

      const { data, error } = await query.order("sort_order", {
        ascending: true,
      });

      if (error) throw error;
      setChecklist(data || []);
    } catch (error) {
      console.error("Error fetching checklist:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChecklist();
    setRefreshing(false);
  }, [user, selectedChildId]);

  // ── Add Item ───────────────────────────────────────────

  const handleAddItem = async () => {
    if (!user || !newItemTitle.trim()) return;

    try {
      const { error } = await supabase.from("checklist_items").insert({
        user_id: user.id,
        child_id: newItemChildId || null,
        title: newItemTitle.trim(),
        description: null,
        item_type: "custom",
        is_completed: false,
        sort_order: 0,
      });

      if (error) throw error;

      setNewItemTitle("");
      setNewItemChildId(null);
      setShowAddForm(false);
      await fetchChecklist();
    } catch (error) {
      console.error("Error adding item:", error);
      Alert.alert("Error", "Failed to add item");
    }
  };

  // ── Toggle Completion ──────────────────────────────────

  const toggleCompletion = async (item: ChecklistItem) => {
    if (!user) return;

    const newState = !item.is_completed;
    const completedAt = newState ? new Date().toISOString() : null;

    // Optimistic update
    setChecklist((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, is_completed: newState, completed_at: completedAt }
          : i
      )
    );

    try {
      const { error } = await supabase
        .from("checklist_items")
        .update({ is_completed: newState, completed_at: completedAt })
        .eq("id", item.id);

      if (error) throw error;
    } catch {
      await fetchChecklist();
    }
  };

  // ── Delete Item ────────────────────────────────────────

  const handleDeleteItem = (item: ChecklistItem) => {
    Alert.alert("Delete Item", `Are you sure you want to delete "${item.title}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("checklist_items")
              .delete()
              .eq("id", item.id);

            if (error) throw error;
            // Close modal if this item was open
            if (selectedItem?.id === item.id) setSelectedItem(null);
            await fetchChecklist();
          } catch {
            Alert.alert("Error", "Failed to delete item");
          }
        },
      },
    ]);
  };

  // ── Item Detail Modal ──────────────────────────────────

  const openItemDetail = (item: ChecklistItem) => {
    setSelectedItem(item);
    setEditTitle(item.title);
    setEditDueDate(item.due_date ? new Date(item.due_date + "T00:00:00") : null);
  };

  const handleSaveDetail = async () => {
    if (!selectedItem || !editTitle.trim()) return;
    setDetailSaving(true);

    try {
      const updates: Record<string, unknown> = {
        title: editTitle.trim(),
        due_date: editDueDate
          ? editDueDate.toISOString().split("T")[0]
          : null,
      };

      const { error } = await supabase
        .from("checklist_items")
        .update(updates)
        .eq("id", selectedItem.id);

      if (error) throw error;

      setSelectedItem(null);
      await fetchChecklist();
    } catch {
      Alert.alert("Error", "Failed to save changes");
    } finally {
      setDetailSaving(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getChildName = (childId: string | null) => {
    if (!childId) return null;
    return children.find((c) => c.id === childId)?.name || null;
  };

  // ── Section Data ───────────────────────────────────────

  const activeItems = checklist.filter((i) => !i.is_completed);
  const completedItems = checklist.filter((i) => i.is_completed);

  const sections: ChecklistSection[] = [
    { title: "Active Items", key: "active", data: activeItems },
    ...(completedItems.length > 0
      ? [
          {
            title: "Completed",
            key: "completed",
            data: completedCollapsed ? [] : completedItems,
          },
        ]
      : []),
  ];

  // ── Render: Checklist Item ─────────────────────────────

  const renderChecklistItem = ({ item }: { item: ChecklistItem }) => {
    const childName = getChildName(item.child_id);
    const dueDate = formatDueDate(item.due_date);
    const done = item.is_completed;

    return (
      <PressableScale
        onPress={() => openItemDetail(item)}
        style={[styles.itemCard, done && styles.itemCardCompleted]}
      >
        {/* Checkbox */}
        <PressableScale
          style={styles.checkboxArea}
          onPress={() => toggleCompletion(item)}
          scaleTo={0.9}
        >
          <View style={[styles.checkbox, done && styles.checkboxChecked]}>
            {done && <Ionicons name="checkmark" size={14} color={colors.white} />}
          </View>
        </PressableScale>

        {/* Content */}
        <View style={styles.itemContent}>
          <Text
            style={[styles.itemTitle, done && styles.itemTitleDone]}
            numberOfLines={2}
          >
            {item.title.replace(/^#+\s*/, "")}
          </Text>

          <View style={styles.itemMeta}>
            {childName && (
              <View style={styles.childBadge}>
                <Text style={styles.childBadgeText}>{childName}</Text>
              </View>
            )}
            {item.description && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>has details</Text>
              </View>
            )}
            {dueDate && (
              <Text style={[styles.dueText, done && styles.dueTextDone]}>
                {dueDate}
              </Text>
            )}
          </View>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={16} color={colors.stone[300]} />
      </PressableScale>
    );
  };

  // ── Render: Section Header ─────────────────────────────

  const renderSectionHeader = ({ section }: { section: ChecklistSection }) => {
    const count =
      section.key === "completed" ? completedItems.length : section.data.length;
    if (count === 0 && section.key === "active") return null;

    const isCompleted = section.key === "completed";

    return (
      <PressableScale
        style={styles.sectionHeader}
        onPress={
          isCompleted
            ? () => setCompletedCollapsed((v) => !v)
            : undefined
        }
        disabled={!isCompleted}
      >
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.sectionCountBadge}>
          <Text style={styles.sectionCount}>{count}</Text>
        </View>
        {isCompleted && (
          <Ionicons
            name={completedCollapsed ? "chevron-down" : "chevron-up"}
            size={18}
            color={colors.stone[400]}
            style={{ marginLeft: "auto" }}
          />
        )}
      </PressableScale>
    );
  };

  // ── Render: Empty State ────────────────────────────────

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="checkmark-circle-outline" size={40} color={colors.brand[500]} />
        </View>
        <Text style={styles.emptyHeading}>No items yet</Text>
        <Text style={styles.emptyText}>
          Your checklist is empty. Add items from chat or use the + button.
        </Text>
      </View>
    );
  };

  // ── Main Render ────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Checklist</Text>
      </View>

      {/* Child Pills */}
      {children.length > 0 && (
        <View style={styles.childPills}>
          <PressableScale
            style={[styles.pill, selectedChildId === null && styles.pillActive]}
            onPress={() => setSelectedChildId(null)}
            scaleTo={0.95}
          >
            <Text
              style={[
                styles.pillText,
                selectedChildId === null && styles.pillTextActive,
              ]}
            >
              All
            </Text>
          </PressableScale>

          {children.map((child) => (
            <PressableScale
              key={child.id}
              style={[
                styles.pill,
                selectedChildId === child.id && styles.pillActive,
              ]}
              onPress={() => setSelectedChildId(child.id)}
              scaleTo={0.95}
            >
              <Text
                style={[
                  styles.pillText,
                  selectedChildId === child.id && styles.pillTextActive,
                ]}
              >
                {child.name}
              </Text>
            </PressableScale>
          ))}
        </View>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <FadeInUp duration={300}>
          <View style={styles.addForm}>
            <TextInput
              style={styles.addInput}
              placeholder="What do you want to add?"
              placeholderTextColor={colors.stone[400]}
              value={newItemTitle}
              onChangeText={setNewItemTitle}
              returnKeyType="go"
              onSubmitEditing={handleAddItem}
            />

            {children.length > 0 && (
              <View style={styles.addChildRow}>
                <Text style={styles.addChildLabel}>For:</Text>
                <PressableScale
                  style={[
                    styles.addChildPill,
                    newItemChildId === null && styles.addChildPillActive,
                  ]}
                  onPress={() => setNewItemChildId(null)}
                  scaleTo={0.95}
                >
                  <Text
                    style={[
                      styles.addChildPillText,
                      newItemChildId === null && styles.addChildPillTextActive,
                    ]}
                  >
                    All
                  </Text>
                </PressableScale>
                {children.map((child) => (
                  <PressableScale
                    key={child.id}
                    style={[
                      styles.addChildPill,
                      newItemChildId === child.id && styles.addChildPillActive,
                    ]}
                    onPress={() => setNewItemChildId(child.id)}
                    scaleTo={0.95}
                  >
                    <Text
                      style={[
                        styles.addChildPillText,
                        newItemChildId === child.id &&
                          styles.addChildPillTextActive,
                      ]}
                    >
                      {child.name}
                    </Text>
                  </PressableScale>
                ))}
              </View>
            )}

            <View style={styles.addActions}>
              <PressableScale
                style={styles.addCancelBtn}
                onPress={() => {
                  setShowAddForm(false);
                  setNewItemTitle("");
                  setNewItemChildId(null);
                }}
                scaleTo={0.95}
              >
                <Text style={styles.addCancelText}>Cancel</Text>
              </PressableScale>

              <PressableScale
                style={[
                  styles.addSubmitBtn,
                  !newItemTitle.trim() && styles.addSubmitBtnDisabled,
                ]}
                onPress={handleAddItem}
                disabled={!newItemTitle.trim()}
                scaleTo={0.95}
              >
                <Text style={styles.addSubmitText}>Add</Text>
              </PressableScale>
            </View>
          </View>
        </FadeInUp>
      )}

      {/* Checklist */}
      {checklist.length === 0 ? (
        renderEmptyState()
      ) : (
        <SectionList
          sections={sections.filter(
            (s) => s.data.length > 0 || s.key === "completed"
          )}
          keyExtractor={(item) => item.id}
          renderItem={renderChecklistItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brand[500]}
            />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* FAB */}
      <PressableScale
        style={styles.fab}
        onPress={() => setShowAddForm(!showAddForm)}
        scaleTo={0.92}
      >
        <Ionicons
          name={showAddForm ? "close" : "add"}
          size={28}
          color={colors.white}
        />
      </PressableScale>

      {/* ── Item Detail Modal ───────────────────────── */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedItem(null)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <PressableScale onPress={() => setSelectedItem(null)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </PressableScale>
            <Text style={styles.modalHeaderTitle}>Item Details</Text>
            <PressableScale onPress={handleSaveDetail} disabled={detailSaving}>
              <Text
                style={[
                  styles.modalSaveText,
                  detailSaving && { opacity: 0.5 },
                ]}
              >
                {detailSaving ? "Saving..." : "Save"}
              </Text>
            </PressableScale>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              keyboardShouldPersistTaps="handled"
            >
              {selectedItem && (
                <>
                  {/* Title (editable) */}
                  <Text style={styles.modalLabel}>Title</Text>
                  <TextInput
                    style={styles.modalTitleInput}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    multiline
                    autoCapitalize="sentences"
                    placeholder="Item title"
                    placeholderTextColor={colors.stone[400]}
                  />

                  {/* Description (markdown rendered, read-only) */}
                  {selectedItem.description && (
                    <>
                      <Text style={styles.modalLabel}>Details</Text>
                      <View style={styles.modalDescriptionBox}>
                        <SimpleMarkdown content={selectedItem.description} />
                      </View>
                    </>
                  )}

                  {/* Due Date */}
                  <DatePickerInput
                    label="Due Date"
                    value={editDueDate}
                    onChange={setEditDueDate}
                  />

                  {/* Clear due date */}
                  {editDueDate && (
                    <PressableScale
                      style={styles.clearDateBtn}
                      onPress={() => setEditDueDate(null)}
                    >
                      <Ionicons
                        name="close-circle"
                        size={16}
                        color={colors.stone[400]}
                      />
                      <Text style={styles.clearDateText}>Clear due date</Text>
                    </PressableScale>
                  )}

                  {/* Child Badge */}
                  {selectedItem.child_id && (
                    <View style={styles.modalMeta}>
                      <Text style={styles.modalMetaLabel}>For:</Text>
                      <View style={styles.childBadge}>
                        <Text style={styles.childBadgeText}>
                          {getChildName(selectedItem.child_id)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Delete */}
                  <PressableScale
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteItem(selectedItem)}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={18}
                      color={colors.error}
                    />
                    <Text style={styles.deleteBtnText}>Delete item</Text>
                  </PressableScale>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.displayMedium,
    color: colors.foreground,
  },
  childPills: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.stone[200],
  },
  pillActive: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  pillText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.stone[700],
  },
  pillTextActive: {
    color: colors.white,
  },

  // ── Add Form ──────────────────────────────────
  addForm: {
    ...cardBase,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
  },
  addInput: {
    borderWidth: 1,
    borderColor: colors.stone[200],
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.foreground,
    marginBottom: spacing.md,
    backgroundColor: colors.stone[50],
  },
  addChildRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  addChildLabel: {
    ...typography.labelSmall,
    fontFamily: fonts.sansSemiBold,
    color: colors.stone[600],
    marginRight: spacing.sm,
  },
  addChildPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: colors.stone[50],
    borderWidth: 1,
    borderColor: colors.stone[200],
  },
  addChildPillActive: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  addChildPillText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.stone[700],
  },
  addChildPillTextActive: {
    color: colors.white,
  },
  addActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  addCancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.stone[100],
  },
  addCancelText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.stone[700],
  },
  addSubmitBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.brand[500],
  },
  addSubmitBtnDisabled: {
    backgroundColor: colors.stone[200],
  },
  addSubmitText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.white,
  },

  // ── Section List ──────────────────────────────
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.foreground,
  },
  sectionCountBadge: {
    backgroundColor: colors.brand[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  sectionCount: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.brand[600],
  },

  // ── Checklist Item Card ───────────────────────
  itemCard: {
    ...cardBase,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
  },
  itemCardCompleted: {
    backgroundColor: colors.stone[50],
    borderColor: colors.stone[200],
    ...shadows.soft,
  },
  checkboxArea: {
    marginRight: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.brand[400],
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  itemTitleDone: {
    textDecorationLine: "line-through",
    color: colors.stone[400],
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  childBadge: {
    backgroundColor: colors.brand[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  childBadgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.brand[600],
  },
  chatBadge: {
    backgroundColor: colors.accent[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  chatBadgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.accent[700],
  },
  dueText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.stone[500],
  },
  dueTextDone: {
    color: colors.stone[300],
  },

  // ── Empty State ───────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing["3xl"],
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyHeading: {
    ...typography.displaySmall,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodyMedium,
    color: colors.stone[500],
    textAlign: "center",
  },
  loadingText: {
    ...typography.bodyLarge,
    color: colors.stone[500],
  },

  // ── FAB ───────────────────────────────────────
  fab: {
    position: "absolute",
    bottom: 100,
    right: spacing["2xl"],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand[500],
    justifyContent: "center",
    alignItems: "center",
    ...shadows.glow,
  },

  // ── Item Detail Modal ─────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.stone[200]}80`,
    backgroundColor: colors.white,
  },
  modalHeaderTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.foreground,
  },
  modalCancelText: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.stone[500],
  },
  modalSaveText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.brand[600],
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  modalLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  modalTitleInput: {
    borderWidth: 1,
    borderColor: colors.stone[200],
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.foreground,
    backgroundColor: colors.white,
    minHeight: 48,
  },
  modalDescriptionBox: {
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.stone[200],
    padding: spacing.lg,
  },
  clearDateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: -spacing.sm,
  },
  clearDateText: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.stone[400],
  },
  modalMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  modalMetaLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.stone[500],
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: `${colors.stone[200]}66`,
  },
  deleteBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.error,
  },
});
