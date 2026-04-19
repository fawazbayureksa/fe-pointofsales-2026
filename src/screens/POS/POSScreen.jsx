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
  TextInput,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useProductList } from '../../hooks/useProducts';
import { useAllCategories } from '../../hooks/useCategories';
import { useCreateOrder } from '../../hooks/useOrders';
import { useCustomerSearch, useCreateCustomer } from '../../hooks/useCustomers';
import useCartStore from '../../store/cartStore';
import useDraftStore from '../../store/draftStore';
import { resolveImageUrl } from '../../utils/image';
import { formatCurrency } from '../../utils/currency';
import PaymentSheet from './PaymentSheet';
import DraftListSheet from './DraftListSheet';
import BarcodeScannerModal from './BarcodeScannerModal';

const DEBOUNCE_MS = 400;

// ── Tier helpers ──────────────────────────────────────────────────────────────
const TIER_COLORS = { regular: '#9CA3AF', silver: '#64748B', gold: '#D97706', platinum: '#7C3AED' };
function tierColor(tier) {
  return TIER_COLORS[tier?.toLowerCase()] ?? TIER_COLORS.regular;
}

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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pinnedScroll}>
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

// \u2500\u2500 CartItemRow (swipe-left to delete) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function CartItemRow({ item, onRemove, onQtyChange }) {
  const renderRightActions = () => (
    <TouchableOpacity style={styles.swipeDelete} onPress={() => onRemove(item.product_id)}>
      <MaterialCommunityIcons name="trash-can-outline" size={22} color="#fff" />
    </TouchableOpacity>
  );
  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <View style={styles.cartRow}>
        <View style={styles.cartRowLeft}>
          <Text variant="bodyMedium" style={styles.cartItemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text variant="bodySmall" style={styles.cartItemPrice}>
            {formatCurrency(item.price)} {'\u00d7'} {item.quantity}
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
            <Text style={styles.qtyBtnText}>{'\u2212'}</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onQtyChange(item.product_id, item.quantity + 1)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Swipeable>
  );
}

