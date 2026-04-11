import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Modal,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  ActivityIndicator,
  Divider,
  FAB,
  Button,
  TextInput,
  Snackbar,
  useTheme,
  Chip,
  Searchbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStockMovements, useAdjustStock } from '../../hooks/useStock';
import { useAllOutlets } from '../../hooks/useOutlets';
import { useProductList } from '../../hooks/useProducts';
import { formatDate } from '../../utils/date';

const TYPE_CONFIG = {
  adjustment:    { bg: '#E3F2FD', text: '#1565C0', label: 'Adjustment' },
  sale:          { bg: '#FFEBEE', text: '#C62828', label: 'Sale' },
  return:        { bg: '#E8F5E9', text: '#2E7D32', label: 'Return' },
  transfer_in:   { bg: '#E0F2F1', text: '#00695C', label: 'Transfer In' },
  transfer_out:  { bg: '#FFF3E0', text: '#E65100', label: 'Transfer Out' },
};

function TypeBadge({ type }) {
  const c = TYPE_CONFIG[type] ?? { bg: '#F5F5F5', text: '#555', label: type };
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{c.label}</Text>
    </View>
  );
}

function MovementRow({ item }) {
  const change = item.quantity_change ?? (item.quantity_after - item.quantity_before);
  const isNeg = change < 0;
  return (
    <View style={styles.movRow}>
      <View style={styles.movLeft}>
        <Text variant="bodyMedium" style={styles.prodName} numberOfLines={1}>
          {item.product?.name ?? item.product_name ?? '-'}
        </Text>
        <Text variant="bodySmall" style={styles.movMeta}>
          {item.product?.sku ? `SKU: ${item.product.sku} · ` : ''}{item.outlet?.name ?? ''}
        </Text>
        <Text variant="bodySmall" style={styles.movMeta}>
          {item.reason ? item.reason : ''} · {item.user?.name ?? ''} · {formatDate(item.created_at)}
        </Text>
      </View>
      <View style={styles.movRight}>
        <TypeBadge type={item.type} />
        <Text
          variant="bodyMedium"
          style={[styles.changeText, { color: isNeg ? '#C62828' : '#2E7D32' }]}
        >
          {isNeg ? change : `+${change}`}
        </Text>
        <Text variant="bodySmall" style={{ color: '#888' }}>
          {item.quantity_before} → {item.quantity_after}
        </Text>
      </View>
    </View>
  );
}

