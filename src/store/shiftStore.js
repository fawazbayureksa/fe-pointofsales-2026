import { create } from 'zustand';

const useShiftStore = create((set) => ({
  /** @type {object|null} Current active shift */
  shift: null,
  isInitialized: false,

  setShift: (shift) => set({ shift, isInitialized: true }),
  clearShift: () => set({ shift: null }),
  markInitialized: () => set({ isInitialized: true }),
}));

export default useShiftStore;
