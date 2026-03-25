# SUCCESSION MODEL MATURITY

## But
Documenter, pour le simulateur succession, ce qui est:
- robuste dans le perimetre actuel
- simplifie mais assume
- approximatif et signale
- non encore modelise

Ce document sert de source de verite pour la trajectoire de montee en gamme du module succession avant les refactors de schema et de moteur.

## Sources de verite
- droit positif
- `docs/METIER.md`
- `docs/ARCHITECTURE.md`
- code implemente dans `src/features/succession/` et `src/engine/`
- BIG uniquement comme point de comparaison secondaire

## Regle de lecture
- `Support robuste` : comportement exploitable dans le perimetre produit actuel, avec tests et restitution UI coherente, sans pretendre a une liquidation notariale exhaustive.
- `Simplification documentee` : comportement intentionnel du repo, connu et decrit dans la doc, mais juridiquement ou civilement incomplet.
- `Approximation assumee` : approximation explicite avec warning, utilisee faute de modele plus riche.
- `Non modelise` : sujet absent ou seulement couvert par une note/warning sans moteur fiable.

## Etat du modele actuel

### Personne, masse et qualification juridique

| Sujet | Etat repo actuel | Preuves |
|---|---|---|
| Personne physique | Type de transition explicite introduit (`SuccessionPersonParty`), runtime encore branche sur `epoux1` / `epoux2` | `src/features/succession/successionPatrimonialModel.ts`, `src/features/succession/successionDraft.types.ts` |
| Masse patrimoniale | Le draft persiste maintenant `SuccessionAssetPocket`; l'alias legacy `owner` reste synchronise tant que le moteur n'est pas migre | `src/features/succession/successionDraft.types.ts`, `src/features/succession/successionDraft.serialize.ts`, `src/features/succession/successionDraft.parse.ts` |
| Distinction personne / masse | En transition: le draft et les handlers d'actifs utilisent `pocket`, mais l'UI de selection et les calculs agreges restent encore branches sur `owner` | `src/features/succession/successionPatrimonialModel.ts`, `src/features/succession/useSuccessionAssetHandlers.ts`, `src/features/succession/useSuccessionUiDerivedValues.ts`, `src/features/succession/successionAssetValuation.ts` |
| Qualification juridique des biens | Absente (`propre`, `propre_par_nature`, `origin`, etc.) | absence de champs dans `src/features/succession/successionDraft.types.ts` |
| Passif affecte par masse | Partiel seulement: le draft porte `pocket`, mais la liquidation agregee reste lue via l'alias `owner` | `src/features/succession/successionDraft.types.ts`, `src/features/succession/successionAssetValuation.ts` |
| Creances entre masses | Non modelise | absence de types et de moteur dedie |

### Produits specialises

| Sujet | Etat repo actuel | Preuves |
|---|---|---|
| Assurance-vie | Typee via `SuccessionPersonParty`, sans dependance au futur enum de masse | `src/features/succession/successionDraft.types.ts`, `src/features/succession/successionDraft.parse.ts` |
| PER assurance | Type au seul assure via `SuccessionPersonParty` | `src/features/succession/successionDraft.types.ts`, `src/features/succession/successionDraft.parse.ts` |
| Prevoyance deces | Typee via `SuccessionPersonParty` cote draft, parse, UI et sync | `src/features/succession/successionDraft.types.ts`, `src/features/succession/successionDraft.parse.ts`, `src/features/succession/useSuccessionSyncEffects.ts` |
| Conversion depuis une ligne actif | Oui, via les handlers d'actifs | `src/features/succession/useSuccessionAssetHandlers.ts` |

## Maturite par regime matrimonial

| Regime | Etat moteur actuel | Statut de maturite | Limite principale | Preuves |
|---|---|---|---|---|
| `communaute_legale` | Gere nativement | Support robuste | Pas de recompenses, pas d'origine juridique des biens | `src/features/succession/successionPredeces.ts`, `src/features/succession/successionChainageEstateSplit.ts` |
| `communaute_universelle` | Gere nativement | Simplification documentee | Les propres par nature ne sont pas distingues | `src/features/succession/successionChainageEstateSplit.ts`, `docs/METIER.md` |
| `separation_biens` | Gere nativement | Support robuste | Pas d'indivisions fines ni de passif juridiquement affecte | `src/features/succession/successionPredeces.ts`, `src/features/succession/successionChainageEstateSplit.ts` |
| `participation_acquets` | Approxime en separation de biens | Approximation assumee | Creance de participation non modelisee | `src/features/succession/successionPredeces.ts`, `src/features/succession/__tests__/successionPredeces.test.ts` |
| `communaute_meubles_acquets` | Approxime en communaute legale | Approximation assumee | Distinction meuble / immeuble absente | `src/features/succession/successionPredeces.ts` |
| `separation_biens_societe_acquets` | Approxime en separation de biens avec warning explicite | Approximation assumee | Absence de poche patrimoniale dediee | `src/features/succession/successionPredeces.ts`, `src/features/succession/__tests__/successionRegimes.test.ts` |

