/**
 * How a non-integer amount is turned into an integer (the CFA franc has no
 * minor unit).
 *
 * - `round`: nearest integer, halves away from zero (2.5 -> 3, -2.5 -> -3)
 * - `floor`: toward negative infinity
 * - `ceil`: toward positive infinity
 * - `trunc`: toward zero
 */
export type RoundingMode = 'round' | 'floor' | 'ceil' | 'trunc';

/** Avoids returning `-0`. */
function clean(value: number): number {
  return value === 0 ? 0 : value;
}

export function roundAmount(value: number, mode: RoundingMode = 'round'): number {
  switch (mode) {
    case 'round': {
      const rounded = Math.round(Math.abs(value));
      return clean(value < 0 ? -rounded : rounded);
    }
    case 'floor':
      return clean(Math.floor(value));
    case 'ceil':
      return clean(Math.ceil(value));
    case 'trunc':
      return clean(Math.trunc(value));
    default:
      throw new TypeError(`Invalid rounding mode: ${String(mode)}`);
  }
}

/**
 * Validates and rounds an amount.
 * @throws TypeError if `amount` is not a finite number
 * @throws RangeError if the rounded amount is not a safe integer
 */
export function toSafeInteger(amount: number, mode: RoundingMode = 'round'): number {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    throw new TypeError(`Invalid amount: ${String(amount)}`);
  }
  const rounded = roundAmount(amount, mode);
  if (!Number.isSafeInteger(rounded)) {
    throw new RangeError(`Amount is outside the safe integer range: ${amount}`);
  }
  return rounded;
}
