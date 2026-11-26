/**
 * Lowercases, strips accents and collapses punctuation, so that
 * "Éséka", "eseka" and "ESEKA" compare equal.
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
