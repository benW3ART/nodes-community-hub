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
  Sparkles
} from 'lucide-react';
import Image from 'next/image';

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

  const [openSeaListings, setOpenSeaListings] = useState<Record<string, any[]>>({});
  const [loadingListings, setLoadingListings] = useState(false);

  useEffect(() => {
    async function fetchNFTs() {
      if (!address) return;
      
      setLoading(true);
      
      try {
        const fetchedNfts = await getNFTsForOwner(address);
        setNfts(fetchedNfts);
        
        const analysis = analyzeFullSets(fetchedNfts);
        setFullSetAnalysis(analysis.status, analysis.completeSets, analysis.missingStates);
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

  // Fetch OpenSea listings for missing states
  useEffect(() => {
    async function fetchListings() {
      if (missingStates.length === 0) return;
      
      setLoadingListings(true);
      
      try {
        // Fetch listings from our API endpoint
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

  const progressPercentage = ((7 - missingStates.length) / 7) * 100;

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="section-title">Full Set Tracker</h1>
        <p className="text-gray-400 mb-8">
          Collect all 7 Inner States to complete a Full Set and become eligible for Interference!
        </p>

        {!isConnected ? (
          <div className="card text-center py-16">
            <Wallet className="w-16 h-16 mx-auto mb-6 text-gray-600" />
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">
              Connect your wallet to track your Full Set progress
            </p>
            <ConnectButton />
          </div>
        ) : isLoading ? (
          <div className="card text-center py-16">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-500 animate-spin" />
            <p className="text-gray-400">Analyzing your collection...</p>
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <div className="card mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {completeSets > 0 ? (
                      <span className="text-green-400 flex items-center gap-2">
                        <Sparkles className="w-6 h-6" />
                        {completeSets} Complete Full Set{completeSets > 1 ? 's' : ''}!
                      </span>
                    ) : (
                      <span className="text-yellow-400">
                        {7 - missingStates.length}/7 Inner States Collected
                      </span>
                    )}
                  </h2>
                  <p className="text-gray-400">
                    {missingStates.length === 0 
                      ? '🎉 Congratulations! You have a complete Full Set!'
                      : `You need ${missingStates.length} more Inner State${missingStates.length > 1 ? 's' : ''} to complete a Full Set`
                    }
                  </p>
                </div>
                
                {/* Progress Ring */}
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-800"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#progress-gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${progressPercentage * 3.52} 352`}
                    />
                    <defs>
                      <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{7 - missingStates.length}/7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inner States Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {INNER_STATES.map((state) => {
                const status = fullSetStatus.find(s => s.innerState === state);
                const owned = status?.owned || false;
                const count = status?.count || 0;
                const listings = openSeaListings[state] || [];
                
                return (
                  <div 
                    key={state}
                    className={`card ${owned ? 'full-set-complete' : 'full-set-incomplete'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">{state}</h3>
                      {owned ? (
                        <div className="flex items-center gap-2">
                          <span className="badge-green">×{count}</span>
                          <Check className="w-5 h-5 text-green-400" />
                        </div>
                      ) : (
                        <X className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    
                    {!owned && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-2">Available on OpenSea:</p>
                        {loadingListings ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-sm">Loading...</span>
                          </div>
                        ) : listings.length > 0 ? (
                          <div className="space-y-2">
                            {listings.slice(0, 3).map((listing: any) => (
                              <a
                                key={listing.tokenId}
                                href={listing.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  {listing.image && (
                                    <Image
                                      src={listing.image}
                                      alt={`NODES #${listing.tokenId}`}
                                      width={32}
                                      height={32}
                                      className="rounded"
                                    />
                                  )}
                                  <span className="text-sm">#{listing.tokenId}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-purple-400">
                                    {listing.price} ETH
                                  </span>
                                  <ExternalLink className="w-4 h-4 text-gray-500" />
                                </div>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <a
                            href={`https://opensea.io/collection/nodes-by-hunter?search[stringTraits][0][name]=Inner%20State&search[stringTraits][0][values][0]=${encodeURIComponent(state)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
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

            {/* Interference Eligibility */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                Interference Eligibility
              </h2>
              {completeSets > 0 ? (
                <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                  <p className="text-green-400 font-semibold mb-2">
                    ✨ You are eligible for Interference!
                  </p>
                  <p className="text-gray-400 text-sm">
                    With {completeSets} complete Full Set{completeSets > 1 ? 's' : ''}, you can participate in the next Interference event.
                    Follow @gmhunterart for announcements.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                  <p className="text-yellow-400 font-semibold mb-2">
                    ⚠️ Not yet eligible
                  </p>
                  <p className="text-gray-400 text-sm">
                    Complete at least one Full Set (all 7 Inner States) to become eligible for Interference.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
