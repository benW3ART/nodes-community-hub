/**
 * Calculate global rarity for all NODES NFTs
 * Run: npx tsx scripts/calculate-rarity.ts
 * Or: npm run calculate-rarity
 *
 * This generates public/data/rarity.json with pre-calculated rarity scores.
 * Uses the LIVE metadata API (same source as gallery/full-sets) to ensure
 * counts reflect the current on-chain state after interferences.
 */

import * as fs from 'fs';
import * as path from 'path';

const TOTAL_SUPPLY = 3333;
const METADATA_API_URL = 'https://nodes-metadata-api.10amstudios.xyz/metadata';
const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 100;

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
  let failed = 0;

  console.log(`Fetching all ${TOTAL_SUPPLY} NFTs from live metadata API...`);

  for (let batchStart = 1; batchStart <= TOTAL_SUPPLY; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, TOTAL_SUPPLY);
    const promises: Promise<void>[] = [];

    for (let tokenId = batchStart; tokenId <= batchEnd; tokenId++) {
      promises.push(
        fetch(`${METADATA_API_URL}/${tokenId}`, { headers: { Accept: 'application/json' } })
          .then(async (res) => {
            if (!res.ok) {
              failed++;
              return;
            }
            const data = await res.json();
            const attributes: NFTAttribute[] = data.attributes || [];
            nfts.push({ tokenId: String(tokenId), attributes });
          })
          .catch(() => { failed++; })
      );
    }

    await Promise.all(promises);

    if (batchEnd % 200 === 0 || batchEnd === TOTAL_SUPPLY) {
      console.log(`  ${nfts.length}/${TOTAL_SUPPLY} fetched (${failed} failed)...`);
    }

    // Rate limiting between batches
    if (batchEnd < TOTAL_SUPPLY) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  console.log(`Total NFTs fetched: ${nfts.length} (${failed} failed)`);
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
  console.log('=== NODES Rarity Calculator ===');
  console.log('Source: Live metadata API (nodes-metadata-api.10amstudios.xyz)\n');
  
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
