import { toSafeInteger, type RoundingMode } from './rounding';

const UNITS = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize',
] as const;

const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'] as const;

/** Scale words, indexed by group of three digits. */
const SCALES = ['', 'mille', 'million', 'milliard', 'billion', 'billiard'] as const;

/** 0 to 19. */
function below20(n: number): string {
  return n <= 16 ? UNITS[n]! : `dix-${UNITS[n - 10]!}`;
}

/** 0 to 99. `plural` adds the "s" to "quatre-vingts" when nothing follows. */
function below100(n: number, plural: boolean): string {
  if (n < 20) return below20(n);

  if (n < 70) {
    const ten = TENS[Math.floor(n / 10)]!;
    const unit = n % 10;
    if (unit === 0) return ten;
    return unit === 1 ? `${ten} et un` : `${ten}-${UNITS[unit]!}`;
  }

  if (n < 80) {
    return n === 71 ? 'soixante et onze' : `soixante-${below20(n - 60)}`;
  }

  if (n === 80) return plural ? 'quatre-vingts' : 'quatre-vingt';
  return `quatre-vingt-${below20(n - 80)}`;
}

/** 1 to 999. `plural` adds the "s" to "cents" / "quatre-vingts" when nothing follows. */
function below1000(n: number, plural: boolean): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];

  if (hundreds === 1) parts.push('cent');
  else if (hundreds > 1) parts.push(`${UNITS[hundreds]!} ${rest === 0 && plural ? 'cents' : 'cent'}`);

  if (rest > 0) parts.push(below100(rest, plural));
  return parts.join(' ');
}

/**
 * Spells an integer out in French (traditional spelling: hyphens only inside
 * numbers below 100, "et" in 21, 31, ... 71).
 *
 * @example
 * numberToWords(1500000); // "un million cinq cent mille"
 * numberToWords(80);      // "quatre-vingts"
 * numberToWords(81);      // "quatre-vingt-un"
 *
 * @throws RangeError if `value` is not a safe integer
 */
export function numberToWords(value: number): string {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Not a safe integer: ${String(value)}`);
  }
  if (value === 0) return UNITS[0];
  if (value < 0) return `moins ${numberToWords(-value)}`;

  const groups: number[] = [];
  for (let rest = value; rest > 0; rest = Math.floor(rest / 1000)) groups.push(rest % 1000);

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i]!;
    if (group === 0) continue;

    if (i === 0) {
      parts.push(below1000(group, true));
    } else if (i === 1) {
      // "mille" never takes an "s" and is never "un mille".
      parts.push(group === 1 ? 'mille' : `${below1000(group, false)} mille`);
    } else {
      // "million", "milliard"... are nouns: they agree, and so do "cents" / "vingts" before them.
      parts.push(`${below1000(group, true)} ${SCALES[i]!}${group > 1 ? 's' : ''}`);
    }
  }
  return parts.join(' ');
}

export interface WordsOptions {
  /** Append the currency name ("francs CFA"). Default: `true`. */
  unit?: boolean;
  /** Capitalize the first letter. Default: `false`. */
  capitalize?: boolean;
  /** How non-integer amounts are rounded. Default: `"round"`. */
  rounding?: RoundingMode;
}

/**
 * Writes an amount of CFA francs in French words.
 *
 * @example
 * amountInWords(1500000);   // "un million cinq cent mille francs CFA"
 * amountInWords(2000000);   // "deux millions de francs CFA"
 * amountInWords(1);         // "un franc CFA"
 * amountInWords(1500, { unit: false, capitalize: true }); // "Mille cinq cents"
 */
export function amountInWords(amount: number, options: WordsOptions = {}): string {
  const { unit = true, capitalize = false, rounding = 'round' } = options;
  const value = toSafeInteger(amount, rounding);

  let text = numberToWords(value);
  if (unit) {
    const abs = Math.abs(value);
    // "deux millions DE francs", but "deux millions cinq cent mille francs".
    const linker = abs >= 1_000_000 && abs % 1_000_000 === 0 ? ' de' : '';
    text += `${linker} ${abs >= 2 ? 'francs' : 'franc'} CFA`;
  }
  return capitalize ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}
