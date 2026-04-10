import client from './client';

/**
 * @param {{ payment_method?: string, status?: string, date_from?: string, date_to?: string, page?: number, per_page?: number }} [params]
 */
export const getPayments = async (params = {}) => {
  const { data } = await client.get('/payments', { params });
  return data;
};

/** @param {number} id */
export const getPayment = async (id) => {
  const { data } = await client.get(`/payments/${id}`);
  return data.data ?? data;
};
