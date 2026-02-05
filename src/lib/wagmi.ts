import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base } from 'wagmi/chains';
import { http } from 'wagmi';

// Re-export constants for backward compatibility
export { NODES_CONTRACT, ALCHEMY_API_KEY, ALCHEMY_RPC_URL, INNER_STATES } from './constants';
export type { InnerState } from './constants';

const alchemyRpcUrl = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo';

export const config = getDefaultConfig({
  appName: 'NODES Community Hub',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [base],
  transports: {
    [base.id]: http(alchemyRpcUrl),
  },
  ssr: true,
});
