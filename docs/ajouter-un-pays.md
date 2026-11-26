# Ajouter un pays

> 🇬🇧 [English version](./adding-a-country.md)

Chaque pays est un dossier autonome `src/<iso2>/`, publié comme son propre point d'entrée `fcfa-kit/<iso2>`, qui implémente le contrat `CountryModule` de [`src/core/country.ts`](../src/core/country.ts). [`src/cm`](../src/cm) est l'implémentation de référence : copiez-la et adaptez.

Les applications n'embarquent que les pays qu'elles importent : un pays ne doit **jamais** être importé depuis `src/index.ts` ni depuis un autre pays.

## 0. Avant d'écrire du code

1. **Trouvez le plan de numérotation officiel** auprès du régulateur télécom national. Un blog ou un site d'« indicatifs pays » n'est pas une source. Notez le document, sa date et son URL : ils vont dans les commentaires de la table des préfixes et dans le README.
2. **Choisissez la zone.**
   - `XAF` (CEMAC) : Cameroun, République centrafricaine, Tchad, République du Congo, Guinée équatoriale, Gabon.
   - `XOF` (UEMOA) : Bénin, Burkina Faso, Côte d'Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, Togo.
3. **Notez la forme d'un numéro national** : sa longueur, l'existence d'un préfixe de ligne (un `0` initial à retirer) et le ou les premiers chiffres des numéros mobiles et fixes.

## 1. Créer le dossier

```
src/sn/                  # ISO 3166-1 alpha-2, en minuscules
  index.ts               # API publique + objet CountryModule
  operators.ts           # table des préfixes, avec sa source
  phone.ts
  geo.ts                 # optionnel : accesseurs typés sur les JSON ci-dessous
  data/                  # optionnel : regions.json, departments.json, ...
test/sn/
```

## 2. Table des opérateurs (`operators.ts`)

Une règle par préfixe : `{ prefix, operator, kind, official }`. Mettez `official: true` uniquement pour les préfixes présents dans le plan publié, et indiquez en commentaire les préfixes que vous avez choisi de **ne pas** inclure, avec la raison. Un mauvais opérateur est pire qu'un opérateur inconnu : pour un numéro valide dont le préfixe n'est pas listé, l'opérateur vaut `null`.

## 3. Numéros de téléphone (`phone.ts`)

`toNationalNumber(input)` est la seule fonction qui connaît la forme des numéros du pays ; tout le reste s'appuie dessus. Adaptez :

- l'indicatif et la longueur nationale,
- le préfixe de ligne éventuel (`0677…` doit se normaliser comme `677…`),
- les premiers chiffres acceptés.

Fournissez ensuite les fonctions du contrat `PhoneModule` : `normalize`, `isValid`, `getOperator`, `parse`, `format`, `mask`. Gardez le comportement du Cameroun :

- ne jamais lever d'exception sur une mauvaise entrée : renvoyer `null` / `false` ;
- `mask` est progressif et idempotent (`mask(mask(x)) === mask(x)`) ;
- regrouper les chiffres comme le régulateur les écrit.

## 4. Exporter le module (`index.ts`)

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

`satisfies` fait vérifier tout le contrat par le compilateur. Réexportez aussi les fonctions et types individuels, comme `src/cm/index.ts`.

## 5. Enregistrer le point d'entrée

`tsup.config.ts` découvre seul les nouveaux dossiers. `package.json` non : ajoutez

```jsonc
// "exports"
"./sn": {
  "import":  { "types": "./dist/sn.d.ts",  "default": "./dist/sn.js" },
  "require": { "types": "./dist/sn.d.cts", "default": "./dist/sn.cjs" }
},

// "typesVersions" → "*"
"sn": ["./dist/sn.d.ts"]
```

`test/package.test.ts` échoue avec un message qui nomme ce qui manque si vous l'oubliez.

## 6. Tests

Copiez `test/cm/phone.test.ts` et couvrez au minimum :

- toutes les notations acceptées d'un même numéro se normalisent vers la même chaîne E.164 ;
- les entrées invalides : mauvaise longueur, mauvais indicatif, lettres, chaîne vide, valeur qui n'est pas une chaîne ;
- un numéro par préfixe de la table → opérateur attendu ;
- un numéro valide dont le préfixe n'est pas listé → `operator: null` ;
- `mask` : vide, partiel, complet, trop long, collé avec l'indicatif, idempotence.

Si vous livrez des données de référence, reprenez les tests d'intégrité de `test/cm/geo.test.ts` (identifiants uniques, aucune référence orpheline, effectifs attendus).

## 7. Documentation

Ajoutez le pays aux tableaux des README (EN et FR) avec la source du plan de numérotation, et dites clairement ce que les données ne couvrent **pas**.

## Liste de contrôle

- [ ] Source du plan de numérotation citée dans `operators.ts` et dans les deux README
- [ ] Les indicateurs `official` sont honnêtes
- [ ] Rien n'est importé depuis `src/index.ts` ni depuis un autre pays
- [ ] `exports` et `typesVersions` mis à jour
- [ ] `npm test`, `npm run typecheck`, `npm run build` et `npm run check:package` passent
