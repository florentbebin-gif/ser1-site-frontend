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
| Masse patrimoniale | Le draft persiste maintenant `SuccessionAssetPocket`; le runtime detaille et la serialisation `v26` n'embarquent plus `owner` sur les actifs/GF | `src/features/succession/successionDraft.types.ts`, `src/features/succession/successionDraft.serialize.ts`, `src/features/succession/successionDraft.parse.ts` |
| Distinction personne / masse | Transition tres avancee: le draft detaille, les handlers, l'UI de selection et la base taxable utilisent `pocket`; seuls les agregats simplifies `epoux1/epoux2/commun` subsistent comme vue legacy | `src/features/succession/successionPatrimonialModel.ts`, `src/features/succession/useSuccessionAssetHandlers.ts`, `src/features/succession/useSuccessionUiDerivedValues.ts`, `src/features/succession/successionAssetValuation.ts`, `src/features/succession/successionTransmissionBasis.ts` |
| Qualification juridique des biens | Presente sur les actifs detailles (`legalNature`, `origin`, `meubleImmeubleLegal`) et relue au parse / serialize | `src/features/succession/successionDraft.types.ts`, `src/features/succession/successionDraft.parse.ts`, `src/features/succession/components/ScAssetsPassifsCard.tsx` |
| Passif affecte par masse | Les passifs detailles rattaches a une `pocket` sont maintenant resumes et restitues comme passif affecte dans la liquidation simplifiee, la synthese, la chronologie et les exports | `src/features/succession/successionAssetValuation.ts`, `src/features/succession/successionChainage.ts`, `src/features/succession/components/ScSuccessionSummaryPanel.tsx`, `src/features/succession/successionXlsx.ts` |
| Creances entre masses | Modele simplifie present (`SuccessionInterMassClaim`) avec transferts bornes entre poches et warnings explicites | `src/features/succession/successionDraft.types.ts`, `src/features/succession/successionInterMassClaims.ts`, `src/features/succession/successionChainage.ts` |

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
| `communaute_universelle` | Gere nativement, avec exclusion simplifiee des `propre_par_nature` si `stipulationContraireCU` est activee | Simplification documentee | Pas de liquidation notariale exhaustive ni de recompenses | `src/features/succession/successionChainage.ts`, `src/features/succession/successionAssetValuation.ts`, `src/features/succession/components/DispositionsModal.tsx` |
| `separation_biens` | Gere nativement; la saisie detaillee peut ajouter une poche manuelle `indivision_separatiste`, ventilee via `quotePartEpoux1Pct` | Support robuste | Liquidation notariale de l'indivision non exhaustive; pas de passif juridiquement affecte | `src/features/succession/successionPredeces.ts`, `src/features/succession/successionChainageEstateSplit.ts`, `src/features/succession/successionPatrimonialModel.ts`, `src/features/succession/successionAssetValuation.ts` |
| `participation_acquets` | Audit predeces encore approxime en separation de biens, mais le chainage succession sait maintenant calculer une creance simplifiee via un bloc dedie | Simplification documentee | Pas encore de liquidation notariale exhaustive ni de creance juridiquement fine | `src/features/succession/successionPredeces.ts`, `src/features/succession/successionParticipationAcquets.ts`, `src/features/succession/components/DispositionsModal.tsx`, `src/features/succession/__tests__/successionChainage.test.ts` |
| `communaute_meubles_acquets` | Audit predeces encore approxime en communaute legale, mais les actifs detailles sont maintenant requalifies meuble / immeuble avant chainage | Simplification documentee | Pas de qualification fine hors actifs detailles, ni de liquidation notariale exhaustive | `src/features/succession/successionPredeces.ts`, `src/features/succession/successionAssetValuation.ts`, `src/features/succession/components/ScAssetsPassifsCard.tsx` |
| `separation_biens_societe_acquets` | Audit predeces encore approxime en separation de biens, mais le chainage succession liquide maintenant la poche `societe_acquets` via un moteur dedie simplifie, une configuration contractuelle en UI et une restitution/export dedies | Simplification documentee | Pas encore de liquidation notariale exhaustive | `src/features/succession/successionPredeces.ts`, `src/features/succession/successionChainage.ts`, `src/features/succession/components/DispositionsModal.tsx`, `src/features/succession/components/ScDeathTimelinePanel.tsx`, `src/features/succession/successionXlsx.ts` |

## Couverture UI actuelle

| Surface | Etat repo actuel | Preuves |
|---|---|---|
| UI succession (`/sim/succession`) | Les 6 regimes sont selectionnables | `src/features/succession/components/ScFamilyContextCard.tsx` |
| UI audit | Les 6 regimes sont selectionnables | `src/features/audit/steps/StepCivil.tsx` |
| Champ "Masse de rattachement" actifs/passifs | Options alignees sur le regime courant; l'option partagee n'est plus proposee en separation de biens pure | `src/features/succession/useSuccessionUiDerivedValues.ts`, `src/features/succession/components/ScAssetsPassifsCard.tsx` |

## Matrice des grands sujets de liquidation

