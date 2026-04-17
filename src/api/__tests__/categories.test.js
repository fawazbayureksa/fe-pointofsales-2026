import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../categories';
import client from '../client';

jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

describe('categories API – getCategories', () => {
  it('gets /categories and returns data.data when present', async () => {
    const inner = [{ id: 1, name: 'Beverages' }];
    client.get.mockResolvedValueOnce({ data: { data: inner } });

    const result = await getCategories();

    expect(client.get).toHaveBeenCalledWith('/categories', { params: {} });
    expect(result).toEqual(inner);
  });

  it('falls back to data when data.data is absent', async () => {
    const flat = [{ id: 2, name: 'Food' }];
    client.get.mockResolvedValueOnce({ data: flat });

    const result = await getCategories();

    expect(result).toEqual(flat);
  });

  it('forwards query params', async () => {
    client.get.mockResolvedValueOnce({ data: { data: [] } });
    await getCategories({ all: true });
    expect(client.get).toHaveBeenCalledWith('/categories', { params: { all: true } });
  });
});

describe('categories API – getCategory', () => {
  it('gets /categories/:id and returns data.data when present', async () => {
    const cat = { id: 1, name: 'Beverages', parent_id: null };
    client.get.mockResolvedValueOnce({ data: { data: cat } });

    const result = await getCategory(1);

    expect(client.get).toHaveBeenCalledWith('/categories/1');
    expect(result).toEqual(cat);
  });
});

describe('categories API – createCategory', () => {
  it('posts to /categories and returns data.data', async () => {
    const payload = { name: 'Snacks' };
    const created = { id: 5, ...payload };
    client.post.mockResolvedValueOnce({ data: { data: created } });

    const result = await createCategory(payload);

    expect(client.post).toHaveBeenCalledWith('/categories', payload);
    expect(result).toEqual(created);
  });
});

describe('categories API – updateCategory', () => {
  it('puts to /categories/:id and returns data.data', async () => {
    const payload = { name: 'Snacks Updated' };
    const updated = { id: 5, name: 'Snacks Updated' };
    client.put.mockResolvedValueOnce({ data: { data: updated } });

    const result = await updateCategory(5, payload);

    expect(client.put).toHaveBeenCalledWith('/categories/5', payload);
    expect(result).toEqual(updated);
  });
});

describe('categories API – deleteCategory', () => {
  it('deletes /categories/:id', async () => {
    client.delete.mockResolvedValueOnce({});

    await deleteCategory(5);

    expect(client.delete).toHaveBeenCalledWith('/categories/5');
  });
});
