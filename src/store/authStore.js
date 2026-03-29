import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const useAuthStore = create((set) => ({
  token: null,
  user: null, // { id, name, email, roles, permissions }

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
