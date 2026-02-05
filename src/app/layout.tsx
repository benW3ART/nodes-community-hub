import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/ClientProviders';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NODES Community Hub',
  description: '3,333 digital identities on Base - retro-inspired characters born from internet culture. Gallery, Grid Creator, Banner Creator, Leaderboard & Full Sets tracker.',
  metadataBase: new URL('https://nodes-community-hub-production.up.railway.app'),
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'NODES Community Hub',
    description: '3,333 digital identities on Base - Gallery, Grid Creator, Banner Creator, Leaderboard & Full Sets tracker for NODES holders.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NODES Community Hub',
      }
    ],
    siteName: 'NODES Community Hub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NODES Community Hub',
    description: '3,333 digital identities on Base - Gallery, Grid Creator, Banner Creator, Leaderboard & Full Sets.',
    images: ['/og-image.png'],
    creator: '@gmhunterart',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-black`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
