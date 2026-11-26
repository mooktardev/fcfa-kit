import { describe, expect, it } from 'vitest';
import { formatFCFA } from '../../src/core/format';

/** Expected strings use a plain space for readability; the library emits NBSP. */
const nb = (s: string) => s.replaceAll(' ', ' ');

describe('formatFCFA', () => {
  it('groups digits by three and appends FCFA', () => {
    expect(formatFCFA(1_500_000)).toBe(nb('1 500 000 FCFA'));
    expect(formatFCFA(1000)).toBe(nb('1 000 FCFA'));
    expect(formatFCFA(999)).toBe(nb('999 FCFA'));
    expect(formatFCFA(0)).toBe(nb('0 FCFA'));
  });

  it('has no decimals and rounds half away from zero by default', () => {
    expect(formatFCFA(1500.4)).toBe(nb('1 500 FCFA'));
    expect(formatFCFA(1500.5)).toBe(nb('1 501 FCFA'));
    expect(formatFCFA(-1500.5)).toBe(nb('-1 501 FCFA'));
  });

  it('supports other rounding modes', () => {
    expect(formatFCFA(1500.9, { rounding: 'floor' })).toBe(nb('1 500 FCFA'));
    expect(formatFCFA(1500.1, { rounding: 'ceil' })).toBe(nb('1 501 FCFA'));
    expect(formatFCFA(-1500.9, { rounding: 'trunc' })).toBe(nb('-1 500 FCFA'));
  });

  it('formats negative amounts', () => {
    expect(formatFCFA(-2500)).toBe(nb('-2 500 FCFA'));
  });

  it('never prints "-0"', () => {
    expect(formatFCFA(-0.4)).toBe(nb('0 FCFA'));
    expect(formatFCFA(-0)).toBe(nb('0 FCFA'));
  });

  it('can show the ISO code of the zone instead of the symbol', () => {
    expect(formatFCFA(2500, { display: 'code' })).toBe(nb('2 500 XAF'));
    expect(formatFCFA(2500, { display: 'code', zone: 'XOF' })).toBe(nb('2 500 XOF'));
  });

  it('can omit the unit', () => {
    expect(formatFCFA(2500, { display: 'none' })).toBe(nb('2 500'));
  });

  it('accepts a custom symbol and separators', () => {
    // A custom symbol is used exactly as given (here with a regular inner space).
    expect(formatFCFA(1_500_000, { symbol: 'F CFA' })).toBe(`${nb('1 500 000')} F CFA`);
    expect(formatFCFA(1_500_000, { groupSeparator: '.', symbolSeparator: ' ' })).toBe('1.500.000 FCFA');
  });

  it('rejects invalid input', () => {
    expect(() => formatFCFA(Number.NaN)).toThrow(TypeError);
    expect(() => formatFCFA(Number.POSITIVE_INFINITY)).toThrow(TypeError);
    expect(() => formatFCFA('1500' as unknown as number)).toThrow(TypeError);
    expect(() => formatFCFA(1e20)).toThrow(RangeError);
    expect(() => formatFCFA(1, { zone: 'EUR' as never })).toThrow(TypeError);
  });
});
