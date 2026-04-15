import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../api/dashboard';

const TWO_MIN  = 2 * 60 * 1000;
const FIVE_MIN = 5 * 60 * 1000;

/**
 * @returns {import('@tanstack/react-query').UseQueryResult<import('../types/dashboard').DashboardData>}
 */
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    staleTime: TWO_MIN,
    refetchInterval: FIVE_MIN,
  });
}
