import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentShift, startShift, endShift } from '../api/shifts';
import useShiftStore from '../store/shiftStore';

const KEY = 'shifts';

export function useCurrentShift() {
  const { setShift, markInitialized } = useShiftStore();
  return useQuery({
    queryKey: [KEY, 'current'],
    queryFn: async () => {
      const result = await getCurrentShift();
      setShift(result.shift ?? null);
      return result;
    },
    onSettled: () => markInitialized(),
    staleTime: 0,
  });
}

export function useStartShift() {
  const qc = useQueryClient();
  const { setShift } = useShiftStore();
  return useMutation({
    mutationFn: startShift,
    onSuccess: (shift) => {
      setShift(shift);
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useEndShift() {
  const qc = useQueryClient();
  const { clearShift } = useShiftStore();
  return useMutation({
    mutationFn: endShift,
    onSuccess: () => {
      clearShift();
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}
