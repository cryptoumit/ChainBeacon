import { isAddress } from 'viem';

export type Chain = 'bitcoin' | 'ethereum' | 'xrp' | 'tron' | 'solana';
export type DataKind = 'address' | 'transaction';

export interface DetectionResult {
  kind: DataKind;
  chains: Chain[];
  input: string;
}

const base58Alphabets = {
  bitcoin: '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz',
  ripple: 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz',
};

function decodeBase58(value: string, alphabet: string): Uint8Array | null {
  let number = 0n;
  for (const character of value) {
    const digit = alphabet.indexOf(character);
    if (digit < 0) return null;
    number = number * 58n + BigInt(digit);
  }

  const encoded = number.toString(16);
  const hex = number === 0n ? '' : encoded.padStart(Math.ceil(encoded.length / 2) * 2, '0');
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }

  let leadingZeroes = 0;
  while (value[leadingZeroes] === alphabet[0]) leadingZeroes += 1;
  const result = new Uint8Array(leadingZeroes + bytes.length);
  result.set(bytes, leadingZeroes);
  return result;
}

async function sha256(value: Uint8Array): Promise<Uint8Array> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure address validation is unavailable in this browser context.');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', value as BufferSource);
  return new Uint8Array(digest);
}

async function hasBase58Check(value: string, alphabet: string, version: number): Promise<boolean> {
  const decoded = decodeBase58(value, alphabet);
  if (!decoded || decoded.length !== 25 || decoded[0] !== version) return false;
  const payload = decoded.subarray(0, 21);
  const firstHash = await sha256(payload);
  const checksum = await sha256(firstHash);
  return decoded.subarray(21).every((byte, index) => byte === checksum[index]);
}

function bech32Polymod(values: number[]): number {
  const generators = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let checksum = 1;
  for (const value of values) {
    const top = checksum >>> 25;
    checksum = ((checksum & 0x1ffffff) << 5) ^ value;
    for (let index = 0; index < generators.length; index += 1) {
      if ((top >>> index) & 1) checksum ^= generators[index];
    }
  }
  return checksum;
}

function bech32HrpExpand(hrp: string): number[] {
  const high = [...hrp].map((character) => character.charCodeAt(0) >>> 5);
  const low = [...hrp].map((character) => character.charCodeAt(0) & 31);
  return [...high, 0, ...low];
}

function convertBits(values: number[], from: number, to: number): number[] | null {
  let accumulator = 0;
  let bits = 0;
  const result: number[] = [];
  const maxValue = (1 << to) - 1;
  const maxAccumulator = (1 << (from + to - 1)) - 1;
  for (const value of values) {
    if (value < 0 || value >>> from !== 0) return null;
    accumulator = ((accumulator << from) | value) & maxAccumulator;
    bits += from;
    while (bits >= to) {
      bits -= to;
      result.push((accumulator >>> bits) & maxValue);
    }
  }
  if (bits >= from || ((accumulator << (to - bits)) & maxValue) !== 0) return null;
  return result;
}

function isBitcoinSegwitAddress(value: string): boolean {
  if (value !== value.toLowerCase() && value !== value.toUpperCase()) return false;
  const normalized = value.toLowerCase();
  const separator = normalized.lastIndexOf('1');
  if (separator < 1 || separator + 7 > normalized.length) return false;
  const hrp = normalized.slice(0, separator);
  if (hrp !== 'bc') return false;

  const alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  const data = [...normalized.slice(separator + 1)].map((character) => alphabet.indexOf(character));
  if (data.some((value) => value < 0)) return false;

  const version = data[0];
  if (version > 16) return false;
  const checksum = bech32Polymod([...bech32HrpExpand(hrp), ...data]);
  if (version === 0 ? checksum !== 1 : checksum !== 0x2bc830a3) return false;

  const program = convertBits(data.slice(1, -6), 5, 8);
  if (!program || program.length < 2 || program.length > 40) return false;
  return version !== 0 || program.length === 20 || program.length === 32;
}

export async function detectInput(rawInput: string): Promise<DetectionResult | null> {
  const input = rawInput.trim();
  if (!input || input.length > 128) return null;

  if (/^0x[0-9a-f]{40}$/i.test(input) && isAddress(input)) {
    return { input, kind: 'address', chains: ['ethereum'] };
  }
  if (/^0x[0-9a-f]{64}$/i.test(input)) {
    return { input, kind: 'transaction', chains: ['ethereum'] };
  }
  if (isBitcoinSegwitAddress(input)) {
    return { input, kind: 'address', chains: ['bitcoin'] };
  }
  if (await hasBase58Check(input, base58Alphabets.bitcoin, 0x00)
    || await hasBase58Check(input, base58Alphabets.bitcoin, 0x05)) {
    return { input, kind: 'address', chains: ['bitcoin'] };
  }
  if (await hasBase58Check(input, base58Alphabets.ripple, 0x00)) {
    return { input, kind: 'address', chains: ['xrp'] };
  }
  if (await hasBase58Check(input, base58Alphabets.bitcoin, 0x41)) {
    return { input, kind: 'address', chains: ['tron'] };
  }

  const solanaKey = decodeBase58(input, base58Alphabets.bitcoin);
  if (solanaKey?.length === 64) {
    return { input, kind: 'transaction', chains: ['solana'] };
  }
  if (solanaKey?.length === 32) {
    return { input, kind: 'address', chains: ['solana'] };
  }
  if (/^[0-9a-f]{64}$/i.test(input)) {
    return {
      input,
      kind: 'transaction',
      chains: ['bitcoin', 'xrp', 'tron'],
    };
  }
  return null;
}
