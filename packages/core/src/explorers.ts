import type { Chain, DataKind } from './detection';

const explorerBases: Record<Chain, Record<DataKind, string>> = {
  bitcoin: {
    address: 'https://blockstream.info/address/',
    transaction: 'https://blockstream.info/tx/',
  },
  ethereum: {
    address: 'https://etherscan.io/address/',
    transaction: 'https://etherscan.io/tx/',
  },
  xrp: {
    address: 'https://livenet.xrpl.org/accounts/',
    transaction: 'https://livenet.xrpl.org/transactions/',
  },
  tron: {
    address: 'https://tronscan.org/#/address/',
    transaction: 'https://tronscan.org/#/transaction/',
  },
  solana: {
    address: 'https://solscan.io/account/',
    transaction: 'https://solscan.io/tx/',
  },
  stellar: {
    address: 'https://stellar.expert/explorer/public/account/',
    transaction: 'https://stellar.expert/explorer/public/tx/',
  },
};

export const chainLabels: Record<Chain, string> = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  xrp: 'XRP Ledger',
  tron: 'TRON',
  solana: 'Solana',
  stellar: 'Stellar (XLM)',
};

export function getExplorerUrl(
  chain: Chain,
  kind: DataKind,
  value: string,
): string {
  return `${explorerBases[chain][kind]}${encodeURIComponent(value)}`;
}
