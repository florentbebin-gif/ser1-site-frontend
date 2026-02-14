---
description: P0-03 - Inventaire isolation branding multi-cabinet
---

# P0-03 — Inventory branding isolation (multi-cabinet)

## 1) Surfaces impactées

## 1.1 Source de vérité thème/logo
- `src/settings/ThemeProvider.tsx`
  - charge et applique `theme_mode`, `preset_id`, `my_palette`
  - charge palette cabinet (`get_my_cabinet_theme_palette`) et logo cabinet (`get_my_cabinet_logo`)
  - applique les variables CSS `--color-c1..c10`
  - expose `cabinetColors`, `cabinetLogo`, `logoPlacement`, `pptxColors`

## 1.2 Résolution couleurs PPTX
- `src/pptx/theme/resolvePptxColors.ts`
  - règle de priorité: `cabinetColors` > (`themeScope==='all' ? webColors : originalColors`) > `DEFAULT_COLORS`

## 1.3 Cache local (anti-flash + perf)
- `src/settings/theme/hooks/useThemeCache.ts`
  - cache user: `ser1_theme_cache_<userId>`
  - cache cabinet palette: `ser1_cabinet_theme_cache_<userId>`
  - cache cabinet logo: `ser1_cabinet_logo_cache_<userId>`
  - TTL: 24h

## 1.4 Guard de priorité des sources
- `src/settings/theme/hooks/useThemeSync.ts`
  - ranking: `cabinet(3) > original-db(2) > custom/ui(1) > default/bootstrap(0)`
  - `applyColorsToCSS()` écrit `--color-c1..c10`

## 1.5 Points de consommation branding
- UI web: composants qui lisent `useTheme()` / variables CSS
- PPTX export: handlers `useThemeForPptx()` + pipelines `src/pptx/exports/*`
- Logo cover PPTX: `src/pptx/ops/applyCoverLogo.ts`, `src/pptx/slides/buildCover.ts`

---

## 2) Risques d'isolation à couvrir

1. **Bleed inter-cabinet en cache local**
   - risque: reuse cache stale d'un autre user/cabinet
   - garde actuelle: cache key suffixée `userId`

2. **Overwrite source de moindre priorité**
   - risque: custom/local override un thème cabinet
   - garde actuelle: `SOURCE_RANKS` + hash guard dans ThemeProvider

3. **Fallback incohérent UI vs PPTX**
   - risque: UI et PPTX ne résolvent pas les mêmes couleurs en absence cabinet
   - point de contrôle: `resolvePptxColors` + application CSS `ThemeProvider`

4. **Logo cabinet non isolé**
   - risque: logo d'un autre cabinet utilisé après switch session
   - garde actuelle: chargement RPC + cache clé user + purge à logout

---

## 3) Règle unique proposée (P0-03)

## Règle de priorité branding (unique)
1. Si cabinet assigné + palette cabinet disponible => source visuelle principale (UI + PPTX).
2. Sinon utiliser source user (`theme_mode` / preset / my palette) selon scope.
3. Sinon fallback `original-db`, puis `DEFAULT_COLORS`.
4. Logo: cabinet logo uniquement si résolu pour l'user courant, sinon aucun logo cabinet.

## Invariant d'isolation
- Aucun cache/theme/logo ne doit être réutilisé entre users différents.
- Toute application de thème doit être traçable à une source classée par `SOURCE_RANKS`.

---

## 4) Preuves minimales visées pour patch P0-03

1. **Test ou smoke reproductible**:
   - User A (cabinet A) applique branding A
   - logout/login User B (cabinet B)
   - vérifier variables CSS et logo B (pas A)

2. **Preuve fallback**:
   - user sans cabinet => pas de fuite de palette cabinet; fallback conforme règle unique

3. **Preuve PPTX**:
   - export sur cabinet A puis B => couleurs/logo cohérents par cabinet
