# Audit diagnostique de complexité — SER1

**Date** : 2026-04-19
**Branche** : `claude/beautiful-villani-b2b592`
**Auteur** : audit automatisé (lecture seule, aucun refactor exécuté)
**Objectif** : chiffrer combien de lignes sont réellement réductibles, par quel levier, et avec quel risque — pour permettre un arbitrage go / no-go.

---

## 1. Synthèse

| Indicateur | Valeur |
|---|---|
| Fichiers `.ts`/`.tsx` dans `src/` | **483** |
| Lignes totales | **85 756** |
| Seul fichier > 800 lignes | `src/pptx/designSystem/serenity.ts` (1 032) |
| Fichiers `.js`/`.jsx` résiduels | **0** (migration `.tsx` complète) |
| Ratio `src/features/succession/` / total | **33 %** (28 569 l.) |

### Réductible estimé

| Scénario | Économie | % du repo | Risque | Effort |
|---|---|---|---|---|
| **Minimum réaliste** (fixtures tests + nettoyage doux) | **~500 l.** | 0,6 % | Bas | 1 PR |
| **Optimiste** (fixtures + legacy purgé + fusion hooks handlers) | **~1 500 l.** | 1,8 % | Moyen | 3–4 PRs |
| **Maximum théorique** (optimiste + split serenity + fusion fragmentations) | **~2 200 l.** | 2,6 % | Moyen à Haut | 5–6 PRs |

### Top 3 leviers par ROI

1. **Centraliser les makers de fixtures succession** — 14 copies de `makeCivil` dispersées, 250–400 l. économisées, risque Bas, 1 PR.
2. **Ajouter des tests à `audit/` et `credit/`** — 0 test actuellement sur ces features. **Ne réduit pas de lignes** mais réduit le risque métier (chantier inverse de la question initiale).
3. **Splitter `serenity.ts`** — 0 ligne économisée, mais seul fichier >800 l. du repo. Bénéfice lisibilité uniquement.

### Verdict

**Le repo n'est pas sur-ingéniéré.** Le poids vient de la complexité métier irréductible (règles fiscales françaises de la transmission, PPTX, catalogue produits), pas de dette technique. Un chantier de simplification ambitieux économiserait **< 2 %** du code pour un risque non nul sur des calculs fiscaux protégés par des golden values CI. **Recommandation : statu quo**, avec une seule exception — la centralisation des fixtures de tests succession (quick win, ROI clair).

---

## 2. Inventaire par axe

### Axe 1 — Code mort et legacy

**Commande** : `find src -type f \( -name "*legacy*" -o -name "*.old*" -o -name "*_backup*" -o -name "*deprecated*" \)`

| Fichier | Lignes | Encore référencé ? | Levier |
|---|---|---|---|
| `src/features/succession/successionDraft.legacy.ts` | 255 | **Oui** — importé par `successionDraft.parse.ts:34` | Non supprimable tel quel. Gère les schémas de draft v1–v26. |
| `src/features/succession/__tests__/successionDraft.legacy.test.ts` | 341 | Oui (couvre le fichier ci-dessus) | Lié au sort du legacy.ts |
| `src/features/per/styles/legacy.css` | 43 | **Oui** — importé par `src/features/per/styles/page.css:5` (`@import './legacy.css'`) | Non supprimable. |

**Constat** : aucun fichier réellement mort. Les trois fichiers `*legacy*` sont tous encore importés. Le nom "legacy" reflète une intention d'intention de migration, pas un code orphelin.

**Économie si toutes les anciennes versions de `successionDraft` sont purgeables** (décision produit, pas technique) : **~596 l.** (255 + 341). À évaluer : combien de drafts en BDD sont encore à version < 20 ?

**`npx ts-prune`** non exécuté (hors périmètre lecture seule strict) — à lancer si on veut un inventaire exhaustif des exports morts.

---

### Axe 2 — Tests succession (8 105 lignes, 40 % de la feature)

**Commandes** :
- `find src/features/succession/__tests__ -type f -exec wc -l {} + | tail -1` → **8 105 l.**
- `grep -rn "^(function|const)\s+makeCivil" src/features/succession` → **14 occurrences**

**Ratio tests/prod par feature** :

