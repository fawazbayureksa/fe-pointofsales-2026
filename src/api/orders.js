import client from './client';

/**
 * @param {import('../types/order').OrderQueryParams} [params]
 */
export const getOrders = async (params = {}) => {
  const { data } = await client.get('/orders', { params });
  return data;
};

/**
 * @param {number} id
 * @returns {Promise<import('../types/order').OrderDetail>}
 */
export const getOrder = async (id) => {
  const { data } = await client.get(`/orders/${id}`);
  return data.data ?? data;
};

/**
 * @param {import('../types/order').CreateOrderData} payload
 * @returns {Promise<import('../types/order').Order>}
 */
export const createOrder = async (payload) => {
  const { data } = await client.post('/orders', payload);
  return data.data ?? data;
};

/**
 * @param {number} id
 * @param {import('../types/order').PayOrderData} payload
 * @returns {Promise<import('../types/order').Payment>}
 */
export const payOrder = async (id, payload) => {
  const { data } = await client.post(`/orders/${id}/pay`, payload);
  return data.data ?? data;
};

/**
 * @param {number} id
 * @param {string} [reason]
 * @returns {Promise<import('../types/order').Order>}
 */
export const cancelOrder = async (id, reason) => {
  const { data } = await client.post(`/orders/${id}/cancel`, reason ? { reason } : {});
  return data.data ?? data;
};

/**
 * @param {number} id
 * @param {{ reason: string, supervisor_id: number }} payload
 */
export const refundOrder = async (id, payload) => {
  const { data } = await client.post(`/orders/${id}/refund`, payload);
  return data.data ?? data;
};

/**
 * @param {number} id
 * @param {{ discount_amount: number, discount_type: 'fixed'|'percentage', supervisor_id: number }} payload
 */
export const applyOrderDiscount = async (id, payload) => {
  const { data } = await client.patch(`/orders/${id}/discount`, payload);
  return data.data ?? data;
};
