import { register, login, logout, getMe, updateProfile, changePassword } from '../auth';
import client from '../client';

jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

describe('auth API – register', () => {
  it('posts to /auth/register and returns 201 response payload', async () => {
    const mockResponse = {
      message: 'Tenant registered successfully.',
      token: '1|abcdefghijk...',
      user: {
        id: 1,
        name: 'Budi Santoso',
        email: 'budi@kopinusantara.id',
        phone: '081234567890',
        roles: ['tenant_admin'],
        has_pin: false,
      },
      tenant: {
        id: 1,
        name: 'Kopi Nusantara',
        slug: 'kopi-nusantara',
        email: 'budi@kopinusantara.id',
        plan: 'professional',
        status: 'active',
        subscription_status: 'trial',
        trial_ends_at: '2026-11-04T01:53:05.000000Z',
      },
      outlet: {
        id: 1,
        name: 'Main Outlet',
        code: 'MAIN',
        is_active: true,
      },
    };
    client.post.mockResolvedValueOnce({ data: mockResponse });

    const payload = {
      name: 'Budi Santoso',
      business_name: 'Kopi Nusantara',
      email: 'budi@kopinusantara.id',
      password: 'password123',
      password_confirmation: 'password123',
      phone: '081234567890',
    };

    const result = await register(payload);

    expect(client.post).toHaveBeenCalledWith('/auth/register', payload);
    expect(result).toEqual(mockResponse);
  });

  it('propagates 422 validation rejection from the client', async () => {
    const errPayload = {
      status: 422,
      message: 'The email has already been taken.',
      errors: {
        email: ['The email has already been taken.'],
      },
    };
    client.post.mockRejectedValueOnce(errPayload);

    await expect(
      register({
        name: 'Budi Santoso',
        email: 'taken@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      }),
    ).rejects.toMatchObject(errPayload);
  });
});

describe('auth API – login', () => {
  it('posts to /auth/login and returns response data', async () => {
    const mockData = { token: 'abc123', user: { id: 1, name: 'Admin' } };
    client.post.mockResolvedValueOnce({ data: mockData });

    const result = await login('admin@example.com', 'secret');

    expect(client.post).toHaveBeenCalledWith('/auth/login', {
      email: 'admin@example.com',
      password: 'secret',
    });
    expect(result).toEqual(mockData);
  });

  it('propagates rejection from the client', async () => {
    client.post.mockRejectedValueOnce({ message: 'Invalid credentials', errors: {} });
    await expect(login('bad@example.com', 'wrong')).rejects.toMatchObject({
      message: 'Invalid credentials',
    });
  });
});

describe('auth API – logout', () => {
  it('posts to /auth/logout', async () => {
    client.post.mockResolvedValueOnce({});
    await logout();
    expect(client.post).toHaveBeenCalledWith('/auth/logout');
  });
});

describe('auth API – getMe', () => {
  it('gets /auth/me and returns response data', async () => {
    const user = { id: 1, name: 'Alice', email: 'alice@example.com' };
    client.get.mockResolvedValueOnce({ data: user });

    const result = await getMe();

    expect(client.get).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual(user);
  });
});

describe('auth API – updateProfile', () => {
  it('puts to /auth/profile and returns response data', async () => {
    const payload = { name: 'Bob', phone: '08123456789' };
    const updated = { id: 1, ...payload };
    client.put.mockResolvedValueOnce({ data: updated });

    const result = await updateProfile(payload);

    expect(client.put).toHaveBeenCalledWith('/auth/profile', payload);
    expect(result).toEqual(updated);
  });
});

describe('auth API – changePassword', () => {
  it('puts to /auth/password', async () => {
    const payload = { current_password: 'old', password: 'new', password_confirmation: 'new' };
    client.put.mockResolvedValueOnce({});

    await changePassword(payload);

    expect(client.put).toHaveBeenCalledWith('/auth/password', payload);
  });
});
