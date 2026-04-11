import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../api/products';

const QUERY_KEY = 'products';

/**
 * Infinite-scroll product list.
 * @param {import('../types/product').ProductQueryParams} [params]
 */
export function useProductList(params = {}) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: ({ pageParam = 1 }) =>
      getProducts({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.current_page < lastPage.last_page
        ? lastPage.current_page + 1
        : undefined,
    initialPageParam: 1,
  });
}

/**
 * Single product.
 * @param {number} id
 */
export function useProduct(id) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
}

/** Create a new product and invalidate the list cache. */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

/** Update an existing product, update the detail cache, and invalidate the list. */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData([QUERY_KEY, updated.id], updated);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/** Delete a product and invalidate the list cache. */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
