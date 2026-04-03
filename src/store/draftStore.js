import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useCartStore from './cartStore';

const MAX_DRAFTS = 5;

/**
 * @typedef {Object} Draft
 * @property {string} id
 * @property {string} label
 * @property {Array} cart
 * @property {number|null} customerId
 * @property {string|null} customerName
 * @property {string} savedAt
 */

const useDraftStore = create(
  persist(
    (set, get) => ({
      /** @type {Draft[]} */
      drafts: [],

      /**
       * Save current cart as a draft.
       * @param {Array} cart
       * @param {number|null} customerId
       * @param {string|null} customerName
       * @param {string} [label]
       */
      saveDraft: (cart, customerId, customerName, label) => {
        set((state) => {
          const draftNum = state.drafts.length + 1;
          const newDraft = {
            id: Date.now().toString(),
            label: label || `Draft ${draftNum}`,
            cart: cart.slice(),
            customerId: customerId ?? null,
            customerName: customerName ?? null,
            savedAt: new Date().toISOString(),
          };
          return { drafts: [newDraft, ...state.drafts].slice(0, MAX_DRAFTS) };
        });
      },

      /**
       * Restore a draft into cartStore.
       * Merges if cart has items, replaces if empty.
       * @param {string} id
       */
      restoreDraft: (id) => {
        const draft = get().drafts.find((d) => d.id === id);
        if (!draft) return;
        const { items } = useCartStore.getState();
        if (items.length === 0) {
          useCartStore.setState({
            items: draft.cart,
            customerId: draft.customerId,
            customerName: draft.customerName,
          });
        } else {
          const merged = [...items];
          for (const di of draft.cart) {
            const idx = merged.findIndex((i) => i.product_id === di.product_id);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], quantity: merged[idx].quantity + di.quantity };
            } else {
              merged.push({ ...di });
            }
          }
          useCartStore.setState({ items: merged });
        }
        set((state) => ({ drafts: state.drafts.filter((d) => d.id !== id) }));
      },

      /**
       * Delete a draft without restoring.
       * @param {string} id
       */
      deleteDraft: (id) =>
        set((state) => ({ drafts: state.drafts.filter((d) => d.id !== id) })),
    }),
    {
      name: 'pos_drafts',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useDraftStore;
