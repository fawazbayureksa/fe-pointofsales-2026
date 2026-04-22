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
 * Build a FormData body when `data.image` is a local file URI,
 * otherwise fall back to a plain JSON-serialisable object.
 *
 * @param {object} data
 * @returns {{ body: FormData | object, isMultipart: boolean }}
 */
function buildProductBody(data) {
  const { image, ...rest } = data;

  if (image && typeof image === 'string' && !image.startsWith('http')) {
    // Local URI from image picker – send as multipart
    const fd = new FormData();

    Object.entries(rest).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });

    const filename = image.split('/').pop();
    const ext = filename?.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    fd.append('image', { uri: image, name: filename ?? 'image.jpg', type: mime });

    return { body: fd, isMultipart: true };
  }

  return { body: data, isMultipart: false };
}

/**
 * @param {import('../types/product').CreateProductData} data
 * @returns {Promise<import('../types/product').Product>}
 */
export async function createProduct(data) {
  const { body, isMultipart } = buildProductBody(data);
  const response = await client.post('/products', body, {
    headers: isMultipart ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
  return response.data;
}

/**
 * @param {number} id
 * @param {import('../types/product').UpdateProductData} data
 * @returns {Promise<import('../types/product').Product>}
 */
export async function updateProduct(id, data) {
  const { body, isMultipart } = buildProductBody(data);
  const response = await client.put(`/products/${id}`, body, {
    headers: isMultipart ? { 'Content-Type': 'multipart/form-data' } : undefined,
  });
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

/**
 * Lookup a product by barcode.
 * @param {string} barcode
 * @returns {Promise<import('../types/product').Product>}
 */
export async function getProductByBarcode(barcode) {
  const response = await client.get(`/products/barcode/${encodeURIComponent(barcode)}`);
  return response.data.data ?? response.data;
}
