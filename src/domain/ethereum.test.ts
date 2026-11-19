import { describe, expect, it } from 'vitest';
import { formatRelativeBlockTime } from './bitcoin';
import { formatGwei } from './ethereum';

describe('Ethereum network formatters', () => {
  it('formats block age in seconds, minutes, hours, and days', () => {
    const now = 1_800_000_000_000;

    expect(formatRelativeBlockTime(now / 1000 - 12, now)).toBe('12 secs ago');
    expect(formatRelativeBlockTime(now / 1000 - 60, now)).toBe('1 min ago');
    expect(formatRelativeBlockTime(now / 1000 - 3_600, now)).toBe('1 hour ago');
    expect(formatRelativeBlockTime(now / 1000 - 86_400, now)).toBe('1 day ago');
  });

  it('converts wei to Gwei rounded to one decimal place', () => {
    expect(formatGwei(8_400_000_000n)).toBe('8.4');
    expect(formatGwei(143_574_552n)).toBe('0.1');
  });
});
