import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SectionList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { ChecklistItem, Child } from '@kinpath/shared';
import { colors, fonts, typography, spacing, radii, shadows, cardBase } from '../../lib/theme';
import { FadeInUp, StaggerItem, PressableScale } from '../../components/motion';

interface ChecklistSection {
  title: string;
  data: ChecklistItem[];
}

export default function ChecklistScreen() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemChildId, setNewItemChildId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Fetch user's children
  useEffect(() => {
    if (!user) return;
    fetchChildren();
  }, [user]);

  // Fetch checklist items when selected child changes
  useEffect(() => {
    if (!user) return;
    fetchChecklist();
  }, [user, selectedChildId]);

  const fetchChildren = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    }
  };

  const fetchChecklist = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('checklist_items')
        .select('*')
        .eq('user_id', user.id);

      if (selectedChildId && selectedChildId !== 'all') {
        query = query.eq('child_id', selectedChildId);
      } else if (selectedChildId === 'all') {
        query = query.in('child_id', ['null', ...children.map(c => c.id)]);
      }

      const { data, error } = await query.order('sort_order', { ascending: true });

      if (error) throw error;
      setChecklist(data || []);
    } catch (error) {
      console.error('Error fetching checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchChecklist();
    setRefreshing(false);
  }, [user, selectedChildId]);

  const handleAddItem = async () => {
    if (!user || !newItemTitle.trim()) return;

    try {
      const { error } = await supabase.from('checklist_items').insert({
        user_id: user.id,
        child_id: newItemChildId || null,
        title: newItemTitle.trim(),
        description: null,
        item_type: 'custom',
        is_completed: false,
        sort_order: 0,
      });

      if (error) throw error;

      setNewItemTitle('');
      setNewItemChildId(null);
      setShowAddForm(false);
      await fetchChecklist();
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const toggleCompletion = async (item: ChecklistItem) => {
    if (!user) return;

    const newCompletedState = !item.is_completed;
    const completedAt = newCompletedState ? new Date().toISOString() : null;

    // Optimistic update
    setChecklist(prev =>
      prev.map(i =>
        i.id === item.id
          ? { ...i, is_completed: newCompletedState, completed_at: completedAt }
          : i
      )
    );

    try {
      const { error } = await supabase
        .from('checklist_items')
        .update({
          is_completed: newCompletedState,
          completed_at: completedAt,
        })
        .eq('id', item.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating item:', error);
      // Revert optimistic update
      await fetchChecklist();
    }
  };

  const handleDeleteItem = (item: ChecklistItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('checklist_items')
                .delete()
                .eq('id', item.id);

              if (error) throw error;
              await fetchChecklist();
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateNormalized = new Date(date);
    dueDateNormalized.setHours(0, 0, 0, 0);

    const diffTime = dueDateNormalized.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getChildName = (childId: string | null) => {
    if (!childId) return null;
    const child = children.find(c => c.id === childId);
    return child?.name || null;
  };

  // Organize items into sections
  const incompleteItems = checklist.filter(item => !item.is_completed);
  const completedItems = checklist.filter(item => item.is_completed);

  const sections: ChecklistSection[] = [
    {
      title: 'Active Items',
      data: incompleteItems,
    },
    ...(completedItems.length > 0
      ? [
          {
            title: 'Completed',
            data: completedItems,
          },
        ]
      : []),
  ];

  const renderChecklistItem = ({ item }: { item: ChecklistItem }) => {
    const childName = getChildName(item.child_id);
    const dueDate = formatDueDate(item.due_date);
    const isCompleted = item.is_completed;

    return (
      <PressableScale
        onLongPress={() => handleDeleteItem(item)}
        style={[
          styles.itemContainer,
          isCompleted && styles.itemContainerCompleted,
        ]}
      >
        <PressableScale
          style={styles.checkboxContainer}
          onPress={() => toggleCompletion(item)}
          scaleTo={0.9}
        >
          <View
            style={[
              styles.checkbox,
              isCompleted && styles.checkboxChecked,
            ]}
          >
            {isCompleted && (
              <Ionicons
                name="checkmark"
                size={14}
                color={colors.white}
              />
            )}
          </View>
        </PressableScale>

        <View style={styles.itemContentContainer}>
          <Text
            style={[
              styles.itemTitle,
              isCompleted && styles.itemTitleCompleted,
            ]}
          >
            {item.title}
          </Text>

          <View style={styles.itemMetaContainer}>
            {childName && (
              <View style={styles.childBadge}>
                <Text style={styles.childBadgeText}>{childName}</Text>
              </View>
            )}

            {item.item_type === 'custom' && item.description && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>from chat</Text>
              </View>
            )}

            {dueDate && (
              <Text style={[
                styles.dueDateText,
                isCompleted && styles.dueDateTextCompleted,
              ]}>
                {dueDate}
              </Text>
            )}
          </View>
        </View>

        <PressableScale
          onPress={() => handleDeleteItem(item)}
          scaleTo={0.9}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={isCompleted ? colors.stone[300] : colors.stone[400]}
          />
        </PressableScale>
      </PressableScale>
    );
  };

  const renderSectionHeader = ({ section }: { section: ChecklistSection }) => {
    if (section.data.length === 0) return null;
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <View style={styles.sectionCountBadge}>
          <Text style={styles.sectionCount}>{section.data.length}</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyStateIconCircle}>
          <Ionicons
            name="checkmark-circle-outline"
            size={40}
            color={colors.brand[500]}
          />
        </View>
        <Text style={styles.emptyStateHeading}>No items yet</Text>
        <Text style={styles.emptyStateText}>
          Your checklist is empty. Add items from chat or use the + button.
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Checklist</Text>
      </View>

      {/* Child Pills */}
      {children.length > 0 && (
        <View style={styles.childPillsContainer}>
          <PressableScale
            style={[
              styles.childPill,
              selectedChildId === null && styles.childPillActive,
            ]}
            onPress={() => setSelectedChildId(null)}
            scaleTo={0.95}
          >
            <Text
              style={[
                styles.childPillText,
                selectedChildId === null && styles.childPillTextActive,
              ]}
            >
              All
            </Text>
          </PressableScale>

          {children.map(child => (
            <PressableScale
              key={child.id}
              style={[
                styles.childPill,
                selectedChildId === child.id && styles.childPillActive,
              ]}
              onPress={() => setSelectedChildId(child.id)}
              scaleTo={0.95}
            >
              <Text
                style={[
                  styles.childPillText,
                  selectedChildId === child.id && styles.childPillTextActive,
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
          <View style={styles.addFormContainer}>
            <TextInput
              style={styles.addFormInput}
              placeholder="What do you want to add?"
              placeholderTextColor={colors.stone[400]}
              value={newItemTitle}
              onChangeText={setNewItemTitle}
              returnKeyType="go"
              onSubmitEditing={handleAddItem}
            />

            {children.length > 0 && (
              <View style={styles.addFormChildSelector}>
                <Text style={styles.addFormLabel}>For:</Text>
                <PressableScale
                  style={[
                    styles.childSelectorPill,
                    newItemChildId === null && styles.childSelectorPillActive,
                  ]}
                  onPress={() => setNewItemChildId(null)}
                  scaleTo={0.95}
                >
                  <Text
                    style={[
                      styles.childSelectorPillText,
                      newItemChildId === null && styles.childSelectorPillTextActive,
                    ]}
                  >
                    All
                  </Text>
                </PressableScale>
                {children.map(child => (
                  <PressableScale
                    key={child.id}
                    style={[
                      styles.childSelectorPill,
                      newItemChildId === child.id && styles.childSelectorPillActive,
                    ]}
                    onPress={() => setNewItemChildId(child.id)}
                    scaleTo={0.95}
                  >
                    <Text
                      style={[
                        styles.childSelectorPillText,
                        newItemChildId === child.id &&
                          styles.childSelectorPillTextActive,
                      ]}
                    >
                      {child.name}
                    </Text>
                  </PressableScale>
                ))}
              </View>
            )}

            <View style={styles.addFormButtonContainer}>
              <PressableScale
                style={styles.addFormCancelButton}
                onPress={() => {
                  setShowAddForm(false);
                  setNewItemTitle('');
                  setNewItemChildId(null);
                }}
                scaleTo={0.95}
              >
                <Text style={styles.addFormCancelButtonText}>Cancel</Text>
              </PressableScale>

              <PressableScale
                style={[
                  styles.addFormSubmitButton,
                  !newItemTitle.trim() && styles.addFormSubmitButtonDisabled,
                ]}
                onPress={handleAddItem}
                disabled={!newItemTitle.trim()}
                scaleTo={0.95}
              >
                <Text style={styles.addFormSubmitButtonText}>Add</Text>
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
          sections={sections.filter(s => s.data.length > 0)}
          keyExtractor={(item, index) => item.id}
          renderItem={renderChecklistItem}
          renderSectionHeader={renderSectionHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.brand[500]}
            />
          }
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      )}

      {/* Floating Action Button */}
      <PressableScale
        style={styles.fab}
        onPress={() => setShowAddForm(!showAddForm)}
        scaleTo={0.92}
      >
        <Ionicons
          name={showAddForm ? 'close' : 'add'}
          size={28}
          color={colors.white}
        />
      </PressableScale>
    </SafeAreaView>
  );
}

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
  childPillsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  childPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.stone[200],
  },
  childPillActive: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  childPillText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.stone[700],
  },
  childPillTextActive: {
    color: colors.white,
  },
  addFormContainer: {
    ...cardBase,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.md,
  },
  addFormInput: {
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
  addFormLabel: {
    ...typography.labelSmall,
    fontFamily: fonts.sansSemiBold,
    color: colors.stone[600],
    marginRight: spacing.sm,
  },
  addFormChildSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  childSelectorPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: colors.stone[50],
    borderWidth: 1,
    borderColor: colors.stone[200],
  },
  childSelectorPillActive: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  childSelectorPillText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.stone[700],
  },
  childSelectorPillTextActive: {
    color: colors.white,
  },
  addFormButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  addFormCancelButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.stone[100],
  },
  addFormCancelButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.stone[700],
  },
  addFormSubmitButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.brand[500],
  },
  addFormSubmitButtonDisabled: {
    backgroundColor: colors.stone[200],
  },
  addFormSubmitButtonText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.white,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.headingMedium,
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
  itemContainer: {
    ...cardBase,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
  },
  itemContainerCompleted: {
    backgroundColor: colors.stone[50],
    borderColor: colors.stone[200],
    ...shadows.soft,
  },
  checkboxContainer: {
    marginRight: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.brand[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  itemContentContainer: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.stone[400],
  },
  itemMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
  dueDateText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: colors.stone[500],
  },
  dueDateTextCompleted: {
    color: colors.stone[300],
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  emptyStateIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateHeading: {
    ...typography.displaySmall,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.bodyMedium,
    color: colors.stone[500],
    textAlign: 'center',
  },
  loadingText: {
    ...typography.bodyLarge,
    color: colors.stone[500],
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: spacing['2xl'],
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.glow,
  },
});
