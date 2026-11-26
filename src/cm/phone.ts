import type { ParsedPhone, PhoneFormatStyle } from '../core/country';
import { applyMask } from '../core/mask';
import { findPrefixRule, type CmOperator, type CmPhoneKind } from './operators';

export const CM_DIAL_CODE = '+237';
const COUNTRY_DIGITS = '237';
/** Length of the national number: closed 9-digit plan, no trunk prefix. */
const NATIONAL_LENGTH = 9;

/** Input masks, one digit per `9`. Grouping follows the ART's own examples. */
export const PHONE_MASKS: Readonly<Record<CmPhoneKind, string>> = {
  mobile: '9 99 99 99 99', // 6 77 12 34 56
  landline: '999 99 99 99', // 222 62 42 76
};

export type CmParsedPhone = ParsedPhone<CmOperator>;

export interface ValidateOptions {
  /** Only accept this kind of line. */
  kind?: CmPhoneKind;
  /** Also require a prefix that is in the operator table. Default: `false`. */
  strict?: boolean;
}

/**
 * Extracts the 9-digit national number from the usual ways of writing it:
 * `677123456`, `6 77 12 34 56`, `+237 677 12 34 56`, `00237677123456`,
 * `(+237) 677-12-34-56`, `237677123456`.
 */
function toNationalNumber(input: string): string | null {
  if (typeof input !== 'string') return null;
  const text = input.trim();
  if (!/^[\d\s().+-]+$/.test(text)) return null;

  const pluses = text.match(/\+/g)?.length ?? 0;
  if (pluses > 1 || (pluses === 1 && !/^\(?\+/.test(text))) return null;

  let digits = text.replace(/\D/g, '');
  if (pluses === 1) {
    if (!digits.startsWith(COUNTRY_DIGITS)) return null;
    digits = digits.slice(COUNTRY_DIGITS.length);
  } else if (digits.startsWith(`00${COUNTRY_DIGITS}`)) {
    digits = digits.slice(2 + COUNTRY_DIGITS.length);
  } else if (digits.length === NATIONAL_LENGTH + COUNTRY_DIGITS.length && digits.startsWith(COUNTRY_DIGITS)) {
    digits = digits.slice(COUNTRY_DIGITS.length);
  }

  // Mobile numbers start with 6, fixed lines with 2.
  return /^[26]\d{8}$/.test(digits) ? digits : null;
}

function kindOf(nationalNumber: string): CmPhoneKind {
  return nationalNumber.startsWith('6') ? 'mobile' : 'landline';
}

function group(nationalNumber: string): string {
  return applyMask(nationalNumber, PHONE_MASKS[kindOf(nationalNumber)]);
}

/** `+237677123456`, or `null` if the input is not a valid number. */
export function normalizePhone(input: string): string | null {
  const national = toNationalNumber(input);
  return national ? `${CM_DIAL_CODE}${national}` : null;
}

export function isValidPhone(input: string, options: ValidateOptions = {}): boolean {
  const national = toNationalNumber(input);
  if (!national) return false;
  if (options.kind && kindOf(national) !== options.kind) return false;
  if (options.strict && !findPrefixRule(national)) return false;
  return true;
}

/**
 * Operator that was allocated the number's prefix, or `null` when the number
 * is invalid or its prefix is not in the table.
 *
 * Number portability is not taken into account.
 */
export function getPhoneOperator(
  input: string,
  options: { officialOnly?: boolean } = {},
): CmOperator | null {
  const national = toNationalNumber(input);
  return national ? (findPrefixRule(national, options)?.operator ?? null) : null;
}

export function parsePhone(input: string): CmParsedPhone | null {
  const national = toNationalNumber(input);
  if (!national) return null;
  const grouped = group(national);
  return {
    e164: `${CM_DIAL_CODE}${national}`,
    national: grouped,
    international: `${CM_DIAL_CODE} ${grouped}`,
    kind: kindOf(national),
    operator: findPrefixRule(national)?.operator ?? null,
  };
}

/**
 * @example
 * formatPhone('677123456');                  // "+237 6 77 12 34 56"
 * formatPhone('677123456', 'national');      // "6 77 12 34 56"
 * formatPhone('677123456', 'e164');          // "+237677123456"
 */
export function formatPhone(input: string, style: PhoneFormatStyle = 'international'): string | null {
  const parsed = parsePhone(input);
  if (!parsed) return null;
  return style === 'e164' ? parsed.e164 : style === 'national' ? parsed.national : parsed.international;
}

/**
 * Formats a partial input as the user types. Accepts a pasted `+237` / `00237`
 * prefix and ignores it. Digits beyond the ninth are dropped.
 *
 * @example
 * maskPhone('67712');                          // "6 77 12"
 * maskPhone('+237 67712');                     // "6 77 12"
 * maskPhone('67712', { countryCode: true });   // "+237 6 77 12"
 */
export function maskPhone(input: string, options: { countryCode?: boolean } = {}): string {
  const text = (typeof input === 'string' ? input : '').trim();
  let digits = text.replace(/\D/g, '');

  if (/^\(?\+/.test(text) || text.startsWith('00')) {
    if (text.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith(COUNTRY_DIGITS)) digits = digits.slice(COUNTRY_DIGITS.length);
    else if (COUNTRY_DIGITS.startsWith(digits)) digits = ''; // country code still being typed
  } else if (digits.length === NATIONAL_LENGTH + COUNTRY_DIGITS.length && digits.startsWith(COUNTRY_DIGITS)) {
    digits = digits.slice(COUNTRY_DIGITS.length);
  }

  digits = digits.slice(0, NATIONAL_LENGTH);
  const masked = applyMask(digits, PHONE_MASKS[digits.startsWith('2') ? 'landline' : 'mobile']);
  return options.countryCode && masked ? `${CM_DIAL_CODE} ${masked}` : masked;
}