## Couverture UI actuelle

| Surface | Etat repo actuel | Preuves |
|---|---|---|
| UI succession (`/sim/succession`) | Les 6 regimes sont selectionnables | `src/features/succession/components/ScFamilyContextCard.tsx` |
| UI audit | Les 6 regimes sont selectionnables | `src/features/audit/steps/StepCivil.tsx` |
| Champ "Porteur" actifs/passifs | Confusion entre masse commune et indivision sous separation de biens | `src/features/succession/useSuccessionUiDerivedValues.ts` |

## Matrice des grands sujets de liquidation

| Sujet | Statut actuel | Niveau |
|---|---|---|
| Predeces / chainage maries | Present | Support robuste |
| PACS avec succession directe | Present | Support robuste du perimetre actuel |
| PACS avec chainage 2 deces | Exclu par spec actuelle | Non modelise |
| Testament simple | Present | Support robuste du perimetre actuel |
| Donation entre epoux | Present avec replis | Simplification documentee |
| Preciput global en montant | Present | Support robuste du perimetre actuel |
| Preciput cible par bien | Absent | Non modelise |
| Assurance-vie 990 I / 757 B | Present mais encore a fiabiliser sur certains cas | Support robuste avec regressions identifiees |
| Representation petits-enfants | Presente mais incomplete fiscalement | Simplification documentee |
| Rappel fiscal donations | Partiellement analytique | Approximation assumee |
| GFA / GFV / GFF / GF | Present avec seuils LF 2025 integres | Support robuste du perimetre actuel |
| Recompenses / creances entre masses | Absent | Non modelise |
| Participation aux acquets (creance) | Absente | Non modelise |
| Propres par nature | Absent | Non modelise |
| Qualif. meuble / immeuble pour CMA | Absente | Non modelise |
| Passif juridiquement affecte | Absent | Non modelise |

## Cible d'architecture metier

### Trajectoire retenue
- separer explicitement la personne physique de la masse patrimoniale
- faire de la `societe_acquets` une masse patrimoniale de premier rang
- introduire une qualification juridique des actifs
- introduire les creances entre masses et le passif affecte
- traiter le preciput cible par bien comme une cible atteignable, distincte de la perfection notariale totale

### Cibles de types
- `SuccessionPersonParty`
- `SuccessionAssetPocket`
- `SuccessionMatrimonialRegimeConfig`
- `SuccessionAssetLegalQualification`
- `SuccessionInterMassClaim`
- `SuccessionParticipationClaim`
- `SuccessionSocieteAcquetsConfig`
- `SuccessionPreciputSelection`

Les deux premiers types cibles sont introduits des `PR-11` dans `src/features/succession/successionPatrimonialModel.ts`, sans branchement runtime a ce stade.
La `PR-12` decouple ensuite AV / PER / prevoyance du futur modele de masse en les branchant sur `SuccessionPersonParty`.
Les `PR-13/14` migrent ensuite le draft et les entrees detaillees vers `pocket`, avec maintien transitoire de l'alias `owner` pour le moteur existant.

## Sources juridiques de cadrage

| Concept | Source officielle |
|---|---|
| Liberte conventionnelle des epoux | Code civil art. 1387 |
| Modification du regime matrimonial | Code civil art. 1397 |
| Communaute legale | Code civil art. 1400 et s. |
| Propres / propres par nature | Code civil art. 1405 |
| Recompenses | Code civil art. 1437 |
| Communaute universelle | Code civil art. 1526 |
| Separation de biens | Code civil art. 1536 |
| Participation aux acquets | Code civil art. 1569 a 1581 |
| Representation successorale fiscale | CGI art. 779 |
| Rappel fiscal donations | CGI art. 784 |
| Usufruit / nue-propriete | CGI art. 669 |
| GFA / GFV / GFF / GF | CGI art. 793 bis |

## Invariants pour les chantiers suivants
- aucune approximation ne doit etre masquee
- toute nouvelle capacite metier doit etre reliee a un niveau de maturite
- les produits d'assurance ne doivent jamais etre rattaches a une masse patrimoniale
- les docs `METIER.md` et `ARCHITECTURE.md` doivent rester alignees avec cette matrice