| Feature | Prod (l.) | Tests (l.) | % tests |
|---|---|---|---|
| audit | 1 246 | **0** | 0 % |
| credit | 3 460 | **0** | 0 % |
| ir | 2 496 | 102 | 4 % |
| per | 3 374 | 112 | 3 % |
| placement | 4 603 | 652 | 14 % |
| strategy | 872 | 367 | 42 % |
| **succession** | **20 464** | **8 105** | **40 %** |

Succession pèse **~6,6× plus de tests** que l'ensemble des autres features réunies (8 105 vs 1 233).

**Fixtures dupliquées inline** (même fonction, copiée dans N fichiers de tests) :

| Fonction | Nb. de déclarations dispersées | Fichiers concernés |
|---|---|---|
| `makeCivil` | **14** | `successionAvFiscal.test.ts`, `successionDeathInsuranceAllowances.test.ts`, `successionDevolution.test.ts`, `successionDisplay.test.ts`, `successionPatrimonial.test.ts`, `successionPerFiscal.test.ts`, `successionPredeces.test.ts`, `successionPrevoyanceFiscal.test.ts`, `successionRegimes.test.ts`, `successionValidationMatrix.test.ts`, 2 helpers, etc. |
| `makeDevolution` | 7 | `successionDevolution`, `successionDisplay`, `successionDraft.roundtrip`, `successionValidationMatrix`, 2 helpers, etc. |
| `makeLiquidation` | 6 | `successionDisplay`, `successionRegimes`, `successionValidationMatrix`, 2 helpers, etc. |

Deux helpers **déjà extraits mais non généralisés** : `successionBugRepro.helpers.ts` (100 l.) et `successionChainage.test.helpers.ts` (59 l.). Ils proposent chacun leur propre version des makers — donc il existe déjà **2 sources de vérité concurrentes** pour les fixtures, en plus des 14 copies inline.

**Estimation économie** (centralisation dans `src/features/succession/__tests__/fixtures.ts`) :
- makers stricts (hors overrides) : ~7–15 l. par copie × 27 copies = 180–400 l. brut
- Après factorisation des overrides : **250–400 l. économisées** (risque Bas)
- Effort : 1 PR, refactor mécanique

---

### Axe 3 — Fragmentations succession

**Commandes** : `wc -l src/features/succession/successionChainage*.ts src/features/succession/successionDraft*.ts src/features/succession/successionDisplay*.ts`

**Famille `successionChainage*`** — 5 fichiers, **1 662 l.**

| Fichier | Lignes | Rôle |
|---|---|---|
| `successionChainage.ts` | 480 | Cœur (analyse chaînée) |
| `successionChainage.helpers.ts` | 500 | Helpers de calcul |
| `successionChainage.heirs.ts` | 143 | Identification héritiers |
| `successionChainage.types.ts` | 161 | Types |
| `successionChainageEstateSplit.ts` | 378 | Partage patrimonial |

Graphe d'import : `chainage.ts` → `helpers`, `types`, `EstateSplit`. `helpers` → `heirs`, `types`. Pas de cycle. **Fragmentation légitime**.

**Famille `successionDraft*`** — 8 fichiers (dont 1 legacy), **1 884 l.**

| Fichier | Lignes | Rôle |
|---|---|---|
| `successionDraft.ts` | 91 | Barrel re-export |
| `successionDraft.types.ts` | 333 | Types |
| `successionDraft.defaults.ts` | 99 | Valeurs par défaut |
| `successionDraft.guards.ts` | 226 | Type guards |
| `successionDraft.parse.ts` | 315 | Parser principal |
| `successionDraft.parse.helpers.ts` | 478 | Helpers de parsing |
| `successionDraft.serialize.ts` | 87 | Sérialisation |
| `successionDraft.legacy.ts` | 255 | Migration anciennes versions |

Structure classique et propre (types / defaults / guards / parse / serialize / legacy). **Fragmentation légitime**.

**Famille `successionDisplay*`** — 2 fichiers, **641 l.** — pas fragmentée, le `successionDisplay.ts` est juste gros (550 l.).

**Levier** : fusion possible de `chainage.heirs.ts` (143 l.) dans `chainage.helpers.ts` (500 l.) → fichier unique de 643 l. Économie brute : ~20 l. d'imports/exports. **Faible ROI**.

