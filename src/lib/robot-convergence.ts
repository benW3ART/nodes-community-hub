/**
 * Robot Convergence Eligibility Calculator
 *
 * Based on "The Convergence: The Emergence of Robot" by @gmhunterart
 *
 * Criteria (cumulative):
 * 1. All 3 Types (Full Circle + Skull + Ghost)       → 1 regular robot
 * 2. Inner State Full Set (7/7, 2+ Full Circles)     → 2 regular robots
 * 3. Genesis Interference IS Full Set (7/7 GI NFTs)  → 2 robots (1 rare + 1 regular)
 * 4. Digital Renaissance IS Full Set (7/7 DR NFTs)   → 3 robots (1 ultra rare + 2 regular)
 *
 * Each evolution consumes 1 Full Circle (no Network Status).
 * Criteria are cumulative. Max: 8 robots (6 regular + 1 rare + 1 ultra rare).
 */

import { INNER_STATES } from '@/lib/constants';

interface NFTInput {
  tokenId: string;
  innerState: string;
  networkStatus?: string;
  metadata: {
    attributes: { trait_type: string; value: string }[];
  };
}

export interface RobotBreakdown {
  regular: number;
  rare: number;
  ultraRare: number;
  total: number;
}

export interface ConvergenceCriterion {
  id: string;
  label: string;
  description: string;
  met: boolean;
  robots: RobotBreakdown;
  details: string;
}

export interface ConvergenceResult {
  criteria: ConvergenceCriterion[];
  totalRobots: RobotBreakdown;
  fullCirclesAvailable: number;
  fullCirclesNeeded: number;
  fullCirclesShortage: number;
  canFullyEvolve: boolean;
  effectiveRobots: RobotBreakdown; // capped by available FCs
  // Detailed counts for UI
  typesOwned: { fullCircle: number; skull: number; ghost: number };
  isFullSet: boolean;
  isFullSetCount: number;
  giFullSet: boolean;
  giFullSetCount: number;
  drFullSet: boolean;
  drFullSetCount: number;
}

function getType(nft: NFTInput): string {
  const attr = nft.metadata.attributes.find(a => a.trait_type === 'Type');
  return attr?.value || '';
}

function countInnerStateSets(nfts: NFTInput[]): { hasFull: boolean; setCount: number; perState: Record<string, number> } {
  const perState: Record<string, number> = {};
  for (const state of INNER_STATES) {
    perState[state] = 0;
  }
  for (const nft of nfts) {
    if (perState[nft.innerState] !== undefined) {
      perState[nft.innerState]++;
    }
  }
  const hasFull = INNER_STATES.every(s => perState[s] > 0);
  const setCount = hasFull ? Math.min(...INNER_STATES.map(s => perState[s])) : 0;
  return { hasFull, setCount, perState };
}

