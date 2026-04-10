import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from '../api/customers';

const KEY = 'customers';

export function useCustomerList(params = {}) {
  return useInfiniteQuery({
    queryKey: [KEY, 'list', params],
    queryFn: ({ pageParam = 1 }) => getCustomers({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.current_page < lastPage.last_page
        ? lastPage.current_page + 1
        : undefined,
    initialPageParam: 1,
  });
}

export function useCustomer(id) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateCustomer(id, data),
    onSuccess: (updated) => {
      qc.setQueryData([KEY, updated.id], updated);
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
