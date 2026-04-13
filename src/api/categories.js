import client from './client';

/**
 * @param {import('../types/category').CategoryQueryParams} [params]
 * @returns {Promise<any>}
 */
export const getCategories = async (params = {}) => {
  const { data } = await client.get('/categories', { params });
  return data.data ?? data;
};

/**
 * @param {number} id
 * @returns {Promise<import('../types/category').Category>}
 */
export const getCategory = async (id) => {
  const { data } = await client.get(`/categories/${id}`);
  return data.data ?? data;
};

/**
 * @param {import('../types/category').CreateCategoryData} payload
 * @returns {Promise<import('../types/category').Category>}
 */
export const createCategory = async (payload) => {
  const { data } = await client.post('/categories', payload);
  return data.data ?? data;
};

/**
 * @param {number} id
 * @param {import('../types/category').UpdateCategoryData} payload
 * @returns {Promise<import('../types/category').Category>}
 */
export const updateCategory = async (id, payload) => {
  const { data } = await client.put(`/categories/${id}`, payload);
  return data.data ?? data;
};

/**
 * @param {number} id
 * @returns {Promise<void>}
 */
export const deleteCategory = async (id) => {
  await client.delete(`/categories/${id}`);
};
