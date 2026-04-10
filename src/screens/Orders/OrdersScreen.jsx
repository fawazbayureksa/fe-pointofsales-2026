import React, { useState, useCallback } from 'react';
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
  ActivityIndicator,
  Divider,
  useTheme,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOrderList } from '../../hooks/useOrders';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

const STATUS_TABS = [
  { key: '',           label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'completed',  label: 'Completed' },
  { key: 'cancelled',  label: 'Cancelled' },
  { key: 'refunded',   label: 'Refunded' },
];

const STATUS_COLORS = {
  pending:    { bg: '#FFF3E0', text: '#E65100' },
  processing: { bg: '#E3F2FD', text: '#1565C0' },
  completed:  { bg: '#E8F5E9', text: '#2E7D32' },
  cancelled:  { bg: '#F5F5F5', text: '#757575' },
  refunded:   { bg: '#EDE7F6', text: '#6A1B9A' },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] ?? { bg: '#F5F5F5', text: '#555' };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

function OrderRow({ order, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(order)} activeOpacity={0.7}>
      <View style={styles.rowMain}>
        <View style={styles.rowLeft}>
          <Text variant="bodyMedium" style={styles.orderNum}>{order.order_number}</Text>
          <Text variant="bodySmall" style={styles.customerName}>
            {order.customer?.name ?? 'Walk-in'}
          </Text>
          <Text variant="bodySmall" style={styles.timeText}>
            {formatDate(order.created_at)}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text variant="titleSmall" style={styles.totalText}>
            {formatCurrency(parseFloat(order.total_amount))}
          </Text>
          <StatusBadge status={order.status} />
        </View>
      </View>
      <Divider />
    </TouchableOpacity>
  );
}

const DEBOUNCE_MS = 400;

export default function OrdersScreen({ navigation }) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debounceRef = React.useRef(null);

  const params = {
    ...(appliedSearch ? { search: appliedSearch } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useOrderList(params);

  const orders = data?.pages.flatMap((p) => p.data ?? []) ?? [];

  const handleSearchChange = useCallback((text) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setAppliedSearch(text), DEBOUNCE_MS);
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <OrderRow
        order={item}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <View style={styles.flex}>
      <Searchbar
        placeholder="Search orders\u2026"
        value={search}
        onChangeText={handleSearchChange}
        style={styles.searchbar}
        elevation={0}
      />
      <View style={styles.tabRow}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabBtn,
              statusFilter === tab.key && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setStatusFilter(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                statusFilter === tab.key && { color: theme.colors.primary, fontWeight: '700' },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Divider />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#C62828" />
          <Text style={styles.errorText}>Failed to load orders.</Text>
          <Button onPress={refetch} style={{ marginTop: 8 }}>Retry</Button>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={{ paddingVertical: 16 }} color={theme.colors.primary} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialCommunityIcons name="text-box-remove-outline" size={40} color="#94B4C1" />
              <Text style={styles.emptyText}>No orders found.</Text>
            </View>
          }
          contentContainerStyle={orders.length === 0 && styles.emptyContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchbar: { margin: 12, borderRadius: 10 },
  tabRow: { flexDirection: 'row' },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 13, color: '#666', fontWeight: '500' },
  row: { backgroundColor: '#fff' },
  rowMain: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  orderNum: { fontWeight: '700', marginBottom: 2 },
  customerName: { color: '#555', marginBottom: 2 },
  timeText: { color: '#999' },
  totalText: { fontWeight: '700', color: '#213448' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 48 },
  emptyContainer: { flex: 1 },
  emptyText: { color: '#888', fontSize: 15 },
  errorText: { color: '#B00020', fontSize: 15 },
});
