import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Button,
  Dialog,
  Portal,
  TextInput,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAllOutlets } from '../hooks/useOutlets';
import { useStartShift, useEndShift, useCurrentShift } from '../hooks/useShift';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';

/**
 * Shift banner shown in the POS header.
 * - No active shift → shows "Start Shift" CTA.
 * - Active shift → shows outlet name, started_at, starting_cash + "End Shift".
 *
 * Props:
 *   shift {object|null}
 *   loading {boolean}
 *   onShiftStarted(): void  – called after a shift is started
 *   onShiftEnded(summary): void  – called after a shift is ended
 */
export default function ShiftBanner({ shift, loading = false, onShiftStarted, onShiftEnded }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [startVisible, setStartVisible] = useState(false);
  const [endVisible, setEndVisible] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [shiftSummary, setShiftSummary] = useState(null);
  const [snackError, setSnackError] = useState('');

  // Start Shift form
  const [selectedOutletId, setSelectedOutletId] = useState(null);
  const [startingCash, setStartingCash] = useState('');
  const [startNotes, setStartNotes] = useState('');
  const [outletMenuVisible, setOutletMenuVisible] = useState(false);
  const [startErrors, setStartErrors] = useState({});

  // End Shift form
  const [endingCash, setEndingCash] = useState('');
  const [endNotes, setEndNotes] = useState('');
  const [endErrors, setEndErrors] = useState({});

  const { data: rawOutlets = [] } = useAllOutlets();
  const outlets = Array.isArray(rawOutlets) ? rawOutlets : (rawOutlets?.data ?? []);
  const startMutation = useStartShift();
  const endMutation = useEndShift();

  const openStartDialog = () => {
    setSelectedOutletId(outlets[0]?.id ?? null);
    setStartingCash('');
    setStartNotes('');
    setStartErrors({});
    setStartVisible(true);
  };

  const handleStartShift = async () => {
    const targetOutletId = selectedOutletId ?? outlets[0]?.id;
    if (!targetOutletId) {
      setStartErrors({ outlet_id: ['Please select an outlet.'] });
      return;
    }
    const cash = startingCash.trim() === '' ? 0 : parseFloat(startingCash);
    if (isNaN(cash) || cash < 0) {
      setStartErrors({ starting_cash: ['Please enter a valid starting cash amount.'] });
      return;
    }
    try {
      await startMutation.mutateAsync({
        outlet_id: targetOutletId,
        starting_cash: cash,
        notes: startNotes.trim() || undefined,
      });
      setStartVisible(false);
      if (onShiftStarted) onShiftStarted();
    } catch (err) {
      if (err?.errors) setStartErrors(err.errors);
      else setSnackError(err?.message ?? 'Failed to start shift.');
    }
  };

  const openEndDialog = () => {
    setEndingCash('');
    setEndNotes('');
    setEndErrors({});
    setEndVisible(true);
  };

  const handleEndShift = async () => {
    const cash = endingCash.trim() === '' ? 0 : parseFloat(endingCash);
    if (isNaN(cash) || cash < 0) {
      setEndErrors({ ending_cash: ['Please enter a valid ending cash amount.'] });
      return;
    }
    try {
      const result = await endMutation.mutateAsync({
        ending_cash: cash,
        notes: endNotes.trim() || undefined,
      });
      setEndVisible(false);
      const shiftObj = result?.shift ?? result;
      setShiftSummary(shiftObj);
      setSummaryVisible(true);
      if (onShiftEnded) onShiftEnded(shiftObj);
    } catch (err) {
      if (err?.errors) setEndErrors(err.errors);
      else setSnackError(err?.message ?? 'Failed to end shift.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingBanner, { backgroundColor: '#F1F5F9', paddingTop: insets.top + 8 }]}>
        <ActivityIndicator size="small" color="#547792" />
        <Text style={styles.loadingBannerText}>Checking shift status...</Text>
      </View>
    );
  }

  if (!shift) {
    return (
      <>
        <TouchableOpacity
          style={[styles.noShiftBanner, { backgroundColor: '#FFF3E0', paddingTop: insets.top + 10 }]}
          onPress={openStartDialog}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="clock-alert-outline" size={18} color="#E65100" />
          <Text style={styles.noShiftText}>No active shift — Tap to Start Shift</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color="#E65100" />
        </TouchableOpacity>

        <StartShiftDialog
          visible={startVisible}
          outlets={outlets}
          selectedOutletId={selectedOutletId ?? outlets[0]?.id}
          onSelectOutlet={setSelectedOutletId}
          startingCash={startingCash}
          onStartingCashChange={setStartingCash}
          notes={startNotes}
          onNotesChange={setStartNotes}
          errors={startErrors}
          loading={startMutation.isPending}
          onConfirm={handleStartShift}
          onDismiss={() => setStartVisible(false)}
        />

        <Portal>
          <Snackbar
            visible={!!snackError}
            onDismiss={() => setSnackError('')}
            duration={3000}
            action={{ label: 'OK', onPress: () => setSnackError('') }}
          >
            {snackError}
          </Snackbar>
        </Portal>
      </>
    );
  }

  return (
    <>
      <View style={[styles.banner, { backgroundColor: '#E8F5E9', paddingTop: insets.top + 8 }]}>
        <View style={styles.bannerLeft}>
          <MaterialCommunityIcons name="clock-check-outline" size={16} color="#2E7D32" />
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerOutlet}>{shift.outlet?.name ?? 'Shift Active'}</Text>
            <Text style={styles.bannerMeta}>
              Started {formatDate(shift.started_at)} · Cash: {formatCurrency(parseFloat(shift.starting_cash ?? 0))}
            </Text>
          </View>
        </View>
        <Button
          mode="outlined"
          compact
          textColor="#2E7D32"
          style={styles.endBtn}
          onPress={openEndDialog}
        >
          End Shift
        </Button>
      </View>

      <EndShiftDialog
        visible={endVisible}
        shift={shift}
        endingCash={endingCash}
        onEndingCashChange={setEndingCash}
        notes={endNotes}
        onNotesChange={setEndNotes}
        errors={endErrors}
        loading={endMutation.isPending}
        onConfirm={handleEndShift}
        onDismiss={() => setEndVisible(false)}
      />

      {/* Shift summary */}
      <Portal>
        <Dialog visible={summaryVisible} onDismiss={() => setSummaryVisible(false)}>
          <Dialog.Title>Shift Summary</Dialog.Title>
          <Dialog.Content>
            {shiftSummary && (
              <View style={styles.summaryContent}>
                <SummaryRow label="Outlet" value={shiftSummary.outlet?.name ?? '-'} />
                <SummaryRow label="Started" value={formatDate(shiftSummary.started_at)} />
                <SummaryRow label="Ended" value={formatDate(shiftSummary.ended_at)} />
                <SummaryRow
                  label="Starting Cash"
                  value={formatCurrency(parseFloat(shiftSummary.starting_cash ?? 0))}
                />
                <SummaryRow
                  label="Ending Cash"
                  value={formatCurrency(parseFloat(shiftSummary.ending_cash ?? 0))}
                />
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSummaryVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        <Snackbar
          visible={!!snackError}
          onDismiss={() => setSnackError('')}
          duration={3000}
          action={{ label: 'OK', onPress: () => setSnackError('') }}
        >
          {snackError}
        </Snackbar>
      </Portal>
    </>
  );
}

function SummaryRow({ label, value }) {
  return (
    <View style={styles.summaryRow}>
      <Text variant="bodyMedium" style={{ color: '#555', fontWeight: '600' }}>{label}</Text>
      <Text variant="bodyMedium">{value}</Text>
    </View>
  );
}

function StartShiftDialog({
  visible, outlets, selectedOutletId, onSelectOutlet,
  startingCash, onStartingCashChange,
  notes, onNotesChange,
  errors, loading, onConfirm, onDismiss,
}) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const selectedOutlet = outlets.find((o) => o.id === selectedOutletId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onDismiss} activeOpacity={1} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalWrapper}
      >
        <View style={styles.modalSheet}>
          <View style={styles.handle} />
          <Text variant="titleMedium" style={styles.modalTitle}>Start Shift</Text>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Outlet picker */}
            <Text variant="labelMedium" style={styles.fieldLabel}>Outlet</Text>
            <TouchableOpacity
              style={[styles.pickerBtn, errors.outlet_id && styles.pickerBtnError]}
              onPress={() => setMenuVisible(!menuVisible)}
            >
              <Text style={{ flex: 1, color: selectedOutlet ? '#213448' : '#999' }}>
                {selectedOutlet ? selectedOutlet.name : 'Select outlet…'}
              </Text>
              <MaterialCommunityIcons name={menuVisible ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
            </TouchableOpacity>
            {menuVisible && (
              <View style={styles.dropdownList}>
                <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                  {outlets.map((o) => (
                    <TouchableOpacity
                      key={o.id}
                      style={styles.dropdownItem}
                      onPress={() => { onSelectOutlet(o.id); setMenuVisible(false); }}
                    >
                      <Text style={[styles.dropdownItemText, o.id === selectedOutletId && { color: theme.colors.primary, fontWeight: '700' }]}>
                        {o.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            {errors.outlet_id ? <Text style={styles.fieldError}>{errors.outlet_id[0]}</Text> : null}

            {/* Starting cash */}
            <TextInput
              label="Starting Cash (Rp)"
              value={startingCash}
              onChangeText={onStartingCashChange}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.fieldInput}
              error={!!errors.starting_cash}
            />
            {errors.starting_cash ? <Text style={styles.fieldError}>{errors.starting_cash[0]}</Text> : null}

            {/* Notes */}
            <TextInput
              label="Notes (optional)"
              value={notes}
              onChangeText={onNotesChange}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.fieldInput}
            />

            <View style={styles.modalActions}>
              <Button onPress={onDismiss} disabled={loading} style={styles.actionBtn}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={onConfirm}
                loading={loading}
                disabled={loading}
                style={styles.actionBtn}
              >
                Start Shift
              </Button>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function EndShiftDialog({
  visible, shift, endingCash, onEndingCashChange,
  notes, onNotesChange,
  errors, loading, onConfirm, onDismiss,
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onDismiss} activeOpacity={1} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalWrapper}
      >
        <View style={styles.modalSheet}>
          <View style={styles.handle} />
          <Text variant="titleMedium" style={styles.modalTitle}>End Shift</Text>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {shift && (
              <View style={[styles.shiftInfoBox, { marginBottom: 16 }]}>
                <Text variant="bodySmall" style={{ color: '#555' }}>
                  Outlet: {shift.outlet?.name ?? '-'}
                </Text>
                <Text variant="bodySmall" style={{ color: '#555' }}>
                  Started: {formatDate(shift.started_at)}
                </Text>
                <Text variant="bodySmall" style={{ color: '#555' }}>
                  Starting Cash: {formatCurrency(parseFloat(shift.starting_cash ?? 0))}
                </Text>
              </View>
            )}

            <TextInput
              label="Ending Cash (Rp)"
              value={endingCash}
              onChangeText={onEndingCashChange}
              keyboardType="decimal-pad"
              mode="outlined"
              style={styles.fieldInput}
              error={!!errors.ending_cash}
            />
            {errors.ending_cash ? <Text style={styles.fieldError}>{errors.ending_cash[0]}</Text> : null}

            <TextInput
              label="Notes (optional)"
              value={notes}
              onChangeText={onNotesChange}
              mode="outlined"
              multiline
              numberOfLines={2}
              style={styles.fieldInput}
            />

            <View style={styles.modalActions}>
              <Button onPress={onDismiss} disabled={loading} style={styles.actionBtn}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={onConfirm}
                loading={loading}
                disabled={loading}
                style={styles.actionBtn}
              >
                End Shift
              </Button>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  noShiftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  noShiftText: { flex: 1, color: '#E65100', fontWeight: '600', fontSize: 13 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  bannerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerInfo: { flex: 1 },
  bannerOutlet: { fontSize: 13, fontWeight: '700', color: '#2E7D32' },
  bannerMeta: { fontSize: 11, color: '#555' },
  endBtn: { borderColor: '#2E7D32' },
  summaryContent: { gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldLabel: { marginBottom: 4, color: '#555', fontWeight: '600' },
  fieldInput: { marginBottom: 4, marginTop: 8 },
  fieldError: { color: '#B00020', fontSize: 12, marginBottom: 4 },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#94B4C1',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pickerBtnError: { borderColor: '#B00020' },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 4,
    backgroundColor: '#fff',
    elevation: 4,
    marginTop: 2,
    marginBottom: 4,
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  loadingBannerText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12 },
  dropdownItemText: { fontSize: 14, color: '#333' },
  shiftInfoBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
    color: '#213448',
  },
  scrollContent: {
    paddingBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  actionBtn: {
    minWidth: 100,
  },
});
