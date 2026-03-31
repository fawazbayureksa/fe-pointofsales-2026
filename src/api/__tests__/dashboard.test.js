import { getDashboard } from '../dashboard';
import client from '../client';

jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

describe('dashboard API – getDashboard', () => {
  it('gets /dashboard and returns response data', async () => {
    const mockData = {
      total_revenue: 1500000,
      total_orders: 42,
      products_count: 20,
    };
    client.get.mockResolvedValueOnce({ data: mockData });

    const result = await getDashboard();

    expect(client.get).toHaveBeenCalledWith('/dashboard');
    expect(result).toEqual(mockData);
  });

  it('propagates rejection from the client', async () => {
    client.get.mockRejectedValueOnce({ message: 'Network Error', errors: {} });

    await expect(getDashboard()).rejects.toMatchObject({ message: 'Network Error' });
  });
});
