'use client';

import { Tweet } from 'react-tweet';
import { Twitter, ExternalLink, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

// Tweet IDs to display - update these periodically
// Run: bird --cookie-source chrome user-tweets NODESonBase -n 6 --json | jq '.[].id'
const TWEET_IDS = {
  NODESonBase: [
    '2019464630704214034',
    '2019426537615823033', 
    '2019395022916100306',
  ],
  gmhunterart: [
    '2019518116343214154',
    '2019515793004982788',
    '2019456703662624949',
  ],
};

function TweetColumn({ 
  username, 
  tweetIds,
  title 
}: { 
  username: string; 
  tweetIds: string[];
  title?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [failedTweets, setFailedTweets] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleTweetError = (id: string) => {
    setFailedTweets(prev => new Set(prev).add(id));
  };

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
      
      {/* Tweets */}
      <div className="flex-1 overflow-y-auto max-h-[500px] p-2 space-y-2 tweet-container">
        {!mounted ? (
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          tweetIds.map((id) => (
            !failedTweets.has(id) && (
              <div key={id} className="tweet-wrapper" data-theme="dark">
                <Tweet 
                  id={id} 
                  onError={() => handleTweetError(id)}
                />
              </div>
            )
          ))
        )}
        
        {mounted && tweetIds.every(id => failedTweets.has(id)) && (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 text-sm p-4 text-center">
            <Twitter className="w-10 h-10 mb-3 opacity-30" />
            <p className="mb-3">Tweets unavailable</p>
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
        <TweetColumn 
          username="NODESonBase" 
          tweetIds={TWEET_IDS.NODESonBase}
          title="@NODESonBase" 
        />
        <TweetColumn 
          username="gmhunterart" 
          tweetIds={TWEET_IDS.gmhunterart}
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
      
      {/* Styles for react-tweet dark theme */}
      <style jsx global>{`
        .tweet-container [data-theme="dark"] {
          --tweet-bg-color: #0a0a0a;
          --tweet-border: 1px solid #1a1a1a;
          --tweet-font-color: #e5e5e5;
          --tweet-font-color-secondary: #71767b;
          --tweet-actions-icon-color: #71767b;
          --tweet-link-color: #00D4FF;
          --tweet-quoted-bg-color: #111;
        }
        
        .tweet-wrapper > div {
          margin: 0 !important;
        }
        
        .tweet-wrapper article {
          border-radius: 12px !important;
          border: 1px solid #1a1a1a !important;
        }
      `}</style>
    </section>
  );
}