// \u2500\u2500 CustomerSearchBar \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function CustomerSearchBar({ customerId, customerName, onSelect, onClear }) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const debRef = useRef(null);

  const { data: results = [], isFetching } = useCustomerSearch(debouncedQ);
  const createMutation = useCreateCustomer();

  const handleQueryChange = (text) => {
    setQuery(text);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => {
      setDebouncedQ(text);
      setShowDropdown(text.length >= 2);
    }, 350);
  };

  const handleSelect = (customer) => {
    onSelect(customer);
    setQuery('');
    setDebouncedQ('');
    setShowDropdown(false);
  };

  const handleClear = () => {
    onClear();
    setQuery('');
    setDebouncedQ('');
    setShowDropdown(false);
  };

  const handleCreateSubmit = async () => {
    if (!newName.trim()) return;
    try {
      const c = await createMutation.mutateAsync({
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
      });
      handleSelect(c);
      setShowCreate(false);
      setNewName('');
      setNewPhone('');
    } catch (_) {}
  };

  if (customerId) {
    const initials = (customerName ?? '?')
      .split(' ')
      .slice(0, 2)
      .map((w) => (w[0] ?? '').toUpperCase())
      .join('');
    return (
      <View style={styles.memberCard}>
        <View style={[styles.memberAvatar, { backgroundColor: tierColor(undefined) }]}>
          <Text style={styles.memberInitials}>{initials}</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text variant="bodyMedium" style={styles.memberName}>{customerName}</Text>
        </View>
        <TouchableOpacity onPress={handleClear} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="close-circle" size={20} color="#94B4C1" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.custSearchRow}>
        <MaterialCommunityIcons name="account-search-outline" size={18} color="#94B4C1" style={{ marginRight: 6 }} />
        <RNTextInput
          style={styles.custSearchInput}
          placeholder="Search customer..."
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={handleQueryChange}
          onFocus={() => query.length >= 2 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          returnKeyType="search"
        />
        {isFetching && <ActivityIndicator size={14} color="#94B4C1" />}
      </View>
      {showDropdown && (
        <View style={styles.dropdown}>
          {results.map((c) => (
            <TouchableOpacity key={c.id} style={styles.dropdownRow} onPress={() => handleSelect(c)}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" style={styles.dropdownName}>{c.name}</Text>
                {c.phone ? <Text variant="bodySmall" style={{ color: '#64748B' }}>{c.phone}</Text> : null}
              </View>
              {c.loyalty_points != null && (
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsBadgeText}>{c.loyalty_points} pts</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.dropdownNew}
            onPress={() => { setShowDropdown(false); setShowCreate(true); }}
          >
            <MaterialCommunityIcons name="account-plus-outline" size={16} color="#547792" />
            <Text style={styles.dropdownNewText}>New Customer</Text>
          </TouchableOpacity>
        </View>
      )}
      {showCreate && (
        <View style={styles.quickCreateOverlay}>
          <View style={styles.quickCreateCard}>
            <Text variant="titleSmall" style={{ fontWeight: '700', color: '#213448', marginBottom: 8 }}>
              New Customer
            </Text>
            <TextInput value={newName} onChangeText={setNewName} mode="outlined" label="Name *" style={{ marginBottom: 8 }} autoFocus />
            <TextInput value={newPhone} onChangeText={setNewPhone} mode="outlined" label="Phone" keyboardType="phone-pad" style={{ marginBottom: 8 }} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button mode="outlined" onPress={() => setShowCreate(false)} style={{ flex: 1 }}>Cancel</Button>
              <Button
                mode="contained"
                onPress={handleCreateSubmit}
                loading={createMutation.isPending}
                disabled={!newName.trim() || createMutation.isPending}
                style={{ flex: 1 }}
              >
                Save
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// \u2500\u2500 POSScreen \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
export default function POSScreen({ navigation }) {
  const theme = useTheme();
  const [panel, setPanel] = useState('products');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [pinnedIds, setPinnedIds] = useState([]);
  const outletIdRef = useRef(null);
  const debounceRef = useRef(null);
  const draftSheetRef = useRef(null);

  const {
    items,
    outletId,
    customerId,
    customerName,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setCustomer,
  } = useCartStore();

  const { drafts, saveDraft } = useDraftStore();

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity - i.discount_amount, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const estimatedPts = customerId ? Math.floor(subtotal / 1000) : 0;

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
      if (raw) { try { setPinnedIds(JSON.parse(raw)); } catch (_) {} }
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

  const createOrderMutation = useCreateOrder();

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setSnackbar({ visible: true, message: 'Cart is empty.' });
      return;
    }
    try {
      const order = await createOrderMutation.mutateAsync({
        outlet_id: outletId ?? 1,
        customer_id: customerId ?? undefined,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          discount_amount: i.discount_amount || undefined,
        })),
      });
      setPaymentOrder(order);
    } catch (err) {
      setSnackbar({ visible: true, message: err?.message ?? 'Failed to create order.' });
    }
  };

  const handlePaymentSuccess = (_payment, order) => {
    setPaymentOrder(null);
    clearCart();
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

  // \u2500\u2500 Products Panel \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const ProductPanel = (
    <View style={styles.flex}>
      {itemCount > 0 && (
        <TouchableOpacity style={styles.viewCartBtn} onPress={() => setPanel('cart')} activeOpacity={0.85}>
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
        <Chip selected={selectedCategory === null} onPress={() => setSelectedCategory(null)} style={styles.catChip} compact>
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
      <TouchableOpacity style={styles.scanFab} onPress={() => setScannerVisible(true)} activeOpacity={0.85}>
        <MaterialCommunityIcons name="barcode-scan" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // \u2500\u2500 Cart Panel \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const CartPanel = (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Cart header with Hold button */}
      <View style={styles.cartHeader}>
        <Text variant="titleSmall" style={styles.cartHeaderTitle}>Cart</Text>
        <View style={{ flexDirection: 'row' }}>
          {items.length > 0 && (
            <IconButton icon="pause-circle-outline" size={22} iconColor="#547792" onPress={handleHoldCart} style={{ margin: 0 }} />
          )}
          <IconButton
            icon="trash-can-outline"
            size={22}
            iconColor="#EF4444"
            onPress={() => { clearCart(); setPanel('products'); }}
            style={{ margin: 0 }}
            disabled={items.length === 0}
          />
        </View>
      </View>

      {/* Inline customer search */}
      <View style={styles.custSection}>
        <CustomerSearchBar
          customerId={customerId}
          customerName={customerName}
          onSelect={(c) => setCustomer(c.id, c.name)}
          onClear={() => setCustomer(null, null)}
        />
      </View>

      <Divider />

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
          ListFooterComponent={
            <View style={styles.totalsBox}>
              <View style={styles.totalsRow}>
                <Text variant="bodyMedium" style={styles.totalsLabel}>Items</Text>
                <Text variant="bodyMedium">{itemCount}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text variant="bodyMedium" style={styles.totalsLabel}>Subtotal</Text>
                <Text variant="bodyMedium" style={styles.totalsValue}>{formatCurrency(subtotal)}</Text>
              </View>
              {estimatedPts > 0 && (
                <View style={styles.loyaltyPreview}>
                  <MaterialCommunityIcons name="star-outline" size={14} color="#D97706" />
                  <Text style={styles.loyaltyPreviewText}>+{estimatedPts} loyalty points to earn</Text>
                </View>
              )}
              <Divider style={{ marginVertical: 8 }} />
              <View style={styles.totalsRow}>
                <Text variant="titleMedium" style={{ fontWeight: '700' }}>Total (est.)</Text>
                <Text variant="titleMedium" style={{ fontWeight: '800', color: theme.colors.secondary }}>
                  {formatCurrency(subtotal)}
                </Text>
              </View>
            </View>
          }
        />
      )}

      {/* Sticky Place Order — always above keyboard */}
      <View style={styles.stickyOrder}>
        <Button
          mode="contained"
          onPress={handlePlaceOrder}
          loading={createOrderMutation.isPending}
          disabled={createOrderMutation.isPending || items.length === 0}
          style={styles.placeOrderBtn}
          contentStyle={styles.placeOrderContent}
          labelStyle={{ fontSize: 16, fontWeight: '700' }}
        >
          Place Order
        </Button>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <View style={styles.flex}>
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
              <Badge style={styles.cartBadge} size={18}>{itemCount}</Badge>
            )}
          </View>
        </TouchableOpacity>
        {/* Drafts button */}
        <TouchableOpacity style={styles.draftsButton} onPress={() => draftSheetRef.current?.present()}>
          <MaterialCommunityIcons name="playlist-edit" size={20} color="rgba(255,255,255,0.85)" />
          {drafts.length > 0 && (
            <View style={styles.draftsBadge}>
              <Text style={styles.draftsBadgeText}>{drafts.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {panel === 'products' ? ProductPanel : CartPanel}

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
    position: 'absolute', top: 6, right: 4, backgroundColor: '#EF4444',
    borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 3,
  },
  draftsBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  searchbar: { margin: 10, borderRadius: 10 },
  catScroll: { maxHeight: 44 },
  catScrollContent: { paddingHorizontal: 10, gap: 8, alignItems: 'center' },
  catChip: { marginRight: 2 },
  pinnedRow: { paddingHorizontal: 10, paddingVertical: 6 },
  pinnedTitle: { fontSize: 12, fontWeight: '600', color: '#547792', marginBottom: 4 },
  pinnedScrollContent: { gap: 8 },
  pinnedCard: { width: 80, backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden', elevation: 1, alignItems: 'center' },
  pinnedImg: { width: 80, height: 60 },
  pinnedImgPlaceholder: { width: 80, height: 60, backgroundColor: '#ECEFCA', alignItems: 'center', justifyContent: 'center' },
  pinnedName: { fontSize: 11, fontWeight: '600', padding: 4, textAlign: 'center' },
  pinnedBadge: {
    position: 'absolute', top: 3, right: 3, backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 8, width: 18, height: 18, alignItems: 'center', justifyContent: 'center',
  },
  pinnedStar: { color: '#FBBF24', fontSize: 11 },
  scanFab: {
    position: 'absolute', bottom: 20, right: 16, width: 52, height: 52,
    borderRadius: 26, backgroundColor: '#213448', alignItems: 'center',
    justifyContent: 'center', elevation: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 5,
  },
  gridRow: { gap: CARD_GAP, paddingHorizontal: 10 },
  gridContent: { paddingBottom: 80, paddingTop: 4 },
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 3, marginBottom: CARD_GAP,
  },
  cardImage: { width: '100%', aspectRatio: 1 },
  cardImagePlaceholder: { backgroundColor: '#ECEFCA', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 8 },
  cardName: { fontWeight: '600', marginBottom: 2 },
  cardPrice: { fontWeight: '700' },
  cartHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingVertical: 4, backgroundColor: '#fff',
  },
  cartHeaderTitle: { fontWeight: '700', color: '#213448' },
  custSection: { paddingHorizontal: 10, paddingVertical: 6 },
  cartRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', gap: 8,
  },
  cartRowLeft: { flex: 1 },
  cartItemName: { fontWeight: '600', marginBottom: 2 },
  cartItemPrice: { color: '#666' },
  discountLabel: { color: '#E05A00' },
  cartRowRight: { flexDirection: 'row', alignItems: 'center' },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ECEFCA', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: '#213448', lineHeight: 22 },
  qtyText: { width: 28, textAlign: 'center', fontWeight: '600', fontSize: 15 },
  deleteBtn: { margin: 0 },
  swipeDelete: { backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', width: 64 },
  totalsBox: { padding: 16, backgroundColor: '#FAFAFA', marginTop: 8 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalsLabel: { color: '#555' },
  totalsValue: { fontWeight: '600' },
  loyaltyPreview: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 2 },
  loyaltyPreviewText: { fontSize: 12, color: '#D97706' },
  stickyOrder: { paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  placeOrderBtn: { borderRadius: 10, backgroundColor: '#547792' },
  placeOrderContent: { paddingVertical: 6 },
  center: { alignItems: 'center', justifyContent: 'center', paddingTop: 48 },
  emptyText: { color: '#888', fontSize: 15, marginTop: 8 },
  custSearchRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: '#D1D5DB', borderRadius: 10, backgroundColor: '#fff',
    paddingHorizontal: 10, gap: 6,
  },
  custSearchInput: { flex: 1, height: 40, fontSize: 14, color: '#213448' },
  dropdown: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 8, marginTop: 2, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, zIndex: 10,
  },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  dropdownName: { flex: 1, fontWeight: '600', color: '#213448' },
  pointsBadge: { backgroundColor: '#FEF3C7', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  pointsBadgeText: { fontSize: 11, color: '#D97706', fontWeight: '700' },
  dropdownNew: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    paddingVertical: 10, gap: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  dropdownNewText: { color: '#2563EB', fontWeight: '600' },
  memberCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF',
    borderRadius: 10, padding: 10, gap: 10, marginTop: 4,
  },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#547792', alignItems: 'center', justifyContent: 'center' },
  memberInitials: { color: '#fff', fontWeight: '700', fontSize: 14 },
  memberInfo: { flex: 1 },
  memberName: { fontWeight: '700', color: '#213448' },
  quickCreateOverlay: { backgroundColor: '#F0F7FF', borderRadius: 10, padding: 12, marginTop: 4, borderWidth: 1, borderColor: '#BFDBFE' },
  quickCreateCard: {},
  viewCartBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#213448',
    marginHorizontal: 10, marginTop: 6, marginBottom: 2,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, gap: 8,
  },
  viewCartText: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 14 },
  viewCartBadge: { backgroundColor: '#94B4C1', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
  viewCartBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  viewCartTotal: { color: '#ECEFCA', fontWeight: '700', fontSize: 14 },
});
