import { useAccount } from 'wagmi';
import { useViewOnlyStore } from '@/stores/useViewOnlyStore';

/**
 * Hook that returns the active wallet address.
 * Priority: Connected wallet > View-only pasted address
 * 
 * @returns {object} - address, isConnected, isViewOnly, effectiveAddress
 */
export function useWalletAddress() {
  const { address: connectedAddress, isConnected: isWalletConnected } = useAccount();
  const { viewOnlyAddress, clearViewOnlyAddress } = useViewOnlyStore();
  
  // If user connects a real wallet, clear the view-only address
  // This ensures connected wallets always take priority
  const isViewOnly = !isWalletConnected && !!viewOnlyAddress;
  
  // The effective address to use across the app
  const effectiveAddress = connectedAddress || viewOnlyAddress || null;
  
  // Consider "connected" if either we have a real connection or a view-only address
  const isConnected = isWalletConnected || isViewOnly;
  
  return {
    // The original wagmi values
    connectedAddress,
    isWalletConnected,
    
    // View-only state
    viewOnlyAddress,
    isViewOnly,
    
    // Unified values to use in components
    address: effectiveAddress as `0x${string}` | undefined,
    isConnected,
    
    // Utility to clear view-only mode
    clearViewOnlyAddress,
  };
}
