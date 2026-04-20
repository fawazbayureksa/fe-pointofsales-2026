import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  Divider,
  useTheme,
  Button,
  Chip,
  IconButton,
  TextInput,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePaymentList, usePayment } from '../../hooks/usePayments';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

const METHOD_ICONS = {
  cash:     'cash',
  card:     'credit-card-outline',
  qris:     'qrcode-scan',
  transfer: 'bank-outline',
};

const STATUS_COLORS = {
  paid:    { bg: '#E8F5E9', text: '#2E7D32' },
  pending: { bg: '#FFF3E0', text: '#E65100' },
  failed:  { bg: '#FFEBEE', text: '#C62828' },
  refunded:{ bg: '#EDE7F6', text: '#6A1B9A' },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] ?? { bg: '#F5F5F5', text: '#555' };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>
        {(status ?? '').charAt(0).toUpperCase() + (status ?? '').slice(1)}
      </Text>
    </View>
  );
}

function PaymentRow({ payment, onPress }) {
  const icon = METHOD_ICONS[payment.payment_method] ?? 'cash';
  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(payment)} activeOpacity={0.7}>
      <View style={styles.rowMain}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={icon} size={22} color="#547792" />
        </View>
        <View style={styles.rowLeft}>
          <Text variant="bodyMedium" style={styles.orderNum}>
            {payment.order?.order_number ?? `#${payment.id}`}
          </Text>
          <Text variant="bodySmall" style={styles.meta}>
            {formatDate(payment.paid_at ?? payment.created_at)}
          </Text>
        </View>
        <View style={styles.rowRight}>
          <Text variant="titleSmall" style={styles.amount}>
            {formatCurrency(parseFloat(payment.amount))}
          </Text>
          <StatusBadge status={payment.status} />
        </View>
      </View>
      <Divider />
    </TouchableOpacity>
  );
}

