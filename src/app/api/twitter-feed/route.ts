import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
  }[];
}

// Cache tweets for 5 minutes
let cache: {
  official: Tweet[];
  mentions: Tweet[];
  lastFetch: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function fetchTweetsWithBird(query: string): Promise<Tweet[]> {
  try {
    const { stdout } = await execAsync(
      `bird search "${query}" --limit 10 --json`,
      { timeout: 30000 }
    );
    
    const data = JSON.parse(stdout);
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.map((tweet: any) => ({
      id: tweet.id || tweet.rest_id || String(Date.now()),
      text: tweet.text || tweet.full_text || '',
      author: {
        username: tweet.user?.screen_name || tweet.author?.username || 'unknown',
        displayName: tweet.user?.name || tweet.author?.name || 'Unknown',
        avatar: tweet.user?.profile_image_url_https || tweet.author?.profile_image_url,
      },
      createdAt: tweet.created_at || new Date().toISOString(),
      url: `https://x.com/${tweet.user?.screen_name || 'i'}/status/${tweet.id || tweet.rest_id}`,
      metrics: {
        likes: tweet.favorite_count || tweet.public_metrics?.like_count || 0,
        retweets: tweet.retweet_count || tweet.public_metrics?.retweet_count || 0,
        replies: tweet.reply_count || tweet.public_metrics?.reply_count || 0,
      },
    }));
  } catch (error) {
    console.error('Bird fetch error:', error);
    return [];
  }
}

async function fetchUserTweets(username: string): Promise<Tweet[]> {
  try {
    const { stdout } = await execAsync(
      `bird timeline ${username} --limit 5 --json`,
      { timeout: 30000 }
    );
    
    const data = JSON.parse(stdout);
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.map((tweet: any) => ({
      id: tweet.id || tweet.rest_id || String(Date.now()),
      text: tweet.text || tweet.full_text || '',
      author: {
        username: tweet.user?.screen_name || username,
        displayName: tweet.user?.name || username,
        avatar: tweet.user?.profile_image_url_https,
      },
      createdAt: tweet.created_at || new Date().toISOString(),
      url: `https://x.com/${username}/status/${tweet.id || tweet.rest_id}`,
      metrics: {
        likes: tweet.favorite_count || 0,
        retweets: tweet.retweet_count || 0,
        replies: tweet.reply_count || 0,
      },
    }));
  } catch (error) {
    console.error('Bird timeline error:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check cache
    if (cache && Date.now() - cache.lastFetch < CACHE_DURATION) {
      return NextResponse.json(cache);
    }
    
    // Fetch official tweets (from @NODESonBase and @gmhunterart)
    const [nodesTweets, hunterTweets] = await Promise.all([
      fetchUserTweets('NODESonBase'),
      fetchUserTweets('gmhunterart'),
    ]);
    
    // Combine and sort by date
    const official = [...nodesTweets, ...hunterTweets]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
    
    // Fetch mentions
    const mentions = await fetchTweetsWithBird('@NODESonBase OR @gmhunterart -from:NODESonBase -from:gmhunterart');
    
    // Update cache
    cache = {
      official,
      mentions: mentions.slice(0, 8),
      lastFetch: Date.now(),
    };
    
    return NextResponse.json(cache);
    
  } catch (error) {
    console.error('Twitter feed error:', error);
    
    // Return cached data if available, even if stale
    if (cache) {
      return NextResponse.json(cache);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch tweets', official: [], mentions: [] },
      { status: 500 }
    );
  }
}
