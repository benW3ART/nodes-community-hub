'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
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
  Info,
  Zap
} from 'lucide-react';
import Image from 'next/image';

interface InterferenceEligibility {
  eligible: boolean;
  hasFullSet: boolean;
  completeSets: number;
  interferenceNftsOwned: number;
  canClaimMore: boolean;
  nextClaimRequirement: string | null;
  status: 'not-eligible' | 'eligible' | 'has-interference' | 'maxed-out';
}

function checkInterferenceEligibility(
  nfts: ReturnType<typeof useNodesStore.getState>['nfts'],
  completeSets: number
): InterferenceEligibility {
  const interferenceNftsOwned = nfts.filter(nft => nft.interference).length;
  const hasFullSet = completeSets > 0;
  const eligible = hasFullSet;
  const canClaimMore = completeSets > interferenceNftsOwned;
  
  let status: InterferenceEligibility['status'] = 'not-eligible';
  if (!hasFullSet) {
    status = 'not-eligible';
  } else if (interferenceNftsOwned >= completeSets) {
    status = 'maxed-out';
  } else if (interferenceNftsOwned > 0) {
    status = 'has-interference';
  } else {
    status = 'eligible';
  }
  
  let nextClaimRequirement: string | null = null;
  if (!hasFullSet) {
    nextClaimRequirement = 'Complete a Full Set (collect all 7 Inner States)';
  } else if (!canClaimMore) {
    nextClaimRequirement = `Collect another Full Set to claim more (need ${interferenceNftsOwned + 1} complete sets)`;
  }
  
  return {
    eligible,
    hasFullSet,
    completeSets,
    interferenceNftsOwned,
    canClaimMore,
    nextClaimRequirement,
    status,
  };
}

