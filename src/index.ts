export { NBSP, formatFCFA, groupDigits } from './core/format';
export type { FormatOptions } from './core/format';

export { parseFCFA } from './core/parse';
export type { ParseOptions } from './core/parse';

export { amountInWords, numberToWords } from './core/words';
export type { WordsOptions } from './core/words';

export { roundAmount, toSafeInteger } from './core/rounding';
export type { RoundingMode } from './core/rounding';

export { DEFAULT_ZONE, ZONES, assertZone, isZone } from './core/zone';
export type { Zone, ZoneInfo } from './core/zone';

export { applyMask } from './core/mask';
export { normalizeText } from './core/text';

export type {
  CountryModule,
  ParsedPhone,
  PhoneFormatStyle,
  PhoneModule,
} from './core/country';

export { createFCFA } from './core/create';
export type { FCFA, FCFADefaults } from './core/create';
