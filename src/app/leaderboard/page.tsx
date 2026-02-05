'use client';

export const dynamic = 'force-dynamic';

import { Header } from '@/components/Header';
import { Trophy, Medal, Award, Construction } from 'lucide-react';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="section-title">Leaderboard</h1>
        
        <div className="card text-center py-16">
          <Trophy className="w-16 h-16 mx-auto mb-6 text-yellow-500" />
          <h2 className="text-2xl font-semibold mb-4">Coming Soon!</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">
            Track top NODES collectors, Full Set owners, and community achievements.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="card bg-yellow-500/10 border-yellow-500/30">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <h3 className="font-semibold">Top Collectors</h3>
              <p className="text-sm text-gray-400">Most NODES owned</p>
            </div>
            <div className="card bg-purple-500/10 border-purple-500/30">
              <Medal className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-semibold">Full Set Holders</h3>
              <p className="text-sm text-gray-400">Complete collections</p>
            </div>
            <div className="card bg-pink-500/10 border-pink-500/30">
              <Award className="w-8 h-8 mx-auto mb-2 text-pink-500" />
              <h3 className="font-semibold">Rarity Score</h3>
              <p className="text-sm text-gray-400">Rarest portfolios</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
