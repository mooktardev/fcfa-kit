import type { Zone } from './zone';

/**
 * The contract every country module implements.
 *
 * A country lives in its own folder (`src/cm`, `src/ci`, ...) and is published
 * as its own entry point (`fcfa-kit/cm`), so that apps only bundle the
 * countries they use. See `docs/adding-a-country.md`.
 */

export type PhoneFormatStyle = 'e164' | 'international' | 'national';

/** Result of parsing a phone number. `Operator` is the country's operator union. */
export interface ParsedPhone<Operator extends string = string> {
  /** `+<dial code><number>`, no spaces. */
  e164: string;
  /** Grouped number without the country code. */
  national: string;
  /** Grouped number with the country code. */
  international: string;
  kind: 'mobile' | 'landline';
  /** `null` when the prefix is valid but not in the operator table. */
  operator: Operator | null;
}

export interface PhoneModule<Operator extends string = string> {
  /** Returns the E.164 form, or `null` if the input is not a valid number. */
  normalize(input: string): string | null;
  isValid(input: string): boolean;
  getOperator(input: string): Operator | null;
  parse(input: string): ParsedPhone<Operator> | null;
  format(input: string, style?: PhoneFormatStyle): string | null;
  /** Formats a partial input as the user types. */
  mask(input: string): string;
}

export interface CountryModule<Operator extends string = string> {
  /** ISO 3166-1 alpha-2 code, e.g. `"CM"`. */
  readonly iso2: string;
  readonly name: string;
  readonly zone: Zone;
  /** With the leading plus, e.g. `"+237"`. */
  readonly dialCode: string;
  readonly phone: PhoneModule<Operator>;
}
