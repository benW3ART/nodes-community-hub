import { NextRequest, NextResponse } from 'next/server';

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

// Cache tweets for 10 minutes
let cache: TwitterFeedData | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Nitter instances for scraping (no auth required)
const NITTER_INSTANCES = [
  'nitter.privacydev.net',
  'nitter.poast.org',
  'nitter.woodland.cafe',
];

async function fetchFromNitter(username: string): Promise<Tweet[]> {
  for (const instance of NITTER_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`https://${instance}/${username}/rss`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NODESCommunityHub/1.0)',
        },
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) continue;
      
      const rss = await response.text();
      const tweets = parseRSS(rss, username);
      
      if (tweets.length > 0) {
        return tweets;
      }
    } catch (error) {
      console.log(`Nitter ${instance} failed:`, error);
      continue;
    }
  }
  
  return [];
}

function parseRSS(rss: string, username: string): Tweet[] {
  const tweets: Tweet[] = [];
  
  // Simple RSS parsing
  const items = rss.match(/<item>[\s\S]*?<\/item>/g) || [];
  
  for (const item of items.slice(0, 5)) {
    const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
    const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const descMatch = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/);
    
    if (titleMatch && linkMatch) {
      // Extract tweet ID from link
      const link = linkMatch[1].trim();
      const idMatch = link.match(/\/status\/(\d+)/);
      const id = idMatch ? idMatch[1] : String(Date.now());
      
      // Clean text (remove HTML)
      let text = descMatch ? descMatch[1] : titleMatch[1];
      text = text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      
      tweets.push({
        id,
        text: text.slice(0, 280),
        author: {
          username,
          displayName: username === 'NODESonBase' ? 'NODES' : username === 'gmhunterart' ? 'gmhunter' : username,
        },
        createdAt: pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString(),
        url: `https://x.com/${username}/status/${id}`,
      });
    }
  }
  
  return tweets;
}

async function searchMentions(): Promise<Tweet[]> {
  // For mentions, we'll try a simple search via Nitter
  for (const instance of NITTER_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(
        `https://${instance}/search/rss?f=tweets&q=%40NODESonBase+OR+%40gmhunterart`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; NODESCommunityHub/1.0)',
          },
        }
      );
      
      clearTimeout(timeout);
      
      if (!response.ok) continue;
      
      const rss = await response.text();
      
      // Parse search results
      const tweets: Tweet[] = [];
      const items = rss.match(/<item>[\s\S]*?<\/item>/g) || [];
      
      for (const item of items.slice(0, 8)) {
        const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
        const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
        const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const creatorMatch = item.match(/<dc:creator><!\[CDATA\[@?([\s\S]*?)\]\]><\/dc:creator>/);
        
        if (titleMatch && linkMatch) {
          const link = linkMatch[1].trim();
          const idMatch = link.match(/\/status\/(\d+)/);
          const id = idMatch ? idMatch[1] : String(Date.now());
          const username = creatorMatch ? creatorMatch[1].trim() : 'unknown';
          
          // Skip official accounts
          if (username === 'NODESonBase' || username === 'gmhunterart') continue;
          
          let text = titleMatch[1];
          text = text.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
          
          tweets.push({
            id,
            text: text.slice(0, 280),
            author: {
              username,
              displayName: username,
            },
            createdAt: pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString(),
            url: `https://x.com/${username}/status/${id}`,
          });
        }
      }
      
      if (tweets.length > 0) {
        return tweets;
      }
    } catch (error) {
      console.log(`Nitter search ${instance} failed:`, error);
      continue;
    }
  }
  
  return [];
}

// Empty data when nothing is available
const EMPTY_DATA: TwitterFeedData = {
  official: [],
  mentions: [],
  lastFetch: Date.now(),
};

export async function GET(request: NextRequest) {
  try {
    // Check cache
    if (cache && Date.now() - cache.lastFetch < CACHE_DURATION) {
      return NextResponse.json(cache);
    }
    
    // Fetch official tweets in parallel
    const [nodesTweets, hunterTweets] = await Promise.all([
      fetchFromNitter('NODESonBase'),
      fetchFromNitter('gmhunterart'),
    ]);
    
    // Combine and sort by date
    const official = [...nodesTweets, ...hunterTweets]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
    
    // Fetch mentions
    const mentions = await searchMentions();
    
    // If we got some data, cache it
    if (official.length > 0 || mentions.length > 0) {
      cache = {
        official: official.length > 0 ? official : EMPTY_DATA.official,
        mentions: mentions.length > 0 ? mentions : EMPTY_DATA.mentions,
        lastFetch: Date.now(),
      };
    } else {
      // Use fallback data
      cache = { ...EMPTY_DATA, lastFetch: Date.now() };
    }
    
    return NextResponse.json(cache);
    
  } catch (error) {
    console.error('Twitter feed error:', error);
    
    // Return cached data if available, even if stale
    if (cache) {
      return NextResponse.json(cache);
    }
    
    // Return fallback data
    return NextResponse.json(EMPTY_DATA);
  }
}
