import client from './client';

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('../types/auth').LoginResponse>}
 */
export async function login(email, password) {
  const response = await client.post('/auth/login', { email, password });
  return response.data;
}

/**
 * @param {string} pin
 * @returns {Promise<import('../types/auth').LoginResponse>}
 */
export async function loginPin(pin) {
  const response = await client.post('/auth/login-pin', { pin });
  return response.data;
}

/** @returns {Promise<void>} */
export async function logout() {
  await client.post('/auth/logout');
}

/**
 * Fetch the current authenticated user's profile (roles/permissions).
 * @returns {Promise<{ data: import('../types/auth').User }>}
 */
export async function getMe() {
  const response = await client.get('/auth/me');
  return response.data;
}

/**
 * @param {Partial<import('../types/auth').ProfileData>} data
 * @returns {Promise<import('../types/auth').User>}
 */
export async function updateProfile(data) {
  const response = await client.put('/auth/profile', data);
  return response.data;
}

/**
 * @param {import('../types/auth').ChangePasswordData} data
 * @returns {Promise<void>}
 */
export async function changePassword(data) {
  await client.put('/auth/password', data);
}
