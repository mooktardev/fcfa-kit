# fcfa-kit

[![CI](https://github.com/mooktardev/fcfa-kit/actions/workflows/ci.yml/badge.svg)](https://github.com/mooktardev/fcfa-kit/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/fcfa-kit)](https://www.npmjs.com/package/fcfa-kit)
[![licence](https://img.shields.io/npm/l/fcfa-kit)](./LICENSE)

> 🇬🇧 [Read in English](./README.md)

Boîte à outils TypeScript **sans aucune dépendance** pour la **zone franc CFA** (XAF et XOF).

- **Cœur monétaire** : formatage (`1 500 000 FCFA`), parsing (`"1,5M"`, `"250k"`), montant en lettres, sans décimales.
- **Modules par pays**, importés séparément pour n'embarquer que ce que vous utilisez. Le Cameroun (`fcfa-kit/cm`) est le premier : numéros de téléphone (normalisation, validation, détection de l'opérateur, masque de saisie) et données de référence administratives.
- Build ESM + CJS, types fournis, compatible tree-shaking, **aucune dépendance à l'exécution**.

```bash
npm install fcfa-kit
```

## Démarrage rapide

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
maskPhone('67712');                    // "6 77 12"   (pendant la saisie)
```

## Cœur monétaire

### `formatFCFA(montant, options?)`

| Option | Défaut | Description |
| --- | --- | --- |
| `zone` | `"XAF"` | `"XAF"` ou `"XOF"`. Détermine le code ISO affiché avec `display: "code"`. |
| `display` | `"symbol"` | `"symbol"` → `FCFA`, `"code"` → `XAF` / `XOF`, `"none"` → nombre seul. |
| `symbol` | `"FCFA"` | Symbole utilisé quand `display` vaut `"symbol"`. |
| `rounding` | `"round"` | `"round"` (demi à l'écart de zéro), `"floor"`, `"ceil"`, `"trunc"`. |
| `groupSeparator` | espace insécable | Entre les groupes de chiffres. |
| `symbolSeparator` | espace insécable | Entre le nombre et le symbole. |

```ts
formatFCFA(2500, { zone: 'XOF', display: 'code' }); // "2 500 XOF"
formatFCFA(1500.5);                                  // "1 501 FCFA"
formatFCFA(-2500, { display: 'none' });              // "-2 500"
```

Le franc CFA n'a pas de subdivision : la sortie n'a donc jamais de décimales. Les séparateurs sont des **espaces insécables**, pour qu'un montant ne soit jamais coupé en fin de ligne ; passez `groupSeparator: ' '` si vous voulez des espaces ordinaires.

La fonction lève une `TypeError` pour une valeur non finie et une `RangeError` au-delà de `Number.MAX_SAFE_INTEGER`.

### `parseFCFA(texte, options?)` → `number | null`

Renvoie `null` si le texte n'est pas un montant ; ne lève jamais d'exception.

| Entrée | Résultat |
| --- | --- |
| `"1,5M"`, `"1.5M"`, `"1,5 millions"` | `1500000` |
| `"250k"`, `"250 K"` | `250000` |
| `"3 milliards"`, `"1,2 Md"` | `3000000000`, `1200000000` |
| `"1 500 000 FCFA"`, `"1.500.000"`, `"1,500,000"` | `1500000` |
| `"XAF 5000"`, `"5000 francs"` | `5000` |
| `"-250k"` | `-250000` |
| `"abc"`, `"1,2,3"` | `null` |

Lecture d'une virgule ou d'un point isolé :

- **avec un suffixe** (`"1,5M"`) : séparateur décimal ;
- **sans suffixe**, exactement trois chiffres après une courte tête non nulle (`"1,500"`, `"12.345"`) : séparateur de milliers ;
- **sinon** (`"1,5"`) : séparateur décimal, puis arrondi.

La mise à l'échelle se fait sur la chaîne décimale et non en virgule flottante : `"1,1M"` vaut exactement `1100000`. Options : `rounding`, et `strict: true` pour renvoyer `null` au lieu d'arrondir un résultat non entier.

### `amountInWords(montant, options?)` et `numberToWords(n)`

Français uniquement pour l'instant, orthographe traditionnelle (`vingt et un`, `quatre-vingts`, `deux cent mille`).

```ts
amountInWords(1);          // "un franc CFA"
amountInWords(2_000_000);  // "deux millions de francs CFA"
amountInWords(80_000);     // "quatre-vingt mille francs CFA"
amountInWords(1500, { unit: false, capitalize: true }); // "Mille cinq cents"
numberToWords(71);         // "soixante et onze"
```

### Autres utilitaires

- `createFCFA(defaults)` : fixe les options une fois pour toutes (`createFCFA({ zone: 'XOF' }).format(2500)`).
- `applyMask(input, pattern)` : masque de saisie progressif, `9` désigne un chiffre.
- `ZONES`, `isZone` : métadonnées des zones (banque centrale, union monétaire).

## Cameroun (`fcfa-kit/cm`)

### Numéros de téléphone

Le Cameroun utilise un plan fermé à 9 chiffres, sans préfixe de ligne : `6XXXXXXXX` pour le mobile, `2XXXXXXXX` pour le fixe.

| Fonction | Description |
| --- | --- |
| `normalizePhone(input)` | → `"+237677123456"` ou `null`. Accepte `677123456`, `6 77 12 34 56`, `+237 …`, `00237…`, `(+237) 677-12-34-56`, `237…`. |
| `isValidPhone(input, { kind?, strict? })` | Validation structurelle. `strict` exige en plus un préfixe d'opérateur connu. |
| `getPhoneOperator(input, { officialOnly? })` | `"MTN" \| "ORANGE" \| "NEXTTEL" \| "CAMTEL" \| null`. |
| `parsePhone(input)` | `{ e164, national, international, kind, operator }` ou `null`. |
| `formatPhone(input, style?)` | `"international"` (défaut), `"national"`, `"e164"`. |
| `maskPhone(input, { countryCode? })` | Mise en forme progressive d'une saisie partielle. |

Préfixes des opérateurs (premiers chiffres du numéro à 9 chiffres) :

| Préfixe | Opérateur | Type | Source |
| --- | --- | --- | --- |
| `650`–`654` | MTN | mobile | ART 2014 |
| `655`–`659` | Orange | mobile | ART 2014 |
| `66` | Nexttel | mobile | ART 2014 |
| `67` | MTN | mobile | ART 2014 |
| `69` | Orange | mobile | ART 2014 |
| `68` | MTN | mobile | utilisé, **absent** de la publication 2014 |
| `222`, `233` | Camtel | fixe (géographique) | ART 2014 |
| `242`, `243` | Camtel | fixe (CDMA) | ART 2014 |

Source : Agence de Régulation des Télécommunications (ART), plan national de numérotation en vigueur depuis le 21 novembre 2014, tel que publié par l'UIT (communication du 6.X.2014).

À savoir :

- Un préfixe indique à qui la tranche a été **attribuée**, pas forcément quel opérateur dessert le numéro aujourd'hui. La portabilité des numéros n'est pas modélisée.
- Les préfixes `62x` et `64x` sont cités sur des sites non officiels mais ne figurent pas dans la publication de l'ART : ils ne sont **pas** dans la table. Un tel numéro est structurellement valide et renvoie `operator: null`. Les contributions accompagnées d'une source officielle sont les bienvenues.
- `68x` figure dans la table avec `official: false` ; utilisez `{ officialOnly: true }` pour l'ignorer.

### Données de référence

```ts
import { regions, departments, cities, findCities, getRegion, getDepartmentsByRegion } from 'fcfa-kit/cm';

regions.length;                      // 10
departments.length;                  // 58
findCities('douala')[0];             // { id: 'douala', name: 'Douala', departmentId: 'wouri', regionCode: 'LT', … }
getRegion('Far North')?.name;        // "Extrême-Nord"
getDepartmentsByRegion('CE').length; // 10
```

Les 10 régions (codes ISO 3166-2), les 58 départements avec leurs chefs-lieux, et 63 villes : tous les chefs-lieux de département plus quelques autres grandes villes. La liste de villes n'est **pas** un répertoire exhaustif des localités. Les recherches ignorent accents et casse. Les JSON bruts sont dans [`src/cm/data`](./src/cm/data).

## Choix de conception

- **Modulaire par pays.** Chaque pays est un dossier de `src/` et son propre point d'entrée (`fcfa-kit/cm`), construit sur le contrat `CountryModule` partagé ([`src/core/country.ts`](./src/core/country.ts)).
- **Aucune dépendance à l'exécution**, pas besoin d'`Intl`, aucun état global.
- **TypeScript strict**, ESM et CJS, types pour les deux. Vérifié avec [publint](https://publint.dev) et [Are the types wrong?](https://arethetypeswrong.github.io) dans la CI.

## Ajouter un pays

Voir [docs/ajouter-un-pays.md](./docs/ajouter-un-pays.md).

## Feuille de route

- [x] Cœur monétaire (XAF / XOF)
- [x] Module Cameroun
- [ ] Page de démo (Next.js)
- [ ] Paquet React : `<PhoneInput />`, `<Amount />`, `useFCFA`
- [ ] Autres pays : CEMAC et UEMOA

## Développement

```bash
npm install
npm test             # Vitest
npm run typecheck
npm run build        # tsup → dist/ (ESM + CJS + .d.ts)
npm run check:package
```

## Licence

[MIT](./LICENSE)
