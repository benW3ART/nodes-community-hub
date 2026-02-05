'use client';

export const dynamic = 'force-dynamic';

import { Header } from '@/components/Header';
import { NetworkHelper } from '@/components/NetworkHelper';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Image as ImageIcon, 
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
    icon: ImageIcon,
    title: 'Gallery',
    description: 'View all your NODES NFTs in one place',
  },
  {
    href: '/post-creator',
    icon: Layout,
    title: 'Post Creator',
    description: 'Create stunning posts for X with your NFTs',
  },
  {
    href: '/grid-creator',
    icon: Grid3X3,
    title: 'Grid Montage',
    description: 'Create grid montages and visual compositions',
  },
  {
    href: '/banner-creator',
    icon: Sparkles,
    title: 'Banner Creator',
    description: 'Design X banners featuring your NODES',
  },
  {
    href: '/full-sets',
    icon: Target,
    title: 'Full Set Tracker',
    description: 'Track your Inner State collections',
  },
  {
    href: '/leaderboard',
    icon: Trophy,
    title: 'Leaderboard',
    description: 'See top collectors and full set owners',
  },
];

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <NetworkHelper />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section with Banner */}
        <section className="text-center mb-10 sm:mb-16">
          {/* Banner Image */}
          <div className="relative w-full max-w-4xl mx-auto mb-6 sm:mb-8 rounded-2xl overflow-hidden border border-[#1a1a1a]">
            <Image
              src="/nodes-banner.png"
              alt="NODES - Digital Renaissance"
              width={1200}
              height={400}
              className="w-full h-auto object-cover"
              priority
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Logo overlay */}
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 flex items-center gap-3">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(0,212,255,0.5)]">
                <Image
                  src="/nodes-logo.png"
                  alt="NODES"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="text-left">
                <h1 className="text-xl sm:text-3xl font-bold text-white tracking-wider">NODES</h1>
                <p className="text-xs sm:text-sm text-[#00D4FF]">Digital Renaissance</p>
              </div>
            </div>
          </div>
          
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#00D4FF]/10 border border-[#00D4FF]/30 mb-4 sm:mb-6">
            <span className="text-[#00D4FF] text-xs sm:text-sm font-medium tracking-wide">
              Community Hub
            </span>
          </div>
          
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
            3,333 digital identities — retro-inspired characters born from internet culture.
            Features three iconic forms: <span className="text-white">Full Circle</span>, <span className="text-white">Skull</span>, and <span className="text-white">Ghost</span>, 
            each brought to life through colors, symbols, and dynamic motion.
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
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20
                                flex items-center justify-center mb-3 sm:mb-4
                                group-hover:bg-[#00D4FF]/20 group-hover:border-[#00D4FF]/40 
                                group-hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all duration-300">
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#00D4FF]" />
                </div>
                <h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2 group-hover:text-[#00D4FF] transition-colors uppercase tracking-wide">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm line-clamp-2">
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
              <div className="text-2xl sm:text-3xl font-bold text-[#00D4FF]">3,333</div>
              <div className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide">Total Supply</div>
            </div>
            <div className="p-2 sm:p-0">
              <div className="text-2xl sm:text-3xl font-bold text-[#4FFFDF]">8</div>
              <div className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide">Inner States</div>
            </div>
            <div className="p-2 sm:p-0">
              <div className="text-2xl sm:text-3xl font-bold text-white">Base</div>
              <div className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide">Blockchain</div>
            </div>
            <div className="p-2 sm:p-0">
              <div className="text-xl sm:text-3xl font-bold text-[#4FFFDF]">~0.015 ETH</div>
              <div className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide">Floor Price</div>
            </div>
          </div>
        </section>

        {/* Character Forms */}
        <section className="mt-10 sm:mt-16">
          <h2 className="section-title text-center text-lg sm:text-2xl">Character Forms</h2>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {['Full Circle', 'Skull', 'Ghost'].map((form) => (
              <span 
                key={form}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg text-sm sm:text-base text-white hover:border-[#00D4FF]/50 hover:text-[#00D4FF] transition-all cursor-default font-medium"
              >
                {form}
              </span>
            ))}
          </div>
        </section>

        {/* Inner States */}
        <section className="mt-10 sm:mt-16">
          <h2 className="section-title text-center text-lg sm:text-2xl">Inner States</h2>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {['Awakened', 'Ascended', 'Calm', 'Curious', 'Determined', 'Ethereal', 'Hopeful', 'Radiant'].map((state) => (
              <span 
                key={state}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-full text-xs sm:text-sm text-gray-400 hover:border-[#00D4FF]/50 hover:text-[#00D4FF] transition-all cursor-default"
              >
                {state}
              </span>
            ))}
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
      <footer className="border-t border-[#1a1a1a] mt-10 sm:mt-16 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Logo + Name */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden">
                <Image
                  src="/nodes-logo.png"
                  alt="NODES"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white tracking-wider">NODES</span>
            </div>
            
            {/* Description */}
            <p className="text-gray-500 text-sm max-w-md mb-4">
              3,333 digital identities — retro-inspired characters born from internet culture.
            </p>
            
            {/* Disclaimer */}
            <p className="text-xs text-gray-600">
              Community project. Not affiliated with NODES or gmhunterart.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
