/**
 * Calculate global rarity for all NODES NFTs
 * Run: npx ts-node scripts/calculate-rarity.ts
 * Or: npm run calculate-rarity
 * 
 * This generates public/data/rarity.json with pre-calculated rarity scores
 */

import * as fs from 'fs';
import * as path from 'path';

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const NODES_CONTRACT = '0x95bc4c2e01c2e2d9e537e7a9fe58187e88dd8019';
const ALCHEMY_BASE_URL = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}`;

interface NFTAttribute {
  trait_type: string;
  value: string;
}

interface RarityData {
  tokenId: string;
  rarityScore: number;
  rarityRank: number;
  traits: Record<string, { value: string; rarity: number }>;
}

interface TraitCount {
  [traitType: string]: {
    [value: string]: number;
  };
}

async function fetchAllNFTs(): Promise<{ tokenId: string; attributes: NFTAttribute[] }[]> {
  const nfts: { tokenId: string; attributes: NFTAttribute[] }[] = [];
  let pageKey: string | undefined;
  let page = 0;
  
  console.log('Fetching all NFTs from Alchemy...');
  
  do {
    const url = `${ALCHEMY_BASE_URL}/getNFTsForContract?contractAddress=${NODES_CONTRACT}&withMetadata=true&limit=100${pageKey ? `&pageKey=${pageKey}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    for (const nft of data.nfts || []) {
      const tokenId = nft.tokenId || '';
      const attributes: NFTAttribute[] = nft.raw?.metadata?.attributes || [];
      
      nfts.push({ tokenId, attributes });
    }
    
    pageKey = data.pageKey;
    page++;
    console.log(`  Page ${page}: ${nfts.length} NFTs fetched...`);
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
    
  } while (pageKey);
  
  console.log(`Total NFTs fetched: ${nfts.length}`);
  return nfts;
}

function calculateTraitCounts(nfts: { tokenId: string; attributes: NFTAttribute[] }[]): TraitCount {
  const counts: TraitCount = {};
  
  for (const nft of nfts) {
    for (const attr of nft.attributes) {
      if (!attr.trait_type || !attr.value) continue;
      
      if (!counts[attr.trait_type]) {
        counts[attr.trait_type] = {};
      }
      
      counts[attr.trait_type][attr.value] = (counts[attr.trait_type][attr.value] || 0) + 1;
    }
  }
  
  return counts;
}

function calculateRarityScores(
  nfts: { tokenId: string; attributes: NFTAttribute[] }[],
  traitCounts: TraitCount
): RarityData[] {
  const totalNFTs = nfts.length;
  const rarityData: RarityData[] = [];
  
  for (const nft of nfts) {
    let rarityScore = 0;
    const traits: Record<string, { value: string; rarity: number }> = {};
    
    for (const attr of nft.attributes) {
      if (!attr.trait_type || !attr.value) continue;
      
      const traitCount = traitCounts[attr.trait_type]?.[attr.value] || totalNFTs;
      const traitRarity = 1 / (traitCount / totalNFTs);
      
      rarityScore += traitRarity;
      traits[attr.trait_type] = {
        value: attr.value,
        rarity: Math.round((traitCount / totalNFTs) * 10000) / 100, // Percentage
      };
    }
    
    rarityData.push({
      tokenId: nft.tokenId,
      rarityScore: Math.round(rarityScore * 100) / 100,
      rarityRank: 0, // Will be set after sorting
      traits,
    });
  }
  
  // Sort by rarity score (higher = rarer)
  rarityData.sort((a, b) => b.rarityScore - a.rarityScore);
  
  // Assign ranks
  rarityData.forEach((data, index) => {
    data.rarityRank = index + 1;
  });
  
  return rarityData;
}

async function main() {
  if (!ALCHEMY_API_KEY) {
    console.error('Error: NEXT_PUBLIC_ALCHEMY_API_KEY not set');
    console.log('Run with: NEXT_PUBLIC_ALCHEMY_API_KEY=your_key npx ts-node scripts/calculate-rarity.ts');
    process.exit(1);
  }
  
  console.log('=== NODES Rarity Calculator ===\n');
  
  // Fetch all NFTs
  const nfts = await fetchAllNFTs();
  
  if (nfts.length === 0) {
    console.error('No NFTs found!');
    process.exit(1);
  }
  
  // Calculate trait counts
  console.log('\nCalculating trait counts...');
  const traitCounts = calculateTraitCounts(nfts);
  
  // Log trait distribution
  console.log('\nTrait Distribution:');
  for (const [traitType, values] of Object.entries(traitCounts)) {
    console.log(`  ${traitType}: ${Object.keys(values).length} unique values`);
  }
  
  // Calculate rarity scores
  console.log('\nCalculating rarity scores...');
  const rarityData = calculateRarityScores(nfts, traitCounts);
  
  // Create output directory
  const outputDir = path.join(process.cwd(), 'public', 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Create a map for quick lookup by tokenId
  const rarityMap: Record<string, { rank: number; score: number; traits: Record<string, { value: string; rarity: number }> }> = {};
  for (const data of rarityData) {
    rarityMap[data.tokenId] = {
      rank: data.rarityRank,
      score: data.rarityScore,
      traits: data.traits,
    };
  }
  
  // Save to JSON files
  const fullPath = path.join(outputDir, 'rarity.json');
  fs.writeFileSync(fullPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalNFTs: nfts.length,
    traitCounts,
    nfts: rarityMap,
  }, null, 2));
  
  console.log(`\n✅ Rarity data saved to ${fullPath}`);
  
  // Show top 10 rarest
  console.log('\nTop 10 Rarest NFTs:');
  for (let i = 0; i < 10 && i < rarityData.length; i++) {
    const nft = rarityData[i];
    console.log(`  #${nft.rarityRank}: Token ${nft.tokenId} (Score: ${nft.rarityScore})`);
  }
  
  console.log('\nDone!');
}

main().catch(console.error);
