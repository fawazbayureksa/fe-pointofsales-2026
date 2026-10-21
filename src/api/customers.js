import client from './client';

/**
 * Paginated customer list.
 * @param {{ search?: string, page?: number, per_page?: number }} [params]
 * @returns {Promise<{ data: Array, current_page: number, last_page: number, total: number }>}
 */
export async function getCustomers(params = {}) {
  const response = await client.get('/customers', { params });
  return response.data;
}

/**
 * Single customer with order history.
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function getCustomer(id) {
  const response = await client.get(`/customers/${id}`);
  return response.data?.data ?? response.data;
}

/**
 * Search customers (uses ?all=true for unpaginated results).
 * @param {string} search
 * @returns {Promise<Array>}
 */
export async function searchCustomers(search) {
  const response = await client.get('/customers', { params: { all: true, search } });
  const data = response.data;
  return Array.isArray(data) ? data : (data?.data ?? []);
}

/**
 * Create a new customer.
 * @param {{ name: string, phone?: string, email?: string }} data
 * @returns {Promise<Object>}
 */
export async function createCustomer(data) {
  const response = await client.post('/customers', data);
  return response.data;
}

/**
 * Update an existing customer. All fields are optional.
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export async function updateCustomer(id, data) {
  const response = await client.put(`/customers/${id}`, data);
  return response.data?.data ?? response.data;
}

/**
 * Soft-delete a customer.
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteCustomer(id) {
  await client.delete(`/customers/${id}`);
}
