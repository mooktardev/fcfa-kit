import { describe, expect, it } from 'vitest';
import { amountInWords, numberToWords } from '../../src/core/words';

describe('numberToWords', () => {
  it.each([
    [0, 'zéro'],
    [1, 'un'],
    [16, 'seize'],
    [17, 'dix-sept'],
    [20, 'vingt'],
    [21, 'vingt et un'],
    [22, 'vingt-deux'],
    [31, 'trente et un'],
    [61, 'soixante et un'],
    [70, 'soixante-dix'],
    [71, 'soixante et onze'],
    [72, 'soixante-douze'],
    [77, 'soixante-dix-sept'],
    [80, 'quatre-vingts'],
    [81, 'quatre-vingt-un'],
    [90, 'quatre-vingt-dix'],
    [91, 'quatre-vingt-onze'],
    [99, 'quatre-vingt-dix-neuf'],
    [100, 'cent'],
    [101, 'cent un'],
    [180, 'cent quatre-vingts'],
    [200, 'deux cents'],
    [201, 'deux cent un'],
    [280, 'deux cent quatre-vingts'],
    [999, 'neuf cent quatre-vingt-dix-neuf'],
    [1000, 'mille'],
    [1001, 'mille un'],
    [1200, 'mille deux cents'],
    [2000, 'deux mille'],
    // "cents" and "quatre-vingts" lose their "s" before "mille"
    [80_000, 'quatre-vingt mille'],
    [200_000, 'deux cent mille'],
    // ...but keep it before "million" / "milliard"
    [80_000_000, 'quatre-vingts millions'],
    [200_000_000, 'deux cents millions'],
    [1_000_000, 'un million'],
    [2_000_000, 'deux millions'],
    [1_001_000, 'un million mille'],
    [1_500_000, 'un million cinq cent mille'],
    [1_000_000_000, 'un milliard'],
    [3_250_000_000, 'trois milliards deux cent cinquante millions'],
    [1_000_000_000_000, 'un billion'],
    [-5, 'moins cinq'],
  ])('%d -> %s', (value, expected) => {
    expect(numberToWords(value)).toBe(expected);
  });

  it('handles the largest safe integer', () => {
    expect(numberToWords(Number.MAX_SAFE_INTEGER)).toBe(
      'neuf billiards sept billions cent quatre-vingt-dix-neuf milliards ' +
        'deux cent cinquante-quatre millions sept cent quarante mille neuf cent quatre-vingt-onze',
    );
  });

  it('rejects non-integers', () => {
    expect(() => numberToWords(1.5)).toThrow(RangeError);
    expect(() => numberToWords(Number.NaN)).toThrow(RangeError);
    expect(() => numberToWords(2 ** 60)).toThrow(RangeError);
  });
});

describe('amountInWords', () => {
  it('appends the currency, with agreement', () => {
    expect(amountInWords(0)).toBe('zéro franc CFA');
    expect(amountInWords(1)).toBe('un franc CFA');
    expect(amountInWords(2)).toBe('deux francs CFA');
    expect(amountInWords(1_500_000)).toBe('un million cinq cent mille francs CFA');
    expect(amountInWords(25_000)).toBe('vingt-cinq mille francs CFA');
  });

  it('adds "de" after an exact million / milliard', () => {
    expect(amountInWords(1_000_000)).toBe('un million de francs CFA');
    expect(amountInWords(2_000_000)).toBe('deux millions de francs CFA');
    expect(amountInWords(3_000_000_000)).toBe('trois milliards de francs CFA');
    expect(amountInWords(1_000_001)).toBe('un million un francs CFA');
  });

  it('rounds to a whole number of francs', () => {
    expect(amountInWords(1500.6)).toBe('mille cinq cent un francs CFA');
    expect(amountInWords(1500.6, { rounding: 'floor' })).toBe('mille cinq cents francs CFA');
  });

  it('can drop the unit and capitalize', () => {
    expect(amountInWords(1500, { unit: false })).toBe('mille cinq cents');
    expect(amountInWords(1500, { unit: false, capitalize: true })).toBe('Mille cinq cents');
  });

  it('handles negative amounts', () => {
    expect(amountInWords(-1500)).toBe('moins mille cinq cents francs CFA');
  });

  it('rejects invalid amounts', () => {
    expect(() => amountInWords(Number.NaN)).toThrow(TypeError);
  });
});
