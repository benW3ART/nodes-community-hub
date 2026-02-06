'use client';

import { useState, useEffect } from 'react';
import { Twitter, ExternalLink, RefreshCw } from 'lucide-react';

// Twitter Syndication iframe URL builder
function getTwitterTimelineUrl(username: string, theme: 'dark' | 'light' = 'dark'): string {
  const params = new URLSearchParams({
    dnt: 'true',
    embedId: `twitter-widget-${username}`,
    frame: 'false',
    hideCard: 'false',
    hideThread: 'false',
    lang: 'en',
    theme: theme,
    widgetsVersion: '2615f7e52b7e0:1702314776716',
  });
  
  return `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}?${params.toString()}`;
}

function TwitterTimelineIframe({ username, title }: { username: string; title?: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0);
  
  const iframeUrl = getTwitterTimelineUrl(username);
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handleRefresh = () => {
    setIsLoading(true);
    setKey(prev => prev + 1);
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Twitter className="w-4 h-4 text-[#00D4FF]" />
          <span className="font-medium text-sm">{title || `@${username}`}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="text-gray-500 hover:text-[#00D4FF] transition-colors p-1 rounded"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
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
      </div>
      
      {/* Timeline iframe */}
      <div className="relative flex-1 min-h-[400px] bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a] z-10">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00D4FF]" />
          </div>
        )}
        <iframe
          key={key}
          src={iframeUrl}
          className="w-full h-full min-h-[400px] border-0"
          onLoad={handleLoad}
          title={`${username} Twitter Timeline`}
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          loading="lazy"
        />
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
  // Track if component is mounted (for SSR safety)
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="mt-10 sm:mt-16">
      <h2 className="section-title text-lg sm:text-2xl flex items-center gap-3 mb-6">
        <Twitter className="w-6 h-6 text-[#00D4FF]" />
        Community Feed
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mounted ? (
          <>
            <TwitterTimelineIframe username="NODESonBase" title="@NODESonBase" />
            <TwitterTimelineIframe username="gmhunterart" title="@gmhunterart" />
          </>
        ) : (
          <>
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl min-h-[450px] animate-pulse" />
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl min-h-[450px] animate-pulse" />
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
