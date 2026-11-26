import { describe, expect, it } from 'vitest';
import {
  cameroon,
  findPrefixRule,
  formatPhone,
  getPhoneOperator,
  isValidPhone,
  maskPhone,
  normalizePhone,
  parsePhone,
} from '../../src/cm';

describe('normalizePhone', () => {
  it.each([
    '677123456',
    '6 77 12 34 56',
    '677 123 456',
    '677.12.34.56',
    '+237 677 12 34 56',
    '+237677123456',
    '+237 6 77 12 34 56',
    '(+237) 677-12-34-56',
    '00237677123456',
    '00 237 677 12 34 56',
    '237677123456',
    '  677123456  ',
  ])('normalizes %j', (input) => {
    expect(normalizePhone(input)).toBe('+237677123456');
  });

  it('normalizes landlines', () => {
    expect(normalizePhone('222 62 42 76')).toBe('+237222624276');
    expect(normalizePhone('+237 233 44 10 00')).toBe('+237233441000');
  });

  it.each([
    '',
    '   ',
    'abc',
    '67712345', // 8 digits: the pre-2014 plan
    '6771234567', // 10 digits
    '0677123456', // there is no trunk prefix
    '177123456', // 1 is not a mobile or fixed prefix
    '877123456',
    '+33677123456', // wrong country
    '+237+677123456',
    '677+123456',
    '+237 77123456', // 8 digits after the country code
    '677 123 45a',
  ])('rejects %j', (input) => {
    expect(normalizePhone(input)).toBeNull();
    expect(isValidPhone(input)).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(normalizePhone(677123456 as unknown as string)).toBeNull();
    expect(normalizePhone(undefined as unknown as string)).toBeNull();
  });
});

describe('isValidPhone', () => {
  it('filters by kind', () => {
    expect(isValidPhone('677123456', { kind: 'mobile' })).toBe(true);
    expect(isValidPhone('677123456', { kind: 'landline' })).toBe(false);
    expect(isValidPhone('222624276', { kind: 'landline' })).toBe(true);
    expect(isValidPhone('222624276', { kind: 'mobile' })).toBe(false);
  });

  it('is structural by default and checks the prefix table when strict', () => {
    expect(isValidPhone('621234567')).toBe(true);
    expect(isValidPhone('621234567', { strict: true })).toBe(false);
    expect(isValidPhone('671234567', { strict: true })).toBe(true);
    expect(isValidPhone('222624276', { strict: true })).toBe(true);
  });
});

describe('getPhoneOperator', () => {
  it.each([
    // MTN
    ['650123456', 'MTN'],
    ['654123456', 'MTN'],
    ['670123456', 'MTN'],
    ['679123456', 'MTN'],
    // Orange
    ['655123456', 'ORANGE'],
    ['659123456', 'ORANGE'],
    ['690123456', 'ORANGE'],
    ['699123456', 'ORANGE'],
    // Nexttel
    ['660123456', 'NEXTTEL'],
    ['669123456', 'NEXTTEL'],
    // Camtel (fixed: geographic and CDMA)
    ['222624276', 'CAMTEL'],
    ['233441000', 'CAMTEL'],
    ['242460025', 'CAMTEL'],
    ['243123456', 'CAMTEL'],
  ])('%s -> %s', (input, expected) => {
    expect(getPhoneOperator(input)).toBe(expected);
  });

  it('works with any accepted notation', () => {
    expect(getPhoneOperator('+237 6 55 12 34 56')).toBe('ORANGE');
  });

  it('returns null for a valid number in an unlisted range', () => {
    expect(isValidPhone('621234567')).toBe(true);
    expect(getPhoneOperator('621234567')).toBeNull();
    expect(getPhoneOperator('640123456')).toBeNull();
  });

  it('returns null for invalid input', () => {
    expect(getPhoneOperator('12345')).toBeNull();
  });

  it('flags 68x as outside the 2014 ART publication', () => {
    expect(getPhoneOperator('681234567')).toBe('MTN');
    expect(getPhoneOperator('681234567', { officialOnly: true })).toBeNull();
    expect(getPhoneOperator('671234567', { officialOnly: true })).toBe('MTN');
  });

  it('lets the longest prefix win', () => {
    expect(findPrefixRule('655123456')?.prefix).toBe('655');
    expect(findPrefixRule('661123456')?.prefix).toBe('66');
  });
});

describe('parsePhone', () => {
  it('describes a mobile number', () => {
    expect(parsePhone('+237 677 12 34 56')).toEqual({
      e164: '+237677123456',
      national: '6 77 12 34 56',
      international: '+237 6 77 12 34 56',
      kind: 'mobile',
      operator: 'MTN',
    });
  });

  it('describes a landline', () => {
    expect(parsePhone('222624276')).toEqual({
      e164: '+237222624276',
      national: '222 62 42 76',
      international: '+237 222 62 42 76',
      kind: 'landline',
      operator: 'CAMTEL',
    });
  });

  it('returns null for invalid input', () => {
    expect(parsePhone('nope')).toBeNull();
  });
});

describe('formatPhone', () => {
  it('supports the three styles', () => {
    expect(formatPhone('677123456')).toBe('+237 6 77 12 34 56');
    expect(formatPhone('677123456', 'international')).toBe('+237 6 77 12 34 56');
    expect(formatPhone('677123456', 'national')).toBe('6 77 12 34 56');
    expect(formatPhone('677123456', 'e164')).toBe('+237677123456');
  });

  it('returns null for invalid input', () => {
    expect(formatPhone('123')).toBeNull();
  });
});

describe('maskPhone', () => {
  it.each([
    ['', ''],
    ['6', '6'],
    ['67', '6 7'],
    ['677', '6 77'],
    ['6771', '6 77 1'],
    ['67712', '6 77 12'],
    ['677123456', '6 77 12 34 56'],
    ['6771234567890', '6 77 12 34 56'], // extra digits dropped
    ['6 77-12', '6 77 12'], // separators typed by the user are ignored
    ['+237 67712', '6 77 12'],
    ['+237', ''],
    ['+23', ''],
    ['+2', ''],
    ['00237677', '6 77'],
    ['237677123456', '6 77 12 34 56'], // pasted with the country code
    ['222624276', '222 62 42 76'], // landline pattern
    ['22', '22'],
    ['222', '222'],
    ['2226', '222 6'],
  ])('%j -> %j', (input, expected) => {
    expect(maskPhone(input)).toBe(expected);
  });

  it('can prefix the country code', () => {
    expect(maskPhone('67712', { countryCode: true })).toBe('+237 6 77 12');
    expect(maskPhone('', { countryCode: true })).toBe('');
  });

  it('is idempotent', () => {
    const once = maskPhone('677123456');
    expect(maskPhone(once)).toBe(once);
  });
});

describe('cameroon module', () => {
  it('describes the country', () => {
    expect(cameroon.iso2).toBe('CM');
    expect(cameroon.zone).toBe('XAF');
    expect(cameroon.dialCode).toBe('+237');
  });

  it('exposes the generic phone contract', () => {
    expect(cameroon.phone.normalize('677123456')).toBe('+237677123456');
    expect(cameroon.phone.isValid('677123456')).toBe(true);
    expect(cameroon.phone.getOperator('655123456')).toBe('ORANGE');
    expect(cameroon.phone.format('677123456', 'national')).toBe('6 77 12 34 56');
    expect(cameroon.phone.mask('67712')).toBe('6 77 12');
    expect(cameroon.phone.parse('677123456')?.kind).toBe('mobile');
  });
});
