import client from './client';

/**
 * @param {{ search?: string, page?: number, per_page?: number }} [params]
 */
export const getCustomers = async (params = {}) => {
  const { data } = await client.get('/customers', { params });
  return data;
};

/** @param {number} id */
export const getCustomer = async (id) => {
  const { data } = await client.get(`/customers/${id}`);
  return data.data ?? data;
};

/** @param {object} payload */
export const createCustomer = async (payload) => {
  const { data } = await client.post('/customers', payload);
  return data.data ?? data;
};

/**
 * @param {number} id
 * @param {object} payload
 */
export const updateCustomer = async (id, payload) => {
  const { data } = await client.put(`/customers/${id}`, payload);
  return data.data ?? data;
};

/** @param {number} id */
export const deleteCustomer = async (id) => {
  await client.delete(`/customers/${id}`);
};
