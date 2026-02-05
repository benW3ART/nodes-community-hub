'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getNFTsForOwner, analyzeFullSets } from '@/lib/alchemy';
import { useNodesStore } from '@/stores/useNodesStore';
import { NFTCard } from '@/components/NFTCard';
import { Loader2, Wallet } from 'lucide-react';

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

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title mb-2">My NODES Gallery</h1>
            {isConnected && nfts.length > 0 && (
              <p className="text-gray-400">
                You own {nfts.length} NODES NFT{nfts.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        {!isConnected ? (
          <div className="card text-center py-16">
            <Wallet className="w-16 h-16 mx-auto mb-6 text-gray-600" />
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">
              Connect your wallet to view your NODES NFTs
            </p>
            <ConnectButton />
          </div>
        ) : isLoading ? (
          <div className="card text-center py-16">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-500 animate-spin" />
            <p className="text-gray-400">Loading your NODES...</p>
          </div>
        ) : error ? (
          <div className="card text-center py-16">
            <p className="text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : nfts.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-semibold mb-4">No NODES Found</h2>
            <p className="text-gray-400 mb-6">
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
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button className="badge-purple">All ({nfts.length})</button>
              {/* Add filter by Inner State */}
            </div>

            {/* NFT Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {nfts.map((nft) => (
                <NFTCard key={nft.tokenId} nft={nft} selectable />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
