/**
 * Robot Convergence Eligibility Calculator
 *
 * Based on "The Convergence: The Emergence of Robot" by @gmhunterart
 *
 * Criteria (cumulative, scale with count):
 * 1. All 3 Types (FC + Skull + Ghost): min(FC, Skull, Ghost) → that many regular robots
 * 2. Inner State Full Set (7/7, 2+ FCs): each set = 2 regular robots
 *    GI and DR sets upgrade some of these:
 *    - GI IS Full Set: each = 1 rare + 1 regular (instead of 2 regular)
 *    - DR IS Full Set: each = 1 ultra rare + 2 regular (instead of 2 regular)
 *    Normal sets = total IS sets - GI sets - DR sets
 *
 * Each evolution consumes 1 Full Circle (no Network Status).
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
  count: number;       // how many combos/sets qualify
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
  typeCombos: number;
  totalISSets: number;
  normalISSets: number;
  giISSets: number;
  drISSets: number;
}

function getType(nft: NFTInput): string {
  const attr = nft.metadata.attributes.find(a => a.trait_type === 'Type');
  return attr?.value || '';
}

function countCompleteSets(nfts: NFTInput[]): { setCount: number; perState: Record<string, number> } {
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
  return { setCount, perState };
}

export function calculateConvergence(nfts: NFTInput[]): ConvergenceResult {
  // ── Classify NFTs ──────────────────────────────────────────────────────────
  const fullCircles = nfts.filter(n => getType(n) === 'Full Circle');
  const skulls = nfts.filter(n => getType(n) === 'Skull');
  const ghosts = nfts.filter(n => getType(n) === 'Ghost');

  // Full Circles available for evolution = those without Network Status
  const fullCirclesAvailable = fullCircles.filter(n => !n.networkStatus).length;

  const typesOwned = {
    fullCircle: fullCircles.length,
    skull: skulls.length,
    ghost: ghosts.length,
  };

  // ── Criterion 1: Type Combinations ─────────────────────────────────────────
  // Each combo of (1 FC + 1 Skull + 1 Ghost) = 1 regular robot
  const typeCombos = Math.min(fullCircles.length, skulls.length, ghosts.length);
  const crit1: ConvergenceCriterion = {
    id: 'type-combos',
    label: 'Type Combinations',
    description: 'Each set of (Full Circle + Skull + Ghost) = 1 regular robot',
    count: typeCombos,
    robots: { regular: typeCombos, rare: 0, ultraRare: 0, total: typeCombos },
    details: typeCombos > 0
      ? `✅ ${typeCombos} combo${typeCombos > 1 ? 's' : ''} (FC: ${fullCircles.length} · Skull: ${skulls.length} · Ghost: ${ghosts.length})`
      : `Missing: ${[
          fullCircles.length === 0 ? 'Full Circle' : '',
          skulls.length === 0 ? 'Skull' : '',
          ghosts.length === 0 ? 'Ghost' : '',
        ].filter(Boolean).join(', ')}`,
  };

  // ── IS Full Sets ───────────────────────────────────────────────────────────
  // Total IS sets across ALL NFTs
  const allIS = countCompleteSets(nfts);
  const totalISSets = allIS.setCount;

  // GI IS sets (from Genesis Interference NFTs only)
  const giNfts = nfts.filter(n => n.networkStatus === 'Genesis Interference');
  const giIS = countCompleteSets(giNfts);
  const giISSets = giIS.setCount;

  // DR IS sets (from Digital Renaissance NFTs only)
  const drNfts = nfts.filter(n => n.networkStatus === 'Digital Renaissance');
  const drIS = countCompleteSets(drNfts);
  const drISSets = drIS.setCount;

  // Normal IS sets = total - GI - DR (the non-specialized ones)
  const normalISSets = Math.max(0, totalISSets - giISSets - drISSets);

  // ── Criterion 2: Normal IS Full Sets ───────────────────────────────────────
  // Each normal set = 2 regular robots (requires 2+ FCs in collection)
  const hasEnoughFCForNormal = fullCircles.length >= 2;
  const effectiveNormalSets = hasEnoughFCForNormal ? normalISSets : 0;
  const crit2: ConvergenceCriterion = {
    id: 'normal-is-sets',
    label: 'Inner State Full Sets',
    description: 'Each IS set (7/7, 2+ Full Circles) = 2 regular robots',
    count: effectiveNormalSets,
    robots: { regular: effectiveNormalSets * 2, rare: 0, ultraRare: 0, total: effectiveNormalSets * 2 },
    details: (() => {
      if (totalISSets === 0) {
        const missing = INNER_STATES.filter(s => !allIS.perState[s] || allIS.perState[s] === 0);
        return `Missing IS: ${missing.join(', ')}`;
      }
      if (!hasEnoughFCForNormal) {
        return `Need 2+ Full Circles (have ${fullCircles.length})`;
      }
      return `✅ ${effectiveNormalSets} normal set${effectiveNormalSets !== 1 ? 's' : ''} (${totalISSets} total − ${giISSets} GI − ${drISSets} DR)`;
    })(),
  };

  // ── Criterion 3: GI IS Full Sets → Rare Robots ────────────────────────────
  const crit3: ConvergenceCriterion = {
    id: 'gi-is-sets',
    label: 'Genesis Interference Full Sets',
    description: 'Each GI IS set = 1 rare + 1 regular robot',
    count: giISSets,
    robots: { regular: giISSets, rare: giISSets, ultraRare: 0, total: giISSets * 2 },
    details: (() => {
      if (giNfts.length === 0) return 'No Genesis Interference NFTs';
      if (giISSets === 0) {
        const missing = INNER_STATES.filter(s => !giIS.perState[s] || giIS.perState[s] === 0);
        return `Missing GI IS: ${missing.join(', ')} (${giNfts.length} GI NFTs)`;
      }
      return `✅ ${giISSets} GI set${giISSets > 1 ? 's' : ''} (${giNfts.length} GI NFTs)`;
    })(),
  };

  // ── Criterion 4: DR IS Full Sets → Ultra Rare Robots ──────────────────────
  const crit4: ConvergenceCriterion = {
    id: 'dr-is-sets',
    label: 'Digital Renaissance Full Sets',
    description: 'Each DR IS set = 1 ultra rare + 2 regular robots',
    count: drISSets,
    robots: { regular: drISSets * 2, rare: 0, ultraRare: drISSets, total: drISSets * 3 },
    details: (() => {
      if (drNfts.length === 0) return 'No Digital Renaissance NFTs';
      if (drISSets === 0) {
        const missing = INNER_STATES.filter(s => !drIS.perState[s] || drIS.perState[s] === 0);
        return `Missing DR IS: ${missing.join(', ')} (${drNfts.length} DR NFTs)`;
      }
      return `✅ ${drISSets} DR set${drISSets > 1 ? 's' : ''} (${drNfts.length} DR NFTs)`;
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

  // Effective robots capped by available FCs
  // Priority: ultra rare > rare > regular
  let fcsLeft = fullCirclesAvailable;
  let effUltra = 0, effRare = 0, effRegular = 0;

  if (fcsLeft > 0 && totalRobots.ultraRare > 0) {
    const take = Math.min(totalRobots.ultraRare, fcsLeft);
    effUltra = take; fcsLeft -= take;
  }
  if (fcsLeft > 0 && totalRobots.rare > 0) {
    const take = Math.min(totalRobots.rare, fcsLeft);
    effRare = take; fcsLeft -= take;
  }
  if (fcsLeft > 0 && totalRobots.regular > 0) {
    const take = Math.min(totalRobots.regular, fcsLeft);
    effRegular = take; fcsLeft -= take;
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
    typeCombos,
    totalISSets,
    normalISSets,
    giISSets,
    drISSets,
  };
}
