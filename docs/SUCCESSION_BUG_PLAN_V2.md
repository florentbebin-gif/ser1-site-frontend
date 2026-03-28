# Plan de mise a jour succession — bugs manuels du 28/03/2026 (V3-final)

## Resume

Le lot couvre 16 bugs, 2 evolutions fonctionnelles et 1 correction UX.
Quatre familles causales distinctes :

1. **Liquidation/carry-over masses communes** — bugs 1, 2, 9, 10
2. **Restitution UI/export + chainage PACS + testament** — bugs 3, 5, 11, 12, 15, 16 + UX fallback
3. **Coordination fiscale AV/PER/Prevoyance** — bugs 6, 7, 8, 13, 14 + evolution B
4. **Extension modele indivision** — evolution A

Plus un lot transverse (bug 4 — age DDV/art. 669).

L'execution commence par un Lot 0 (tests rouges) pour securiser le perimetre.
L'ordre recommande suit les dependances causales : le lot 1 corrige le moteur de masse, condition prealable aux lots 2 et 3.

---

## Constats structurants verifies dans le repo

| Constat | Preuve |
|---|---|
| Le chainage 2 deces est affiche seulement pour les maries | `useSuccessionOutcomeDerivedValues.ts:112-117` — `displayUsesChainage` filtre sur `isMarried` qui est `=== 'marie'` (defini dans `useSuccessionDerivedValues.ts:126`) |
| CU `computeFirstEstate` retourne 100% du patrimoine | `successionChainageEstateSplit.ts:185-189` — `return actifEpoux1 + actifEpoux2 + actifCommun` sans utiliser `attributionBiensCommunsPct` |
| CU + attribution integrale : `carryOverToStep2 = firstEstate` entier | `successionChainageEstateSplit.ts:223-229` — pas de soustraction de la part enfants |
| Le test "cumul legal + testament" encode le comportement bugge | `successionDisplay.test.ts:300-346` — attend `175000` = 75k legal + 100k testament (cumul au lieu de `max`) |
| L'art. 757-1 existe en devolution mais pas en chainage | `successionDevolution.ts:357-385` (parents presents) vs `successionChainage.ts:424-436` (conjoint seul) |
| `compute757BTax` delegue a `calculateSuccession` qui reapplique l'abattement DMTG plein | `successionDeathInsuranceAllowances.ts:52-62` |
| `applyCombined990I` ecrase le prorata NP avec l'abattement plein | `successionDeathInsuranceAllowances.ts:272` — `totalBase - snapshot.avDeces.primesApres1998.allowancePerBeneficiary` |
| `successionTransmissionBasis.ts` agregge par poche, pas par bien | `successionTransmissionBasis.ts:9-11` — `ordinaryTaxableAssetsParPocket: Record<SuccessionAssetPocket, number>` |
| Le bareme art. 669 est correct au helper pur | `successionUsufruit.ts:7-33` — `getUsufruitRateFromAge(71)` retourne bien 0.3 |
| Le risque est dans le parsing de date non-UTC | `successionUsufruit.ts:45` — `new Date(dateNaissance)` utilise `getFullYear/getMonth/getDate` locaux |
| Le preciput cible utilise bien la valeur reelle du bien | `successionPreciput.ts:180-183` — `amount: Math.min(candidate.maxAmount, ...)` |
| Le fichier `successionDevolutionSpouseValuation.ts` est un chemin parallele pour la DDV usufruit | `successionDevolutionSpouseValuation.ts:32-48` |
| Bug 14 : meme root cause que bug 6/13 — `compute757BTax` reinitialise l'abattement DMTG | `successionDeathInsuranceAllowances.ts:59-62` — `calculateSuccession()` alloue un abattement plein 100k par heritier, sans tenir compte de l'abattement deja consomme par la succession du meme defunt |
| Bug 15 : la colonne "Recoit (brut)" cumule step1+step2 dans `accumulateTransmissionRow` | `successionDisplay.ts:451` — `current.brut += beneficiary.brut` ; les champs `step1Brut`/`step2Brut` sont calcules (L456-460) mais pas rendus dans le composant UI |
| Bug 16 : `mergeInsuranceBeneficiaryLines` ecrase le `capitalTransmis` prevoyance (500k) par `capitauxAvant70` (= prime 20k) | `useSuccessionOutcomeDerivedValues.helpers.ts:46` — `capitalTransmis: line.capitauxAvant70` utilise le montant fiscal au lieu du capital economique ; le `capitalTransmis` calcule dans `successionPrevoyanceFiscal.ts:201` est ignore |

---

## Decisions produit retenues

