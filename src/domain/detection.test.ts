import { describe, expect, it } from 'vitest';
import { detectInput } from './detection';
import { getExplorerUrl } from './explorers';

describe('detectInput', () => {
  it('recognizes checksummed and lowercase Ethereum addresses', async () => {
    await expect(detectInput('0x52908400098527886E0F7030069857D2E4169EE7')).resolves.toMatchObject({
      kind: 'address',
      chains: ['ethereum'],
    });
    await expect(detectInput('0xde709f2102306220921060314715629080e2fb77')).resolves.toMatchObject({
      kind: 'address',
      chains: ['ethereum'],
    });
  });

  it('rejects invalid mixed-case Ethereum checksums', async () => {
    await expect(detectInput('0x52908400098527886E0F7030069857D2E4169Ee7')).resolves.toBeNull();
  });

  it('recognizes a Bitcoin SegWit address and rejects a modified checksum', async () => {
    await expect(detectInput('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')).resolves.toMatchObject({
      kind: 'address',
      chains: ['bitcoin'],
    });
    await expect(detectInput('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlq')).resolves.toBeNull();
  });

  it('recognizes Base58Check Bitcoin, XRP Ledger, and TRON addresses', async () => {
    await expect(detectInput('1BoatSLRHtKNngkdXEeobR76b53LETtpyT')).resolves.toMatchObject({
      kind: 'address',
      chains: ['bitcoin'],
    });
    await expect(detectInput('1BoatSLRHtKNngkdXEeobR76b53LETtpyU')).resolves.toBeNull();
    await expect(detectInput('rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH')).resolves.toMatchObject({
      kind: 'address',
      chains: ['xrp'],
    });
    await expect(detectInput('TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL')).resolves.toMatchObject({
      kind: 'address',
      chains: ['tron'],
    });
  });

  it('recognizes Solana public keys and transaction signatures by decoded length', async () => {
    await expect(detectInput('11111111111111111111111111111111')).resolves.toMatchObject({
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
      chains: ['bitcoin', 'xrp', 'tron'],
    });
  });

  it('recognizes prefixed Ethereum transaction hashes', async () => {
    await expect(detectInput(`0x${'a'.repeat(64)}`)).resolves.toMatchObject({
      kind: 'transaction',
      chains: ['ethereum'],
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
    expect(getExplorerUrl('ethereum', 'transaction', `0x${'a'.repeat(64)}`))
      .toBe(`https://etherscan.io/tx/0x${'a'.repeat(64)}`);
    expect(getExplorerUrl('tron', 'address', 'TTest?#'))
      .toBe('https://tronscan.org/#/address/TTest%3F%23');
  });
});
