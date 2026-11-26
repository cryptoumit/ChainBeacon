import type { Chain } from './detection';

export interface NetworkMetadata {
  id: Chain;
  label: string;
  symbol: string;
}

export const supportedNetworks: readonly NetworkMetadata[] = [
  { id: 'bitcoin', label: 'Bitcoin', symbol: '₿' },
  { id: 'ethereum', label: 'Ethereum', symbol: '◆' },
  { id: 'xrp', label: 'XRP Ledger', symbol: 'X' },
  { id: 'tron', label: 'TRON', symbol: 'T' },
  { id: 'solana', label: 'Solana', symbol: '◎' },
  { id: 'stellar', label: 'Stellar (XLM)', symbol: 'S' },
];