**Économie totale axe 3** : **100–200 l.** (risque Moyen, sacrifie la lisibilité des sous-domaines).

---

### Axe 4 — Fichiers > 500 lignes hors succession

**Commande** : `find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} + | sort -rn | head -25`

| Fichier | L. | Nature | Réductible ? |
|---|---|---|---|
| `src/pptx/designSystem/serenity.ts` | **1 032** | Constantes PPTX + helpers géométriques, ~20 sections séparées par bandeaux `// ===` | **Splittable** (SLIDE_SIZE, LOGO, COORDS_COVER, COORDS_*, FONTS, COLORS, helpers). 0 ligne économisée, lisibilité ++ |
| `src/domain/base-contrat/catalog.ts` | 673 | Catalogue de produits patrimoniaux, pure data | **Non** (data métier irréductible) |
| `src/domain/base-contrat/rules/library/retraite.ts` | 631 | Règles fiscales PER, PEE, PERCOL, PERO, Art. 83/39, Madelin, PERP | **Non** (data métier formalisée) |
| `src/constants/settingsDefaults.ts` | 571 | Valeurs par défaut fiscales | **À NE PAS TOUCHER** — sensible, cache fiscal (cf. `MEMORY.md`) |
| `src/domain/base-contrat/__tests__/rules.test.ts` | 560 | Test du moteur de règles | Possiblement factorisable mais risque Moyen |
| `src/domain/base-contrat/rules/library/valeurs-mobilieres.ts` | 544 | Règles fiscales valeurs mobilières | **Non** (data métier) |
| `src/domain/base-contrat/rules/library/immobilier.ts` | 539 | Règles fiscales immobilier | **Non** (data métier) |
| `src/features/per/components/potentiel/PerPotentielSimulator.tsx` | 528 | Composant React PER potentiel | **Splittable** en sous-composants (UI form / display / hooks). 0 ligne économisée. |
| `src/engine/ir/tmiMetrics.ts` | 520 | Calculs TMI IR | **Non** (logique fiscale) — sauf dédup interne à chiffrer |
| `src/features/ir/components/IrSimulatorContainer.tsx` | 494 | Container IR | Limite acceptable |
| `src/pages/Settings.tsx` | 491 | Page settings | Limite acceptable |
| `src/pptx/slides/buildCreditSynthesis.ts` | 483 | Builder PPTX | Limite acceptable |
| `src/pptx/slides/buildPlacementDetail.ts` | 482 | Builder PPTX | Limite acceptable |

**Constat clé** : sur les 13 fichiers > 480 l. hors succession, **7 sont de la data métier** (catalogue, règles fiscales, constantes PPTX). Aucune ligne réductible sans amputer du contenu métier.

**Économie totale axe 4** : **0 à 100 l.** (déduplication interne ponctuelle dans `tmiMetrics` ou `rules.test`, spéculatif).

---

### Axe 5 — Doublons sémantiques et hooks similaires

**Hooks succession** : **14 hooks custom**, 3 653 lignes.

| Hook | Lignes | Rôle |
|---|---|---|
| `useSuccessionDerivedValues.ts` | 532 | Compose analyses métier (avFiscal, chainage, devolution, patrimonial, perFiscal, prevoyance, predeces) |
| `useSuccessionOutcomeDerivedValues.ts` | 516 | Transforme les analyses ci-dessus en vues d'affichage |
| `useSuccessionUiDerivedValues.ts` | 307 | Dérivations UI secondaires |
| `useSuccessionSyncEffects.ts` | 294 | Effets de synchronisation |
| `useSuccessionOutcomeDerivedValues.helpers.ts` | 278 | Helpers du précédent |
| `useSuccessionSimulatorHandlers.ts` | 271 | Handlers généraux |
| `useSuccessionAssetHandlers.ts` | 261 | Handlers actifs |
| `useSuccessionOutcomeExportPayload.ts` | 220 | Payload export |
| `useSuccessionCalc.ts` | 187 | Calculs |
| `useSuccessionDispositionsHandlers.ts` | 182 | Handlers dispositions |
| `useSuccessionFamilyHandlers.ts` | 172 | Handlers famille |
| `useSuccessionContractModalHandlers.ts` | 158 | Handlers modale contrat |
| `useSuccessionExportHandlers.ts` | 141 | Handlers export |
| `useSuccessionDerivedValues.helpers.ts` | 134 | Helpers du premier |

