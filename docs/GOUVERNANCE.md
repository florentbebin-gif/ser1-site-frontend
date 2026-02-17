# GOUVERNANCE (UI / Couleurs / Thème)

## But
Définir **les règles non négociables** pour garder une UI premium et un theming cohérent (web + PPTX + Excel).

## Audience
Toute personne qui touche : CSS/UI, exports, thème, Settings.

## Ce que ce doc couvre / ne couvre pas
- ✅ Couvre : design system UI, gouvernance couleurs, modes de thème V5, anti-patterns.
- ❌ Ne couvre pas : runbook de debug (voir `docs/RUNBOOK.md`) ni architecture détaillée (voir `docs/ARCHITECTURE.md`).

## Sommaire
- [Règles UI premium](#règles-ui-premium)
- [Gouvernance couleurs (C1–C10)](#gouvernance-couleurs-c1c10)
- [Système de thème V5 (3 modes)](#système-de-thème-v5-3-modes)
- [Anti-patterns](#anti-patterns)
- [Références code](#références-code)

---

## Règles UI premium
Principes : épuré, lisible, respirant.

### Hiérarchie des surfaces
- **Fond de page** : `var(--color-c7)`.
- **Cards/panels/modales** : `#FFFFFF` (exception autorisée), border `var(--color-c8)`, radius 8–12px.

### Typographie
- Titres : *Sentence case*, poids 500–600.
- Texte secondaire/labels : `var(--color-c9)`.
- Messages utilisateur : **français**.

### Inputs (règle critique)
- **Fond TOUJOURS blanc** : `background-color: #FFFFFF`.
- Border : `1px solid var(--color-c8)`.
- Focus : `border-color: var(--color-c2)` + ring `var(--color-c4)`.

### Composants (guidelines)
- Buttons : primary = C2 + texte contrasté ; secondary = fond clair + border C8.
- Tables : zebra `C7/WHITE`, borders C8, padding confortable.

---

## Gouvernance couleurs (C1–C10)
### Règle
- Utiliser uniquement les tokens `C1..C10` via variables CSS `--color-c1..--color-c10`.
- **Hardcode interdit** sauf exceptions listées ci-dessous.

### Tokens par défaut (rôle)
- C1 : brand dark (fonds/titres selon contexte)
- C2 : primary / CTA
- C7 : surface page
- C8 : border
- C9 : text muted
- C10 : text primary

### Exceptions autorisées (liste exhaustive)
- `#FFFFFF` (WHITE) : fond raised (cards/panels) et texte sur fonds très sombres.
- `#996600` (WARNING) : warning hardcodé (le thème user peut rendre tout autre token illisible).
- `rgba(0,0,0,0.5)` : overlay modale (seul rgba autorisé).

### Contraste
- Pas de texte blanc sur fond C7.
- Headers “colorés” (ex: Excel header) : couleur de texte **calculée** selon le fond (helper existant côté Excel).

---

## Système de thème V5 (3 modes)
Le theming doit rester **déterministe** et persistant en DB.

### Modes
- `cabinet` : branding du cabinet (source principale, notamment pour PPTX).
- `preset` : thème prédéfini.
- `my` : palette personnalisée de l’utilisateur.

### Règles métier (à respecter)
1. Clic preset → `theme_mode='preset'`, `preset_id=id`, **ne touche jamais** `my_palette`.
2. Clic cabinet → `theme_mode='cabinet'`.
3. Clic “Mon thème” → `theme_mode='my'` + applique `my_palette`.
4. “Enregistrer” → écrit `my_palette` **uniquement** si `themeMode='my'`.
5. `localStorage` = miroir anti-flash (pas source de vérité).

---

## Anti-patterns
- Calcul métier fiscal dans React (doit aller dans `src/engine/`).
- Import CSS cross-page (styles partagés → `src/styles/`).
- Couleurs hardcodées hors exceptions.
- Logs en prod via `console.log/debug/info/trace` (bloqué par ESLint).
- Autorisation basée sur `user_metadata`.

---

## Références code
- Tokens & defaults : `src/settings/theme.ts`, `src/styles.css`
- ThemeProvider V5 : `src/settings/ThemeProvider.tsx`, `src/settings/presets.ts`, `src/settings/theme/types.ts`
- UI premium classes : `src/styles.css` + composants Settings (`src/components/settings/SettingsSectionCard.jsx`)
- ESLint couleurs : `tools/eslint-plugin-ser1-colors/`
