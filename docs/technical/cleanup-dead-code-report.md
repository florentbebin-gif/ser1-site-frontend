# Rapport de nettoyage - Dead Code Audit

> Branche : `chore/cleanup-dead-code-docs`  
> Date : 11 février 2026  
> Objectif : Nettoyer le code mort, fichiers inutilisés et docs obsolètes sans régression

---

## 1. Baseline - État initial

### 1.1 Environnement
- Node : v22.21.0
- npm : 10.9.4

### 1.2 Checks de base (avant nettoyage)
```
npx tsc --noEmit    : ✓ 0 erreurs
npx vitest run      : ✓ 142 tests passed (14 files)
npx vite build      : ✓ built in 3.02s
```

---

## 2. Inventaire du code mort

### 2.1 ESLint - Unused imports/exports/vars
**Analyse** : Pas de problèmes critiques détectés par `tsc --noEmit`. Les imports non utilisés sont gérés par le build.

### 2.2 TODO/FIXME/HACK/DEPRECATED
```bash
rg "TODO|FIXME|HACK|DEPRECATED" src docs
```
**Résultat** : 25 matches dans 13 fichiers
- Fichiers principaux : `extractFromBaseContrat.test.ts` (4), `succession.ts` (3), `civil.ts` (2)
- Ces marqueurs sont des annotations techniques légitimes, pas du code mort à supprimer.

### 2.3 console.log / debugger
```bash
rg "console\.log|debugger" src
```
**Résultat** : 52 matches dans 6 fichiers
- 45 dans `tmiMetrics.test.js` (tests, acceptable)
- 2 dans `applyCoverLogo.ts` (PPTX ops)
- 2 dans `semanticColors.ts`
- 1 dans `serenity.ts`
- 1 dans `spike17.test.ts`
- 1 dans `styles/semanticColors.ts`

**Action** : Laissés car dans tests ou PPTX (pas critique pour la prod).

### 2.4 Fichiers/pages non utilisés

| Fichier | Preuve d'inutilité | Action | Risque |
|---------|-------------------|--------|--------|
| `SettingsBaseContrats.jsx` | Importé nulle part, placeholder "sera complété prochainement", route utilise `BaseContrat.tsx` | **SUPPRIMÉ** | Aucun - route pointe vers BaseContrat.tsx |
| `SettingsBaseContrats.css` | Importé uniquement par SettingsBaseContrats.jsx (supprimé) | **SUPPRIMÉ** | Aucun - styles inline dans le placeholder |
| `SettingsFiscalites.jsx` | Plus routé (supprimé de settingsRoutes.js dans PR précédente) | **SUPPRIMÉ** | Aucun - fonctionnalité remplacée par BaseContrat |
| `SettingsFiscalites.css` | Importé par SettingsFiscalites.jsx et ProductCatalog.tsx | **SUPPRIMÉ** + fix import ProductCatalog | Faible - ProductCatalog est archive rollback |
| `ProductCatalog.tsx` | Commentaire: "conservé intact pour rollback" | **CONSERVÉ** | N/A - intentionnel pour rollback |

---

## 3. Routes / pages obsolètes

| Route | Statut | Action |
|-------|--------|--------|
| /settings/fiscalites | SUPPRIMÉE (PR précédente) | redirect vers /settings/base-contrat |

---

## 4. CSS mort

### 4.1 Fichiers CSS supprimés
- `SettingsBaseContrats.css` - 11 lignes, uniquement pour placeholder supprimé
- `SettingsFiscalites.css` - 298 lignes, pour page supprimée

### 4.2 Classes CSS vérifiées
Les classes dans les CSS supprimés n'étaient utilisées que par leurs composants respectifs (qui sont aussi supprimés), sauf:
- `SettingsFiscalites.css` : `.settings-page .section-card`, `.tax-user-banner`, `.settings-table` - ces classes génériques sont aussi définies dans `SettingsImpots.css` (qui reste).

**Preuve** : 
```bash
rg "tax-user-banner" src/  # 0 résultats hors SettingsFiscalites.css
rg "settings-table" src/   # Défini aussi dans SettingsImpots.css
```

