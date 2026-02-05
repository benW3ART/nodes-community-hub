'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Image, 
  Grid3X3, 
  Layout, 
  Target, 
  Trophy,
  Settings
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/gallery', label: 'My NFTs', icon: Image },
  { href: '/post-creator', label: 'Posts', icon: Layout },
  { href: '/grid-creator', label: 'Grids', icon: Grid3X3 },
  { href: '/banner-creator', label: 'Banners', icon: Layout },
  { href: '/full-sets', label: 'Full Sets', icon: Target },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold">N</span>
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              NODES Hub
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

          {/* Connect Button */}
          <div className="flex items-center space-x-4">
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
          </div>
        </div>

        {/* Navigation - Mobile */}
        <nav className="lg:hidden flex items-center space-x-1 pb-3 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link flex items-center space-x-2 whitespace-nowrap ${
                  isActive ? 'nav-link-active' : ''
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
