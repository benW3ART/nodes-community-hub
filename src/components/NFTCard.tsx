'use client';

import Image from 'next/image';
import { Check, Sparkles } from 'lucide-react';
import type { NodeNFT } from '@/types/nft';
import type { RarityScore } from '@/lib/rarity';
import { getRarityTier } from '@/lib/rarity';
import { useNodesStore } from '@/stores/useNodesStore';

interface NFTCardProps {
  nft: NodeNFT;
  selectable?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  rarityScore?: RarityScore;
  showRarity?: boolean;
}

export function NFTCard({ 
  nft, 
  selectable = false, 
  onClick, 
  size = 'md',
  rarityScore,
  showRarity = false 
}: NFTCardProps) {
  const { selectedNfts, selectNft, deselectNft } = useNodesStore();
  const isSelected = selectedNfts.some(n => n.tokenId === nft.tokenId);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (selectable) {
      if (isSelected) {
        deselectNft(nft.tokenId);
      } else {
        selectNft(nft);
      }
    }
  };

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: '',
    lg: 'w-48 h-48',
  };

  const rarityTier = rarityScore?.percentile !== undefined 
    ? getRarityTier(rarityScore.percentile) 
    : null;

  return (
    <div
      className={`nft-card ${isSelected ? 'nft-card-selected' : ''} ${sizeClasses[size]}`}
      onClick={handleClick}
    >
      {/* Selection indicator */}
      {selectable && isSelected && (
        <div className="absolute top-2 right-2 z-10 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Rarity Badge */}
      {showRarity && rarityTier && rarityScore && (
        <div className={`absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-xs font-medium ${rarityTier.bgColor} ${rarityTier.color}`}>
          #{rarityScore.rank}
        </div>
      )}

      {/* NFT Image */}
      <div className="aspect-square relative overflow-hidden">
        {nft.image ? (
          <Image
            src={nft.image}
            alt={nft.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
      </div>

      {/* NFT Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm truncate">{nft.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-purple-400">{nft.innerState}</span>
          <div className="flex items-center gap-1">
            {nft.interference && (
              <span className="text-xs text-pink-400">⚡</span>
            )}
            {showRarity && rarityTier && (
              <span className={`text-xs ${rarityTier.color}`}>
                {rarityTier.tier}
              </span>
            )}
          </div>
        </div>
        
        {/* Rarity Score Display */}
        {showRarity && rarityScore && (
          <div className="mt-2 pt-2 border-t border-gray-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Rarity Score</span>
              <span className={`font-medium ${rarityTier?.color || 'text-gray-400'}`}>
                {rarityScore.totalScore.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Mini version for grid creator
export function NFTCardMini({ nft, onClick }: { nft: NodeNFT; onClick?: () => void }) {
  return (
    <div 
      className="aspect-square relative overflow-hidden rounded-lg cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
      onClick={onClick}
    >
      {nft.image ? (
        <Image
          src={nft.image}
          alt={nft.name}
          fill
          className="object-cover"
          sizes="100px"
        />
      ) : (
        <div className="w-full h-full bg-gray-800" />
      )}
    </div>
  );
}

// Card with rarity details (for expanded view)
export function NFTCardExpanded({ 
  nft, 
  rarityScore 
}: { 
  nft: NodeNFT; 
  rarityScore?: RarityScore;
}) {
  const rarityTier = rarityScore?.percentile !== undefined 
    ? getRarityTier(rarityScore.percentile) 
    : null;

  return (
    <div className="card overflow-hidden">
      {/* Image */}
      <div className="aspect-square relative overflow-hidden -m-6 mb-4">
        {nft.image ? (
          <Image
            src={nft.image}
            alt={nft.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 400px"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
        
        {/* Rarity Badge Overlay */}
        {rarityTier && rarityScore && (
          <div className={`absolute top-4 left-4 px-3 py-1 rounded-full font-medium ${rarityTier.bgColor} ${rarityTier.color} flex items-center gap-1`}>
            <Sparkles className="w-3 h-3" />
            {rarityTier.tier} - #{rarityScore.rank}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-6 pb-6">
        <h3 className="text-xl font-bold mb-2">{nft.name}</h3>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-2 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500">Inner State</p>
            <p className="text-sm font-medium text-purple-400">{nft.innerState}</p>
          </div>
          <div className="p-2 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500">Grid</p>
            <p className="text-sm font-medium">{nft.grid || 'N/A'}</p>
          </div>
          <div className="p-2 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500">Gradient</p>
            <p className="text-sm font-medium">{nft.gradient || 'N/A'}</p>
          </div>
          <div className="p-2 bg-gray-800/50 rounded-lg">
            <p className="text-xs text-gray-500">Glow</p>
            <p className="text-sm font-medium">{nft.glow || 'N/A'}</p>
          </div>
        </div>

        {nft.interference && (
          <div className="p-3 bg-pink-500/10 border border-pink-500/30 rounded-lg mb-4">
            <p className="text-pink-400 font-medium flex items-center gap-2">
              ⚡ Interference Edition
            </p>
          </div>
        )}

        {/* Rarity Details */}
        {rarityScore && (
          <div className="border-t border-gray-800 pt-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Rarity Analysis
            </h4>
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Total Score</span>
              <span className={`text-lg font-bold ${rarityTier?.color || 'text-white'}`}>
                {rarityScore.totalScore.toFixed(2)}
              </span>
            </div>
            
            <div className="space-y-2">
              {rarityScore.traitScores.slice(0, 5).map((trait, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    {trait.traitType}: <span className="text-gray-300">{trait.value}</span>
                  </span>
                  <span className="text-gray-400">
                    {trait.percentage.toFixed(1)}% ({trait.count}/{trait.total})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
