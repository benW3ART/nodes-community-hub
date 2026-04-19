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
          const config = (await res.json()) as
            | {
                announceAt?: string;
                snapshotAt?: string;
                intermediateAt?: string;
                revealAt?: string;
              }
            | null;
          if (
            config &&
            config.announceAt &&
            config.snapshotAt &&
            config.intermediateAt &&
            config.revealAt
          ) {
            const announceMs = new Date(config.announceAt).getTime();
            const snapshotMs = new Date(config.snapshotAt).getTime();
            const intermediateMs = new Date(config.intermediateAt).getTime();
            const revealMs = new Date(config.revealAt).getTime();
            if (
              !Number.isNaN(announceMs) &&
              !Number.isNaN(snapshotMs) &&
              !Number.isNaN(intermediateMs) &&
              !Number.isNaN(revealMs)
            ) {
              setDates({
                announceAt: announceMs,
                snapshotAt: snapshotMs,
                intermediateAt: intermediateMs,
                revealAt: revealMs,
              });
            } else {
              setDates(derivePhaseDates(computeDefaultRevealDate()));
            }
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