**Analyse** : les 2 plus gros (`Derived` + `OutcomeDerived`) ne sont **pas** des doublons — leurs responsabilités sont disjointes (calcul analyses vs transformation display). Ils partagent quelques types mais pas de logique.

**Les 7 hooks `Handlers`** (1 185 l. au total) sentent le **découpage forcé** pour contourner la règle "composant > 500 l. = dette". Fusion possible en 2–3 hooks (`useSuccessionSimulatorHandlers`, `useSuccessionExportHandlers`, `useSuccessionModalHandlers`).

**Économie estimée** : **150–250 l.** de boilerplate (imports, signatures, wrappers `useCallback` redondants) — risque Moyen car il faut re-valider le chaînage de dépendances React.

**Noms de fichiers dupliqués globaux** : 15× `index.ts`, 12× `types.ts`. Tous dans des dossiers distincts, pas de collision sémantique. **Rien à faire**.

---

### Axe 6 — Ratio code/valeur par feature (densité)

**Commandes** :
- Lignes : `find src/features/<feature> -type f \( -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} + | tail -1`
- Fichiers : `find src/features/<feature> -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l`
- Routes : lecture de `src/routes/appRoutes.ts`

| Feature | Fichiers | Lignes | Routes exposées | **Lignes/route** |
|---|---|---|---|---|
| audit | 12 | 1 246 | 1 (`/audit`) | 1 246 |
| strategy | 8 | 1 239 | 1 (`/strategy`) | 1 239 |
| placement | 32 | 5 255 | 1 (`/sim/placement`) | 5 255 |
| credit | 22 | 3 460 | 1 (`/sim/credit`) | 3 460 |
| ir | 19 | 2 598 | 1 (`/sim/ir`) | 2 598 |
| per | 21 | 3 486 | 4 (`/sim/per`, `/potentiel`, `/transfert`, `/ouverture`) | 872 |
| **succession** | **124** | **28 569** | **1** (`/sim/succession`) | **28 569** |

**Lecture** :
- La densité moyenne des 6 autres features pondérée par routes = **~1 920 l./route**
- Succession est à **28 569 l./route** — soit **~15× la moyenne**
- Succession concentre **26 % des fichiers du repo** (124 / 483) pour **une seule route**

