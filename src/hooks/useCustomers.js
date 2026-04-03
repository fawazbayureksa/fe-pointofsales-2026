import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchCustomers, createCustomer } from '../api/customers';

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
}
