'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';

// Add Base network to MetaMask
async function addBaseNetwork() {
  if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x2105', // 8453 in hex
          chainName: 'Base',
          nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://mainnet.base.org'],
          blockExplorerUrls: ['https://basescan.org'],
        }],
      });
      return true;
    } catch (error) {
      console.error('Failed to add Base network:', error);
      return false;
    }
  }
  return false;
}

export function NetworkHelper() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending } = useSwitchChain();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isConnected && chainId !== base.id) {
      setIsWrongNetwork(true);
    } else {
      setIsWrongNetwork(false);
    }
  }, [isConnected, chainId]);

  const handleSwitchNetwork = async () => {
    try {
      switchChain({ chainId: base.id });
    } catch (error) {
      console.error('Failed to switch network:', error);
      // If switch fails, try to add the network
      handleAddNetwork();
    }
  };

  const handleAddNetwork = async () => {
    setIsAdding(true);
    const success = await addBaseNetwork();
    setIsAdding(false);
    if (success) {
      // Try to switch again after adding
      try {
        switchChain({ chainId: base.id });
      } catch (e) {
        console.error('Switch after add failed:', e);
      }
    }
  };

  if (!isWrongNetwork) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-400 mb-1">Wrong Network</h3>
            <p className="text-sm text-gray-300 mb-3">
              NODES is on Base network. Please switch to continue.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleSwitchNetwork}
                disabled={isPending || isAdding}
                className="flex-1 px-4 py-2 bg-[#00D4FF] text-black font-medium rounded-lg hover:bg-[#4FFFDF] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Switching...
                  </>
                ) : (
                  'Switch to Base'
                )}
              </button>
              <button
                onClick={handleAddNetwork}
                disabled={isPending || isAdding}
                className="flex-1 px-4 py-2 bg-[#1a1a1a] text-white font-medium rounded-lg hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Base Network'
                )}
              </button>
            </div>
            <a
              href="https://base.org/network/add"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#00D4FF] mt-2"
            >
              Learn more about Base
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// Standalone button for header/pages
export function AddBaseButton({ className = '' }: { className?: string }) {
  const [isAdding, setIsAdding] = useState(false);
  const [hasMetaMask, setHasMetaMask] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      setHasMetaMask(true);
    }
  }, []);

  const handleClick = async () => {
    setIsAdding(true);
    await addBaseNetwork();
    setIsAdding(false);
  };

  if (!hasMetaMask) return null;

  return (
    <button
      onClick={handleClick}
      disabled={isAdding}
      className={`text-sm text-gray-400 hover:text-[#00D4FF] transition-colors flex items-center gap-1 ${className}`}
    >
      {isAdding ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          Adding Base...
        </>
      ) : (
        <>
          <span>+ Add Base to MetaMask</span>
        </>
      )}
    </button>
  );
}
