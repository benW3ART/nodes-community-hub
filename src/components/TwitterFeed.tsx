'use client';

import { useEffect, useState, useCallback } from 'react';
import { Twitter, ExternalLink, RefreshCw, Heart, Repeat2, MessageCircle } from 'lucide-react';

interface Tweet {
  id: string;
  text: string;
  author: {
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
  url: string;
  metrics?: {
    likes: number;
    retweets: number;
    replies: number;
  };
}

interface TwitterFeedData {
  official: Tweet[];
  mentions: Tweet[];
  lastFetch: number;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TweetCard({ tweet }: { tweet: Tweet }) {
  // Parse hashtags and mentions
  const formatText = (text: string) => {
    return text
      .replace(/(#\w+)/g, '<span class="text-[#00D4FF]">$1</span>')
      .replace(/(@\w+)/g, '<span class="text-[#4FFFDF]">$1</span>')
      .replace(/(https?:\/\/[^\s]+)/g, '<span class="text-[#00D4FF] underline">$1</span>');
  };

  return (
    <a
      href={tweet.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 hover:bg-[#111] transition-colors border-b border-[#1a1a1a] last:border-b-0"
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00D4FF] to-[#4FFFDF] flex items-center justify-center flex-shrink-0">
          <span className="text-black font-bold text-sm">
            {tweet.author.displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm truncate">{tweet.author.displayName}</span>
            <span className="text-gray-500 text-sm">@{tweet.author.username}</span>
            <span className="text-gray-600 text-xs">·</span>
            <span className="text-gray-500 text-xs">{formatTimeAgo(tweet.createdAt)}</span>
          </div>
          <p 
            className="text-sm text-gray-300 leading-relaxed break-words"
            dangerouslySetInnerHTML={{ __html: formatText(tweet.text) }}
          />
          {tweet.metrics && (
            <div className="flex items-center gap-4 mt-2 text-gray-500 text-xs">
              <span className="flex items-center gap-1 hover:text-[#F91880]">
                <Heart className="w-3.5 h-3.5" />
                {tweet.metrics.likes}
              </span>
              <span className="flex items-center gap-1 hover:text-[#00BA7C]">
                <Repeat2 className="w-3.5 h-3.5" />
                {tweet.metrics.retweets}
              </span>
              <span className="flex items-center gap-1 hover:text-[#1D9BF0]">
                <MessageCircle className="w-3.5 h-3.5" />
                {tweet.metrics.replies}
              </span>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

function TweetList({ 
  tweets, 
  username, 
  title,
  loading,
  error 
}: { 
  tweets: Tweet[]; 
  username?: string;
  title?: string;
  loading: boolean;
  error: boolean;
}) {
  const displayTitle = title || (username ? `@${username}` : 'Tweets');
  const profileUrl = username ? `https://x.com/${username}` : 'https://x.com/search?q=%40NODESonBase%20OR%20%40gmhunterart';
  
  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl overflow-hidden">
      <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Twitter className="w-4 h-4 text-[#00D4FF]" />
          <span className="font-medium text-sm">{displayTitle}</span>
        </div>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00D4FF] hover:text-[#4FFFDF] text-xs flex items-center gap-1"
        >
          View on X
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      
      <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-[300px] text-gray-500 text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            Loading tweets...
          </div>
        )}
        
        {!loading && error && tweets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 text-sm p-4 text-center">
            <Twitter className="w-10 h-10 mb-3 opacity-30" />
            <p className="mb-3">Couldn&apos;t load tweets</p>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs"
            >
              View on X →
            </a>
          </div>
        )}
        
        {!loading && tweets.length > 0 && (
          <div>
            {tweets.map((tweet) => (
              <TweetCard key={tweet.id} tweet={tweet} />
            ))}
          </div>
        )}
        
        {!loading && !error && tweets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500 text-sm p-4 text-center">
            <Twitter className="w-10 h-10 mb-3 opacity-30" />
            <p className="mb-3">No recent tweets</p>
            <a
              href={profileUrl}
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
      
      <div className="p-8 flex flex-col items-center justify-center text-center h-[300px]">
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
  const [feedData, setFeedData] = useState<TwitterFeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      
      const response = await fetch('/api/twitter-feed');
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setFeedData(data);
    } catch (err) {
      console.error('Failed to fetch Twitter feed:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Split official tweets by account
  const nodesTweets = feedData?.official.filter(t => t.author.username === 'NODESonBase') || [];
  const hunterTweets = feedData?.official.filter(t => t.author.username === 'gmhunterart') || [];

  return (
    <section className="mt-10 sm:mt-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="section-title text-lg sm:text-2xl flex items-center gap-3">
          <Twitter className="w-6 h-6 text-[#00D4FF]" />
          Community Feed
        </h2>
        <button
          onClick={fetchFeed}
          disabled={loading}
          className="text-gray-500 hover:text-[#00D4FF] transition-colors p-2 rounded-lg hover:bg-[#111] disabled:opacity-50"
          title="Refresh feed"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TweetList 
          tweets={nodesTweets} 
          username="NODESonBase" 
          loading={loading}
          error={error}
        />
        <TweetList 
          tweets={hunterTweets} 
          username="gmhunterart" 
          loading={loading}
          error={error}
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
