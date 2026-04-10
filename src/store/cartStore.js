import { create } from 'zustand';

/**
 * @typedef {Object} CartItem
 * @property {number} product_id
 * @property {string} name
 * @property {number} price
 * @property {number} quantity
 * @property {number} discount_amount
 * @property {string|null} image
 */

const DEFAULT_OUTLET_ID = process.env.EXPO_PUBLIC_DEFAULT_OUTLET_ID
  ? Number(process.env.EXPO_PUBLIC_DEFAULT_OUTLET_ID)
  : 1;

const useCartStore = create((set, get) => ({
  /** @type {CartItem[]} */
  items: [],
  outletId: DEFAULT_OUTLET_ID,
  customerId: null,
  customerName: null,
  notes: '',

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** Add product to cart or increment quantity if already present. */
  addItem: (product) => {
    const price = parseFloat(product.price) || 0;
    set((state) => {
      const existing = state.items.find((i) => i.product_id === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            product_id: product.id,
            name: product.name,
            price,
            quantity: 1,
            discount_amount: 0,
            image: product.image ?? null,
          },
        ],
      };
    });
  },

  removeItem: (productId) =>
    set((state) => ({ items: state.items.filter((i) => i.product_id !== productId) })),

  updateQuantity: (productId, qty) =>
    set((state) => {
      if (qty <= 0) {
        return { items: state.items.filter((i) => i.product_id !== productId) };
      }
      return {
        items: state.items.map((i) =>
          i.product_id === productId ? { ...i, quantity: qty } : i,
        ),
      };
    }),

  updateDiscount: (productId, discount) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product_id === productId
          ? { ...i, discount_amount: Math.max(0, discount) }
          : i,
      ),
    })),

  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  setOutlet: (id) => set({ outletId: id }),
  setNotes: (notes) => set({ notes }),

  // ── Order-level discount & loyalty ───────────────────────────────────────────
  orderDiscount: null, // { amount, type: 'fixed'|'percentage', supervisorId, supervisorName }
  loyaltyPointsRedeemed: 0,

  setOrderDiscount: (discount) => set({ orderDiscount: discount }),
  clearOrderDiscount: () => set({ orderDiscount: null }),
  setLoyaltyPointsRedeemed: (pts) => set({ loyaltyPointsRedeemed: pts }),

  clearCart: () =>
    set({
      items: [],
      customerId: null,
      customerName: null,
      notes: '',
      orderDiscount: null,
      loyaltyPointsRedeemed: 0,
    }),
}));

export default useCartStore;
