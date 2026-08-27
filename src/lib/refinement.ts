import type { NodeNFT } from '@/types/nft';

export const REFINEMENT_ARTICLE =
  'https://x.com/gmhunterart/status/2087540410700730663';
export const INTERNET_MONKES_ARTICLE =
  'https://x.com/internet_monkes/status/2090106899156947229';

/** Hunter writes "EST"; August is Eastern Daylight Time (UTC−4). */
export const REFINEMENT_SNAPSHOT_AT = new Date('2026-08-23T12:00:00-04:00');
export const REFINEMENT_BEGINS_AT = new Date('2026-08-25T12:00:00-04:00');
export const REFINEMENT_REVEAL_AT = new Date('2026-08-27T13:00:00-04:00');

export const REFINEMENT_STATUS = 'The Refinement';

export function isRefinementStatus(networkStatus?: string): boolean {
  return networkStatus === REFINEMENT_STATUS;
}

/**
 * Labels for the before/after comparison.
 *
 * Earlier interferences all evolved from the original art, so the left side is
 * labelled LEGACY. The Refinement redraws whatever version a token was already
 * on — which differs from token to token — so both sides stay generic.
 */
export function getBeforeLabel(networkStatus?: string): string {
  return isRefinementStatus(networkStatus) ? 'BEFORE' : 'LEGACY';
}

export function getAfterLabel(networkStatus?: string): string {
  return isRefinementStatus(networkStatus) ? 'AFTER' : (networkStatus || '').toUpperCase();
}

export type RefinementPhaseId = 'snapshot' | 'begins' | 'redrawn' | 'done';

export interface RefinementPhase {
  id: RefinementPhaseId;
  label: string;
  endsAt: Date | null;
}

export function getRefinementPhase(now: Date = new Date()): RefinementPhase {
  if (now < REFINEMENT_SNAPSHOT_AT) {
    return { id: 'snapshot', label: 'Snapshot in', endsAt: REFINEMENT_SNAPSHOT_AT };
  }
  if (now < REFINEMENT_BEGINS_AT) {
    return { id: 'begins', label: 'Interference begins in', endsAt: REFINEMENT_BEGINS_AT };
  }
  if (now < REFINEMENT_REVEAL_AT) {
    return { id: 'redrawn', label: 'Art being redrawn in', endsAt: REFINEMENT_REVEAL_AT };
  }
  return { id: 'done', label: 'Interference done', endsAt: null };
}

export function isRefinementCountdownActive(now: Date = new Date()): boolean {
  return now < REFINEMENT_REVEAL_AT;
}

export function isRefinementSnapshotTaken(now: Date = new Date()): boolean {
  return now >= REFINEMENT_SNAPSHOT_AT;
}

export function formatCountdown(endsAt: Date, now: Date = new Date()): string {
  const ms = Math.max(0, endsAt.getTime() - now.getTime());
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${String(s).padStart(2, '0')}s`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

export interface RefinementEligibility {
  skullCount: number;
  ghostCount: number;
  completeSets: number;
  skullRefinements: number;
  ghostRefinements: number;
  skullsTowardNext: number;
  missingGhostsForSet: boolean;
}

function getType(nft: NodeNFT): string {
  return nft.metadata?.attributes?.find(a => a.trait_type === 'Type')?.value || '';
}

export function calculateRefinement(
  nfts: NodeNFT[],
  completeSets: number
): RefinementEligibility {
  const skullCount = nfts.filter(n => getType(n) === 'Skull').length;
  const ghostCount = nfts.filter(n => getType(n) === 'Ghost').length;
  return {
    skullCount,
    ghostCount,
    completeSets,
    skullRefinements: Math.floor(skullCount / 3),
    ghostRefinements: completeSets,
    skullsTowardNext: skullCount % 3,
    missingGhostsForSet: completeSets > 0 && ghostCount === 0,
  };
}
