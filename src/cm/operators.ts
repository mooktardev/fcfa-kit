export type CmOperator = 'MTN' | 'ORANGE' | 'NEXTTEL' | 'CAMTEL';
export type CmPhoneKind = 'mobile' | 'landline';

export interface PrefixRule {
  /** Leading digits of the 9-digit national number. */
  readonly prefix: string;
  readonly operator: CmOperator;
  readonly kind: CmPhoneKind;
  /**
   * `true`: listed in the ART national numbering plan of 21 November 2014
   * (published by the ITU, Communication of 6.X.2014).
   * `false`: seen in use afterwards, but not in that publication.
   */
  readonly official: boolean;
}

const rule = (
  prefix: string,
  operator: CmOperator,
  kind: CmPhoneKind,
  official = true,
): PrefixRule => ({ prefix, operator, kind, official });

/**
 * Operator prefixes.
 *
 * Source: ART (Agence de Régulation des Télécommunications), national
 * numbering plan, closed 9-digit plan in force since 21 November 2014.
 *
 * Not listed here, on purpose: 62x and 64x. They are quoted on unofficial
 * sites but absent from the ART publication, so a number using them is
 * structurally valid with `operator: null`. Add them with a source.
 *
 * A prefix identifies the operator that was allocated the range, not
 * necessarily the network the number is on today (number portability).
 */
export const PREFIX_RULES: readonly PrefixRule[] = [
  // Mobile
  rule('650', 'MTN', 'mobile'),
  rule('651', 'MTN', 'mobile'),
  rule('652', 'MTN', 'mobile'),
  rule('653', 'MTN', 'mobile'),
  rule('654', 'MTN', 'mobile'),
  rule('655', 'ORANGE', 'mobile'),
  rule('656', 'ORANGE', 'mobile'),
  rule('657', 'ORANGE', 'mobile'),
  rule('658', 'ORANGE', 'mobile'),
  rule('659', 'ORANGE', 'mobile'),
  rule('66', 'NEXTTEL', 'mobile'), // ex-Viettel
  rule('67', 'MTN', 'mobile'),
  rule('69', 'ORANGE', 'mobile'),
  rule('68', 'MTN', 'mobile', false), // in use, absent from the 2014 publication

  // Fixed (Camtel): geographic ranges, then CDMA with restricted mobility
  rule('222', 'CAMTEL', 'landline'),
  rule('233', 'CAMTEL', 'landline'),
  rule('242', 'CAMTEL', 'landline'),
  rule('243', 'CAMTEL', 'landline'),
];

/** Longest matching prefix wins. */
export function findPrefixRule(
  nationalNumber: string,
  options: { officialOnly?: boolean } = {},
): PrefixRule | null {
  let best: PrefixRule | null = null;
  for (const candidate of PREFIX_RULES) {
    if (options.officialOnly && !candidate.official) continue;
    if (nationalNumber.startsWith(candidate.prefix) && (!best || candidate.prefix.length > best.prefix.length)) {
      best = candidate;
    }
  }
  return best;
}
