import { existsSync, readdirSync } from 'node:fs';
import { defineConfig } from 'tsup';

/**
 * Each folder in `src/` (other than `core`) that has an `index.ts` is a country
 * module and becomes its own entry point: `src/cm` -> `fcfa-kit/cm`.
 *
 * The matching `exports` entry in package.json must be added by hand; the test
 * `test/package.test.ts` fails with a clear message if one is missing.
 */
const countries = readdirSync('src', { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== 'core' && existsSync(`src/${d.name}/index.ts`))
  .map((d) => d.name);

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    ...Object.fromEntries(countries.map((c) => [c, `src/${c}/index.ts`])),
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  target: 'es2020',
  outDir: 'dist',
});
