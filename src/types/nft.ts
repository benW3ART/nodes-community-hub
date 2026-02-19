export interface NFTAttribute {
  trait_type: string;
  value: string;
}

export interface NFTMetadata {
  name: string;
  description?: string;
  image: string;
  attributes: NFTAttribute[];
}

export interface NodeNFT {
  tokenId: string;
  name: string;
  image: string;
  innerState: string;
  grid: string;
  gradient: string;
  glow: string;
  interference: boolean;
  networkStatus?: string;
  metadata: NFTMetadata;
}

export interface FullSetStatus {
  innerState: string;
  owned: boolean;
  count: number;
  tokenIds: string[];
}

export interface MissingForFullSet {
  innerState: string;
  listings: OpenSeaListing[];
}

export interface OpenSeaListing {
  tokenId: string;
  price: string;
  priceUsd: string;
  image: string;
  url: string;
  seller: string;
}

export interface GridConfig {
  rows: number;
  cols: number;
  name: string;
}

export const GRID_PRESETS: GridConfig[] = [
  { rows: 2, cols: 2, name: '2×2' },
  { rows: 3, cols: 3, name: '3×3' },
  { rows: 4, cols: 4, name: '4×4' },
  { rows: 5, cols: 5, name: '5×5' },
  { rows: 4, cols: 6, name: '4×6' },
  { rows: 6, cols: 4, name: '6×4' },
];

export interface Template {
  id: string;
  name: string;
  type: 'post' | 'banner';
  nftSlots: number; // 0-7 for posts
  width: number;
  height: number;
  preview: string;
}
