/**
 * Tests for the Axios client's request and response interceptors.
 *
 * Strategy: use axios-mock-adapter to simulate server responses and verify
 * that the interceptors behave correctly (attach auth header, handle 401, normalise errors).
 */
import AxiosMockAdapter from 'axios-mock-adapter';
import * as SecureStore from 'expo-secure-store';
import { resetTo } from '../../navigation/navigationRef';

// Import the configured client AFTER mocks are in place
import client from '../client';

const mockAxios = new AxiosMockAdapter(client);

beforeEach(() => {
  mockAxios.reset();
  jest.clearAllMocks();
});

afterAll(() => {
  mockAxios.restore();
});

// ─── Request interceptor ──────────────────────────────────────────────────────

describe('client – request interceptor', () => {
  it('attaches Authorization header when a token is stored', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce('stored-token');
    mockAxios.onGet('/test').reply(200, { ok: true });

    const response = await client.get('/test');

    expect(response.config.headers['Authorization']).toBe('Bearer stored-token');
  });

  it('does NOT add Authorization header when no token is stored', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(null);
    mockAxios.onGet('/test').reply(200, { ok: true });

    const response = await client.get('/test');

    expect(response.config.headers['Authorization']).toBeUndefined();
  });
});

// ─── Response interceptor ─────────────────────────────────────────────────────

describe('client – response interceptor (error handling)', () => {
  it('passes through successful responses unchanged', async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);
    mockAxios.onGet('/ok').reply(200, { result: 'success' });

    const response = await client.get('/ok');

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ result: 'success' });
  });

  it('clears the stored token and navigates to Auth on 401', async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.deleteItemAsync.mockResolvedValue(undefined);
    mockAxios.onGet('/protected').reply(401, { message: 'Unauthenticated.' });

    await expect(client.get('/protected')).rejects.toBeDefined();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
    expect(resetTo).toHaveBeenCalledWith('Auth');
  });

  it('uses the server message from response data when available', async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);
    mockAxios.onPost('/fail').reply(422, {
      message: 'Validation failed.',
      errors: { email: ['Email is required.'] },
    });

    const error = await client.post('/fail').catch((e) => e);

    expect(error.message).toBe('Validation failed.');
    expect(error.errors).toEqual({ email: ['Email is required.'] });
  });

  it('returns a generic network error message for network failures', async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);
    mockAxios.onGet('/nonet').networkError();

    const error = await client.get('/nonet').catch((e) => e);

    expect(error.message).toMatch(/Unable to connect|network/i);
  });

  it('returns a timeout message for aborted requests', async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);
    mockAxios.onGet('/slow').timeout();

    const error = await client.get('/slow').catch((e) => e);

    expect(error.message).toMatch(/timed out|timeout/i);
  });

  it('falls back to a generic message when no server message is provided', async () => {
    SecureStore.getItemAsync.mockResolvedValue(null);
    mockAxios.onDelete('/item').reply(500, {});

    const error = await client.delete('/item').catch((e) => e);

    expect(typeof error.message).toBe('string');
    expect(error.message.length).toBeGreaterThan(0);
  });
});
