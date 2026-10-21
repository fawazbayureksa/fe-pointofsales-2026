import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Text,
  Searchbar,
  Button,
  Divider,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAllCategories } from '../hooks/useCategories';

/**
 * A modal bottom-sheet category picker.
 *
 * Props:
 *   visible       {boolean}
 *   onDismiss     {() => void}
 *   selectedId    {number|null}                    currently selected category id
 *   excludeId     {number|undefined}               category id to exclude (e.g. self when editing)
 *   rootsOnly     {boolean}                        show only top-level categories
 *   onSelect      {(cat: Object|null) => void}     null = "no category" / "None"
 */
export default function CategoryPicker({
  visible,
  onDismiss,
  selectedId,
  excludeId,
  rootsOnly = false,
  onSelect,
}) {
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.min(Math.round(windowHeight * 0.8), 600);
  const [search, setSearch] = useState('');

  const { data: allCategories = [], isLoading } = useAllCategories();

  const categories = useMemo(() => {
    let list = Array.isArray(allCategories) ? allCategories : (allCategories?.data ?? []);

    if (rootsOnly) {
      list = list.filter((c) => c.parent_id === null);
    }

    if (excludeId != null) {
      list = list.filter((c) => c.id !== excludeId);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => c.name && c.name.toLowerCase().includes(q));
    }

    return list;
  }, [allCategories, rootsOnly, excludeId, search]);

  const handleSelect = (cat) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(cat);
    setSearch('');
  };

  const handleDismiss = () => {
    setSearch('');
    onDismiss();
  };

  const renderItem = ({ item }) => {
    const isSelected = item.id === selectedId;
    const isChild = item.parent_id !== null;

    return (
      <TouchableOpacity
        style={[
          styles.item,
          isChild && styles.itemIndented,
          isSelected && { backgroundColor: `${theme.colors.primary}12` },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemRow}>
          {isChild ? (
            <View style={styles.childBarWrap}>
              <View style={styles.childBar} />
              <View
                style={[
                  styles.avatarWrapSmall,
                  isSelected && { backgroundColor: theme.colors.primary },
                ]}
              >
                <MaterialCommunityIcons
                  name="subdirectory-arrow-right"
                  size={16}
                  color={isSelected ? '#FFFFFF' : '#547792'}
                />
              </View>
            </View>
          ) : (
            <View
              style={[
                styles.avatarWrap,
                isSelected && { backgroundColor: theme.colors.primary },
              ]}
            >
              <MaterialCommunityIcons
                name="folder-outline"
                size={20}
                color={isSelected ? '#FFFFFF' : '#547792'}
              />
            </View>
          )}

          <View style={styles.itemTexts}>
            <Text
              variant="bodyMedium"
              style={[
                styles.itemName,
                isSelected && { color: theme.colors.primary, fontWeight: '700' },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {item.parent && (
              <Text variant="bodySmall" style={styles.itemParent} numberOfLines={1}>
                in {item.parent.name}
              </Text>
            )}
          </View>

          {isSelected && (
            <MaterialCommunityIcons
              name="check-circle"
              size={22}
              color={theme.colors.primary}
            />
          )}
        </View>
        <Divider style={styles.itemDivider} />
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <TouchableOpacity
        style={styles.backdrop}
        onPress={handleDismiss}
        activeOpacity={1}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrapper}
      >
        <View style={[styles.sheet, { maxHeight: sheetHeight }]}>
          {/* Handle */}
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <MaterialCommunityIcons name="shape-outline" size={22} color="#547792" />
              <Text variant="titleMedium" style={styles.title}>
                {rootsOnly ? 'Select Parent Category' : 'Select Category'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.closeIconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text variant="bodySmall" style={styles.subtitle}>
            {rootsOnly
              ? 'Choose a top-level category to place this under, or select None.'
              : 'Choose a category to organize and group this product.'}
          </Text>

          <Searchbar
            placeholder="Search categories…"
            value={search}
            onChangeText={setSearch}
            style={styles.searchbar}
            elevation={0}
          />

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ListHeaderComponent={
                <TouchableOpacity
                  style={[
                    styles.item,
                    selectedId == null && { backgroundColor: `${theme.colors.primary}12` },
                  ]}
                  onPress={() => handleSelect(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemRow}>
                    <View
                      style={[
                        styles.avatarWrap,
                        selectedId == null && { backgroundColor: theme.colors.primary },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="tag-off-outline"
                        size={20}
                        color={selectedId == null ? '#FFFFFF' : '#94A3B8'}
                      />
                    </View>
                    <View style={styles.itemTexts}>
                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.itemName,
                          selectedId == null && {
                            color: theme.colors.primary,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {rootsOnly ? 'None (Top-Level)' : 'None (Uncategorized)'}
                      </Text>
                      <Text variant="bodySmall" style={styles.itemParent}>
                        {rootsOnly
                          ? 'This category will not have a parent'
                          : 'Product will not be assigned to a category'}
                      </Text>
                    </View>
                    {selectedId == null && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={22}
                        color={theme.colors.primary}
                      />
                    )}
                  </View>
                  <Divider style={styles.itemDivider} />
                </TouchableOpacity>
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No categories found.</Text>
                </View>
              }
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          )}

          <Button
            mode="outlined"
            onPress={handleDismiss}
            style={styles.closeBtn}
          >
            Cancel
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheetWrapper: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '800',
    color: '#213448',
    fontSize: 17,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 16,
  },
  closeIconBtn: {
    padding: 4,
  },
  searchbar: {
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    height: 42,
  },
  list: {
    flexGrow: 0,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 8,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 2,
  },
  itemIndented: {
    paddingLeft: 22,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDF3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDF3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  childBar: {
    width: 3,
    height: 24,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  itemTexts: {
    flex: 1,
  },
  itemName: {
    fontWeight: '700',
    color: '#213448',
    fontSize: 14,
    marginBottom: 2,
  },
  itemParent: {
    color: '#64748B',
    fontSize: 11,
  },
  itemDivider: {
    marginTop: 10,
    backgroundColor: '#F1F5F9',
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  closeBtn: {
    marginTop: 6,
    borderRadius: 8,
    borderColor: '#CBD5E1',
  },
});
