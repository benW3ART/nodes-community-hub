import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.alchemy.com https://ipfs.io https://*.ipfs.nftstorage.link https://arweave.net https://storage.googleapis.com https://res.cloudinary.com https://pbs.twimg.com https://video.twimg.com",
      "font-src 'self'",
      "connect-src 'self' https://*.alchemy.com https://api.opensea.io wss://*.walletconnect.com wss://*.walletconnect.org https://*.walletconnect.com https://*.walletconnect.org https://rpc.walletconnect.com https://pulse.walletconnect.com https://verify.walletconnect.com",
      "frame-src 'self' https://*.walletconnect.com https://*.walletconnect.org https://verify.walletconnect.com",
    ].join('; ')
  }
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.alchemy.com',
      },
      {
        protocol: 'https',
        hostname: 'nft-cdn.alchemy.com',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.nftstorage.link',
      },
      {
        protocol: 'https',
        hostname: 'arweave.net',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
      {
        protocol: 'https',
        hostname: 'video.twimg.com',
      },
    ],
  },
  // Ensure client components work properly
  experimental: {
    // Disable static generation for client-side only pages
  },
};

export default nextConfig;
// Railway rebuild 1770324312
