import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Text,
  Button,
  Badge,
  IconButton,
  Divider,
  TextInput,
  Switch,
  useTheme,
} from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useCartStore from '../../store/cartStore';
import { useCustomerSearch, useCreateCustomer } from '../../hooks/useCustomers';
import { formatCurrency } from '../../utils/currency';
import { resolveImageUrl } from '../../utils/image';

// ── Tier Colors ───────────────────────────────────────────────────────────────
const TIER_COLORS = {
  regular: '#94A3B8',
  silver: '#64748B',
  gold: '#D97706',
  platinum: '#7C3AED',
};

function tierColor(tier) {
  return TIER_COLORS[tier?.toLowerCase()] ?? TIER_COLORS.regular;
}

// ── CartItemCard ─────────────────────────────────────────────────────────────
function CartItemCard({ item, onRemove, onQtyChange }) {
  const imgUri = resolveImageUrl(item.image);
  const lineTotal = item.price * item.quantity - (item.discount_amount || 0);

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.swipeDeleteAction}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onRemove(item.product_id);
      }}
      activeOpacity={0.85}
    >
      <MaterialCommunityIcons name="trash-can-outline" size={22} color="#FFFFFF" />
      <Text style={styles.swipeDeleteText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <View style={styles.itemCard}>
        {/* Product Thumbnail */}
        {imgUri ? (
          <Image source={{ uri: imgUri }} style={styles.itemThumb} resizeMode="cover" />
        ) : (
          <View style={styles.itemThumbPlaceholder}>
            <MaterialCommunityIcons name="package-variant-closed" size={22} color="#94B4C1" />
          </View>
        )}

        {/* Product Details */}
        <View style={styles.itemDetails}>
          <Text variant="titleSmall" numberOfLines={2} style={styles.itemName}>
            {item.name}
          </Text>
          <View style={styles.itemPriceRow}>
            <Text variant="bodySmall" style={styles.itemUnitPrice}>
              {formatCurrency(item.price)}
            </Text>
            {item.discount_amount > 0 && (
              <View style={styles.itemDiscountBadge}>
                <Text style={styles.itemDiscountBadgeText}>
                  -{formatCurrency(item.discount_amount)}
                </Text>
              </View>
            )}
          </View>
          <Text variant="titleSmall" style={styles.itemLineTotal}>
            {formatCurrency(lineTotal)}
          </Text>
        </View>

        {/* Quantity Stepper */}
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={[styles.stepperBtn, item.quantity === 1 && styles.stepperBtnDanger]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onQtyChange(item.product_id, item.quantity - 1);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialCommunityIcons
              name={item.quantity === 1 ? 'trash-can-outline' : 'minus'}
              size={16}
              color={item.quantity === 1 ? '#EF4444' : '#213448'}
            />
          </TouchableOpacity>

          <Text style={styles.stepperQtyText}>{item.quantity}</Text>

          <TouchableOpacity
            style={styles.stepperBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onQtyChange(item.product_id, item.quantity + 1);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#213448" />
          </TouchableOpacity>
        </View>
      </View>
    </Swipeable>
  );
}

// ── CustomerMembershipCard ────────────────────────────────────────────────────
function CustomerMembershipSection({
  selectedCustomer,
  onSelectCustomer,
  onClearCustomer,
}) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const debounceTimer = useRef(null);

  const { data: searchResults = [], isFetching } = useCustomerSearch(debouncedQ);
  const createMutation = useCreateCustomer();

  const handleQueryChange = (text) => {
    setQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedQ(text);
      setShowDropdown(text.trim().length >= 2);
    }, 350);
  };

  const handleSelect = (customer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectCustomer(customer);
    setQuery('');
    setDebouncedQ('');
    setShowDropdown(false);
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClearCustomer();
    setQuery('');
    setDebouncedQ('');
    setShowDropdown(false);
  };

  const handleCreateCustomer = async () => {
    if (!newName.trim()) return;
    try {
      const created = await createMutation.mutateAsync({
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
      });
      handleSelect(created);
      setShowCreateModal(false);
      setNewName('');
      setNewPhone('');
    } catch (_) {}
  };

  // If customer is selected, render a modern membership badge
  if (selectedCustomer) {
    const initials = (selectedCustomer.name ?? '?')
      .split(' ')
      .slice(0, 2)
      .map((w) => (w[0] ?? '').toUpperCase())
      .join('');
    const customerTier = selectedCustomer.tier || 'regular';
    const tierBgColor = tierColor(customerTier);

    return (
      <View style={styles.memberCardContainer}>
        <View style={styles.memberCardHeader}>
          <View style={[styles.memberAvatar, { backgroundColor: tierBgColor }]}>
            <Text style={styles.memberAvatarText}>{initials}</Text>
          </View>
          <View style={styles.memberDetails}>
            <View style={styles.memberNameRow}>
              <Text variant="titleSmall" style={styles.memberName} numberOfLines={1}>
                {selectedCustomer.name}
              </Text>
              <View style={[styles.tierBadge, { backgroundColor: `${tierBgColor}20` }]}>
                <Text style={[styles.tierBadgeText, { color: tierBgColor }]}>
                  {customerTier.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.memberSubRow}>
              {selectedCustomer.phone ? (
                <Text variant="bodySmall" style={styles.memberPhone}>
                  {selectedCustomer.phone}
                </Text>
              ) : null}
              {selectedCustomer.loyalty_points != null && (
                <View style={styles.memberPointsPill}>
                  <MaterialCommunityIcons name="star" size={13} color="#D97706" />
                  <Text style={styles.memberPointsText}>
                    {Number(selectedCustomer.loyalty_points).toLocaleString('id-ID')} pts
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.memberRemoveBtn}
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Otherwise, render a customer search & quick-add field
  return (
    <View style={styles.customerSearchContainer}>
      <View style={styles.customerSearchBar}>
        <MaterialCommunityIcons name="account-search-outline" size={20} color="#94B4C1" />
        <RNTextInput
          style={styles.customerSearchInput}
          placeholder="Assign customer / member..."
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={handleQueryChange}
          onFocus={() => query.trim().length >= 2 && setShowDropdown(true)}
          returnKeyType="search"
        />
        {isFetching && <ActivityIndicator size={16} color="#547792" style={{ marginRight: 4 }} />}
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              setDebouncedQ('');
              setShowDropdown(false);
            }}
            style={{ padding: 4 }}
          >
            <MaterialCommunityIcons name="close" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.customerAddBtn}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="account-plus-outline" size={16} color="#547792" />
          <Text style={styles.customerAddBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Auto-suggest dropdown */}
      {showDropdown && (
        <View style={styles.customerDropdown}>
          {searchResults.length > 0 ? (
            searchResults.map((cust) => {
              const custTier = cust.tier || 'regular';
              const color = tierColor(custTier);
              return (
                <TouchableOpacity
                  key={cust.id}
                  style={styles.customerDropdownItem}
                  onPress={() => handleSelect(cust)}
                >
                  <View style={[styles.custItemAvatar, { backgroundColor: `${color}20` }]}>
                    <Text style={[styles.custItemAvatarText, { color }]}>
                      {(cust.name || '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.custItemInfo}>
                    <Text variant="bodyMedium" style={styles.custItemName} numberOfLines={1}>
                      {cust.name}
                    </Text>
                    {cust.phone ? (
                      <Text variant="bodySmall" style={styles.custItemPhone}>
                        {cust.phone}
                      </Text>
                    ) : null}
                  </View>
                  {cust.loyalty_points != null && (
                    <View style={styles.custItemPoints}>
                      <MaterialCommunityIcons name="star" size={12} color="#D97706" />
                      <Text style={styles.custItemPointsText}>
                        {Number(cust.loyalty_points).toLocaleString('id-ID')} pts
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.customerDropdownEmpty}>
              <Text style={styles.customerDropdownEmptyText}>No customer found.</Text>
              <TouchableOpacity
                style={styles.quickCreateInline}
                onPress={() => {
                  setShowDropdown(false);
                  setNewName(query);
                  setShowCreateModal(true);
                }}
              >
                <MaterialCommunityIcons name="account-plus" size={16} color="#547792" />
                <Text style={styles.quickCreateInlineText}>Create "{query}" as customer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Quick Create Customer Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalCardWrapper}
          >
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <MaterialCommunityIcons name="account-plus" size={20} color="#547792" />
                  <Text variant="titleMedium" style={styles.modalTitle}>
                    New Customer
                  </Text>
                </View>
                <IconButton
                  icon="close"
                  size={20}
                  onPress={() => setShowCreateModal(false)}
                  style={{ margin: 0 }}
                />
              </View>

              <Divider style={{ marginBottom: 16 }} />

              <TextInput
                label="Full Name *"
                value={newName}
                onChangeText={setNewName}
                mode="outlined"
                dense
                style={styles.modalInput}
                autoFocus
              />

              <TextInput
                label="Phone Number"
                value={newPhone}
                onChangeText={setNewPhone}
                mode="outlined"
                dense
                keyboardType="phone-pad"
                style={styles.modalInput}
              />

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowCreateModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleCreateCustomer}
                  loading={createMutation.isPending}
                  disabled={!newName.trim() || createMutation.isPending}
                  style={[{ flex: 1 }, { backgroundColor: '#547792' }]}
                >
                  Save & Select
                </Button>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

// ── Main CartPanel Component ─────────────────────────────────────────────────
export default function CartPanel({
  onBrowseProducts,
  onHoldCart,
  onPlaceOrder,
  isPlacingOrder,
  shift,
  selectedCustomer,
  onSelectCustomer,
  onClearCustomer,
  appliedDiscount,
  onOpenDiscount,
  onRemoveDiscount,
  useLoyalty,
  setUseLoyalty,
  loyaltyInput,
  setLoyaltyInput,
}) {
  const theme = useTheme();
  const [showNotes, setShowNotes] = useState(false);

  const {
    items,
    notes,
    setNotes,
    removeItem,
    updateQuantity,
    clearCart,
    customerId,
    customerName,
  } = useCartStore();

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity - (i.discount_amount || 0), 0),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const discountValue = useMemo(() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.type === 'percentage') {
      return (subtotal * appliedDiscount.amount) / 100;
    }
    return appliedDiscount.amount;
  }, [appliedDiscount, subtotal]);

  const maxLoyalty = Math.max(
    0,
    Math.min(selectedCustomer?.loyalty_points ?? 0, subtotal - discountValue),
  );

  const loyaltyPoints = parseInt(loyaltyInput, 10) || 0;
  const loyaltyRedeemed =
    useLoyalty && selectedCustomer ? Math.min(loyaltyPoints, maxLoyalty) : 0;

  const estimatedPts = selectedCustomer || customerId ? Math.floor(subtotal / 1000) : 0;

  const finalTotal = Math.max(0, subtotal - discountValue - loyaltyRedeemed);

  const handleClearCartPrompt = () => {
    if (items.length === 0) return;
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from this cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            clearCart();
            onClearCustomer();
            onBrowseProducts();
          },
        },
      ],
    );
  };

  const handleApplyMaxLoyalty = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoyaltyInput(String(Math.floor(maxLoyalty)));
  };

  // ── Header: Customer, Loyalty, Discount, Notes ─────────────────────────────
  const renderListHeader = () => (
    <View style={styles.listHeaderWrapper}>
      {/* Customer Selection / Member Badge */}
      <CustomerMembershipSection
        selectedCustomer={selectedCustomer}
        onSelectCustomer={onSelectCustomer}
        onClearCustomer={onClearCustomer}
      />

      {/* Loyalty Redemption Card */}
      {selectedCustomer && (selectedCustomer.loyalty_points ?? 0) > 0 && !appliedDiscount && (
        <View style={styles.loyaltyCard}>
          <View style={styles.loyaltyCardHeader}>
            <View style={styles.loyaltyCardIconWrap}>
              <MaterialCommunityIcons name="star-circle" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={styles.loyaltyCardTitle}>
                Redeem Loyalty Points
              </Text>
              <Text variant="bodySmall" style={styles.loyaltyCardSubtitle}>
                Available: {Number(selectedCustomer.loyalty_points).toLocaleString('id-ID')} pts (Max: {Math.floor(maxLoyalty)})
              </Text>
            </View>
            <Switch
              value={useLoyalty}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setUseLoyalty(val);
                if (val) setLoyaltyInput(String(Math.floor(maxLoyalty)));
                else setLoyaltyInput('');
              }}
              color="#547792"
            />
          </View>

          {useLoyalty && (
            <View style={styles.loyaltyInputRow}>
              <View style={styles.loyaltyInputWrap}>
                <TextInput
                  value={loyaltyInput}
                  onChangeText={(val) => {
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) {
                      setLoyaltyInput(String(Math.min(num, Math.floor(maxLoyalty))));
                    } else {
                      setLoyaltyInput(val);
                    }
                  }}
                  keyboardType="number-pad"
                  mode="outlined"
                  dense
                  placeholder="0"
                  style={styles.loyaltyTextInput}
                  right={<TextInput.Affix text="pts" />}
                />
              </View>
              <Button
                mode="outlined"
                compact
                onPress={handleApplyMaxLoyalty}
                style={styles.loyaltyMaxBtn}
                labelStyle={{ fontSize: 12, fontWeight: '700' }}
              >
                MAX
              </Button>
              {loyaltyRedeemed > 0 && (
                <Text style={styles.loyaltySavedText}>
                  -{formatCurrency(loyaltyRedeemed)}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Order-Level Discount Card */}
      <View style={styles.discountCard}>
        {appliedDiscount ? (
          <View style={styles.discountAppliedRow}>
            <View style={styles.discountIconWrap}>
              <MaterialCommunityIcons name="tag-check" size={18} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={styles.discountAppliedTitle}>
                Order Discount Applied
              </Text>
              <Text variant="bodySmall" style={styles.discountAppliedMeta}>
                {appliedDiscount.type === 'fixed'
                  ? formatCurrency(appliedDiscount.amount)
                  : `${appliedDiscount.amount}% off`}{' '}
                · Supervisor Authorized
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onRemoveDiscount();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addDiscountOutlineBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onOpenDiscount();
            }}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons name="tag-outline" size={18} color="#547792" />
            <Text style={styles.addDiscountOutlineText}>+ Apply Order Discount</Text>
            <View style={styles.supervisorRequiredBadge}>
              <MaterialCommunityIcons name="shield-lock-outline" size={12} color="#64748B" />
              <Text style={styles.supervisorRequiredText}>Supervisor</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Collapsible Order Notes */}
      <View style={styles.notesContainer}>
        {showNotes ? (
          <View style={styles.notesInputWrap}>
            <RNTextInput
              style={styles.notesTextInput}
              placeholder="Add order note (e.g. Table 4, less sugar, takeaway)..."
              placeholderTextColor="#94A3B8"
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={120}
            />
            <TouchableOpacity
              style={styles.notesCloseBtn}
              onPress={() => setShowNotes(false)}
            >
              <MaterialCommunityIcons name="check" size={18} color="#547792" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.notesToggleBtn}
            onPress={() => setShowNotes(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="note-text-outline" size={16} color="#547792" />
            <Text style={styles.notesToggleText}>
              {notes ? `Note: "${notes}"` : 'Add order note / table'}
            </Text>
            {notes ? (
              <TouchableOpacity
                onPress={() => setNotes('')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <MaterialCommunityIcons name="close" size={14} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        )}
      </View>

      {/* Items Section Header */}
      {items.length > 0 && (
        <View style={styles.itemsSectionHeader}>
          <Text variant="titleSmall" style={styles.itemsSectionTitle}>
            Cart Items
          </Text>
          <View style={styles.itemsCountBadge}>
            <Text style={styles.itemsCountBadgeText}>{itemCount} pcs</Text>
          </View>
        </View>
      )}
    </View>
  );

  // ── Footer: Order Summary Breakdown ────────────────────────────────────────
  const renderListFooter = () => {
    if (items.length === 0) return null;

    return (
      <View style={styles.summaryCard}>
        <Text variant="titleSmall" style={styles.summaryCardTitle}>
          Order Summary
        </Text>

        <View style={styles.summaryRow}>
          <Text variant="bodyMedium" style={styles.summaryLabel}>
            Subtotal ({itemCount} items)
          </Text>
          <Text variant="bodyMedium" style={styles.summaryValue}>
            {formatCurrency(subtotal)}
          </Text>
        </View>

        {appliedDiscount && (
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium" style={[styles.summaryLabel, { color: '#16A34A' }]}>
              Discount ({appliedDiscount.type === 'fixed' ? 'Fixed' : `${appliedDiscount.amount}%`})
            </Text>
            <Text variant="bodyMedium" style={[styles.summaryValue, { color: '#16A34A' }]}>
              -{formatCurrency(discountValue)}
            </Text>
          </View>
        )}

        {loyaltyRedeemed > 0 && (
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium" style={[styles.summaryLabel, { color: '#D97706' }]}>
              Loyalty Points Redeemed
            </Text>
            <Text variant="bodyMedium" style={[styles.summaryValue, { color: '#D97706' }]}>
              -{formatCurrency(loyaltyRedeemed)}
            </Text>
          </View>
        )}

        {estimatedPts > 0 && (
          <View style={styles.estimatedPointsRow}>
            <MaterialCommunityIcons name="star-outline" size={15} color="#D97706" />
            <Text style={styles.estimatedPointsText}>
              Customer will earn +{estimatedPts} loyalty points
            </Text>
          </View>
        )}

        <View style={styles.summaryDivider} />

        <View style={styles.summaryTotalRow}>
          <Text variant="titleMedium" style={styles.summaryTotalLabel}>
            Total Payable
          </Text>
          <Text variant="headlineSmall" style={styles.summaryTotalValue}>
            {formatCurrency(finalTotal)}
          </Text>
        </View>
      </View>
    );
  };

  // ── Empty Cart State ────────────────────────────────────────────────────────
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <MaterialCommunityIcons name="cart-outline" size={44} color="#94B4C1" />
      </View>
      <Text variant="titleMedium" style={styles.emptyTitle}>
        Your cart is empty
      </Text>
      <Text variant="bodySmall" style={styles.emptySubtitle}>
        Add items from the catalog or scan barcodes to begin an order.
      </Text>
      <Button
        mode="contained"
        icon="view-grid-plus-outline"
        onPress={onBrowseProducts}
        style={styles.emptyBrowseBtn}
        labelStyle={{ fontWeight: '700' }}
      >
        Browse Products
      </Button>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Top Cart Sub-Header */}
      <View style={styles.cartTopBar}>
        <View style={styles.cartTitleRow}>
          <Text variant="titleMedium" style={styles.cartBarTitle}>
            Cart
          </Text>
          {itemCount > 0 && (
            <Badge style={styles.cartBadge} size={20}>
              {itemCount}
            </Badge>
          )}
        </View>

        <View style={styles.cartActionsRow}>
          {items.length > 0 && (
            <TouchableOpacity
              style={styles.cartActionBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onHoldCart();
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="pause-circle-outline" size={18} color="#547792" />
              <Text style={styles.cartActionBtnText}>Hold</Text>
            </TouchableOpacity>
          )}

          {items.length > 0 && (
            <TouchableOpacity
              style={[styles.cartActionBtn, styles.cartActionBtnDanger]}
              onPress={handleClearCartPrompt}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
              <Text style={styles.cartActionBtnDangerText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cart Items List */}
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.product_id)}
        renderItem={({ item }) => (
          <CartItemCard
            item={item}
            onRemove={removeItem}
            onQtyChange={updateQuantity}
          />
        )}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderListFooter}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      {/* Sticky Bottom Order Bar */}
      {items.length > 0 && (
        <View style={styles.stickyBottomBar}>
          <Button
            mode="contained"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onPlaceOrder();
            }}
            loading={isPlacingOrder}
            disabled={isPlacingOrder || !shift}
            style={styles.checkoutBtn}
            contentStyle={styles.checkoutBtnContent}
          >
            <View style={styles.checkoutBtnInner}>
              <View style={styles.checkoutBtnLeft}>
                <MaterialCommunityIcons name="credit-card-outline" size={20} color="#FFFFFF" />
                <Text style={styles.checkoutBtnLabel}>Proceed to Payment</Text>
              </View>
              <Text style={styles.checkoutBtnTotal}>{formatCurrency(finalTotal)}</Text>
            </View>
          </Button>

          {!shift && (
            <View style={styles.shiftWarningRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#EF4444" />
              <Text style={styles.shiftWarningText}>
                Active shift required to place order
              </Text>
            </View>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  listContentContainer: {
    paddingBottom: 24,
  },

  // Top Bar
  cartTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  cartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartBarTitle: {
    fontWeight: '800',
    color: '#213448',
    fontSize: 17,
  },
  cartBadge: {
    backgroundColor: '#547792',
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cartActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cartActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#547792',
  },
  cartActionBtnDanger: {
    backgroundColor: '#FEF2F2',
  },
  cartActionBtnDangerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },

  // List Header Wrapper
  listHeaderWrapper: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },

  // Customer Member Card
  memberCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  memberCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  memberName: {
    fontWeight: '700',
    color: '#213448',
    fontSize: 14,
  },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  memberSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberPhone: {
    color: '#64748B',
    fontSize: 12,
  },
  memberPointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    gap: 3,
  },
  memberPointsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  memberRemoveBtn: {
    padding: 4,
  },

  // Customer Search Bar
  customerSearchContainer: {
    marginBottom: 10,
    zIndex: 10,
  },
  customerSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  customerSearchInput: {
    flex: 1,
    height: 40,
    fontSize: 13,
    color: '#213448',
  },
  customerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDF3F7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  customerAddBtnText: {
    color: '#547792',
    fontSize: 12,
    fontWeight: '700',
  },
  customerDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 5,
  },
  customerDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  custItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  custItemAvatarText: {
    fontWeight: '700',
    fontSize: 13,
  },
  custItemInfo: {
    flex: 1,
  },
  custItemName: {
    fontWeight: '700',
    color: '#213448',
    fontSize: 13,
  },
  custItemPhone: {
    color: '#64748B',
    fontSize: 11,
  },
  custItemPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  custItemPointsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  customerDropdownEmpty: {
    padding: 12,
    alignItems: 'center',
  },
  customerDropdownEmptyText: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 6,
  },
  quickCreateInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  quickCreateInlineText: {
    color: '#547792',
    fontWeight: '700',
    fontSize: 12,
  },

  // Modal Card
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCardWrapper: {
    width: '100%',
    maxWidth: 400,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontWeight: '800',
    color: '#213448',
  },
  modalInput: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },

  // Loyalty Card
  loyaltyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  loyaltyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loyaltyCardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loyaltyCardTitle: {
    fontWeight: '700',
    color: '#213448',
    fontSize: 13,
  },
  loyaltyCardSubtitle: {
    color: '#64748B',
    fontSize: 11,
  },
  loyaltyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  loyaltyInputWrap: {
    flex: 1,
  },
  loyaltyTextInput: {
    backgroundColor: '#FFFFFF',
    height: 38,
  },
  loyaltyMaxBtn: {
    borderColor: '#D97706',
    borderRadius: 8,
  },
  loyaltySavedText: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: 13,
  },

  // Discount Card
  discountCard: {
    marginBottom: 10,
  },
  discountAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  discountIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountAppliedTitle: {
    fontWeight: '700',
    color: '#166534',
    fontSize: 13,
  },
  discountAppliedMeta: {
    color: '#15803D',
    fontSize: 11,
  },
  addDiscountOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  addDiscountOutlineText: {
    color: '#547792',
    fontWeight: '700',
    fontSize: 13,
  },
  supervisorRequiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
    marginLeft: 6,
  },
  supervisorRequiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },

  // Notes
  notesContainer: {
    marginBottom: 10,
  },
  notesToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  notesToggleText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  notesInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  notesTextInput: {
    flex: 1,
    fontSize: 12,
    color: '#213448',
    minHeight: 36,
  },
  notesCloseBtn: {
    padding: 6,
  },

  // Items Section Header
  itemsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 2,
    marginBottom: 4,
  },
  itemsSectionTitle: {
    fontWeight: '800',
    color: '#213448',
    fontSize: 14,
  },
  itemsCountBadge: {
    backgroundColor: '#EDF3F7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  itemsCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#547792',
  },

  // Item Card
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginHorizontal: 14,
    marginBottom: 8,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  itemThumb: {
    width: 46,
    height: 46,
    borderRadius: 8,
  },
  itemThumbPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontWeight: '700',
    color: '#1E293B',
    fontSize: 13,
    marginBottom: 2,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  itemUnitPrice: {
    color: '#64748B',
    fontSize: 12,
  },
  itemDiscountBadge: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  itemDiscountBadgeText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  itemLineTotal: {
    fontWeight: '800',
    color: '#213448',
    fontSize: 13,
  },

  // Stepper
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 4,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  stepperBtnDanger: {
    backgroundColor: '#FEF2F2',
  },
  stepperQtyText: {
    minWidth: 20,
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 13,
    color: '#213448',
  },

  // Swipe Delete
  swipeDeleteAction: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
    borderRadius: 12,
    marginBottom: 8,
    marginRight: 14,
  },
  swipeDeleteText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginHorizontal: 14,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryCardTitle: {
    fontWeight: '800',
    color: '#213448',
    fontSize: 14,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  summaryValue: {
    fontWeight: '600',
    color: '#213448',
    fontSize: 13,
  },
  estimatedPointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
    marginBottom: 6,
  },
  estimatedPointsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTotalLabel: {
    fontWeight: '800',
    color: '#213448',
    fontSize: 15,
  },
  summaryTotalValue: {
    fontWeight: '900',
    color: '#213448',
    fontSize: 19,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EDF3F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: '800',
    color: '#213448',
    fontSize: 17,
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#64748B',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyBrowseBtn: {
    borderRadius: 10,
    backgroundColor: '#547792',
    paddingHorizontal: 12,
  },

  // Bottom Sticky Bar
  stickyBottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 6,
  },
  checkoutBtn: {
    backgroundColor: '#213448',
    borderRadius: 12,
  },
  checkoutBtnContent: {
    paddingVertical: 6,
  },
  checkoutBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  checkoutBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkoutBtnLabel: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  checkoutBtnTotal: {
    color: '#ECEFCA',
    fontWeight: '900',
    fontSize: 16,
  },
  shiftWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 6,
  },
  shiftWarningText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '600',
  },
});
