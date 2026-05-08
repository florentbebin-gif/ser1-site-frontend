# Audit Base-Contrat et DMTG Succession

Date : 2026-05-08.

## Résumé

Base-Contrat n'est pas une source moteur aujourd'hui : `rg "getRules|base-contrat" src/engine` retourne 0 match.
DMTG Succession, lui, est bien branché sur la chaîne fiscale standard et alimente le simulateur succession via `useFiscalContext`.
Base-Contrat est conservable comme référentiel éditorial, mais non prêt comme source de vérité moteur ou exports sans contrat typé, sources visibles et gouvernance de revue.
Les métriques générées donnent 199 `RuleBlock`, 166 sourcés, 52 en confiance moyenne/faible, 0 phase exposée vide.
Décision recommandée : garder et renforcer le référentiel éditorial, puis décider explicitement d'une promotion moteur si le produit le justifie.

## Verrou stratégique

La question à trancher n'est pas seulement "ces bases sont-elles fiables ?", mais :

**Veut-on promouvoir Base-Contrat au rang de source pour les simulateurs et exports, ou la garder comme référentiel éditorial autonome ?**

Réponse senior actuelle : **référentiel éditorial autonome**.

Réponse patrimoniale/notariale actuelle : **utile à conserver**, à condition d'afficher sources, niveau de confiance, limites et statut de revue. Une suppression ferait perdre un inventaire patrimonial exploitable. Une promotion moteur serait prématurée.

## Métriques

Métriques reproductibles :

```powershell
npm run audit:base-contrat-dmtg
npm run audit:base-contrat-dmtg -- --json
npm run audit:base-contrat-dmtg -- --out docs/audit-base-contrat-dmtg-succession.generated.md
npm run audit:base-contrat-dmtg -- --out-veille docs/veille-base-contrat.md
```

Annexe complète générée : [audit-base-contrat-dmtg-succession.generated.md](audit-base-contrat-dmtg-succession.generated.md). Choix retenu : l'annexe est versionnée comme snapshot daté de cet audit, car elle porte le tableau complet par produit/régime demandé. Elle reste régénérable par la commande ci-dessus.

Livrable de veille : `docs/veille-base-contrat.md` est générable à la demande et ignoré Git. Il liste les blocs par famille avec leurs sources et les colonnes de rapprochement `base_contrat_overrides.review_status` / `next_review_at`.

| Indicateur | Valeur | Lecture |
|---|---:|---|
| Produits catalogue | 111 | Périmètre large, multi-familles |
| Couples produit/audience exposés | 111 | PP/PM selon éligibilité catalogue |
| RuleBlock déclarés | 199 | Base exhaustive côté librairies |
| RuleBlock avec sources | 166, soit 83,4 % | Les familles prioritaires dépassent l'objectif de 80 % |
| RuleBlock moyenne/faible | 52 | Dette de validation assumée |
| Blocs exposés par produit/audience | 352 | Les blocs mutualisés sont réutilisés |
| Blocs exposés sourcés | 249, soit 70,7 % | La couverture source réelle UI progresse, les blocs mutualisés restent visibles par audience |
| Conformité moyenne/faible | 71/71, soit 100 % | Invariant métier respecté à l'exposition |
| Phases exposées vides | 0 | Aucun bloc "Aucune règle renseignée" en PP/PM exposé |
| Consommateurs `src/engine` | 0 | Pas de source moteur |
| Verdict produit/audience | 0 source moteur, 111 éditoriaux, 0 non prêt | Promotion moteur impossible en l'état, mais le référentiel éditorial est assaini |

### Méthode de scoring

Le score patrimonial/notarial part de 5 et retire 1 point si moins de 50 % des blocs sont sourcés, 1 point si plus de 35 % des blocs sont en confiance moyenne/faible, 1 point si une phase est vide, et 1 point si aucune source officielle n'est présente.

