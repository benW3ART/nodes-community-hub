'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ViewOnlyLink } from '@/components/ViewOnlyInput';
import { getNFTsForOwner, analyzeFullSets } from '@/lib/alchemy';
import { calculateCollectionRarity, calculatePortfolioRarity, loadRarityData } from '@/lib/rarity';
import type { RarityScore } from '@/lib/rarity';
import { useNodesStore } from '@/stores/useNodesStore';
import { NFTCard } from '@/components/NFTCard';
import { getRarityTier } from '@/lib/rarity';
import type { NodeNFT } from '@/types/nft';
// INNER_STATES no longer needed — filters auto-detect from NFT attributes
import { 
  Loader2, 
  Wallet, 
  Sparkles, 
  Filter,
  SortAsc,
  SortDesc,
  BarChart3,
  ChevronDown,
  X,
  Zap,
  Download,
} from 'lucide-react';
import Image from 'next/image';

type SortOption = 'tokenId' | 'innerState' | 'rarity' | 'type' | 'networkStatus';
type SortDirection = 'asc' | 'desc';

const FILTER_ATTRIBUTES = ['Inner State', 'Type', 'Network Status', 'Glow', 'Gradient', 'Grid', 'Shade'] as const;

export default function GalleryPage() {
  const { address, isConnected, isViewOnly } = useWalletAddress();
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
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<SortOption>('tokenId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NodeNFT | null>(null);
  const [traitCounts, setTraitCounts] = useState<Record<string, Record<string, number>>>({});

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
          const rarity = await calculateCollectionRarity(fetchedNfts);
          setRarityMap(rarity);
          const rarityData = await loadRarityData();
          if (rarityData?.traitCounts) {
            setTraitCounts(rarityData.traitCounts);
          }
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

  // Extract unique values for each filterable attribute
  const filterOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    for (const attr of FILTER_ATTRIBUTES) {
      const values = new Set<string>();
      for (const nft of nfts) {
        const found = nft.metadata?.attributes?.find(a => a.trait_type === attr);
        if (found?.value) values.add(found.value);
        // Also catch Network Status from top-level field
        if (attr === 'Network Status' && nft.networkStatus) values.add(nft.networkStatus);
      }
      if (values.size > 0) options[attr] = Array.from(values).sort();
    }
    return options;
  }, [nfts]);

  const hasActiveFilters = Object.values(filters).some(v => v);

  // Filter and sort NFTs
  const displayedNfts = useMemo(() => {
    let filtered = [...nfts];
    
    // Apply filters
    for (const [attr, value] of Object.entries(filters)) {
      if (!value) continue;
      filtered = filtered.filter(nft => {
        // Special case for Network Status (top-level field)
        if (attr === 'Network Status') return nft.networkStatus === value;
        const found = nft.metadata?.attributes?.find(a => a.trait_type === attr);
        return found?.value === value;
      });
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
          const rarityA = rarityMap.get(a.tokenId)?.score || 0;
          const rarityB = rarityMap.get(b.tokenId)?.score || 0;
          comparison = rarityB - rarityA; // Higher is rarer
          break;
        case 'type': {
          const typeA = a.metadata.attributes.find(at => at.trait_type === 'Type')?.value || '';
          const typeB = b.metadata.attributes.find(at => at.trait_type === 'Type')?.value || '';
          comparison = typeA.localeCompare(typeB);
          break;
        }
        case 'networkStatus':
          comparison = (a.networkStatus || '').localeCompare(b.networkStatus || '');
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [nfts, filters, sortBy, sortDirection, rarityMap]);

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1 sm:mb-2">
              <h1 className="section-title text-xl sm:text-2xl md:text-3xl">
                {isViewOnly ? 'NODES Gallery' : 'My NODES Gallery'}
              </h1>
              {isViewOnly && (
                <span className="px-2 py-1 bg-[#00D4FF]/10 border border-[#00D4FF]/30 rounded text-xs text-[#00D4FF] uppercase tracking-wide">
                  View Only
                </span>
              )}
            </div>
            {isConnected && nfts.length > 0 && (
              <p className="text-gray-500 text-sm sm:text-base">
                {isViewOnly ? 'This wallet owns' : 'You own'} {nfts.length} NODES NFT{nfts.length !== 1 ? 's' : ''}
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
            <div className="flex flex-col items-center gap-3">
              <ConnectButton />
              <ViewOnlyLink />
            </div>
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
                      {portfolioStats.avgScore.toFixed(1)}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Avg Percentile</p>
                    <p className="text-xl sm:text-2xl font-bold text-[#4FFFDF]">
                      {portfolioStats.avgPercentile}%
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Avg Rank</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      #{portfolioStats.avgRank}
                    </p>
                  </div>
                  <div className="p-2 sm:p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Best NFT</p>
                    <p className="text-xl sm:text-2xl font-bold text-[#00D4FF]">
                      #{portfolioStats.rarestNFT?.tokenId || 'N/A'}
                    </p>
                  </div>
                </div>
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
                    {hasActiveFilters && <span className="text-[#00D4FF]">•</span>}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                
                {showFilters && (
                  <div className="space-y-3 p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
                    {/* Attribute Filters */}
                    <div className="grid grid-cols-2 gap-2">
                      {FILTER_ATTRIBUTES.map(attr => {
                        const options = filterOptions[attr];
                        if (!options || options.length === 0) return null;
                        return (
                          <div key={attr}>
                            <label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wide">{attr}</label>
                            <select
                              value={filters[attr] || ''}
                              onChange={(e) => setFilters(prev => ({ ...prev, [attr]: e.target.value }))}
                              className="w-full bg-black border border-[#1a1a1a] rounded-lg px-2 py-2 text-xs"
                            >
                              <option value="">All</option>
                              {options.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                    {hasActiveFilters && (
                      <button onClick={() => setFilters({})} className="text-xs text-[#00D4FF]">Clear all filters</button>
                    )}

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
                          <option value="type">Type</option>
                          <option value="networkStatus">Network Status</option>
                          <option value="rarity">Rarity</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1.5 block uppercase tracking-wide">Order</label>
                        <button
                          onClick={toggleSortDirection}
                          className="p-2.5 bg-black border border-[#1a1a1a] rounded-lg"
                        >
                          {sortDirection === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
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
              <div className="hidden sm:block space-y-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <Filter className="w-4 h-4 text-gray-500" />
                  {FILTER_ATTRIBUTES.map(attr => {
                    const options = filterOptions[attr];
                    if (!options || options.length === 0) return null;
                    return (
                      <select
                        key={attr}
                        value={filters[attr] || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, [attr]: e.target.value }))}
                        className="bg-black border border-[#1a1a1a] rounded-lg px-2 py-1.5 text-xs focus:border-[#00D4FF]/50 focus:outline-none transition-colors cursor-pointer"
                      >
                        <option value="">{attr} (All)</option>
                        {options.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    );
                  })}
                  {hasActiveFilters && (
                    <button onClick={() => setFilters({})} className="text-xs text-[#00D4FF] hover:text-[#4FFFDF]">Clear</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                  {/* Sort Options */}
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-black border border-[#1a1a1a] rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="tokenId">Token ID</option>
                      <option value="innerState">Inner State</option>
                      <option value="type">Type</option>
                      <option value="networkStatus">Network Status</option>
                      <option value="rarity">Rarity Score</option>
                    </select>
                    <button
                      onClick={toggleSortDirection}
                      className="p-2 bg-black border border-[#1a1a1a] rounded-lg hover:border-[#00D4FF]/50"
                    >
                      {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
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
                  onClick={() => setSelectedNft(nft)}
                />
              ))}
            </div>

            {displayedNfts.length === 0 && hasActiveFilters && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm sm:text-base">
                  No NFTs match the selected filters.
                </p>
                <button
                  onClick={() => setFilters({})}
                  className="mt-4 text-[#00D4FF] hover:text-[#4FFFDF] text-sm sm:text-base"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </>
        )}
        {/* NFT Zoom Modal */}
        {selectedNft && (() => {
          const nftRarity = rarityMap.get(selectedNft.tokenId);
          const rarityTier = nftRarity?.percentile !== undefined ? getRarityTier(nftRarity.percentile) : null;
          const isGif = selectedNft.image?.toLowerCase().endsWith('.gif');
          return (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedNft(null)}
            >
              <div 
                className="relative bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedNft(null)}
                  className="absolute top-3 right-3 z-10 p-2 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="aspect-square relative overflow-hidden rounded-t-2xl">
                  {selectedNft.image && (
                    <Image
                      src={selectedNft.image}
                      alt={selectedNft.name}
                      fill
                      unoptimized={isGif}
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 500px"
                    />
                  )}
                  {rarityTier && nftRarity && (
                    <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-medium bg-black/60 ${rarityTier.color} border border-current/30 flex items-center gap-1`}>
                      <Sparkles className="w-3 h-3" />
                      {rarityTier.name} - #{nftRarity.rank}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold mb-1">{selectedNft.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">Token #{selectedNft.tokenId}</p>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {selectedNft.metadata.attributes.map((attr, i) => (
                      <div key={i} className="p-2 bg-black border border-[#1a1a1a] rounded-lg">
                        <p className="text-[10px] text-gray-600 uppercase tracking-wide">{attr.trait_type}</p>
                        <p className="text-sm font-medium text-[#00D4FF]">{attr.value}</p>
                      </div>
                    ))}
                  </div>

                  {selectedNft.interference && (
                    <div className="p-3 bg-[#4FFFDF]/10 border border-[#4FFFDF]/30 rounded-lg mb-4">
                      <p className="text-[#4FFFDF] font-medium flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4" />
                        Interference Edition
                      </p>
                    </div>
                  )}

                  {/* Download Buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {selectedNft.image && (
                      <a
                        href={selectedNft.image}
                        download={`NODES-${selectedNft.tokenId}.${selectedNft.image.toLowerCase().endsWith('.gif') ? 'gif' : 'png'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Image
                      </a>
                    )}
                    {selectedNft.cleanImage && (
                      <a
                        href={selectedNft.cleanImage}
                        download={`NODES-${selectedNft.tokenId}-clean.${selectedNft.cleanImage.toLowerCase().endsWith('.gif') ? 'gif' : 'png'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary flex items-center justify-center gap-2 text-xs py-2.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Clean Image
                      </a>
                    )}
                  </div>

                  {nftRarity && (
                    <div className="border-t border-[#1a1a1a] pt-4">
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 uppercase tracking-wide">
                        <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                        Rarity Analysis
                      </h4>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">Total Score</span>
                        <span className="text-lg font-bold text-[#00D4FF]">{nftRarity.score.toFixed(2)}</span>
                      </div>
                      {nftRarity.traits && (
                        <div className="space-y-1.5">
                          {Object.entries(nftRarity.traits).map(([traitType, trait], i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 truncate mr-2">
                                {traitType}: <span className="text-gray-400">{trait.value}</span>
                              </span>
                              <span className="text-gray-500 flex-shrink-0">
                                {traitCounts[traitType]?.[trait.value] || '?'} / 3333
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