export default function FullSetsPage() {
  const { address, isConnected } = useAccount();
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
  const [interferenceEligibility, setInterferenceEligibility] = useState<InterferenceEligibility | null>(null);

  useEffect(() => {
    async function fetchNFTs() {
      if (!address) return;
      
      setLoading(true);
      
      try {
        const fetchedNfts = await getNFTsForOwner(address);
        setNfts(fetchedNfts);
        
        const analysis = analyzeFullSets(fetchedNfts);
        setFullSetAnalysis(analysis.status, analysis.completeSets, analysis.missingStates);
        
        const eligibility = checkInterferenceEligibility(fetchedNfts, analysis.completeSets);
        setInterferenceEligibility(eligibility);
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

  const progressPercentage = ((7 - missingStates.length) / 8) * 100;

  const getEligibilityIcon = (status: InterferenceEligibility['status']) => {
    switch (status) {
      case 'eligible':
        return <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#4FFFDF]" />;
      case 'has-interference':
        return <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#00D4FF]" />;
      case 'maxed-out':
        return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#00D4FF]" />;
      default:
        return <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />;
    }
  };

  const getEligibilityColor = (status: InterferenceEligibility['status']) => {
    switch (status) {
      case 'eligible':
        return 'bg-[#4FFFDF]/10 border-[#4FFFDF]/30';
      case 'has-interference':
        return 'bg-[#00D4FF]/10 border-[#00D4FF]/30';
      case 'maxed-out':
        return 'bg-[#00D4FF]/10 border-[#00D4FF]/30';
      default:
        return 'bg-amber-500/10 border-amber-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <h1 className="section-title text-xl sm:text-2xl md:text-3xl">Full Set Tracker</h1>
        <p className="text-gray-500 text-sm sm:text-base mb-6 sm:mb-8">
          Collect all 7 Inner States to complete a Full Set and become eligible for Interference!
        </p>

        {!isConnected ? (
          <div className="card text-center py-12 sm:py-16">
            <Wallet className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 text-gray-700" />
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Connect Your Wallet</h2>
            <p className="text-gray-500 text-sm sm:text-base mb-4 sm:mb-6">
              Connect your wallet to track your Full Set progress
            </p>
            <ConnectButton />
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
                <div className="flex-1">
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
                    {missingStates.length === 0 
                      ? '🎉 Congratulations! You have a complete Full Set!'
                      : `You need ${missingStates.length} more Inner State${missingStates.length > 1 ? 's' : ''}`
                    }
                  </p>
                </div>
                
                {/* Progress Ring */}
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto sm:mx-0 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40%"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-[#1a1a1a]"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40%"
                      stroke="url(#progress-gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${progressPercentage * 2.51} 251`}
                    />
                    <defs>
                      <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00D4FF" />
                        <stop offset="100%" stopColor="#4FFFDF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-bold">{7 - missingStates.length}/8</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interference Eligibility Checker */}
            {interferenceEligibility && (
              <div className={`card mb-6 sm:mb-8 ${getEligibilityColor(interferenceEligibility.status)}`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    {getEligibilityIcon(interferenceEligibility.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold mb-2 flex items-center gap-2 uppercase tracking-wide">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />
                      Interference Eligibility
                    </h2>
                    
                    {interferenceEligibility.status === 'not-eligible' && (
                      <>
                        <p className="text-amber-400 font-semibold mb-2 text-sm sm:text-base">
                          ⚠️ Not Yet Eligible
                        </p>
                        <p className="text-gray-400 text-xs sm:text-sm mb-4">
                          Complete at least one Full Set (all 7 Inner States) to become eligible.
                        </p>
                      </>
                    )}

                    {interferenceEligibility.status === 'eligible' && (
                      <>
                        <p className="text-[#4FFFDF] font-semibold mb-2 text-sm sm:text-base">
                          ⚡️ You Are Eligible!
                        </p>
                        <p className="text-gray-400 text-xs sm:text-sm mb-4">
                          With {interferenceEligibility.completeSets} complete Full Set{interferenceEligibility.completeSets > 1 ? 's' : ''}, 
                          you can claim {interferenceEligibility.completeSets} Interference NFT{interferenceEligibility.completeSets > 1 ? 's' : ''}.
                        </p>
                      </>
                    )}

                    {interferenceEligibility.status === 'has-interference' && (
                      <>
                        <p className="text-[#00D4FF] font-semibold mb-2 text-sm sm:text-base">
                          ⚡ Interference Holder
                        </p>
                        <p className="text-gray-400 text-xs sm:text-sm mb-4">
                          You own {interferenceEligibility.interferenceNftsOwned} Interference NFT{interferenceEligibility.interferenceNftsOwned > 1 ? 's' : ''}.
                          {interferenceEligibility.canClaimMore && (
                            <span className="text-[#4FFFDF]"> You can claim {interferenceEligibility.completeSets - interferenceEligibility.interferenceNftsOwned} more!</span>
                          )}
                        </p>
                      </>
                    )}

                    {interferenceEligibility.status === 'maxed-out' && (
                      <>
                        <p className="text-[#00D4FF] font-semibold mb-2 text-sm sm:text-base">
                          🏆 Maximum Reached
                        </p>
                        <p className="text-gray-400 text-xs sm:text-sm mb-4">
                          You&apos;ve claimed all available Interference NFTs ({interferenceEligibility.interferenceNftsOwned} total).
                        </p>
                      </>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-white/10">
                      <div className="p-2 sm:p-3 bg-black/30 rounded-lg">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Full Sets</p>
                        <p className="text-base sm:text-lg font-bold">{interferenceEligibility.completeSets}</p>
                      </div>
                      <div className="p-2 sm:p-3 bg-black/30 rounded-lg">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Interference</p>
                        <p className="text-base sm:text-lg font-bold text-[#00D4FF]">{interferenceEligibility.interferenceNftsOwned}</p>
                      </div>
                      <div className="p-2 sm:p-3 bg-black/30 rounded-lg">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Can Claim</p>
                        <p className="text-base sm:text-lg font-bold text-[#4FFFDF]">
                          {Math.max(0, interferenceEligibility.completeSets - interferenceEligibility.interferenceNftsOwned)}
                        </p>
                      </div>
                      <div className="p-2 sm:p-3 bg-black/30 rounded-lg">
                        <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide">Status</p>
                        <p className={`text-base sm:text-lg font-bold ${
                          interferenceEligibility.eligible ? 'text-[#4FFFDF]' : 'text-amber-400'
                        }`}>
                          {interferenceEligibility.eligible ? '✓' : '✗'}
                        </p>
                      </div>
                    </div>

                    {/* Next Requirement */}
                    {interferenceEligibility.nextClaimRequirement && (
                      <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-black/50 rounded-lg flex items-start gap-2">
                        <Info className="w-4 h-4 text-[#00D4FF] mt-0.5 flex-shrink-0" />
                        <p className="text-xs sm:text-sm text-gray-400">
                          <span className="text-gray-500">Next:</span>{' '}
                          {interferenceEligibility.nextClaimRequirement}
                        </p>
                      </div>
                    )}

                    {/* CTA */}
                    {interferenceEligibility.eligible && interferenceEligibility.canClaimMore && (
                      <div className="mt-3 sm:mt-4">
                        <a
                          href="https://x.com/gmhunterart"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary inline-flex items-center gap-2 text-sm py-2.5"
                        >
                          Follow @gmhunterart
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Inner States Grid */}
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 uppercase tracking-wide">Inner States Collection</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {INNER_STATES.map((state) => {
                const status = fullSetStatus.find(s => s.innerState === state);
                const owned = status?.owned || false;
                const count = status?.count || 0;
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
                    
                    {!owned && (
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
                  </div>
                );
              })}
            </div>

            {/* Interference NFTs Owned */}
            {interferenceEligibility && interferenceEligibility.interferenceNftsOwned > 0 && (
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
