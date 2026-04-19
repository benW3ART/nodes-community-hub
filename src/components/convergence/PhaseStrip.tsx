'use client';

import { PHASE_LABELS, type Phase, type PhaseDates } from '@/lib/convergence-phases';

interface PhaseStripProps {
  current: Phase;
  dates: PhaseDates;
}

const PHASE_ORDER: Phase[] = ['announce', 'snapshot', 'intermediate', 'reveal'];

const DATE_KEY: Record<Phase, keyof PhaseDates> = {
  announce: 'announceAt',
  snapshot: 'snapshotAt',
  intermediate: 'intermediateAt',
  reveal: 'revealAt',
};

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function PhaseStrip({ current, dates }: PhaseStripProps) {
  const currentIndex = PHASE_ORDER.indexOf(current);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        borderRadius: 12,
        background: '#0A0A0A',
        border: '1px solid #1a1a1a',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {PHASE_ORDER.map((p, i) => {
        const when = dates[DATE_KEY[p]];
        const active = current === p;
        const done = !active && i < currentIndex;

        const dotBg = active ? '#00D4FF' : done ? '#4FFFDF' : '#1a1a1a';
        const labelColor = active ? '#00D4FF' : done ? '#ffffff' : '#6B7280';

        return (
          <div
            key={p}
            style={{
              flex: 1,
              padding: '14px 16px',
              position: 'relative',
              borderRight: i < PHASE_ORDER.length - 1 ? '1px solid #1a1a1a' : 'none',
              background: active ? 'rgba(0,212,255,0.08)' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div
                className={active ? 'animate-pulse-glow' : ''}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 9999,
                  background: dotBg,
                  boxShadow: active ? '0 0 12px rgba(0,212,255,0.8)' : 'none',
                  flexShrink: 0,
                }}
              />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: labelColor,
                  }}
                >
                  {PHASE_LABELS[p]}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: '#6B7280',
                    marginTop: 2,
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                >
                  {formatDate(when)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
