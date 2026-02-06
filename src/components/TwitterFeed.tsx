'use client';

import { useEffect, useRef, useState } from 'react';
import { Twitter, ExternalLink, RefreshCw } from 'lucide-react';

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => Promise<void>;
      };
    };
  }
}

function TwitterTimelineEmbed({ username }: { username: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Load Twitter widgets script if not already loaded
    if (!document.getElementById('twitter-wjs')) {
      const script = document.createElement('script');
      script.id = 'twitter-wjs';
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      document.body.appendChild(script);
    }

    // Wait for script to load and render widget
    const timeout = setTimeout(() => {
      if (isLoading) {
        setError(true);
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    const checkAndRender = () => {
      if (window.twttr?.widgets && containerRef.current) {
        window.twttr.widgets.load(containerRef.current).then(() => {
          setIsLoading(false);
          clearTimeout(timeout);
        }).catch(() => {
          setError(true);
          setIsLoading(false);
        });
      } else {
        setTimeout(checkAndRender, 500);
      }
    };

    checkAndRender();

    return () => clearTimeout(timeout);
  }, [username]);

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Twitter className="w-4 h-4 text-[#00D4FF]" />
          <span className="font-medium text-sm">@{username}</span>
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
      
      <div className="min-h-[350px] max-h-[450px] overflow-y-auto twitter-embed-container">
        {isLoading && !error && (
          <div className="flex items-center justify-center h-[350px] text-gray-500 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading...
          </div>
        )}
        
        {error && (
          <div className="flex flex-col items-center justify-center h-[350px] text-gray-500 text-sm p-4 text-center">
            <Twitter className="w-10 h-10 mb-3 opacity-30" />
            <p className="mb-3">Tweets couldn&apos;t load</p>
            <a
              href={`https://x.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs"
            >
              View on X →
            </a>
          </div>
        )}
        
        <div ref={containerRef} className={isLoading || error ? 'hidden' : ''}>
          <a 
            className="twitter-timeline" 
            data-theme="dark"
            data-chrome="noheader nofooter noborders transparent"
            data-tweet-limit="5"
            data-dnt="true"
            href={`https://twitter.com/${username}?ref_src=twsrc%5Etfw`}
          >
            Loading @{username}...
          </a>
        </div>
      </div>
    </div>
  );
}

function TwitterSearchCard() {
  const searchUrl = 'https://x.com/search?q=%40NODESonBase%20OR%20%40gmhunterart&src=typed_query&f=live';
  
  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Twitter className="w-4 h-4 text-[#4FFFDF]" />
          <span className="font-medium text-sm">Community Mentions</span>
        </div>
      </div>
      
      <div className="p-8 flex flex-col items-center justify-center text-center h-[350px]">
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
        <TwitterTimelineEmbed username="NODESonBase" />
        <TwitterTimelineEmbed username="gmhunterart" />
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
      
      <style jsx global>{`
        .twitter-embed-container .twitter-timeline {
          width: 100% !important;
        }
        .twitter-embed-container iframe {
          border-radius: 0 !important;
        }
      `}</style>
    </section>
  );
}
