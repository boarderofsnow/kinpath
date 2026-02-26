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
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';
import { ChecklistItem, Child } from '@kinpath/shared';

const COLORS = {
  primary: '#10b89f',
  secondary: '#5f8253',
  accent: '#f59e0b',
  background: '#f0eeec',
  dark: '#1c1917',
  stone200: '#e7e5e4',
  white: '#ffffff',
};

const SCREEN_WIDTH = Dimensions.get('window').width;

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
        .order('date_of_birth', { ascending: true });

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
      <TouchableOpacity
        onLongPress={() => handleDeleteItem(item)}
        activeOpacity={0.7}
        style={[
          styles.itemContainer,
          isCompleted && styles.itemContainerCompleted,
        ]}
      >
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleCompletion(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
                size={16}
                color={COLORS.white}
              />
            )}
          </View>
        </TouchableOpacity>

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

        <TouchableOpacity
          onPress={() => handleDeleteItem(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={isCompleted ? COLORS.stone200 : COLORS.dark}
            style={{ opacity: 0.5 }}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: ChecklistSection }) => {
    if (section.data.length === 0) return null;
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        <Text style={styles.sectionCount}>{section.data.length}</Text>
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
        <Ionicons
          name="checkmark-circle-outline"
          size={48}
          color={COLORS.stone200}
          style={{ marginBottom: 16 }}
        />
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
          <TouchableOpacity
            style={[
              styles.childPill,
              selectedChildId === null && styles.childPillActive,
            ]}
            onPress={() => setSelectedChildId(null)}
          >
            <Text
              style={[
                styles.childPillText,
                selectedChildId === null && styles.childPillTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {children.map(child => (
            <TouchableOpacity
              key={child.id}
              style={[
                styles.childPill,
                selectedChildId === child.id && styles.childPillActive,
              ]}
              onPress={() => setSelectedChildId(child.id)}
            >
              <Text
                style={[
                  styles.childPillText,
                  selectedChildId === child.id && styles.childPillTextActive,
                ]}
              >
                {child.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Add Item Form */}
      {showAddForm && (
        <View style={styles.addFormContainer}>
          <TextInput
            style={styles.addFormInput}
            placeholder="What do you want to add?"
            placeholderTextColor={COLORS.stone200}
            value={newItemTitle}
            onChangeText={setNewItemTitle}
            returnKeyType="go"
            onSubmitEditing={handleAddItem}
          />

          {children.length > 0 && (
            <View style={styles.addFormChildSelector}>
              <Text style={styles.addFormLabel}>For:</Text>
              <TouchableOpacity
                style={[
                  styles.childSelectorPill,
                  newItemChildId === null && styles.childSelectorPillActive,
                ]}
                onPress={() => setNewItemChildId(null)}
              >
                <Text
                  style={[
                    styles.childSelectorPillText,
                    newItemChildId === null && styles.childSelectorPillTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childSelectorPill,
                    newItemChildId === child.id && styles.childSelectorPillActive,
                  ]}
                  onPress={() => setNewItemChildId(child.id)}
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
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.addFormButtonContainer}>
            <TouchableOpacity
              style={styles.addFormCancelButton}
              onPress={() => {
                setShowAddForm(false);
                setNewItemTitle('');
                setNewItemChildId(null);
              }}
            >
              <Text style={styles.addFormCancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.addFormSubmitButton,
                !newItemTitle.trim() && styles.addFormSubmitButtonDisabled,
              ]}
              onPress={handleAddItem}
              disabled={!newItemTitle.trim()}
            >
              <Text style={styles.addFormSubmitButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
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
              tintColor={COLORS.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          scrollEnabled={true}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddForm(!showAddForm)}
      >
        <Ionicons
          name={showAddForm ? 'close' : 'add'}
          size={28}
          color={COLORS.white}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.stone200,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.dark,
  },
  childPillsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.stone200,
  },
  childPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.stone200,
  },
  childPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  childPillText: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
  },
  childPillTextActive: {
    color: COLORS.white,
  },
  addFormContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.stone200,
    padding: 16,
  },
  addFormInput: {
    borderWidth: 1,
    borderColor: COLORS.stone200,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 12,
  },
  addFormLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 8,
    marginRight: 8,
  },
  addFormChildSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  childSelectorPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.stone200,
  },
  childSelectorPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  childSelectorPillText: {
    fontSize: 12,
    color: COLORS.dark,
    fontWeight: '500',
  },
  childSelectorPillTextActive: {
    color: COLORS.white,
  },
  addFormButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  addFormCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: COLORS.stone200,
  },
  addFormCancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  addFormSubmitButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  addFormSubmitButtonDisabled: {
    backgroundColor: COLORS.stone200,
  },
  addFormSubmitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  itemContainerCompleted: {
    backgroundColor: COLORS.background,
    borderLeftColor: COLORS.stone200,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  itemContentContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark,
    marginBottom: 6,
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.stone200,
  },
  itemMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  childBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  childBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.white,
  },
  chatBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chatBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.white,
  },
  dueDateText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '400',
  },
  dueDateTextCompleted: {
    color: COLORS.stone200,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.dark,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.dark,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