- **PACS** : activer la chronologie 2 deces pour tous les PACS, avec warnings explicites quand il n'existe aucun droit automatique.
- **Tableau beneficiaire en chainage** : conserver une ligne par beneficiaire avec colonnes par etape.
- **Indivision separatiste** : poche opt-in manuelle par bien (pas via `getSuccessionSharedPocketForContext()`), persistance par `quotePartEpoux1Pct`.
- **Vocabulaire UI** : remplacer `fallback` par `Mode de repli`.
- **AV avant 13/10/1998** : montant exonere global soustrait avant ventilation 990 I / 757 B.
- **Bug 8 (seuil 31,25%)** : approche test-first — ecrire le test d'abord, corriger seulement si le test est rouge.
- **Sections assurance** : distinguer `capital transmis` (ce que le beneficiaire recoit) et `base fiscale` (ce qui est taxe).
- **Testament correctif** : `max(legale, testamentaire)` seulement pour `legs_universel` et `legs_titre_universel` au conjoint/partenaire ; les `legs_particuliers` restent cumulatifs.

---

## Changements d'API / types a introduire

### Draft version
- Bumper le draft en **v27** (version actuelle = v26, cf. `successionDraft.legacy.ts:24-51`)
- Propager les nouveaux champs dans : `defaults`, `guards`, `parse`, `serialize`, `legacy`, `sync`, `handlers`

