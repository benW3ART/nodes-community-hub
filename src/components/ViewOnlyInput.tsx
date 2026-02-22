'use client';

import { useState } from 'react';
import { useViewOnlyStore, isValidEthAddress } from '@/stores/useViewOnlyStore';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { Eye, X, ClipboardPaste, Check, Wallet } from 'lucide-react';

interface ViewOnlyInputProps {
  className?: string;
  compact?: boolean;
}

export function ViewOnlyInput({ className = '', compact = false }: ViewOnlyInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
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
    setShowModal(false);
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

  const closeModal = () => {
    setShowModal(false);
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

  // Wallet address modal
  const modal = showModal ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={closeModal}>
      <div className="w-full max-w-md bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#00D4FF]" />
            Enter a Wallet Address
          </h3>
          <button
            onClick={closeModal}
            className="p-1.5 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-5">
          No wallet connection needed. Just paste any wallet address below to access all features — gallery, grids, banners, and more.
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') closeModal();
              }}
              placeholder="0x..."
              autoFocus
              className={`flex-1 bg-black border rounded-lg px-4 py-3 text-base font-mono placeholder:text-gray-600 focus:outline-none focus:border-[#00D4FF]/50 ${
                error ? 'border-red-500/50' : 'border-[#1a1a1a]'
              }`}
            />
            <button
              onClick={handlePaste}
              className={`p-3 bg-black border border-[#1a1a1a] rounded-lg hover:border-[#00D4FF]/50 transition-colors ${
                justPasted ? 'text-green-400 border-green-500/50' : 'text-gray-400'
              }`}
              title="Paste from clipboard"
            >
              {justPasted ? <Check className="w-5 h-5" /> : <ClipboardPaste className="w-5 h-5" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400 px-1">{error}</p>
          )}

          <button
            onClick={() => handleSubmit()}
            disabled={!inputValue.trim()}
            className="w-full py-3 bg-[#00D4FF] text-black rounded-lg font-semibold hover:bg-[#4FFFDF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Browse Wallet
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // Compact mode (header): button that opens modal
  if (compact) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg hover:border-[#00D4FF]/50 text-sm text-gray-400 hover:text-[#00D4FF] transition-all ${className}`}
        >
          <Wallet className="w-4 h-4" />
          <span className="hidden sm:inline">Paste Address</span>
        </button>
        {modal}
      </>
    );
  }

  // Non-compact mode (used inside other modals): inline input
  return (
    <div className={`${className}`}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder="Paste wallet address (0x...)"
            className={`flex-1 bg-black border rounded-lg px-4 py-3 text-base font-mono placeholder:font-sans placeholder:text-gray-600 focus:outline-none focus:border-[#00D4FF]/50 ${
              error ? 'border-red-500/50' : 'border-[#1a1a1a]'
            }`}
          />
          <button
            onClick={handlePaste}
            className={`p-3 bg-black border border-[#1a1a1a] rounded-lg hover:border-[#00D4FF]/50 transition-colors ${
              justPasted ? 'text-green-400 border-green-500/50' : 'text-gray-400'
            }`}
            title="Paste from clipboard"
          >
            {justPasted ? <Check className="w-5 h-5" /> : <ClipboardPaste className="w-5 h-5" />}
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={!inputValue.trim()}
            className="px-4 py-3 bg-[#00D4FF] text-black rounded-lg font-medium hover:bg-[#4FFFDF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            View
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-400 px-1">{error}</p>
        )}
      </div>
    </div>
  );
}

/**
 * A link/button to show view-only option — opens a modal.
 * variant="link" (default): small text link
 * variant="button": prominent button matching ConnectButton style
 */
export function ViewOnlyLink({ className = '', variant = 'link' }: { className?: string; variant?: 'link' | 'button' }) {
  const [showModal, setShowModal] = useState(false);
  const { isWalletConnected } = useWalletAddress();

  if (isWalletConnected) return null;

  const trigger = variant === 'button' ? (
    <button
      onClick={() => setShowModal(true)}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl font-semibold text-white hover:border-[#00D4FF]/50 hover:text-[#00D4FF] transition-all ${className}`}
    >
      <ClipboardPaste className="w-5 h-5" />
      Paste Address
    </button>
  ) : (
    <button
      onClick={() => setShowModal(true)}
      className={`text-sm text-gray-500 hover:text-[#00D4FF] transition-colors underline underline-offset-2 ${className}`}
    >
      Or paste a wallet address
    </button>
  );

  return (
    <>
      {trigger}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#00D4FF]" />
                Enter a Wallet Address
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-gray-400 mb-5">
              No wallet connection needed. Just paste any wallet address below to access all features — gallery, grids, banners, and more.
            </p>

            <ViewOnlyInput />
          </div>
        </div>
      )}
    </>
  );
}
