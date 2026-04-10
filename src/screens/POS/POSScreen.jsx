import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  Modal,
} from 'react-native';
import {
  Text,
  Searchbar,
  Chip,
  Button,
  Badge,
  IconButton,
  Snackbar,
  useTheme,
  ActivityIndicator,
  Divider,
  SegmentedButtons,
  TextInput,
  Switch,
  Dialog,
  Portal,
} from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useProductList } from '../../hooks/useProducts';
import { useAllCategories } from '../../hooks/useCategories';
import { useCreateOrder } from '../../hooks/useOrders';
import { useCustomerList } from '../../hooks/useCustomers';
import useCartStore from '../../store/cartStore';
import useShiftStore from '../../store/shiftStore';
import { resolveImageUrl } from '../../utils/image';
import { formatCurrency } from '../../utils/currency';
import { getProductByBarcode } from '../../api/products';
import PaymentSheet from './PaymentSheet';
import ShiftBanner from '../../components/ShiftBanner';
import SupervisorAuthDialog from '../../components/SupervisorAuthDialog';
import { useCurrentShift } from '../../hooks/useShift';

const DEBOUNCE_MS = 400;

function ProductCard({ product, onAdd }) {
  const theme = useTheme();
  const imgUri = resolveImageUrl(product.image);
  return (
    <TouchableOpacity style={styles.card} onPress={() => onAdd(product)} activeOpacity={0.75}>
      {imgUri ? (
        <Image source={{ uri: imgUri }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <MaterialCommunityIcons name="package-variant" size={28} color="#94B4C1" />
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

function CartItemRow({ item, onRemove, onQtyChange }) {
  return (
    <View style={styles.cartRow}>
      <View style={styles.cartRowLeft}>
        <Text variant="bodyMedium" style={styles.cartItemName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text variant="bodySmall" style={styles.cartItemPrice}>
          {formatCurrency(item.price)} × {item.quantity}
          {item.discount_amount > 0 && (
            <Text style={styles.discountLabel}> (disc {formatCurrency(item.discount_amount)})</Text>
          )}
        </Text>
      </View>
      <View style={styles.cartRowRight}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => onQtyChange(item.product_id, item.quantity - 1)}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => onQtyChange(item.product_id, item.quantity + 1)}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
        <IconButton
          icon="trash-can-outline"
          size={18}
          onPress={() => onRemove(item.product_id)}
          style={styles.deleteBtn}
        />
      </View>
    </View>
  );
}

// ── Barcode Scanner Modal ────────────────────────────────────────────────────
function BarcodeScannerModal({ visible, onScan, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const scanned = useRef(false);

  const handleBarCodeScanned = ({ data }) => {
    if (scanned.current) return;
    scanned.current = true;
    onScan(data);
    onClose();
  };

  if (!visible) return null;

  if (!permission) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <View style={styles.scannerCenter}>
          <ActivityIndicator />
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <View style={styles.scannerCenter}>
          <Text style={{ textAlign: 'center', marginBottom: 16 }}>
            Camera permission is required to scan barcodes.
          </Text>
          <Button mode="contained" onPress={requestPermission}>Grant Permission</Button>
          <Button onPress={onClose} style={{ marginTop: 8 }}>Cancel</Button>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.scannerWrapper}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39'] }}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerHint}>Point at a barcode to scan</Text>
          <Button
            mode="contained"
            onPress={onClose}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', marginTop: 24 }}
          >
            Cancel
          </Button>
        </View>
      </View>
    </Modal>
  );
}

// ── Customer Selector ────────────────────────────────────────────────────────
function CustomerSelectorModal({ visible, onSelect, onClose }) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const debounceRef = useRef(null);

  const { data, isLoading } = useCustomerList(appliedSearch ? { search: appliedSearch } : {});
  const customers = data?.pages.flatMap((p) => p.data ?? []) ?? [];

  const handleSearch = (t) => {
    setSearch(t);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setAppliedSearch(t), 400);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1} />
      <View style={styles.customerModalSheet}>
        <View style={styles.handle} />
        <Text variant="titleMedium" style={styles.modalTitle}>Select Customer</Text>
        <Searchbar
          placeholder="Search customers…"
          value={search}
          onChangeText={handleSearch}
          style={{ margin: 12, borderRadius: 10 }}
          elevation={0}
        />
        {isLoading ? (
          <ActivityIndicator style={{ paddingVertical: 24 }} color={theme.colors.primary} />
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(c) => String(c.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.customerRow}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" style={{ fontWeight: '700' }}>{item.name}</Text>
                  <Text variant="bodySmall" style={{ color: '#888' }}>
                    {item.phone ?? item.email ?? ''}
                    {item.loyalty_points > 0 ? ` · ${Number(item.loyalty_points).toLocaleString('id-ID')} pts` : ''}
                  </Text>
                </View>
                {item.membership_tier && (
                  <Chip compact style={styles.customerTierBadge} textStyle={{ fontSize: 10, fontWeight: '700' }}>
                    {item.membership_tier}
                  </Chip>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: '#888', paddingVertical: 24 }}>
                No customers found.
              </Text>
            }
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 400 }}
          />
        )}
        <Button onPress={onClose} style={{ margin: 12 }}>Close</Button>
      </View>
    </Modal>
  );
}

