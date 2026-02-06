'use client';

import { Twitter, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// Extend Window interface for Twitter widgets
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
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Load Twitter widgets script
    const loadTwitterScript = () => {
      // Check if script already exists
      if (document.getElementById('twitter-wjs')) {
        // Script exists, just reload widgets
        if (window.twttr?.widgets) {
          window.twttr.widgets.load(containerRef.current || undefined);
          setLoaded(true);
        }
        return;
      }

      const script = document.createElement('script');
      script.id = 'twitter-wjs';
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      
      script.onload = () => {
        // Wait a bit for twttr to initialize
        setTimeout(() => {
          if (window.twttr?.widgets) {
            window.twttr.widgets.load(containerRef.current || undefined);
            setLoaded(true);
          }
        }, 100);
      };
      
      script.onerror = () => {
        setError(true);
      };

      document.body.appendChild(script);
    };

    loadTwitterScript();

    // Timeout fallback - if not loaded after 10s, show error
    const timeout = setTimeout(() => {
      if (!loaded) {
        setError(true);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [username, loaded]);

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
      
      {/* Timeline - Official Twitter Embed */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto max-h-[500px] p-2"
      >
        {error ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 text-sm p-4 text-center">
            <Twitter className="w-10 h-10 mb-3 opacity-30" />
            <p className="mb-3">Timeline unavailable</p>
            <a
              href={`https://x.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs"
            >
              View on X →
            </a>
          </div>
        ) : (
          /* Official Twitter Timeline Embed */
          <a
            className="twitter-timeline"
            data-theme="dark"
            data-chrome="noheader nofooter noborders transparent"
            data-tweet-limit="5"
            data-dnt="true"
            href={`https://twitter.com/${username}?ref_src=twsrc%5Etfw`}
          >
            {!loaded && (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                <div className="animate-pulse flex flex-col items-center gap-2">
                  <Twitter className="w-8 h-8 opacity-50" />
                  <span className="text-sm">Loading tweets...</span>
                </div>
              </div>
            )}
          </a>
        )}
      </div>
    </div>
  );
}

function TwitterSearchCard() {
  const searchUrl = 'https://x.com/search?q=%40NODESonBase%20OR%20%40gmhunterart%20OR%20%23NODES&src=typed_query&f=live';
  
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
        <TimelineColumn 
          username="NODESonBase" 
          title="@NODESonBase" 
        />
        <TimelineColumn 
          username="gmhunterart" 
          title="@gmhunterart" 
        />
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
