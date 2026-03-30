import client from './client';

/**
 * @returns {Promise<import('../types/dashboard').DashboardData>}
 */
export const getDashboard = () =>
  client.get('/dashboard').then((r) => r.data);
