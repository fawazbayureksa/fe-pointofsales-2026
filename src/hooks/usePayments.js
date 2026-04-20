import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getPayments, getPayment } from '../api/payments';

const KEY = 'payments';

export function usePaymentList(params = {}) {
  return useInfiniteQuery({
    queryKey: [KEY, 'list', params],
    queryFn: ({ pageParam = 1 }) => getPayments({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.current_page < lastPage.last_page
        ? lastPage.current_page + 1
        : undefined,
    initialPageParam: 1,
  });
}

export function usePayment(id) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => getPayment(id),
    enabled: !!id,
  });
}
