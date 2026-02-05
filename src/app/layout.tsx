import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClientProviders } from '@/components/ClientProviders';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'NODES Community Hub',
  description: 'Create content, track full sets, and engage with the NODES community on Base',
  metadataBase: new URL('https://nodes-hub.vercel.app'),
  openGraph: {
    title: 'NODES Community Hub',
    description: 'Create content, track full sets, and engage with the NODES community on Base',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
