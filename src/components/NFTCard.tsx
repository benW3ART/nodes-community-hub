'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';
import type { NodeNFT } from '@/types/nft';
import { useNodesStore } from '@/stores/useNodesStore';

interface NFTCardProps {
  nft: NodeNFT;
  selectable?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function NFTCard({ nft, selectable = false, onClick, size = 'md' }: NFTCardProps) {
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
          {nft.interference && (
            <span className="text-xs text-pink-400">⚡</span>
          )}
        </div>
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
