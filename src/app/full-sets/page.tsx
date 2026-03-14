'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ViewOnlyLink } from '@/components/ViewOnlyInput';
import { getNFTsForOwner, analyzeFullSets } from '@/lib/alchemy';
import { useNodesStore } from '@/stores/useNodesStore';
import { INNER_STATES } from '@/lib/wagmi';
import { 
  Loader2, 
  Wallet, 
  Check, 
  X, 
  ExternalLink,
  ShoppingCart,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Target,
  Bot,
  CircleDot,
} from 'lucide-react';
import Image from 'next/image';
import { calculateConvergence, type ConvergenceResult } from '@/lib/robot-convergence';

export default function FullSetsPage() {
  const { address, isConnected, isViewOnly } = useWalletAddress();
  const { 
    nfts, 
    isLoading, 
    fullSetStatus,
    completeSets,
    missingStates,
    setNfts, 
    setLoading, 
    setFullSetAnalysis 
  } = useNodesStore();

  interface OpenSeaListing {
    tokenId: string;
    price: string;
    image: string;
    url: string;
  }
  
  const [openSeaListings, setOpenSeaListings] = useState<Record<string, OpenSeaListing[]>>({});
  const [loadingListings, setLoadingListings] = useState(false);
  const [convergence, setConvergence] = useState<ConvergenceResult | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const FILTER_ATTRIBUTES = ['Background', 'Grid', 'Shade', 'Glow', 'Type', 'Network Status'] as const;

  // Extract unique attribute values from user's NFTs for each filterable attribute
  const filterOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    for (const attr of FILTER_ATTRIBUTES) {
      const values = new Set<string>();
      for (const nft of nfts) {
        const found = nft.metadata?.attributes?.find(
          (a) => a.trait_type === attr
        );
        if (found && found.value) values.add(found.value);
      }
      options[attr] = Array.from(values).sort();
    }
    return options;
  }, [nfts]);

  // Filter NFTs by active filters and compute per-Inner-State counts
  const filteredStateCounts = useMemo(() => {
    let filtered = nfts;
    for (const [attr, value] of Object.entries(filters)) {
      if (!value) continue;
      filtered = filtered.filter((nft) => {
        const found = nft.metadata?.attributes?.find(
          (a) => a.trait_type === attr
        );
        return found?.value === value;
      });
    }
    const counts: Record<string, { count: number; tokenIds: string[] }> = {};
    for (const state of INNER_STATES) {
      counts[state] = { count: 0, tokenIds: [] };
    }
    for (const nft of filtered) {
      if (counts[nft.innerState]) {
        counts[nft.innerState].count++;
        counts[nft.innerState].tokenIds.push(nft.tokenId);
      }
    }
    return counts;
  }, [nfts, filters]);

  const hasActiveFilters = Object.values(filters).some((v) => v);

  useEffect(() => {
    async function fetchNFTs() {
      if (!address) return;
      
      setLoading(true);
      
      try {
        const fetchedNfts = await getNFTsForOwner(address);
        setNfts(fetchedNfts);
        
        const analysis = analyzeFullSets(fetchedNfts);
        setFullSetAnalysis(analysis.status, analysis.completeSets, analysis.missingStates);
        
        const conv = calculateConvergence(fetchedNfts);
        setConvergence(conv);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (isConnected && address) {
      fetchNFTs();
    }
  }, [address, isConnected, setNfts, setLoading, setFullSetAnalysis]);

  useEffect(() => {
    async function fetchListings() {
      if (missingStates.length === 0) return;
      
      setLoadingListings(true);
      
      try {
        const response = await fetch(`/api/opensea/listings?states=${missingStates.join(',')}`);
        if (response.ok) {
          const data = await response.json();
          setOpenSeaListings(data.listings || {});
        }
      } catch (err) {
        console.error('Failed to fetch listings:', err);
      } finally {
        setLoadingListings(false);
      }
    }

    fetchListings();
  }, [missingStates]);

  // No longer needed — replaced by Robot Convergence Checker

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <h1 className="section-title text-xl sm:text-2xl md:text-3xl">Full Set Tracker</h1>
        <p className="text-gray-500 text-sm sm:text-base mb-6 sm:mb-8">
          Collecting a full set, composed of the 7 ensures your participation in the NODES Network&apos;s upcoming chapters.
        </p>

        {!isConnected ? (
          <div className="card text-center py-12 sm:py-16">
            <Wallet className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-gray-700" />
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Connect Your Wallet</h2>
            <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">
              Connect your wallet to track your Full Set progress
            </p>
            <div className="flex flex-col items-center gap-3">
              <ConnectButton />
              <ViewOnlyLink />
            </div>
          </div>
        ) : isLoading ? (
          <div className="card text-center py-12 sm:py-16">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-[#00D4FF] animate-spin" />
            <p className="text-gray-500 text-sm sm:text-base">Analyzing your collection...</p>
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <div className="card mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                {completeSets > 0 ? (
                  <span className="text-[#4FFFDF] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                    {completeSets} Complete Full Set{completeSets > 1 ? 's' : ''}!
                  </span>
                ) : (
                  <span className="text-[#00D4FF]">
                    {7 - missingStates.length}/7 Inner States
                  </span>
                )}
              </h2>
              <p className="text-gray-500 text-sm sm:text-base">
                {completeSets > 0
                  ? `Congratulations! You have ${completeSets} complete full set${completeSets > 1 ? 's' : ''}. You're ready for the next interference.`
                  : `You need ${missingStates.length} more Inner State${missingStates.length > 1 ? 's' : ''} to complete a full set.`
                }
              </p>
            </div>

            {/* Robot Convergence Checker */}
            {convergence && (
              <div className={`card mb-6 sm:mb-8 ${convergence.totalRobots.total > 0 ? 'bg-[#00D4FF]/5 border-[#00D4FF]/30' : 'bg-amber-500/5 border-amber-500/20'}`}>
                <h2 className="text-lg sm:text-xl font-bold mb-3 flex items-center gap-2 uppercase tracking-wide">
                  <Bot className="w-5 h-5 text-[#00D4FF]" />
                  Robot Convergence
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm mb-4">
                  The Convergence will transform eligible Full Circles into Robots.
                </p>

                {/* Robot Summary */}
                {convergence.totalRobots.total > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
                    <div className="p-2 sm:p-3 bg-black/40 rounded-lg text-center">
                      <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Total</p>
                      <p className="text-xl sm:text-2xl font-bold text-[#00D4FF]">{convergence.effectiveRobots.total}</p>
                      {convergence.fullCirclesShortage > 0 && (
                        <p className="text-[9px] text-amber-400">({convergence.totalRobots.total} eligible)</p>
                      )}
                    </div>
                    <div className="p-2 sm:p-3 bg-black/40 rounded-lg text-center">
                      <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Regular</p>
                      <p className="text-xl sm:text-2xl font-bold">{convergence.effectiveRobots.regular}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-black/40 rounded-lg text-center border border-purple-500/20">
                      <p className="text-[10px] sm:text-xs text-purple-400 uppercase tracking-wide">Rare</p>
                      <p className="text-xl sm:text-2xl font-bold text-purple-400">{convergence.effectiveRobots.rare}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-black/40 rounded-lg text-center border border-amber-400/20">
                      <p className="text-[10px] sm:text-xs text-amber-400 uppercase tracking-wide">Ultra Rare</p>
                      <p className="text-xl sm:text-2xl font-bold text-amber-400">{convergence.effectiveRobots.ultraRare}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-black/30 rounded-lg mb-5 text-center">
                    <p className="text-amber-400 font-semibold text-sm">Not Yet Eligible</p>
                    <p className="text-gray-500 text-xs mt-1">Complete the criteria below to unlock Robot evolutions</p>
                  </div>
                )}

                {/* Criteria Checklist */}
                <div className="space-y-2 mb-5">
                  {convergence.criteria.map((crit) => (
                    <div key={crit.id} className={`p-3 rounded-lg border ${crit.met ? 'bg-[#4FFFDF]/5 border-[#4FFFDF]/20' : 'bg-black/30 border-[#1a1a1a]'}`}>
                      <div className="flex items-start gap-2">
                        {crit.met ? (
                          <CheckCircle2 className="w-4 h-4 text-[#4FFFDF] mt-0.5 flex-shrink-0" />
                        ) : (
                          <CircleDot className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs sm:text-sm font-semibold ${crit.met ? 'text-white' : 'text-gray-400'}`}>
                              {crit.label}
                            </span>
                            {crit.met && crit.robots.total > 0 && (
                              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-[#00D4FF]/15 text-[#00D4FF] whitespace-nowrap">
                                +{crit.robots.total} robot{crit.robots.total > 1 ? 's' : ''}
                                {crit.robots.rare > 0 && ' (1 rare)'}
                                {crit.robots.ultraRare > 0 && ' (1 ultra rare)'}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{crit.description}</p>
                          <p className={`text-[10px] sm:text-xs mt-1 ${crit.met ? 'text-[#4FFFDF]/70' : 'text-amber-400/70'}`}>
                            {crit.details}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Full Circle Status */}
                <div className={`p-3 rounded-lg border ${convergence.canFullyEvolve ? 'bg-[#4FFFDF]/5 border-[#4FFFDF]/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide">Full Circles Available</span>
                    <span className={`text-sm sm:text-base font-bold ${convergence.canFullyEvolve ? 'text-[#4FFFDF]' : 'text-amber-400'}`}>
                      {convergence.fullCirclesAvailable} / {convergence.fullCirclesNeeded} needed
                    </span>
                  </div>
                  {convergence.fullCirclesShortage > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-amber-400 mb-2">
                        You need {convergence.fullCirclesShortage} more Full Circle{convergence.fullCirclesShortage > 1 ? 's' : ''} to fully evolve
                      </p>
                      <a
                        href="https://opensea.io/collection/nodes-by-hunter?traits=[{%22traitType%22:%22Type%22,%22values%22:[%22Full+Circle%22]}]"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary inline-flex items-center gap-2 text-xs py-1.5 px-3"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Buy Full Circles on OpenSea
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                  {convergence.canFullyEvolve && convergence.totalRobots.total > 0 && (
                    <p className="text-xs text-[#4FFFDF] mt-1">✅ You have enough Full Circles for all evolutions</p>
                  )}
                </div>
              </div>
            )}

            {/* Complete Your Next Full Set */}
            {missingStates.length > 0 && missingStates.length < 7 && (
              <div className="card mb-6 sm:mb-8 border border-[#00D4FF]/30">
                <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Target className="w-5 h-5 text-[#00D4FF]" />
                  Complete Your Next Full Set
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  You need {missingStates.length} more Inner State{missingStates.length > 1 ? 's' : ''} to complete another Full Set:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {missingStates.map((state) => {
                    const listings = openSeaListings[state] || [];
                    const cheapest = listings[0];
                    return (
                      <div key={state} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">
                        <div>
                          <span className="font-semibold text-white">{state}</span>
                          {cheapest && (
                            <p className="text-xs text-gray-500">
                              From {cheapest.price} ETH
                            </p>
                          )}
                        </div>
                        <a
                          href={`https://opensea.io/collection/nodes-by-hunter?search[stringTraits][0][name]=inner%20state&search[stringTraits][0][values][0]=${encodeURIComponent(state)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                        >
                          Buy on OpenSea
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Inner States Grid */}
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 uppercase tracking-wide">Inner States Collection</h3>

            {/* Metadata Attribute Filters */}
            {nfts.length > 0 && (
              <div className="mb-4 p-3 sm:p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide font-medium">Filter by attributes</p>
                  {hasActiveFilters && (
                    <button
                      onClick={() => setFilters({})}
                      className="text-xs text-[#00D4FF] hover:text-[#4FFFDF] transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {FILTER_ATTRIBUTES.map((attr) => {
                    const options = filterOptions[attr] || [];
                    if (options.length === 0) return null;
                    return (
                      <select
                        key={attr}
                        value={filters[attr] || ''}
                        onChange={(e) => setFilters((prev) => ({ ...prev, [attr]: e.target.value }))}
                        className="bg-black border border-[#1a1a1a] rounded-lg px-2 py-1.5 text-xs sm:text-sm text-white focus:border-[#00D4FF]/50 focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="">{attr} (All)</option>
                        {options.map((val) => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {INNER_STATES.map((state) => {
                // Use filtered counts when filters are active, otherwise use the full set status
                const filtered = filteredStateCounts[state];
                const baseStatus = fullSetStatus.find(s => s.innerState === state);
                const count = hasActiveFilters ? (filtered?.count || 0) : (baseStatus?.count || 0);
                const owned = count > 0;
                const listings = openSeaListings[state] || [];

                return (
                  <div
                    key={state}
                    className={`card p-4 ${owned ? 'full-set-complete' : 'full-set-incomplete'}`}
                  >
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h3 className="font-semibold text-base sm:text-lg">{state}</h3>
                      {owned ? (
                        <div className="flex items-center gap-2">
                          <span className="badge-green text-xs">×{count}</span>
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#4FFFDF]" />
                        </div>
                      ) : (
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                      )}
                    </div>

                    {!owned && !hasActiveFilters && (
                      <div className="mt-3 sm:mt-4">
                        <p className="text-xs sm:text-sm text-gray-500 mb-2">Available on OpenSea:</p>
                        {loadingListings ? (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs sm:text-sm">Loading...</span>
                          </div>
                        ) : listings.length > 0 ? (
                          <div className="space-y-2">
                            {listings.slice(0, 2).map((listing) => (
                              <a
                                key={listing.tokenId}
                                href={listing.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 bg-black/50 rounded-lg hover:bg-[#00D4FF]/10 active:bg-[#00D4FF]/20 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  {listing.image && (
                                    <Image
                                      src={listing.image}
                                      alt={`NODES #${listing.tokenId}`}
                                      width={28}
                                      height={28}
                                      className="rounded"
                                    />
                                  )}
                                  <span className="text-xs sm:text-sm">#{listing.tokenId}</span>
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <span className="text-xs sm:text-sm font-medium text-[#00D4FF]">
                                    {listing.price} ETH
                                  </span>
                                  <ExternalLink className="w-3 h-3 text-gray-600" />
                                </div>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <a
                            href={`https://opensea.io/collection/nodes-by-hunter?search[stringTraits][0][name]=Inner%20State&search[stringTraits][0][values][0]=${encodeURIComponent(state)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs sm:text-sm text-[#00D4FF] hover:text-[#4FFFDF] active:text-[#4FFFDF] py-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Browse on OpenSea
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    )}

                    {!owned && hasActiveFilters && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">No NFTs match the selected filters</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Interference NFTs Owned */}
            {nfts.some(n => n.interference) && (
              <div className="card">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />
                  Your Interference NFTs
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {nfts.filter(nft => nft.interference).map((nft) => (
                    <div key={nft.tokenId} className="relative rounded-lg overflow-hidden border-2 border-[#00D4FF]/50">
                      <div className="aspect-square relative">
                        {nft.image ? (
                          <Image
                            src={nft.image}
                            alt={nft.name}
                            fill
                            className="object-cover"
                            sizes="200px"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#0a0a0a]" />
                        )}
                        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-[#00D4FF] rounded-full p-1">
                          <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-black" />
                        </div>
                      </div>
                      <div className="p-2 bg-[#0a0a0a]">
                        <p className="text-xs sm:text-sm font-medium truncate">{nft.name}</p>
                        <p className="text-[10px] sm:text-xs text-[#00D4FF]">Interference</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
