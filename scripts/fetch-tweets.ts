#!/usr/bin/env npx ts-node

/**
 * Fetch tweets from NODESonBase and gmhunterart using bird CLI
 * Run this script periodically (cron) to keep tweets updated
 * 
 * Usage: npx ts-node scripts/fetch-tweets.ts
 * Or:    npm run fetch-tweets
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface BirdTweet {
  id: string;
  text: string;
  createdAt: string;
  replyCount: number;
  retweetCount: number;
  likeCount: number;
  author: {
    username: string;
    name: string;
  };
  media?: Array<{
    type: string;
    url: string;
    previewUrl?: string;
    videoUrl?: string;
  }>;
}

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
  metrics: {
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

const ACCOUNTS = ['NODESonBase', 'gmhunterart'];
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'tweets.json');
const TWEETS_PER_ACCOUNT = 8;

function fetchTweetsForUser(username: string): Tweet[] {
  console.log(`Fetching tweets for @${username}...`);
  
  try {
    const result = execSync(
      `bird --cookie-source chrome user-tweets ${username} -n ${TWEETS_PER_ACCOUNT} --json`,
      { 
        encoding: 'utf-8',
        timeout: 60000,
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );
    
    // Parse JSON from output (skip any info lines)
    const jsonStart = result.indexOf('[');
    if (jsonStart === -1) {
      console.error(`No JSON found for @${username}`);
      return [];
    }
    
    const jsonStr = result.slice(jsonStart);
    const birdTweets: BirdTweet[] = JSON.parse(jsonStr);
    
    // Convert to our format
    const tweets: Tweet[] = birdTweets.map(bt => ({
      id: bt.id,
      text: bt.text,
      author: {
        username: bt.author.username,
        displayName: bt.author.name,
      },
      createdAt: new Date(bt.createdAt).toISOString(),
      url: `https://x.com/${bt.author.username}/status/${bt.id}`,
      metrics: {
        likes: bt.likeCount,
        retweets: bt.retweetCount,
        replies: bt.replyCount,
      },
      media: bt.media?.[0] ? {
        type: bt.media[0].type,
        url: bt.media[0].previewUrl || bt.media[0].url,
      } : undefined,
    }));
    
    console.log(`  ✓ Fetched ${tweets.length} tweets from @${username}`);
    return tweets;
    
  } catch (error) {
    console.error(`  ✗ Failed to fetch tweets for @${username}:`, error);
    return [];
  }
}

async function main() {
  console.log('=== Tweet Fetcher ===\n');
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Load existing cache if available
  let existingCache: TweetCache | null = null;
  if (fs.existsSync(OUTPUT_PATH)) {
    try {
      existingCache = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
    } catch {
      console.log('Could not load existing cache');
    }
  }
  
  // Fetch tweets for each account
  const cache: TweetCache = {
    tweets: {
      NODESonBase: [],
      gmhunterart: [],
    },
    lastFetch: new Date().toISOString(),
    fetchedAt: Date.now(),
  };
  
  for (const username of ACCOUNTS) {
    const tweets = fetchTweetsForUser(username);
    
    if (tweets.length > 0) {
      cache.tweets[username as keyof typeof cache.tweets] = tweets;
    } else if (existingCache?.tweets[username as keyof typeof cache.tweets]?.length) {
      // Keep existing tweets if fetch failed
      console.log(`  ↳ Keeping ${existingCache.tweets[username as keyof typeof cache.tweets].length} cached tweets for @${username}`);
      cache.tweets[username as keyof typeof cache.tweets] = existingCache.tweets[username as keyof typeof cache.tweets];
    }
  }
  
  // Check if we have any tweets
  const totalTweets = cache.tweets.NODESonBase.length + cache.tweets.gmhunterart.length;
  
  if (totalTweets === 0) {
    console.error('\n✗ No tweets fetched! Check bird authentication.');
    process.exit(1);
  }
  
  // Write cache
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(cache, null, 2));
  
  console.log(`\n✓ Saved ${totalTweets} tweets to ${OUTPUT_PATH}`);
  console.log(`  - @NODESonBase: ${cache.tweets.NODESonBase.length} tweets`);
  console.log(`  - @gmhunterart: ${cache.tweets.gmhunterart.length} tweets`);
}

main().catch(console.error);
