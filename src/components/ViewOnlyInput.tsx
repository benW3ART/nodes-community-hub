'use client';

import { useState } from 'react';
import { useViewOnlyStore, isValidEthAddress } from '@/stores/useViewOnlyStore';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { Eye, EyeOff, X, ClipboardPaste, Check } from 'lucide-react';

interface ViewOnlyInputProps {
  className?: string;
  compact?: boolean;
}

export function ViewOnlyInput({ className = '', compact = false }: ViewOnlyInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [justPasted, setJustPasted] = useState(false);
  
  const { setViewOnlyAddress, clearViewOnlyAddress, viewOnlyAddress } = useViewOnlyStore();
  const { isWalletConnected, isViewOnly } = useWalletAddress();

  // Don't show if wallet is already connected
  if (isWalletConnected) {
    return null;
  }

  const handleSubmit = (value: string = inputValue) => {
    const trimmed = value.trim();
    setError(null);
    
    if (!trimmed) {
      setError('Please enter a wallet address');
      return;
    }
    
    if (!isValidEthAddress(trimmed)) {
      setError('Invalid Ethereum address format');
      return;
    }
    
    setViewOnlyAddress(trimmed);
    setInputValue('');
    setShowInput(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      setInputValue(trimmed);
      setJustPasted(true);
      setTimeout(() => setJustPasted(false), 1500);
      
      // Auto-submit if valid
      if (isValidEthAddress(trimmed)) {
        handleSubmit(trimmed);
      }
    } catch (err) {
      setError('Failed to read clipboard');
    }
  };

  const handleClear = () => {
    clearViewOnlyAddress();
    setInputValue('');
    setError(null);
  };

  // If already in view-only mode, show the address with option to clear
  if (isViewOnly && viewOnlyAddress) {
    const displayAddress = `${viewOnlyAddress.slice(0, 6)}...${viewOnlyAddress.slice(-4)}`;
    
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[#00D4FF]/30 rounded-lg">
          <Eye className="w-4 h-4 text-[#00D4FF]" />
          <span className="text-sm text-gray-300 font-mono">{displayAddress}</span>
          <span className="text-xs text-[#00D4FF] uppercase">View Only</span>
        </div>
        <button
          onClick={handleClear}
          className="p-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg hover:border-red-500/50 hover:text-red-400 transition-colors"
          title="Exit view-only mode"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Compact mode: just a button that opens modal/dropdown
  if (compact && !showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className={`flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg hover:border-[#00D4FF]/50 text-sm text-gray-400 hover:text-[#00D4FF] transition-all ${className}`}
      >
        <EyeOff className="w-4 h-4" />
        <span className="hidden sm:inline">View Only</span>
      </button>
    );
  }

  return (
    <div className={`${className}`}>
      {showInput || !compact ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit();
                  } else if (e.key === 'Escape') {
                    setShowInput(false);
                    setInputValue('');
                    setError(null);
                  }
                }}
                placeholder="Paste wallet address (0x...)"
                className={`w-full bg-[#0a0a0a] border rounded-lg px-3 py-2 text-sm font-mono placeholder:font-sans placeholder:text-gray-600 focus:outline-none focus:border-[#00D4FF]/50 ${
                  error ? 'border-red-500/50' : 'border-[#1a1a1a]'
                }`}
              />
            </div>
            
            <button
              onClick={handlePaste}
              className={`p-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg hover:border-[#00D4FF]/50 transition-colors ${
                justPasted ? 'text-green-400 border-green-500/50' : 'text-gray-400'
              }`}
              title="Paste from clipboard"
            >
              {justPasted ? <Check className="w-4 h-4" /> : <ClipboardPaste className="w-4 h-4" />}
            </button>
            
            <button
              onClick={() => handleSubmit()}
              disabled={!inputValue.trim()}
              className="px-3 py-2 bg-[#00D4FF] text-black rounded-lg text-sm font-medium hover:bg-[#4FFFDF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View
            </button>
            
            {compact && (
              <button
                onClick={() => {
                  setShowInput(false);
                  setInputValue('');
                  setError(null);
                }}
                className="p-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg hover:border-red-500/50 text-gray-400 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {error && (
            <p className="text-xs text-red-400 px-1">{error}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * A simpler inline link to show view-only option
 */
export function ViewOnlyLink({ className = '' }: { className?: string }) {
  const [showModal, setShowModal] = useState(false);
  const { isWalletConnected } = useWalletAddress();
  
  if (isWalletConnected) return null;
  
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`text-sm text-gray-500 hover:text-[#00D4FF] transition-colors ${className}`}
      >
        Or paste a wallet address to view
      </button>
      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#00D4FF]" />
                View-Only Mode
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:text-red-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">
              Can&apos;t connect your wallet? Paste your address below to browse in view-only mode. 
              You&apos;ll see all features, but you won&apos;t be able to sign transactions.
            </p>
            
            <ViewOnlyInput />
            
            <p className="text-xs text-gray-600 mt-4">
              Tip: You can always connect your wallet later to unlock full functionality.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
