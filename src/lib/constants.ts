// Shared constants for both server and client

export const NODES_CONTRACT = process.env.NEXT_PUBLIC_NODES_CONTRACT || '0x95bc4c2e01c2e2d9e537e7a9fe58187e88dd8019';
export const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || '';
export const ALCHEMY_RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || '';

// Inner State values for Full Set tracking
export const INNER_STATES = [
  'Awakened',
  'Calm',
  'Curious', 
  'Determined',
  'Ethereal',
  'Hopeful',
  'Radiant'
] as const;

export type InnerState = typeof INNER_STATES[number];
