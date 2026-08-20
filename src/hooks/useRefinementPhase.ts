'use client';

import { useEffect, useState } from 'react';
import {
  formatCountdown,
  getRefinementPhase,
  isRefinementCountdownActive,
} from '@/lib/refinement';

export function useRefinementPhase() {
  // null until mount so SSR and the first client render match (no ticking seconds).
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const start = new Date();
    if (!isRefinementCountdownActive(start)) return;

    setNow(start);
    const id = setInterval(() => {
      const t = new Date();
      setNow(t);
      if (!isRefinementCountdownActive(t)) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, []);

  const clock = now ?? new Date();
  const phase = getRefinementPhase(clock);
  const active = isRefinementCountdownActive(clock);
  const remaining = now && phase.endsAt ? formatCountdown(phase.endsAt, now) : null;

  return { phase, active, remaining, now };
}
