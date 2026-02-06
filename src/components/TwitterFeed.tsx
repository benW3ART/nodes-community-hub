'use client';

import { useState, useEffect, useRef } from 'react';
import { Twitter, ExternalLink } from 'lucide-react';

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
        createTimeline: (
          source: { sourceType: string; screenName?: string; url?: string },
          target: HTMLElement,
          options?: Record<string, unknown>
        ) => Promise<HTMLElement>;
      };
    };
  }
}

function TwitterEmbed({ username, title }: { username: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const loadTimeline = async () => {
      // Wait for Twitter widgets to be ready
      const checkTwitter = () => {
        return new Promise<void>((resolve) => {
          const check = () => {
            if (window.twttr?.widgets) {
              resolve();
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });
      };

      try {
        await checkTwitter();
        
        if (containerRef.current && window.twttr) {
          // Clear container
          containerRef.current.innerHTML = '';
          
          await window.twttr.widgets.createTimeline(
            { sourceType: 'profile', screenName: username },
            containerRef.current,
            {
              theme: 'dark',
              chrome: 'noheader nofooter noborders transparent',
              tweetLimit: 3,
              width: '100%',
              dnt: true,
            }
          );
          setIsLoading(false);
          setError(false);
        }
      } catch (err) {
        console.error('Twitter embed error:', err);
        setError(true);
        setIsLoading(false);
      }
    };

    loadTimeline();
  }, [username]);

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Twitter className="w-4 h-4 text-[#00D4FF]" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        <a
          href={`https://x.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00D4FF] hover:text-[#4FFFDF] text-xs flex items-center gap-1"
        >
          @{username}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      
      <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
        {isLoading && !error && (
          <div className="flex items-center justify-center h-[300px] text-gray-500 text-sm">
            Loading tweets...
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 text-sm p-4 text-center">
            <Twitter className="w-8 h-8 mb-2 opacity-50" />
            <p>Unable to load tweets</p>
            <a
              href={`https://x.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-[#00D4FF] hover:text-[#4FFFDF]"
            >
              View on X →
            </a>
          </div>
        )}
        <div ref={containerRef} className={isLoading || error ? 'hidden' : ''} />
      </div>
    </div>
  );
}

function TwitterSearchEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const loadSearch = async () => {
      const checkTwitter = () => {
        return new Promise<void>((resolve) => {
          const check = () => {
            if (window.twttr?.widgets) {
              resolve();
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });
      };

      try {
        await checkTwitter();
        
        if (containerRef.current && window.twttr) {
          containerRef.current.innerHTML = '';
          
          // Use search URL for mentions
          await window.twttr.widgets.createTimeline(
            { 
              sourceType: 'url',
              url: 'https://twitter.com/search?q=%40NODESonBase%20OR%20%40gmhunterart%20-from%3ANODESonBase%20-from%3Agmhunterart'
            },
            containerRef.current,
            {
              theme: 'dark',
              chrome: 'noheader nofooter noborders transparent',
              tweetLimit: 5,
              width: '100%',
              dnt: true,
            }
          );
          setIsLoading(false);
          setError(false);
        }
      } catch (err) {
        console.error('Twitter search embed error:', err);
        setError(true);
        setIsLoading(false);
      }
    };

    loadSearch();
  }, []);

  const searchUrl = 'https://x.com/search?q=%40NODESonBase%20OR%20%40gmhunterart&src=typed_query&f=live';

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Twitter className="w-4 h-4 text-[#4FFFDF]" />
          <span className="font-medium text-sm">Community Mentions</span>
        </div>
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00D4FF] hover:text-[#4FFFDF] text-xs flex items-center gap-1"
        >
          View all
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      
      <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
        {isLoading && !error && (
          <div className="flex items-center justify-center h-[300px] text-gray-500 text-sm">
            Loading mentions...
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 text-sm p-4 text-center">
            <Twitter className="w-8 h-8 mb-2 opacity-50" />
            <p>Unable to load mentions</p>
            <a
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 text-[#00D4FF] hover:text-[#4FFFDF]"
            >
              Search on X →
            </a>
          </div>
        )}
        <div ref={containerRef} className={isLoading || error ? 'hidden' : ''} />
      </div>
    </div>
  );
}

export function TwitterFeed() {
  useEffect(() => {
    // Load Twitter widgets.js
    if (!document.getElementById('twitter-wjs')) {
      const script = document.createElement('script');
      script.id = 'twitter-wjs';
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <section className="mt-10 sm:mt-16">
      <h2 className="section-title text-lg sm:text-2xl flex items-center gap-3 mb-6">
        <Twitter className="w-6 h-6 text-[#00D4FF]" />
        Community Feed
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Official accounts */}
        <TwitterEmbed username="NODESonBase" title="NODES Official" />
        <TwitterEmbed username="gmhunterart" title="gmhunter" />
        
        {/* Community mentions */}
        <TwitterSearchEmbed />
      </div>

      {/* Direct links */}
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
