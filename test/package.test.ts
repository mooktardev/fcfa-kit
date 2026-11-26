import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  exports: Record<string, unknown>;
  typesVersions: Record<string, Record<string, string[]>>;
  dependencies?: Record<string, string>;
};

const countries = readdirSync(join(root, 'src'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== 'core' && existsSync(join(root, 'src', d.name, 'index.ts')))
  .map((d) => d.name);

describe('package.json', () => {
  it('has no runtime dependencies', () => {
    expect(pkg.dependencies ?? {}).toEqual({});
  });

  it('finds at least the Cameroon module', () => {
    expect(countries).toContain('cm');
  });

  it.each(countries)('declares the "%s" country entry point', (code) => {
    const hint = `Add "./${code}" to "exports" and "${code}" to "typesVersions" in package.json (see docs/adding-a-country.md).`;
    expect(pkg.exports[`./${code}`], hint).toEqual({
      import: { types: `./dist/${code}.d.ts`, default: `./dist/${code}.js` },
      require: { types: `./dist/${code}.d.cts`, default: `./dist/${code}.cjs` },
    });
    expect(pkg.typesVersions['*']?.[code], hint).toEqual([`./dist/${code}.d.ts`]);
  });

  it('does not declare a country entry point without a source folder', () => {
    const declared = Object.keys(pkg.exports)
      .filter((key) => key !== '.' && key !== './package.json')
      .map((key) => key.slice(2));
    expect(declared.sort()).toEqual([...countries].sort());
  });
});
