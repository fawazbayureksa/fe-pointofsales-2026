import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Searchbar,
  Chip,
  Button,
  Badge,
  Snackbar,
  useTheme,
  TextInput,
  Portal,
  Dialog,
  SegmentedButtons,
} from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProductList } from '../../hooks/useProducts';
import { useAllCategories } from '../../hooks/useCategories';
import { useCreateOrder } from '../../hooks/useOrders';
import { useCurrentShift } from '../../hooks/useShift';
import useCartStore from '../../store/cartStore';
import useDraftStore from '../../store/draftStore';
import useShiftStore from '../../store/shiftStore';
import { resolveImageUrl } from '../../utils/image';
import { formatCurrency } from '../../utils/currency';
import { getProductByBarcode } from '../../api/products';
import PaymentSheet from './PaymentSheet';
import DraftListSheet from './DraftListSheet';
import BarcodeScannerModal from './BarcodeScannerModal';
import SupervisorAuthDialog from '../../components/SupervisorAuthDialog';
import ShiftBanner from '../../components/ShiftBanner';
import CartPanel from './CartPanel';

const DEBOUNCE_MS = 400;

// ── ProductCard ───────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd, onLongPress, isPinned }) {
  const theme = useTheme();
  const imgUri = resolveImageUrl(product.image);
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onAdd(product)}
      onLongPress={() => onLongPress(product)}
      activeOpacity={0.75}
      delayLongPress={400}
    >
      {imgUri ? (
        <Image source={{ uri: imgUri }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <MaterialCommunityIcons name="package-variant" size={28} color="#94B4C1" />
        </View>
      )}
      {isPinned && (
        <View style={styles.pinnedBadge}>
          <Text style={styles.pinnedStar}>{'★'}</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text variant="bodySmall" numberOfLines={2} style={styles.cardName}>
          {product.name}
        </Text>
        <Text variant="labelMedium" style={[styles.cardPrice, { color: theme.colors.primary }]}>
          {formatCurrency(parseFloat(product.price))}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── PinnedProductRow ──────────────────────────────────────────────────────────
function PinnedProductRow({ pinnedIds, products, onAdd, onUnpin }) {
  const pinned = pinnedIds.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  if (pinned.length === 0) return null;
  return (
    <View style={styles.pinnedRow}>
      <Text variant="labelSmall" style={styles.pinnedTitle}>Favourites</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pinnedScrollContent}
      >
        {pinned.map((p) => {
          const imgUri = resolveImageUrl(p.image);
          return (
            <TouchableOpacity
              key={p.id}
              style={styles.pinnedCard}
              onPress={() => onAdd(p)}
              onLongPress={() => onUnpin(p)}
              activeOpacity={0.8}
              delayLongPress={400}
            >
              {imgUri ? (
                <Image source={{ uri: imgUri }} style={styles.pinnedImg} resizeMode="cover" />
              ) : (
                <View style={[styles.pinnedImg, styles.pinnedImgPlaceholder]}>
                  <MaterialCommunityIcons name="package-variant" size={18} color="#94B4C1" />
                </View>
              )}
              <Text variant="labelSmall" numberOfLines={1} style={styles.pinnedName}>{p.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── POSScreen ─────────────────────────────────────────────────────────────────
export default function POSScreen({ navigation }) {
  const theme = useTheme();
  const [panel, setPanel] = useState('products');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [pinnedIds, setPinnedIds] = useState([]);
  const outletIdRef = useRef(null);
  const debounceRef = useRef(null);
  const draftSheetRef = useRef(null);

  // Barcode
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  // Customer
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Loyalty
  const [useLoyalty, setUseLoyalty] = useState(false);
  const [loyaltyInput, setLoyaltyInput] = useState('');

  // Order-level discount (supervisor-gated)
  const [discountSupervisorVisible, setDiscountSupervisorVisible] = useState(false);
  const [discountDialogVisible, setDiscountDialogVisible] = useState(false);
  const [discountType, setDiscountType] = useState('fixed');
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountSupervisorId, setDiscountSupervisorId] = useState(null);
  const [appliedDiscount, setAppliedDiscount] = useState(null);

  // Shift
  const shift = useShiftStore((s) => s.shift);
  const isShiftInitialized = useShiftStore((s) => s.isInitialized);
  useCurrentShift(); // initialize shift state

  const {
    items,
    outletId,
    customerId,
    customerName,
    addItem,
    clearCart,
    setCustomer,
    setOutlet,
  } = useCartStore();

  // Sync outletId with active shift
  useEffect(() => {
    const shiftOutletId = shift?.outlet_id ?? shift?.outlet?.id;
    if (shiftOutletId) {
      setOutlet(shiftOutletId);
    }
  }, [shift, setOutlet]);

  const { drafts, saveDraft } = useDraftStore();

  const subtotal = items.reduce(
    (sum, i) => sum + i.price * i.quantity - (i.discount_amount || 0),
    0,
  );
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const discountValue = (() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.type === 'percentage') return (subtotal * appliedDiscount.amount) / 100;
    return appliedDiscount.amount;
  })();

  const loyaltyPoints = parseInt(loyaltyInput, 10) || 0;
  const maxLoyalty = Math.min(selectedCustomer?.loyalty_points ?? 0, subtotal - discountValue);
  const loyaltyRedeemed = useLoyalty && selectedCustomer ? Math.min(loyaltyPoints, maxLoyalty) : 0;

  const {
    data: prodData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: prodLoading,
    refetch: refetchProducts,
    isFetching: isFetchingProducts,
  } = useProductList({
    search: appliedSearch || undefined,
    category: selectedCategory ?? undefined,
    is_active: true,
  });
  const products = prodData?.pages.flatMap((p) => p.data ?? []) ?? [];

  const { data: categories = [] } = useAllCategories();

  // Load pinned products for current outlet
  useEffect(() => {
    outletIdRef.current = outletId;
    AsyncStorage.getItem(`pinned_products_${outletId}`).then((raw) => {
      if (raw) {
        try {
          setPinnedIds(JSON.parse(raw));
        } catch (_) {}
      }
    });
  }, [outletId]);

  const handleTogglePin = useCallback((product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPinnedIds((prev) => {
      const ids = prev.includes(product.id)
        ? prev.filter((id) => id !== product.id)
        : [...prev, product.id].slice(0, 8);
      AsyncStorage.setItem(`pinned_products_${outletIdRef.current}`, JSON.stringify(ids));
      return ids;
    });
  }, []);

  const handleSearchChange = useCallback((text) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setAppliedSearch(text), DEBOUNCE_MS);
  }, []);

  const handleAddProduct = useCallback(
    (product) => {
      addItem(product);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSnackbar({ visible: true, message: `${product.name} added to cart.` });
    },
    [addItem],
  );

  const handleHoldCart = useCallback(() => {
    if (items.length === 0) return;
    saveDraft(items, customerId, customerName);
    clearCart();
    setSnackbar({ visible: true, message: 'Cart saved as draft.' });
  }, [items, customerId, customerName, saveDraft, clearCart]);

  const handleBarcodeScan = useCallback(
    async (barcode) => {
      setScanLoading(true);
      try {
        const product = await getProductByBarcode(barcode);
        handleAddProduct(product);
      } catch (err) {
        const status = err?.status;
        if (status === 404) {
          setSnackbar({ visible: true, message: `Product not found for barcode ${barcode}.` });
        } else {
          setSnackbar({ visible: true, message: err?.message ?? 'Barcode scan failed.' });
        }
      } finally {
        setScanLoading(false);
      }
    },
    [handleAddProduct],
  );

  const handleSelectCustomer = useCallback(
    (customer) => {
      setSelectedCustomer(customer);
      setCustomer(customer ? customer.id : null, customer ? customer.name : null);
      setUseLoyalty(false);
      setLoyaltyInput('');
    },
    [setCustomer],
  );

  const handleClearCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setCustomer(null, null);
    setUseLoyalty(false);
    setLoyaltyInput('');
  }, [setCustomer]);

  // Discount via supervisor
  const handleDiscountSupervisorSuccess = (supervisorId) => {
    setDiscountSupervisorVisible(false);
    setDiscountSupervisorId(supervisorId);
    setDiscountAmount('');
    setDiscountType('fixed');
    setDiscountDialogVisible(true);
  };

  const handleApplyDiscount = () => {
    const amount = parseFloat(discountAmount);
    if (isNaN(amount) || amount <= 0) {
      setSnackbar({ visible: true, message: 'Enter a valid discount amount.' });
      return;
    }
    setAppliedDiscount({ type: discountType, amount, supervisorId: discountSupervisorId });
    setDiscountDialogVisible(false);
    setDiscountAmount('');
  };

  const createOrderMutation = useCreateOrder();

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setSnackbar({ visible: true, message: 'Cart is empty.' });
      return;
    }
    if (!shift) {
      setSnackbar({ visible: true, message: 'Please start a shift before creating an order.' });
      return;
    }
    try {
      const payload = {
        outlet_id: shift?.outlet_id ?? shift?.outlet?.id ?? outletId ?? 1,
        customer_id: customerId ?? undefined,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          discount_amount: i.discount_amount || undefined,
        })),
      };
      if (appliedDiscount) {
        payload.discount_amount = appliedDiscount.amount;
        payload.discount_type = appliedDiscount.type;
        payload.supervisor_id = appliedDiscount.supervisorId;
      }
      if (useLoyalty && loyaltyRedeemed > 0) {
        payload.loyalty_points_redeemed = loyaltyRedeemed;
      }
      const order = await createOrderMutation.mutateAsync(payload);
      setPaymentOrder(order);
    } catch (err) {
      setSnackbar({ visible: true, message: err?.message ?? 'Failed to create order.' });
    }
  };

  const handlePaymentSuccess = (_payment, order) => {
    setPaymentOrder(null);
    clearCart();
    setSelectedCustomer(null);
    setAppliedDiscount(null);
    setUseLoyalty(false);
    setLoyaltyInput('');
    navigation.navigate('Receipt', { orderId: order?.id ?? paymentOrder?.id });
  };

  const renderProduct = useCallback(
    ({ item }) => (
      <ProductCard
        product={item}
        onAdd={handleAddProduct}
        onLongPress={handleTogglePin}
        isPinned={pinnedIds.includes(item.id)}
      />
    ),
    [handleAddProduct, handleTogglePin, pinnedIds],
  );

  // ── Products Panel ──────────────────────────────────────────────────────────
  const ProductPanel = (
    <View style={styles.flex}>
      {itemCount > 0 && (
        <TouchableOpacity
          style={styles.viewCartBtn}
          onPress={() => setPanel('cart')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="cart" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.viewCartText}>View Cart</Text>
          <View style={styles.viewCartBadge}>
            <Text style={styles.viewCartBadgeText}>{itemCount}</Text>
          </View>
          <Text style={styles.viewCartTotal}>{formatCurrency(subtotal)}</Text>
        </TouchableOpacity>
      )}
      <Searchbar
        placeholder="Search products..."
        value={search}
        onChangeText={handleSearchChange}
        style={styles.searchbar}
        elevation={0}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catScrollContent}
      >
        <Chip
          selected={selectedCategory === null}
          onPress={() => setSelectedCategory(null)}
          style={styles.catChip}
          compact
        >
          All
        </Chip>
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            selected={selectedCategory === cat.name}
            onPress={() => setSelectedCategory(cat.name)}
            style={styles.catChip}
            compact
          >
            {cat.name}
          </Chip>
        ))}
      </ScrollView>
      {prodLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isFetchingProducts && !prodLoading}
              onRefresh={refetchProducts}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
          ListHeaderComponent={
            <PinnedProductRow
              pinnedIds={pinnedIds}
              products={products}
              onAdd={handleAddProduct}
              onUnpin={handleTogglePin}
            />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={{ paddingVertical: 16 }} color={theme.colors.primary} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No products found.</Text>
            </View>
          }
        />
      )}
      {/* Barcode FAB */}
      <TouchableOpacity
        style={styles.scanFab}
        onPress={() => setScannerVisible(true)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons name="barcode-scan" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.flex}>
      {/* Shift Banner */}
      <ShiftBanner
        shift={shift}
        loading={!isShiftInitialized}
        onShiftStarted={() => setSnackbar({ visible: true, message: 'Shift started successfully.' })}
        onShiftEnded={() => setSnackbar({ visible: true, message: 'Shift ended successfully.' })}
      />

      {/* Segment bar + Drafts icon */}
      <View style={[styles.segmentBar, { backgroundColor: theme.colors.secondary }]}>
        <TouchableOpacity
          style={[styles.segment, panel === 'products' && styles.segmentActive]}
          onPress={() => setPanel('products')}
        >
          <MaterialCommunityIcons
            name="view-grid-outline"
            size={18}
            color={panel === 'products' ? '#FFFFFF' : 'rgba(255,255,255,0.55)'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, panel === 'products' && styles.segmentTextActive]}>
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, panel === 'cart' && styles.segmentActive]}
          onPress={() => setPanel('cart')}
        >
          <View style={styles.cartTabInner}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={18}
              color={panel === 'cart' ? '#FFFFFF' : 'rgba(255,255,255,0.55)'}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.segmentText, panel === 'cart' && styles.segmentTextActive]}>
              Cart
            </Text>
            {itemCount > 0 && (
              <Badge style={styles.cartBadge} size={18}>
                {itemCount}
              </Badge>
            )}
          </View>
        </TouchableOpacity>
        {/* Drafts button */}
        <TouchableOpacity
          style={styles.draftsButton}
          onPress={() => draftSheetRef.current?.present()}
        >
          <MaterialCommunityIcons name="playlist-edit" size={20} color="rgba(255,255,255,0.85)" />
          {drafts.length > 0 && (
            <View style={styles.draftsBadge}>
              <Text style={styles.draftsBadgeText}>{drafts.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Panels */}
      {panel === 'products' ? (
        ProductPanel
      ) : (
        <CartPanel
          onBrowseProducts={() => setPanel('products')}
          onHoldCart={handleHoldCart}
          onPlaceOrder={handlePlaceOrder}
          isPlacingOrder={createOrderMutation.isPending}
          shift={shift}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={handleSelectCustomer}
          onClearCustomer={handleClearCustomer}
          appliedDiscount={appliedDiscount}
          onOpenDiscount={() => setDiscountSupervisorVisible(true)}
          onRemoveDiscount={() => {
            setAppliedDiscount(null);
            setDiscountSupervisorId(null);
          }}
          useLoyalty={useLoyalty}
          setUseLoyalty={setUseLoyalty}
          loyaltyInput={loyaltyInput}
          setLoyaltyInput={setLoyaltyInput}
        />
      )}

      <DraftListSheet ref={draftSheetRef} />

      <BarcodeScannerModal
        visible={scannerVisible}
        products={products}
        onAdd={handleAddProduct}
        onDismiss={() => setScannerVisible(false)}
      />

      <PaymentSheet
        visible={!!paymentOrder}
        order={paymentOrder}
        onDismiss={() => setPaymentOrder(null)}
        onSuccess={handlePaymentSuccess}
      />

      <SupervisorAuthDialog
        visible={discountSupervisorVisible}
        action="discount_override"
        onSuccess={(supervisorId) => handleDiscountSupervisorSuccess(supervisorId)}
        onCancel={() => setDiscountSupervisorVisible(false)}
      />

      <Portal>
        <Dialog
          visible={discountDialogVisible}
          onDismiss={() => setDiscountDialogVisible(false)}
        >
          <Dialog.Title>Add Discount</Dialog.Title>
          <Dialog.Content>
            <SegmentedButtons
              value={discountType}
              onValueChange={setDiscountType}
              buttons={[
                { value: 'fixed', label: 'Fixed (Rp)' },
                { value: 'percentage', label: 'Percentage (%)' },
              ]}
              style={{ marginBottom: 12 }}
            />
            <TextInput
              label={discountType === 'fixed' ? 'Discount Amount (Rp)' : 'Discount (%)'}
              value={discountAmount}
              onChangeText={setDiscountAmount}
              mode="outlined"
              keyboardType="decimal-pad"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDiscountDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleApplyDiscount}>Apply</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={2000}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
}

