'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

// Dynamic import with no SSR to avoid localStorage issues during build
const Web3Providers = dynamic(
  () => import('@/components/Providers').then(mod => mod.Providers),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-purple-500">Loading...</div>
      </div>
    )
  }
);

export function ClientProviders({ children }: { children: ReactNode }) {
  return <Web3Providers>{children}</Web3Providers>;
}
