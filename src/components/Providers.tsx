'use client';

import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider, darkTheme, connectorsForWallets } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

// NODES-themed dark theme with cyan accent
const nodesTheme = darkTheme({
  accentColor: '#00D4FF',
  accentColorForeground: 'black',
  borderRadius: 'medium',
  fontStack: 'system',
  overlayBlur: 'small',
});

// Override some colors for better NODES branding
nodesTheme.colors.connectButtonBackground = '#0a0a0a';
nodesTheme.colors.connectButtonInnerBackground = '#111111';
nodesTheme.colors.modalBackground = '#0a0a0a';
nodesTheme.colors.modalBorder = '#1a1a1a';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={nodesTheme} 
          modalSize="compact"
          appInfo={{
            appName: 'NODES Community Hub',
            learnMoreUrl: 'https://base.org',
          }}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
