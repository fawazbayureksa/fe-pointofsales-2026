import client from './client';

/**
 * @param {{ search?: string, all?: boolean, per_page?: number, page?: number }} [params]
 */
export const getOutlets = async (params = {}) => {
  const { data } = await client.get('/outlets', { params });
  return data.data ?? data;
};

/**
 * @param {number} id
 */
export const getOutlet = async (id) => {
  const { data } = await client.get(`/outlets/${id}`);
  return data.data ?? data;
};
