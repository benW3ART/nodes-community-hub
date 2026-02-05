import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/ClientProviders';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NODES Community Hub',
  description: '3,333 digital identities - retro-inspired characters born from internet culture. Create content, track full sets, and experience the Digital Renaissance.',
  metadataBase: new URL('https://nodes-hub.vercel.app'),
  icons: {
    icon: '/nodes-logo.png',
    apple: '/nodes-logo.png',
  },
  openGraph: {
    title: 'NODES Community Hub',
    description: '3,333 digital identities - retro-inspired characters born from internet culture. Create content, track full sets, and experience the Digital Renaissance.',
    images: ['/nodes-banner.png'],
    siteName: 'NODES Community Hub',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NODES Community Hub',
    description: '3,333 digital identities - retro-inspired characters born from internet culture.',
    images: ['/nodes-banner.png'],
    creator: '@NODESonBase',
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
