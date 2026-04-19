export type Phase = 'announce' | 'snapshot' | 'intermediate' | 'reveal';

export interface PhaseDates {
  announceAt: number;
  snapshotAt: number;
  intermediateAt: number;
  revealAt: number;
}

export const PHASE_LABELS: Record<Phase, string> = {
  announce: 'Announce',
  snapshot: 'Snapshot',
  intermediate: 'Intermediate',
  reveal: 'Reveal',
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const FRIDAY = 5;
const REVEAL_HOUR_UTC = 20;

export function computeDefaultRevealDate(now: number = Date.now()): number {
  const nowDate = new Date(now);
  const year = nowDate.getUTCFullYear();
  const month = nowDate.getUTCMonth();
  const day = nowDate.getUTCDate();
  const currentDow = nowDate.getUTCDay();

  const todayAtRevealHour = Date.UTC(year, month, day, REVEAL_HOUR_UTC, 0, 0, 0);

  if (currentDow === FRIDAY && now < todayAtRevealHour) {
    return todayAtRevealHour;
  }

  let daysUntilFriday = (FRIDAY - currentDow + 7) % 7;
  if (daysUntilFriday === 0) {
    daysUntilFriday = 7;
  }

  return Date.UTC(year, month, day + daysUntilFriday, REVEAL_HOUR_UTC, 0, 0, 0);
}

export function derivePhaseDates(revealAt: number): PhaseDates {
  return {
    announceAt: revealAt - 6 * DAY_MS,
    snapshotAt: revealAt - 48 * HOUR_MS,
    intermediateAt: revealAt - 36 * HOUR_MS,
    revealAt,
  };
}

export function currentPhase(now: number, dates: PhaseDates): Phase {
  if (now >= dates.revealAt) return 'reveal';
  if (now >= dates.intermediateAt) return 'intermediate';
  if (now >= dates.snapshotAt) return 'snapshot';
  return 'announce';
}
