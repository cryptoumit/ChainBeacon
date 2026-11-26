import { formatRelativeBlockTime } from './bitcoin';

const RPC_URL = 'https://eth.nodely.dev';
const REQUEST_TIMEOUT_MS = 10_000;

export type LatestEthereumData = {
  height: number;
  timestamp: number;
  gasPriceGwei: string;
};

type RpcResponse = {
  jsonrpc?: unknown;
  id?: unknown;
  result?: unknown;
  error?: unknown;
};

async function rpcRequest(
  method: string,
  params: unknown[],
  id: number,
  signal: AbortSignal,
): Promise<unknown> {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    signal,
  });
  if (!response.ok) throw new Error('Ethereum RPC request failed');

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== 'object')
    throw new Error('Invalid Ethereum RPC response');
  const rpc = payload as RpcResponse;
  if (
    rpc.jsonrpc !== '2.0' ||
    rpc.id !== id ||
    rpc.error !== undefined ||
    rpc.result === undefined
  ) {
    throw new Error('Invalid Ethereum RPC response');
  }
  return rpc.result;
}

function parseQuantity(value: unknown): bigint {
  if (typeof value !== 'string' || !/^0x[0-9a-f]+$/i.test(value)) {
    throw new Error('Invalid Ethereum quantity');
  }
  return BigInt(value);
}

export function formatGwei(wei: bigint): string {
  const tenths = (wei + 50_000_000n) / 100_000_000n;
  return `${tenths / 10n}.${tenths % 10n}`;
}

export async function fetchLatestEthereumData(): Promise<LatestEthereumData> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const [blockResult, gasResult] = await Promise.all([
      rpcRequest(
        'eth_getBlockByNumber',
        ['latest', false],
        1,
        controller.signal,
      ),
      rpcRequest('eth_gasPrice', [], 2, controller.signal),
    ]);
    if (!blockResult || typeof blockResult !== 'object')
      throw new Error('Invalid Ethereum block response');

    const block = blockResult as { number?: unknown; timestamp?: unknown };
    const height = parseQuantity(block.number);
    const timestamp = parseQuantity(block.timestamp);
    const gasPrice = parseQuantity(gasResult);
    if (
      height > BigInt(Number.MAX_SAFE_INTEGER) ||
      timestamp > BigInt(Number.MAX_SAFE_INTEGER)
    ) {
      throw new Error('Ethereum quantity is out of range');
    }

    return {
      height: Number(height),
      timestamp: Number(timestamp),
      gasPriceGwei: formatGwei(gasPrice),
    };
  } catch (error) {
    controller.abort();
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export { formatRelativeBlockTime };
