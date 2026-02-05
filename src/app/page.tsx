'use client';

export const dynamic = 'force-dynamic';

import { Header } from '@/components/Header';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { 
  Image, 
  Grid3X3, 
  Layout, 
  Target, 
  Trophy,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    href: '/gallery',
    icon: Image,
    title: 'My Gallery',
    description: 'View all your NODES NFTs in one place',
    color: 'from-purple-500 to-violet-500',
  },
  {
    href: '/post-creator',
    icon: Layout,
    title: 'Post Creator',
    description: 'Create beautiful posts for X with your NFTs',
    color: 'from-pink-500 to-rose-500',
  },
  {
    href: '/grid-creator',
    icon: Grid3X3,
    title: 'Grid Montage',
    description: 'Create stunning grid montages and videos',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    href: '/banner-creator',
    icon: Sparkles,
    title: 'Banner Creator',
    description: 'Design X banners featuring your NODES',
    color: 'from-orange-500 to-amber-500',
  },
  {
    href: '/full-sets',
    icon: Target,
    title: 'Full Set Tracker',
    description: 'Track your Inner State collections',
    color: 'from-green-500 to-emerald-500',
  },
  {
    href: '/leaderboard',
    icon: Trophy,
    title: 'Leaderboard',
    description: 'See top collectors and full set owners',
    color: 'from-yellow-500 to-orange-500',
  },
];

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <section className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-4 sm:mb-6">
            <span className="text-purple-400 text-xs sm:text-sm font-medium">
              🟣 NODES on Base Community Hub
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">
            <span className="gradient-text">Create. Collect.</span>
            <br />
            <span className="text-white">Connect.</span>
          </h1>
          
          <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            The ultimate toolkit for NODES holders. Create stunning content,
            track your Full Sets, and engage with the community.
          </p>

          {!isConnected ? (
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
              <Link href="/gallery" className="btn-primary inline-flex items-center justify-center py-3 sm:py-2">
                View My NODES
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link href="/full-sets" className="btn-secondary inline-flex items-center justify-center py-3 sm:py-2">
                Check Full Sets
                <Target className="w-5 h-5 ml-2" />
              </Link>
            </div>
          )}
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="card-hover group p-4 sm:p-6"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br ${feature.color} 
                                flex items-center justify-center mb-3 sm:mb-4
                                group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2 group-hover:text-purple-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-xs sm:text-base line-clamp-2">
                  {feature.description}
                </p>
              </Link>
            );
          })}
        </section>

        {/* Collection Stats */}
        <section className="mt-10 sm:mt-16 card">
          <h2 className="section-title text-center text-lg sm:text-2xl">Collection Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div className="p-2 sm:p-0">
              <div className="text-2xl sm:text-3xl font-bold text-purple-400">3,333</div>
              <div className="text-gray-400 text-xs sm:text-base">Total Supply</div>
            </div>
            <div className="p-2 sm:p-0">
              <div className="text-2xl sm:text-3xl font-bold text-pink-400">7</div>
              <div className="text-gray-400 text-xs sm:text-base">Inner States</div>
            </div>
            <div className="p-2 sm:p-0">
              <div className="text-2xl sm:text-3xl font-bold text-blue-400">Base</div>
              <div className="text-gray-400 text-xs sm:text-base">Blockchain</div>
            </div>
            <div className="p-2 sm:p-0">
              <div className="text-xl sm:text-3xl font-bold text-green-400">~0.01 ETH</div>
              <div className="text-gray-400 text-xs sm:text-base">Floor Price</div>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="mt-10 sm:mt-16 text-center">
          <h2 className="section-title text-lg sm:text-2xl">Official Links</h2>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            <a 
              href="https://opensea.io/collection/nodes-by-hunter" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary text-sm sm:text-base py-2.5 px-4"
            >
              OpenSea
            </a>
            <a 
              href="https://x.com/nodesonbase" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary text-sm sm:text-base py-2.5 px-4"
            >
              @nodesonbase
            </a>
            <a 
              href="https://x.com/gmhunterart" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary text-sm sm:text-base py-2.5 px-4"
            >
              @gmhunterart
            </a>
            <a 
              href="https://basescan.org/address/0x95bc4c2e01c2e2d9e537e7a9fe58187e88dd8019" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary text-sm sm:text-base py-2.5 px-4"
            >
              Contract
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-10 sm:mt-16 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p className="text-sm sm:text-base">
            Built with 💜 for the NODES community
          </p>
          <p className="text-xs sm:text-sm mt-2">
            Not affiliated with NODES or gmhunterart. Community project.
          </p>
        </div>
      </footer>
    </div>
  );
}
