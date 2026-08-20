'use client';

import { Zap } from 'lucide-react';
import { useRefinementPhase } from '@/hooks/useRefinementPhase';

export function RefinementCountdown({ compact = false }: { compact?: boolean }) {
  const { phase, active, remaining } = useRefinementPhase();

  if (!active || !remaining) return null;

  if (compact) {
    return (
      <p className="text-xs sm:text-sm text-[#00D4FF] font-medium tabular-nums">
        {phase.label} {remaining}
      </p>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30">
      <Zap className="w-3.5 h-3.5 text-[#00D4FF]" />
      <span className="text-xs sm:text-sm text-[#00D4FF] font-medium tabular-nums">
        {phase.label} {remaining}
      </span>
    </div>
  );
}
