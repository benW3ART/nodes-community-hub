'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getNFTsForOwner, analyzeFullSets } from '@/lib/alchemy';
import { calculateCollectionRarity, calculatePortfolioRarity } from '@/lib/rarity';
import type { RarityScore } from '@/lib/rarity';
import { useNodesStore } from '@/stores/useNodesStore';
import { NFTCard } from '@/components/NFTCard';
import { INNER_STATES } from '@/lib/wagmi';
import { 
  Loader2, 
  Wallet, 
  Sparkles, 
  Filter,
  SortAsc,
  SortDesc,
  BarChart3,
  ChevronDown
} from 'lucide-react';

type SortOption = 'tokenId' | 'innerState' | 'rarity';
type SortDirection = 'asc' | 'desc';

export default function GalleryPage() {
  const { address, isConnected } = useAccount();
  const { 
    nfts, 
    isLoading, 
    error,
    setNfts, 
    setLoading, 
    setError,
    setFullSetAnalysis 
  } = useNodesStore();

  const [showRarity, setShowRarity] = useState(false);
  const [rarityMap, setRarityMap] = useState<Map<string, RarityScore>>(new Map());
  const [filterState, setFilterState] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('tokenId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchNFTs() {
      if (!address) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const fetchedNfts = await getNFTsForOwner(address);
        setNfts(fetchedNfts);
        
        // Analyze full sets
        const analysis = analyzeFullSets(fetchedNfts);
        setFullSetAnalysis(analysis.status, analysis.completeSets, analysis.missingStates);
        
        // Calculate rarity for user's collection
        if (fetchedNfts.length > 0) {
          const rarity = calculateCollectionRarity(fetchedNfts);
          setRarityMap(rarity);
        }
      } catch (err) {
        setError('Failed to fetch NFTs. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (isConnected && address) {
      fetchNFTs();
    }
  }, [address, isConnected, setNfts, setLoading, setError, setFullSetAnalysis]);

  // Portfolio rarity stats
  const portfolioStats = useMemo(() => {
    if (nfts.length === 0 || rarityMap.size === 0) return null;
    return calculatePortfolioRarity(nfts, rarityMap);
  }, [nfts, rarityMap]);

  // Filter and sort NFTs
  const displayedNfts = useMemo(() => {
    let filtered = [...nfts];
    
    // Apply filter
    if (filterState) {
      filtered = filtered.filter(nft => nft.innerState === filterState);
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'tokenId':
          comparison = parseInt(a.tokenId) - parseInt(b.tokenId);
          break;
        case 'innerState':
          comparison = a.innerState.localeCompare(b.innerState);
          break;
        case 'rarity':
          const rarityA = rarityMap.get(a.tokenId)?.totalScore || 0;
          const rarityB = rarityMap.get(b.tokenId)?.totalScore || 0;
          comparison = rarityB - rarityA; // Higher is rarer
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [nfts, filterState, sortBy, sortDirection, rarityMap]);

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 sm:mb-8">
          <div>
            <h1 className="section-title text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2">My NODES Gallery</h1>
            {isConnected && nfts.length > 0 && (
              <p className="text-gray-500 text-sm sm:text-base">
                You own {nfts.length} NODES NFT{nfts.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {!isConnected ? (
          <div className="card text-center py-12 sm:py-16">
            <Wallet className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-gray-700" />
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Connect Your Wallet</h2>
            <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">
              Connect your wallet to view your NODES NFTs
            </p>
            <ConnectButton />
          </div>
        ) : isLoading ? (
          <div className="card text-center py-12 sm:py-16">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-[#00D4FF] animate-spin" />
            <p className="text-gray-500 text-sm sm:text-base">Loading your NODES...</p>
          </div>
        ) : error ? (
          <div className="card text-center py-12 sm:py-16">
            <p className="text-red-400 mb-4 text-sm sm:text-base">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : nfts.length === 0 ? (
          <div className="card text-center py-12 sm:py-16">
            <div className="text-5xl sm:text-6xl mb-4 sm:mb-6">🔍</div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">No NODES Found</h2>
            <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">
              You don&apos;t own any NODES NFTs yet.
            </p>
            <a 
              href="https://opensea.io/collection/nodes-by-hunter"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block"
            >
              Buy on OpenSea
            </a>
          </div>
        ) : (
          <>
            {/* Portfolio Rarity Stats */}
            {showRarity && portfolioStats && (
              <div className="card mb-4 sm:mb-6 bg-[#00D4FF]/5 border-[#00D4FF]/30">
                <h3 className="font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base uppercase tracking-wide">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />
                  Portfolio Rarity Stats
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Avg Score</p>
                    <p className="text-xl sm:text-2xl font-bold text-[#00D4FF]">
                      {portfolioStats.averageScore.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Total Rarity</p>
                    <p className="text-xl sm:text-2xl font-bold text-[#4FFFDF]">
                      {portfolioStats.totalRarityScore.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Avg Rank</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      #{portfolioStats.averageRank}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Best NFT</p>
                    <p className="text-xl sm:text-2xl font-bold text-[#00D4FF]">
                      #{portfolioStats.bestNft?.tokenId || 'N/A'}
                    </p>
                  </div>
                </div>
                
                {portfolioStats.rarestTraits.length > 0 && (
                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#00D4FF]/30">
                    <p className="text-xs sm:text-sm text-gray-500 mb-2 uppercase tracking-wide">Rarest Traits:</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {portfolioStats.rarestTraits.map((trait, i) => (
                        <span 
                          key={i}
                          className="px-2 py-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded text-xs"
                        >
                          {trait.traitType}: {trait.value} ({trait.percentage.toFixed(1)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filter & Sort Controls */}
            <div className="mb-4 sm:mb-6">
              {/* Mobile: Collapsible filters */}
              <div className="sm:hidden">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full flex items-center justify-between p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg mb-2"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <Filter className="w-4 h-4 text-gray-500" />
                    Filters & Sort
                    {filterState && <span className="text-[#00D4FF]">• {filterState}</span>}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilters && (
                  <div className="space-y-3 p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                    {/* Filter by Inner State */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wide">Inner State</label>
                      <select
                        value={filterState || ''}
                        onChange={(e) => setFilterState(e.target.value || null)}
                        className="w-full bg-black border border-[#1a1a1a] rounded-lg px-3 py-2.5 text-sm"
                      >
                        <option value="">All States</option>
                        {INNER_STATES.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Options */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wide">Sort by</label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as SortOption)}
                          className="w-full bg-black border border-[#1a1a1a] rounded-lg px-3 py-2.5 text-sm"
                        >
                          <option value="tokenId">Token ID</option>
                          <option value="innerState">Inner State</option>
                          <option value="rarity">Rarity</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wide">Order</label>
                        <button
                          onClick={toggleSortDirection}
                          className="p-2.5 bg-black border border-[#1a1a1a] rounded-lg"
                        >
                          {sortDirection === 'asc' ? (
                            <SortAsc className="w-5 h-5" />
                          ) : (
                            <SortDesc className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Rarity Toggle */}
                    <button
                      onClick={() => setShowRarity(!showRarity)}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        showRarity
                          ? 'bg-[#00D4FF] text-black'
                          : 'bg-black border border-[#1a1a1a] text-gray-400'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      {showRarity ? 'Hide Rarity' : 'Show Rarity'}
                    </button>
                  </div>
                )}
              </div>

              {/* Desktop: Inline filters */}
              <div className="hidden sm:flex flex-wrap gap-4">
                {/* Filter by Inner State */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterState || ''}
                    onChange={(e) => setFilterState(e.target.value || null)}
                    className="bg-black border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">All Inner States</option>
                    {INNER_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-black border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="tokenId">Token ID</option>
                    <option value="innerState">Inner State</option>
                    <option value="rarity">Rarity Score</option>
                  </select>
                  <button
                    onClick={toggleSortDirection}
                    className="p-2 bg-black border border-[#1a1a1a] rounded-lg hover:border-[#00D4FF]/50"
                  >
                    {sortDirection === 'asc' ? (
                      <SortAsc className="w-4 h-4" />
                    ) : (
                      <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Rarity Toggle */}
                <button
                  onClick={() => setShowRarity(!showRarity)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    showRarity
                      ? 'bg-[#00D4FF] text-black'
                      : 'bg-black border border-[#1a1a1a] text-gray-400 hover:border-[#00D4FF]/50'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {showRarity ? 'Hide Rarity' : 'Show Rarity'}
                </button>

                {/* Count Display */}
                <div className="ml-auto text-sm text-gray-500 flex items-center">
                  Showing {displayedNfts.length} of {nfts.length}
                </div>
              </div>

              {/* Mobile count */}
              <div className="sm:hidden text-xs text-gray-500 text-center mt-2">
                Showing {displayedNfts.length} of {nfts.length}
              </div>
            </div>

            {/* NFT Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {displayedNfts.map((nft) => (
                <NFTCard 
                  key={nft.tokenId} 
                  nft={nft} 
                  selectable
                  showRarity={showRarity}
                  rarityScore={rarityMap.get(nft.tokenId)}
                />
              ))}
            </div>

            {displayedNfts.length === 0 && filterState && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm sm:text-base">
                  No NFTs with Inner State &quot;{filterState}&quot; found.
                </p>
                <button
                  onClick={() => setFilterState(null)}
                  className="mt-4 text-[#00D4FF] hover:text-[#4FFFDF] text-sm sm:text-base"
                >
                  Clear filter
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
