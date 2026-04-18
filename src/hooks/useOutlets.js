import { useQuery } from '@tanstack/react-query';
import { getOutlets, getOutlet } from '../api/outlets';

/** Flat list of ALL active outlets — used for pickers / dropdowns. */
export function useAllOutlets() {
  return useQuery({
    queryKey: ['outlets', 'all'],
    queryFn: () => getOutlets({ all: true }),
    staleTime: 10 * 60 * 1000,
  });
}

/** Single outlet detail. */
export function useOutlet(id) {
  return useQuery({
    queryKey: ['outlets', id],
    queryFn: () => getOutlet(id),
    enabled: !!id,
  });
}
