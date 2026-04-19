'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  ArrowLeft,
  ArrowRight,
  GitCompareArrows,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { getNFTsForOwner } from '@/lib/alchemy';
import { calculateConvergence } from '@/lib/robot-convergence';
import { getTokenRarity } from '@/lib/rarity';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { useConvergenceConfig } from '@/hooks/useConvergenceConfig';
import type { NodeNFT } from '@/types/nft';

type TraitRarity = { value: string; rarity: number };
type RarityEntry = {
  rank: number;
  score: number;
  traits: Record<string, TraitRarity>;
} | null;

function proxyUrl(raw: string): string {
  return `/api/proxy-gif?url=${encodeURIComponent(raw)}`;
}

function findTrait(nft: NodeNFT, key: string): string {
  const attr = nft.metadata?.attributes?.find((a) => a.trait_type === key);
  return attr?.value ?? '';
}

export default function RevealPage() {
  const router = useRouter();
  const { address, isConnected } = useWalletAddress();
  const { phase, loading: configLoading, phaseOverride } = useConvergenceConfig();

  const [nftsByAddress, setNftsByAddress] = useState<Record<string, NodeNFT[]>>({});
  const [idx, setIdx] = useState(0);
  const [showBefore, setShowBefore] = useState(false);
  const [rarityMap, setRarityMap] = useState<Record<string, RarityEntry>>({});

  const nfts: NodeNFT[] | null = address ? nftsByAddress[address] ?? null : null;
  const nftsLoading = !!address && nfts === null;

  const isDev = process.env.NODE_ENV === 'development';
  const devOverrideReveal = isDev && phaseOverride === 'reveal';

  useEffect(() => {
    if (configLoading) return;
    if (!isConnected || !address) {
      router.replace('/convergence');
      return;
    }
    if (phase !== 'reveal' && !devOverrideReveal) {
      router.replace('/convergence');
    }
  }, [address, isConnected, phase, configLoading, devOverrideReveal, router]);

  useEffect(() => {
    if (!address) return;
    if (nftsByAddress[address]) return;
    let cancelled = false;
    getNFTsForOwner(address)
      .then((data) => {
        if (!cancelled) setNftsByAddress((prev) => ({ ...prev, [address]: data }));
      })
      .catch(() => {
        if (!cancelled) setNftsByAddress((prev) => ({ ...prev, [address]: [] }));
      });
    return () => {
      cancelled = true;
    };
  }, [address, nftsByAddress]);

  const list = useMemo<NodeNFT[]>(() => {
    if (!nfts) return [];
    const fcs = nfts.filter((n) => {
      const type = n.metadata.attributes.find((a) => a.trait_type === 'Type')?.value;
      return type === 'Full Circle' && !n.networkStatus;
    });
    if (fcs.length === 0) return [];
    const result = calculateConvergence(nfts);
    const needed = result.fullCirclesNeeded;
    if (needed <= 0) return fcs;
    return fcs.slice(0, Math.min(needed, fcs.length));
  }, [nfts]);

  const safeIdx = list.length > 0 ? Math.min(idx, list.length - 1) : 0;
  const currentNft = list[safeIdx];

  useEffect(() => {
    if (!currentNft) return;
    if (rarityMap[currentNft.tokenId] !== undefined) return;
    let cancelled = false;
    getTokenRarity(currentNft.tokenId).then((r) => {
      if (cancelled) return;
      setRarityMap((prev) => ({ ...prev, [currentNft.tokenId]: r }));
    });
    return () => {
      cancelled = true;
    };
  }, [currentNft, rarityMap]);

  const handleShare = useCallback(() => {
    if (!currentNft) return;
    const text = `NODE #${currentNft.tokenId} has revealed — ${currentNft.innerState}${
      currentNft.interference ? ' ⚡' : ''
    } nodes.network/reveal`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }, [currentNft]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setIdx((i) => Math.min(list.length - 1, i + 1));
      } else if (e.key === 'ArrowLeft') {
        setIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Escape') {
        router.push('/convergence');
      } else if (e.key === 'b' || e.key === 'B') {
        setShowBefore((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [list.length, router]);

  if (configLoading || nftsLoading || nfts === null) {
    return (
      <div className="fixed inset-0 z-40 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="fixed inset-0 z-40 bg-black flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div
            style={{
              fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: '#00D4FF',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: 12,
            }}
          >
            Reveal Experience
          </div>
          <h2
            className="mb-4"
            style={{
              fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
              fontSize: 28,
              fontWeight: 900,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            Nothing to reveal
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            This wallet has no eligible Full Circles to reveal.
          </p>
          <Link
            href="/convergence"
            className="btn-secondary inline-flex items-center justify-center py-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Convergence
          </Link>
        </div>
      </div>
    );
  }

  if (!currentNft) {
    return (
      <div className="fixed inset-0 z-40 bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
      </div>
    );
  }

  const currentRarity = rarityMap[currentNft.tokenId];
  const rarityLoaded = currentRarity !== undefined;
  const rarityData = currentRarity ?? null;

  const formValue = findTrait(currentNft, 'Type') || 'Full Circle';
  const innerStateValue = currentNft.innerState || findTrait(currentNft, 'Inner State');

  const displayRaw =
    showBefore && currentNft.cleanImage
      ? currentNft.cleanImage
      : showBefore && !currentNft.cleanImage
      ? currentNft.image
      : currentNft.image;
  const displaySrc = proxyUrl(displayRaw);

  const traitEntries: Array<{ trait_type: string; value: string; rarityPct: number | null }> = (() => {
    if (rarityData?.traits) {
      return Object.entries(rarityData.traits).map(([trait_type, t]) => ({
        trait_type,
        value: t.value,
        rarityPct: t.rarity,
      }));
    }
    return currentNft.metadata.attributes.map((a) => ({
      trait_type: a.trait_type,
      value: a.value,
      rarityPct: null,
    }));
  })();

  const counterLabel = `${String(safeIdx + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-40 bg-black overflow-auto">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgba(0,212,255,0.08), transparent 60%)',
        }}
      />

      <div
        className="sticky top-0 z-[3] px-6 py-3 flex justify-between items-center bg-black/75 backdrop-blur-xl border-b border-[#1a1a1a]"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/convergence"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1a1a1a] text-gray-400 hover:text-white hover:border-[#333] transition-colors text-xs"
          >
            <X className="w-3.5 h-3.5" />
            Exit Reveal
          </Link>
          <div
            style={{
              fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#00D4FF',
              fontWeight: 700,
            }}
          >
            Reveal Experience
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span
            className="hidden sm:inline"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 11,
              color: '#6B7280',
            }}
          >
            {counterLabel}
          </span>
          <button
            type="button"
            onClick={() => setShowBefore((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1a1a1a] text-gray-300 hover:text-white hover:border-[#333] transition-colors text-xs"
          >
            <GitCompareArrows className="w-3.5 h-3.5" />
            {showBefore ? 'After' : 'Before'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1a1a1a] text-gray-300 hover:text-white hover:border-[#333] transition-colors text-xs"
          >
            Share
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex gap-1 justify-center py-3.5 relative z-[2]">
        {list.map((nft, i) => {
          const isActive = i === safeIdx;
          const isPast = i < safeIdx;
          return (
            <button
              key={nft.tokenId}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Reveal ${i + 1} of ${list.length}`}
              style={{
                width: isActive ? 28 : 10,
                height: 4,
                borderRadius: 9999,
                background: isActive
                  ? '#00D4FF'
                  : isPast
                  ? 'rgba(0,212,255,0.4)'
                  : '#1a1a1a',
                border: 0,
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: isActive ? '0 0 10px rgba(0,212,255,0.6)' : 'none',
                padding: 0,
              }}
            />
          );
        })}
      </div>

      <div className="relative z-[2] max-w-7xl mx-auto px-6 pb-16 grid gap-8 lg:grid-cols-[1.1fr_1fr] items-start">
        <div>
          <div
            style={{
              position: 'relative',
              aspectRatio: '1 / 1',
              borderRadius: 16,
              overflow: 'hidden',
              border: '1px solid rgba(0,212,255,0.25)',
              boxShadow: '0 0 60px rgba(0,212,255,0.15)',
              background: '#0A0A0A',
            }}
          >
            <Image
              key={`${currentNft.tokenId}-${showBefore ? 'before' : 'after'}`}
              src={displaySrc}
              alt={`NODE #${currentNft.tokenId}`}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 60vw"
              style={{
                imageRendering: 'pixelated',
                objectFit: 'cover',
                filter: showBefore ? 'grayscale(1) brightness(0.55) blur(2px)' : 'none',
                transition: 'filter 0.4s',
              }}
            />

            {showBefore && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: 20,
                  background: 'linear-gradient(0deg, rgba(0,0,0,0.6), transparent 50%)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: 10,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#6B7280',
                  }}
                >
                  Pre-Convergence · Snapshot
                </div>
              </div>
            )}

            {currentNft.interference && !showBefore && (
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  padding: '6px 12px',
                  borderRadius: 9999,
                  background: 'linear-gradient(135deg, #00D4FF, #4FFFDF)',
                  color: '#000',
                  fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  boxShadow: '0 0 24px rgba(0,212,255,0.5)',
                }}
              >
                ⚡ Interference
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4 gap-3">
            <button
              type="button"
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={safeIdx === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#1a1a1a] text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed enabled:hover:border-[#333] enabled:text-gray-300 enabled:hover:text-white"
              style={{ color: safeIdx === 0 ? '#333' : undefined }}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setIdx((i) => Math.min(list.length - 1, i + 1))}
              disabled={safeIdx === list.length - 1}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: '#00D4FF',
                boxShadow: safeIdx === list.length - 1 ? 'none' : '0 0 20px rgba(0,212,255,0.3)',
              }}
            >
              Next Reveal
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div
            className="text-center mt-2.5"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 10,
              color: '#6B7280',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            ← → arrow keys · B to compare
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#00D4FF',
            }}
          >
            Revealed
          </div>
          <h2
            style={{
              margin: '8px 0 4px',
              fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
              fontSize: 'clamp(36px, 5vw, 44px)',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#ffffff',
              textShadow: '-1.5px 0 0 #00FFFF, 1.5px 0 0 #FF00E5',
            }}
          >
            NODE #{currentNft.tokenId}
          </h2>

          <div className="flex flex-wrap gap-2.5 mt-2.5">
            {formValue && (
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 9999,
                  background: 'rgba(0,212,255,0.12)',
                  border: '1px solid rgba(0,212,255,0.35)',
                  color: '#00D4FF',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {formValue}
              </span>
            )}
            {innerStateValue && (
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 9999,
                  background: 'rgba(79,255,223,0.12)',
                  border: '1px solid rgba(79,255,223,0.35)',
                  color: '#4FFFDF',
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {innerStateValue}
              </span>
            )}
            {currentNft.interference && (
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 9999,
                  background: 'linear-gradient(135deg, #00D4FF, #4FFFDF)',
                  color: '#000',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                ⚡ Interference
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div
              style={{
                padding: 14,
                background: '#0A0A0A',
                border: '1px solid #1a1a1a',
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                Rarity Score
              </div>
              <div
                style={{
                  fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#4FFFDF',
                  marginTop: 4,
                }}
              >
                {rarityData ? Math.round(rarityData.score).toLocaleString() : '—'}
              </div>
            </div>
            <div
              style={{
                padding: 14,
                background: '#0A0A0A',
                border: '1px solid #1a1a1a',
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
              >
                Rank
              </div>
              <div
                style={{
                  fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#00D4FF',
                  marginTop: 4,
                }}
              >
                {rarityData ? `#${rarityData.rank}` : '—'}
              </div>
            </div>
          </div>

          <h3
            style={{
              margin: '28px 0 12px',
              fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#6B7280',
            }}
          >
            Traits
          </h3>

          {!rarityLoaded ? (
            <div
              className="flex items-center gap-2 px-3 py-4 rounded-xl border border-[#1a1a1a]"
              style={{ background: '#0A0A0A' }}
            >
              <Loader2 className="w-4 h-4 animate-spin text-[#00D4FF]" />
              <span
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 11,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Loading traits…
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {traitEntries.map((t) => (
                <div
                  key={t.trait_type}
                  style={{
                    padding: '10px 14px',
                    background: '#0A0A0A',
                    border: '1px solid #1a1a1a',
                    borderRadius: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  >
                    {t.trait_type}
                  </div>
                  <div
                    className="flex justify-between items-baseline gap-2 mt-1"
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#ffffff' }}>
                      {t.value}
                    </span>
                    {t.rarityPct !== null && (
                      <span
                        style={{
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, monospace',
                          fontSize: 10,
                          color: '#00D4FF',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.rarityPct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
