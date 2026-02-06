import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
  media?: {
    type: string;
    url: string;
  };
}

interface TweetCache {
  tweets: {
    NODESonBase: Tweet[];
    gmhunterart: Tweet[];
  };
  lastFetch: string;
  fetchedAt: number;
}

interface TwitterFeedData {
  official: Tweet[];
  mentions: Tweet[];
  lastFetch: number;
  source: 'cache' | 'fallback';
}

// In-memory cache to avoid reading file on every request
let memoryCache: TwitterFeedData | null = null;
let memoryCacheTime = 0;
const MEMORY_CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Read tweets from the pre-fetched cache file
 * This file is updated by scripts/fetch-tweets.ts (run via cron)
 */
function readTweetCache(): TweetCache | null {
  try {
    const cachePath = join(process.cwd(), 'public', 'data', 'tweets.json');
    
    if (!existsSync(cachePath)) {
      console.warn('Tweet cache not found at:', cachePath);
      return null;
    }
    
    const data = readFileSync(cachePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read tweet cache:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check memory cache first
    if (memoryCache && Date.now() - memoryCacheTime < MEMORY_CACHE_TTL) {
      return NextResponse.json(memoryCache, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    // Read from file cache
    const cache = readTweetCache();
    
    if (cache && cache.tweets) {
      // Combine tweets from both accounts
      const allTweets = [
        ...cache.tweets.NODESonBase,
        ...cache.tweets.gmhunterart,
      ].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const response: TwitterFeedData = {
        official: allTweets,
        mentions: [],
        lastFetch: cache.fetchedAt,
        source: 'cache',
      };

      // Update memory cache
      memoryCache = response;
      memoryCacheTime = Date.now();

      return NextResponse.json(response, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    // No cache available - return error response
    // The frontend will show an appropriate message
    return NextResponse.json({
      official: [],
      mentions: [],
      lastFetch: Date.now(),
      source: 'fallback',
      error: 'Tweet cache not available. Run: npm run fetch-tweets',
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Twitter feed error:', error);
    
    // Return memory cache if available, even on error
    if (memoryCache) {
      return NextResponse.json(memoryCache);
    }

    return NextResponse.json({
      official: [],
      mentions: [],
      lastFetch: Date.now(),
      source: 'fallback',
      error: 'Failed to load tweets',
    }, { status: 500 });
  }
}
