'use client';

export const dynamic = 'force-dynamic';

import { Header } from '@/components/Header';
import { NetworkHelper } from '@/components/NetworkHelper';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ViewOnlyLink, ViewOnlyInput } from '@/components/ViewOnlyInput';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Grid3X3,
  Layout,
  Target,
  Trophy,
  Sparkles,
  GitCompareArrows,
  ArrowRight,
  Wallet,
  ClipboardPaste
} from 'lucide-react';
import { TwitterFeed } from '@/components/TwitterFeed';

const features = [
  {
    href: '/gallery',
    icon: ImageIcon,
    title: 'Gallery',
    description: 'View all your NODES NFTs in one place',
  },
  {
    href: '/grid-creator',
    icon: Grid3X3,
    title: 'Grid Montage',
    description: 'Create grid montages and visual compositions',
  },
  {
    href: '/before-after',
    icon: GitCompareArrows,
    title: 'Before / After',
    description: 'See how your NFTs evolved over time',
  },
  {
    href: '/full-sets',
    icon: Target,
    title: 'Full Set Tracker',
    description: 'Track your Inner State collections',
  },
  {
    href: '/post-creator',
    icon: Layout,
    title: 'Post Creator',
    description: 'Create stunning posts for X with your NFTs',
  },
  {
    href: '/banner-creator',
    icon: Sparkles,
    title: 'Banner Creator',
    description: 'Design X banners featuring your NODES',
  },
  {
    href: '/leaderboard',
    icon: Trophy,
    title: 'Leaderboard',
    description: 'See top collectors and full set owners',
  },
];

const CHARACTER_FORMS = [
  { name: 'Full Circle', tokenId: '2', traitKey: 'Full Circle' },
  { name: 'Skull', tokenId: '4', traitKey: 'Skull' },
  { name: 'Ghost', tokenId: '3', traitKey: 'Ghost' },
];

export default function Home() {
  const { isConnected } = useWalletAddress();
  const [characterImages, setCharacterImages] = useState<Record<string, string>>({});
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [floorPrice, setFloorPrice] = useState<string | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      const results: Record<string, string> = {};
      await Promise.all(
        CHARACTER_FORMS.map(async (form) => {
          try {
            const res = await fetch(`/api/metadata/${form.tokenId}`);
            if (res.ok) {
              const data = await res.json();
              const imgUrl = data.image || data.cleanimage || '';
              if (imgUrl) {
                results[form.tokenId] = `/api/proxy-gif?url=${encodeURIComponent(imgUrl)}`;
              }
            }
          } catch { /* ignore */ }
        })
      );
      setCharacterImages(results);
    };
    fetchImages();

    fetch('/data/rarity.json')
      .then(res => res.json())
      .then(data => {
        if (data?.traitCounts?.Type) setTypeCounts(data.traitCounts.Type);
      })
      .catch(() => { /* ignore */ });

    fetch('/api/opensea/floor-price')
      .then(res => res.json())
      .then(data => {
        if (data?.floorPrice != null) {
          setFloorPrice(`~${Number(data.floorPrice).toFixed(3)} ETH`);
        }
      })
      .catch(() => { /* ignore */ });
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <NetworkHelper />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section with Banner */}
        <section className="text-center mb-10 sm:mb-16">
          {/* Main Logo */}
          <div className="w-full max-w-md mx-auto mb-6 sm:mb-8">
            <Image
              src="/logos/banner-cropped.png"
              alt="NODES"
              width={675}
              height={375}
              className="w-full h-auto"
              priority
            />
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
            <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full px-4">
                {/* Option 1: Connect Wallet */}
                <div className="flex flex-col items-center gap-2">
                  <ConnectButton />
                </div>
                {/* Option 2: Paste Address */}
                <ViewOnlyLink variant="button" />
              </div>
              <p className="text-xs text-gray-500">
                Both options give you full access to all features.
              </p>
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
              <div className="text-2xl sm:text-3xl font-bold text-[#4FFFDF]">7</div>
              <div className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide">Inner States</div>
            </div>
            <div className="p-2 sm:p-0">
              <div className="text-2xl sm:text-3xl font-bold text-white">Base</div>
              <div className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide">Blockchain</div>
            </div>
            <div className="p-2 sm:p-0">
              <div className="text-xl sm:text-3xl font-bold text-[#4FFFDF]">{floorPrice ?? '—'}</div>
              <div className="text-gray-500 text-xs sm:text-sm uppercase tracking-wide">Floor Price</div>
            </div>
          </div>
        </section>

        {/* Character Forms */}
        <section className="mt-10 sm:mt-16">
          <h2 className="section-title text-center text-lg sm:text-2xl">Character Forms</h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto mb-6">
            {CHARACTER_FORMS.map((form) => {
              const imgSrc = characterImages[form.tokenId];
              return (
                <div
                  key={form.name}
                  className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl hover:border-[#00D4FF]/30 transition-all"
                >
                  <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-[#1a1a1a] bg-[#111]">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={form.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-[#00D4FF]/30 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs sm:text-sm font-medium text-white">{form.name}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500">{(typeCounts[form.traitKey] || 0).toLocaleString()} NFTs</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Inner States */}
        <section className="mt-10 sm:mt-16">
          <h2 className="section-title text-center text-lg sm:text-2xl">Inner States</h2>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {([
              { name: 'Verified', icon: '/icons/verified.png' },
              { name: 'HyperConnected', icon: '/icons/hyperconnected.png' },
              { name: 'Equilibrium', icon: '/icons/equilibrium.png' },
              { name: 'Enlightened', icon: '/icons/enlightened.png' },
              { name: 'Ascended', icon: '/icons/ascended.png' },
              { name: 'Diamond Hand', icon: '/icons/diamond-hand.png' },
              { name: 'Uncoded', icon: null },
            ] as const).map((state) => (
              <span
                key={state.name}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-full text-xs sm:text-sm text-gray-400 hover:border-[#00D4FF]/50 hover:text-[#00D4FF] transition-all cursor-default"
              >
                {state.icon && (
                  <Image
                    src={state.icon}
                    alt={state.name}
                    width={20}
                    height={20}
                    unoptimized
                    className="w-4 h-4 sm:w-5 sm:h-5 opacity-80"
                  />
                )}
                {state.name}
              </span>
            ))}
          </div>
        </section>

        {/* Twitter Feed */}
        <TwitterFeed />

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
              href="https://x.com/NODESonBase" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-secondary text-sm sm:text-base py-2.5 px-4"
            >
              @NODESonBase
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
                  src="/logos/nodes.png"
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
