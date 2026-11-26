import { describe, expect, it } from 'vitest';
import { parseFCFA } from '../../src/core/parse';

describe('parseFCFA', () => {
  it.each([
    // suffixes
    ['1,5M', 1_500_000],
    ['1.5M', 1_500_000],
    ['1M', 1_000_000],
    ['250k', 250_000],
    ['250K', 250_000],
    ['1,5k', 1_500],
    ['2,5 millions', 2_500_000],
    ['3 milliards', 3_000_000_000],
    ['1,2 Md', 1_200_000_000],
    ['2 mille', 2_000],
    ['0,5M', 500_000],
    // exact decimal arithmetic: 1.1 * 1e6 is 1100000.0000000002 in floating point
    ['1,1M', 1_100_000],
    ['2,675M', 2_675_000],
    // plain numbers and separators
    ['1500', 1_500],
    ['1 500 000', 1_500_000],
    ['1 500 000', 1_500_000],
    ['1 500 000', 1_500_000],
    ['1.500.000', 1_500_000],
    ['1,500,000', 1_500_000],
    ['1,500', 1_500],
    ['1.500', 1_500],
    ['12.345', 12_345],
    // both marks: the last one is the decimal mark
    ['1,234,567.89', 1_234_568],
    ['1.234.567,89', 1_234_568],
    ['1 500,50', 1_501],
    // currency marks
    ['1 500 000 FCFA', 1_500_000],
    ['1 500 000 F CFA', 1_500_000],
    ['2500 XAF', 2_500],
    ['2500 xof', 2_500],
    ['XAF 5000', 5_000],
    ['FCFA 5000', 5_000],
    ['5000 francs', 5_000],
    ['5000 francs CFA', 5_000],
    ['250k FCFA', 250_000],
    ['1,5M FCFA', 1_500_000],
    ['  1 500 F  ', 1_500],
    // signs
    ['-250k', -250_000],
    ['+250k', 250_000],
    ['−250k', -250_000],
    ['0', 0],
    ['-0', 0],
    // ambiguous single mark without suffix: decimal, then rounded
    ['1,5', 2],
    ['0,500', 1],
    ['1234,567', 1_235],
  ])('parses %j as %d', (input, expected) => {
    expect(parseFCFA(input)).toBe(expected);
  });

  it.each([
    '',
    '   ',
    'abc',
    'FCFA',
    'k',
    '1e6',
    '1,2,3',
    '1..5',
    '1.5.5',
    '12 34',
    '1 5M',
    '1M5',
    '1,',
    ',5',
    '--5',
    '9999999999999999999',
  ])('returns null for %j', (input) => {
    expect(parseFCFA(input)).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(parseFCFA(1500 as unknown as string)).toBeNull();
    expect(parseFCFA(undefined as unknown as string)).toBeNull();
  });

  it('can refuse to round', () => {
    expect(parseFCFA('1,5', { strict: true })).toBeNull();
    expect(parseFCFA('1 500,50', { strict: true })).toBeNull();
    expect(parseFCFA('1,5M', { strict: true })).toBe(1_500_000);
    expect(parseFCFA('1 500,00', { strict: true })).toBe(1_500);
  });

  it('supports other rounding modes', () => {
    expect(parseFCFA('1,5', { rounding: 'floor' })).toBe(1);
    expect(parseFCFA('1,2', { rounding: 'ceil' })).toBe(2);
    expect(parseFCFA('-1,9', { rounding: 'trunc' })).toBe(-1);
    expect(parseFCFA('-1,5', { rounding: 'floor' })).toBe(-2);
    expect(parseFCFA('-1,5')).toBe(-2);
  });
});
