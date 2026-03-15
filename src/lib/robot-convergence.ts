/**
 * Robot Convergence Eligibility Calculator
 *
 * Based on "The Convergence: The Emergence of Robot" by @gmhunterart
 *
 * Criteria (cumulative, scale with count):
 * 1. All 3 Types (FC + Skull + Ghost): min(FC, Skull, Ghost) → that many new robots
 * 2. Inner State Full Set (7/7, 2+ FCs): each set = 2 new robots
 *    GI and DR sets upgrade some of these:
 *    - GI IS Full Set: each = 1 guaranteed ultra rare + 1 new robot
 *    - DR IS Full Set: each = 1 guaranteed ultra rare + 2 new robots
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
  newRobots: number;
  guaranteedUltraRare: number;
  total: number;
}

export interface ConvergenceCriterion {
  id: string;
  label: string;
  description: string;
  count: number;
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
  effectiveRobots: RobotBreakdown;
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
  const fullCircles = nfts.filter(n => getType(n) === 'Full Circle');
  const skulls = nfts.filter(n => getType(n) === 'Skull');
  const ghosts = nfts.filter(n => getType(n) === 'Ghost');

  const fullCirclesAvailable = fullCircles.filter(n => !n.networkStatus).length;

  const typesOwned = {
    fullCircle: fullCircles.length,
    skull: skulls.length,
    ghost: ghosts.length,
  };

  // ── Criterion 1: Type Combinations ─────────────────────────────────────────
  const typeCombos = Math.min(fullCircles.length, skulls.length, ghosts.length);
  const crit1: ConvergenceCriterion = {
    id: 'type-combos',
    label: 'Type Combinations',
    description: 'Each set of (Full Circle + Skull + Ghost) = 1 new robot',
    count: typeCombos,
    robots: { newRobots: typeCombos, guaranteedUltraRare: 0, total: typeCombos },
    details: typeCombos > 0
      ? `✅ ${typeCombos} combo${typeCombos > 1 ? 's' : ''} (FC: ${fullCircles.length} · Skull: ${skulls.length} · Ghost: ${ghosts.length})`
      : `Missing: ${[
          fullCircles.length === 0 ? 'Full Circle' : '',
          skulls.length === 0 ? 'Skull' : '',
          ghosts.length === 0 ? 'Ghost' : '',
        ].filter(Boolean).join(', ')}`,
  };

  // ── IS Full Sets ───────────────────────────────────────────────────────────
  const allIS = countCompleteSets(nfts);
  const totalISSets = allIS.setCount;

  const giNfts = nfts.filter(n => n.networkStatus === 'Genesis Interference');
  const giIS = countCompleteSets(giNfts);
  const giISSets = giIS.setCount;

  const drNfts = nfts.filter(n => n.networkStatus === 'Digital Renaissance');
  const drIS = countCompleteSets(drNfts);
  const drISSets = drIS.setCount;

  const normalISSets = Math.max(0, totalISSets - giISSets - drISSets);

  // ── Criterion 2: Normal IS Full Sets ───────────────────────────────────────
  const hasEnoughFC = fullCircles.length >= 2;
  const effectiveNormalSets = hasEnoughFC ? normalISSets : 0;
  const crit2: ConvergenceCriterion = {
    id: 'normal-is-sets',
    label: 'Inner State Full Sets',
    description: 'Each IS set (7/7, 2+ Full Circles) = 2 new robots',
    count: effectiveNormalSets,
    robots: { newRobots: effectiveNormalSets * 2, guaranteedUltraRare: 0, total: effectiveNormalSets * 2 },
    details: (() => {
      if (totalISSets === 0) {
        const missing = INNER_STATES.filter(s => !allIS.perState[s] || allIS.perState[s] === 0);
        return `Missing IS: ${missing.join(', ')}`;
      }
      if (!hasEnoughFC) return `Need 2+ Full Circles (have ${fullCircles.length})`;
      return `✅ ${effectiveNormalSets} normal set${effectiveNormalSets !== 1 ? 's' : ''} (${totalISSets} total − ${giISSets} GI − ${drISSets} DR)`;
    })(),
  };

  // ── Criterion 3: GI IS Full Sets → Guaranteed Ultra Rare ──────────────────
  const crit3: ConvergenceCriterion = {
    id: 'gi-is-sets',
    label: 'Genesis Interference Full Sets',
    description: 'Each GI IS set = 1 guaranteed ultra rare + 1 new robot',
    count: giISSets,
    robots: { newRobots: giISSets, guaranteedUltraRare: giISSets, total: giISSets * 2 },
    details: (() => {
      if (giNfts.length === 0) return 'No Genesis Interference NFTs';
      if (giISSets === 0) {
        const missing = INNER_STATES.filter(s => !giIS.perState[s] || giIS.perState[s] === 0);
        return `Missing GI IS: ${missing.join(', ')} (${giNfts.length} GI NFTs)`;
      }
      return `✅ ${giISSets} GI set${giISSets > 1 ? 's' : ''} (${giNfts.length} GI NFTs)`;
    })(),
  };

  // ── Criterion 4: DR IS Full Sets → Guaranteed Ultra Rare ──────────────────
  const crit4: ConvergenceCriterion = {
    id: 'dr-is-sets',
    label: 'Digital Renaissance Full Sets',
    description: 'Each DR IS set = 1 guaranteed ultra rare + 2 new robots',
    count: drISSets,
    robots: { newRobots: drISSets * 2, guaranteedUltraRare: drISSets, total: drISSets * 3 },
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
    newRobots: criteria.reduce((s, c) => s + c.robots.newRobots, 0),
    guaranteedUltraRare: criteria.reduce((s, c) => s + c.robots.guaranteedUltraRare, 0),
    total: criteria.reduce((s, c) => s + c.robots.total, 0),
  };

  const fullCirclesNeeded = totalRobots.total;
  const fullCirclesShortage = Math.max(0, fullCirclesNeeded - fullCirclesAvailable);
  const canFullyEvolve = fullCirclesShortage === 0;

  // Effective robots capped by available FCs
  // Priority: guaranteed ultra rare > new robots
  let fcsLeft = fullCirclesAvailable;
  let effUltra = 0, effNew = 0;

  if (fcsLeft > 0 && totalRobots.guaranteedUltraRare > 0) {
    const take = Math.min(totalRobots.guaranteedUltraRare, fcsLeft);
    effUltra = take; fcsLeft -= take;
  }
  if (fcsLeft > 0 && totalRobots.newRobots > 0) {
    const take = Math.min(totalRobots.newRobots, fcsLeft);
    effNew = take; fcsLeft -= take;
  }

  const effectiveRobots: RobotBreakdown = {
    newRobots: effNew,
    guaranteedUltraRare: effUltra,
    total: effNew + effUltra,
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
