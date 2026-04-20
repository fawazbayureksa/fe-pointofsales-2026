import client from './client';

/**
 * @param {{ pin: string, action: 'refund' | 'void' | 'discount_override' }} payload
 * @returns {Promise<{ authorized: boolean, supervisor_id: number, supervisor: string }>}
 */
export const supervisorAuthorize = async (payload) => {
  const { data } = await client.post('/supervisor/authorize', payload);
  return data;
};
