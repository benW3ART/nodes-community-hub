import { describe, it, expect } from 'vitest';
import type { NodeNFT } from '@/types/nft';
import {
  calculateRefinement,
  formatCountdown,
  getRefinementPhase,
  isRefinementCountdownActive,
  REFINEMENT_BEGINS_AT,
  REFINEMENT_REVEAL_AT,
  REFINEMENT_SNAPSHOT_AT,
} from '../refinement';

function nft(tokenId: string, type: string, innerState = 'Verified'): NodeNFT {
  return {
    tokenId,
    name: `NODES #${tokenId}`,
    image: '',
    innerState,
    grid: '',
    gradient: '',
    glow: '',
    interference: false,
    metadata: {
      name: `NODES #${tokenId}`,
      image: '',
      attributes: [
        { trait_type: 'Type', value: type },
        { trait_type: 'Inner State', value: innerState },
      ],
    },
  };
}

describe('calculateRefinement', () => {
  it('gives 0 skull refinements below 3 skulls and tracks remainder', () => {
    const result = calculateRefinement([nft('1', 'Skull'), nft('2', 'Skull')], 0);
    expect(result.skullCount).toBe(2);
    expect(result.skullRefinements).toBe(0);
    expect(result.skullsTowardNext).toBe(2);
  });

  it('gives 1 skull refinement per 3 skulls, cumulative', () => {
    const skulls = Array.from({ length: 7 }, (_, i) => nft(String(i), 'Skull'));
    const result = calculateRefinement(skulls, 0);
    expect(result.skullRefinements).toBe(2);
    expect(result.skullsTowardNext).toBe(1);
  });

  it('gives 1 ghost refinement per complete inner-state set', () => {
    const result = calculateRefinement([nft('1', 'Ghost')], 2);
    expect(result.ghostRefinements).toBe(2);
    expect(result.ghostCount).toBe(1);
    expect(result.missingGhostsForSet).toBe(false);
  });

  it('notes when a full set is owned but no ghost is in the wallet', () => {
    const result = calculateRefinement([nft('1', 'Skull'), nft('2', 'Robot')], 1);
    expect(result.ghostRefinements).toBe(1);
    expect(result.missingGhostsForSet).toBe(true);
  });

  it('stacks skull and ghost refinements independently', () => {
    const nfts = [
      nft('1', 'Skull'),
      nft('2', 'Skull'),
      nft('3', 'Skull'),
      nft('4', 'Ghost'),
    ];
    const result = calculateRefinement(nfts, 1);
    expect(result.skullRefinements).toBe(1);
    expect(result.ghostRefinements).toBe(1);
  });
});

describe('getRefinementPhase', () => {
  it('is snapshot before Sunday noon ET', () => {
    const phase = getRefinementPhase(new Date(REFINEMENT_SNAPSHOT_AT.getTime() - 1000));
    expect(phase.id).toBe('snapshot');
    expect(isRefinementCountdownActive(new Date(REFINEMENT_SNAPSHOT_AT.getTime() - 1000))).toBe(true);
  });

  it('is begins after snapshot and before intermediate', () => {
    expect(getRefinementPhase(new Date(REFINEMENT_BEGINS_AT.getTime() - 1000)).id).toBe('begins');
  });

  it('is redrawn after intermediate and before reveal', () => {
    expect(getRefinementPhase(new Date(REFINEMENT_REVEAL_AT.getTime() - 1000)).id).toBe('redrawn');
  });

  it('is done after reveal and countdown hides', () => {
    const after = new Date(REFINEMENT_REVEAL_AT.getTime() + 1000);
    expect(getRefinementPhase(after).id).toBe('done');
    expect(isRefinementCountdownActive(after)).toBe(false);
  });
});

describe('formatCountdown', () => {
  it('shows days when more than 24h remain', () => {
    const now = new Date('2026-08-20T12:00:00-04:00');
    const end = new Date('2026-08-23T12:00:00-04:00');
    expect(formatCountdown(end, now)).toBe('3d 0h 0m');
  });
});
