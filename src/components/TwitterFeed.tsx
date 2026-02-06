'use client';

import Script from 'next/script';
import { Twitter, ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';

// Extend Window interface for Twitter widgets
declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => Promise<void>;
        createTimeline: (
          dataSource: { sourceType: string; screenName: string },
          targetEl: HTMLElement,
          options?: Record<string, unknown>
        ) => Promise<HTMLElement>;
      };
      ready: (callback: () => void) => void;
    };
  }
}

interface TimelineColumnProps {
  username: string;
  title?: string;
}

function TimelineColumn({ username, title }: TimelineColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const loadTimeline = useCallback(() => {
    if (!containerRef.current || !window.twttr?.widgets) return;

    // Clear container first
    containerRef.current.innerHTML = '';

    window.twttr.widgets
      .createTimeline(
        { sourceType: 'profile', screenName: username },
        containerRef.current,
        {
          theme: 'dark',
          chrome: 'noheader nofooter noborders transparent',
          tweetLimit: 5,
          dnt: true,
          height: 450,
        }
      )
      .then(() => {
        setStatus('ready');
      })
      .catch(() => {
        setStatus('error');
      });
  }, [username]);

  useEffect(() => {
    // If twttr is already loaded, create timeline
    if (window.twttr?.widgets) {
      window.twttr.ready(() => {
        loadTimeline();
      });
    }

    // Timeout fallback
    const timeout = setTimeout(() => {
      if (status === 'loading') {
        setStatus('error');
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [loadTimeline, status]);

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

      {/* Timeline Container */}
      <div className="flex-1 overflow-y-auto min-h-[450px]">
        {status === 'loading' && (
          <div className="flex items-center justify-center h-[450px] text-gray-500">
            <div className="animate-pulse flex flex-col items-center gap-2">
              <Twitter className="w-8 h-8 opacity-50" />
              <span className="text-sm">Loading tweets...</span>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center h-[450px] text-gray-500 text-sm p-4 text-center">
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
        )}

        <div
          ref={containerRef}
          className={status === 'ready' ? '' : 'hidden'}
        />
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
  const [scriptLoaded, setScriptLoaded] = useState(false);

  return (
    <section className="mt-10 sm:mt-16">
      {/* Load Twitter Widget Script */}
      <Script
        src="https://platform.twitter.com/widgets.js"
        strategy="lazyOnload"
        onLoad={() => {
          setScriptLoaded(true);
          // Trigger re-render of timelines
          if (window.twttr?.widgets) {
            window.twttr.widgets.load();
          }
        }}
      />

      <h2 className="section-title text-lg sm:text-2xl flex items-center gap-3 mb-6">
        <Twitter className="w-6 h-6 text-[#00D4FF]" />
        Community Feed
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scriptLoaded ? (
          <>
            <TimelineColumn username="NODESonBase" title="@NODESonBase" />
            <TimelineColumn username="gmhunterart" title="@gmhunterart" />
          </>
        ) : (
          <>
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 min-h-[450px] flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center gap-2 text-gray-500">
                <Twitter className="w-8 h-8 opacity-50" />
                <span className="text-sm">Loading Twitter...</span>
              </div>
            </div>
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-4 min-h-[450px] flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center gap-2 text-gray-500">
                <Twitter className="w-8 h-8 opacity-50" />
                <span className="text-sm">Loading Twitter...</span>
              </div>
            </div>
          </>
        )}
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
