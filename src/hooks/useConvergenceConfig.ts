'use client';

import { useEffect, useState } from 'react';
import {
  Phase,
  PhaseDates,
  computeDefaultRevealDate,
  derivePhaseDates,
  currentPhase,
} from '@/lib/convergence-phases';

export interface UseConvergenceConfigResult {
  dates: PhaseDates | null;
  phase: Phase;
  autoPhase: Phase;
  loading: boolean;
  phaseOverride: Phase | null;
  setPhaseOverride: (phase: Phase | null) => void;
}

export function useConvergenceConfig(): UseConvergenceConfigResult {
  const [dates, setDates] = useState<PhaseDates | null>(null);
  const [phase, setPhase] = useState<Phase>('announce');
  const [loading, setLoading] = useState(true);
  const [phaseOverride, setPhaseOverride] = useState<Phase | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/data/convergence-config.json', { cache: 'no-store' });
        if (cancelled) return;

        if (res.ok) {
          const config = (await res.json()) as { revealAt?: string } | null;
          const revealMs = config?.revealAt ? new Date(config.revealAt).getTime() : NaN;
          if (!Number.isNaN(revealMs)) {
            setDates(derivePhaseDates(revealMs));
          } else {
            setDates(derivePhaseDates(computeDefaultRevealDate()));
          }
        } else {
          setDates(derivePhaseDates(computeDefaultRevealDate()));
        }
      } catch {
        if (!cancelled) {
          setDates(derivePhaseDates(computeDefaultRevealDate()));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dates) return;
    const update = () => setPhase(currentPhase(Date.now(), dates));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [dates]);

  const effectivePhase = phaseOverride ?? phase;

  return {
    dates,
    phase: effectivePhase,
    autoPhase: phase,
    loading,
    phaseOverride,
    setPhaseOverride,
  };
}
