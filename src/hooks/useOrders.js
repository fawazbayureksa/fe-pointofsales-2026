import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, getOrder, createOrder, payOrder, cancelOrder, refundOrder, applyOrderDiscount } from '../api/orders';

const KEY = 'orders';

/**
 * @param {import('../types/order').OrderQueryParams} [params]
 */
export function useOrderList(params = {}) {
  return useInfiniteQuery({
    queryKey: [KEY, 'list', params],
    queryFn: ({ pageParam = 1 }) => getOrders({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.current_page < lastPage.last_page
        ? lastPage.current_page + 1
        : undefined,
    initialPageParam: 1,
  });
}

/**
 * @param {number} id
 */
export function useOrder(id) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: (data) => createOrder(data),
  });
}

export function usePayOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => payOrder(id, data),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => cancelOrder(id, reason),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [KEY, id] });
    },
  });
}

export function useRefundOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason, supervisor_id }) => refundOrder(id, { reason, supervisor_id }),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [KEY, id] });
    },
  });
}

export function useApplyOrderDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => applyOrderDiscount(id, payload),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: [KEY, id] });
    },
  });
}
