'use client';

export const dynamic = 'force-dynamic';

import { Header } from '@/components/Header';
import { NetworkHelper } from '@/components/NetworkHelper';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ViewOnlyLink } from '@/components/ViewOnlyInput';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Loader2, Target, Zap } from 'lucide-react';
import { getNFTsForOwner } from '@/lib/alchemy';
import { calculateConvergence } from '@/lib/robot-convergence';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { useConvergenceConfig } from '@/hooks/useConvergenceConfig';
import { Countdown } from '@/components/convergence/Countdown';
import { PhaseStrip } from '@/components/convergence/PhaseStrip';
import { ConvergenceTile } from '@/components/convergence/ConvergenceTile';
import type { NodeNFT } from '@/types/nft';
import { PHASE_LABELS, type Phase } from '@/lib/convergence-phases';

const PHASE_COPY: Record<Phase, string> = {
  announce: 'Hold your eligible Full Circles. The snapshot is approaching.',
  snapshot: 'The snapshot is being taken. Your FCs are locked for the week.',
  intermediate: 'The signal is forming. Your NODES are mid-transformation.',
  reveal: 'The Convergence is complete. Open your reveal experience.',
};

const PHASE_ORDER: Phase[] = ['announce', 'snapshot', 'intermediate', 'reveal'];