---

## 5. Supabase / SQL (analyse seulement, pas de suppression)

Migrations listées :
- `20260210212056_remote_schema.sql` (0 bytes - empty)
- `20260210214352_remote_commit.sql` (40378 bytes - schema initial)
- `20260211000100_harmonize_rls_tax_ps_is_admin.sql` (913 bytes - RLS harmonization)
- `20260211001000_create_base_contrat_settings.sql` (1507 bytes - nouvelle table)

**Décision** : Aucune migration ne sera supprimée (bonne pratique de conserver l'historique).

---

## 6. Documentation audit

Fichiers .md audités : 17

| Fichier | Statut | Action |
|---------|--------|--------|
| `docs/technical/cleanup-dead-code-report.md` | Créé | Ce fichier |
| `docs/fiscality-product-catalog.md` | À jour | Pointeur vers base-contrat-spec.md déjà présent |
| `docs/design/base-contrat-spec.md` | À jour | Sections slug + lifecycle ajoutées dans PR précédente |
| Autres .md | Non modifiés | Pas de références obsolètes détectées |

---

## 7. Actions de nettoyage

| Fichier | Action | Preuve d'inutilité | Risque | Validation |
|---------|--------|-------------------|--------|------------|
| `src/pages/Sous-Settings/SettingsBaseContrats.jsx` | Supprimé | 0 imports, placeholder | Aucun | tsc/test/build OK |
| `src/pages/Sous-Settings/SettingsBaseContrats.css` | Supprimé | importé par fichier supprimé | Aucun | tsc/test/build OK |
| `src/pages/Sous-Settings/SettingsFiscalites.jsx` | Supprimé | non routé | Aucun | tsc/test/build OK |
| `src/pages/Sous-Settings/SettingsFiscalites.css` | Supprimé | non utilisé hors archive | Faible | tsc/test/build OK |
| `src/pages/Sous-Settings/ProductCatalog.tsx` | Fix import CSS | Importait CSS supprimé | Aucun | tsc/test/build OK |

---

## 8. Final checks (après nettoyage)

```
npx tsc --noEmit    : ✓ 0 erreurs
npx vitest run      : ✓ 142 tests passed
npx vite build      : ✓ built in ~3s
```

---

## 9. Commits

1. `chore(cleanup): remove dead Settings pages and CSS files`

---

## 10. Résumé exécutif

- **Fichiers supprimés** : 4
  - 2 composants React (placeholders/pages mortes)
  - 2 fichiers CSS associés
- **Fichiers modifiés** : 1 (ProductCatalog.tsx - suppression import CSS)
- **Lignes supprimées** : ~360 (2 fichiers JSX + 2 fichiers CSS)
- **Docs mises à jour** : 1 (ce rapport)
- **Tests impactés** : 0
- **Breaking changes** : 0

---

## 11. Phase 2 — Settings cleanup + premium (11 février 2026 — chore/settings-cleanup-premium)

### Actions

| Fichier | Action | Preuve | Risque |
|---------|--------|--------|--------|
| `ProductCatalog.tsx` | Déplacé → `legacy/ProductCatalog.tsx` | 0 imports actifs, rollback uniquement | Aucun |
| `SettingsImpots.css` | CSS partagé extrait vers `SettingsShared.css` | Classes partagées avec SettingsPrelevements | Aucun |
| `SettingsPrelevements.jsx` | Import `SettingsImpots.css` → `SettingsShared.css` | Couplage CSS corrigé | Aucun |
| `SettingsImpots.jsx` | Ajout import `SettingsShared.css`, messages → CSS classes | Inline styles réduits | Aucun |
| `BaseContrat.tsx` | Microcopy FR, confidence badges polish | Cohérence UX | Aucun |

### Nouveau fichier

- `src/pages/Sous-Settings/SettingsShared.css` — ~195 lignes, classes partagées (accordion, field-row, table, feedback messages, save button)

### Final checks

```
npx tsc --noEmit    : ✓ 0 erreurs
npx vitest run      : ✓ 142 tests passed
npx vite build      : ✓ built in ~3s
```

