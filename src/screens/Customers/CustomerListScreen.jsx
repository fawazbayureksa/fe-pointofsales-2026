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
  Chip,
  ActivityIndicator,
  Divider,
  useTheme,
  Button,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCustomerList } from '../../hooks/useCustomers';

const TIER_COLORS = {
  Regular:  { bg: '#F5F5F5', text: '#555' },
  Silver:   { bg: '#ECEFF1', text: '#455A64' },
  Gold:     { bg: '#FFF8E1', text: '#F57F17' },
  Platinum: { bg: '#EDE7F6', text: '#6A1B9A' },
};

function MembershipBadge({ tier }) {
  if (!tier) return null;
  const c = TIER_COLORS[tier] ?? { bg: '#F5F5F5', text: '#555' };
  return (
    <Chip
      compact
      style={{ backgroundColor: c.bg, marginTop: 2 }}
      textStyle={{ color: c.text, fontSize: 10, fontWeight: '700' }}
    >
      {tier}
    </Chip>
  );
}

function CustomerRow({ customer, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(customer)} activeOpacity={0.7}>
      <View style={styles.rowMain}>
        <View style={styles.rowLeft}>
          <Text variant="bodyMedium" style={styles.name}>{customer.name}</Text>
          <Text variant="bodySmall" style={styles.phone}>{customer.phone ?? customer.email ?? '-'}</Text>
          {customer.loyalty_points > 0 && (
            <Text variant="bodySmall" style={styles.points}>
              {Number(customer.loyalty_points).toLocaleString('id-ID')} pts
            </Text>
          )}
        </View>
        <View style={styles.rowRight}>
          <MembershipBadge tier={customer.membership_tier} />
          {customer.member_since && (
            <MaterialCommunityIcons name="card-account-details-outline" size={16} color="#547792" />
          )}
        </View>
      </View>
      <Divider />
    </TouchableOpacity>
  );
}

const DEBOUNCE_MS = 400;

export default function CustomerListScreen({ navigation }) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const debounceRef = useRef(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useCustomerList(appliedSearch ? { search: appliedSearch } : {});

  const customers = data?.pages.flatMap((p) => p.data ?? []) ?? [];

  const handleSearchChange = useCallback((text) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setAppliedSearch(text), DEBOUNCE_MS);
  }, []);

  const renderItem = useCallback(
    ({ item }) => (
      <CustomerRow
        customer={item}
        onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
      />
    ),
    [navigation],
  );

  return (
    <View style={styles.flex}>
      <Searchbar
        placeholder="Search customers…"
        value={search}
        onChangeText={handleSearchChange}
        style={styles.searchbar}
        elevation={0}
      />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#C62828" />
          <Text style={styles.errorText}>Failed to load customers.</Text>
          <Button onPress={refetch} style={{ marginTop: 8 }}>Retry</Button>
        </View>
      ) : (
        <FlatList
          data={customers}
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
              <MaterialCommunityIcons name="account-off-outline" size={40} color="#94B4C1" />
              <Text style={styles.emptyText}>No customers found.</Text>
            </View>
          }
          contentContainerStyle={customers.length === 0 && styles.emptyContainer}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => navigation.navigate('CustomerForm', {})}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchbar: { margin: 12, borderRadius: 10 },
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
  name: { fontWeight: '700', marginBottom: 2 },
  phone: { color: '#555', marginBottom: 2 },
  points: { color: '#547792', fontSize: 12, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 48 },
  emptyContainer: { flex: 1 },
  emptyText: { color: '#888', fontSize: 15, marginTop: 8 },
  errorText: { color: '#B00020', fontSize: 15 },
  fab: { position: 'absolute', right: 16, bottom: 24 },
});