function StockAdjustModal({ visible, onDismiss, onSuccess }) {
  const theme = useTheme();
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOutletId, setSelectedOutletId] = useState(null);
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});
  const [productListVisible, setProductListVisible] = useState(false);

  const { data: prodData } = useProductList({
    search: productSearch || undefined,
    outlet_id: selectedOutletId || undefined,
  });
  const products = prodData?.pages.flatMap((p) => p.data ?? []) ?? [];

  const { data: outlets = [] } = useAllOutlets();

  const adjustMutation = useAdjustStock();

  const handleSubmit = async () => {
    setErrors({});
    if (!selectedProduct) {
      setErrors({ product_id: ['Please select a product.'] });
      return;
    }
    if (!selectedOutletId) {
      setErrors({ outlet_id: ['Please select an outlet.'] });
      return;
    }
    const qty = parseInt(quantityChange, 10);
    if (isNaN(qty) || qty === 0) {
      setErrors({ quantity_change: ['Please enter a non-zero adjustment.'] });
      return;
    }
    try {
      await adjustMutation.mutateAsync({
        product_id: selectedProduct.id,
        outlet_id: selectedOutletId,
        quantity_change: qty,
        reason: reason.trim() || undefined,
      });
      onSuccess();
      handleClose();
    } catch (err) {
      if (err?.errors) setErrors(err.errors);
      else setErrors({ quantity_change: [err?.message ?? 'Adjustment failed.'] });
    }
  };

  const handleClose = () => {
    setProductSearch('');
    setSelectedProduct(null);
    setSelectedOutletId(null);
    setQuantityChange('');
    setReason('');
    setErrors({});
    setProductListVisible(false);
    onDismiss();
  };

  const selectedOutlet = outlets.find((o) => o.id === selectedOutletId);
  const qtyNum = parseInt(quantityChange, 10);
  const currentStock = selectedProduct?.stock ?? 0;
  const newStock = !isNaN(qtyNum) ? currentStock + qtyNum : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={handleClose} activeOpacity={1} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalWrapper}
      >
        <View style={styles.modalSheet}>
          <View style={styles.handle} />
          <Text variant="titleLarge" style={styles.modalTitle}>Adjust Stock</Text>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Outlet — must be selected first */}
            <Text variant="labelMedium" style={styles.fieldLabel}>Outlet *</Text>
            <View style={styles.optionRow}>
              {outlets.map((o) => (
                <TouchableOpacity
                  key={o.id}
                  style={[
                    styles.optionBtn,
                    selectedOutletId === o.id && styles.optionBtnActive,
                  ]}
                  onPress={() => {
                    if (selectedOutletId !== o.id) {
                      setSelectedOutletId(o.id);
                      setSelectedProduct(null);
                      setProductSearch('');
                      setProductListVisible(false);
                    }
                  }}
                >
                  <Text style={[styles.optionText, selectedOutletId === o.id && styles.optionTextActive]}>
                    {o.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.outlet_id && <Text style={styles.fieldError}>{errors.outlet_id[0]}</Text>}

            {/* Product search — only after outlet is chosen */}
            <Text variant="labelMedium" style={[styles.fieldLabel, { marginTop: 12 }]}>Product *</Text>
            {!selectedOutletId ? (
              <View style={styles.productGate}>
                <MaterialCommunityIcons name="store-outline" size={18} color="#94B4C1" />
                <Text variant="bodySmall" style={styles.productGateText}>
                  Select an outlet above to search products
                </Text>
              </View>
            ) : (
              <>
            <Searchbar
              placeholder="Search product…"
              value={productSearch}
              onChangeText={(t) => {
                setProductSearch(t);
                setSelectedProduct(null);
                setProductListVisible(true);
              }}
              onFocus={() => setProductListVisible(true)}
              style={styles.productSearch}
            />
            {selectedProduct && (
              <View style={styles.selectedProductCard}>
                <View style={styles.selectedProductAccent} />
                <View style={styles.selectedProductIcon}>
                  <MaterialCommunityIcons name="package-variant-closed" size={22} color="#547792" />
                </View>
                <View style={styles.selectedProductInfo}>
                  <Text variant="bodyMedium" style={styles.selectedProductName} numberOfLines={1}>
                    {selectedProduct.name}
                  </Text>
                  {selectedProduct.sku ? (
                    <Text variant="bodySmall" style={styles.selectedProductSku}>
                      SKU: {selectedProduct.sku}
                    </Text>
                  ) : null}
                </View>
                <View style={styles.selectedProductStockBadge}>
                  <Text style={styles.selectedProductStockLabel}>Stock</Text>
                  <Text style={styles.selectedProductStockValue}>{currentStock}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedProduct(null);
                    setProductSearch('');
                    setProductListVisible(false);
                  }}
                  style={styles.selectedProductClear}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="close-circle" size={18} color="#94B4C1" />
                </TouchableOpacity>
              </View>
            )}
            {productListVisible && products.length > 0 && !selectedProduct && (
              <View style={styles.productDropdown}>
                {products.slice(0, 8).map((p, index) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.productDropdownItem,
                      index === products.slice(0, 8).length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => {
                      setSelectedProduct(p);
                      setProductSearch(p.name);
                      setProductListVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dropdownItemIcon}>
                      <MaterialCommunityIcons name="cube-outline" size={18} color="#547792" />
                    </View>
                    <View style={styles.dropdownItemInfo}>
                      <Text variant="bodyMedium" numberOfLines={1} style={styles.dropdownItemName}>
                        {p.name}
                      </Text>
                      {p.sku ? (
                        <Text variant="bodySmall" style={styles.dropdownItemSku}>
                          {p.sku}
                        </Text>
                      ) : null}
                    </View>
                    {p.stock != null && (
                      <View style={styles.dropdownStockChip}>
                        <Text style={styles.dropdownStockText}>{p.stock}</Text>
                      </View>
                    )}
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#CCC" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.product_id && (
              <Text style={styles.fieldError}>{errors.product_id[0]}</Text>
            )}
              </>
            )}

            {/* Adjustment */}
            <TextInput
              label="Adjustment (+ add / - remove)"
              value={quantityChange}
              onChangeText={setQuantityChange}
              mode="outlined"
              keyboardType="numbers-and-punctuation"
              style={styles.fieldInput}
              error={!!errors.quantity_change}
            />
            {newStock !== null && selectedProduct && (
              <Text variant="bodySmall" style={styles.stockHelper}>
                Current: {currentStock} → New stock: {newStock}
              </Text>
            )}
            {errors.quantity_change && (
              <Text style={styles.fieldError}>{errors.quantity_change[0]}</Text>
            )}

            {/* Reason */}
            <TextInput
              label="Reason (optional)"
              value={reason}
              onChangeText={setReason}
              mode="outlined"
              style={styles.fieldInput}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={adjustMutation.isPending}
              disabled={adjustMutation.isPending}
              style={[styles.submitBtn, { backgroundColor: '#547792' }]}
              contentStyle={styles.submitContent}
              labelStyle={{ fontWeight: '700', fontSize: 15 }}
            >
              Submit Adjustment
            </Button>
            <Button mode="outlined" onPress={handleClose} style={styles.cancelBtn}>
              Cancel
            </Button>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function StockScreen() {
  const theme = useTheme();
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useStockMovements({});

  const movements = data?.pages.flatMap((p) => p.data ?? []) ?? [];

  const renderItem = useCallback(
    ({ item }) => <MovementRow item={item} />,
    [],
  );

  return (
    <View style={styles.flex}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#C62828" />
          <Text style={styles.errorText}>Failed to load stock movements.</Text>
          <Button onPress={refetch} style={{ marginTop: 8 }}>Retry</Button>
        </View>
      ) : (
        <FlatList
          data={movements}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <Divider />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
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
              <MaterialCommunityIcons name="package-variant-closed-remove" size={40} color="#94B4C1" />
              <Text style={styles.emptyText}>No stock movements.</Text>
            </View>
          }
          contentContainerStyle={movements.length === 0 && styles.emptyContainer}
        />
      )}

      <FAB
        icon="plus"
        label="Adjust Stock"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => setAdjustModalVisible(true)}
      />

      <StockAdjustModal
        visible={adjustModalVisible}
        onDismiss={() => setAdjustModalVisible(false)}
        onSuccess={() => {
          refetch();
          setSnackbar({ visible: true, message: 'Stock adjusted successfully.' });
        }}
      />

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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 48 },
  emptyContainer: { flex: 1 },
  emptyText: { color: '#888', fontSize: 15, marginTop: 8 },
  errorText: { color: '#B00020', fontSize: 15 },
  movRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    gap: 12,
    alignItems: 'flex-start',
  },
  movLeft: { flex: 1 },
  movRight: { alignItems: 'flex-end', gap: 4 },
  prodName: { fontWeight: '700', marginBottom: 2 },
  movMeta: { color: '#888', fontSize: 11 },
  changeText: { fontWeight: '800', fontSize: 16 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  fab: { position: 'absolute', right: 16, bottom: 24 },
  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  modalSheet: {
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
  modalTitle: { fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  fieldLabel: { color: '#555', fontWeight: '600', marginBottom: 6 },
  fieldInput: { marginBottom: 4, marginTop: 8 },
  fieldError: { color: '#B00020', fontSize: 12, marginBottom: 4 },
  productSearch: { marginBottom: 6 },
  productGate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F8FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDE6EC',
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 4,
  },
  productGateText: { color: '#94B4C1', fontStyle: 'italic' },
  selectedProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F6FA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#94B4C1',
    marginBottom: 4,
    overflow: 'hidden',
    gap: 10,
    paddingRight: 12,
    paddingVertical: 12,
  },
  selectedProductAccent: {
    width: 4,
    alignSelf: 'stretch',
    backgroundColor: '#547792',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  selectedProductIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D6E8F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedProductInfo: { flex: 1, justifyContent: 'center' },
  selectedProductName: { color: '#213448', fontWeight: '700', fontSize: 13 },
  selectedProductSku: { color: '#94B4C1', fontSize: 11, marginTop: 1 },
  selectedProductStockBadge: {
    alignItems: 'center',
    backgroundColor: '#547792',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    minWidth: 44,
  },
  selectedProductStockLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  selectedProductStockValue: { color: '#fff', fontSize: 14, fontWeight: '800' },
  selectedProductClear: { marginLeft: 4 },
  productDropdown: {
    borderWidth: 1,
    borderColor: '#DDE6EC',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 4,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#547792',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  productDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEF3F6',
  },
  dropdownItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EDF3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemInfo: { flex: 1 },
  dropdownItemName: { color: '#213448', fontWeight: '600', fontSize: 13 },
  dropdownItemSku: { color: '#94B4C1', fontSize: 11, marginTop: 1 },
  dropdownStockChip: {
    backgroundColor: '#EDF3F7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#94B4C1',
  },
  dropdownStockText: { color: '#547792', fontSize: 11, fontWeight: '700' },
  stockHelper: { color: '#547792', marginBottom: 4, fontWeight: '600' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  optionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#94B4C1',
    backgroundColor: '#F5F5F5',
  },
  optionBtnActive: { backgroundColor: '#547792', borderColor: '#547792' },
  optionText: { fontSize: 13, color: '#333', fontWeight: '500' },
  optionTextActive: { color: '#fff', fontWeight: '700' },
  submitBtn: { marginTop: 16, borderRadius: 10 },
  submitContent: { paddingVertical: 6 },
  cancelBtn: { marginTop: 8, borderRadius: 10 },
});
