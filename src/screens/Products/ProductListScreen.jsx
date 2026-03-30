import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Searchbar,
  FAB,
  Card,
  Chip,
  ActivityIndicator,
  Dialog,
  Portal,
  Button,
  Menu,
  IconButton,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useProductList, useDeleteProduct } from '../../hooks/useProducts';
import { getCategories } from '../../api/products';
import { formatCurrency } from '../../utils/currency';
import { resolveImageUrl } from '../../utils/image';

/** Flatten pages into a single array */
function flattenPages(data) {
  return data?.pages.flatMap((p) => p.data) ?? [];
}

function StockBadge({ stock, trackStock }) {
  if (!trackStock) return null;
  const low = stock <= 0;
  return (
    <Chip
      compact
      style={{ backgroundColor: low ? '#FFEBEE' : '#E8F5E9' }}
      textStyle={{
        color: low ? '#C62828' : '#2E7D32',
        fontSize: 10,
        fontWeight: '700',
      }}
    >
      {low ? 'Out of Stock' : `${stock} in stock`}
    </Chip>
  );
}

function ProductRow({ item, onPress, onDelete }) {
  return (
    <Card style={styles.card} onPress={() => onPress(item)} elevation={1}>
      <Card.Content style={styles.row}>
        {item.image ? (
          <Image source={{ uri: resolveImageUrl(item.image) }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <MaterialCommunityIcons name="package-variant" size={26} color="#94B4C1" />
          </View>
        )}

        <View style={styles.info}>
          <Text variant="titleSmall" numberOfLines={1}>
            {item.name}
          </Text>
          {item.sku ? (
            <Text variant="bodySmall" style={styles.meta}>
              SKU: {item.sku}
            </Text>
          ) : null}
          <Text variant="bodyMedium" style={styles.price}>
            {formatCurrency(parseFloat(item.price))}
          </Text>
          <StockBadge stock={item.stock ?? 0} trackStock={item.track_stock} />
        </View>

        <IconButton
          icon="delete-outline"
          iconColor="#C62828"
          size={20}
          onPress={() => onDelete(item)}
        />
      </Card.Content>
    </Card>
  );
}

export default function ProductListScreen({ navigation }) {
  const theme = useTheme();

  // ── Filters ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const debounceRef = React.useRef(null);

  const handleSearchChange = (text) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(text), 400);
  };

  const queryParams = useMemo(() => {
    const p = {};
    if (debouncedSearch) p.search = debouncedSearch;
    if (selectedCategory) p.category = selectedCategory;
    return p;
  }, [debouncedSearch, selectedCategory]);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
    refetch,
  } = useProductList(queryParams);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const products = flattenPages(data);

  // ── Delete ───────────────────────────────────────────────────────────────────
  const deleteMutation = useDeleteProduct();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const confirmDelete = useCallback((item) => setDeleteTarget(item), []);
  const cancelDelete = useCallback(() => setDeleteTarget(null), []);
  const executeDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  // ── Render ───────────────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }) => (
      <ProductRow
        item={item}
        onPress={(p) => navigation.navigate('ProductDetail', { id: p.id })}
        onDelete={confirmDelete}
      />
    ),
    [navigation, confirmDelete],
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <ActivityIndicator style={{ marginVertical: 12 }} />
    );
  };

  const selectedCategoryName =
    categories.find((c) => String(c.id) === String(selectedCategory))?.name ??
    'All Categories';

  return (
    <View style={styles.container}>
      {/* ── Search bar ────────────────────────────────────────────────────────── */}
      <Searchbar
        placeholder="Search name, SKU, barcode…"
        value={search}
        onChangeText={handleSearchChange}
        style={styles.searchbar}
      />

      {/* ── Category filter ───────────────────────────────────────────────────── */}
      <View style={styles.filterRow}>
        <Menu
          visible={categoryMenuVisible}
          onDismiss={() => setCategoryMenuVisible(false)}
          anchor={
            <Chip
              icon="filter-variant"
              onPress={() => setCategoryMenuVisible(true)}
              selected={!!selectedCategory}
              style={styles.filterChip}
            >
              {selectedCategoryName}
            </Chip>
          }
        >
          <Menu.Item
            title="All Categories"
            onPress={() => {
              setSelectedCategory(null);
              setCategoryMenuVisible(false);
            }}
          />
          {categories.map((cat) => (
            <Menu.Item
              key={cat.id}
              title={cat.name}
              onPress={() => {
                setSelectedCategory(cat.id);
                setCategoryMenuVisible(false);
              }}
            />
          ))}
        </Menu>

        {selectedCategory ? (
          <IconButton
            icon="close"
            size={16}
            onPress={() => setSelectedCategory(null)}
          />
        ) : null}
      </View>

      {/* ── List ─────────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isFetchingNextPage}
              onRefresh={refetch}
              colors={[theme.colors.primary]}
            />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text variant="bodyMedium" style={styles.empty}>
                No products found
              </Text>
            </View>
          }
        />
      )}

      {/* ── FAB ──────────────────────────────────────────────────────────────── */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => navigation.navigate('ProductForm', {})}
      />

      {/* ── Delete confirmation dialog ────────────────────────────────────────── */}
      <Portal>
        <Dialog visible={!!deleteTarget} onDismiss={cancelDelete}>
          <Dialog.Title>Delete Product</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete{' '}
              <Text style={{ fontWeight: '700' }}>{deleteTarget?.name}</Text>?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelDelete}>Cancel</Button>
            <Button
              textColor={theme.colors.error}
              onPress={executeDelete}
              loading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchbar: { margin: 12, elevation: 1 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  filterChip: { marginRight: 4 },
  list: { paddingHorizontal: 12, paddingBottom: 100 },
  card: { marginBottom: 8, borderRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 8 },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#EDF3F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, gap: 2 },
  meta: { color: '#888' },
  price: { fontWeight: '700', color: '#213448' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  empty: { color: '#999' },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
