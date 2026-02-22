'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { AddBaseButton } from './NetworkHelper';
import { ViewOnlyInput } from './ViewOnlyInput';
import { useWalletAddress } from '@/hooks/useWalletAddress';
import {
  Home,
  Image as ImageIcon,
  Grid3X3,
  Layout,
  Target,
  Trophy,
  GitCompareArrows,
  Menu,
  X,
  Eye
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/gallery', label: 'Gallery', icon: ImageIcon },
  { href: '/grid-creator', label: 'Grids', icon: Grid3X3 },
  { href: '/before-after', label: 'Before/After', icon: GitCompareArrows },
  { href: '/full-sets', label: 'Full Sets', icon: Target },
  { href: '/post-creator', label: 'Posts', icon: Layout },
  { href: '/banner-creator', label: 'Banners', icon: Layout },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isWalletConnected, isViewOnly, viewOnlyAddress, clearViewOnlyAddress } = useWalletAddress();

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative rounded-lg overflow-hidden group-hover:shadow-[0_0_20px_rgba(0,212,255,0.5)] transition-shadow">
              <Image
                src="/logos/nodes.png"
                alt="NODES"
                fill
                className="object-cover"
                priority
              />
            </div>
            <span className="text-lg sm:text-xl font-bold text-white hidden xs:block tracking-wider">
              NODES
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link flex items-center space-x-2 ${
                    isActive ? 'nav-link-active' : ''
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side: Connect/View-Only + Mobile menu button */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Show view-only badge if in view-only mode */}
            {isViewOnly && viewOnlyAddress ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0a] border border-[#00D4FF]/30 rounded-lg">
                  <Eye className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-sm text-gray-300 font-mono">
                    {viewOnlyAddress.slice(0, 6)}...{viewOnlyAddress.slice(-4)}
                  </span>
                  <span className="text-xs text-[#00D4FF] uppercase tracking-wide">View</span>
                </div>
                {/* Mobile: Just show icon */}
                <div className="sm:hidden flex items-center gap-1 px-2 py-1.5 bg-[#0a0a0a] border border-[#00D4FF]/30 rounded-lg">
                  <Eye className="w-4 h-4 text-[#00D4FF]" />
                  <span className="text-xs text-gray-300 font-mono">
                    {viewOnlyAddress.slice(0, 4)}...
                  </span>
                </div>
                <button
                  onClick={clearViewOnlyAddress}
                  className="p-1.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg hover:border-red-500/50 hover:text-red-400 transition-colors"
                  title="Exit view-only mode"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <ConnectButton 
                  chainStatus="icon"
                  accountStatus={{
                    smallScreen: 'avatar',
                    largeScreen: 'full',
                  }}
                  showBalance={{
                    smallScreen: false,
                    largeScreen: true,
                  }}
                />
                {/* View-only option when not connected */}
                {!isWalletConnected && (
                  <ViewOnlyInput compact className="hidden md:block" />
                )}
              </>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#00D4FF]/50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#1a1a1a] bg-black/95 backdrop-blur-xl">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all active:scale-98 ${
                    isActive 
                      ? 'bg-[#00D4FF]/10 text-[#00D4FF] border border-[#00D4FF]/30' 
                      : 'hover:bg-white/5 text-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            {/* Add Base Network helper */}
            <div className="pt-4 border-t border-[#1a1a1a] mt-4">
              <AddBaseButton className="px-4 py-2" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
