import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const useAuthStore = create((set) => ({
  token: null,
  user: null, // { id, name, email, phone, roles, permissions }
  tenant: null, // { id, name, slug, email, plan, status, subscription_status, trial_ends_at }
  outlet: null, // { id, name, code, is_active }
  permissions: [],
  isInitialized: false,

  /** Restore token from SecureStore on app boot. */
  initialize: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    set({ token: token ?? null, isInitialized: true });
  },

  setAuth: async (token, user, extra = {}) => {
    await SecureStore.setItemAsync('auth_token', token);
    set({
      token,
      user,
      tenant: extra?.tenant ?? null,
      outlet: extra?.outlet ?? null,
      permissions: user?.permissions ?? [],
    });
  },

  setUser: (user) => {
    set({ user, permissions: user?.permissions ?? [] });
  },

  setTenant: (tenant) => {
    set({ tenant });
  },

  setOutlet: (outlet) => {
    set({ outlet });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ token: null, user: null, tenant: null, outlet: null, permissions: [] });
  },

  /** Check if user has a specific permission */
  hasPermission: (permission) => {
    const state = useAuthStore.getState();
    return state.permissions.includes(permission);
  },
}));

export default useAuthStore;
