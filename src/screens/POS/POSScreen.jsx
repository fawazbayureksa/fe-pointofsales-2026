import React, { useState, useCallback, useRef } from 'react';
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
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useProductList } from '../../hooks/useProducts';
import { useAllCategories } from '../../hooks/useCategories';
import { useCreateOrder } from '../../hooks/useOrders';
import useCartStore from '../../store/cartStore';
import { resolveImageUrl } from '../../utils/image';
import { formatCurrency } from '../../utils/currency';
import PaymentSheet from './PaymentSheet';

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

export default function POSScreen({ navigation }) {
  const theme = useTheme();
  const [panel, setPanel] = useState('products');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [paymentOrder, setPaymentOrder] = useState(null);
  const debounceRef = useRef(null);

  const {
    items,
    outletId,
    customerId,
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
        notes: notes.trim() || undefined,
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
      <Searchbar
        placeholder="Search products…"
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
              <Divider style={{ marginVertical: 8 }} />
              <View style={styles.totalsRow}>
                <Text variant="titleMedium" style={{ fontWeight: '700' }}>Total (est.)</Text>
                <Text variant="titleMedium" style={{ fontWeight: '800', color: theme.colors.secondary }}>
                  {formatCurrency(subtotal)}
                </Text>
              </View>
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
          }
        />
      )}
    </View>
  );

  return (
    <View style={styles.flex}>
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
  searchbar: { margin: 10, borderRadius: 10 },
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
});
