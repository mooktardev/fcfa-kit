import { roundAmount, type RoundingMode } from './rounding';

export interface ParseOptions {
  /** How a non-integer result is rounded. Default: `"round"`. */
  rounding?: RoundingMode;
  /** If true, returns `null` instead of rounding a non-integer result. */
  strict?: boolean;
}

/** Decimal exponent of each suffix. */
const SUFFIX_EXPONENT: Readonly<Record<string, number>> = {
  k: 3,
  mille: 3,
  m: 6,
  mio: 6,
  million: 6,
  millions: 6,
  md: 9,
  milliard: 9,
  milliards: 9,
};

const LEADING_CURRENCY = /^(?:f\s*\.?\s*cfa|fcfa|francs?\s*cfa|xaf|xof|cfa)\s*/;
const TRAILING_CURRENCY = /\s*(?:f\s*\.?\s*cfa|fcfa|francs?\s*cfa|francs?|xaf|xof|cfa|f)\.?$/;
const SUFFIX = /^(.*?)\s*(milliards?|millions?|mille|mio|md|k|m)$/;

/** Splits a validated numeric string into integer and fractional digits. */
function splitNumber(raw: string, hasSuffix: boolean): { int: string; frac: string } | null {
  let s = raw;

  // Spaces are only accepted as thousands separators: "1 500 000" or "1 500 000,5".
  if (s.includes(' ')) {
    if (!/^\d{1,3}(?: \d{3})+(?:[.,]\d+)?$/.test(s)) return null;
    s = s.replace(/ /g, '');
  }

  const separators = s.match(/[.,]/g) ?? [];
  if (separators.length === 0) return { int: s, frac: '' };

  const hasDot = s.includes('.');
  const hasComma = s.includes(',');

  // Both kinds: the last one is the decimal mark, the other groups thousands.
  if (hasDot && hasComma) {
    const last = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','));
    const decimalMark = s.charAt(last);
    const thousandsMark = decimalMark === '.' ? ',' : '.';
    const intPart = s.slice(0, last);
    const fracPart = s.slice(last + 1);
    const grouped = new RegExp(`^\\d{1,3}(?:\\${thousandsMark}\\d{3})+$`);
    if (!grouped.test(intPart) || !/^\d+$/.test(fracPart)) return null;
    return { int: intPart.split(thousandsMark).join(''), frac: fracPart };
  }

  const mark = hasDot ? '.' : ',';

  // Repeated mark: thousands grouping ("1.500.000").
  if (separators.length > 1) {
    const grouped = new RegExp(`^\\d{1,3}(?:\\${mark}\\d{3})+$`);
    if (!grouped.test(s)) return null;
    return { int: s.split(mark).join(''), frac: '' };
  }

  // A single mark is ambiguous.
  const index = s.indexOf(mark);
  const before = s.slice(0, index);
  const after = s.slice(index + 1);
  if (before === '' || after === '' || !/^\d+$/.test(before) || !/^\d+$/.test(after)) return null;

  // With a suffix ("1,5M") it is always a decimal mark. Without one, exactly
  // three digits after a short non-zero head ("1,500", "12.345") mean thousands.
  const looksLikeThousands =
    !hasSuffix && after.length === 3 && before.length <= 3 && before !== '0';
  return looksLikeThousands ? { int: before + after, frac: '' } : { int: before, frac: after };
}

/** Exact decimal shift: (int.frac × 10^exp) as a decimal string. */
function shiftDecimal(int: string, frac: string, exp: number): string {
  const digits = int + frac;
  const point = int.length + exp;
  if (point >= digits.length) return digits + '0'.repeat(point - digits.length);
  return `${digits.slice(0, point)}.${digits.slice(point)}`;
}

/**
 * Parses a human-written amount into an integer number of CFA francs.
 * Returns `null` when the text is not a recognizable amount.
 *
 * Supported: plain digits, space / dot / comma thousands separators, a decimal
 * comma or dot, a leading sign, a currency mark (`FCFA`, `F CFA`, `XAF`,
 * `XOF`, `francs`...) and the suffixes `k`, `mille`, `M`, `million(s)`, `Md`,
 * `milliard(s)`.
 *
 * A single `,` or `.` is read as a decimal mark when a suffix is present
 * (`"1,5M"` is 1 500 000) and as a thousands separator when exactly three
 * digits follow (`"1,500"` is 1 500).
 *
 * @example
 * parseFCFA('1,5M');            // 1500000
 * parseFCFA('250k');            // 250000
 * parseFCFA('1 500 000 FCFA');  // 1500000
 * parseFCFA('2,5 millions');    // 2500000
 * parseFCFA('abc');             // null
 */
export function parseFCFA(input: string, options: ParseOptions = {}): number | null {
  if (typeof input !== 'string') return null;
  const { rounding = 'round', strict = false } = options;

  let text = input
    .toLowerCase()
    .replace(/−/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  text = text.replace(LEADING_CURRENCY, '').replace(TRAILING_CURRENCY, '').trim();

  let sign = 1;
  if (text.startsWith('-') || text.startsWith('+')) {
    sign = text.startsWith('-') ? -1 : 1;
    text = text.slice(1).trim();
  }

  const suffixMatch = SUFFIX.exec(text);
  const suffix = suffixMatch?.[2];
  const numeric = suffixMatch ? (suffixMatch[1] ?? '').trim() : text;
  const exponent = suffix === undefined ? 0 : SUFFIX_EXPONENT[suffix];
  if (exponent === undefined) return null;

  if (!/^\d[\d .,]*$/.test(numeric)) return null;
  const parts = splitNumber(numeric, suffix !== undefined);
  if (!parts) return null;

  const shifted = shiftDecimal(parts.int, parts.frac, exponent);
  const [, fractional = ''] = shifted.split('.');
  if (strict && !/^0*$/.test(fractional)) return null;

  // The sign is applied before rounding so that floor/ceil behave correctly on negatives.
  const value = roundAmount(sign * Number(shifted), rounding);
  return Number.isSafeInteger(value) ? value : null;
}
