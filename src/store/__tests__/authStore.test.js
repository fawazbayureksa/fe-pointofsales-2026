import * as SecureStore from 'expo-secure-store';
import useAuthStore from '../authStore';

const INITIAL_STATE = { token: null, user: null, isInitialized: false };

beforeEach(() => {
  useAuthStore.setState(INITIAL_STATE);
  jest.clearAllMocks();
});

describe('authStore – initialize', () => {
  it('sets token from SecureStore and marks isInitialized=true', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce('test-token-123');
    await useAuthStore.getState().initialize();
    const state = useAuthStore.getState();
    expect(state.token).toBe('test-token-123');
    expect(state.isInitialized).toBe(true);
  });

  it('sets token to null when SecureStore returns null', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(null);
    await useAuthStore.getState().initialize();
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.isInitialized).toBe(true);
  });

  it('reads from the correct SecureStore key "auth_token"', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(null);
    await useAuthStore.getState().initialize();
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('auth_token');
  });
});

describe('authStore – setAuth', () => {
  it('persists token to SecureStore and updates state', async () => {
    SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
    const user = { id: 1, name: 'Alice', email: 'alice@example.com' };
    await useAuthStore.getState().setAuth('my-token', user);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('auth_token', 'my-token');
    const state = useAuthStore.getState();
    expect(state.token).toBe('my-token');
    expect(state.user).toEqual(user);
  });

  it('stores tenant and outlet if provided in extra options', async () => {
    SecureStore.setItemAsync.mockResolvedValueOnce(undefined);
    const user = { id: 1, name: 'Budi Santoso', email: 'budi@kopinusantara.id' };
    const tenant = { id: 1, name: 'Kopi Nusantara', plan: 'professional' };
    const outlet = { id: 1, name: 'Main Outlet', code: 'MAIN' };

    await useAuthStore.getState().setAuth('token-123', user, { tenant, outlet });

    const state = useAuthStore.getState();
    expect(state.token).toBe('token-123');
    expect(state.user).toEqual(user);
    expect(state.tenant).toEqual(tenant);
    expect(state.outlet).toEqual(outlet);
  });
});

describe('authStore – clearAuth', () => {
  it('deletes the token from SecureStore and clears state including tenant and outlet', async () => {
    useAuthStore.setState({
      token: 'existing-token',
      user: { id: 1 },
      tenant: { id: 1, name: 'Test' },
      outlet: { id: 1, name: 'Main' },
      isInitialized: true,
    });
    SecureStore.deleteItemAsync.mockResolvedValueOnce(undefined);

    await useAuthStore.getState().clearAuth();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.tenant).toBeNull();
    expect(state.outlet).toBeNull();
  });
});