function PaymentDetailOverlay({ paymentId, onClose }) {
  const theme = useTheme();
  const { data: payment, isLoading, isError } = usePayment(paymentId);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.overlaySheet}>
        <View style={styles.overlayHandle} />
        <Text variant="titleLarge" style={styles.overlayTitle}>Payment Detail</Text>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : isError || !payment ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>Failed to load payment.</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailSection}>
              <DetailRow label="Order #" value={payment.order?.order_number ?? '-'} />
              <DetailRow label="Method" value={(payment.payment_method ?? '').toUpperCase()} />
              <DetailRow label="Amount" value={formatCurrency(parseFloat(payment.amount))} />
              {parseFloat(payment.change_amount ?? 0) > 0 && (
                <DetailRow
                  label="Change"
                  value={formatCurrency(parseFloat(payment.change_amount))}
                />
              )}
              <DetailRow label="Status" value={payment.status} />
              <DetailRow label="Paid At" value={formatDate(payment.paid_at ?? payment.created_at)} />
              {payment.reference_number && (
                <DetailRow label="Reference" value={payment.reference_number} />
              )}
              {payment.order?.customer && (
                <DetailRow label="Customer" value={payment.order.customer.name} />
              )}
              {payment.cashier && (
                <DetailRow label="Cashier" value={payment.cashier.name} />
              )}
              {payment.order?.outlet && (
                <DetailRow label="Outlet" value={payment.order.outlet.name} />
              )}
            </View>

            {payment.order?.items?.length > 0 && (
              <>
                <Divider />
                <View style={styles.detailSection}>
                  <Text variant="labelLarge" style={styles.sectionTitle}>Items</Text>
                  {payment.order.items.map((item) => (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={styles.itemLeft}>
                        <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                          {item.product_name}
                        </Text>
                        <Text variant="bodySmall" style={{ color: '#666' }}>
                          {formatCurrency(parseFloat(item.unit_price))} × {item.quantity}
                        </Text>
                      </View>
                      <Text variant="bodyMedium" style={styles.itemSubtotal}>
                        {formatCurrency(parseFloat(item.subtotal))}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Button
              mode="contained"
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: '#547792' }]}
            >
              Close
            </Button>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text variant="bodyMedium" style={styles.detailLabel}>{label}</Text>
      <Text variant="bodyMedium" style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const FILTER_METHODS = [
  { key: '', label: 'All' },
  { key: 'cash', label: 'Cash' },
  { key: 'card', label: 'Card' },
  { key: 'qris', label: 'QRIS' },
  { key: 'transfer', label: 'Transfer' },
];

export default function PaymentHistoryScreen() {
  const theme = useTheme();
  const [methodFilter, setMethodFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({});
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const params = {
    ...(appliedFilters.payment_method ? { payment_method: appliedFilters.payment_method } : {}),
    ...(appliedFilters.date_from ? { date_from: appliedFilters.date_from } : {}),
    ...(appliedFilters.date_to ? { date_to: appliedFilters.date_to } : {}),
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
  } = usePaymentList(params);

  const payments = data?.pages.flatMap((p) => p.data ?? []) ?? [];

  const applyFilters = () => {
    setAppliedFilters({
      payment_method: methodFilter || undefined,
      date_from: dateFrom.trim() || undefined,
      date_to: dateTo.trim() || undefined,
    });
    setFiltersExpanded(false);
  };

  const clearFilters = () => {
    setMethodFilter('');
    setDateFrom('');
    setDateTo('');
    setAppliedFilters({});
  };

  const renderItem = useCallback(
    ({ item }) => (
      <PaymentRow payment={item} onPress={(p) => setSelectedPaymentId(p.id)} />
    ),
    [],
  );

  return (
    <View style={styles.flex}>
      {/* Filter toggle */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setFiltersExpanded((v) => !v)}
      >
        <MaterialCommunityIcons name="filter-variant" size={18} color="#547792" />
        <Text style={styles.filterToggleText}>Filters</Text>
        {Object.values(appliedFilters).some(Boolean) && (
          <View style={styles.filterDot} />
        )}
        <MaterialCommunityIcons
          name={filtersExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#888"
        />
      </TouchableOpacity>

      {filtersExpanded && (
        <View style={styles.filtersBox}>
          {/* Method chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.methodRow}>
            {FILTER_METHODS.map((m) => (
              <Chip
                key={m.key}
                selected={methodFilter === m.key}
                onPress={() => setMethodFilter(m.key)}
                style={{ marginRight: 6 }}
                compact
              >
                {m.label}
              </Chip>
            ))}
          </ScrollView>
          <TextInput
            label="Date From (YYYY-MM-DD)"
            value={dateFrom}
            onChangeText={setDateFrom}
            mode="outlined"
            style={styles.filterInput}
            dense
          />
          <TextInput
            label="Date To (YYYY-MM-DD)"
            value={dateTo}
            onChangeText={setDateTo}
            mode="outlined"
            style={styles.filterInput}
            dense
          />
          <View style={styles.filterActions}>
            <Button onPress={clearFilters} mode="outlined" compact>Clear</Button>
            <Button onPress={applyFilters} mode="contained" compact style={{ backgroundColor: '#547792' }}>
              Apply
            </Button>
          </View>
        </View>
      )}

      <Divider />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#C62828" />
          <Text style={styles.errorText}>Failed to load payments.</Text>
          <Button onPress={refetch} style={{ marginTop: 8 }}>Retry</Button>
        </View>
      ) : (
        <FlatList
          data={payments}
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
              <MaterialCommunityIcons name="cash-remove" size={40} color="#94B4C1" />
              <Text style={styles.emptyText}>No payments found.</Text>
            </View>
          }
          contentContainerStyle={payments.length === 0 && styles.emptyContainer}
        />
      )}

      {selectedPaymentId && (
        <PaymentDetailOverlay
          paymentId={selectedPaymentId}
          onClose={() => setSelectedPaymentId(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#fff',
  },
  filterToggleText: { flex: 1, fontSize: 14, color: '#333', fontWeight: '500' },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#547792',
  },
  filtersBox: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  methodRow: { marginBottom: 10, marginTop: 4 },
  filterInput: { marginBottom: 8 },
  filterActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  row: { backgroundColor: '#fff' },
  rowMain: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDF3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  orderNum: { fontWeight: '700', marginBottom: 2 },
  meta: { color: '#888' },
  amount: { fontWeight: '700', color: '#213448' },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 48 },
  emptyContainer: { flex: 1 },
  emptyText: { color: '#888', fontSize: 15, marginTop: 8 },
  errorText: { color: '#B00020', fontSize: 15 },
  // Overlay
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  overlaySheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  overlayHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  overlayTitle: { fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  detailSection: { padding: 16 },
  sectionTitle: {
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: { color: '#555', fontWeight: '600' },
  detailValue: { fontWeight: '500' },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemLeft: { flex: 1 },
  itemSubtotal: { fontWeight: '600', minWidth: 80, textAlign: 'right' },
  closeBtn: { marginHorizontal: 16, marginTop: 8, borderRadius: 10 },
});
