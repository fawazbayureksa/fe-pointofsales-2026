import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCustomers,
  getCustomer,
  searchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../api/customers';

const QUERY_KEY = 'customers';

/**
 * Infinite-scroll customer list.
 * @param {{ search?: string }} [params]
 */
export function useCustomerList(params = {}) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEY, 'list', params.search ?? null],
    queryFn: ({ pageParam = 1 }) => getCustomers({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      const current = lastPage?.current_page ?? 1;
      const last = lastPage?.last_page ?? current;
      return current < last ? current + 1 : undefined;
    },
    initialPageParam: 1,
  });
}

/**
 * Single customer.
 * @param {number} id
 */
export function useCustomer(id) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  });
}

/**
 * Debounced customer search – enabled when search string is 2+ characters.
 * @param {string} search
 */
export function useCustomerSearch(search) {
  return useQuery({
    queryKey: ['customers', 'search', search],
    queryFn: () => searchCustomers(search),
    enabled: typeof search === 'string' && search.length >= 2,
    staleTime: 30_000,
    select: (data) => data.slice(0, 5),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

/** Update a customer, refresh the detail cache, and invalidate the list. */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateCustomer(id, data),
    onSuccess: (updated) => {
      if (updated?.id) queryClient.setQueryData([QUERY_KEY, updated.id], updated);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/** Delete a customer and invalidate the list cache. */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
