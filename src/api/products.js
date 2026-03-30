import client from './client';

/**
 * @param {import('../types/product').ProductQueryParams} [params]
 * @returns {Promise<import('../types/product').PaginatedResponse<import('../types/product').Product>>}
 */
export async function getProducts(params) {
  const response = await client.get('/products', { params });
  return response.data;
}

/**
 * @param {number} id
 * @returns {Promise<import('../types/product').Product>}
 */
export async function getProduct(id) {
  const response = await client.get(`/products/${id}`);
  return response.data;
}

/**
 * @param {import('../types/product').CreateProductData} data
 * @returns {Promise<import('../types/product').Product>}
 */
export async function createProduct(data) {
  const response = await client.post('/products', data);
  return response.data;
}

/**
 * @param {number} id
 * @param {import('../types/product').UpdateProductData} data
 * @returns {Promise<import('../types/product').Product>}
 */
export async function updateProduct(id, data) {
  const response = await client.put(`/products/${id}`, data);
  return response.data;
}

/**
 * @param {number} id
 * @returns {Promise<void>}
 */
export async function deleteProduct(id) {
  await client.delete(`/products/${id}`);
}

/**
 * Fetch all categories (for filter dropdown).
 * @returns {Promise<Array<{id: number, name: string}>>}
 */
export async function getCategories() {
  const response = await client.get('/categories', { params: { all: true } });
  return response.data;
}
