# SER1 — Audit Patrimonial Express + Stratégie Guidée

**Dernière mise à jour : 2026-02-05 (Europe/Paris)**

Application web interne pour CGP : audit patrimonial, stratégie guidée, simulateurs IR/Placement/Crédit, exports PPTX/Excel.

**Stack** : React 18 + Vite 5 + Supabase (Auth/DB/Storage/Edge Functions) + Vercel.  
**Tests** : 71 unitaires (Vitest).  
**Historique** : [docs/CHANGELOG.md](docs/CHANGELOG.md)  
**Debug flags** : [docs/runbook/debug.md](docs/runbook/debug.md)  
**🎨 Couleurs** : [docs/design/color-governance.md](docs/design/color-governance.md) — *source de vérité unique (tokens C1-C10)*  
**📐 UI Governance** : [docs/design/ui-governance.md](docs/design/ui-governance.md) — *Standards "Gestion Privée" (Layout, Inputs, Typo)*

---

## Dernières évolutions (2026-02-01)

### Refonte Signalements — Intégration dans Settings
**Objectif** : Simplifier l'UX en regroupant les signalements dans l'onglet Généraux.

| Avant | Après |
|-------|-------|
| Page séparée `/settings/signalements` | Bloc rétractable sous "Personnalisation avancée du thème" |
| FAB/Modal sur simulateurs | Formulaire unique dans Settings |
| `metadata` (bug DB) | `meta` (nom colonne correct) |
| Couleurs hardcodées | Variables CSS uniquement |

**Fichiers clés** :
- `src/components/settings/SignalementsBlock.jsx` — Composant réutilisable
- `src/constants/reportPages.js` — Centralisation des pages signalables
- `src/pages/Settings.jsx` — Intégration du bloc rétractable

### Refonte Navigation Settings — Source unique de vérité
**Objectif** : Éviter les oublis lors de l'ajout de pages Settings.

| Avant | Après |
|-------|-------|
| `SettingsNav.jsx` (fichier mort, non importé) | Supprimé |
| `TABS` inline dans `SettingsShell.jsx` | `SETTINGS_ROUTES` dans `src/constants/settingsRoutes.js` |
| Définition en 2 endroits | 1 seul endroit (config → nav + routing) |

**Ajout page Settings** : Modifier uniquement `src/constants/settingsRoutes.js` :
```javascript
export const SETTINGS_ROUTES = [
  // ... routes existantes
  {
    key: 'nouvellePage',
    label: 'Nouvelle Page',
    path: 'nouvelle-page',
    component: SettingsNouvellePage,
    adminOnly: true, // optionnel
  },
];
```

---

## 1. Architecture & Sources de vérité

```
src/
  main.jsx              # Bootstrap React + CSS vars
  App.jsx               # Routes lazy + gating
  settings/ThemeProvider.tsx    # Thème, RPC logos cabinet
  pages/                # PlacementV2, Credit, Ir, Settings
  pptx/                 # Export Serenity (design system)
  utils/xlsxBuilder.ts  # Export Excel

config/supabase/functions/admin/index.ts  # Edge Function admin (source de vérité)
api/admin.js           # Proxy Vercel (évite CORS)

database/
  setup/supabase-setup.sql      # Setup initial
  migrations/                   # RPC, tables, RLS
```

---

## 2. Thèmes & Branding — RÈGLES CRITIQUES

### 2.1 Tri-état cabinetColors
```typescript
// undefined = pas encore chargé (utiliser cache si dispo)
// null      = pas de cabinet confirmé (ne PAS utiliser cache)
// ThemeColors = cabinet existe
```

### 2.2 Hiérarchie sources (rank)
| Source | Rank | Usage |
|--------|------|-------|
| cabinet | 3 | PPTX toujours, UI si themeSource=cabinet |
| original-db | 2 | Fallback sans cabinet (Thème Original SYS) |
| custom/ui_settings | 1 | UI si user choisit custom |
| default | 0 | Fallback ultime |

### 2.3 RÈGLES MÉTIER UI vs PPTX
| Cas | UI | PPTX |
|-----|-----|------|
| **Sans cabinet** + themeSource=cabinet | Thème Original DB | Thème Original DB |
| **Sans cabinet** + custom + scope=ui-only | custom | Thème Original DB |
| **Sans cabinet** + custom + scope=all | custom | custom |
| **Avec cabinet** | selon settings | cabinet TOUJOURS |

**Fichiers clés** :
- `src/settings/ThemeProvider.tsx` — logique thème + RPC
- `src/pptx/theme/resolvePptxColors.ts` — résolution PPTX
- `src/pages/Sous-Settings/SettingsComptes.jsx` — édition Thème Original

---

## 3. Sécurité & Admin

### 3.1 Source de vérité admin
**JWT `app_metadata` uniquement** — `app_metadata.role` = `'admin'` (jamais `user_metadata` pour la sécurité)

| Couche | Vérification |
|--------|--------------|
| RLS DB | `public.is_admin()` lit `app_metadata` uniquement |
| Edge Function | `user.app_metadata?.role` uniquement (ligne 128) |
| Frontend | `useUserRole()` lit `session.user.app_metadata.role` |

> ⚠️ `user_metadata` est **désactivé pour l'autorisation** — modifiable par l'utilisateur (risque élévation privilèges). Voir [docs/technical/security-user-metadata-guidelines.md](docs/technical/security-user-metadata-guidelines.md).

### 3.2 Edge Function admin
**Code source unique** : `config/supabase/functions/admin/index.ts`

**Déploiement** :
```powershell
npx supabase functions deploy admin --project-ref PROJECT_REF --workdir config
```

⚠️ `--workdir config` obligatoire (pas `config/supabase`).

