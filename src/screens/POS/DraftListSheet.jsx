import React, { useMemo, forwardRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import {
  BottomSheetModal,
  BottomSheetFlatList,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useDraftStore from '../../store/draftStore';
import { formatDate } from '../../utils/date';

const DraftListSheet = forwardRef(function DraftListSheet(_props, ref) {
  const snapPoints = useMemo(() => ['50%', '80%'], []);
  const { drafts, restoreDraft, deleteDraft } = useDraftStore();

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} />
    ),
    [],
  );

  const handleRestore = useCallback(
    (id) => {
      restoreDraft(id);
      ref.current?.dismiss();
    },
    [restoreDraft, ref],
  );

  const renderRightActions = useCallback(
    (id) => (
      <TouchableOpacity style={styles.deleteAction} onPress={() => deleteDraft(id)}>
        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#fff" />
        <Text style={styles.deleteActionText}>Delete</Text>
      </TouchableOpacity>
    ),
    [deleteDraft],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <Swipeable renderRightActions={() => renderRightActions(item.id)} overshootRight={false}>
        <TouchableOpacity style={styles.draftItem} onPress={() => handleRestore(item.id)} activeOpacity={0.8}>
          <View style={styles.draftIconWrap}>
            <MaterialCommunityIcons name="pause-circle-outline" size={26} color="#547792" />
          </View>
          <View style={styles.draftInfo}>
            <Text variant="bodyMedium" style={styles.draftLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text variant="bodySmall" style={styles.draftMeta}>
              {item.cart.reduce((s, i) => s + i.quantity, 0)} item
              {item.cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''} ·{' '}
              {formatDate(item.savedAt, 'HH:mm, dd/MM')}
            </Text>
            {item.customerName && (
              <Text variant="bodySmall" style={styles.draftCustomer}>
                {item.customerName}
              </Text>
            )}
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#94B4C1" />
        </TouchableOpacity>
      </Swipeable>
    ),
    [handleRestore, renderRightActions],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.sheetBg}
    >
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.title}>
          Saved Drafts
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          Tap to restore · Swipe left to delete
        </Text>
      </View>

      {drafts.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="inbox-outline" size={52} color="#94B4C1" />
          <Text style={styles.emptyText}>No saved drafts</Text>
          <Text style={styles.emptyHint}>Carts you put on hold will appear here.</Text>
        </View>
      ) : (
        <BottomSheetFlatList
          data={drafts}
          keyExtractor={(d) => d.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </BottomSheetModal>
  );
});

export default DraftListSheet;

const styles = StyleSheet.create({
  handle: { backgroundColor: '#CBD5E1', width: 40, height: 4 },
  sheetBg: { backgroundColor: '#fff', borderRadius: 24 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: { fontWeight: '700', color: '#213448' },
  subtitle: { color: '#94A3B8', marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#555' },
  emptyHint: { fontSize: 13, color: '#94A3B8' },
  draftItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  draftIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftInfo: { flex: 1 },
  draftLabel: { fontWeight: '700', color: '#213448' },
  draftMeta: { color: '#64748B', marginTop: 1 },
  draftCustomer: { color: '#547792', marginTop: 1 },
  deleteAction: {
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 4,
  },
  deleteActionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