Le score dev senior part de 5 et retire 1 point si la couverture source est inférieure à 100 %, 1 point supplémentaire si elle est inférieure à 75 %, 1 point si au moins un bloc est en confiance moyenne/faible, 1 point si une phase est vide, et 1 point si aucune source officielle n'est présente. Comme `src/engine` ne consomme pas Base-Contrat, le score moteur est plafonné à 2/5 pour tous les couples produit/audience : une base non branchée ne peut pas être jugée prête source de vérité moteur.

Le verdict devient `source moteur` uniquement si un consommateur moteur existe, que le score dev senior atteint 4/5, que la couverture source est complète, qu'aucun bloc moyenne/faible n'est exposé et qu'aucune phase n'est vide. Sinon, un bloc complet mais explicatif reste `éditorial`; les cas avec dette forte de source/confiance passent `non prêt`.

### Bibliothèques

| Fichier | Blocs | Sources | Moyenne/faible | Dependencies | Montants/taux bruts |
|---|---:|---:|---:|---:|---:|
| assurance-epargne.ts | 14 | 14 | 3 | 3 | 0 |
| autres.ts | 13 | 13 | 3 | 3 | 0 |
| epargne-bancaire.ts | 26 | 18 | 1 | 1 | 0 |
| fiscaux-immobilier.ts | 15 | 12 | 2 | 2 | 0 |
| immobilier.ts | 34 | 21 | 10 | 11 | 0 |
| prevoyance.ts | 22 | 22 | 5 | 5 | 0 |
| retraite.ts | 42 | 42 | 24 | 24 | 0 |
| valeurs-mobilieres.ts | 33 | 24 | 4 | 4 | 0 |

### Familles exposées

| Famille | Couples produit/audience | Blocs | Sources | Moyenne/faible | Phases vides |
|---|---:|---:|---:|---:|---:|
| Assurance prévoyance | 7 | 22 | 22 | 5 | 0 |
| Autres | 6 | 19 | 19 | 3 | 0 |
| Créances/Droits | 5 | 15 | 6 | 3 | 0 |
| Dispositifs fiscaux immobilier | 10 | 30 | 22 | 2 | 0 |
| Épargne Assurance | 3 | 14 | 14 | 3 | 0 |
| Épargne bancaire | 17 | 55 | 37 | 1 | 0 |
| Immobilier direct | 10 | 30 | 21 | 4 | 0 |
| Immobilier indirect | 6 | 18 | 8 | 10 | 0 |
| Non coté/PE | 10 | 30 | 13 | 0 | 0 |
| Retraite & épargne salariale | 19 | 65 | 65 | 36 | 0 |
| Valeurs mobilières | 18 | 54 | 22 | 4 | 0 |

## Findings

1. `src/engine` : preuve `rg "getRules|base-contrat" src/engine` sans match. Impact : Base-Contrat n'alimente aucun calcul moteur. Recommandation minimale : ne pas la qualifier de source de vérité moteur avant un contrat typé, des tests de non-régression et un branchement explicite.

2. `src/features/placement/components/PlacementLiquidationSection.tsx:188` : lien `<a href="/settings/base-contrat">...`. Impact : le simulateur Placement renvoie vers une aide documentaire, pas vers une règle de calcul. Recommandation minimale : conserver comme lien d'information, ou remplacer par une API si la stratégie devient "source moteur".

3. `src/pages/settings/BaseContrat.tsx:364` : `const rules = getRules(product.id, togglePPPM);`. Impact : seul l'écran settings consomme les règles. Recommandation minimale : formaliser que `/settings/base-contrat` est le consommateur propriétaire tant qu'aucun simulateur/export ne dépend de `getRules`.

4. `src/domain/base-contrat/rules/types.ts:8` et `src/pages/settings/BaseContrat.tsx:81` : les champs `confidence`, `sources`, `dependencies` sont affichés en UI admin. Impact : la veille juridique est exploitable sans exposer ces détails aux non-admins. Recommandation minimale : conserver ce rendu admin-only et maintenir la couverture de sources.

5. `src/domain/base-contrat/__tests__/rules.test.ts:235` et `src/domain/base-contrat/__tests__/rules.test.ts:256` : les tests imposent déjà `moyenne/faible => "À confirmer" + dependencies`. Impact : bon garde-fou métier déjà présent. Recommandation minimale : le conserver dans `npm test`, et l'étendre seulement si l'on exige un taux de couverture source minimal par famille.

