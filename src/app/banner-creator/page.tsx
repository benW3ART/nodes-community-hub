'use client';

export const dynamic = 'force-dynamic';

import { Header } from '@/components/Header';
import { Construction } from 'lucide-react';

export default function BannerCreatorPage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="section-title">Banner Creator</h1>
        
        <div className="card text-center py-16">
          <Construction className="w-16 h-16 mx-auto mb-6 text-yellow-500" />
          <h2 className="text-2xl font-semibold mb-4">Coming Soon!</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Create beautiful X/Twitter banners (1500×500) featuring your NODES NFTs.
            Templates with customizable layouts and backgrounds.
          </p>
        </div>
      </main>
    </div>
  );
}
