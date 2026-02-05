import { create } from 'zustand';
import type { NodeNFT, FullSetStatus } from '@/types/nft';

interface NodesState {
  // User's NFTs
  nfts: NodeNFT[];
  isLoading: boolean;
  error: string | null;
  
  // Full Set Analysis
  fullSetStatus: FullSetStatus[];
  completeSets: number;
  missingStates: string[];
  
  // Selected NFTs for creators
  selectedNfts: NodeNFT[];
  
  // Actions
  setNfts: (nfts: NodeNFT[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFullSetAnalysis: (status: FullSetStatus[], completeSets: number, missingStates: string[]) => void;
  selectNft: (nft: NodeNFT) => void;
  deselectNft: (tokenId: string) => void;
  clearSelection: () => void;
  reorderSelection: (fromIndex: number, toIndex: number) => void;
}

export const useNodesStore = create<NodesState>((set) => ({
  nfts: [],
  isLoading: false,
  error: null,
  fullSetStatus: [],
  completeSets: 0,
  missingStates: [],
  selectedNfts: [],
  
  setNfts: (nfts) => set({ nfts }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  setFullSetAnalysis: (fullSetStatus, completeSets, missingStates) => 
    set({ fullSetStatus, completeSets, missingStates }),
  
  selectNft: (nft) => set((state) => {
    if (state.selectedNfts.find(n => n.tokenId === nft.tokenId)) {
      return state; // Already selected
    }
    return { selectedNfts: [...state.selectedNfts, nft] };
  }),
  
  deselectNft: (tokenId) => set((state) => ({
    selectedNfts: state.selectedNfts.filter(n => n.tokenId !== tokenId)
  })),
  
  clearSelection: () => set({ selectedNfts: [] }),
  
  reorderSelection: (fromIndex, toIndex) => set((state) => {
    const newSelection = [...state.selectedNfts];
    const [removed] = newSelection.splice(fromIndex, 1);
    newSelection.splice(toIndex, 0, removed);
    return { selectedNfts: newSelection };
  }),
}));
