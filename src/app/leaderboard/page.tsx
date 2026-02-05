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
  Layers,
  Zap
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
      return <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF]" />;
    case 2:
      return <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />;
    case 3:
      return <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />;
    default:
      return <span className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs sm:text-sm text-gray-600">{rank}</span>;
  }
}

function getRankBg(rank: number) {
  switch (rank) {
    case 1:
      return 'bg-[#00D4FF]/10 border-[#00D4FF]/30';
    case 2:
      return 'bg-white/5 border-white/20';
    case 3:
      return 'bg-amber-500/10 border-amber-500/30';
    default:
      return 'bg-[#0a0a0a] border-[#1a1a1a]';
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
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        <h1 className="section-title text-xl sm:text-2xl md:text-3xl">Leaderboard</h1>
        <p className="text-gray-500 text-sm sm:text-base mb-6 sm:mb-8">
          Top NODES collectors and Full Set holders in the community
        </p>

        {isLoading ? (
          <div className="card text-center py-12 sm:py-16">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-[#00D4FF] animate-spin" />
            <p className="text-gray-500 text-sm sm:text-base">Loading leaderboard...</p>
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
              <div className="card bg-[#00D4FF]/5 border-[#00D4FF]/30 p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-[#00D4FF]/20 rounded-lg sm:rounded-xl w-fit">
                    <Layers className="w-4 h-4 sm:w-6 sm:h-6 text-[#00D4FF]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Supply</p>
                    <p className="text-lg sm:text-2xl font-bold">{data.stats.totalSupply.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="card bg-[#4FFFDF]/5 border-[#4FFFDF]/30 p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-[#4FFFDF]/20 rounded-lg sm:rounded-xl w-fit">
                    <Users className="w-4 h-4 sm:w-6 sm:h-6 text-[#4FFFDF]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Holders</p>
                    <p className="text-lg sm:text-2xl font-bold">{data.stats.uniqueHolders.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="card bg-white/5 border-white/20 p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-white/10 rounded-lg sm:rounded-xl w-fit">
                    <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide">Full Sets</p>
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
                    ? 'bg-[#00D4FF] text-black'
                    : 'bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 hover:border-[#00D4FF]/50'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span className="hidden xs:inline">Top</span> Collectors
              </button>
              <button
                onClick={() => setActiveTab('fullsets')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95 ${
                  activeTab === 'fullsets'
                    ? 'bg-[#00D4FF] text-black'
                    : 'bg-[#0a0a0a] border border-[#1a1a1a] text-gray-400 hover:border-[#00D4FF]/50'
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
                  <div className="card bg-[#00D4FF]/10 border-[#00D4FF]/30 p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#00D4FF] flex-shrink-0" />
                      <span>You&apos;re ranked</span>
                      <span className="font-bold text-[#00D4FF]">
                        #{getUserRank(data.topCollectors)}
                      </span>
                      <span className="hidden sm:inline">in Top Collectors!</span>
                    </div>
                  </div>
                )}
                {activeTab === 'fullsets' && isUserInList(data.fullSetHolders) && (
                  <div className="card bg-[#4FFFDF]/10 border-[#4FFFDF]/30 p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#4FFFDF] flex-shrink-0" />
                      <span>You&apos;re ranked</span>
                      <span className="font-bold text-[#4FFFDF]">
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
                  <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-sm text-gray-500 border-b border-[#1a1a1a] uppercase tracking-wide">
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
                        className={`flex items-center gap-3 sm:grid sm:grid-cols-12 sm:gap-4 px-4 py-3 rounded-none sm:rounded-lg border-b sm:border border-[#1a1a1a]/50 sm:border-transparent transition-all ${
                          isUser 
                            ? 'bg-[#00D4FF]/10 sm:border-[#00D4FF]/30' 
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
                            className="font-mono text-xs sm:text-sm hover:text-[#00D4FF] transition-colors flex items-center gap-1 truncate"
                          >
                            {collector.displayAddress}
                            <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
                          </a>
                          {isUser && (
                            <span className="badge-cyan text-xs flex-shrink-0">You</span>
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
                  <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 text-sm text-gray-500 border-b border-[#1a1a1a] uppercase tracking-wide">
                    <div className="col-span-1">Rank</div>
                    <div className="col-span-8">Address</div>
                    <div className="col-span-3 text-right">Sets</div>
                  </div>
                  
                  {data.fullSetHolders.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 text-sm sm:text-base">
                      No Full Set holders found yet
                    </div>
                  ) : (
                    data.fullSetHolders.map((holder) => {
                      const isUser = address && 
                        holder.address.toLowerCase() === address.toLowerCase();
                      
                      return (
                        <div
                          key={holder.address}
                          className={`flex items-center gap-3 sm:grid sm:grid-cols-12 sm:gap-4 px-4 py-3 rounded-none sm:rounded-lg border-b sm:border border-[#1a1a1a]/50 sm:border-transparent transition-all ${
                            isUser 
                              ? 'bg-[#4FFFDF]/10 sm:border-[#4FFFDF]/30' 
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
                              className="font-mono text-xs sm:text-sm hover:text-[#4FFFDF] transition-colors flex items-center gap-1 truncate"
                            >
                              {holder.displayAddress}
                              <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
                            </a>
                            {isUser && (
                              <span className="badge-cyan text-xs flex-shrink-0">You</span>
                            )}
                          </div>
                          <div className="sm:col-span-3 text-right">
                            <span className="inline-flex items-center gap-1 font-bold text-[#4FFFDF] text-sm sm:text-base">
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
            <p className="text-center text-xs sm:text-sm text-gray-600 mt-4 sm:mt-6">
              Data refreshes every 5 minutes
            </p>
          </>
        ) : null}
      </main>
    </div>
  );
}