export default function ConvergencePage() {
  const { address, isConnected } = useWalletAddress();
  const {
    dates,
    phase,
    autoPhase,
    loading: configLoading,
    phaseOverride,
    setPhaseOverride,
  } = useConvergenceConfig();

  const [nftsByAddress, setNftsByAddress] = useState<Record<string, NodeNFT[]>>({});
  const nfts: NodeNFT[] | null = address ? nftsByAddress[address] ?? null : null;
  const nftsLoading = !!address && nfts === null;

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

  const { eligibleFCs, fcsNeeded } = useMemo(() => {
    if (!nfts) return { eligibleFCs: [] as NodeNFT[], fcsNeeded: 0 };
    const result = calculateConvergence(nfts);
    const fcs = nfts.filter((n) => {
      const type = n.metadata.attributes.find((a) => a.trait_type === 'Type')?.value;
      return type === 'Full Circle' && !n.networkStatus;
    });
    return { eligibleFCs: fcs, fcsNeeded: result.fullCirclesNeeded };
  }, [nfts]);

  const { nextTarget, nextLabel } = useMemo(() => {
    if (!dates) return { nextTarget: 0, nextLabel: 'Until Snapshot' };
    switch (phase) {
      case 'announce':
        return { nextTarget: dates.snapshotAt, nextLabel: 'Until Snapshot' };
      case 'snapshot':
        return { nextTarget: dates.intermediateAt, nextLabel: 'Until Intermediate' };
      case 'intermediate':
        return { nextTarget: dates.revealAt, nextLabel: 'Until Reveal' };
      case 'reveal':
        return { nextTarget: dates.revealAt, nextLabel: 'Reveal Live' };
    }
  }, [phase, dates]);

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <NetworkHelper />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <section className="text-center mb-10 sm:mb-14">
          <div
            className="inline-flex items-center mb-5"
            style={{
              padding: '6px 14px',
              borderRadius: 9999,
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.3)',
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
                fontSize: 10,
                fontWeight: 700,
                color: '#00D4FF',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
              }}
            >
              Chapter 3 · The Convergence
            </span>
          </div>

          <h1
            className="mb-5"
            style={{
              fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
              fontWeight: 900,
              textTransform: 'uppercase',
              fontSize: 'clamp(40px, 7vw, 56px)',
              lineHeight: 1.05,
              color: '#ffffff',
              textShadow: '-2px 0 0 #00FFFF, 2px 0 0 #FF00E5',
              letterSpacing: '0.02em',
            }}
          >
            The Convergence Week
          </h1>

          <p className="text-gray-400 mx-auto px-4" style={{ maxWidth: 640 }}>
            Your eligible Full Circles will evolve over the coming days. Check in each phase to
            witness the transformation.
          </p>

          {!isConnected && (
            <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full px-4">
                <div className="flex flex-col items-center gap-2">
                  <ConnectButton />
                </div>
                <ViewOnlyLink variant="button" />
              </div>
              <p className="text-xs text-gray-500">
                Both options give you full access to the Convergence experience.
              </p>
            </div>
          )}
        </section>

        {isConnected && (
          <>
            {configLoading || !dates ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
              </div>
            ) : (
              <>
                <section className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 mb-8">
                  <Countdown target={nextTarget} label={nextLabel} />
                  <PhaseStrip current={phase} dates={dates} />
                </section>

                <section className="card p-5 sm:p-6 mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="min-w-0">
                      <div
                        style={{
                          fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#00D4FF',
                          textTransform: 'uppercase',
                          letterSpacing: '0.14em',
                        }}
                      >
                        {PHASE_LABELS[phase]}
                      </div>
                      <p className="text-sm sm:text-base text-white mt-1">{PHASE_COPY[phase]}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        <span className="text-white font-semibold">{eligibleFCs.length}</span>{' '}
                        eligible FC{eligibleFCs.length === 1 ? '' : 's'} ·{' '}
                        <span className="text-[#00D4FF] font-semibold">
                          {Math.min(fcsNeeded, eligibleFCs.length)}
                        </span>{' '}
                        will evolve
                      </p>
                    </div>
                    {phase === 'reveal' && (
                      <Link
                        href="/reveal"
                        className="btn-primary inline-flex items-center justify-center py-3 sm:py-2 whitespace-nowrap"
                      >
                        Open Reveal Experience
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    )}
                  </div>
                </section>

                <section className="mb-10">
                  {nftsLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
                    </div>
                  ) : eligibleFCs.length === 0 ? (
                    <div className="card p-6 sm:p-8 text-center">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#00D4FF]/10 border border-[#00D4FF]/30 flex items-center justify-center">
                        <Target className="w-6 h-6 text-[#00D4FF]" />
                      </div>
                      <h2
                        className="mb-2"
                        style={{
                          fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#ffffff',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        No Eligible Full Circles
                      </h2>
                      <p className="text-sm text-gray-400 mb-4 max-w-md mx-auto">
                        No eligible Full Circles in this wallet. Check Full Sets for the criteria.
                      </p>
                      <Link
                        href="/full-sets"
                        className="btn-secondary inline-flex items-center justify-center py-2"
                      >
                        Check Full Sets
                        <Target className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {eligibleFCs.map((nft, index) => (
                        <ConvergenceTile
                          key={nft.tokenId}
                          nft={nft}
                          phase={phase}
                          willEvolve={index < fcsNeeded}
                        />
                      ))}
                    </div>
                  )}
                </section>

                {isDev && (
                  <section
                    className="card p-4 sm:p-5 mb-6"
                    style={{ borderColor: 'rgba(255,0,229,0.25)' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-[#FF00E5]" />
                      <span
                        style={{
                          fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#FF00E5',
                          textTransform: 'uppercase',
                          letterSpacing: '0.14em',
                        }}
                      >
                        Dev · Phase Scrubber
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono ml-2">
                        auto: {PHASE_LABELS[autoPhase]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {PHASE_ORDER.map((p) => {
                        const active = phaseOverride === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPhaseOverride(active ? null : p)}
                            className="px-3 py-1.5 text-xs uppercase tracking-wide rounded-md transition-colors"
                            style={{
                              fontFamily:
                                "var(--font-orbitron, 'Orbitron'), sans-serif",
                              fontWeight: 700,
                              background: active ? 'rgba(255,0,229,0.15)' : '#0A0A0A',
                              border: `1px solid ${
                                active ? 'rgba(255,0,229,0.5)' : '#1a1a1a'
                              }`,
                              color: active ? '#FF00E5' : '#9CA3AF',
                            }}
                          >
                            {PHASE_LABELS[p]}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setPhaseOverride(null)}
                        disabled={phaseOverride === null}
                        className="px-3 py-1.5 text-xs uppercase tracking-wide rounded-md transition-colors disabled:opacity-40"
                        style={{
                          fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
                          fontWeight: 700,
                          background: '#0A0A0A',
                          border: '1px solid #1a1a1a',
                          color: '#9CA3AF',
                        }}
                      >
                        Auto
                      </button>
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