6. `scripts/audit-base-contrat-dmtg.mjs` : l'audit mesure 199 blocs, 166 sourcés et 52 moyenne/faible. Impact : la base est défendable éditorialement, mais pas encore source moteur car `src/engine` ne la consomme pas. Recommandation minimale : poursuivre la couverture source sur les familles restantes avant toute promotion moteur.

7. `src/pages/settings/SettingsDmtgSuccession.tsx:79`, `src/pages/settings/SettingsDmtgSuccession.tsx:241` et `src/pages/settings/SettingsDmtgSuccession.tsx:250` : lecture directe `tax_settings`/`fiscality_settings`, upsert, puis `invalidate('tax')` et `broadcastInvalidation('tax')`. Impact : le flux settings respecte le pattern settings admin. Recommandation minimale : garder cette chaîne et ajouter un test golden post-save avant fermeture d'édition.

8. `src/features/succession/SuccessionSimulator.tsx:74`, `src/features/succession/successionFiscalContext.ts:95` et `src/engine/succession.ts:128` : succession consomme `useFiscalContext({ strict: true })`, construit `dmtgSettings`, puis le moteur utilise `input.dmtgSettings ?? DEFAULT_DMTG`. Impact : DMTG Succession est branché vers simulateur et exports par snapshot, contrairement à Base-Contrat. Recommandation minimale : couvrir ce flux par un test de sauvegarde settings vers scénario golden.

9. `supabase/migrations/20260502222622_p2_rls_optimizations.sql:96` à `supabase/migrations/20260502222622_p2_rls_optimizations.sql:115` et `supabase/migrations/20260502222622_p2_rls_optimizations.sql:142` à `supabase/migrations/20260502222622_p2_rls_optimizations.sql:152` : lecture `tax_settings`/`fiscality_settings` aux authentifiés, écritures admin, overrides Base-Contrat admin-only. Impact : les migrations portent une preuve RLS dure. Recommandation minimale : vérifier en environnement déployé via `pg_policies`, pas seulement par lecture repo.

10. `rg "migrateDmtgData" src` sans match et `supabase/migrations/20260508000300_normalize_dmtg_jsonb.sql:56` : la migration JSONB défensive a été supprimée après normalisation. Impact : la dette de schéma DMTG est réduite. Recommandation minimale : garder les fixtures legacy de migration comme garde-fou.

11. `supabase/migrations/20260508000200_add_base_contrat_review_status.sql:23` et `src/domain/base-contrat/overrides.ts:20` : `base_contrat_overrides` porte `review_status`, `review_reason`, `next_review_at`. Impact : la veille juridique peut être pilotée par statut. Recommandation minimale : renseigner ces champs lors des revues annuelles.

12. `supabase/migrations/20260508000100_add_dmtg_settings_updated_by.sql:8` et `src/pages/settings/SettingsDmtgSuccession.tsx:268` : les écritures DMTG alimentent `updated_by` sur `tax_settings` et `fiscality_settings`. Impact : la traçabilité auteur est disponible côté DB. Recommandation minimale : vérifier périodiquement les valeurs nulles en production.

13. `src/features/succession/export/successionXlsx.ts:216` : le texte d'hypothèse `Abattement ligne directe` est alimenté par `snapshot.dmtgSettings.ligneDirecte.abattement`. Impact : l'export suit les settings DMTG au lieu d'une constante. Recommandation minimale : conserver le test XLSX avec abattement personnalisé.

14. `src/features/placement/utils/normalizers.ts:106`, `src/features/placement/hooks/usePlacementSimulatorController.ts:100` et `src/engine/placement/transmission.ts:31` : fallback `0.20` existe dans Placement. Impact : fallback dégradé, non prioritaire si `useFiscalContext` fournit bien le barème. Recommandation minimale : tracer le cas fallback et éviter de le présenter comme valeur de production.

