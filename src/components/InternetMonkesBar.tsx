'use client';

import { INTERNET_MONKES_ARTICLE } from '@/lib/refinement';

export function InternetMonkesBar() {
  return (
    <a
      href={INTERNET_MONKES_ARTICLE}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#0a0a0a]/95 border-t border-[#1a1a1a] backdrop-blur-md hover:border-[#00D4FF]/40 transition-colors"
      aria-label="Internet Monkes — GTD mint exclusive to NODES holders. Read the article."
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center gap-3">
        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden border border-[#1a1a1a] bg-black shrink-0">
          <video
            src="/assets/internet-monkes/matrix.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs text-white font-medium truncate">
            Internet Monkes — GTD exclusive to NODES holders
          </p>
          <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">
            Fri 28 Aug · 12:00 PM ET · 2–3 spots/wallet · 0.0075 ETH on OpenSea
          </p>
        </div>
        <span className="hidden sm:inline text-[10px] text-[#00D4FF] uppercase tracking-wide shrink-0">
          Article →
        </span>
      </div>
    </a>
  );
}