const CARD_GAP = 8;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  segmentBar: {
    flexDirection: 'row',
    height: 46,
    paddingTop: Platform.OS === 'ios' ? 0 : 0,
  },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  segmentActive: { borderBottomWidth: 3, borderBottomColor: '#94B4C1' },
  segmentText: { color: 'rgba(255,255,255,0.65)', fontWeight: '600', fontSize: 14 },
  segmentTextActive: { color: '#FFFFFF' },
  cartTabInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cartBadge: { backgroundColor: '#94B4C1' },
  draftsButton: { width: 44, height: '100%', alignItems: 'center', justifyContent: 'center' },
  draftsBadge: {
    position: 'absolute',
    top: 6,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  draftsBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  searchbar: { margin: 10, borderRadius: 10 },
  catScroll: { maxHeight: 44 },
  catScrollContent: { paddingHorizontal: 10, gap: 8, alignItems: 'center' },
  catChip: { marginRight: 2 },
  pinnedRow: { paddingHorizontal: 10, paddingVertical: 6 },
  pinnedTitle: { fontSize: 12, fontWeight: '600', color: '#547792', marginBottom: 4 },
  pinnedScrollContent: { gap: 8 },
  pinnedCard: {
    width: 80,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 1,
    alignItems: 'center',
  },
  pinnedImg: { width: 80, height: 60 },
  pinnedImgPlaceholder: {
    width: 80,
    height: 60,
    backgroundColor: '#ECEFCA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedName: { fontSize: 11, fontWeight: '600', padding: 4, textAlign: 'center' },
  pinnedBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 8,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinnedStar: { color: '#FBBF24', fontSize: 11 },
  scanFab: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#213448',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  gridRow: { gap: CARD_GAP, paddingHorizontal: 10 },
  gridContent: { paddingBottom: 80, paddingTop: 4 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    marginBottom: CARD_GAP,
  },
  cardImage: { width: '100%', aspectRatio: 1 },
  cardImagePlaceholder: {
    backgroundColor: '#ECEFCA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: 8 },
  cardName: { fontWeight: '600', marginBottom: 2 },
  cardPrice: { fontWeight: '700' },
  viewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#213448',
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 2,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  viewCartText: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 14 },
  viewCartBadge: {
    backgroundColor: '#94B4C1',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  viewCartBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  viewCartTotal: { color: '#ECEFCA', fontWeight: '700', fontSize: 14 },
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 48 },
  emptyText: { color: '#888', fontSize: 15, marginTop: 8 },
});
