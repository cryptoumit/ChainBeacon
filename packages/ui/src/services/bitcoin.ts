const API_BASE = 'https://blockstream.info/api';
const REQUEST_TIMEOUT_MS = 10_000;

export type LatestBitcoinBlock = {
  height: number;
  timestamp: number;
};

export async function fetchLatestBitcoinBlock(): Promise<LatestBitcoinBlock> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const hashResponse = await fetch(`${API_BASE}/blocks/tip/hash`, {
      signal: controller.signal,
    });
    if (!hashResponse.ok) throw new Error('Bitcoin API request failed');
    const hash = (await hashResponse.text()).trim();
    if (!/^[a-fA-F0-9]{64}$/.test(hash))
      throw new Error('Invalid Bitcoin block response');

    const blockResponse = await fetch(
      `${API_BASE}/block/${encodeURIComponent(hash)}`,
      {
        signal: controller.signal,
      },
    );
    if (!blockResponse.ok) throw new Error('Bitcoin API request failed');
    const block: unknown = await blockResponse.json();
    if (!block || typeof block !== 'object')
      throw new Error('Invalid Bitcoin block response');

    const { height, timestamp } = block as {
      height?: unknown;
      timestamp?: unknown;
    };
    if (
      typeof height !== 'number' ||
      !Number.isSafeInteger(height) ||
      height < 0 ||
      typeof timestamp !== 'number' ||
      !Number.isFinite(timestamp) ||
      timestamp < 0
    ) {
      throw new Error('Invalid Bitcoin block response');
    }

    return { height, timestamp };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchBitcoinFeeRate(): Promise<number> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`${API_BASE}/fee-estimates`, {
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Bitcoin fee request failed');
    const estimates: unknown = await response.json();
    if (!estimates || typeof estimates !== 'object')
      throw new Error('Invalid Bitcoin fee response');

    const nextBlockRate = (estimates as Record<string, unknown>)['1'];
    if (
      typeof nextBlockRate !== 'number' ||
      !Number.isFinite(nextBlockRate) ||
      nextBlockRate < 0
    ) {
      throw new Error('Invalid Bitcoin fee response');
    }
    return nextBlockRate;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function formatRelativeBlockTime(
  timestamp: number,
  now = Date.now(),
): string {
  const seconds = Math.max(0, Math.floor(now / 1000 - timestamp));
  if (seconds < 60) return `${seconds} ${seconds === 1 ? 'sec' : 'secs'} ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;

  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}
