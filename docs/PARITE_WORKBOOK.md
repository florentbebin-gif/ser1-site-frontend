# Parite Workbook — PER Potentiel

## Objet

Ce document enregistre la parite visee entre le classeur source PER 2025 et le moteur
`src/engine/per/` du repo.

Source d'analyse :
- workbook racine `SER1 - LAPLACE 2025.xlsm`
- plan de retro-analyse [`docs/PLAN_PER_POTENTIEL.md`](./PLAN_PER_POTENTIEL.md)
- cas automatises [`src/engine/per/__tests__/perPotentiel.test.ts`](../src/engine/per/__tests__/perPotentiel.test.ts)

Le classeur reste une source d'analyse et de verification. Il n'est jamais une dependance runtime.

## Regles de parite

- Parite stricte attendue sur les plafonds PER, reports N-1 a N-3, cases 2042 et logique de mutualisation.
- Tolerance maximale de `1 EUR` sur IR, CEHR ou marge TMI quand l'ecart provient uniquement des arrondis ou du remplacement assume de la logique IR Excel par le moteur IR du repo.
- Toute divergence durable doit etre documentee ici avant merge.

## Ecarts volontaires

- Calcul IR du foyer :
  le repo delegue a [`src/engine/ir/compute.ts`](../src/engine/ir/compute.ts) pour les parts, le quotient familial, la decote, la CEHR et la TMI. Le tableur est donc une source pedagogique, pas l'arbitre final de l'IR.
- Source de verite PASS :
  le runtime lit `public.pass_history` via [`src/utils/cache/fiscalSettingsCache.ts`](../src/utils/cache/fiscalSettingsCache.ts) puis [`src/hooks/useFiscalContext.ts`](../src/hooks/useFiscalContext.ts). [`src/constants/settingsDefaults.ts`](../src/constants/settingsDefaults.ts) ne sert que de fallback.
- Mutualisation conjoints :
  la simulation d'un versement n'utilise le plafond du conjoint que si `6QR` est actif. Ce point est force par regression test.

## Cas de reference

- Celibataire salarie, revenus `80 000 EUR`, mode `versement-n`, versement envisage `5 000 EUR` :
  attendu repo = TMI `30 %`, versement deductible `5 000 EUR`, economie IR `1 500 EUR`, cout net `3 500 EUR`, plafond restant `2 200 EUR`.
- Couple marie, revenus `80 000 EUR` + `30 000 EUR`, versement envisage `12 000 EUR` :
  sans mutualisation = deductible `7 200 EUR`, economie IR `2 160 EUR`, `6QR = Non`.
- Meme cas avec mutualisation :
  deductible `11 910 EUR`, economie IR `3 573 EUR`, `6QR = Oui`.

## Verification operative

- Lancer `npm test -- perPotentiel`.
- Lancer `npm run check`.
- En cas d'evolution du workbook, ajouter ou ajuster un cas automatise avant de modifier le moteur.
