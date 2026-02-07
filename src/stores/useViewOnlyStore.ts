import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ViewOnlyState {
  // View-only wallet address (when user pastes instead of connecting)
  viewOnlyAddress: string | null;
  
  // Actions
  setViewOnlyAddress: (address: string | null) => void;
  clearViewOnlyAddress: () => void;
  
  // Helper to check if we're in view-only mode
  isViewOnly: () => boolean;
}

// Validate Ethereum address format
export function isValidEthAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export const useViewOnlyStore = create<ViewOnlyState>()(
  persist(
    (set, get) => ({
      viewOnlyAddress: null,
      
      setViewOnlyAddress: (address) => {
        // Only set if valid or null
        if (address === null || isValidEthAddress(address)) {
          set({ viewOnlyAddress: address });
        }
      },
      
      clearViewOnlyAddress: () => set({ viewOnlyAddress: null }),
      
      isViewOnly: () => get().viewOnlyAddress !== null,
    }),
    {
      name: 'nodes-view-only-storage',
    }
  )
);
