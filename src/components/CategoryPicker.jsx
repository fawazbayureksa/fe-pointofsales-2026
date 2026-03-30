import React, { useState, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Searchbar,
  Button,
  Divider,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import { useAllCategories } from '../hooks/useCategories';

/**
 * A modal bottom-sheet category picker.
 *
 * Props:
 *   visible       {boolean}
 *   onDismiss     {() => void}
 *   selectedId    {number|null}         currently selected category id
 *   excludeId     {number|undefined}    category id to exclude (e.g. self when editing)
 *   rootsOnly     {boolean}             show only top-level categories
 *   onSelect      {(cat: Category|null) => void}   null = "no category" / "None"
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
  const [search, setSearch] = useState('');

  const { data: allCategories = [], isLoading } = useAllCategories();

  const categories = useMemo(() => {
    let list = allCategories;

    if (rootsOnly) {
      list = list.filter((c) => c.parent_id === null);
    }

    if (excludeId != null) {
      list = list.filter((c) => c.id !== excludeId);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }

    return list;
  }, [allCategories, rootsOnly, excludeId, search]);

  const handleSelect = (cat) => {
    onSelect(cat);
    setSearch('');
  };

  const handleDismiss = () => {
    setSearch('');
    onDismiss();
  };

  const renderItem = ({ item }) => {
    const isSelected = item.id === selectedId;
    const isChild    = item.parent_id !== null;

    return (
      <TouchableOpacity
        style={[
          styles.item,
          isChild && styles.itemIndented,
          isSelected && { backgroundColor: theme.colors.primaryContainer },
        ]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.itemRow}>
          {isChild && <View style={styles.childBar} />}
          <View style={styles.itemTexts}>
            <Text
              variant="bodyMedium"
              style={[styles.itemName, isSelected && { color: theme.colors.primary, fontWeight: '700' }]}
            >
              {item.name}
            </Text>
            {item.parent && (
              <Text variant="bodySmall" style={styles.itemParent}>
                {item.parent.name}
              </Text>
            )}
          </View>
          {isSelected && (
            <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 18 }}>✓</Text>
          )}
        </View>
        <Divider />
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
      <TouchableOpacity style={styles.backdrop} onPress={handleDismiss} activeOpacity={1} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrapper}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          <Text variant="titleMedium" style={styles.title}>
            Select Category
          </Text>

          <Searchbar
            placeholder="Search…"
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
              ListHeaderComponent={
                <TouchableOpacity
                  style={[
                    styles.item,
                    selectedId == null && { backgroundColor: theme.colors.primaryContainer },
                  ]}
                  onPress={() => handleSelect(null)}
                  activeOpacity={0.7}
                >
                  <View style={styles.itemRow}>
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
                      None
                    </Text>
                    {selectedId == null && (
                      <Text style={{ color: theme.colors.primary, fontWeight: '700', fontSize: 18 }}>
                        ✓
                      </Text>
                    )}
                  </View>
                  <Divider />
                </TouchableOpacity>
              }
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No categories found.</Text>
                </View>
              }
              style={styles.list}
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
    maxHeight: '78%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  searchbar: {
    marginBottom: 8,
    borderRadius: 10,
  },
  list: {
    flexGrow: 0,
    maxHeight: 340,
  },
  item: {
    backgroundColor: '#fff',
  },
  itemIndented: {
    paddingLeft: 20,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  childBar: {
    width: 3,
    height: 22,
    borderRadius: 2,
    backgroundColor: '#94B4C1',
  },
  itemTexts: { flex: 1 },
  itemName: { fontWeight: '500' },
  itemParent: { color: '#888', marginTop: 1 },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: { color: '#888' },
  closeBtn: {
    marginTop: 12,
    borderRadius: 8,
  },
});
