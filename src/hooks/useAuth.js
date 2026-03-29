import { useState } from 'react';
import useAuthStore from '../store/authStore';
import * as authApi from '../api/auth';

/**
 * Convenience hook that wraps authStore state with API-calling actions.
 *
 * @returns {{ user: import('../types/auth').User|null, token: string|null, login: Function, logout: Function, isLoading: boolean }}
 */
export default function useAuth() {
  const { token, user, setAuth, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Call the login API and persist the returned token + user.
   * Throws a standardised error object { message, errors } on failure.
   */
  async function login(email, password) {
    setIsLoading(true);
    try {
      const data = await authApi.login(email, password);
      await setAuth(data.token, data.user);
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

  return { user, token, login, logout, isLoading };
}