| Sujet | Statut actuel | Niveau |
|---|---|---|
| Predeces / chainage maries | Present | Support robuste |
| PACS avec succession directe | Present | Support robuste du perimetre actuel |
| PACS avec chainage 2 deces | Exclu par spec actuelle | Non modelise |
| Testament simple | Present | Support robuste du perimetre actuel |
| Donation entre epoux | Present avec replis | Simplification documentee |
| Preciput global en montant | Present | Support robuste du perimetre actuel |
| Preciput cible par bien | Selection UI, deduction moteur et restitution/export dedies presents sur `communaute` / `societe_acquets` | Simplification documentee |
| Assurance-vie 990 I / 757 B | Present mais encore a fiabiliser sur certains cas | Support robuste avec regressions identifiees |
| Representation petits-enfants | Presente mais incomplete fiscalement | Simplification documentee |
| Rappel fiscal donations | Partiellement analytique | Approximation assumee |
| GFA / GFV / GFF / GF | Present avec seuils LF 2025 integres | Support robuste du perimetre actuel |
| Recompenses / creances entre masses | Bloc de saisie, moteur simplifie, synthese, chronologie et exports presents | Simplification documentee |
| Participation aux acquets (creance) | Bloc de configuration et creance simplifiee presents dans le chainage succession | Simplification documentee |
| Propres par nature | Present sur les actifs detailles, avec effet simplifie en `communaute_universelle` si `stipulationContraireCU` est activee | Simplification documentee |
| Qualif. meuble / immeuble pour CMA | Presente sur les actifs detailles, avec fallback sur la categorie si la saisie explicite est absente | Simplification documentee |
| Passif juridiquement affecte | Restitution simplifiee a partir des passifs detailles rattaches a une masse | Simplification documentee |

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
Les `PR-15/16` alignent les helpers specialises et la sync d'etat sur `pocket`.
Les `PR-17/18` font ensuite basculer la base taxable / chainage vers `pocket` et remplacent en UI le select `Porteur` par `Masse de rattachement` avec options dependantes du regime.
La `PR-19` supprime ensuite `SuccessionAssetOwner` du runtime detaille: actifs et groupements fonciers sont desormais `pocket` only, et la serialisation passe ensuite par les versions courantes du draft, jusqu'a `v26` aujourd'hui.
La `PR-20` ouvre explicitement la poche `societe_acquets` quand le regime `separation_biens_societe_acquets` est selectionne.
Les `PR-21/22` ajoutent ensuite le bloc UI de configuration et la liquidation simplifiee de cette poche dans le chainage succession, tout en laissant l'audit predeces sur une approximation de separation de biens.
La `PR-23` etend ensuite cette liquidation aux warnings, a la synthese, a la chronologie et aux exports XLSX/PPTX.
La `PR-24` pose enfin le modele de draft du preciput cible (`preciputMode`, `preciputSelections`) sans encore activer sa selection UI ni son moteur dedie.
Les `PR-25/26` activent ensuite la selection UI par bien compatible dans la modal dispositions et la deduction ciblee dans le chainage, avec fallback sur `preciputMontant` si aucune selection valide n'est retenue.
La `PR-27` ajoute ensuite la restitution du preciput applique dans la synthese, la chronologie et les exports succession, avec mention explicite des biens preleves.
La `PR-28` introduit enfin le bloc `participationAcquets` dans le draft et la modal dispositions, puis applique une creance simplifiee de participation dans le chainage succession. L'audit predeces reste toutefois approxime en `separation_biens`.
Les `PR-29/30` introduisent ensuite la qualification juridique des actifs detailles (`legalNature`, `origin`, `meubleImmeubleLegal`), ajoutent `stipulationContraireCU` dans la modal dispositions et exploitent ces champs pour enrichir `communaute_universelle` et `communaute_meubles_acquets` en mode succession detaillee.
La `PR-31` ajoute ensuite le modele simplifie de `recompenses / creances entre masses`, ainsi que la restitution du `passif affecte` a partir des passifs detailles rattaches a une masse.
La `PR-32` aligne enfin la documentation metier et d'architecture sur cet etat final de la trajectoire, avec distinction explicite entre support robuste, simplification documentee et approximation assumee.
La `PR-33` boucle la validation finale avec export des hypotheses retenues par le simulateur dans l'UI, le PPTX et le XLSX, plus alignement documentaire de fin de trajectoire.

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
| Droits de mutation par deces | CGI art. 777 |
| Exoneration conjoint / partenaire PACS | CGI art. 796-0 bis |
| Representation successorale fiscale | CGI art. 779 |
| Rappel fiscal donations | CGI art. 784 |
| Assurance-vie primes apres 70 ans | CGI art. 757 B |
| Usufruit / nue-propriete | CGI art. 669 |
| GFA / GFV / GFF / GF | CGI art. 793 bis |

## Invariants pour les chantiers suivants
- aucune approximation ne doit etre masquee
- toute nouvelle capacite metier doit etre reliee a un niveau de maturite
- les produits d'assurance ne doivent jamais etre rattaches a une masse patrimoniale
- les docs `METIER.md` et `ARCHITECTURE.md` doivent rester alignees avec cette matrice

## Validation finale
- gate repo: `npm run check`
- tests succession critiques :
  - `src/features/succession/__tests__/successionAssetValuation.test.ts`
  - `src/features/succession/__tests__/successionChainage.test.ts`
  - `src/features/succession/__tests__/scSuccessionSummaryPanel.test.tsx`
  - `src/features/succession/__tests__/scDeathTimelinePanel.test.tsx`
  - `src/features/succession/__tests__/successionExport.test.ts`
  - `src/features/succession/__tests__/successionGoldenScenarios.test.ts`
  - `src/features/succession/__tests__/successionHorizonMatrix.test.ts`
- surfaces a verifier manuellement :
  - UI succession : `+ Dispositions`, ajout d'une recompense ou creance entre masses, verification de la synthese et de la chronologie
  - exports : slide/onglet `Hypotheses` dans le PPTX et le XLSX succession
- limites conservees :
  - les recompenses et creances entre masses restent une modelisation simplifiee par transferts entre poches
  - le passif affecte reste derive du rattachement `pocket` des passifs detailles
  - les hypotheses exportees explicitent ces simplifications sans transformer l'outil en liquidation notariale exhaustive