15. `src/pages/settings/BaseContrat.tsx:36` et `src/pages/settings/BaseContrat.tsx:368` : `reload()` est protégé par `mountedRef`, et l'accordéon produit utilise un `button` natif. Impact : dette UI/accessibilité traitée. Recommandation minimale : conserver ce pattern sur les prochains accordéons settings.

16. `docs/ARCHITECTURE.md:65` : les constantes/données pures sont exemptes de la règle de taille. Impact : `retraite.ts`, `immobilier.ts`, `valeurs-mobilieres.ts` ne doivent pas être pénalisés comme composants React longs. Recommandation minimale : ne découper ces fichiers que si la responsabilité métier se mélange avec du rendu ou de l'I/O.

## Décision

| Base | Score dev senior | Score patrimonial/notarial | Verdict | Décision |
|---|---:|---:|---|---|
| Base-Contrat | 2/5 | 4/5 | Référentiel éditorial | Conserver, exposer sources/confiance, ne pas brancher moteur maintenant |
| DMTG Succession | 4/5 | 4/5 | Source calcul paramétrée | Conserver, durcir audit log, validation JSONB et test golden post-save |
| Exports pédagogiques | 3/5 | 3/5 | Utilisables sous conditions | Utiliser les snapshots fiscaux, pas les textes dupliqués |
| Promotion moteur Base-Contrat | 1/5 | 2/5 | Non prêt | Reporter jusqu'à contrat typé, versionné, sourcé et testé |

Les 4 couples produit/audience initialement non prêts (`Article 39 PP`, `PEE PM`, `PERCOL PM`, `PERCO PM`) sont désormais éditoriaux après ajout de sources officielles sur les familles prioritaires. Le blocage moteur demeure stratégique : Base-Contrat n'est toujours pas consommée par `src/engine`.

## Plan d'action

| Priorité | Action | Coût | Impact | Tests / preuves |
|---:|---|---:|---|---|
| 1 | Exposer `sources`, `confidence`, `dependencies` en admin Base-Contrat | 1 j | Veille juridique exploitable | Test UI admin ou test de rendu carte |
| 2 | Conserver et renforcer l'invariant `confidence ↔ dependencies/bullets` | 0,5 j | Évite la dérive éditoriale | `src/domain/base-contrat/__tests__/rules.test.ts` |
| 3 | Ajouter audit log DMTG `updated_at / updated_by` | 1 j | Traçabilité patrimoniale | Migration + test RLS/update |
| 4 | Migration DB DMTG + validation Zod + suppression `migrateDmtgData` | 2-3 j | Stabilise le schéma JSONB | Test lecture settings + sauvegarde |
| 5 | Ajouter statut override `à revoir / obsolescence à confirmer / prochaine revue` | 1 j | Transforme la base en outil de pilotage | Test cache overrides + UI admin |
| 6 | Vérification RLS dure sur `tax_settings`, `fiscality_settings`, `base_contrat_overrides` | 0,5 j | Évite l'illusion de sécurité React-only | Requête `pg_policies` en env cible |
| 7 | Golden après save DMTG | 0,5-1 j | Empêche une casse silencieuse du moteur | Scénario `succession-reference-conjoint-2enfants-600k`, droits `16 388` |
| 8 | Confort UI et duplication XLSX | opportuniste | Nettoyage sans refonte | Remplacer `div role=button`, alimenter XLSX par snapshot |

## Risques et rollback

| Changement | Risque | Rollback |
|---|---|---|
| Exposition sources/confiance UI | Surcharge visuelle admin | Feature flag ou rendu admin-only |
| Audit log DMTG | Migration incomplète ou `updated_by` null | Colonnes nullable au départ, backfill différé |
| Zod + suppression `migrateDmtgData` | Données prod legacy non migrées | Garder le migrateur une release derrière un warning |
| Statut override | Mauvaise interprétation métier d'un statut | Enum court, libellés explicites, pas d'impact moteur |
| Promotion moteur Base-Contrat | Couplage fiscal fragile | Contrat expérimental derrière adaptateur, pas de lecture directe depuis `engine` |
