'use client';

import { useEffect, useState } from 'react';
import {
  formatCountdown,
  getRefinementPhase,
  isRefinementCountdownActive,
} from '@/lib/refinement';

export function useRefinementPhase() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const phase = getRefinementPhase(now);
  const active = isRefinementCountdownActive(now);
  const remaining = phase.endsAt ? formatCountdown(phase.endsAt, now) : null;

  return { phase, active, remaining, now };
}
