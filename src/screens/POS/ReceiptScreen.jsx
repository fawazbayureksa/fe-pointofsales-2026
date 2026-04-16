import React from 'react';
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
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useOrder } from '../../hooks/useOrders';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

function buildReceiptHtml(order) {
  const items = (order.items ?? [])
    .map(
      (i) => `
      <tr>
        <td>${i.product_name}</td>
        <td style="text-align:center">${i.quantity}</td>
        <td style="text-align:right">${formatCurrency(parseFloat(i.unit_price))}</td>
        <td style="text-align:right">${formatCurrency(parseFloat(i.subtotal))}</td>
      </tr>`,
    )
    .join('');

  const payment = order.payments?.[0];

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: monospace; font-size: 13px; padding: 16px; }
    h2 { text-align: center; margin-bottom: 4px; }
    .sub { text-align: center; color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th, td { padding: 4px 2px; }
    th { border-bottom: 1px solid #000; }
    .total-row td { font-weight: bold; border-top: 1px solid #000; padding-top: 6px; }
    .footer { text-align: center; margin-top: 16px; color: #666; }
  </style>
</head>
<body>
  <h2>POS 2026</h2>
  <div class="sub">
    Order #${order.order_number}<br/>
    ${formatDate(order.created_at)}<br/>
    ${order.outlet?.name ?? ''}
  </div>
  ${order.customer ? `<div>Customer: ${order.customer.name}</div><br/>` : ''}
  <table>
    <thead>
      <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
    </thead>
    <tbody>${items}</tbody>
  </table>
  <table>
    <tbody>
      <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(parseFloat(order.subtotal))}</td></tr>
      <tr><td>Tax</td><td style="text-align:right">${formatCurrency(parseFloat(order.tax_amount))}</td></tr>
      <tr class="total-row"><td>TOTAL</td><td style="text-align:right">${formatCurrency(parseFloat(order.total_amount))}</td></tr>
    </tbody>
  </table>
  ${payment ? `<div>Payment: ${payment.payment_method.toUpperCase()}</div>
  <div>Paid: ${formatCurrency(parseFloat(payment.amount))}</div>
  ${parseFloat(payment.change_amount) > 0 ? `<div>Change: ${formatCurrency(parseFloat(payment.change_amount))}</div>` : ''}` : ''}
  <div class="footer">Thank you!</div>
</body>
</html>`;
}

export default function ReceiptScreen({ route, navigation }) {
  const theme = useTheme();
  const { orderId } = route.params;

  const { data: order, isLoading, isError } = useOrder(orderId);

  const handlePrint = async () => {
    if (!order) return;
    const html = buildReceiptHtml(order);
    await Print.printAsync({ html });
  };

  const handleNewSale = () => {
    // Navigate back to POS root
    navigation.navigate('POSMain');
  };

  const handleViewOrder = () => {
    navigation.navigate('OrderDetail', { orderId });
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
        <Text style={styles.errorText}>Failed to load receipt.</Text>
      </View>
    );
  }

  const payment = order.payments?.[0];

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: '#213448' }]}>
          <View style={styles.successCircle}>
            <MaterialCommunityIcons name="check" size={28} color="#fff" />
          </View>
          <Text variant="headlineSmall" style={styles.headerTitle}>Payment Complete</Text>
          <Text variant="bodyMedium" style={styles.headerSub}>
            #{order.order_number}
          </Text>
          <Text variant="bodySmall" style={styles.headerSub}>
            {formatDate(order.created_at)}
          </Text>
        </View>

        {/* Customer / outlet */}
        {(order.customer || order.outlet) && (
          <View style={styles.section}>
            {order.outlet && (
              <Text variant="bodyMedium">
                <Text style={styles.label}>Outlet: </Text>
                {order.outlet.name}
              </Text>
            )}
            {order.customer && (
              <Text variant="bodyMedium">
                <Text style={styles.label}>Customer: </Text>
                {order.customer.name}
              </Text>
            )}
          </View>
        )}

        <Divider />

        {/* Items */}
        <View style={styles.section}>
          <Text variant="labelLarge" style={styles.sectionTitle}>Items</Text>
          {order.items?.map((item) => (
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
            <Text
              variant="titleLarge"
              style={{ fontWeight: '800', color: '#213448' }}
            >
              {formatCurrency(parseFloat(order.total_amount))}
            </Text>
          </View>
        </View>

        <Divider />

        {/* Payment */}
        {payment && (
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.sectionTitle}>Payment</Text>
            <View style={styles.totalsRow}>
              <Text variant="bodyMedium" style={{ color: '#555' }}>Method</Text>
              <Text variant="bodyMedium" style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                {payment.payment_method}
              </Text>
            </View>
            <View style={styles.totalsRow}>
              <Text variant="bodyMedium" style={{ color: '#555' }}>Paid</Text>
              <Text variant="bodyMedium">{formatCurrency(parseFloat(payment.amount))}</Text>
            </View>
            {parseFloat(payment.change_amount) > 0 && (
              <View style={[styles.changeBox]}>
                <Text variant="bodyMedium" style={{ color: '#555' }}>Change</Text>
                <Text variant="titleMedium" style={{ fontWeight: '800', color: '#2E7D32' }}>
                  {formatCurrency(parseFloat(payment.change_amount))}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="contained"
            icon="printer"
            onPress={handlePrint}
            style={styles.actionBtn}
            contentStyle={styles.actionBtnContent}
          >
            Print Receipt
          </Button>
          <Button
            mode="contained"
            icon="plus-circle-outline"
            onPress={handleNewSale}
            style={[styles.actionBtn, { backgroundColor: '#213448' }]}
            contentStyle={styles.actionBtnContent}
          >
            New Sale
          </Button>
          <Button
            mode="outlined"
            icon="eye-outline"
            onPress={handleViewOrder}
            style={styles.actionBtn}
            contentStyle={styles.actionBtnContent}
          >
            View Order
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { paddingBottom: 32 },
  header: {
    padding: 24,
    alignItems: 'center',
    gap: 4,
  },
  successCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  headerTitle: { color: '#fff', fontWeight: '800' },
  headerSub: { color: 'rgba(255,255,255,0.75)' },
  section: { padding: 16 },
  sectionTitle: {
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  label: { fontWeight: '600' },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemLeft: { flex: 1 },
  itemSubtotal: { fontWeight: '600', minWidth: 80, textAlign: 'right' },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  changeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  actions: { paddingHorizontal: 16, gap: 10 },
  actionBtn: { borderRadius: 10, backgroundColor: '#547792' },
  actionBtnContent: { paddingVertical: 4 },
  errorText: { color: '#B00020', fontSize: 15 },
});
