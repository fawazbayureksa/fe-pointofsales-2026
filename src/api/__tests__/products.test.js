import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from '../products';
import client from '../client';

jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

describe('products API – getProducts', () => {
  it('gets /products and returns response data', async () => {
    const mockData = { data: [], current_page: 1, last_page: 1 };
    client.get.mockResolvedValueOnce({ data: mockData });

    const result = await getProducts();

    expect(client.get).toHaveBeenCalledWith('/products', { params: undefined });
    expect(result).toEqual(mockData);
  });

  it('forwards query params to the client', async () => {
    client.get.mockResolvedValueOnce({ data: {} });
    await getProducts({ page: 2, search: 'coffee' });
    expect(client.get).toHaveBeenCalledWith('/products', {
      params: { page: 2, search: 'coffee' },
    });
  });
});

describe('products API – getProduct', () => {
  it('gets /products/:id and returns response data', async () => {
    const product = { id: 5, name: 'Espresso' };
    client.get.mockResolvedValueOnce({ data: product });

    const result = await getProduct(5);

    expect(client.get).toHaveBeenCalledWith('/products/5');
    expect(result).toEqual(product);
  });
});

describe('products API – createProduct', () => {
  it('posts to /products and returns the created product', async () => {
    const payload = { name: 'Latte', price: 20000, category_id: 1 };
    const created = { id: 10, ...payload };
    client.post.mockResolvedValueOnce({ data: created });

    const result = await createProduct(payload);

    expect(client.post).toHaveBeenCalledWith('/products', payload);
    expect(result).toEqual(created);
  });
});

describe('products API – updateProduct', () => {
  it('puts to /products/:id and returns the updated product', async () => {
    const payload = { price: 22000 };
    const updated = { id: 10, name: 'Latte', price: 22000 };
    client.put.mockResolvedValueOnce({ data: updated });

    const result = await updateProduct(10, payload);

    expect(client.put).toHaveBeenCalledWith('/products/10', payload);
    expect(result).toEqual(updated);
  });
});

describe('products API – deleteProduct', () => {
  it('deletes /products/:id', async () => {
    client.delete.mockResolvedValueOnce({});

    await deleteProduct(10);

    expect(client.delete).toHaveBeenCalledWith('/products/10');
  });
});

describe('products API – getCategories', () => {
  it('gets /categories with all=true and returns response data', async () => {
    const cats = { data: [{ id: 1, name: 'Beverages' }] };
    client.get.mockResolvedValueOnce({ data: cats });

    const result = await getCategories();

    expect(client.get).toHaveBeenCalledWith('/categories', { params: { all: true } });
    expect(result).toEqual(cats);
  });
});
