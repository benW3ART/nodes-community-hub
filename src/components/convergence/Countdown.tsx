'use client';

import { useEffect, useState } from 'react';

interface CountdownProps {
  target: number;
  label: string;
}

interface Parts {
  d: number;
  h: number;
  m: number;
  s: number;
}

function computeParts(target: number, now: number): Parts {
  const diff = Math.max(0, target - now);
  return {
    d: Math.floor(diff / (24 * 3600 * 1000)),
    h: Math.floor((diff % (24 * 3600 * 1000)) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

function Box({ value, unit }: { value: number; unit: string }) {
  return (
    <div
      style={{
        minWidth: 68,
        padding: '10px 8px',
        borderRadius: 10,
        background: '#0A0A0A',
        border: '1px solid rgba(0,212,255,0.25)',
        boxShadow: '0 0 18px rgba(0,212,255,0.08)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-orbitron, 'Orbitron'), sans-serif",
          fontSize: 28,
          fontWeight: 800,
          color: '#00D4FF',
          lineHeight: 1,
          textShadow: '0 0 12px rgba(0,212,255,0.35)',
        }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <div
        style={{
          fontSize: 9,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#6B7280',
          marginTop: 6,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}
      >
        {unit}
      </div>
    </div>
  );
}

export function Countdown({ target, label }: CountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { d, h, m, s } = computeParts(target, now);

  return (
    <time
      dateTime={new Date(target).toISOString()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div
        style={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#6B7280',
        }}
      >
        {label}
      </div>
      <div
        aria-live="polite"
        style={{ display: 'flex', gap: 8 }}
      >
        <Box value={d} unit="Days" />
        <Box value={h} unit="Hours" />
        <Box value={m} unit="Min" />
        <Box value={s} unit="Sec" />
      </div>
    </time>
  );
}
