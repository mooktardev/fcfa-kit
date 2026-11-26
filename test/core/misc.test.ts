import { describe, expect, it } from 'vitest';
import { applyMask, createFCFA, isZone, normalizeText, ZONES } from '../../src';

describe('applyMask', () => {
  it('applies the pattern progressively', () => {
    expect(applyMask('', '9 99 99')).toBe('');
    expect(applyMask('6', '9 99 99')).toBe('6');
    expect(applyMask('67', '9 99 99')).toBe('6 7');
    expect(applyMask('67712', '9 99 99')).toBe('6 77 12');
  });

  it('ignores non-digits and extra digits', () => {
    expect(applyMask('6-7a7 1 2 9 9', '9 99 99')).toBe('6 77 12');
  });
});

describe('normalizeText', () => {
  it('strips accents, case and punctuation', () => {
    expect(normalizeText('Éséka')).toBe('eseka');
    expect(normalizeText("Nyong-et-So'o")).toBe('nyong et so o');
  });
});

describe('zones', () => {
  it('knows both zones', () => {
    expect(isZone('XAF')).toBe(true);
    expect(isZone('XOF')).toBe(true);
    expect(isZone('EUR')).toBe(false);
    expect(ZONES.XAF.centralBank).toBe('BEAC');
    expect(ZONES.XOF.union).toBe('UEMOA');
  });
});

describe('createFCFA', () => {
  it('binds default options', () => {
    const fcfa = createFCFA({ zone: 'XOF', display: 'code' });
    expect(fcfa.zone).toBe('XOF');
    expect(fcfa.format(2500)).toBe('2 500 XOF');
    expect(fcfa.format(2500, { display: 'none' })).toBe('2 500');
  });

  it('defaults to XAF', () => {
    expect(createFCFA().zone).toBe('XAF');
  });

  it('exposes parse and words', () => {
    const fcfa = createFCFA();
    expect(fcfa.parse('1,5M')).toBe(1_500_000);
    expect(fcfa.words(2)).toBe('deux francs CFA');
  });

  it('applies the default rounding to parse and words', () => {
    const fcfa = createFCFA({ rounding: 'floor' });
    expect(fcfa.parse('1,9')).toBe(1);
    expect(fcfa.words(1.9, { unit: false })).toBe('un');
  });

  it('rejects an invalid zone', () => {
    expect(() => createFCFA({ zone: 'EUR' as never })).toThrow(TypeError);
  });
});
