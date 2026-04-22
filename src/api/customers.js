import client from './client';

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
