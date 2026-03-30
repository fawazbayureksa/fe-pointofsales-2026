import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Searchbar,
  FAB,
  Dialog,
  Button,
  Portal,
  Chip,
  ActivityIndicator,
  Snackbar,
  useTheme,
  Divider,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCategoryList, useDeleteCategory } from '../../hooks/useCategories';

const DEBOUNCE_MS = 400;

export default function CategoryListScreen({ navigation }) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const debounceRef = useRef(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch, isFetching } = useCategoryList(
    appliedSearch ? { search: appliedSearch } : {},
  );
  const categories = Array.isArray(data) ? data : (data?.data ?? []);

  // ── Search debounce ─────────────────────────────────────────────────────────
  const handleSearchChange = useCallback((text) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setAppliedSearch(text), DEBOUNCE_MS);
  }, []);

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteMutation = useDeleteCategory();

  const confirmDelete = (cat) => setDeleteTarget(cat);
  const cancelDelete  = () => setDeleteTarget(null);

  const executeDelete = async () => {
    const cat = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteMutation.mutateAsync(cat.id);
      setSnackbar({ visible: true, message: `"${cat.name}" deleted.` });
    } catch (err) {
      setSnackbar({ visible: true, message: err?.message ?? 'Delete failed.' });
    }
  };

  // ── Render item ─────────────────────────────────────────────────────────────
  const renderItem = useCallback(({ item }) => {
    const isChild = item.parent_id !== null;
    return (
      <TouchableOpacity
        style={[styles.row, isChild && styles.rowIndented]}
        onPress={() => navigation.navigate('CategoryForm', { category: item })}
        onLongPress={() => confirmDelete(item)}
        activeOpacity={0.7}
      >
        <View style={styles.rowContent}>
          <View style={styles.rowLeft}>
            {isChild && <View style={styles.childIndicator} />}
            <View>
              <Text
                variant="bodyLarge"
                style={[styles.catName, !item.is_active && styles.inactive]}
              >
                {item.name}
              </Text>
              {item.parent && (
                <Text variant="bodySmall" style={styles.parentLabel}>
                  {item.parent.name}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.rowRight}>
            {item.products_count != null && (
              <Chip
                compact
                style={[styles.countChip, { backgroundColor: theme.colors.secondaryContainer }]}
                textStyle={{ fontSize: 11 }}
              >
                {item.products_count} products
              </Chip>
            )}
            {!item.is_active && (
              <Chip compact style={styles.inactiveChip} textStyle={{ fontSize: 11 }}>
                Inactive
              </Chip>
            )}
          </View>
        </View>
        <Divider />
      </TouchableOpacity>
    );
  }, [navigation, theme]);

  // ── Empty / loading states ──────────────────────────────────────────────────
  const ListEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    if (isError) {
      return (
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#C62828" />
          <Text style={styles.errorText}>Failed to load categories.</Text>
          <Button onPress={refetch} style={{ marginTop: 8 }}>Retry</Button>
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="shape-outline" size={40} color="#94B4C1" />
        <Text style={styles.emptyText}>No categories found.</Text>
      </View>
    );
  };

  return (
    <View style={styles.flex}>
      <Searchbar
        placeholder="Search categories…"
        value={search}
        onChangeText={handleSearchChange}
        style={styles.searchbar}
        elevation={0}
      />

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={categories.length === 0 && styles.emptyContainer}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />

      {/* ── FAB ──────────────────────────────────────────────────────────────── */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => navigation.navigate('CategoryForm', {})}
      />

      {/* ── Delete confirmation dialog ─────────────────────────────────────── */}
      <Portal>
        <Dialog visible={!!deleteTarget} onDismiss={cancelDelete}>
          <Dialog.Title>Delete Category</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Delete &ldquo;{deleteTarget?.name}&rdquo;? This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelDelete}>Cancel</Button>
            <Button
              textColor={theme.colors.error}
              loading={deleteMutation.isPending}
              onPress={executeDelete}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchbar: {
    margin: 12,
    borderRadius: 10,
  },
  row: {
    backgroundColor: '#fff',
  },
  rowIndented: {
    paddingLeft: 24,
    backgroundColor: '#FAFAFA',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  childIndicator: {
    width: 3,
    height: 28,
    borderRadius: 2,
    backgroundColor: '#94B4C1',
    marginRight: 4,
  },
  catName: { fontWeight: '600' },
  inactive: { color: '#999' },
  parentLabel: { color: '#888', marginTop: 2 },
  rowRight: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  countChip: {},
  inactiveChip: { backgroundColor: '#F5F5F5' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
  },
  emptyContainer: { flex: 1 },
  emptyText: { color: '#888', fontSize: 15 },
  errorText: { color: '#B00020', fontSize: 15 },
});
