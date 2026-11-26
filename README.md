# fcfa-kit

[![CI](https://github.com/YOUR-USERNAME/fcfa-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR-USERNAME/fcfa-kit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/fcfa-kit)](https://www.npmjs.com/package/fcfa-kit)
[![license](https://img.shields.io/npm/l/fcfa-kit)](./LICENSE)

> 🇫🇷 [Lire en français](./README.fr.md)

Zero-dependency TypeScript toolkit for the **CFA franc zone** (XAF and XOF).

- **Currency core**: format (`1 500 000 FCFA`), parse (`"1,5M"`, `"250k"`), amounts in words, no decimals.
- **Country modules**, one per country, imported separately so you only ship what you use. Cameroon (`fcfa-kit/cm`) comes first: phone numbers (normalization, validation, operator detection, input mask) and administrative reference data.
- Dual ESM + CJS build, bundled types, tree-shakable, **no runtime dependency**.

```bash
npm install fcfa-kit
```

## Quick start

```ts
import { formatFCFA, parseFCFA, amountInWords } from 'fcfa-kit';

formatFCFA(1_500_000);          // "1 500 000 FCFA"
parseFCFA('1,5M');              // 1500000
parseFCFA('250k');              // 250000
amountInWords(1_500_000);       // "un million cinq cent mille francs CFA"
```

```ts
import { normalizePhone, getPhoneOperator, formatPhone, maskPhone } from 'fcfa-kit/cm';

normalizePhone('6 77 12 34 56');      // "+237677123456"
getPhoneOperator('+237 655 12 34 56'); // "ORANGE"
formatPhone('677123456');              // "+237 6 77 12 34 56"
maskPhone('67712');                    // "6 77 12"   (as the user types)
```

## Currency core

### `formatFCFA(amount, options?)`

| Option | Default | Description |
| --- | --- | --- |
| `zone` | `"XAF"` | `"XAF"` or `"XOF"`. Selects the ISO code shown with `display: "code"`. |
| `display` | `"symbol"` | `"symbol"` → `FCFA`, `"code"` → `XAF` / `XOF`, `"none"` → bare number. |
| `symbol` | `"FCFA"` | Symbol used when `display` is `"symbol"`. |
| `rounding` | `"round"` | `"round"` (half away from zero), `"floor"`, `"ceil"`, `"trunc"`. |
| `groupSeparator` | non-breaking space | Between digit groups. |
| `symbolSeparator` | non-breaking space | Between the number and the symbol. |

```ts
formatFCFA(2500, { zone: 'XOF', display: 'code' }); // "2 500 XOF"
formatFCFA(1500.5);                                  // "1 501 FCFA"
formatFCFA(-2500, { display: 'none' });              // "-2 500"
```

The CFA franc has no minor unit, so the output never has decimals. Separators are **non-breaking spaces** so an amount never wraps across two lines; pass `groupSeparator: ' '` if you need plain spaces.

It throws a `TypeError` for non-finite input and a `RangeError` beyond `Number.MAX_SAFE_INTEGER`.

### `parseFCFA(text, options?)` → `number | null`

Returns `null` when the text is not an amount; it never throws.

| Input | Result |
| --- | --- |
| `"1,5M"`, `"1.5M"`, `"1,5 millions"` | `1500000` |
| `"250k"`, `"250 K"` | `250000` |
| `"3 milliards"`, `"1,2 Md"` | `3000000000`, `1200000000` |
| `"1 500 000 FCFA"`, `"1.500.000"`, `"1,500,000"` | `1500000` |
| `"XAF 5000"`, `"5000 francs"` | `5000` |
| `"-250k"` | `-250000` |
| `"abc"`, `"1,2,3"` | `null` |

How a lone `,` or `.` is read:

- **with a suffix** (`"1,5M"`): a decimal mark;
- **without one**, exactly three digits after a short non-zero head (`"1,500"`, `"12.345"`): a thousands separator;
- **otherwise** (`"1,5"`): a decimal mark, then rounded.

Scaling is done on the decimal string, not with floating point, so `"1,1M"` is exactly `1100000`. Options: `rounding`, and `strict: true` to return `null` instead of rounding a non-integer result.

### `amountInWords(amount, options?)` and `numberToWords(n)`

French only for now, traditional spelling (`vingt et un`, `quatre-vingts`, `deux cent mille`).

```ts
amountInWords(1);          // "un franc CFA"
amountInWords(2_000_000);  // "deux millions de francs CFA"
amountInWords(80_000);     // "quatre-vingt mille francs CFA"
amountInWords(1500, { unit: false, capitalize: true }); // "Mille cinq cents"
numberToWords(71);         // "soixante et onze"
```

### Other helpers

- `createFCFA(defaults)`: binds options once (`createFCFA({ zone: 'XOF' }).format(2500)`).
- `applyMask(input, pattern)`: progressive input mask, `9` is a digit.
- `ZONES`, `isZone`: zone metadata (central bank, monetary union).

## Cameroon (`fcfa-kit/cm`)

### Phone numbers

Cameroon uses a closed 9-digit plan with no trunk prefix: `6XXXXXXXX` for mobile, `2XXXXXXXX` for fixed lines.

| Function | Description |
| --- | --- |
| `normalizePhone(input)` | → `"+237677123456"` or `null`. Accepts `677123456`, `6 77 12 34 56`, `+237 …`, `00237…`, `(+237) 677-12-34-56`, `237…`. |
| `isValidPhone(input, { kind?, strict? })` | Structural check. `strict` also requires a known operator prefix. |
| `getPhoneOperator(input, { officialOnly? })` | `"MTN" \| "ORANGE" \| "NEXTTEL" \| "CAMTEL" \| null`. |
| `parsePhone(input)` | `{ e164, national, international, kind, operator }` or `null`. |
| `formatPhone(input, style?)` | `"international"` (default), `"national"`, `"e164"`. |
| `maskPhone(input, { countryCode? })` | Progressive formatting of a partial input. |

Operator prefixes (first digits of the 9-digit number):

| Prefix | Operator | Type | Source |
| --- | --- | --- | --- |
| `650`–`654` | MTN | mobile | ART 2014 |
| `655`–`659` | Orange | mobile | ART 2014 |
| `66` | Nexttel | mobile | ART 2014 |
| `67` | MTN | mobile | ART 2014 |
| `69` | Orange | mobile | ART 2014 |
| `68` | MTN | mobile | in use, **not in** the 2014 publication |
| `222`, `233` | Camtel | fixed (geographic) | ART 2014 |
| `242`, `243` | Camtel | fixed (CDMA) | ART 2014 |

Source: Agence de Régulation des Télécommunications (ART), national numbering plan in force since 21 November 2014, as published by the ITU (Communication of 6.X.2014).

Things to know:

- A prefix tells you who the range was **allocated to**, not necessarily who serves the number today. Number portability is not modelled.
- Prefixes `62x` and `64x` are quoted on unofficial websites but are not in the ART publication, so they are **not** in the table. Such a number is structurally valid and returns `operator: null`. Contributions with an official source are welcome.
- `68x` is in the table with `official: false`; use `{ officialOnly: true }` to ignore it.

### Reference data

```ts
import { regions, departments, cities, findCities, getRegion, getDepartmentsByRegion } from 'fcfa-kit/cm';

regions.length;                      // 10
departments.length;                  // 58
findCities('douala')[0];             // { id: 'douala', name: 'Douala', departmentId: 'wouri', regionCode: 'LT', … }
getRegion('Far North')?.name;        // "Extrême-Nord"
getDepartmentsByRegion('CE').length; // 10
```

The 10 regions (ISO 3166-2 codes), the 58 departments with their chefs-lieux, and 63 towns: every department capital plus a few other large towns. The town list is **not** an exhaustive gazetteer. Lookups ignore accents and case. The raw JSON lives in [`src/cm/data`](./src/cm/data).

## Design notes

- **Modular by country.** Each country is a folder under `src/` and its own entry point (`fcfa-kit/cm`), built against the shared `CountryModule` contract in [`src/core/country.ts`](./src/core/country.ts).
- **No runtime dependency**, no `Intl` required, no global state.
- **Strict TypeScript**, ESM and CJS, types for both. Checked with [publint](https://publint.dev) and [Are the types wrong?](https://arethetypeswrong.github.io) in CI.

## Adding a country

See [docs/adding-a-country.md](./docs/adding-a-country.md).

## Roadmap

- [x] Currency core (XAF / XOF)
- [x] Cameroon module
- [ ] Demo page (Next.js)
- [ ] React package: `<PhoneInput />`, `<Amount />`, `useFCFA`
- [ ] More countries: CEMAC and UEMOA

## Development

```bash
npm install
npm test             # Vitest
npm run typecheck
npm run build        # tsup → dist/ (ESM + CJS + .d.ts)
npm run check:package
```

## License

[MIT](./LICENSE)
