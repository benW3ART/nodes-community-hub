'use client';

import { Twitter, ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
      };
    };
  }
}

interface TimelineColumnProps {
  username: string;
  title?: string;
}

function TimelineColumn({ username, title }: TimelineColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Function to load Twitter widgets
    const loadWidgets = () => {
      if (window.twttr?.widgets && containerRef.current) {
        window.twttr.widgets.load(containerRef.current);
      }
    };

    // Check if script already exists
    const existingScript = document.getElementById('twitter-wjs');
    
    if (existingScript) {
      // Script exists, just reload widgets
      loadWidgets();
    } else {
      // Load script for the first time
      const script = document.createElement('script');
      script.id = 'twitter-wjs';
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.onload = () => {
        // Wait a bit for twttr to initialize
        setTimeout(loadWidgets, 500);
      };
      document.body.appendChild(script);
    }

    // Also try to load after a delay in case of race condition
    const timer = setTimeout(loadWidgets, 2000);
    
    return () => clearTimeout(timer);
  }, [username]);

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Twitter className="w-4 h-4 text-[#00D4FF]" />
          <span className="font-medium text-sm">{title || `@${username}`}</span>
        </div>
        <a
          href={`https://x.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00D4FF] hover:text-[#4FFFDF] text-xs flex items-center gap-1"
        >
          View on X
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* EXACT embed code from publish.x.com */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-2 min-h-[450px]">
        <a 
          className="twitter-timeline" 
          data-theme="dark"
          data-height="450"
          data-chrome="noheader nofooter noborders transparent"
          href={`https://twitter.com/${username}?ref_src=twsrc%5Etfw`}
        >
          Tweets by {username}
        </a>
      </div>
    </div>
  );
}

function TwitterSearchCard() {
  const searchUrl =
    'https://x.com/search?q=%40NODESonBase%20OR%20%40gmhunterart%20OR%20%23NODES&src=typed_query&f=live';

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Twitter className="w-4 h-4 text-[#4FFFDF]" />
          <span className="font-medium text-sm">Community Mentions</span>
        </div>
      </div>

      <div className="p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-[#4FFFDF]/10 flex items-center justify-center mb-4">
          <Twitter className="w-8 h-8 text-[#4FFFDF]" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Community Posts</h3>
        <p className="text-gray-500 text-sm mb-6 max-w-[200px]">
          See what the community is saying about NODES
        </p>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm flex items-center gap-2"
        >
          Search on X
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export function TwitterFeed() {
  return (
    <section className="mt-10 sm:mt-16">
      <h2 className="section-title text-lg sm:text-2xl flex items-center gap-3 mb-6">
        <Twitter className="w-6 h-6 text-[#00D4FF]" />
        Community Feed
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TimelineColumn username="NODESonBase" title="@NODESonBase" />
        <TimelineColumn username="gmhunterart" title="@gmhunterart" />
        <TwitterSearchCard />
      </div>

      <div className="text-center mt-6 flex flex-wrap justify-center gap-4">
        <a
          href="https://x.com/NODESonBase"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[#00D4FF] hover:text-[#4FFFDF] text-sm font-medium transition-colors"
        >
          <Twitter className="w-4 h-4" />
          @NODESonBase
        </a>
        <a
          href="https://x.com/gmhunterart"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[#00D4FF] hover:text-[#4FFFDF] text-sm font-medium transition-colors"
        >
          <Twitter className="w-4 h-4" />
          @gmhunterart
        </a>
      </div>
    </section>
  );
}
