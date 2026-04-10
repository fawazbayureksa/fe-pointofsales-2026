import client from './client';

/**
 * @param {{ product_id?: number, outlet_id?: number, type?: string, date_from?: string, date_to?: string, page?: number, per_page?: number }} [params]
 */
export const getStockMovements = async (params = {}) => {
  const { data } = await client.get('/stock/movements', { params });
  return data;
};

/**
 * @param {{ product_id: number, outlet_id: number, quantity_change: number, reason?: string }} payload
 */
export const adjustStock = async (payload) => {
  const { data } = await client.post('/stock/adjust', payload);
  return data.data ?? data;
};
