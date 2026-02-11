# PLAN — Settings Cleanup + Premium Polish ✅ TERMINÉ

> Branche: `chore/settings-cleanup-premium`
> Date: 11 février 2026
> Baseline: 142 tests passed, tsc 0 errors, build OK (5.08s)
> Final: 142 tests passed, tsc 0 errors, build OK (2.97s)

---

## ÉTAPE 0 — Baseline ✅

- Branch créée
- vitest: 142 passed (14 files)
- tsc --noEmit: 0 errors
- vite build: OK (5.08s)

---

## ÉTAPE 1 — Audit /settings/fiscalites + legacy V2 ✅

### Constats (preuves)

| Élément | Statut | Preuve |
|---------|--------|--------|
| `SettingsFiscalites.jsx` | SUPPRIMÉ (PR précédente) | `find_by_name` → absent |
| `SettingsFiscalites.css` | SUPPRIMÉ (PR précédente) | `find_by_name` → absent |
| `ProductCatalog.tsx` | ARCHIVÉ → `legacy/` | Conservé pour rollback, 0 import actif |
| Route `/settings/fiscalites` | RETIRÉE de SETTINGS_ROUTES | Redirect legacy conservé dans SettingsShell + settingsRoutes |
| E2E tests fiscalites | AUCUN | `grep "fiscalites" tests/` → 0 résultats |

### Décision: **A — Archiver ProductCatalog.tsx** ✅

- `git mv` vers `src/pages/Sous-Settings/legacy/ProductCatalog.tsx`
- Commentaire BaseContrat.tsx mis à jour
- docs/fiscality-product-catalog.md mis à jour
- Redirects legacy conservés (utiles pour bookmarks/compat)

---

## ÉTAPE 2 — BaseContrat premium polish ✅

- Microcopy FR : `(active)` → `(En vigueur)` via MISC_LABELS
- Confidence badges : `toVerify` utilise C6 (warm accent) au lieu de C8 (gris)
- Message "Aucune version définie" complété

---

## ÉTAPE 3 — Dead code cleanup ✅

- Minimal : la PR précédente avait déjà fait le gros du travail
- Commentaire obsolète "copié de SettingsFiscalites" corrigé dans SettingsImpots.css
- console.log : 52 matches, 45 dans tests → acceptable (confirmé)

---

## ÉTAPE 4 — Settings impôts & prélèvements premium ✅

### Actions réalisées

1. **Créé `SettingsShared.css`** (~195 lignes) — classes partagées extraites de SettingsImpots.css
2. **Allégé `SettingsImpots.css`** — ne contient plus que les classes spécifiques (income-tax-columns, income-tax-block, taux-col)
3. **`SettingsPrelevements.jsx`** — import `SettingsShared.css` au lieu de `SettingsImpots.css`
4. **Messages feedback** — inline styles → classes CSS `.settings-feedback-message--success/error`
5. **Bouton save** — classe `.settings-save-btn` avec style premium

---

## Checklist de validation ✅

- [x] vitest: 142 tests passed
- [x] tsc --noEmit: 0 errors
- [x] vite build: OK (2.97s)
- [x] Docs à jour (fiscality-product-catalog.md, cleanup-dead-code-report.md, README.md)
- [x] Pas de couleur hardcodée ajoutée (toutes variables CSS)
- [x] Pas de check admin sur user_metadata
