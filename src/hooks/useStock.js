import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStockMovements, adjustStock } from '../api/stock';

const KEY = 'stock';

export function useStockMovements(params = {}) {
  return useInfiniteQuery({
    queryKey: [KEY, 'movements', params],
    queryFn: ({ pageParam = 1 }) => getStockMovements({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.current_page < lastPage.last_page
        ? lastPage.current_page + 1
        : undefined,
    initialPageParam: 1,
  });
}

export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adjustStock,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
