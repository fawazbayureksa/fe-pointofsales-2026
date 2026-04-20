import { useState } from 'react';
import useAuthStore from '../store/authStore';
import * as authApi from '../api/auth';

/**
 * Convenience hook that wraps authStore state with API-calling actions.
 *
 * @returns {{ user: import('../types/auth').User|null, token: string|null, login: Function, logout: Function, isLoading: boolean }}
 */
export default function useAuth() {
  const { token, user, setAuth, setUser, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Call the login API and persist the returned token + user.
   * Fetches full user (roles/permissions) from /auth/me afterward.
   * Throws a standardised error object { message, errors } on failure.
   */
  async function login(email, password) {
    setIsLoading(true);
    try {
      const data = await authApi.login(email, password);
      await setAuth(data.token, data.user);
      // Fetch full user profile (includes permissions) in background
      try {
        const me = await authApi.getMe();
        setUser(me.data ?? me);
      } catch (_) {
        // non-fatal
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * PIN login (for cashier switch or session re-auth).
   */
  async function loginWithPin(pin) {
    setIsLoading(true);
    try {
      const data = await authApi.loginPin(pin);
      await setAuth(data.token, data.user);
      try {
        const me = await authApi.getMe();
        setUser(me.data ?? me);
      } catch (_) {
        // non-fatal
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Call the logout API (best-effort), then clear local auth state.
   */
  async function logout() {
    setIsLoading(true);
    try {
      await authApi.logout().catch(() => {
        // If the server call fails the token is stale – clear locally anyway
      });
    } finally {
      await clearAuth();
      setIsLoading(false);
    }
  }

  return { user, token, login, loginWithPin, logout, isLoading };
}
