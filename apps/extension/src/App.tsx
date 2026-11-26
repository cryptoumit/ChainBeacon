import { BrandMark, LookupPanel } from '@chainbeacon/ui';
import { supportedNetworks } from '@chainbeacon/core';

export default function App() {
  return (
    <main className="app-shell extension-shell">
      <header className="topbar">
        <div className="brand">
          <BrandMark />
          <span>
            Chain<span className="brand-accent">Beacon</span>
          </span>
        </div>
        <div className="eyebrow">
          <span className="live-dot" /> BLOCKCHAIN LOOKUP
        </div>
      </header>
      <section className="intro">
        <h1>
          Find the right
          <br />
          <span>chain, faster.</span>
        </h1>
        <p>
          Identify an address or transaction and open it in the right explorer.
        </p>
      </section>
      <LookupPanel />
      <footer className="footer">
        <span>
          {supportedNetworks
            .map((network) => network.label.split(' ')[0])
            .join(' · ')}
        </span>
        <span className="privacy-note">◈ Lookup stays on your device</span>
      </footer>
    </main>
  );
}
