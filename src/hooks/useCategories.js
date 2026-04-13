import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api/categories';

const KEYS = {
  all:  () => ['categories'],
  list: (params) => ['categories', 'list', params],
  all_flat: () => ['categories', 'all'],
  detail: (id) => ['categories', id],
};

/**
 * Paginated category list with optional search / filter params.
 * @param {import('../types/category').CategoryQueryParams} [params]
 */
export function useCategoryList(params = {}) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => getCategories(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Flat list of ALL categories — used for pickers / dropdowns.
 * Calls `?all=true` so pagination is skipped.
 */
export function useAllCategories() {
  return useQuery({
    queryKey: KEYS.all_flat(),
    queryFn: () => getCategories({ all: true }),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Single category with parent + children.
 * @param {number} id
 */
export function useCategory(id) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => getCategory(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all() });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateCategory(id, data),
    onSuccess: (_result, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.all() });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all() });
    },
  });
}
