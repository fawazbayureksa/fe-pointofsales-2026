import { getOrders, getOrder, createOrder, payOrder, cancelOrder } from '../orders';
import client from '../client';

jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

describe('orders API – getOrders', () => {
  it('gets /orders and returns the full response data', async () => {
    const mockData = { data: [], meta: { total: 0 } };
    client.get.mockResolvedValueOnce({ data: mockData });

    const result = await getOrders();

    expect(client.get).toHaveBeenCalledWith('/orders', { params: {} });
    expect(result).toEqual(mockData);
  });

  it('forwards query params', async () => {
    client.get.mockResolvedValueOnce({ data: {} });
    await getOrders({ status: 'pending', page: 2 });
    expect(client.get).toHaveBeenCalledWith('/orders', {
      params: { status: 'pending', page: 2 },
    });
  });
});

describe('orders API – getOrder', () => {
  it('gets /orders/:id and returns data.data when present', async () => {
    const order = { id: 42, status: 'completed', items: [] };
    client.get.mockResolvedValueOnce({ data: { data: order } });

    const result = await getOrder(42);

    expect(client.get).toHaveBeenCalledWith('/orders/42');
    expect(result).toEqual(order);
  });
});

describe('orders API – createOrder', () => {
  it('posts to /orders and returns data.data', async () => {
    const payload = { outlet_id: 1, items: [{ product_id: 1, quantity: 2 }] };
    const created = { id: 100, ...payload, status: 'pending' };
    client.post.mockResolvedValueOnce({ data: { data: created } });

    const result = await createOrder(payload);

    expect(client.post).toHaveBeenCalledWith('/orders', payload);
    expect(result).toEqual(created);
  });
});

describe('orders API – payOrder', () => {
  it('posts to /orders/:id/pay and returns data.data', async () => {
    const payload = { amount: 50000, method: 'cash' };
    const payment = { id: 1, order_id: 100, amount: 50000 };
    client.post.mockResolvedValueOnce({ data: { data: payment } });

    const result = await payOrder(100, payload);

    expect(client.post).toHaveBeenCalledWith('/orders/100/pay', payload);
    expect(result).toEqual(payment);
  });
});

describe('orders API – cancelOrder', () => {
  it('posts to /orders/:id/cancel with reason when provided', async () => {
    const order = { id: 100, status: 'cancelled' };
    client.post.mockResolvedValueOnce({ data: { data: order } });

    const result = await cancelOrder(100, 'Customer request');

    expect(client.post).toHaveBeenCalledWith('/orders/100/cancel', {
      reason: 'Customer request',
    });
    expect(result).toEqual(order);
  });

  it('posts an empty body when no reason is provided', async () => {
    client.post.mockResolvedValueOnce({ data: { data: {} } });

    await cancelOrder(100);

    expect(client.post).toHaveBeenCalledWith('/orders/100/cancel', {});
  });
});
