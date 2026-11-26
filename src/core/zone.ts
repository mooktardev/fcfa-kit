/** The two CFA franc zones. */
export type Zone = 'XAF' | 'XOF';

export interface ZoneInfo {
  /** ISO 4217 currency code. */
  readonly code: Zone;
  /** Full currency name. */
  readonly name: string;
  /** Issuing central bank. */
  readonly centralBank: 'BEAC' | 'BCEAO';
  /** Monetary union. */
  readonly union: 'CEMAC' | 'UEMOA';
}

export const ZONES: Readonly<Record<Zone, ZoneInfo>> = {
  XAF: {
    code: 'XAF',
    name: "Franc CFA (BEAC) — Afrique centrale",
    centralBank: 'BEAC',
    union: 'CEMAC',
  },
  XOF: {
    code: 'XOF',
    name: "Franc CFA (BCEAO) — Afrique de l'Ouest",
    centralBank: 'BCEAO',
    union: 'UEMOA',
  },
};

/**
 * Zone used when none is given. XAF is the default because the first
 * supported country (Cameroon) belongs to the CEMAC zone.
 */
export const DEFAULT_ZONE: Zone = 'XAF';

export function isZone(value: unknown): value is Zone {
  return value === 'XAF' || value === 'XOF';
}

export function assertZone(value: unknown): asserts value is Zone {
  if (!isZone(value)) {
    throw new TypeError(`Invalid zone: ${String(value)} (expected "XAF" or "XOF")`);
  }
}
