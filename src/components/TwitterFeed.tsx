'use client';

import { useState, useEffect } from 'react';
import { Twitter, Heart, Repeat2, MessageCircle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import Image from 'next/image';

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
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

function TweetCard({ tweet }: { tweet: Tweet }) {
  return (
    <a
      href={tweet.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl hover:border-[#00D4FF]/50 transition-all group"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[#1a1a1a] flex-shrink-0">
          {tweet.author.avatar ? (
            <Image
              src={tweet.author.avatar}
              alt={tweet.author.displayName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#00D4FF]">
              <Twitter className="w-5 h-5" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white truncate">{tweet.author.displayName}</span>
            {(tweet.author.username === 'NODESonBase' || tweet.author.username === 'gmhunterart') && (
              <span className="px-1.5 py-0.5 bg-[#00D4FF]/20 text-[#00D4FF] text-[10px] rounded font-medium">
                OFFICIAL
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span>@{tweet.author.username}</span>
            <span>·</span>
            <span>{formatTimeAgo(tweet.createdAt)}</span>
          </div>
        </div>
        <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-[#00D4FF] transition-colors flex-shrink-0" />
      </div>
      
      {/* Content */}
      <p className="text-gray-300 text-sm leading-relaxed mb-3 line-clamp-3">
        {tweet.text}
      </p>
      
      {/* Metrics */}
      {tweet.metrics && (
        <div className="flex items-center gap-4 text-gray-500 text-xs">
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            {formatNumber(tweet.metrics.replies)}
          </span>
          <span className="flex items-center gap-1">
            <Repeat2 className="w-3.5 h-3.5" />
            {formatNumber(tweet.metrics.retweets)}
          </span>
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {formatNumber(tweet.metrics.likes)}
          </span>
        </div>
      )}
    </a>
  );
}

function TweetSkeleton() {
  return (
    <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[#1a1a1a]" />
        <div className="flex-1">
          <div className="h-4 bg-[#1a1a1a] rounded w-32 mb-2" />
          <div className="h-3 bg-[#1a1a1a] rounded w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-[#1a1a1a] rounded w-full" />
        <div className="h-3 bg-[#1a1a1a] rounded w-4/5" />
      </div>
    </div>
  );
}

export function TwitterFeed() {
  const [data, setData] = useState<TwitterFeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'official' | 'mentions'>('official');

  const fetchTweets = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/twitter-feed');
      if (!response.ok) throw new Error('Failed to fetch');
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Twitter feed error:', err);
      setError('Unable to load tweets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
  }, []);

  const tweets = activeTab === 'official' ? data?.official : data?.mentions;

  return (
    <section className="mt-10 sm:mt-16">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="section-title text-lg sm:text-2xl flex items-center gap-3 mb-0">
          <Twitter className="w-6 h-6 text-[#00D4FF]" />
          Community Feed
        </h2>
        
        <div className="flex items-center gap-2">
          {/* Tab buttons */}
          <div className="flex bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-1">
            <button
              onClick={() => setActiveTab('official')}
              className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'official'
                  ? 'bg-[#00D4FF] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Official
            </button>
            <button
              onClick={() => setActiveTab('mentions')}
              className={`px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'mentions'
                  ? 'bg-[#00D4FF] text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Mentions
            </button>
          </div>
          
          {/* Refresh button */}
          <button
            onClick={fetchTweets}
            disabled={isLoading}
            className="p-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg hover:border-[#00D4FF]/50 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tab description */}
      <p className="text-gray-500 text-sm mb-4">
        {activeTab === 'official' 
          ? 'Latest posts from @NODESonBase and @gmhunterart'
          : 'Community posts mentioning NODES'
        }
      </p>

      {/* Content */}
      {isLoading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <TweetSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-gray-500">
          <Twitter className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{error}</p>
          <button
            onClick={fetchTweets}
            className="mt-4 btn-secondary text-sm"
          >
            Try Again
          </button>
        </div>
      ) : tweets && tweets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tweets.slice(0, 8).map((tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <Twitter className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No tweets found</p>
        </div>
      )}

      {/* View more link */}
      <div className="text-center mt-6">
        <a
          href={activeTab === 'official' 
            ? 'https://x.com/NODESonBase' 
            : 'https://x.com/search?q=%40NODESonBase%20OR%20%40gmhunterart&src=typed_query&f=live'
          }
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[#00D4FF] hover:text-[#4FFFDF] text-sm font-medium transition-colors"
        >
          View more on X
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
}