export function calculateConvergence(nfts: NFTInput[]): ConvergenceResult {
  // ── Classify NFTs ──────────────────────────────────────────────────────────
  const fullCircles = nfts.filter(n => getType(n) === 'Full Circle');
  const skulls = nfts.filter(n => getType(n) === 'Skull');
  const ghosts = nfts.filter(n => getType(n) === 'Ghost');

  // Full Circles available for evolution = those without Network Status
  const fullCirclesAvailable = fullCircles.filter(n => !n.networkStatus).length;

  // Type counts
  const typesOwned = {
    fullCircle: fullCircles.length,
    skull: skulls.length,
    ghost: ghosts.length,
  };

  // ── Criterion 1: All 3 Types ───────────────────────────────────────────────
  const has3Types = fullCircles.length > 0 && skulls.length > 0 && ghosts.length > 0;
  const crit1: ConvergenceCriterion = {
    id: 'three-types',
    label: 'All 3 Types',
    description: 'Hold at least 1 Full Circle, 1 Skull, and 1 Ghost',
    met: has3Types,
    robots: has3Types ? { regular: 1, rare: 0, ultraRare: 0, total: 1 } : { regular: 0, rare: 0, ultraRare: 0, total: 0 },
    details: has3Types
      ? `✅ FC: ${fullCircles.length} · Skull: ${skulls.length} · Ghost: ${ghosts.length}`
      : `Missing: ${[
          fullCircles.length === 0 ? 'Full Circle' : '',
          skulls.length === 0 ? 'Skull' : '',
          ghosts.length === 0 ? 'Ghost' : '',
        ].filter(Boolean).join(', ')}`,
  };

  // ── Criterion 2: Inner State Full Set (2+ Full Circles) ────────────────────
  const allNftsIS = countInnerStateSets(nfts);
  const hasISFullSet = allNftsIS.hasFull && fullCircles.length >= 2;
  const crit2: ConvergenceCriterion = {
    id: 'is-full-set',
    label: 'Inner State Full Set',
    description: 'All 7 Inner States + at least 2 Full Circles',
    met: hasISFullSet,
    robots: hasISFullSet ? { regular: 2, rare: 0, ultraRare: 0, total: 2 } : { regular: 0, rare: 0, ultraRare: 0, total: 0 },
    details: (() => {
      if (!allNftsIS.hasFull) {
        const missing = INNER_STATES.filter(s => !allNftsIS.perState[s] || allNftsIS.perState[s] === 0);
        return `Missing IS: ${missing.join(', ')}`;
      }
      if (fullCircles.length < 2) {
        return `Need 2+ Full Circles (have ${fullCircles.length})`;
      }
      return `✅ ${allNftsIS.setCount} complete set${allNftsIS.setCount > 1 ? 's' : ''} · ${fullCircles.length} FCs`;
    })(),
  };

  // ── Criterion 3: Genesis Interference IS Full Set ──────────────────────────
  const giNfts = nfts.filter(n => n.networkStatus === 'Genesis Interference');
  const giIS = countInnerStateSets(giNfts);
  const crit3: ConvergenceCriterion = {
    id: 'gi-full-set',
    label: 'Genesis Interference Full Set',
    description: 'All 7 Inner States among Genesis Interference NFTs → 1 Rare Robot',
    met: giIS.hasFull,
    robots: giIS.hasFull ? { regular: 1, rare: 1, ultraRare: 0, total: 2 } : { regular: 0, rare: 0, ultraRare: 0, total: 0 },
    details: (() => {
      if (!giIS.hasFull) {
        const missing = INNER_STATES.filter(s => !giIS.perState[s] || giIS.perState[s] === 0);
        return `Missing GI IS: ${missing.join(', ')} (have ${giNfts.length} GI NFTs)`;
      }
      return `✅ ${giIS.setCount} GI set${giIS.setCount > 1 ? 's' : ''} (${giNfts.length} GI NFTs)`;
    })(),
  };

  // ── Criterion 4: Digital Renaissance IS Full Set ───────────────────────────
  const drNfts = nfts.filter(n => n.networkStatus === 'Digital Renaissance');
  const drIS = countInnerStateSets(drNfts);
  const crit4: ConvergenceCriterion = {
    id: 'dr-full-set',
    label: 'Digital Renaissance Full Set',
    description: 'All 7 Inner States among DR NFTs → 1 Ultra Rare Robot',
    met: drIS.hasFull,
    robots: drIS.hasFull ? { regular: 2, rare: 0, ultraRare: 1, total: 3 } : { regular: 0, rare: 0, ultraRare: 0, total: 0 },
    details: (() => {
      if (!drIS.hasFull) {
        const missing = INNER_STATES.filter(s => !drIS.perState[s] || drIS.perState[s] === 0);
        return `Missing DR IS: ${missing.join(', ')} (have ${drNfts.length} DR NFTs)`;
      }
      return `✅ ${drIS.setCount} DR set${drIS.setCount > 1 ? 's' : ''} (${drNfts.length} DR NFTs)`;
    })(),
  };

  // ── Totals ─────────────────────────────────────────────────────────────────
  const criteria = [crit1, crit2, crit3, crit4];
  const totalRobots: RobotBreakdown = {
    regular: criteria.reduce((s, c) => s + c.robots.regular, 0),
    rare: criteria.reduce((s, c) => s + c.robots.rare, 0),
    ultraRare: criteria.reduce((s, c) => s + c.robots.ultraRare, 0),
    total: criteria.reduce((s, c) => s + c.robots.total, 0),
  };

  const fullCirclesNeeded = totalRobots.total;
  const fullCirclesShortage = Math.max(0, fullCirclesNeeded - fullCirclesAvailable);
  const canFullyEvolve = fullCirclesShortage === 0;

  // Effective robots (capped by available FCs)
  // Prioritize: ultra rare > rare > regular
  let fcsLeft = fullCirclesAvailable;
  let effUltra = 0, effRare = 0, effRegular = 0;

  if (fcsLeft > 0 && totalRobots.ultraRare > 0) {
    const take = Math.min(totalRobots.ultraRare, fcsLeft);
    effUltra = take;
    fcsLeft -= take;
  }
  if (fcsLeft > 0 && totalRobots.rare > 0) {
    const take = Math.min(totalRobots.rare, fcsLeft);
    effRare = take;
    fcsLeft -= take;
  }
  if (fcsLeft > 0 && totalRobots.regular > 0) {
    const take = Math.min(totalRobots.regular, fcsLeft);
    effRegular = take;
    fcsLeft -= take;
  }

  const effectiveRobots: RobotBreakdown = {
    regular: effRegular,
    rare: effRare,
    ultraRare: effUltra,
    total: effRegular + effRare + effUltra,
  };

  return {
    criteria,
    totalRobots,
    fullCirclesAvailable,
    fullCirclesNeeded,
    fullCirclesShortage,
    canFullyEvolve,
    effectiveRobots,
    typesOwned,
    isFullSet: allNftsIS.hasFull,
    isFullSetCount: allNftsIS.setCount,
    giFullSet: giIS.hasFull,
    giFullSetCount: giIS.setCount,
    drFullSet: drIS.hasFull,
    drFullSetCount: drIS.setCount,
  };
}
