import { formatFCFA, type FormatOptions } from './format';
import { parseFCFA, type ParseOptions } from './parse';
import { amountInWords, type WordsOptions } from './words';
import { assertZone, type Zone } from './zone';

export type FCFADefaults = FormatOptions;

export interface FCFA {
  readonly zone: Zone;
  format(amount: number, options?: FormatOptions): string;
  parse(input: string, options?: ParseOptions): number | null;
  words(amount: number, options?: WordsOptions): string;
}

/**
 * Binds default options once, so call sites stay short. Useful for a whole
 * app that targets a single zone.
 *
 * @example
 * const fcfa = createFCFA({ zone: 'XOF', display: 'code' });
 * fcfa.format(2500); // "2 500 XOF"
 */
export function createFCFA(defaults: FCFADefaults = {}): FCFA {
  const zone = defaults.zone ?? 'XAF';
  assertZone(zone);
  const base: FormatOptions = { ...defaults, zone };

  return {
    zone,
    format: (amount, options) => formatFCFA(amount, { ...base, ...options }),
    parse: (input, options) => parseFCFA(input, { rounding: base.rounding, ...options }),
    words: (amount, options) => amountInWords(amount, { rounding: base.rounding, ...options }),
  };
}
