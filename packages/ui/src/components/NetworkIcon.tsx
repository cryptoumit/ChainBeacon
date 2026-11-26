import bitcoinIcon from '../assets-bitcoin.svg?url';
import ethereumIcon from '../assets-ethereum.svg?url';
import solanaIcon from '../assets-solana.svg?url';
import stellarIcon from '../assets-stellar.svg?url';
import tronIcon from '../assets-tron.svg?url';
import xrpIcon from '../assets-xrp.svg?url';
import type { Chain } from '@chainbeacon/core';

const icons: Partial<Record<Chain, string>> = {
  bitcoin: bitcoinIcon,
  evm: ethereumIcon,
  solana: solanaIcon,
  stellar: stellarIcon,
  tron: tronIcon,
  xrp: xrpIcon,
};

interface NetworkIconProps {
  chain: Chain;
  symbol?: string;
}

export function NetworkIcon({ chain, symbol }: NetworkIconProps) {
  const icon = icons[chain];

  return (
    <span className={`chain-icon ${chain}`} aria-hidden="true">
      {icon ? <img src={icon} alt="" /> : symbol}
    </span>
  );
}
