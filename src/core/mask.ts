/**
 * Progressively applies an input mask, as the user types.
 *
 * In `pattern`, `9` is a digit slot and any other character is a literal.
 * Literals are only emitted when another digit follows, so deleting the last
 * digit also removes the separator before it.
 *
 * @example
 * applyMask('67712', '9 99 99 99 99'); // "6 77 12"
 * applyMask('', '9 99 99 99 99');      // ""
 */
export function applyMask(input: string, pattern: string): string {
  const digits = input.replace(/\D/g, '');
  let out = '';
  let next = 0;
  for (const char of pattern) {
    if (next >= digits.length) break;
    out += char === '9' ? digits.charAt(next++) : char;
  }
  return out;
}
