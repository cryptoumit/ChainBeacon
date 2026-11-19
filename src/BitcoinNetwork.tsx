import { useEffect, useRef, useState } from 'react';
import {
  fetchBitcoinFeeRate,
  fetchLatestBitcoinBlock,
  formatRelativeBlockTime,
  type LatestBitcoinBlock,
} from './domain/bitcoin';

const REFRESH_INTERVAL_MS = 60_000;

function BitcoinNetwork() {
  const [block, setBlock] = useState<LatestBitcoinBlock | null>(null);
  const [feeRate, setFeeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    let active = true;

    async function refresh() {
      if (inFlight.current) return;
      inFlight.current = true;
      if (active) {
        setRefreshing(true);
        setFailed(false);
      }
      try {
        const [blockResult, feeResult] = await Promise.allSettled([
          fetchLatestBitcoinBlock(),
          fetchBitcoinFeeRate(),
        ]);
        if (active) {
          if (blockResult.status === 'fulfilled') setBlock(blockResult.value);
          if (feeResult.status === 'fulfilled') setFeeRate(feeResult.value);
          setFailed(blockResult.status === 'rejected' || feeResult.status === 'rejected');
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        inFlight.current = false;
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void refresh();
    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => {
      active = false;
      inFlight.current = false;
      window.clearInterval(interval);
    };
  }, []);

  async function handleRefresh() {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    setFailed(false);
    try {
      const [blockResult, feeResult] = await Promise.allSettled([
        fetchLatestBitcoinBlock(),
        fetchBitcoinFeeRate(),
      ]);
      if (blockResult.status === 'fulfilled') setBlock(blockResult.value);
      if (feeResult.status === 'fulfilled') setFeeRate(feeResult.value);
      setFailed(blockResult.status === 'rejected' || feeResult.status === 'rejected');
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }

  return (
    <section className="bitcoin-card" aria-label="Bitcoin network">
      <div className="bitcoin-heading">
        <span className="bitcoin-symbol" aria-hidden="true">₿</span>
        <h2>Bitcoin Network</h2>
        <button
          className={`bitcoin-refresh${refreshing ? ' is-refreshing' : ''}`}
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh Bitcoin block data"
          title="Refresh"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20"><path d="M16 8a6.2 6.2 0 0 0-10.8-2L3.5 8M4 4v4h4M4 12a6.2 6.2 0 0 0 10.8 2l1.7-2M16 16v-4h-4" /></svg>
        </button>
      </div>
      {loading ? (
        <p className="bitcoin-loading"><span className="small-spinner" /> Loading network data…</p>
      ) : block || feeRate !== null ? (
        <div className="bitcoin-stats" aria-live="polite">
          <div><span>Block</span><strong>{block ? block.height.toLocaleString() : '—'}</strong></div>
          <div><span>Last block</span><strong>{block ? formatRelativeBlockTime(block.timestamp) : '—'}</strong></div>
          <div title="Estimated fee rate for confirmation in the next block">
            <span>Fee rate</span>
            <strong>{feeRate === null ? '—' : `${feeRate.toFixed(1)} sat/vB`}</strong>
          </div>
          {failed && <span className="bitcoin-refresh-note">Some network data is unavailable.</span>}
        </div>
      ) : (
        <p className="bitcoin-error" role="status">Unable to load Bitcoin network data.</p>
      )}
    </section>
  );
}

export default BitcoinNetwork;