### `successionPatrimonialModel.ts`
- Ajouter `'indivision_separatiste'` a `SuccessionAssetPocket`
- Propager dans `SuccessionEstatePocketScales`, `EMPTY_POCKET_SCALES`, `isSuccessionAssetPocket()`, `buildSuccessionAssetPocketOptions()`
- **NE PAS** propager dans `getSuccessionSharedPocketForContext()` (cette fonction retourne UNE poche par regime, or l'indivision est per-asset)

### `successionDraft.types.ts`
- Ajouter `quotePartEpoux1Pct?: number` sur `SuccessionAssetDetailEntry`
- Ajouter `quotePartEpoux1Pct?: number` sur `SuccessionGroupementFoncierEntry`
- Ajouter `versementsAvant13101998?: number` sur `SuccessionAssuranceVieEntry`

### `successionDraft.parse.ts` + `successionSimulator.helpers.ts`
- Parser les nouveaux champs (`quotePartEpoux1Pct`, `versementsAvant13101998`)
- Propager `versementsAvant13101998` dans `buildAssuranceVieFromAsset`

### `successionTransmissionBasis.ts`
- Etendre `SuccessionAssetTransmissionBasis` pour transporter le detail ordinaire par entree (necessaire pour l'indivision — chaque bien a une quote-part differente, incompatible avec l'agregat par poche actuel)

### `useSuccessionOutcomeDerivedValues.helpers.ts`
- Etendre `FiscalLine` avec :
  - `sourceKind: 'av' | 'per' | 'prevoyance'` — provenance du produit, conservee apres merge
  - `capitalEconomique: number` — capital reel transmis (distinct de l'assiette fiscale pour la prevoyance)
- Etendre `InsuranceBeneficiaryLine` avec `baseFiscale: number` et `sourceKind`
- Dans `mergeInsuranceBeneficiaryLines` : agreger separement `capitalEconomique` et `baseFiscale` par beneficiaire et par article, en propageant `sourceKind`

### `successionDeathInsuranceAllowances.ts`
- Ajouter sur les lignes fiscales :
  - un mode d'abattement 990 I explicite (`full | prorata_np`)
  - un booleen `recyclableToStep2` (usufruits AV demembres = non recyclables)
- `applyCombined990I` : accepter le ratio prorata par entree
- `applyCombined757B` : accepter un abattement residuel par beneficiaire

### `successionInsuranceInflows.ts`
- `sumSurvivingSpouseInflows` : filtrer sur `recyclableToStep2 !== false` pour exclure les usufruits demembres

### `successionChainage.heirs.ts`
- Exposer par beneficiaire : `{ lien, baseSuccessorale, abattementConsomme, abattementResiduel }`
- Structure `EstateAllowanceUsageByDeceased` produite par l'analyse directe ou chainee

### `successionChainage.ts`
- Ajouter au niveau des etapes :
  - `transfertsContractuelsSurvivant`
  - `masseHorsSuccessionRecue`
  - `carryOverToStep2` limite aux montants reellement acquis par le survivant

### `useSuccessionOutcomeDerivedValues.ts` — export payload
- Corriger `chainageExportPayload` (construit dans ce fichier, L340-395) pour separer `masseSuccessoraleTransmise` et `horsSuccessionTransmis`
- `useSuccessionExportHandlers.ts` est un simple consommateur (L21) — pas de modification necessaire cote payload

---

## Lot 0 — Filet de securite test-first

### Objectif
Ecrire les tests rouges AVANT toute implementation, pour securiser le perimetre et decider objectivement si certains bugs sont reproductibles.

### Implementation
- Ecrire les tests rouges pour : BUG 1, 2, 3, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, plus Evolutions A/B
- **Retourner** le test bugge du testament conjoint dans `successionDisplay.test.ts:300` — le test actuel attend `175000` (cumul), il doit attendre `max(legale, testamentaire)`
- Ajouter un test dedie "AV 2 000 000 / 1 enfant / avant 70 ans = 498 594 EUR" pour decider objectivement si le BUG 8 existe encore
- Chaque test rouge constitue la specification executable du fix attendu

### Fichiers principaux
- `successionChainage.test.ts` (bugs 1, 2, 3, 9, 12, 15)
- `successionDisplay.test.ts` (bugs 5, 11, 15)
- `successionDeathInsuranceAllowances.test.ts` (bugs 6, 7a, 13, 14)
- `successionAvFiscal.test.ts` (bug 8)
- `successionPrevoyanceFiscal.test.ts` (bug 16)
- `successionPreciput.test.ts` (bug 10)
- `successionTransmissionBasis.test.ts` (evolution A)

---

## Lot 1 — Recaler le moteur de liquidation des masses communes

**Couvre : BUG 1, BUG 2, BUG 9, BUG 10**

### Objectif
Separer proprement :
- la masse successorale du deces
- les attributions contractuelles au survivant
- le report reellement recu par le survivant pour le 2e deces

### Implementation

#### `successionChainageEstateSplit.ts` — split structure
Remplacer la logique actuelle par un split qui calcule separement :
- `ownDeceased` : propres du defunt
- `ownSurvivor` : propres du survivant
- `sharedBeforePreciput` : masse commune ou assimilee
- `preciputApplied` : preciput reel (valeur du bien pour le cible, montant global sinon)
- `sharedAfterPreciput` : masse commune apres preciput
- `sharedEstateContribution` : part successorale de la masse commune = `sharedAfterPreciput * (1 - attributionPct / 100)`
- `survivorSharedRetained` : part retenue par le survivant = `sharedAfterPreciput - sharedEstateContribution`
- `firstEstate` : `ownDeceased + sharedEstateContribution`
- `survivorBaseBeforeInheritance` : `ownSurvivor + survivorSharedRetained + preciputApplied`

En `communaute_universelle` sans stipulation contraire :
- `ownDeceased = 0`, `ownSurvivor = 0` (tout est commun en CU standard)
- `sharedBeforePreciput = actifEpoux1 + actifEpoux2 + actifCommun`
- `firstEstate = 0 + sharedAfterPreciput * (1 - attributionPct / 100)`
- Se reduit a `totalPatrimoine * (1 - attributionPct / 100)` seulement si aucun propre n'existe
- Au lieu de `actifEpoux1 + actifEpoux2 + actifCommun` en dur (code actuel, qui ignore `attributionPct`)

En `communaute_universelle` avec `stipulationContraireCU` :
- La requalification des poches se fait en amont via `successionLegalQualification.ts:83-89`
- `computeFirstEstate` adapte sa formule via `preserveQualifiedSeparatePocketsInUniversalCommunity` (L186) : `firstEstate = actifCommun + propresDefunt` (propres du survivant exclus)
- Les deux mecanismes (requalification amont + formule adaptee) sont necessaires et doivent etre preserves

Pour `attributionIntegrale` en CU :
- La part commune du defunt au 1er deces est 0 (toute la masse commune va au survivant)
- Seuls les propres du defunt restent dans la succession de l'etape 1
- `carryOverToStep2` = uniquement ce que le survivant a effectivement recu (pas `firstEstate` entier)

#### `successionChainage.ts` — step2 carry-over
- Deplacer la logique de preciput au niveau du split de masse partagee, pas au niveau du partage conjoint/enfants
- Supprimer la reinjection mecanique de `step1Split.preciputDeducted` dans L781 (`step2CarryOverAmount = step2InheritedCarryOverAmount + step1Split.preciputDeducted`)
- La masse du survivant doit deja decouler du split corrige : `survivorBaseBeforeInheritance + partHeritee`

#### Preciput cible (Bug 10)
- `resolveSuccessionPreciputApplication` utilise deja `candidate.maxAmount` (valeur reelle du bien) — **pas de bug a ce niveau** (`successionPreciput.ts:180-183`)
- Le bug est en aval : verifier que `requestedAmount` (somme des biens cibles) est bien consomme comme preciput dans le split, sans recalcul au pro-rata
- Conserver `successionPreciput.ts` quasi inchange

### Fichiers principaux
- `successionChainageEstateSplit.ts`
- `successionChainage.ts`
- `successionPreciput.ts` (verification, pas de modification attendue)

### Effets attendus
- **BUG 1** : le 2e deces CU attribution integrale n'integre plus les montants deja sortis vers les enfants au 1er deces
- **BUG 2** : la masse du 1er deces CU attribution 50% = `communs non attribues + propres du defunt`
- **BUG 9** : le preciput global est applique avant partage, puis se retrouve correctement dans la masse du survivant
- **BUG 10** : le preciput cible prend la valeur reelle du bien cible (verifier que l'aval ne recalcule pas)

---

## Lot 2 — Restitution 2 deces coherente, PACS, testament, parents

**Couvre : BUG 3, BUG 5, BUG 11, BUG 12, BUG 15, BUG 16 + UX fallback**

### Objectif
Faire correspondre la restitution UI/export a la realite moteur, activer le PACS, corriger le cumul testament, corriger les colonnes "Recoit (brut)" pour les enfants et la prevoyance.

### Implementation

#### BUG 3 — PACS : deverrouiller l'affichage/export du chainage
1. **`useSuccessionOutcomeDerivedValues.ts:112-117`** : remplacer `isMarried` par `isMarried || isPacsed` dans la condition `displayUsesChainage`
2. **NE PAS** etendre `buildLegalPartnerHeirs` aux pacses — le partenaire pacse n'a aucune vocation successorale legale (`successionDevolution.ts:387-390`). Sa part passe exclusivement par le testament, deja supporte nativement via `computeTestamentDistribution` et `testamentHeirs` dans `successionChainage.ts:448-465`
3. Le carry-over testamentaire vers le survivant pacse est deja gere (`successionChainage.ts:514-516`)
4. Conserver le warning "PACS: pas de vocation successorale legale automatique sans testament"

#### BUG 5 — Masse transmise et tableau beneficiaire
- `derivedMasseTransmise` dans `useSuccessionOutcomeDerivedValues.ts:203-208` : separer masse successorale et capitaux AV/PER/Prevoyance
- Creer un indicateur `derivedTransmissionEconomiqueTotale` si necessaire pour le donut
- Dans le tableau beneficiaire en chainage (`accumulateTransmissionRow` dans `successionDisplay.ts:437-462`) : exposer colonnes `Etape 1 brut / droits` et `Etape 2 brut / droits` (les donnees `step1Brut`, `step2Brut` existent deja dans le code — elles ne sont simplement pas rendues dans l'UI)

#### BUG 11 — Testament conjoint : max au lieu de cumul (seulement pour legs universels)
Dans `computeStepTransmission` (`successionChainage.ts:482-486`) :
```typescript
const detailedHeirs = mergeDetailedHeirs([
    ...legalPartnerHeirs,
    ...testamentHeirs,
    ...detailedDescendantHeirs,
]);
```
`mergeDetailedHeirs` (`successionChainage.heirs.ts:78-95`) additionne les `partSuccession` quand le meme beneficiaire apparait.

**Fix** : creer un helper partage direct/chainage. Pour `legs_universel` ou `legs_titre_universel` au conjoint/partenaire :
- `partConjoint = max(legalPartnerAmount, testamentDistributedToConjoint)`
- Ajuster `redistributableAmount` en consequence : residuel = masse - max(...)

Pour `legs_particulier` au conjoint : **le cumul reste correct** (les legs particuliers sont des biens specifiques qui s'ajoutent a la part legale).

**ATTENTION** : le test `successionDisplay.test.ts:300-346` encode le cumul pour un `legs_universel` — il devra etre retourne pour valider le `max()`.

Meme correction dans `buildSuccessionDirectDisplayAnalysis` (`successionDisplay.ts:523-527`).

#### BUG 12 — Parents art. 757-1 dans le chainage
- Etendre l'entree chainage pour recevoir `ascendantsSurvivantsBySide` (deja present dans `successionDevolution.ts:243-245`)
- Extraire un helper commun non-descendants a partir de `buildParentAndSiblingHeirs` (`successionDisplay.ts:268-305`) pour couvrir parents et fratrie dans le chainage
- Les parents doivent apparaitre avec lien `parent` et abattement correspondant (100 000 EUR en ligne directe)

#### BUG 15 — Colonne "Recoit (brut)" enfants : cumul step1+step2 trompeur
**Root cause** : `accumulateTransmissionRow` (`successionDisplay.ts:451`) additionne `current.brut += beneficiary.brut` a chaque etape. Pour sep. biens (Ep1=500k, 2 enfants, conjoint 1/4 PP), step1 brut/enfant = 187.5k, step2 brut/enfant = 62.5k (125k carry-over / 2). La colonne affiche 250k = somme des 2 etapes, ce que l'utilisateur interprete comme 500k / 2 (sans deduction de la part conjoint).

Les champs `step1Brut`/`step2Brut` sont deja calcules (`successionDisplay.ts:456-460`) mais pas rendus dans le composant UI.

**Fix** :
- Le fix Bug 5.2 (tableau avec colonnes par etape) resout ce bug automatiquement
- En complement, verifier que le brut cumule est bien label comme "Total 2 deces" et pas "Recoit (brut)" simple
- Lien direct avec evolution A : meme en direct display, verifier que `descendantsAmount = findLineAmount(devolution, 'Descendants')` retourne bien `masse - partConjoint` et non `masse` entiere

#### BUG 16 — Prevoyance deces : "Recoit (brut)" affiche la prime au lieu du capital
**Root cause** : `mergeInsuranceBeneficiaryLines` (`useSuccessionOutcomeDerivedValues.helpers.ts:43-55`) derive `capitalTransmis` depuis les montants fiscaux :
```
capitalTransmis: line.capitauxAvant70  // = prime (20k), pas capital (500k)
```
Le champ `capitalTransmis` correctement calcule dans `successionPrevoyanceFiscal.ts:201` (= capital economique reel) est ignore par le merge.

Pour l'AV classique, `capitauxAvant70` = capital transmis (car le capital deces EST le montant economique). Pour la prevoyance, c'est la prime (assiette fiscale), pas le capital.

**Probleme d'interface de donnees** : le merge actuel fusionne AV, PER et prevoyance dans un seul `allLines` (`useSuccessionOutcomeDerivedValues.helpers.ts:41`). Apres fusion, impossible de distinguer une ligne prevoyance d'une ligne AV/PER pour afficher une colonne "Base fiscale (prime)" conditionnelle.

**Fix** :
- Ajouter `sourceKind: 'av' | 'per' | 'prevoyance'` sur le type `FiscalLine` dans `useSuccessionOutcomeDerivedValues.helpers.ts:13-20`
- Ajouter `capitalEconomique: number` sur `FiscalLine` — renseigne depuis `line.capitalTransmis` (prevoyance) ou `line.capitauxAvant70 + line.capitauxApres70` (AV/PER)
- Dans `mergeInsuranceBeneficiaryLines`, propager `sourceKind` et utiliser `capitalEconomique` pour la colonne "Recoit (brut)" au lieu de `capitauxAvant70`/`capitauxApres70`
- Reporter `sourceKind` sur `InsuranceBeneficiaryLine` pour que le composant UI puisse afficher "Base fiscale (prime)" uniquement pour les lignes `prevoyance`

#### UX — Remplacer "fallback"
- **`DispositionsModal.tsx:331`** : `${title} de fallback (EUR)` → `${title} de repli (EUR)`
- **`DispositionsModal.tsx:342`** : `"...comme fallback si aucune..."` → `"...comme montant de repli si aucune..."`
- **`successionChainage.ts:658`** : `"...fallback sur le montant global."` → `"...repli sur le montant global."`
- **`ScSuccessionSummaryPanel.tsx:244`** : `"Fallback global active"` → `"Mode de repli global"`

### Fichiers principaux
- `useSuccessionOutcomeDerivedValues.ts`
- `useSuccessionOutcomeDerivedValues.helpers.ts`
- `successionChainage.ts`
- `successionDisplay.ts`
- `successionPrevoyanceFiscal.ts`
- `successionDevolution.ts` (reference, pas de modification)
- `ScDeathTimelinePanel.tsx`
- `ScSuccessionSummaryPanel.tsx`
- `DispositionsModal.tsx`

### Effets attendus
- **BUG 3** : chainage PACS visible des qu'il est calculable ; part du partenaire passe par le testament (pas de part legale fictive)
- **BUG 5.1** : masse transmise = succession seule
- **BUG 5.2** : tableau beneficiaire avec colonnes par etape
- **BUG 11** : `max(legale, testament)` au lieu du cumul
- **BUG 12** : parents dans les beneficiaires quand art. 757-1 s'applique
- **BUG 15** : brut par enfant = montant reel par etape, plus de cumulation trompeuse
- **BUG 16** : "Recoit (brut)" affiche le capital deces (500k), pas la prime (20k)

---

## Lot 3 — Coordination fiscale AV / PER / Prevoyance

**Couvre : BUG 6, BUG 7, BUG 8, BUG 13, BUG 14, EVOLUTION B**

### Objectif
Coordonner correctement :
- l'abattement art. 779 CGI entre succession et 757 B
- le prorata 990 I en demembrement
- l'exclusion des versements avant le 13/10/1998
- la non-reinjection au 2e deces de l'usufruit AV demembre

### Implementation

#### BUG 6 + BUG 13 + BUG 14 — Abattement 100k applique 2 fois (AV ET PER)
**Root cause** : `compute757BTax` (`successionDeathInsuranceAllowances.ts:52-62`) appelle `calculateSuccession()` qui re-applique l'abattement DMTG plein (100k) independamment de la succession.

**Scenario explicite Bug 14** : veuf(ve) 76 ans, 2 enfants, succession 500k (250k/enfant consomme abattement 100k en totalite). PER apres 70 ans = 200k. SER1 reinitialise l'abattement a 100k pour le PER 757B → droits = 0 au lieu de taxer la base 84 750 EUR/enfant ((200k - 30.5k) / 2) au bareme DMTG sans aucun abattement residuel.

**Fix** :
- Dans l'analyse succession directe/chainee, exposer une map par defunt et par beneficiaire : `{ lien, baseSuccessorale, abattementConsomme, abattementResiduel }`
- Faire accepter cette map par `applyCombined757B` dans `successionDeathInsuranceAllowances.ts`
- `compute757BTax` doit recevoir `abattementResiduel = max(0, 100000 - partSuccessorale)` au lieu du plein abattement
- Cette logique doit couvrir AV 757B **ET** PER 757B — les deux enveloppes sont traitees de maniere isolee aujourd'hui

#### BUG 7a — Prorata 990 I en demembrement
**Root cause** : `applyCombined990I` (`successionDeathInsuranceAllowances.ts:272`) utilise `allowancePerBeneficiary` plein au lieu du prorata NP, bien que `successionAvFiscal.ts:335` calcule `allowance990IRatio: tauxNuProp`.

**Fix** :
- Propager `allowance990IRatio` dans les `LineContribution` passees a `applyCombined990I`
- Dans `applyCombined990I` : `abattement = allowancePerBeneficiary * ratio` (au lieu du plein)

#### BUG 7b — Extinction usufruit AV non taxable (art. 1133 CGI)
- Dans `survivorEconomicInflows` (`successionChainage.ts:828-829`), exclure les lignes correspondant a un usufruit AV demembre
- Marquer ces lignes comme "consolidation exoneree (art. 1133 CGI)"
- Ajouter un champ `recyclable: boolean` sur les lignes AV pour distinguer les capitaux recyclables des usufruits non recyclables

#### BUG 8 — Seuil 700k sur brut vs net
**Approche test-first** :
1. Ecrire un test : AV 2 000 000 / 1 enfant / tout avant 70 ans → droits attendus = 498 594 EUR
2. Si le test est vert : classer comme non reproduit, verifier uniquement la restitution
3. Si le test est rouge : tracer le chemin complet pour identifier ou le seuil 700k est decale de 152.5k (le calcul mathematique montre que 481 438 = `852500 * 20% + 995000 * 31.25%`, soit un seuil a `700000 + 152500`)

#### EVOLUTION B — Versements AV avant 13/10/1998
- Ajouter `versementsAvant13101998?: number` dans `SuccessionAssuranceVieEntry` (type)
- Parser le champ dans `successionDraft.parse.ts` (draft v27)
- Propager dans `buildAssuranceVieFromAsset` (`successionSimulator.helpers.ts`)
- Ajouter le champ dans `AssuranceVieModal.tsx`
- Calcul fiscal :
  - `baseImposableGlobale = capitauxDeces - versementsAvant13101998`
  - `capitauxApres70Taxables = min(versementsApres70, baseImposableGlobale)`
  - Le solde va en 990 I
  - Si `versementsAvant13101998 + versementsApres70 > capitauxDeces` : cap automatique + warning explicite

#### Pipeline de coordination — refactorisation en 3 temps
Le pipeline actuel dans `useSuccessionDerivedValues.ts` calcule succession et assurances en parallele sans coordination des abattements. Refactoriser en :
1. **Succession brute** : calculer la succession (directe ou chainee) pour connaitre l'usage d'abattement par defunt/beneficiaire
2. **Coordination assurances** : passer la map `EstateAllowanceUsageByDeceased` aux calculs AV/PER/Prevoyance pour le residuel 757B et le prorata 990I
3. **Recalcul final** : reinjecter les inflows nets coordonnes (filtres par `recyclableToStep2`) dans le chainage step 2

### Fichiers principaux
- `successionDeathInsuranceAllowances.ts`
- `successionAvFiscal.ts`
- `successionPerFiscal.ts`
- `successionPrevoyanceFiscal.ts`
- `successionInsuranceInflows.ts`
- `successionChainage.ts` (exclusion usufruit du recyclage)
- `successionDraft.types.ts` (type AV)
- `successionDraft.parse.ts` (parser)
- `successionSimulator.helpers.ts` (builder)
- `AssuranceVieModal.tsx` (UI)

### Effets attendus
- **BUG 6 + BUG 13 + BUG 14** : plus de double usage de l'abattement 100 000 EUR — AV et PER coordonnes avec la succession du meme defunt
- **BUG 7a** : l'abattement 990 I demembre reste proratise apres coordination
- **BUG 7b** : extinction d'usufruit AV non reinjectee ni retaxee au 2e deces
- **BUG 8** : confirme ou corrige via test-first
- **EVOLUTION B** : versements AV avant 13/10/1998 exclus des bases 990 I et 757 B

---

## Lot 4 — Durcir les frontieres d'age DDV / art. 669

**Couvre : BUG 4**

### Objectif
Eliminer les erreurs de tranche liees aux dates et fuseaux horaires.

### Implementation
- Unifier les calculs d'age en UTC dans `successionUsufruit.ts` :
  - Parser `YYYY-MM-DD` avec `T00:00:00Z`
  - Comparer en `getUTCFullYear/getUTCMonth/getUTCDate`
- Faire converger les chemins DDV et AV/PER/Prevoyance sur ce helper unique
- Verifier que `referenceDate` est bien la date de deces simulee (pas `new Date()`)
- Ajouter des tests de frontiere exacts :
  - veille des 71 ans
  - jour des 71 ans
  - lendemain

### Fichiers principaux
- `successionUsufruit.ts` (helper)
- `successionDevolutionSpouseValuation.ts` (DDV directe)
- `successionChainageEstateSplit.ts` (DDV en chainage)
- `successionAvFiscal.ts` (AV demembree)

---

## Lot 5 — Ajouter l'indivision en regime separatiste

**Couvre : EVOLUTION A**

### Objectif
Permettre des biens detenus conjointement en separation de biens, avec quote-part reelle du defunt.

**Precision** : un test complementaire confirme que meme en rattachant un bien en totalite a Ep1 (sep. biens, immo 500k), la colonne "Recoit (brut)" des enfants est fausse (bug 15). Les deux corrections sont liees : le fix du bug 15 (colonnes par etape dans le tableau beneficiaire) est un prerequis pour que l'indivision affiche des montants corrects.

### Implementation

#### Prerequis structurel
`successionTransmissionBasis.ts` agregge par poche (`Record<SuccessionAssetPocket, number>`). L'indivision necessite une granularite par bien (chaque bien a une quote-part differente). Il faut :
- Etendre `SuccessionAssetTransmissionBasis` pour transporter le detail ordinaire par entree
- Conserver les agregats par poche uniquement pour les cartes de synthese

#### Types et modele
- Ajouter `'indivision_separatiste'` a `SuccessionAssetPocket` dans `successionPatrimonialModel.ts`
- Propager dans : `SuccessionEstatePocketScales`, `EMPTY_POCKET_SCALES`, `isSuccessionAssetPocket()`
- **NE PAS** propager dans `getSuccessionSharedPocketForContext()` — cette fonction retourne UNE poche par regime ; l'indivision est per-asset
- `buildSuccessionAssetPocketOptions()` doit l'ajouter manuellement pour `separation_biens`, `participation_acquets`, `separation_biens_societe_acquets`
- Ajouter `quotePartEpoux1Pct?: number` sur `SuccessionAssetDetailEntry` et `SuccessionGroupementFoncierEntry` (draft v27)

#### Ventilation des montants indivis
Dans `useSuccessionSyncEffects.ts` et `successionAssetValuation.ts` :
- Si poche = `indivision_separatiste`, ventiler les montants vers `actifEpoux1/actifEpoux2` ou les passifs correspondants selon `quotePartEpoux1Pct`
- Ne jamais les envoyer dans `actifCommun` (il n'y a pas de masse commune en regime separatiste)

#### Calcul d'assiette detaillee
Dans `successionTransmissionBasis.ts` :
- Si `order = epoux1` : part retenue = `quotePartEpoux1Pct / 100`
- Si `order = epoux2` : part retenue = `1 - quotePartEpoux1Pct / 100`
- Appliquer cette logique sur actifs ordinaires, passifs, residence principale, groupements fonciers

#### UI
- Si poche = `indivision_separatiste`, afficher champ `Quote-part Epoux 1 (%)`
- Helper texte : la quote-part du defunt est deduite automatiquement selon l'ordre des deces simule

#### Lien avec Bug 15
Traiter Evolution A et Bug 15 ensemble : l'indivision corrige l'assiette detaillee, et la restitution par etape (Lot 2) corrige le brut affiche aux enfants.

### Fichiers principaux
- `successionPatrimonialModel.ts`
- `successionDraft.types.ts`
- `successionDraft.parse.ts`
- `successionTransmissionBasis.ts`
- `successionAssetValuation.ts`
- `useSuccessionSyncEffects.ts`
- `ScAssetsPassifsCard.tsx`

---

## Lot 6 — Tests, docs, validation finale

### Tests a ecrire ou retourner

#### Moteur / unit tests

| Scenario | Valeur attendue | Fichier test cible |
|---|---|---|
| CU attribution integrale : communs 1.5M, propres defunt 200k, propres survivant 300k | step1 = propres defunt en succession, step2 = 1.85M | `successionChainage.test.ts` |
| CU attribution 50% : communs 1.5M, propres defunt 200k, propres survivant 300k (total 2M) | step1 masse = 950k (200k propres + 750k communs non attribues) | `successionChainage.test.ts` |
| PACS sans testament : chronologie 2 deces | step1 visible, partenaire sans droit auto | `successionChainage.test.ts` |
| PACS avec legs universel au partenaire | carryOverToStep2 > 0, step2 calcule | `successionChainage.test.ts` |
| DDV usufruit : age 70, 71, 72 | tauxUsufruit = 0.4, 0.3, 0.3 | `successionUsufruit.test.ts` |
| AV masse : masse etape 1 sans AV | step1.actifTransmis exclut capitaux AV | `successionChainage.test.ts` |
| AV 757B + succession : enfant ayant consomme 100k sur succession | base 757B entierement taxable (abattement residuel = 0) | `successionDeathInsuranceAllowances.test.ts` |
| PER 757B + succession : meme scenario residuel | meme resultat | `successionDeathInsuranceAllowances.test.ts` |
| AV demembree : prorata 990I conserve apres coordination | abattement = 152500 * tauxNP | `successionDeathInsuranceAllowances.test.ts` |
| AV demembree : extinction usufruit au 2e deces | aucune reinjection taxable | `successionChainage.test.ts` |
| AV grosse 2M / 1 enfant / avant 70 | droits = 498 594 EUR | `successionAvFiscal.test.ts` |
| Testament legs universel conjoint | part conjoint = max(1/4 legale, QD testamentaire) | `successionDisplay.test.ts` **RETOURNER test existant ligne 300** |
| Parents art. 757-1 : marie sans enfant, 1 parent puis 2 parents | parents dans les beneficiaires chaines | `successionChainage.test.ts` |
| Preciput global : communaute 1M, preciput 200k | step1 = 400k (part communautaire du defunt) | `successionChainage.test.ts` |
| Preciput cible : RP 600k + comptes 200k, preciput cible RP | valeur 600k utilisee | `successionPreciput.test.ts` |
| Indivision sep. biens : actif 600k, QP Ep1 50%, ordre epoux1 | assiette = 300k | `successionTransmissionBasis.test.ts` |
| PER 757B + succession explicite : veuf 76 ans, 2 enfants, succession 500k, PER apres 70 = 200k | succession droits = 28 194/enfant, PER 757B base = 84 750/enfant entierement taxable (abattement residuel = 0) | `successionDeathInsuranceAllowances.test.ts` |
| Sep. biens marie : Ep1 500k, 2 enfants, devolution legale | step1Brut/enfant = 187 500, step2Brut/enfant = 62 500, total brut = 250 000 (cumule labelle correctement) | `successionDisplay.test.ts` |
| Prevoyance deces : assure 56 ans, capital 500k, prime 20k, beneficiaire conjoint | "Recoit (brut)" = 500 000 (capital), base fiscale = 20 000 (prime), droits = 0 (conjoint exonere) | `successionPrevoyanceFiscal.test.ts` |

#### UI/component tests

| Composant | Verification |
|---|---|
| `ScDeathTimelinePanel.tsx` | masse successorale sans AV/PER/Prevoyance, affichage PACS 2 deces |
| `ScSuccessionSummaryPanel.tsx` | tableau beneficiaire avec colonnes par etape, wording "Mode de repli", colonne prevoyance "Base fiscale (prime)" distincte de "Recoit (brut)" |
| `AssuranceVieModal.tsx` | champ "Dont versements avant le 13/10/1998", validation coherence avec versements apres 70 |
| `ScAssetsPassifsCard.tsx` | option Indivision, champ quote-part conditionnel |

### Docs a mettre a jour
- `docs/METIER.md`
- `docs/ARCHITECTURE.md`
- `docs/SUCCESSION_MODEL_MATURITY.md`
- `docs/SUCCESSION_TEST_PLAN.md`
- Archiver/remplacer `docs/SUCCESSION_BUG_PLAN_V2.md` par la version definitive post-implementation

### Ajustements documentaires obligatoires
- PACS 2 deces n'est plus "non modelise" — chainage affichable, mais sans vocation legale automatique
- La communaute universelle ne doit plus etre documentee comme "masse toujours totale"
- Le test "fusionne la part legale du conjoint marie et le legs testamentaire" doit etre remplace par le comportement exclusif (`max`) pour les dispositions universelles
- La mention `fallback` doit disparaitre du wording patrimonial visible
- Documenter que les sections assurance distinguent desormais `capital transmis` (ce que le beneficiaire recoit) et `base fiscale` (ce qui est taxe)
- Documenter l'export : `masseSuccessoraleTransmise` et `horsSuccessionTransmis` sont separes

### Validation finale
- Executer `npm run check`
- Rejouer les 16 cas manuels du document source
- Exporter au moins 1 XLSX et 1 PPTX sur :
  - CU attribution integrale
  - PACS avec testament
  - AV 757B + succession
  - PER 757B + succession (scenario veuf 76 ans)
  - prevoyance deces (capital vs prime)
  - sep. biens marie avec conjoint 1/4 PP
  - preciput cible
  - indivision separation de biens

---

## Ordre d'execution recommande

| # | Lot | Contenu |
|---|---|---|
| 0 | Lot 0 | Filet de securite test-first (tests rouges pour tous les bugs + retournement test bug 11) |
| 1 | Lot 1 | Recaler le moteur de liquidation des masses communes (bugs 1, 2, 9, 10) |
| 2 | Lot 2 | Restitution coherente, PACS, testament, parents, prevoyance (bugs 3, 5, 11, 12, 15, 16 + UX) |
| 3 | Lot 3 | Coordination fiscale AV/PER/Prevoyance (bugs 6, 7, 8, 13, 14 + evolution B) |
| 4 | Lot 4 | Durcir les frontieres d'age DDV / art. 669 (bug 4) |
| 5 | Lot 5 | Indivision en regime separatiste (evolution A) |
| 6 | Lot 6 | Tests, docs, validation finale |

---

## Assumptions et defaults retenus

- Le draft passe en **v27** au premier ajout de champ persiste de ce chantier.
- `indivision_separatiste` est une poche manuelle par bien, pas une masse implicite du regime. Ne pas propager dans `getSuccessionSharedPocketForContext()`.
- Le chainage PACS devient visible des qu'il est calculable, avec warnings explicites quand il n'existe aucun droit automatique.
- En mode chainage, le tableau beneficiaire garde une ligne par beneficiaire et expose les montants/droits par etape ; plus de brut agrege ambigu.
- Le correctif testamentaire (Bug 11) ne s'applique qu'aux dispositions `legs_universel` ou `legs_titre_universel` au conjoint/partenaire ; les `legs_particuliers` restent cumulatifs.
- Les sections assurance affichent toujours le capital economique transmis ; la base fiscale est une information distincte (`baseFiscale`).
- Pour l'indivision separatiste, la donnee persistee sera `quotePartEpoux1Pct`, car c'est la seule representation stable quand on inverse l'ordre des deces.
- Le champ AV "avant le 13/10/1998" sera un montant exonere global, soustrait avant la ventilation 990 I / 757 B.
- Le seuil 31,25% de 990 I (Bug 8) reste en mode test-first : correction moteur seulement si le test rouge le prouve.
- Les wording visibles utilisateur n'emploieront plus `fallback` dans le module succession.
