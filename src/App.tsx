import { useState, type FormEvent } from 'react';
import { chainLabels, getExplorerUrl } from './domain/explorers';
import { detectInput, type DetectionResult } from './domain/detection';
import BitcoinNetwork from './BitcoinNetwork';

function BeaconMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className="brand-mark">
      <path d="M16 3.5 27 9.75v12.5L16 28.5 5 22.25V9.75L16 3.5Z" />
      <path d="M16 9v14M9.5 12.75 22 20M22.5 12.75 10 20" />
      <circle cx="16" cy="16" r="2.2" />
    </svg>
  );
}

function App() {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [message, setMessage] = useState('');
  const [messageIsSuccess, setMessageIsSuccess] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setMessageIsSuccess(false);
    setResult(null);
    setIsChecking(true);
    try {
      const detection = await detectInput(value);
      setResult(detection);
      if (!detection) setMessage('No match found. Check the value and try again.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to validate this value.');
      setMessageIsSuccess(false);
    } finally {
      setIsChecking(false);
    }
  }

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value.trim());
      setMessage('Copied to clipboard.');
      setMessageIsSuccess(true);
    } catch {
      setMessage('Clipboard access is unavailable. Select and copy the value instead.');
      setMessageIsSuccess(false);
    }
  }

  function reset() {
    setValue('');
    setResult(null);
    setMessage('');
    setMessageIsSuccess(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <BeaconMark />
          <span>Chain<span className="brand-accent">Beacon</span></span>
        </div>
        <span className="version-pill">SUPPORT TOOL</span>
      </header>

      <section className="intro">
        <div className="eyebrow"><span className="live-dot" /> BLOCKCHAIN LOOKUP</div>
        <h1>Find the right<br /><span>chain, faster.</span></h1>
        <p>Identify an address or transaction and open it in the right explorer.</p>
      </section>

      <form className="lookup-form" onSubmit={handleSubmit}>
        <label htmlFor="lookup-value">Address or transaction hash</label>
        <div className={`input-wrap${value ? ' has-value' : ''}`}>
          <svg aria-hidden="true" viewBox="0 0 20 20" className="input-icon">
            <path d="M7.5 6.25h-1a3.75 3.75 0 0 0 0 7.5h2.25m3.75-7.5h1a3.75 3.75 0 0 1 0 7.5h-2.25m-4-3.75h7.5" />
          </svg>
          <input
            id="lookup-value"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Paste an address or hash..."
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setResult(null);
              setMessage('');
              setMessageIsSuccess(false);
            }}
          />
          {value && (
            <button type="button" className="clear-button" onClick={reset} aria-label="Clear input">
              <span aria-hidden="true">×</span>
            </button>
          )}
        </div>
        <button className="analyze-button" type="submit" disabled={!value.trim() || isChecking}>
          {isChecking ? (
            <><span className="spinner" /> Checking…</>
          ) : (
            <>Identify value <span aria-hidden="true">↗</span></>
          )}
        </button>
      </form>

      <BitcoinNetwork />

      {message && (
        <p role="status" className={`status-message${messageIsSuccess ? ' success' : ''}`}>{message}</p>
      )}

      {result && (
        <section className="result-card" aria-label="Lookup result">
          <div className="result-heading">
            <span className="result-check" aria-hidden="true">✓</span>
            <div>
              <span className="result-kicker">IDENTIFIED AS</span>
              <h2>{result.kind === 'address' ? 'Wallet address' : 'Transaction hash'}</h2>
            </div>
            <button className="copy-button" type="button" onClick={copyValue} aria-label="Copy value">
              <svg aria-hidden="true" viewBox="0 0 20 20">
                <rect x="7" y="7" width="9" height="10" rx="1.5" />
                <path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v7A1.5 1.5 0 0 0 5.5 14H7" />
              </svg>
            </button>
          </div>
          <p className="result-value" title={result.input}>{result.input}</p>
          <div className="explorer-list">
            {result.chains.map((chain) => (
              <a
                key={chain}
                className="explorer-link"
                href={getExplorerUrl(chain, result.kind, result.input)}
                target="_blank"
                rel="noreferrer"
              >
                <span className={`chain-icon ${chain}`} aria-hidden="true">
                  {chain === 'bitcoin' ? '₿' : chain === 'ethereum' ? '◆' : chain === 'xrp' ? 'X' : chain === 'tron' ? 'T' : '◎'}
                </span>
                <span className="explorer-name">{chainLabels[chain]}</span>
                <span className="explorer-action">{result.chains.length > 1 ? 'Check explorer' : 'Open explorer'}</span>
                <span aria-hidden="true" className="external-icon">↗</span>
              </a>
            ))}
          </div>
          {result.chains.length > 1 && (
            <p className="ambiguity-note">This hash format is shared across these networks. Choose the matching explorer.</p>
          )}
        </section>
      )}

      <footer className="footer">
        <span>Bitcoin · Ethereum · XRP · TRON · Solana</span>
        <span className="privacy-note"><span aria-hidden="true">◈</span> Lookup stays on your device</span>
      </footer>
    </main>
  );
}

export default App;
