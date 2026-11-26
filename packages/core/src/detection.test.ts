import { describe, expect, it } from 'vitest';
import { detectInput } from './detection';
import { getExplorerUrl } from './explorers';

const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const bech32Alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function encodeBase32(bytes: Uint8Array): string {
  let buffer = 0;
  let bits = 0;
  let encoded = '';
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      encoded += base32Alphabet[(buffer >>> bits) & 31];
      buffer &= (1 << bits) - 1;
    }
  }
  if (bits > 0) encoded += base32Alphabet[(buffer << (5 - bits)) & 31];
  return encoded;
}

function makeStrKey(version: number): string {
  const payload = new Uint8Array(33);
  payload[0] = version;
  let crc = 0;
  for (const byte of payload) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return encodeBase32(new Uint8Array([...payload, crc & 0xff, crc >>> 8]));
}

function makeTaprootAddress(): string {
  const program = new Uint8Array(32);
  const data = [1];
  let buffer = 0;
  let bits = 0;
  for (const byte of program) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      data.push((buffer >>> bits) & 31);
      buffer &= (1 << bits) - 1;
    }
  }
  if (bits > 0) data.push((buffer << (5 - bits)) & 31);

  const hrp = 'bc';
  const expanded = [98 >>> 5, 99 >>> 5, 0, 98 & 31, 99 & 31];
  const values = [...expanded, ...data, 0, 0, 0, 0, 0, 0];
  const generators = [
    0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3,
  ];
  let checksum = 1;
  for (const value of values) {
    const top = checksum >>> 25;
    checksum = ((checksum & 0x1ffffff) << 5) ^ value;
    for (let index = 0; index < generators.length; index += 1) {
      if ((top >>> index) & 1) checksum ^= generators[index];
    }
  }
  checksum ^= 0x2bc830a3;
  const check = Array.from(
    { length: 6 },
    (_, index) => (checksum >>> (5 * (5 - index))) & 31,
  );
  return `${hrp}1${[...data, ...check].map((value) => bech32Alphabet[value]).join('')}`;
}

describe('detectInput', () => {
  it('recognizes checksummed and lowercase EVM addresses', async () => {
    await expect(
      detectInput('0x52908400098527886E0F7030069857D2E4169EE7'),
    ).resolves.toMatchObject({
      kind: 'address',
      chains: ['evm'],
    });
    await expect(
      detectInput('0xde709f2102306220921060314715629080e2fb77'),
    ).resolves.toMatchObject({
      kind: 'address',
      chains: ['evm'],
    });
  });

  it('rejects invalid mixed-case EVM checksums', async () => {
    await expect(
      detectInput('0x52908400098527886E0F7030069857D2E4169Ee7'),
    ).resolves.toBeNull();
  });

  it('recognizes a Bitcoin SegWit address and rejects a modified checksum', async () => {
    await expect(
      detectInput('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'),
    ).resolves.toMatchObject({
      kind: 'address',
      chains: ['bitcoin'],
    });
    await expect(
      detectInput('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlq'),
    ).resolves.toBeNull();
  });

  it('recognizes a Bitcoin Taproot address with a Bech32m checksum', async () => {
    await expect(detectInput(makeTaprootAddress())).resolves.toMatchObject({
      kind: 'address',
      chains: ['bitcoin'],
    });
  });

  it('recognizes Base58Check Bitcoin, XRP Ledger, and TRON addresses', async () => {
    await expect(
      detectInput('1BoatSLRHtKNngkdXEeobR76b53LETtpyT'),
    ).resolves.toMatchObject({
      kind: 'address',
      chains: ['bitcoin'],
    });
    await expect(
      detectInput('1BoatSLRHtKNngkdXEeobR76b53LETtpyU'),
    ).resolves.toBeNull();
    await expect(
      detectInput('rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH'),
    ).resolves.toMatchObject({
      kind: 'address',
      chains: ['xrp'],
    });
    await expect(
      detectInput('TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL'),
    ).resolves.toMatchObject({
      kind: 'address',
      chains: ['tron'],
    });
  });

  it('validates Stellar public StrKeys and rejects malformed keys and secret seeds', async () => {
    await expect(
      detectInput('GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ'),
    ).resolves.toMatchObject({ kind: 'address', chains: ['stellar'] });
    const publicKey = makeStrKey(6 << 3);
    const secretSeed = makeStrKey(18 << 3);
    await expect(detectInput(publicKey)).resolves.toMatchObject({
      kind: 'address',
      chains: ['stellar'],
    });
    await expect(detectInput(`${publicKey.slice(0, -1)}1`)).resolves.toBeNull();
    await expect(detectInput(`${publicKey.slice(1)}`)).resolves.toBeNull();
    await expect(detectInput(secretSeed)).resolves.toBeNull();
  });

  it('recognizes Solana public keys and transaction signatures by decoded length', async () => {
    await expect(
      detectInput('11111111111111111111111111111111'),
    ).resolves.toMatchObject({
      kind: 'address',
      chains: ['solana'],
    });
    await expect(detectInput('1'.repeat(64))).resolves.toMatchObject({
      kind: 'transaction',
      chains: ['solana'],
    });
  });

  it('keeps unprefixed transaction hashes explicitly ambiguous', async () => {
    await expect(detectInput('a'.repeat(64))).resolves.toMatchObject({
      kind: 'transaction',
      chains: ['bitcoin', 'xrp', 'tron', 'stellar'],
    });
  });

  it('recognizes prefixed EVM transaction hashes', async () => {
    await expect(detectInput(`0x${'a'.repeat(64)}`)).resolves.toMatchObject({
      kind: 'transaction',
      chains: ['evm'],
    });
  });

  it('returns no result for empty or malformed inputs', async () => {
    await expect(detectInput('   ')).resolves.toBeNull();
    await expect(detectInput('not-an-address')).resolves.toBeNull();
    await expect(detectInput('a'.repeat(129))).resolves.toBeNull();
  });
});

describe('getExplorerUrl', () => {
  it('creates explorer links for the selected data type and escapes input', () => {
    expect(getExplorerUrl('evm', 'transaction', `0x${'a'.repeat(64)}`)).toBe(
      `https://blockscan.com/tx/0x${'a'.repeat(64)}`,
    );
    expect(getExplorerUrl('tron', 'address', 'TTest?#')).toBe(
      'https://tronscan.org/#/address/TTest%3F%23',
    );
    expect(getExplorerUrl('stellar', 'address', 'GTest?#')).toBe(
      'https://stellar.expert/explorer/public/account/GTest%3F%23',
    );
    expect(getExplorerUrl('stellar', 'transaction', 'a'.repeat(64))).toBe(
      `https://stellar.expert/explorer/public/tx/${'a'.repeat(64)}`,
    );
  });
});