**Est-ce pathologique ?** Non, mais c'est la marque du domaine le plus complexe du droit fiscal français patrimonial :
- Dévolution légale (régime matrimonial × présence conjoint × nb enfants × rattachement)
- Liquidation communauté (participation aux acquêts, société d'acquêts, préciput, clauses)
- Chaînage transmissions successives (époux1 → époux2)
- Assurance-vie (régimes 757-B et 990-I, allocations par bénéficiaire)
- PER décès, Prévoyance, Groupement foncier, Donations recall
- Testament (legs universel, particulier, clauses), usufruit, quasi-usufruit
- Inter-mass claims, dispositions civiles

Le domaine **est** massif. Le code l'est en proportion.

---

## 3. Tableau de chiffrage consolidé

| # | Cible | Chemin | L. actuelles | L. après | Économie | Levier | Risque | Dépendance CI |
|---|---|---|---|---|---|---|---|---|
| 1 | Centraliser makers fixtures succession | `src/features/succession/__tests__/*` | ~400 dispersées | ~50 centralisées | **250–400** | Factorisation | **Bas** | Tests Vitest |
| 2 | Purger `successionDraft.legacy.ts` + test | `successionDraft.legacy.ts`, `.test.ts` | 596 | 0 | **596** si 100 % des drafts prod sont ≥ v20 | Suppression | **Moyen** (dépend BDD) | `scripts/check-no-hardcoded-fiscal-values.mjs` |
| 3 | Fusion hooks `Handlers` succession | `hooks/useSuccession*Handlers.ts` (7 fichiers) | 1 185 | ~950 | **150–250** | Fusion | **Moyen** | Tests succession |
| 4 | Splitter `serenity.ts` en modules | `src/pptx/designSystem/serenity.ts` | 1 032 | 1 032 | **0** (lisibilité seule) | Split | Bas | Tests PPTX |
| 5 | Splitter `PerPotentielSimulator.tsx` | `src/features/per/components/potentiel/` | 528 | 528 | **0** (lisibilité seule) | Split | Bas | Test PER (112 l.) |
| 6 | Fusion `chainage.heirs.ts` → `chainage.helpers.ts` | `src/features/succession/successionChainage.*` | 643 | ~623 | **~20** | Fusion | Moyen | Tests chainage |
| 7 | Dédup interne `tmiMetrics.ts` | `src/engine/ir/tmiMetrics.ts` | 520 | ? | **0–50** | Spéculatif | **Haut** (golden values IR) | `scripts/check-no-hardcoded-fiscal-values.mjs` |

**Golden values à préserver impérativement** (extrait de `MEMORY.md`) :
- IR 80 000 €, 2,5 parts → 6 913 €
- Succession 600 000 € (conjoint + 2 enfants) → 16 388 €
- Interdiction : `17.2`, `100000`, `15932` en dur dans `src/engine` et `src/features`.

---

## 4. Ce qui n'est PAS dans le rapport (hors périmètre)

- Aucun refactor, suppression, ou déplacement effectué.
- Pas d'audit des dépendances (`package.json`, bundle size).
- Pas d'analyse performance runtime.
- Pas d'audit `npx ts-prune` exhaustif (estimation manuelle sur les symboles soupçonnés).
- Pas de refonte de la gouvernance docs (`AGENTS.md`, `CLAUDE.md`).

---

## 5. Recommandation finale

**Le repo n'est pas trop complexe pour ce qu'il fait.** Sur 85 756 lignes :
- ~53 % sont du code métier de simulateurs fiscaux (`src/features/`)
- ~12 % sont du code d'export PPTX
- ~9 % sont du moteur fiscal partagé
- ~27 % sont des composants transverses, hooks, utilities, pages, domain, reporting

Le seul "point chaud" — succession à 33 % du repo — reflète la complexité réelle du droit fiscal français de la transmission. Ce n'est pas de la dette.

**Recommandation graduée** :

1. **À FAIRE** (si le temps le permet) : centraliser les makers de fixtures succession. ROI clair, risque Bas, 1 PR, ~300 lignes économisées.
2. **À ENVISAGER** : ajouter des tests aux features `audit` et `credit` (0 test actuellement). Augmente le code, mais couvre un angle mort.
3. **À ÉTUDIER** : splitter `serenity.ts` (0 ligne économisée, pure lisibilité).
4. **À NE PAS FAIRE** :
   - Ne pas purger `successionDraft.legacy.ts` sans avoir vérifié les versions de drafts en BDD (risque silencieux de casser des dossiers clients).
   - Ne pas toucher aux règles fiscales `domain/base-contrat/rules/library/*`, `settingsDefaults.ts`, `engine/ir/tmiMetrics.ts` (golden values).
   - Ne pas fragmenter davantage les hooks handlers succession en quête d'un fichier plus petit — la complexité est déjà diluée.

**En une phrase** : le chantier de simplification économiserait **~500 à 1 500 lignes** (0,6–1,8 % du repo) pour un risque non nul ; la complexité perçue vient du volume de succession, qui reflète le domaine métier et non une mauvaise conception.

---

## Annexe — Commandes de reproductibilité

```bash
# Total lignes repo
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} + | tail -1

# Top 25 fichiers par taille
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec wc -l {} + | sort -rn | head -25

# Ratio tests/prod par feature
for d in src/features/*/; do
  feat=$(basename "$d")
  prod=$(find "$d" -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/__tests__/*" -exec wc -l {} + | tail -1 | awk '{print $1}')
  test=$(find "$d" -type f -path "*/__tests__/*" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
  echo "$feat: prod=$prod tests=${test:-0}"
done

# Fichiers legacy/old/backup
find src -type f \( -name "*legacy*" -o -name "*.old*" -o -name "*_backup*" -o -name "*deprecated*" \)

# Occurrences makers succession
grep -rn "^\(function\|const\|export function\|export const\)\s\+\(makeCivil\|makeDevolution\|makeLiquidation\)" src/features/succession

# Vérif import legacy
grep -rn "from ['\"].*successionDraft\.legacy['\"]" src/
grep -rn "legacy\.css" src/

# Hooks succession
wc -l src/features/succession/hooks/*.ts | sort -rn
```
