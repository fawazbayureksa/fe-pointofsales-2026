import client from './client';

/** @returns {Promise<{shift: object|null}>} */
export const getCurrentShift = async () => {
  const { data } = await client.get('/shifts/current');
  return data;
};

/**
 * @param {{ outlet_id: number, starting_cash: number|string, notes?: string }} payload
 */
export const startShift = async (payload) => {
  const { data } = await client.post('/shifts/start', payload);
  return data.data ?? data;
};

/**
 * @param {{ ending_cash: number|string, notes?: string }} payload
 */
export const endShift = async (payload) => {
  const { data } = await client.post('/shifts/end', payload);
  return data.data ?? data;
};
