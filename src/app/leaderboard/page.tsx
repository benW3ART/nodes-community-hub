'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useAccount } from 'wagmi';
import { 
  Trophy, 
  Medal, 
  Award, 
  Loader2, 
  Crown,
  Sparkles,
  ExternalLink,
  Users,
  Layers
} from 'lucide-react';

interface Collector {
  rank: number;
  address: string;
  displayAddress: string;
  count: number;
}

interface FullSetHolder {
  rank: number;
  address: string;
  displayAddress: string;
  sets: number;
}

interface LeaderboardData {
  topCollectors: Collector[];
  fullSetHolders: FullSetHolder[];
  stats: {
    totalSupply: number;
    uniqueHolders: number;
    fullSetCount: number;
  };
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />;
    case 2:
      return <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />;
    case 3:
      return <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />;
    default:
      return <span className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs sm:text-sm text-gray-500">{rank}</span>;
  }
}

function getRankBg(rank: number) {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
    case 2:
      return 'bg-gradient-to-r from-gray-400/20 to-gray-300/20 border-gray-400/30';
    case 3:
      return 'bg-gradient-to-r from-amber-700/20 to-amber-600/20 border-amber-600/30';
    default:
      return 'bg-gray-800/50 border-gray-700/50';
  }
}

export default function LeaderboardPage() {
  const { address } = useAccount();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'collectors' | 'fullsets'>('collectors');

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) throw new Error('Failed to fetch');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError('Failed to load leaderboard data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLeaderboard();
  }, []);

  const isUserInList = (list: { address: string }[]) => {
    return address && list.some(item => 
      item.address.toLowerCase() === address.toLowerCase()
    );
  };

  const getUserRank = (list: { address: string; rank: number }[]) => {
    if (!address) return null;
    const found = list.find(item => 
      item.address.toLowerCase() === address.toLowerCase()
    );
    return found?.rank || null;
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <h1 className="section-title text-xl sm:text-2xl md:text-3xl">Leaderboard</h1>
        <p className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8">
          Top NODES collectors and Full Set holders in the community
        </p>

        {isLoading ? (
          <div className="card text-center py-12 sm:py-16">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-purple-500 animate-spin" />
            <p className="text-gray-400 text-sm sm:text-base">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="card text-center py-12 sm:py-16">
            <p className="text-red-400 mb-4 text-sm sm:text-base">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        ) : data ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="card bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/30 p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-purple-500/20 rounded-lg sm:rounded-xl w-fit">
                    <Layers className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">Supply</p>
                    <p className="text-lg sm:text-2xl font-bold">{data.stats.totalSupply.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="card bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/30 p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-blue-500/20 rounded-lg sm:rounded-xl w-fit">
                    <Users className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">Holders</p>
                    <p className="text-lg sm:text-2xl font-bold">{data.stats.uniqueHolders.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="card bg-gradient-to-br from-pink-500/10 to-transparent border-pink-500/30 p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-pink-500/20 rounded-lg sm:rounded-xl w-fit">
                    <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-pink-400" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-400">Full Sets</p>
                    <p className="text-lg sm:text-2xl font-bold">{data.stats.fullSetCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4 sm:mb-6">
              <button
                onClick={() => setActiveTab('collectors')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95 ${
                  activeTab === 'collectors'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden xs:inline">Top</span> Collectors
              </button>
              <button
                onClick={() => setActiveTab('fullsets')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95 ${
                  activeTab === 'fullsets'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <Award className="w-4 h-4" />
                Full Sets
              </button>
            </div>

            {/* Your Position Banner */}
            {address && (
              <div className="mb-4 sm:mb-6">
                {activeTab === 'collectors' && isUserInList(data.topCollectors) && (
                  <div className="card bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                      <span>You&apos;re ranked</span>
                      <span className="font-bold text-purple-400">
                        #{getUserRank(data.topCollectors)}
                      </span>
                      <span className="hidden sm:inline">in Top Collectors!</span>
                    </div>
                  </div>
                )}
                {activeTab === 'fullsets' && isUserInList(data.fullSetHolders) && (
                  <div className="card bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/30 p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 flex-shrink-0" />
                      <span>You&apos;re ranked</span>
                      <span className="font-bold text-pink-400">
                        #{getUserRank(data.fullSetHolders)}
                      </span>
                      <span className="hidden sm:inline">among Full Set Holders!</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Leaderboard List */}
            <div className="card overflow-hidden p-0 sm:p-6">
              {activeTab === 'collectors' ? (
                <div className="space-y-1 sm:space-y-2">
                  {/* Header - Desktop only */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-sm text-gray-400 border-b border-gray-800">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-8">Address</div>
                    <div className="col-span-3 text-right">NODES</div>
                  </div>
                  
                  {data.topCollectors.map((collector) => {
                    const isUser = address && 
                      collector.address.toLowerCase() === address.toLowerCase();
                    
                    return (
                      <div
                        key={collector.address}
                        className={`flex items-center gap-3 sm:grid sm:grid-cols-12 sm:gap-4 px-4 py-3 rounded-none sm:rounded-lg border-b sm:border border-gray-800/50 sm:border-transparent transition-all ${
                          isUser 
                            ? 'bg-purple-500/20 sm:border-purple-500/50' 
                            : getRankBg(collector.rank)
                        }`}
                      >
                        <div className="sm:col-span-1 flex items-center w-8">
                          {getRankIcon(collector.rank)}
                        </div>
                        <div className="sm:col-span-8 flex items-center gap-2 flex-1 min-w-0">
                          <a
                            href={`https://basescan.org/address/${collector.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs sm:text-sm hover:text-purple-400 transition-colors flex items-center gap-1 truncate"
                          >
                            {collector.displayAddress}
                            <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
                          </a>
                          {isUser && (
                            <span className="badge-purple text-xs flex-shrink-0">You</span>
                          )}
                        </div>
                        <div className="sm:col-span-3 text-right font-bold text-sm sm:text-base">
                          {collector.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-1 sm:space-y-2">
                  {/* Header - Desktop only */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-sm text-gray-400 border-b border-gray-800">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-8">Address</div>
                    <div className="col-span-3 text-right">Sets</div>
                  </div>
                  
                  {data.fullSetHolders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                      No Full Set holders found yet
                    </div>
                  ) : (
                    data.fullSetHolders.map((holder) => {
                      const isUser = address && 
                        holder.address.toLowerCase() === address.toLowerCase();
                      
                      return (
                        <div
                          key={holder.address}
                          className={`flex items-center gap-3 sm:grid sm:grid-cols-12 sm:gap-4 px-4 py-3 rounded-none sm:rounded-lg border-b sm:border border-gray-800/50 sm:border-transparent transition-all ${
                            isUser 
                              ? 'bg-pink-500/20 sm:border-pink-500/50' 
                              : getRankBg(holder.rank)
                          }`}
                        >
                          <div className="sm:col-span-1 flex items-center w-8">
                            {getRankIcon(holder.rank)}
                          </div>
                          <div className="sm:col-span-8 flex items-center gap-2 flex-1 min-w-0">
                            <a
                              href={`https://basescan.org/address/${holder.address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs sm:text-sm hover:text-pink-400 transition-colors flex items-center gap-1 truncate"
                            >
                              {holder.displayAddress}
                              <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
                            </a>
                            {isUser && (
                              <span className="badge-purple text-xs flex-shrink-0">You</span>
                            )}
                          </div>
                          <div className="sm:col-span-3 text-right">
                            <span className="inline-flex items-center gap-1 font-bold text-pink-400 text-sm sm:text-base">
                              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                              {holder.sets}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Footer Note */}
            <p className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
              Data refreshes every 5 minutes
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}
