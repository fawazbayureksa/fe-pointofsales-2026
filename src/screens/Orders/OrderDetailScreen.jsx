import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Text,
  Button,
  Divider,
  ActivityIndicator,
  Dialog,
  Portal,
  TextInput,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { useOrder, useCancelOrder } from '../../hooks/useOrders';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import PaymentSheet from '../POS/PaymentSheet';

const STATUS_COLORS = {
  pending:   { bg: '#FFF3E0', text: '#E65100' },
  completed: { bg: '#E8F5E9', text: '#2E7D32' },
  cancelled: { bg: '#F5F5F5', text: '#757575' },
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

export default function OrderDetailScreen({ route, navigation }) {
  const theme = useTheme();
  const { orderId } = route.params;

  const { data: order, isLoading, isError, refetch } = useOrder(orderId);

  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const cancelMutation = useCancelOrder();

  const handlePaymentSuccess = () => {
    setPaymentSheetVisible(false);
    refetch();
    setSnackbar({ visible: true, message: 'Payment successful!' });
  };

  const handleCancelConfirm = async () => {
    try {
      await cancelMutation.mutateAsync({ id: orderId, reason: cancelReason.trim() || undefined });
      setCancelDialogVisible(false);
      setCancelReason('');
      refetch();
      setSnackbar({ visible: true, message: 'Order cancelled.' });
    } catch (err) {
      setSnackbar({ visible: true, message: err?.message ?? 'Cancel failed.' });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load order.</Text>
        <Button onPress={refetch} style={{ marginTop: 8 }}>Retry</Button>
      </View>
    );
  }

  const isPending = order.status === 'pending';

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: '#213448' }]}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {order.order_number}
          </Text>
          <View style={styles.headerRow}>
            <StatusBadge status={order.status} />
            <Text variant="bodySmall" style={styles.headerSub}>
              {formatDate(order.created_at)}
            </Text>
          </View>
        </View>

        {/* Meta */}
        <View style={styles.section}>
          {order.outlet && (
            <View style={styles.metaRow}>
              <Text variant="bodyMedium" style={styles.metaLabel}>Outlet</Text>
              <Text variant="bodyMedium">{order.outlet.name}</Text>
            </View>
          )}
          {order.customer && (
            <View style={styles.metaRow}>
              <Text variant="bodyMedium" style={styles.metaLabel}>Customer</Text>
              <Text variant="bodyMedium">{order.customer.name}</Text>
            </View>
          )}
          {order.cashier && (
            <View style={styles.metaRow}>
              <Text variant="bodyMedium" style={styles.metaLabel}>Cashier</Text>
              <Text variant="bodyMedium">{order.cashier.name}</Text>
            </View>
          )}
          {order.notes && (
            <View style={styles.metaRow}>
              <Text variant="bodyMedium" style={styles.metaLabel}>Notes</Text>
              <Text variant="bodyMedium" style={{ flex: 1, textAlign: 'right' }}>{order.notes}</Text>
            </View>
          )}
        </View>

        <Divider />

        {/* Items */}
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>Items</Text>
          {order.items?.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{item.product_name}</Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>
                  {formatCurrency(parseFloat(item.unit_price))} \u00d7 {item.quantity}
                  {parseFloat(item.discount_amount) > 0 &&
                    ` (disc ${formatCurrency(parseFloat(item.discount_amount))})`}
                </Text>
              </View>
              <Text variant="bodyMedium" style={styles.itemSubtotal}>
                {formatCurrency(parseFloat(item.subtotal))}
              </Text>
            </View>
          ))}
        </View>

        <Divider />

        {/* Totals */}
        <View style={styles.section}>
          <View style={styles.totalsRow}>
            <Text variant="bodyMedium" style={{ color: '#555' }}>Subtotal</Text>
            <Text variant="bodyMedium">{formatCurrency(parseFloat(order.subtotal))}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text variant="bodyMedium" style={{ color: '#555' }}>Tax</Text>
            <Text variant="bodyMedium">{formatCurrency(parseFloat(order.tax_amount))}</Text>
          </View>
          {parseFloat(order.discount_amount) > 0 && (
            <View style={styles.totalsRow}>
              <Text variant="bodyMedium" style={{ color: '#E05A00' }}>Discount</Text>
              <Text variant="bodyMedium" style={{ color: '#E05A00' }}>
                -{formatCurrency(parseFloat(order.discount_amount))}
              </Text>
            </View>
          )}
          <Divider style={{ marginVertical: 8 }} />
          <View style={styles.totalsRow}>
            <Text variant="titleMedium" style={{ fontWeight: '700' }}>Total</Text>
            <Text variant="titleLarge" style={{ fontWeight: '800', color: '#213448' }}>
              {formatCurrency(parseFloat(order.total_amount))}
            </Text>
          </View>
        </View>

        {/* Payments */}
        {order.payments?.length > 0 && (
          <>
            <Divider />
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionTitle}>Payments</Text>
              {order.payments.map((pmt) => (
                <View key={pmt.id} style={styles.paymentRow}>
                  <View>
                    <Text variant="bodyMedium" style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                      {pmt.payment_method}
                    </Text>
                    <Text variant="bodySmall" style={{ color: '#999' }}>
                      {formatDate(pmt.paid_at)}
                    </Text>
                    {pmt.reference_number && (
                      <Text variant="bodySmall" style={{ color: '#777' }}>Ref: {pmt.reference_number}</Text>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text variant="bodyMedium">{formatCurrency(parseFloat(pmt.amount))}</Text>
                    {parseFloat(pmt.change_amount) > 0 && (
                      <Text variant="bodySmall" style={{ color: '#2E7D32' }}>
                        Change: {formatCurrency(parseFloat(pmt.change_amount))}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Actions for pending orders */}
        {isPending && (
          <>
            <Divider />
            <View style={styles.actions}>
              <Button
                mode="contained"
                icon="cash"
                onPress={() => setPaymentSheetVisible(true)}
                style={[styles.actionBtn, { backgroundColor: '#547792' }]}
                contentStyle={styles.actionBtnContent}
              >
                Pay Now
              </Button>
              <Button
                mode="outlined"
                icon="close-circle-outline"
                onPress={() => setCancelDialogVisible(true)}
                style={styles.actionBtn}
                textColor={theme.colors.error}
              >
                Cancel Order
              </Button>
            </View>
          </>
        )}
      </ScrollView>

      {/* Payment sheet */}
      <PaymentSheet
        visible={paymentSheetVisible}
        order={order}
        onDismiss={() => setPaymentSheetVisible(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Cancel dialog */}
      <Portal>
        <Dialog
          visible={cancelDialogVisible}
          onDismiss={() => { setCancelDialogVisible(false); setCancelReason(''); }}
        >
          <Dialog.Title>Cancel Order</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 12 }}>
              Are you sure you want to cancel this order?
            </Text>
            <TextInput
              label="Reason (optional)"
              value={cancelReason}
              onChangeText={setCancelReason}
              mode="outlined"
              multiline
              numberOfLines={2}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setCancelDialogVisible(false); setCancelReason(''); }}>
              Back
            </Button>
            <Button
              textColor={theme.colors.error}
              loading={cancelMutation.isPending}
              onPress={handleCancelConfirm}
            >
              Cancel Order
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { paddingBottom: 32 },
  header: { padding: 20, alignItems: 'center', gap: 8 },
  headerTitle: { color: '#fff', fontWeight: '800' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerSub: { color: 'rgba(255,255,255,0.7)' },
  section: { padding: 16 },
  sectionTitle: {
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaLabel: { color: '#555', fontWeight: '600' },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemLeft: { flex: 1, marginRight: 12 },
  itemSubtotal: { fontWeight: '600', minWidth: 80, textAlign: 'right' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  badge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  actions: { padding: 16, gap: 10 },
  actionBtn: { borderRadius: 10 },
  actionBtnContent: { paddingVertical: 4 },
  errorText: { color: '#B00020', fontSize: 15 },
});
