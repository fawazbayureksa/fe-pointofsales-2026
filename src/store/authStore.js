import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const useAuthStore = create((set) => ({
  token: null,
  user: null, // { id, name, email, phone, roles, permissions }
  isInitialized: false,

  /** Restore token from SecureStore on app boot. */
  initialize: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    set({ token: token ?? null, isInitialized: true });
  },

  setAuth: async (token, user) => {
    await SecureStore.setItemAsync('auth_token', token);
    set({ token, user });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ token: null, user: null });
  },
}));

export default useAuthStore;
