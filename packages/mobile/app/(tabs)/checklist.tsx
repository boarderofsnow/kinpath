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
import { ChecklistItem, DoctorDiscussionItem, Child } from "@kinpath/shared";
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

type AddCategory = "general" | "provider";

/** Unified item that can be rendered in the SectionList */
type UnifiedItem =
  | (ChecklistItem & { _source: "checklist" })
  | (DoctorDiscussionItem & { _source: "doctor" });

interface ChecklistSection {
  title: string;
  key: string;
  data: UnifiedItem[];
}

// ════════════════════════════════════════════════════════════
// CHECKLIST SCREEN
// ════════════════════════════════════════════════════════════

export default function ChecklistScreen() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [doctorItems, setDoctorItems] = useState<DoctorDiscussionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemDueDate, setNewItemDueDate] = useState<Date | null>(null);
  const [newItemCategory, setNewItemCategory] = useState<AddCategory>("general");
  const [newItemChildId, setNewItemChildId] = useState<string | null>(null);

  // Section collapse state
  const [generalCollapsed, setGeneralCollapsed] = useState(false);
  const [providerCollapsed, setProviderCollapsed] = useState(false);
  const [completedCollapsed, setCompletedCollapsed] = useState(true);

  // Item detail modal (works for both checklist and doctor items)
  const [selectedItem, setSelectedItem] = useState<UnifiedItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState<Date | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [detailSaving, setDetailSaving] = useState(false);

  // ── Data Fetching ──────────────────────────────────────

  useEffect(() => {
    if (!user) return;
    fetchChildren();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchAllData();
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

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch checklist items
      let checklistQuery = supabase
        .from("checklist_items")
        .select("*")
        .eq("user_id", user.id);

      if (selectedChildId && selectedChildId !== "all") {
        checklistQuery = checklistQuery.eq("child_id", selectedChildId);
      }

      // Fetch doctor discussion items
      let doctorQuery = supabase
        .from("doctor_discussion_items")
        .select("*, doctor_item_children(child_id)")
        .eq("user_id", user.id);

      const [checklistResult, doctorResult] = await Promise.all([
        checklistQuery.order("sort_order", { ascending: true }),
        doctorQuery.order("sort_order", { ascending: true }),
      ]);

      if (checklistResult.error) throw checklistResult.error;
      if (doctorResult.error) throw doctorResult.error;

      setChecklist(checklistResult.data || []);

      // Normalize doctor items with child_ids
      const normalizedDoctorItems: DoctorDiscussionItem[] = (
        doctorResult.data || []
      ).map((row: any) => {
        const junctionRows = row.doctor_item_children ?? [];
        const childIds = junctionRows.map(
          (j: { child_id: string }) => j.child_id
        );
        const { doctor_item_children: _, ...item } = row;
        return { ...item, child_ids: childIds } as DoctorDiscussionItem;
      });

      // Filter doctor items by selected child (they use a junction table)
      if (selectedChildId && selectedChildId !== "all") {
        setDoctorItems(
          normalizedDoctorItems.filter(
            (item) =>
              !item.child_ids ||
              item.child_ids.length === 0 ||
              item.child_ids.includes(selectedChildId)
          )
        );
      } else {
        setDoctorItems(normalizedDoctorItems);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  }, [user, selectedChildId]);

  // ── Add Item ───────────────────────────────────────────

  const handleAddItem = async () => {
    if (!user || !newItemTitle.trim()) return;

    try {
      if (newItemCategory === "provider") {
        // Insert into doctor_discussion_items
        const { data, error } = await supabase
          .from("doctor_discussion_items")
          .insert({
            user_id: user.id,
            title: newItemTitle.trim(),
            notes: newItemDescription.trim() || null,
            priority: "normal",
            is_discussed: false,
            sort_order: doctorItems.length,
          })
          .select()
          .single();

        if (error) throw error;

        // Add child association via junction table
        if (data && newItemChildId) {
          await supabase.from("doctor_item_children").insert({
            doctor_item_id: data.id,
            child_id: newItemChildId,
          });
        }
      } else {
        // Insert into checklist_items
        const { error } = await supabase.from("checklist_items").insert({
          user_id: user.id,
          child_id: newItemChildId || null,
          title: newItemTitle.trim(),
          description: newItemDescription.trim() || null,
          item_type: "custom",
          due_date: newItemDueDate
            ? newItemDueDate.toISOString().split("T")[0]
            : null,
          is_completed: false,
          sort_order: 0,
        });

        if (error) throw error;
      }

      setNewItemTitle("");
      setNewItemDescription("");
      setNewItemDueDate(null);
      setNewItemCategory("general");
      setNewItemChildId(null);
      setShowAddForm(false);
      await fetchAllData();
    } catch (error) {
      console.error("Error adding item:", error);
      Alert.alert("Error", "Failed to add item");
    }
  };

  // ── Toggle Completion (checklist items) ────────────────

  const toggleChecklistCompletion = async (item: ChecklistItem) => {
    if (!user) return;

    const newState = !item.is_completed;
    const completedAt = newState ? new Date().toISOString() : null;

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
      await fetchAllData();
    }
  };

  // ── Toggle Discussed (doctor items) ────────────────────

  const toggleDoctorDiscussed = async (item: DoctorDiscussionItem) => {
    if (!user) return;

    const newState = !item.is_discussed;
    const now = new Date().toISOString();

    setDoctorItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, is_discussed: newState, discussed_at: newState ? now : null }
          : i
      )
    );

    try {
      const { error } = await supabase
        .from("doctor_discussion_items")
        .update({
          is_discussed: newState,
          discussed_at: newState ? now : null,
          updated_at: now,
        })
        .eq("id", item.id);

      if (error) throw error;
    } catch {
      await fetchAllData();
    }
  };

  // ── Delete Item ────────────────────────────────────────

  const handleDeleteUnified = (unified: UnifiedItem) => {
    const table =
      unified._source === "doctor"
        ? "doctor_discussion_items"
        : "checklist_items";

    Alert.alert(
      "Delete Item",
      `Are you sure you want to delete "${unified.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from(table)
                .delete()
                .eq("id", unified.id);

              if (error) throw error;
              if (selectedItem?.id === unified.id) setSelectedItem(null);
              await fetchAllData();
            } catch {
              Alert.alert("Error", "Failed to delete item");
            }
          },
        },
      ]
    );
  };

  // ── Item Detail Modal ─────────────────────────────────

  const openItemDetail = (item: UnifiedItem) => {
    setSelectedItem(item);
    setEditTitle(item.title);
    if (item._source === "checklist") {
      setEditDueDate(item.due_date ? new Date(item.due_date + "T00:00:00") : null);
      setEditNotes("");
    } else {
      setEditDueDate(null);
      setEditNotes(item.notes ?? "");
    }
  };

  const handleSaveDetail = async () => {
    if (!selectedItem || !editTitle.trim()) return;
    setDetailSaving(true);

    try {
      if (selectedItem._source === "checklist") {
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
      } else {
        const updates: Record<string, unknown> = {
          title: editTitle.trim(),
          notes: editNotes.trim() || null,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("doctor_discussion_items")
          .update(updates)
          .eq("id", selectedItem.id);

        if (error) throw error;
      }

      setSelectedItem(null);
      await fetchAllData();
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

  const activeChecklistItems = checklist.filter((i) => !i.is_completed);
  const completedChecklistItems = checklist.filter((i) => i.is_completed);

  const toDiscussDoctorItems = doctorItems.filter((i) => !i.is_discussed);
  const discussedDoctorItems = doctorItems.filter((i) => i.is_discussed);

  // Tag items with their source for unified rendering
  const generalData: UnifiedItem[] = activeChecklistItems.map((i) => ({
    ...i,
    _source: "checklist" as const,
  }));
  const providerData: UnifiedItem[] = toDiscussDoctorItems.map((i) => ({
    ...i,
    _source: "doctor" as const,
  }));
  const completedData: UnifiedItem[] = [
    ...completedChecklistItems.map((i) => ({
      ...i,
      _source: "checklist" as const,
    })),
    ...discussedDoctorItems.map((i) => ({
      ...i,
      _source: "doctor" as const,
    })),
  ];

  const sections: ChecklistSection[] = [
    ...(generalData.length > 0
      ? [{ title: "General Checklist", key: "general", data: generalCollapsed ? [] : generalData }]
      : []),
    ...(providerData.length > 0
      ? [
          {
            title: "Discuss with Provider",
            key: "provider",
            data: providerCollapsed ? [] : providerData,
          },
        ]
      : []),
    ...(completedData.length > 0
      ? [
          {
            title: "Completed",
            key: "completed",
            data: completedCollapsed ? [] : completedData,
          },
        ]
      : []),
  ];

  const totalItems = checklist.length + doctorItems.length;

  // ── Render: Unified Item ─────────────────────────────

  const renderUnifiedItem = ({ item }: { item: UnifiedItem }) => {
    if (item._source === "doctor") {
      return renderDoctorItem(item as DoctorDiscussionItem & { _source: "doctor" });
    }
    return renderChecklistItem(item as ChecklistItem & { _source: "checklist" });
  };

  const renderChecklistItem = (item: ChecklistItem & { _source: "checklist" }) => {
    const childName = getChildName(item.child_id);
    const dueDate = formatDueDate(item.due_date);
    const done = item.is_completed;

    return (
      <PressableScale
        onPress={() => openItemDetail(item)}
        style={[styles.itemCard, done && styles.itemCardCompleted]}
      >
        <PressableScale
          style={styles.checkboxArea}
          onPress={() => toggleChecklistCompletion(item)}
          scaleTo={0.9}
        >
          <View style={[styles.checkbox, done && styles.checkboxChecked]}>
            {done && <Ionicons name="checkmark" size={14} color={colors.white} />}
          </View>
        </PressableScale>

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

        <Ionicons name="chevron-forward" size={16} color={colors.stone[300]} />
      </PressableScale>
    );
  };

  const renderDoctorItem = (item: DoctorDiscussionItem & { _source: "doctor" }) => {
    const done = item.is_discussed;

    // Get child names from child_ids (junction table)
    const childNames = (item.child_ids ?? [])
      .map((cid) => getChildName(cid))
      .filter(Boolean);

    return (
      <PressableScale
        onPress={() => openItemDetail(item)}
        style={[styles.itemCard, done && styles.itemCardCompleted]}
      >
        <PressableScale
          style={styles.checkboxArea}
          onPress={() => toggleDoctorDiscussed(item)}
          scaleTo={0.9}
        >
          <View style={[styles.checkbox, done && styles.checkboxChecked]}>
            {done && <Ionicons name="checkmark" size={14} color={colors.white} />}
          </View>
        </PressableScale>

        <View style={styles.itemContent}>
          <Text
            style={[styles.itemTitle, done && styles.itemTitleDone]}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <View style={styles.itemMeta}>
            {childNames.length > 0 &&
              childNames.map((name, idx) => (
                <View key={idx} style={styles.childBadge}>
                  <Text style={styles.childBadgeText}>{name}</Text>
                </View>
              ))}
            <View style={styles.providerBadge}>
              <Ionicons name="medkit-outline" size={10} color={colors.accent[700]} />
              <Text style={styles.providerBadgeText}>Provider</Text>
            </View>
            {item.notes && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>has notes</Text>
              </View>
            )}
            {item.priority === "high" && (
              <View style={styles.priorityHighBadge}>
                <Text style={styles.priorityHighText}>High</Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={colors.stone[300]} />
      </PressableScale>
    );
  };

  // ── Render: Section Header ─────────────────────────────

  const renderSectionHeader = ({ section }: { section: ChecklistSection }) => {
    // Get true count (not the collapsed data length)
    const count =
      section.key === "general"
        ? generalData.length
        : section.key === "provider"
          ? providerData.length
          : completedData.length;

    const isCompleted = section.key === "completed";
    const isProvider = section.key === "provider";
    const isGeneral = section.key === "general";

    const isCollapsed =
      isGeneral ? generalCollapsed : isProvider ? providerCollapsed : completedCollapsed;

    const toggleCollapse = () => {
      if (isGeneral) setGeneralCollapsed((v) => !v);
      else if (isProvider) setProviderCollapsed((v) => !v);
      else setCompletedCollapsed((v) => !v);
    };

    return (
      <PressableScale
        style={styles.sectionHeader}
        onPress={toggleCollapse}
      >
        {isProvider && (
          <Ionicons
            name="medkit-outline"
            size={16}
            color={colors.accent[500]}
          />
        )}
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View
          style={[
            styles.sectionCountBadge,
            isProvider && styles.sectionCountBadgeProvider,
          ]}
        >
          <Text
            style={[
              styles.sectionCount,
              isProvider && styles.sectionCountProvider,
            ]}
          >
            {count}
          </Text>
        </View>
        <Ionicons
          name={isCollapsed ? "chevron-down" : "chevron-up"}
          size={18}
          color={colors.stone[400]}
          style={{ marginLeft: "auto" }}
        />
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
          <ScrollView
            style={styles.addFormScroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.addForm}>
              {/* Category */}
              <View style={styles.addChildRow}>
                <Text style={styles.addChildLabel}>Category:</Text>
                <PressableScale
                  style={[
                    styles.addChildPill,
                    newItemCategory === "general" && styles.addChildPillActive,
                  ]}
                  onPress={() => setNewItemCategory("general")}
                  scaleTo={0.95}
                >
                  <Text
                    style={[
                      styles.addChildPillText,
                      newItemCategory === "general" &&
                        styles.addChildPillTextActive,
                    ]}
                  >
                    General
                  </Text>
                </PressableScale>
                <PressableScale
                  style={[
                    styles.addChildPill,
                    styles.addCategoryProviderPillBase,
                    newItemCategory === "provider" &&
                      styles.addCategoryProviderPillActive,
                  ]}
                  onPress={() => setNewItemCategory("provider")}
                  scaleTo={0.95}
                >
                  <Ionicons
                    name="medkit-outline"
                    size={12}
                    color={
                      newItemCategory === "provider"
                        ? colors.white
                        : colors.stone[700]
                    }
                  />
                  <Text
                    style={[
                      styles.addChildPillText,
                      newItemCategory === "provider" &&
                        styles.addChildPillTextActive,
                    ]}
                  >
                    Discuss with Provider
                  </Text>
                </PressableScale>
              </View>

              {/* Title */}
              <TextInput
                style={styles.addInput}
                placeholder={
                  newItemCategory === "provider"
                    ? "What do you want to discuss?"
                    : "Title"
                }
                placeholderTextColor={colors.stone[400]}
                value={newItemTitle}
                onChangeText={setNewItemTitle}
                returnKeyType="next"
              />

              {/* Description / Notes */}
              <TextInput
                style={[styles.addInput, styles.addDescriptionInput]}
                placeholder={
                  newItemCategory === "provider"
                    ? "Notes or context (optional)"
                    : "Description (optional)"
                }
                placeholderTextColor={colors.stone[400]}
                value={newItemDescription}
                onChangeText={setNewItemDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {/* Due Date (checklist items only) */}
              {newItemCategory === "general" && (
                <>
                  <DatePickerInput
                    label="Due Date (optional)"
                    value={newItemDueDate}
                    onChange={setNewItemDueDate}
                  />
                  {newItemDueDate && (
                    <PressableScale
                      style={styles.clearDateBtnInline}
                      onPress={() => setNewItemDueDate(null)}
                    >
                      <Ionicons
                        name="close-circle"
                        size={14}
                        color={colors.stone[400]}
                      />
                      <Text style={styles.clearDateText}>Clear date</Text>
                    </PressableScale>
                  )}
                </>
              )}

              {/* Child selector */}
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
                    setNewItemDescription("");
                    setNewItemDueDate(null);
                    setNewItemCategory("general");
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
          </ScrollView>
        </FadeInUp>
      )}

      {/* Checklist */}
      {totalItems === 0 ? (
        renderEmptyState()
      ) : (
        <SectionList
          sections={sections.filter(
            (s) => s.data.length > 0 || s.key === "completed"
          )}
          keyExtractor={(item) => item.id}
          renderItem={renderUnifiedItem}
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

      {/* ── Item Detail Modal (checklist items only) ──── */}
      <Modal
        visible={!!selectedItem}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedItem(null)}
      >
        <SafeAreaView style={styles.modalContainer} edges={["top"]}>
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

                  {/* Checklist-specific fields */}
                  {selectedItem._source === "checklist" && (
                    <>
                      {(selectedItem as ChecklistItem).description && (
                        <>
                          <Text style={styles.modalLabel}>Details</Text>
                          <View style={styles.modalDescriptionBox}>
                            <SimpleMarkdown content={(selectedItem as ChecklistItem).description!} />
                          </View>
                        </>
                      )}

                      <DatePickerInput
                        label="Due Date"
                        value={editDueDate}
                        onChange={setEditDueDate}
                      />

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

                      {(selectedItem as ChecklistItem).child_id && (
                        <View style={styles.modalMeta}>
                          <Text style={styles.modalMetaLabel}>For:</Text>
                          <View style={styles.childBadge}>
                            <Text style={styles.childBadgeText}>
                              {getChildName((selectedItem as ChecklistItem).child_id)}
                            </Text>
                          </View>
                        </View>
                      )}
                    </>
                  )}

                  {/* Doctor/Provider-specific fields */}
                  {selectedItem._source === "doctor" && (
                    <>
                      <Text style={styles.modalLabel}>Notes</Text>
                      <TextInput
                        style={[styles.modalTitleInput, { minHeight: 80 }]}
                        value={editNotes}
                        onChangeText={setEditNotes}
                        multiline
                        placeholder="Notes or context for your provider..."
                        placeholderTextColor={colors.stone[400]}
                        textAlignVertical="top"
                      />

                      {(selectedItem as DoctorDiscussionItem).doctor_response && (
                        <>
                          <Text style={styles.modalLabel}>Provider Response</Text>
                          <View style={styles.modalDescriptionBox}>
                            <Text style={styles.modalDescriptionText}>
                              {(selectedItem as DoctorDiscussionItem).doctor_response}
                            </Text>
                          </View>
                        </>
                      )}

                      {(selectedItem as DoctorDiscussionItem).child_ids &&
                        (selectedItem as DoctorDiscussionItem).child_ids!.length > 0 && (
                        <View style={styles.modalMeta}>
                          <Text style={styles.modalMetaLabel}>For:</Text>
                          {(selectedItem as DoctorDiscussionItem).child_ids!.map((cid) => (
                            <View key={cid} style={styles.childBadge}>
                              <Text style={styles.childBadgeText}>
                                {getChildName(cid)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </>
                  )}

                  <PressableScale
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteUnified(selectedItem)}
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
  addFormScroll: {
    maxHeight: 380,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  addForm: {
    ...cardBase,
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
  addDescriptionInput: {
    minHeight: 72,
    paddingTop: 10,
  },
  clearDateBtnInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  addCategoryProviderPillBase: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addCategoryProviderPillActive: {
    backgroundColor: colors.accent[500],
    borderColor: colors.accent[500],
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
  sectionCountBadgeProvider: {
    backgroundColor: colors.accent[50],
  },
  sectionCountProvider: {
    color: colors.accent[600],
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
  providerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.accent[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  providerBadgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.accent[700],
  },
  priorityHighBadge: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  priorityHighText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: "#dc2626",
  },
  chatBadge: {
    backgroundColor: colors.sage[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  chatBadgeText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    color: colors.sage[700],
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
  modalDescriptionText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.foreground,
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
