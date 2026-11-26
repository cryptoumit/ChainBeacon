import { useEffect, useRef, useState } from 'react';
import {
  fetchLatestEthereumData,
  formatRelativeBlockTime,
  type LatestEthereumData,
} from '../services/ethereum';

const REFRESH_INTERVAL_MS = 60_000;

function EthereumNetwork() {
  const [data, setData] = useState<LatestEthereumData | null>(null);
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
        const latest = await fetchLatestEthereumData();
        if (active) setData(latest);
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
    const interval = window.setInterval(
      () => void refresh(),
      REFRESH_INTERVAL_MS,
    );
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
      setData(await fetchLatestEthereumData());
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }

  return (
    <section className="bitcoin-card" aria-label="Ethereum network">
      <div className="bitcoin-heading">
        <span className="ethereum-symbol" aria-hidden="true">
          ◆
        </span>
        <h2>Ethereum</h2>
        <button
          className={`bitcoin-refresh${refreshing ? ' is-refreshing' : ''}`}
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh Ethereum network data"
          title="Refresh"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20">
            <path d="M16 8a6.2 6.2 0 0 0-10.8-2L3.5 8M4 4v4h4M4 12a6.2 6.2 0 0 0 10.8 2l1.7-2M16 16v-4h-4" />
          </svg>
        </button>
      </div>
      {loading ? (
        <p className="bitcoin-loading">
          <span className="small-spinner" /> Loading network data…
        </p>
      ) : data ? (
        <div className="bitcoin-stats" aria-live="polite">
          <div>
            <span>Latest block</span>
            <strong>{data.height.toLocaleString()}</strong>
          </div>
          <div>
            <span>Block time</span>
            <strong>{formatRelativeBlockTime(data.timestamp)}</strong>
          </div>
          <div>
            <span>Gas</span>
            <strong>{data.gasPriceGwei} Gwei</strong>
          </div>
          {failed && (
            <span className="bitcoin-refresh-note">
              Unable to refresh; showing last available data.
            </span>
          )}
        </div>
      ) : (
        <p className="bitcoin-error" role="status">
          Unable to load Ethereum network data.
        </p>
      )}
    </section>
  );
}

export default EthereumNetwork;
