import { toSafeInteger, type RoundingMode } from './rounding';
import { assertZone, DEFAULT_ZONE, type Zone } from './zone';

/** Non-breaking space: keeps "1 500 FCFA" from wrapping across lines. */
export const NBSP = ' ';

export interface FormatOptions {
  /** CFA zone. Only matters when `display` is `"code"`. Default: `"XAF"`. */
  zone?: Zone;
  /**
   * What follows the number:
   * - `"symbol"` (default): the `symbol` option, `"FCFA"` by default
   * - `"code"`: the ISO 4217 code of the zone (`XAF` or `XOF`)
   * - `"none"`: the bare number
   */
  display?: 'symbol' | 'code' | 'none';
  /** Symbol used when `display` is `"symbol"`. Default: `"FCFA"`. */
  symbol?: string;
  /** How non-integer amounts are rounded. Default: `"round"`. */
  rounding?: RoundingMode;
  /** Separator between digit groups. Default: non-breaking space. */
  groupSeparator?: string;
  /** Separator between the number and the symbol. Default: non-breaking space. */
  symbolSeparator?: string;
}

/** Inserts `separator` between groups of three digits. */
export function groupDigits(digits: string, separator: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/**
 * Formats an amount in CFA francs, without decimals.
 *
 * @example
 * formatFCFA(1500000);                     // "1 500 000 FCFA"
 * formatFCFA(1500000, { display: 'none' }); // "1 500 000"
 * formatFCFA(1500000, { zone: 'XOF', display: 'code' }); // "1 500 000 XOF"
 *
 * @throws TypeError if `amount` is not a finite number
 * @throws RangeError if the amount is outside the safe integer range
 */
export function formatFCFA(amount: number, options: FormatOptions = {}): string {
  const {
    zone = DEFAULT_ZONE,
    display = 'symbol',
    symbol = 'FCFA',
    rounding = 'round',
    groupSeparator = NBSP,
    symbolSeparator = NBSP,
  } = options;
  assertZone(zone);

  const value = toSafeInteger(amount, rounding);
  const grouped = groupDigits(String(Math.abs(value)), groupSeparator);
  const body = value < 0 ? `-${grouped}` : grouped;

  if (display === 'none') return body;
  const unit = display === 'code' ? zone : symbol;
  return `${body}${symbolSeparator}${unit}`;
}