### 3.3 Protection mots de passe (Security Advisor)
**Leaked Password Protection** : Détection des mots de passe compromis via HaveIBeenPwned.org.
- **Disponibilité** : Plan Pro et supérieur uniquement
- **Emplacement** : Supabase Dashboard → Authentication → Policies → "Prevent use of leaked passwords"
- **Statut** : Warning Security Advisor normal si plan Free (fonctionnalité payante)

---

## 4. Supabase — RLS & Storage

### 4.1 RPC SECURITY DEFINER
- `get_my_cabinet_logo()` → retourne `{ storage_path, placement }` logo cabinet + position
- `get_my_cabinet_theme_palette()` → retourne palette JSONB

### 4.2 Bucket logos
- **Path** : `{cabinet_id}/{timestamp}-{hash}.{ext}`
- **Déduplication** : SHA256 via RPC
- **Chargement** : RPC → `storage.from('logos').download()` → base64 data-uri
- **Export PPTX** : Logo cabinet uniquement (via RPC `get_my_cabinet_logo`), pas de fallback `user_metadata` pour des raisons de sécurité

### 4.3 Checklist avant déploy
- [ ] Migration RPC appliquée
- [ ] Bucket `logos` créé
- [ ] Edge Function déployée avec `--workdir config`
- [ ] Env vars Vercel : `SUPABASE_URL` + `SUPABASE_ANON_KEY`

---

## 5. Exports PPTX (Serenity)

### 5.1 Design System
- **Police** : Arial uniquement (`TYPO` in `src/pptx/designSystem/serenity.ts`)
- **Couleurs** : Thème dynamique c1-c10, blanc (#FFFFFF) autorisé
- **Langue** : `fr-FR` forcé via `addTextFr()`
- **Zones protégées** : Header/Footer gérés par helpers

### 5.2 Types de slides
| Type | Builder | Usage |
|------|---------|-------|
| COVER | `buildCover.ts` | Logo, titre, date, conseiller |
| CHAPTER | `buildChapter.ts` | Image + titre + accent line |
| CONTENT | `buildContent.ts` | KPIs, graphiques |
| SYNTHESIS | `build*Synthesis.ts` | Slide principale simulateur |
| END | `buildEnd.ts` | Disclaimer légal |

### 5.3 Règles immuables
1. Pas d'hex codé en dur sauf : blanc (#FFFFFF), WARNING (#996600), overlay rgba(0,0,0,0.5)
2. `resolvePptxColors()` source unique couleurs
3. Données PPTX = même source que UI (pas de recalc)
4. Pagination amortissement : max 14 lignes/slide

---

## 6. Commandes & Développement

### 6.1 Prérequis
- Node.js 22.x (`.nvmrc` + `package.json > engines`)
- Variables `.env.local` : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### 6.2 Scripts
```powershell
npm install
npm run dev          # localhost:5173
npm run build        # dist/
npm run test         # 71 tests Vitest
npm run lint         # ESLint avec plugin ser1-colors (gouvernance couleurs)
```

---

## 7. Debug & Logs

### 7.1 Politique console
- `console.error/warn` : erreurs réelles uniquement
- `console.log/info/debug/trace` : **interdits** sauf derrière flag explicite

### 7.2 Flags DEBUG (localStorage)
```javascript
localStorage.setItem('DEBUG_AUTH', 'true')
localStorage.setItem('DEBUG_PPTX', 'true')
localStorage.setItem('DEBUG_THEME_BOOTSTRAP', 'true')
```

---

## 8. Troubleshooting (5 cas)

| Symptôme | Cause | Fix |
|----------|-------|-----|
| RPC 404 `get_my_cabinet_logo` | Migration non appliquée | Appliquer `database/migrations/add-rpc-*.sql`, attendre 1-2min |
| Edge Function 400 (HTML Cloudflare) | Header Host manquant | Vérifier proxy `api/admin.js` |
| Flash thème au F5 | CSS `:root` écrase vars | Bootstrap head dans `index.html` + `ThemeProvider` vérifie `window.__ser1ThemeBootstrap` |
| Build Vercel Node 24.x | `engines: ">=22"` trop permissif | Pin strict `"22.x"` dans `package.json` |
| Logo PPTX manquant | Bucket `logos` non créé | Créer bucket + appliquer migrations |

---

## 9. Liens documentation

- [Historique détaillé](docs/CHANGELOG.md) — post-mortems, évolutions
- `ADMIN_COMPTES_ET_SIGNALMENTS.md` — Gestion admin
- `CSS_COLOR_RULES.md` — Règles couleurs CSS

### 🎨 Design System & Gouvernance

| Document | Description | Usage |
|----------|-------------|-------|
| **[Gouvernance Couleurs](docs/design/color-governance.md)** | Règles complètes C1-C10, exceptions, contraste, mapping sémantique | **OBLIGATOIRE** avant toute modif couleur |
| **[Gouvernance UI](docs/design/ui-governance.md)** | Standards Layout, Inputs, Typo, Composants "Premium" | **OBLIGATOIRE** pour toute nouvelle page |
| **[Audit Couleurs](docs/history/color-audit.md)** | Historique des écarts identifiés (archive) | Référence historique |

**⚠️ RÈGLES ABSOLUES** :
1. Aucune couleur hardcodée sauf WHITE (#FFFFFF) et WARNING (#996600). Voir [gouvernance couleur](docs/design/color-governance.md).
2. **INPUTS SUR FOND BLANC** obligatoirement pour la lisibilité. Voir [gouvernance UI](docs/design/ui-governance.md).

---

*README simplifié — voir [docs/CHANGELOG.md](docs/CHANGELOG.md) pour l'historique complet.*
