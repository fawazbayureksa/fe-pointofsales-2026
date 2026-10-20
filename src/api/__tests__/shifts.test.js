import { getCurrentShift, startShift, endShift } from '../shifts';
import client from '../client';

jest.mock('../client', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

beforeEach(() => jest.clearAllMocks());

describe('shifts API', () => {
  it('getCurrentShift calls /shifts/current and returns data', async () => {
    const shiftData = { shift: { id: 1, outlet_id: 2 } };
    client.get.mockResolvedValueOnce({ data: shiftData });

    const result = await getCurrentShift();
    expect(client.get).toHaveBeenCalledWith('/shifts/current');
    expect(result).toEqual(shiftData);
  });

  it('startShift posts to /shifts/start and returns formatted shift', async () => {
    const shift = { id: 5, outlet_id: 1, starting_cash: 50000 };
    client.post.mockResolvedValueOnce({
      data: {
        message: 'Shift started successfully.',
        shift,
      },
    });

    const payload = { outlet_id: 1, starting_cash: 50000, notes: 'Morning' };
    const result = await startShift(payload);

    expect(client.post).toHaveBeenCalledWith('/shifts/start', payload);
    expect(result).toEqual(shift);
  });

  it('endShift posts to /shifts/end and returns formatted shift', async () => {
    const shift = { id: 5, outlet_id: 1, ending_cash: 150000 };
    client.post.mockResolvedValueOnce({
      data: {
        message: 'Shift ended successfully.',
        shift,
      },
    });

    const payload = { ending_cash: 150000, notes: 'Closing' };
    const result = await endShift(payload);

    expect(client.post).toHaveBeenCalledWith('/shifts/end', payload);
    expect(result).toEqual(shift);
  });
});
