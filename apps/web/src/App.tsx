import {
  BitcoinNetwork,
  BrandMark,
  EthereumNetwork,
  LookupPanel,
  NetworkIcon,
} from '@chainbeacon/ui';
import { supportedNetworks } from '@chainbeacon/core';

export default function App() {
  return (
    <main className="web-shell">
      <header className="web-header">
        <div className="brand">
          <BrandMark />
          <span>
            Chain<span className="brand-accent">Beacon</span>
          </span>
        </div>
        <nav aria-label="Main navigation">
          <a href="#networks">Networks</a>
          <a href="#privacy">Privacy</a>
          <a
            href="https://github.com/cryptoumit/ChainBeacon"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub ↗
          </a>
        </nav>
      </header>
      <section className="web-hero" id="top">
        <div className="web-eyebrow">
          <span className="live-dot" /> LOCAL BLOCKCHAIN LOOKUP
        </div>
        <h1>
          Find the right
          <br />
          <span>chain, faster.</span>
        </h1>
        <p>
          Identify a blockchain address or transaction hash, then open it in the
          right public explorer.
        </p>
        <div className="web-lookup">
          <LookupPanel />
          <p className="validation-note">
            Format checks run on this device. They do not verify that an address
            or transaction exists on-chain.
          </p>
        </div>
        <div className="web-trust">
          <span>✓ No account needed</span>
          <span>✓ No lookup data sent</span>
          <span>✓ Mainnet explorers</span>
        </div>
      </section>
      <section className="live-networks" aria-label="Live network data">
        <BitcoinNetwork />
        <EthereumNetwork />
      </section>
      <section className="networks-section" id="networks">
        <div>
          <p className="section-kicker">SUPPORTED MAINNETS</p>
          <h2>One lookup. The right destination.</h2>
          <p className="section-copy">
            ChainBeacon recognizes formats locally and prepares a link for the
            matching explorer.
          </p>
        </div>
        <div className="network-grid">
          {supportedNetworks.map((network) => (
            <div className="network-tile" key={network.id}>
              <NetworkIcon chain={network.id} symbol={network.symbol} />
              <span>{network.label}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="privacy-section" id="privacy">
        <div className="privacy-symbol" aria-hidden="true">
          ◈
        </div>
        <div>
          <p className="section-kicker">PRIVATE BY DESIGN</p>
          <h2>Your lookup stays on your device.</h2>
          <p>
            Address and transaction format checks run locally in your browser.
            ChainBeacon never sends entered values to a server. Bitcoin and
            Ethereum network status shown above is fetched separately from
            public providers. An explorer opens only when you choose its link.
          </p>
          <p className="validation-note">
            A valid format is not proof that a wallet or transaction exists.
            Solana checks Base58 decoded length only. Some 64-character hashes
            match several networks; ChainBeacon shows every supported candidate
            for you to choose.
          </p>
        </div>
      </section>
      <section className="install-section">
        <div>
          <p className="section-kicker">USE CHAINBEACON YOUR WAY</p>
          <h2>Available wherever you work.</h2>
        </div>
        <div className="install-links">
          <a
            href="https://github.com/cryptoumit/ChainBeacon#load-chrome-extension"
            target="_blank"
            rel="noopener noreferrer"
          >
            Chrome extension <span>Setup instructions ↗</span>
          </a>
          <a
            href="https://github.com/cryptoumit/ChainBeacon#load-firefox-extension"
            target="_blank"
            rel="noopener noreferrer"
          >
            Firefox extension <span>Setup instructions ↗</span>
          </a>
        </div>
      </section>
      <footer className="web-footer">
        <div className="brand">
          <BrandMark />
          <span>
            Chain<span className="brand-accent">Beacon</span>
          </span>
        </div>
        <span>Local format detection for public mainnet explorers.</span>
      </footer>
    </main>
  );
}