export default function POSScreen({ navigation }) {
  const theme = useTheme();
  const [panel, setPanel] = useState('products');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [paymentOrder, setPaymentOrder] = useState(null);
  const debounceRef = useRef(null);

  // Barcode
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  // Customer selector
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
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
  useCurrentShift(); // initialize shift state

  const {
    items,
    outletId,
    notes,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCartStore();

  const subtotal = items.reduce(
    (sum, i) => sum + i.price * i.quantity - i.discount_amount,
    0,
  );
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const discountValue = (() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.type === 'percentage') return subtotal * (appliedDiscount.amount / 100);
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

  const handleSearchChange = useCallback((text) => {
    setSearch(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setAppliedSearch(text), DEBOUNCE_MS);
  }, []);

  const handleAddProduct = useCallback((product) => {
    addItem(product);
    setSnackbar({ visible: true, message: `${product.name} added to cart.` });
  }, [addItem]);

  const handleBarcodeScan = useCallback(async (barcode) => {
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
  }, [handleAddProduct]);

  const handleSelectCustomer = useCallback((customer) => {
    setSelectedCustomer(customer);
    setUseLoyalty(false);
    setLoyaltyInput('');
  }, []);

  const handleClearCustomer = useCallback(() => {
    setSelectedCustomer(null);
    setUseLoyalty(false);
    setLoyaltyInput('');
  }, []);

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
        outlet_id: shift?.outlet_id ?? outletId ?? 1,
        customer_id: selectedCustomer?.id ?? undefined,
        notes: notes.trim() || undefined,
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
    ({ item }) => <ProductCard product={item} onAdd={handleAddProduct} />,
    [handleAddProduct],
  );

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

      {/* Search + Scan */}
      <View style={styles.searchRow}>
        <Searchbar
          placeholder="Search products…"
          value={search}
          onChangeText={handleSearchChange}
          style={[styles.searchbar, { flex: 1 }]}
          elevation={0}
        />
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => setScannerVisible(true)}
          disabled={scanLoading}
        >
          {scanLoading ? (
            <ActivityIndicator size={20} color="#547792" />
          ) : (
            <MaterialCommunityIcons name="barcode-scan" size={24} color="#547792" />
          )}
        </TouchableOpacity>
      </View>

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
    </View>
  );

  const CartPanel = (
    <View style={styles.flex}>
      {items.length === 0 ? (
        <View style={[styles.center, styles.flex]}>
          <MaterialCommunityIcons name="cart-outline" size={48} color="#94B4C1" />
          <Text style={styles.emptyText}>Cart is empty</Text>
          <Button mode="outlined" onPress={() => setPanel('products')} style={{ marginTop: 12 }}>
            Browse Products
          </Button>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.product_id)}
          renderItem={({ item }) => (
            <CartItemRow item={item} onRemove={removeItem} onQtyChange={updateQuantity} />
          )}
          ItemSeparatorComponent={() => <Divider />}
          contentContainerStyle={{ paddingBottom: 8 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={styles.cartExtras}>
              {/* Customer */}
              <Divider style={{ marginBottom: 8 }} />
              <View style={styles.cartExtraRow}>
                <Text variant="labelMedium" style={styles.cartExtraLabel}>Customer</Text>
                {selectedCustomer ? (
                  <View style={styles.customerSelectedRow}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" style={{ fontWeight: '700' }}>{selectedCustomer.name}</Text>
                      {selectedCustomer.loyalty_points > 0 && (
                        <Text variant="bodySmall" style={{ color: '#547792' }}>
                          {Number(selectedCustomer.loyalty_points).toLocaleString('id-ID')} pts available
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={handleClearCustomer}>
                      <MaterialCommunityIcons name="close-circle" size={20} color="#888" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Button
                    mode="outlined"
                    compact
                    icon="account-plus-outline"
                    onPress={() => setCustomerModalVisible(true)}
                    style={styles.addCustomerBtn}
                  >
                    Add Customer
                  </Button>
                )}
              </View>

              {/* Loyalty Points */}
              {selectedCustomer && selectedCustomer.loyalty_points > 0 && !appliedDiscount && (
                <View style={styles.loyaltyRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="labelMedium" style={styles.cartExtraLabel}>Use Loyalty Points</Text>
                    {useLoyalty && (
                      <TextInput
                        value={loyaltyInput}
                        onChangeText={(v) => {
                          const n = parseInt(v, 10);
                          if (!isNaN(n)) {
                            setLoyaltyInput(String(Math.min(n, Math.floor(maxLoyalty))));
                          } else {
                            setLoyaltyInput(v);
                          }
                        }}
                        keyboardType="number-pad"
                        mode="outlined"
                        dense
                        placeholder={`Max ${Math.floor(maxLoyalty)}`}
                        style={{ marginTop: 6 }}
                        right={<TextInput.Affix text="pts" />}
                      />
                    )}
                  </View>
                  <Switch
                    value={useLoyalty}
                    onValueChange={(v) => {
                      setUseLoyalty(v);
                      if (v) setLoyaltyInput(String(Math.floor(maxLoyalty)));
                      else setLoyaltyInput('');
                    }}
                    color={theme.colors.primary}
                  />
                </View>
              )}

              {/* Order-level Discount */}
              <View style={styles.discountRow}>
                {appliedDiscount ? (
                  <View style={styles.discountApplied}>
                    <MaterialCommunityIcons name="tag-check" size={16} color="#2E7D32" />
                    <Text variant="bodySmall" style={{ color: '#2E7D32', flex: 1 }}>
                      Discount: {appliedDiscount.type === 'fixed'
                        ? formatCurrency(appliedDiscount.amount)
                        : `${appliedDiscount.amount}%`}
                    </Text>
                    <TouchableOpacity onPress={() => { setAppliedDiscount(null); setDiscountSupervisorId(null); }}>
                      <MaterialCommunityIcons name="close-circle" size={18} color="#888" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Button
                    mode="outlined"
                    compact
                    icon="tag-outline"
                    onPress={() => setDiscountSupervisorVisible(true)}
                    style={styles.addDiscountBtn}
                  >
                    Add Discount
                  </Button>
                )}
              </View>
              <Divider style={{ marginTop: 8 }} />
            </View>
          }
          ListFooterComponent={
            <View style={styles.totalsBox}>
              <View style={styles.totalsRow}>
                <Text variant="bodyMedium" style={styles.totalsLabel}>Items</Text>
                <Text variant="bodyMedium">{itemCount}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text variant="bodyMedium" style={styles.totalsLabel}>Subtotal</Text>
                <Text variant="bodyMedium" style={styles.totalsValue}>
                  {formatCurrency(subtotal)}
                </Text>
              </View>
              {discountValue > 0 && (
                <View style={styles.totalsRow}>
                  <Text variant="bodyMedium" style={{ color: '#E05A00' }}>Discount</Text>
                  <Text variant="bodyMedium" style={{ color: '#E05A00' }}>
                    -{formatCurrency(discountValue)}
                  </Text>
                </View>
              )}
              {loyaltyRedeemed > 0 && (
                <View style={styles.totalsRow}>
                  <Text variant="bodyMedium" style={{ color: '#547792' }}>Loyalty Pts</Text>
                  <Text variant="bodyMedium" style={{ color: '#547792' }}>
                    -{formatCurrency(loyaltyRedeemed)}
                  </Text>
                </View>
              )}
              <Divider style={{ marginVertical: 8 }} />
              <View style={styles.totalsRow}>
                <Text variant="titleMedium" style={{ fontWeight: '700' }}>Total (est.)</Text>
                <Text variant="titleMedium" style={{ fontWeight: '800', color: theme.colors.secondary }}>
                  {formatCurrency(Math.max(0, subtotal - discountValue - loyaltyRedeemed))}
                </Text>
              </View>
              {!shift && (
                <View style={styles.noShiftWarning}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#E65100" />
                  <Text style={{ color: '#E65100', fontSize: 12, flex: 1 }}>
                    Start a shift to place orders.
                  </Text>
                </View>
              )}
              <Button
                mode="contained"
                onPress={handlePlaceOrder}
                loading={createOrderMutation.isPending}
                disabled={createOrderMutation.isPending || items.length === 0 || !shift}
                style={styles.placeOrderBtn}
                contentStyle={styles.placeOrderContent}
                labelStyle={{ fontSize: 16, fontWeight: '700' }}
              >
                Place Order
              </Button>
            </View>
          }
        />
      )}
    </View>
  );

  return (
    <View style={styles.flex}>
      <ShiftBanner shift={shift} />

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
      </View>

      {panel === 'products' ? ProductPanel : CartPanel}

      <PaymentSheet
        visible={!!paymentOrder}
        order={paymentOrder}
        onDismiss={() => setPaymentOrder(null)}
        onSuccess={handlePaymentSuccess}
      />

      <BarcodeScannerModal
        visible={scannerVisible}
        onScan={handleBarcodeScan}
        onClose={() => setScannerVisible(false)}
      />

      <CustomerSelectorModal
        visible={customerModalVisible}
        onSelect={handleSelectCustomer}
        onClose={() => setCustomerModalVisible(false)}
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
  },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  segmentActive: { borderBottomWidth: 3, borderBottomColor: '#94B4C1' },
  segmentText: { color: 'rgba(255,255,255,0.65)', fontWeight: '600', fontSize: 14 },
  segmentTextActive: { color: '#FFFFFF' },
  cartTabInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cartBadge: { backgroundColor: '#94B4C1' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  searchbar: { margin: 10, borderRadius: 10 },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDF3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catScroll: { maxHeight: 44 },
  catScrollContent: { paddingHorizontal: 10, gap: 8, alignItems: 'center' },
  catChip: { marginRight: 2 },
  gridRow: { gap: CARD_GAP, paddingHorizontal: 10 },
  gridContent: { paddingBottom: 16, paddingTop: 4 },
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
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    gap: 8,
  },
  cartRowLeft: { flex: 1 },
  cartItemName: { fontWeight: '600', marginBottom: 2 },
  cartItemPrice: { color: '#666' },
  discountLabel: { color: '#E05A00' },
  cartRowRight: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECEFCA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: '#213448', lineHeight: 22 },
  qtyText: { width: 28, textAlign: 'center', fontWeight: '600', fontSize: 15 },
  deleteBtn: { margin: 0 },
  cartExtras: { backgroundColor: '#fff', padding: 12 },
  cartExtraRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cartExtraLabel: { color: '#555', fontWeight: '700' },
  customerSelectedRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 8,
    backgroundColor: '#EDF3F7',
    borderRadius: 8,
    padding: 8,
  },
  addCustomerBtn: { borderRadius: 8, borderColor: '#94B4C1' },
  loyaltyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  discountRow: { marginBottom: 4 },
  discountApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 8,
  },
  addDiscountBtn: { borderRadius: 8, borderColor: '#94B4C1' },
  noShiftWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  totalsBox: { padding: 16, backgroundColor: '#FAFAFA', marginTop: 8 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalsLabel: { color: '#555' },
  totalsValue: { fontWeight: '600' },
  placeOrderBtn: { marginTop: 16, borderRadius: 10, backgroundColor: '#547792' },
  placeOrderContent: { paddingVertical: 6 },
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 48 },
  emptyText: { color: '#888', fontSize: 15, marginTop: 8 },
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
  // Scanner
  scannerWrapper: { flex: 1, backgroundColor: '#000' },
  scannerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 12,
  },
  scannerHint: { color: '#fff', marginTop: 16, fontSize: 14 },
  // Customer modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  customerModalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  modalTitle: { fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
    gap: 8,
  },
  customerTierBadge: { backgroundColor: '#EDE7F6' },
});

