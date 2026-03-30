import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Divider,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePayOrder } from '../../hooks/useOrders';
import { formatCurrency } from '../../utils/currency';

const METHODS = [
  { key: 'cash',     label: 'Cash',     icon: 'cash' },
  { key: 'card',     label: 'Card',     icon: 'credit-card-outline' },
  { key: 'qris',     label: 'QRIS',     icon: 'qrcode-scan' },
  { key: 'transfer', label: 'Transfer', icon: 'bank-outline' },
];

/**
 * Props:
 *  visible   {boolean}
 *  order     {Order|null}
 *  onDismiss {() => void}
 *  onSuccess {(payment, order) => void}
 */
export default function PaymentSheet({ visible, order, onDismiss, onSuccess }) {
  const theme = useTheme();
  const [method, setMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const payMutation = usePayOrder();

  const total = parseFloat(order?.total_amount ?? 0);
  const paid  = parseFloat(amount) || 0;
  const change = paid - total;
  const isCash = method === 'cash';
  const needsRef = method === 'card' || method === 'qris' || method === 'transfer';

  // Auto-fill amount for cash
  useEffect(() => {
    if (visible && isCash) {
      setAmount(String(Math.ceil(total)));
    }
  }, [visible, method, total, isCash]);

  const handleConfirm = async () => {
    if (!amount || paid <= 0) {
      setSnackbar({ visible: true, message: 'Enter payment amount.' });
      return;
    }
    if (isCash && paid < total) {
      setSnackbar({ visible: true, message: 'Amount is less than total.' });
      return;
    }
    try {
      const payment = await payMutation.mutateAsync({
        id: order.id,
        data: {
          payment_method: method,
          amount: paid,
          reference_number: reference.trim() || undefined,
        },
      });
      onSuccess(payment, order);
      // reset
      setAmount('');
      setReference('');
      setMethod('cash');
    } catch (err) {
      setSnackbar({ visible: true, message: err?.message ?? 'Payment failed.' });
    }
  };

  const handleDismiss = () => {
    if (payMutation.isPending) return;
    setAmount('');
    setReference('');
    setMethod('cash');
    onDismiss();
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
          <View style={styles.handle} />

          <Text variant="titleLarge" style={styles.title}>
            Payment
          </Text>

          {/* Order total */}
          <View style={[styles.totalBox, { backgroundColor: theme.colors.secondaryContainer }]}>
            <Text variant="bodyMedium" style={styles.totalLabel}>Order Total</Text>
            <Text variant="headlineSmall" style={[styles.totalAmount, { color: theme.colors.secondary }]}>
              {formatCurrency(total)}
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Payment method */}
            <Text variant="labelLarge" style={styles.sectionLabel}>Payment Method</Text>
            <View style={styles.methodGrid}>
              {METHODS.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.methodBtn,
                    method === m.key && {
                      backgroundColor: theme.colors.primaryContainer,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  onPress={() => setMethod(m.key)}
                  activeOpacity={0.75}
                >
                  <MaterialCommunityIcons
                    name={m.icon}
                    size={24}
                    color={method === m.key ? theme.colors.primary : '#777'}
                  />
                  <Text
                    style={[
                      styles.methodLabel,
                      method === m.key && { color: theme.colors.primary, fontWeight: '700' },
                    ]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount */}
            <Text variant="labelLarge" style={styles.sectionLabel}>Amount</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder={formatCurrency(total)}
            />

            {/* Change (cash only) */}
            {isCash && paid > 0 && (
              <View style={[
                styles.changeBox,
                { backgroundColor: change >= 0 ? '#E8F5E9' : '#FFEBEE' },
              ]}>
                <Text variant="bodyMedium" style={{ color: '#555' }}>
                  {change >= 0 ? 'Change' : 'Short by'}
                </Text>
                <Text
                  variant="titleLarge"
                  style={{ fontWeight: '800', color: change >= 0 ? '#2E7D32' : '#C62828' }}
                >
                  {formatCurrency(Math.abs(change))}
                </Text>
              </View>
            )}

            {/* Reference (non-cash) */}
            {needsRef && (
              <>
                <Text variant="labelLarge" style={styles.sectionLabel}>Reference Number</Text>
                <TextInput
                  value={reference}
                  onChangeText={setReference}
                  mode="outlined"
                  style={styles.input}
                  placeholder="Optional transaction ref"
                  autoCapitalize="none"
                />
              </>
            )}

            <Divider style={{ marginVertical: 16 }} />

            <Button
              mode="contained"
              onPress={handleConfirm}
              loading={payMutation.isPending}
              disabled={payMutation.isPending}
              style={styles.confirmBtn}
              contentStyle={styles.confirmBtnContent}
              labelStyle={{ fontSize: 16, fontWeight: '700' }}
            >
              Confirm Payment
            </Button>

            <Button mode="outlined" onPress={handleDismiss} style={styles.cancelBtn}>
              Cancel
            </Button>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  totalBox: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: { color: '#555', marginBottom: 4 },
  totalAmount: { fontWeight: '800' },
  sectionLabel: {
    marginBottom: 8,
    marginTop: 4,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  methodGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  methodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    gap: 4,
  },
  methodLabel: { fontSize: 12, fontWeight: '500', color: '#444' },
  input: { marginBottom: 12 },
  changeBox: {
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmBtn: {
    borderRadius: 10,
    backgroundColor: '#547792',
    marginBottom: 10,
  },
  confirmBtnContent: { paddingVertical: 6 },
  cancelBtn: { borderRadius: 10 },
});
