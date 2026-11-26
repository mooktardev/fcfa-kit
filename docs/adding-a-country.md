# Adding a country

> 🇫🇷 [Version française](./ajouter-un-pays.md)

Each country is a self-contained folder `src/<iso2>/`, published as its own entry point `fcfa-kit/<iso2>`, and implements the `CountryModule` contract from [`src/core/country.ts`](../src/core/country.ts). [`src/cm`](../src/cm) is the reference implementation: copy it and adapt.

Apps only bundle the countries they import, so a country must **never** be imported from `src/index.ts` or from another country.

## 0. Before writing code

1. **Find the official numbering plan** from the national telecom regulator. A blog or a "country code" website is not a source. Note the document, its date and its URL: they go in the comments of the prefix table and in the README.
2. **Pick the zone.**
   - `XAF` (CEMAC): Cameroon, Central African Republic, Chad, Republic of the Congo, Equatorial Guinea, Gabon.
   - `XOF` (UEMOA): Benin, Burkina Faso, Côte d'Ivoire, Guinea-Bissau, Mali, Niger, Senegal, Togo.
3. **Write down the shape of a national number**: its length, whether there is a trunk prefix (a leading `0` to drop), and the first digit(s) of mobile and fixed numbers.

## 1. Create the folder

```
src/sn/                  # ISO 3166-1 alpha-2, lowercase
  index.ts               # public API + the CountryModule object
  operators.ts           # prefix table, with its source
  phone.ts
  geo.ts                 # optional: typed accessors over the JSON below
  data/                  # optional: regions.json, departments.json, ...
test/sn/
```

## 2. Operator table (`operators.ts`)

One rule per prefix: `{ prefix, operator, kind, official }`. Set `official: true` only for prefixes that appear in the published plan, and say in a comment which prefixes you chose **not** to include and why. A wrong operator is worse than an unknown one: for a valid number with an unlisted prefix, the operator is `null`.

## 3. Phone numbers (`phone.ts`)

`toNationalNumber(input)` is the only function that knows the country's number shapes; everything else is built on it. Adapt:

- the dial code and national length,
- the trunk prefix, if any (`0677…` must normalize like `677…`),
- the accepted first digits.

Then provide the functions of the `PhoneModule` contract: `normalize`, `isValid`, `getOperator`, `parse`, `format`, `mask`. Keep the same behavior as Cameroon:

- never throw on bad input: return `null` / `false`;
- `mask` is progressive and idempotent (`mask(mask(x)) === mask(x)`);
- group digits the way the regulator writes them.

## 4. Export the module (`index.ts`)

```ts
import type { CountryModule } from '../core/country';

export const senegal = {
  iso2: 'SN',
  name: 'Sénégal',
  zone: 'XOF',
  dialCode: '+221',
  phone: { normalize, isValid, getOperator, parse, format, mask },
} as const satisfies CountryModule<SnOperator>;
```

`satisfies` makes the compiler check the whole contract. Also re-export the individual functions and types, as `src/cm/index.ts` does.

## 5. Register the entry point

`tsup.config.ts` discovers new folders by itself. `package.json` does not, so add:

```jsonc
// "exports"
"./sn": {
  "import":  { "types": "./dist/sn.d.ts",  "default": "./dist/sn.js" },
  "require": { "types": "./dist/sn.d.cts", "default": "./dist/sn.cjs" }
},

// "typesVersions" → "*"
"sn": ["./dist/sn.d.ts"]
```

`test/package.test.ts` fails with a message naming what is missing if you forget.

## 6. Tests

Copy `test/cm/phone.test.ts` and cover at least:

- every accepted notation of one number normalizes to the same E.164 string;
- invalid inputs: wrong length, wrong country code, letters, empty string, non-string;
- one number per prefix in the table → expected operator;
- a valid number with an unlisted prefix → `operator: null`;
- `mask`: empty, partial, full, too long, pasted with the country code, idempotence.

If you ship reference data, copy the integrity tests of `test/cm/geo.test.ts` (unique ids, no dangling references, expected counts).

## 7. Documentation

Add the country to the README tables (EN and FR) with the source of the numbering plan, and state clearly what the data does **not** cover.

## Checklist

- [ ] Source of the numbering plan cited in `operators.ts` and in both READMEs
- [ ] `official` flags are honest
- [ ] Nothing imported from `src/index.ts` or another country
- [ ] `exports` and `typesVersions` updated
- [ ] `npm test`, `npm run typecheck`, `npm run build` and `npm run check:package` pass
