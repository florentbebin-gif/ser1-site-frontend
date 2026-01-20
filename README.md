- `src/utils/xlsxBuilder.ts` : Génère les `.xlsx` (IR & Crédit) avec feuille `Parameters` + résumés stylés. Utilise JSZip + `validateXlsxBlob` pour éviter les archives corrompues / mismatch extension.

### Exports Excel — Règles de style

- **Structure IR** : `Paramètres` (inputs), `Synthèse impôts` (résumé), `Détails calculs` (tranches).
- **Structure Crédit** : `Paramètres`, `Synthèse globale`, `Prêt n` (jusqu'à 3), colonnes assurance & capitaux décès alignées sur moteur.
- **Style commun** :
  - Formats `#,##0 €`, `0.00 %`, alignements cohérents
  - Largeurs auto + minWidth forcé pour textes
  - Headers (fond accent, texte contrasté)
  - Totaux surlignés (`bold`, `borderTop`)
- **Validation** : `buildXlsxBlob` + `validateXlsxBlob` (refus d'un blob dont le header ZIP n'est pas `PK`).

## 🔧 Troubleshooting / Correctifs récents

| Date | Problème | Cause racine | Fix | Validation |
|------|----------|--------------|-----|------------|
| 19 jan 2026 | Crash `/sim/credit` + `/sim/ir` (« useRef is not defined ») | Hook utilisé sans import dans `Credit.jsx` / `Ir.jsx` | Ajout `useRef` dans les imports React | `npm run build`, navigation `/sim/credit` & `/sim/ir` |

> Rappel : même en runtime automatique React 18, **tous** les hooks (`useRef`, `useMemo`, etc.) doivent être importés explicitement.

## ✅ Checklists de validation

### PPTX Serenity (avant merge)
- [ ] Export IR et Crédit générés et ouverts dans PowerPoint sans avertissement
- [ ] Aucun overlap footer / titres (contrôle visuel + logs helpers)
- [ ] `addTextFr` utilisé partout (langue `fr-FR` confirmée)
- [ ] Couleurs respectent `resolvePptxColors` (pas d'hex arbitraire)
- [ ] Pagination amortissement & annexes complètes

### Excel (IR & Crédit)
- [ ] Le `.xlsx` téléchargé s'ouvre sans message de corruption
- [ ] Formats € / % + colonnes ajustées automatiquement
- [ ] Tous les onglets requis remplis (Paramètres / Synthèse / Détails / Prêts)
- [ ] Totaux alignés avec l'UI (mensualités, TMI, capitaux décès)
- [ ] `validateXlsxBlob()` passe (header `PK`)
### Règles immuables (source de vérité)

1. **Police** : Arial partout, pilotée par `TYPO` dans `designSystem/serenity.ts` (ne pas introduire d'autre fontFace).
2. **Langue de vérification** : `lang = 'fr-FR'` forcé via `addTextFr()` pour 100% des blocs (IR, Crédit, futurs exports).
3. **Couleurs** : seules les couleurs issues du thème sont autorisées (blanc hardcodé toléré). Toute nouvelle couleur doit passer par `resolvePptxColors`.
4. **Zones protégées** : Titres/sous-titres/footer gérés par les helpers. Aucune insertion libre dans `LAYOUT_ZONES.*` réservés.
5. **Safety checks** :
   - `ensureNoOverlap()` pour les cartons multi-blocs
   - Fallback icônes/images (`addBusinessIcon`, `applyChapterImage`) déjà couverts par `addTextFr`
   - Pagination amortissement (1 slide = 14 lignes max) obligatoire

> Toute PR PPTX doit mentionner la vérification de ces 5 règles.

# SER1 — Audit Patrimonial Express + Stratégie Guidée

Application web interne pour CGP permettant :
- la **connexion sécurisée des utilisateurs** (admin / user),
- l'**audit patrimonial complet** (6 étapes : famille, civil, actifs, passif, fiscalité, objectifs),
- la **stratégie guidée** avec recommandations automatiques et projections comparées,
- l'accès à plusieurs **simulateurs financiers** (IR, placement, crédit),
- la **sauvegarde et le chargement de dossiers complets** en local,
- la **gestion centralisée de paramètres** (fiscalité, couleurs, logo d'étude),
- la **conformité RGPD** (pas de stockage serveur des noms clients, export/import JSON local).

✅ **Application frontend**, backend managé via Supabase (Auth/DB/Storage/Edge Functions)  
✅ Basé sur **React 18 + Vite 5**, codebase mix JS/TS (migration progressive)  
✅ Moteur de calcul traçable avec warnings  
✅ 44 tests unitaires (Vitest)  
✅ Déploiement automatisé sur Vercel  

---

## 📁 Organisation du repository

```text
SER1/
├── 📄 README.md                    # Documentation complète (ce fichier)
├── 📄 package.json                 # Dépendances et scripts npm
├── 📄 vite.config.ts              # Configuration Vite
├── 📄 tsconfig.json               # Configuration TypeScript
├── 📄 .env                        # Variables d'environnement (à créer)
├── 📄 .gitignore                  # Fichiers ignorés par Git
├── 📄 vercel.json                 # Configuration déploiement Vercel
│
├── 📁 src/                        # Code source principal
│   ├── 📄 main.jsx                # Point d'entrée React
│   ├── 📄 App.jsx                 # Routing global + topbar
│   ├── 📄 supabaseClient.js       # Client Supabase
│   ├── 📄 styles.css              # Styles globaux
│   │
│   ├── 📁 pages/                  # Pages de l'application
│   │   ├── 📄 Login.jsx           # Connexion / authentification
│   │   ├── 📄 Home.jsx            # Accueil avec navigation
│   │   ├── 📄 PlacementV2.jsx     # Simulateur placement
│   │   ├── 📄 Credit.jsx          # Simulateur crédit
│   │   └── 📁 Settings/           # Pages des paramètres
│   │       ├── 📄 SettingsPage.jsx
│   │       ├── 📄 SettingsNav.jsx
│   │       └── 📁 Sous-Settings/
│   │
│   ├── 📁 components/             # Composants réutilisables
│   ├── 📁 engine/                 # Moteurs de calcul financiers
│   ├── 📁 utils/                  # Fonctions utilitaires
│   ├── 📁 hooks/                  # Hooks React personnalisés
│   ├── 📁 services/               # Services externes
│   ├── 📁 features/               # Features métier
│   ├── 📁 auth/                   # Logique d'authentification
│   ├── 📁 settings/               # Gestion des paramètres
│   ├── 📁 pptx/                   # Génération PowerPoint
│   └── 📁 styles/                 # Feuilles de style CSS
│
├── 📁 database/                   # Scripts SQL organisés
│   ├── 📁 setup/                   # Configuration initiale
│   │   ├── 📄 supabase-setup.sql
│   │   └── 📄 admin_setup.sql
│   ├── 📁 migrations/              # Scripts de migration
│   │   ├── 📄 create-ui-settings.sql
│   │   ├── 📄 create_issue_reports_table.sql
│   │   └── 📄 add-user-mode.sql
│   └── 📁 fixes/                   # Scripts de correction
│       ├── 📄 fix-profiles.sql
│       ├── 📄 fix-ui-settings-duplicates.sql
│       ├── 📄 fix-ui-settings-duplicates-v2.sql
│       ├── 📄 fix_issue_reports_table.sql
│       └── 📄 check-ui-settings-rls.sql
│
├── 📁 config/                     # Configuration locale
│   └── 📁 supabase/                # Config Supabase locale
│
├── tools/                      # Outils de développement
│   └── scripts/                # Scripts utilitaires
│       ├── admin-smoke.ps1     # Script admin PowerShell
│       ├── validate_ir_excel.mjs # Validation exports IR
│       └── normalize-business-icons.mjs # Normalisation icônes
│
├── docs/                       # Documentation et exports
│   ├── *.xlsx                  # Fichiers Excel exemples
│   └── brainstorming-session-results.md
│
├── public/                     # Fichiers statiques
│   ├── ui/                      # Assets UI
│   │   └── login/
│   │       └── login-bg.png    # Fond d'écran login
│   └── pptx/                    # Assets PowerPoint
│       ├── chapters/            # Images chapitres (max 10)
│       └── icons/               # Icônes PPTX (générées depuis src/icons/business/svg)
├── dist/                       # Build de production
├── node_modules/               # Dépendances npm
├── .vscode/                    # Configuration VS Code
├── .windsurf/                  # Configuration Windsurf
├── 📄 *.sql                       # Scripts SQL Supabase
└── 📄 *.md                        # Documentation technique

---

## 🏗️ Architecture

### Structure du Projet

```text
ser1/
├── src/                    # Code source actif
│   ├── pages/             # Pages UI (IR, Placement, Crédit, Settings...)
│   ├── components/        # Composants réutilisables
│   ├── hooks/             # Hooks personnalisés
│   ├── utils/             # Utilitaires métier
│   ├── engine/            # Moteurs de calcul (placement, fiscalité, succession)
│   ├── features/          # Features métier (audit, strategy)
│   ├── pptx/              # Génération PowerPoint
│   ├── auth/              # Authentification
│   ├── settings/          # Thème et configuration
│   └── styles/            # Styles partagés
├── tools/                 # Outils de développement
│   └── scripts/           # Scripts utilitaires (validation, admin)
├── config/                # Configuration
│   └── supabase/          # Configuration Supabase locale
├── database/              # Base de données
│   ├── migrations/        # Scripts migration
│   ├── fixes/             # Scripts correctifs
│   └── setup/             # Scripts setup initial
├── docs/                  # Documentation
│   ├── technical/         # Documentation technique
│   └── examples/          # Exemples clients
└── public/                # Assets statiques
```

### Frontend (React + TypeScript)
- **Pages** : Simulateurs (IR, Placement, Crédit, Audit, Stratégie)
- **Components** : UI réutilisables, formulaires, tableaux
- **Hooks** : Logique métier réutilisable
- **Utils** : Calculs fiscaux, helpers, exports
- **Engine** : Moteurs de calcul (placement, fiscalité, succession)

### Backend (Supabase)
- **Authentification** : Users, rôles (admin/user)
- **Database** : PostgreSQL avec RLS
- **Storage** : Images, documents
- **Edge Functions** : API admin

### PowerPoint Generation
- **PptxGenJS** : Génération de présentations
- **Design System** : Thème SER1, layouts standards
- **Templates** : Audit, Stratégie, IR
- **Règles immuables** :
  - Tout texte PPTX doit passer par `addTextFr` (langue de vérification **fr-FR** forcée + Arial par défaut)
  - Pas de couleurs hex hardcodées (sauf blanc `#FFFFFF` et variantes littérales)
  - Pas d'écriture directe dans les zones protégées (titre, sous-titre, footer) : utiliser les helpers `addHeader`, `addFooter`, etc.
  - Toute nouvelle slide doit intégrer les safety checks (no overlap, textes tronqués détectés, fallback icônes/images déjà en place)

---

## 🛠 Setup Supabase

### Déploiement de la fonction Edge `admin` (CORS, prod)

- Code source : `config/supabase/functions/admin` (utilise `cors.ts` + gestion OPTIONS 204)
- Projet Supabase : `xnpbxrqkzgimiugqtago`
- Commande de déploiement (important : `--workdir config`):

```bash
npx supabase functions deploy admin --project-ref xnpbxrqkzgimiugqtago --workdir config
```

### Vérifications rapides CORS (origin prod)

```bash
# Préflight
curl --ssl-no-revoke -i -X OPTIONS "https://xnpbxrqkzgimiugqtago.supabase.co/functions/v1/admin" \
  -H "Origin: https://ser1-site-frontend.vercel.app" \
  -H "Access-Control-Request-Method: POST"

# Requête réelle minimale (401 attendu sans token, mais doit inclure CORS)
curl --ssl-no-revoke -i -X POST "https://xnpbxrqkzgimiugqtago.supabase.co/functions/v1/admin" \
  -H "Origin: https://ser1-site-frontend.vercel.app" \
  -H "Content-Type: application/json" \
  -d "{}"
```

Attendu :
- `Access-Control-Allow-Origin: https://ser1-site-frontend.vercel.app`
- `Access-Control-Allow-Methods: POST, GET, OPTIONS`
- `Access-Control-Allow-Headers: authorization, apikey, content-type, x-request-id`
- Header de version : `x-admin-version: 2026-01-20-fix-cors-v3`

### Troubleshooting CORS persistant en Prod

Si `curl` fonctionne mais que le navigateur bloque toujours :
1. **Vérifier l'URL Supabase dans Vercel** :
   - Variable `VITE_SUPABASE_URL` doit être exactement `https://xnpbxrqkzgimiugqtago.supabase.co`
   - Si elle pointe ailleurs, le `invoke('admin')` tape sur un autre projet qui n'a pas le fix.
2. **Vider le cache navigateur** :
   - Le navigateur peut cacher le résultat du preflight `OPTIONS`.
   - Tester en navigation privée ou avec "Disable Cache" dans les DevTools.
3. **Vérifier les redirections** :
   - Dans l'onglet Network, si vous voyez un status `3xx` avant le blocage, c'est souvent un problème d'URL (slash final manquant/en trop). Le client `supabase-js` gère normalement cela.


### 1) Créer le projet Supabase

1. Allez sur https://supabase.com
2. Créez un nouveau projet (région EU West recommandée)
3. Attendez que le projet soit prêt (1-2 minutes)
4. Allez dans **Settings > API**
5. Copiez :
   - **Project URL** (ex: `https://xxxxxxxx.supabase.co`)
   - **anon public** key (commence par `eyJ...`)

### 2) Configurer le frontend (.env)

Dans `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3) Appliquer le schéma SQL

Via l'éditeur SQL Supabase :
1. Allez dans **SQL Editor**
2. Collez tout le contenu de `database/setup/supabase-setup.sql`
3. Cliquez sur **Run**
4. Vérifiez les tables : `profiles`, `tax_settings`, etc.

### 4) Rendre un utilisateur admin

1. Connectez-vous à l'application
2. Allez dans **Supabase > Table Editor > profiles**
3. Éditez votre ligne : `role` → `admin`
4. Sauvegardez

### 5) Structure des tables principales

| Table | Description |
|-------|-------------|
| `profiles` | Utilisateurs + rôle admin |
| `tax_settings` | Paramètres fiscaux (JSONB) |
| `issue_reports` | Rapports de bugs |

### 6) Sécurité (RLS)

- **Lecture** : tout utilisateur authentifié peut lire les settings
- **Écriture** : seul `profiles.role = 'admin'` peut écrire
- RLS activé sur toutes les tables

---

## 🗄️ Database & Scripts SQL

### Structure des scripts SQL

```text
database/
├── setup/           # Configuration initiale
│   ├── supabase-setup.sql     # Setup complet BDD
│   └── admin_setup.sql        # Création utilisateur admin
├── migrations/      # Scripts de migration
│   ├── create-ui-settings.sql
│   ├── create_issue_reports_table.sql
│   └── add-user-mode.sql
└── fixes/          # Scripts de correction
    ├── fix-profiles.sql
    ├── fix-ui-settings-duplicates*.sql
    ├── fix_issue_reports_table.sql
    └── check-ui-settings-rls.sql
```

### Utilisation

1. **Setup initial** : Exécuter `database/setup/supabase-setup.sql`
2. **Admin** : Exécuter `database/setup/admin_setup.sql`
3. **Migrations** : Appliquer dans l'ordre chronologique
4. **Fixes** : Appliquer selon besoin pour corriger des problèmes

### Bonnes pratiques

- Toujours tester les scripts sur un environnement de dev
- Garder un backup avant d'appliquer des fixes
- Documenter chaque script avec date et objectif

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- Compte Supabase

### Installation
```bash
# Cloner le repository
git clone [URL_REPO]
cd SER1

# Installer les dépendances
npm install

# Configurer les variables d'environnement
# Créer un fichier .env à la racine avec les variables suivantes :
# VITE_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...
```

### Variables d'environnement
Créer un fichier `.env` à la racine :
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxx
```

### Lancement
```bash
# Développement
npm run dev

# Build production
npm run build

# Tests
npm run test

# Linting
npm run lint

# Vérification types
npm run typecheck
```

---

## 🏗 Architecture détaillée

### Structure des pages
- **Login.jsx** : Authentification Supabase (email/mdp, reset, invitation)
- **Home.jsx** : Accueil avec tuiles de navigation
- **PlacementV2.jsx** : Simulateur de placement comparatif
- **Credit.jsx** : Simulateur de crédit (amortissable/in fine)
- **SettingsPage.jsx** : Configuration centrale avec navigation par pilules

### Moteurs de calcul (`src/engine/`)
- Calculs de placement et capitalisation
- Simulations de crédit et assurance
- Calculs fiscaux et transmission
- Génération d'exports Excel/PowerPoint

### Gestion des paramètres
- **Settings** : Navigation par pilules (Généraux, Impôts, Prélèvements, Fiscalités, Base contrats, Table mortalité, **Logo étude**)
- **Stockage Supabase** : Table `tax_settings` pour paramètres fiscaux, `user_metadata` pour logo
- **Logo** : Upload PNG/JPG → dataUri → stockage dans `user_metadata.cover_slide_url`
- **Rôles** : Admin (édition) vs User (lecture seule)

---

## 🔐 Authentification & Sécurité

### Flux d'authentification
- Connexion via Supabase Auth
- Rôle stocké dans `user_metadata.role`
- Deux rôles : `admin` et `user`

### Droits d'accès
- **Admin** : Modification et sauvegarde des paramètres
- **User** : Lecture seule (champs désactivés, bouton "Enregistrer" masqué)
- **RGPD** : Pas de stockage serveur des noms clients

---

## 🎨 Design & UX

### 🎯 Règles de couleurs

#### Règle fondamentale : Blanc autorisé
**Le blanc codé en dur (#FFFFFF, #fff, #ffffff) DOIT rester inchangé**

**Formats autorisés :**
- `#FFFFFF`, `#fff`, `#ffffff`, `white`

**Couleurs à remplacer (obligatoire) :**
- `#000000`, `#333`, `#555`, `#777`, `#888`, `#999` → `var(--color-c10)` ou `var(--color-c9)`
- Toutes les couleurs thématiques → variables CSS `var(--color-c1)` à `var(--color-c10)`

**Variables CSS disponibles :**
- `var(--color-c1)` : Couleur principale (texte, éléments importants)
- `var(--color-c2)` : Couleur secondaire (accents, actions)
- `var(--color-c7)` : Background principal (conteneurs)
- `var(--color-c8)` : Bordures et lignes
- `var(--color-c9)` : Texte secondaire/muted
- `var(--color-c10)` : Texte principal

### 📋 Principes UX

#### Zones éditables vs non-éditables
| Élément | Apparence | Raison |
|---------|-----------|--------|
| Champs texte/nombre/select | `background: #fff` | Signale l'édition possible |
| Labels | `color: var(--color-c9)` | Hiérarchie visuelle |
| Conteneurs/Cards | `background: var(--color-c7)` | Regroupement visuel |
| Tableaux (header) | `background: var(--color-c6)` | Distinction des en-têtes |
| Disabled inputs | `background: var(--color-c8)` | Signale l'impossibilité d'édition |

#### Accessibilité
- Contrastes vérifiés manuellement
- Tables sensibles avec `table-layout: fixed`
- Centrage obligatoire pour tables de transmission

---

## 📊 Fonctionnalités principales

### Simulateur Placement
- Comparaison de 2 placements (capitalisation/distribution)
- 3 phases : Épargne → Liquidation → Transmission
- Export Excel structuré (paramètres + résultats)
- Calculs détaillés avec warnings

### Simulateur IR
- Export Excel premium en 3 onglets : **Paramètres** (entrées + fiscal settings), **Synthèse impôts** (TMI, effort, graphiques), **Détails calculs** (tranches + IR final)
- Formats € / % homogènes, en-têtes stylés et colonnes ajustées (autoWidth, alignements, header gris clair)
- Génération `.xlsx` via `buildXlsxBlob()` (Zip/PK valide) + `validateXlsxBlob()` pour refuser toute archive corrompue

### Simulateur Crédit
- Crédit amortissable ou in fine
- Assurance CRD/CI intégrée pour tous les prêts (principal + additionnels)
- Lissage avec plusieurs prêts (mensualité constante ou durée constante)
- Tableaux d'amortissement mensuels/annuels avec colonnes assurance et capitaux décès
- Prêts additionnels (max 2) avec paramètres d'assurance individuels
- Calcul unifié des capitaux décès (source de vérité unique)
- Export PPTX Serenity : slide 3 = synthèse globale multi-prêts (histogrammes assurance + lissage), slides "prêt par prêt", annexe narrative, amortissement global paginé (fusion multi-prêts)
- Exports Excel et PowerPoint avec totaux tous prêts (Excel inclut capitaux décès)
- Export Excel **.xlsx valide** (fichier ZIP/PK, ouverture sans avertissement) — onglets : **Paramètres**, **Synthèse globale**, **Prêt 1**, **Prêt 2**, **Prêt 3** (si existants)
  - Formats monétaires/percent, largeurs figées, header contrasté
  - Blob binaire généré par `buildXlsxBlob()` (JSZip contrôlé) puis validé via `validateXlsxBlob()` avant téléchargement

### Gestion des données
- **Sauvegarde** : Fichier `.ser1` avec état complet
- **Chargement** : Restauration de tous les simulateurs
- **Réinitialisation** : Globale (accueil) ou ciblée (par page)
- **Exports** : Excel (implémenté), PowerPoint (implémenté avec logo intelligent)

---

## 🗄 Base de données Supabase

### Tables principales
- `tax_settings` : Paramètres fiscaux (JSON)
- `profiles` : Profils utilisateurs (rôles)
- `issue_reports` : Rapports de bugs

### Storage
- **Logos** : Stockés dans `user_metadata.cover_slide_url` (dataUri) - bypass RLS
- **Assets statiques** : Images chapitres et icônes dans `public/pptx/`
- Plus de bucket Storage pour logos (approche dataUri plus fiable)

### Fonctions Edge
- Gestion CORS pour l'admin
- Validation des accès

---

## 👥 Gestion Admin

### Rôle de la page `/settings/comptes`

Interface d'administration réservée aux utilisateurs avec rôle `admin` permettant de :
- **Gérer les comptes** : lister, créer (invitation), supprimer, réinitialiser mot de passe
- **Gérer les signalements** : voir les signalements non lus, afficher les détails, marquer comme lus

### Architecture de la sécurité

- **Edge Function unique "admin"** : Centralise toutes les opérations admin avec vérification JWT côté serveur
- **Pas de secret client** : Le `service_role_key` n'est jamais exposé dans le frontend
- **Maintenance** : Un seul point de déploiement et de monitoring

### Permissions admin
- ✅ **Peut faire** : CRUD utilisateurs, lire tous les signalements, marquer comme lu
- ❌ **Ne peut pas faire** : Modifier les signalements, voir les mots de passe, accéder aux données privées hors signalements

### Accès à la page
- Uniquement visible si `session.user.user_metadata.role === 'admin'`
- Route protégée dans `src/App.jsx`
- Vérification via hook `useUserRole()`

---

## 🧪 Tests

### Tests unitaires
- **44 tests** avec Vitest
- Couverture des moteurs de calcul
- Tests des utilitaires et services
- Validation des exports

### Lancement des tests
```bash
npm run test          # Exécution unique
npm run test:watch    # Mode watch
```

---

## 🚀 Déploiement

### Configuration Vercel
- Repo GitHub connecté à Vercel
- Déploiement automatique sur branche `main`
- Variables d'environnement configurées dans Vercel

### Processus de build
```bash
npm run build         # Génération du dossier dist/
```

### Environnement
- **Production** : https://ser1-simple.vercel.app
- **Développement** : localhost:5173

---

## 📋 Scripts utilitaires

### Scripts d'administration (`scripts/`)
- `admin-smoke.ps1` : Tests de fumée admin PowerShell
- `validate_ir_excel.mjs` : Validation exports IR

### Scripts SQL
- `database/setup/supabase-setup.sql` : Configuration initiale BDD
- `database/setup/admin_setup.sql` : Création utilisateur admin
- `database/migrations/` : Scripts de migration
- `database/fixes/` : Scripts de correction

---

## 🖼️ Assets & Médias

### Structure des assets statiques

```text
public/
├── ui/
│   └── login/
│       └── login-bg.png          # Fond d'écran page de connexion
└── pptx/
    ├── chapters/                 # Images chapitres PowerPoint (pré-traitées)
    ├── ch-01.png
    ├── ch-02.png
    └── ... (jusqu'à ch-09.png)
    └── icons/                    # Icônes PPTX (générées depuis src/icons/business/svg)
        ├── icon-money.svg
        ├── icon-bank.svg
        └── ... (12 icônes business)
```

### Règles de nommage

- **Images chapitres** : `ch-01.png` à `ch-10.png` (PNG recommandé, pré-traitées)
- **Icônes** : Noms descriptifs en minuscules (ex: `icon-money.svg`, `icon-bank.svg`)
- **UI** : Contexte fonctionnel (ex: `login-bg.png`)

### Recommandations techniques

| Type | Format | Qualité | Taille recommandée |
|------|--------|---------|--------------------|
| Images chapitres | PNG (pré-traitées) | - | Ratio 3:4, coins arrondis, saturation ~30% |
| Icônes | SVG (préféré) ou PNG | - | 32-64px |
| Fond d'écran | JPG/PNG | 85% | 1920×1080px minimum |

### Distinction importante

- **Assets statiques** (`public/pptx/*`) : Images fixes intégrées dans l'application
- **Logos dynamiques** (user_metadata) : Logos uploadés par les admins stockés en dataUri

### Restrictions

- ❌ **Aucun screenshot** dans le repository (docs/ ou racine)
- ❌ **Aucune image** à la racine du repo
- ❌ **dist/ jamais versionné** (build artifacts)
- ✅ **9 images chapitres** et **12 icônes business** actuellement disponibles

---

## 🎯 Icônes Business (UI + Exports PPTX)

### Structure des icônes

```text
src/icons/business/
├── _raw/           # SVG bruts depuis PowerPoint (Image1.svg ... Image12.svg)
├── svg/            # SVG normalisés et renommés
└── businessIconLibrary.ts  # Library TypeScript
```

### Workflow d'intégration

1. **Déposer les SVG bruts** : Placez les 12 fichiers `Image1.svg` ... `Image12.svg` dans `src/icons/business/_raw/`

2. **Générer les icônes normalisées** :
   ```bash
   npm run icons:build
   ```

3. **Résultat** : Les SVG normalisés sont générés dans :
   - `src/icons/business/svg/` (pour l'UI)
   - `public/pptx/icons/` (pour les exports PPTX)

### Mapping des icônes

| Fichier original | Nom normalisé | Usage |
|------------------|---------------|-------|
| Image1.svg | icon-money.svg | Argent/finance |
| Image2.svg | icon-cheque.svg | Chèques/paiements |
| Image3.svg | icon-bank.svg | Banque/établissements |
| Image4.svg | icon-calculator.svg | Calculatrices/comptes |
| Image5.svg | icon-checklist.svg | Listes/tâches |
| Image6.svg | icon-buildings.svg | Immeubles/propriétés |
| Image7.svg | icon-gauge.svg | Indicateurs/métriques |
| Image8.svg | icon-pen.svg | Écriture/signatures |
| Image9.svg | icon-chart-down.svg | Graphiques baissiers |
| Image10.svg | icon-chart-up.svg | Graphiques haussiers |
| Image11.svg | icon-balance.svg | Balance/justice |
| Image12.svg | icon-tower.svg | Tour/protection |

### Utilisation dans l'UI

```jsx
import { BusinessIcon } from '@/components/ui/BusinessIcon';

// Usage basique
<BusinessIcon name="bank" size={18} />

// Avec couleur personnalisée
<BusinessIcon name="money" size={24} color="#3F6F63" />

// Avec variable CSS
<BusinessIcon name="calculator" size={20} color="var(--color-c2)" />
```

### Utilisation dans les exports PPTX

```typescript
import { getBusinessIconDataUri } from '@/icons/business/businessIconLibrary';

// Pour PPTXGenJS
const iconDataUri = getBusinessIconDataUri('bank', { color: '#3F6F63' });
slide.addImage({
  data: iconDataUri,
  x: 1, y: 1, w: 0.5, h: 0.5
});
```

### Caractéristiques techniques

- **Format** : SVG normalisés avec `fill="currentColor"`
- **Scalable** : Taille infinie sans perte de qualité
- **Thème-compatible** : S'adapte automatiquement aux couleurs du thème
- **Idempotent** : Le script peut être relancé sans risque
- **Zéro dépendance** : Utilise uniquement les APIs natives

---

## 📖 Images Chapitres (Assets PPTX)

### Structure des images chapitres

```text
config/assets/_style_ref/
└── pptx_chapters_raw/           # Images brutes originales (sources)

public/pptx/
└── chapters/                    # Images finalisées prêtes PPTX
    ├── ch-01.png
    ├── ch-02.png
    └── ... (jusqu'à ch-09.png)
```

### Workflow de traitement

1. **Déposer les brutes** : Placez les images originales dans `config/assets/_style_ref/pptx_chapters_raw/`

2. **Traiter les images** : Appliquer le traitement nécessaire :
   - **Format** : PNG avec fond transparent (coins arrondis)
   - **Ratio** : Portrait 3:4 (ex: 1200×1600px)
   - **Saturation** : ~30% (désaturées pour intégration PPTX)
   - **Recadrage** : Centré sans déformation

3. **Placer les finalisées** : Copiez les images traitées dans `public/pptx/chapters/` avec le naming `ch-01.png` ... `ch-09.png`

### Utilisation dans les exports PPTX

```typescript
// Les images chapitres sont "prêtes à poser" - aucune transformation nécessaire
slide.addImage({
  path: '/pptx/chapters/ch-01.png',
  x: 0.5, y: 0.5, w: 4, h: 5.33  // Ratio 3:4 respecté
});
```

### Caractéristiques techniques

- **Pré-traitées** : Coins arrondis, saturation ajustée, ratio fixe
- **Optimisées PPTX** : Utilisation directe sans traitement en code
- **Scalables** : Haute résolution pour impression si nécessaire
- **Thème-neutres** : Désaturées pour s'intégrer à tous les thèmes

---

## 🎯 PPTX Exports — Serenity (Programmatic)

### Limitation PptxGenJS

**Important** : PptxGenJS ne peut pas ouvrir/éditer des fichiers PPTX existants. Le template Serenity est donc **reconstruit programmatiquement** en code, reproduisant fidèlement les coordonnées, couleurs et typographies du template original.

### Architecture

```text
src/pptx/
├── designSystem/
│   └── serenity.ts              # Design system (coords, typo, radius, helpers)
├── theme/
│   ├── types.ts                 # Types TypeScript
│   └── getPptxThemeFromUiSettings.ts  # Mapping UI → PPTX theme
├── assets/
│   └── resolvePublicAsset.ts    # Chargement assets /public
├── logo/
│   └── loadLogoDataUri.ts       # Chargement logo depuis dataUri
├── icons/
│   └── addBusinessIcon.ts       # Injection icônes business
├── slides/
│   ├── buildCover.ts            # Slide couverture
│   ├── buildChapter.ts          # Slide chapitre (image gauche + accent line)
│   ├── buildContent.ts          # Slide contenu
│   ├── buildEnd.ts              # Slide mentions légales
│   └── index.ts
├── presets/
│   └── irDeckBuilder.ts         # Builder deck IR avec KPIs
└── export/
    ├── exportStudyDeck.ts       # Orchestrateur principal
    ├── demoExport.ts            # Fonction démo pour tests
    └── index.ts
```

### Types de slides

| Type | Builder | Description |
|------|---------|-------------|
| **COVER** | `buildCover()` | Fond color1, logo, titre/sous-titre centrés, marques d'angle |
| **CHAPTER** | `buildChapter()` | Panneau blanc arrondi, image chapitre à gauche, **accent line sous titre** |
| **CONTENT** | `buildContent()` | Titre/sous-titre, contenu, icônes business optionnelles |
| **END** | `buildEnd()` | Fond color1, mentions légales, marques d'angle diagonales |

### Mapping des couleurs

Le template Serenity utilise **les couleurs du thème** + blanc :

| Rôle PPTX | Source UI | Usage |
|-----------|-----------|-------|
| `bgMain` | `color1` | Fond couverture et slide end |
| `textMain` | `color1` | Titres sur fond clair |
| `textOnMain` | Auto | Texte sur fond coloré (blanc si sombre, noir si clair) |
| `accent` | `color6` | Lignes décoratives, marques d'angle |
| `textBody` | `color10` | Corps de texte |
| `panelBorder` | `color8` | Bordure panneau chapitre (couleur douce) |
| `white` | `#FFFFFF` | Seule couleur hardcodée autorisée |

**Règle stricte** : Aucune couleur hex codée en dur sauf blanc (#FFFFFF).

### Design Tokens

#### Radius et Bleed (élimination des trous aux coins)

```typescript
export const RADIUS = {
  panel: 0.12,    // Radius panneau chapitre
  imageAdj: 0.12, // Radius image (identique pour cohérence)
};

export const BLEED = {
  image: 0.02,    // Débordement image sous la bordure (élimine le "trou" anti-aliasing)
};

export const CORNER_MARKS = {
  size: 0.65,           // Taille du groupe
  marginX: 0.75,        // Marge horizontale depuis le bord
  marginY: 0.75,        // Marge verticale depuis le bord
  lineSpacing: 0.12,    // Espacement entre les 2 lignes verticales
  primaryHeight: 0.55,  // Hauteur ligne principale
  secondaryHeight: 0.40,// Hauteur ligne secondaire
};
```

#### Layout Contract (zones strictes)

```typescript
export const LAYOUT_ZONES = {
  chapter: {
    titleBox: { x: 4.9909, y: 0.9223, w: 7.3319, h: 0.8663 },
    subtitleBox: { x: 4.9909, y: 1.9535, w: 7.3319, h: 0.6 },
    bodyBox: { x: 4.9909, y: 2.6, w: 7.3319, h: 3.6 },
  },
  // ... autres layouts
};

export const MIN_FONT_SIZES = { h1: 18, h2: 12, body: 10 };
```

**Règles absolues** :
- Aucun texte/icône dans les zones `titleBox` ou `subtitleBox` sauf placeholders prévus
- Aucun débordement hors slide (text fitting automatique si nécessaire)

### Slides Chapter — Spécificités

**Ordre de dessin (z-order)** — l'image est AU-DESSUS du cadre :
1. **Panneau + Ombre** : 1 seul `roundRect` avec shadow native PPTXGenJS
2. **Image ON TOP** : Dessinée EN DERNIER avec **BLEED** (0.02") pour couvrir les gaps

**Composant UI Kit** : `addCardPanelWithShadow(slide, rect, theme, radius)`

```typescript
// UNE SEULE shape avec shadow native (pas de simulation multi-couches)
slide.addShape('roundRect', {
  fill: { color: 'FFFFFF' },           // Fill blanc
  line: { color: panelBorder, width: 0.75 }, // Contour couleur 8
  shadow: {
    type: 'outer',
    angle: 74,      // Direction ombre
    blur: 23,       // Flou en pt
    offset: 14,     // Distance en pt
    opacity: 0.24,  // 24% opacité
    color: shadowBase // Dérivée de textMain
  }
});
```

- **Ombre native** : Outer shadow PPTXGenJS (24% opacity, 23pt blur, 14pt offset, 74°)
- **Fill** : Blanc (#FFFFFF)
- **Bordure** : Couleur 8 du thème (`panelBorder`), épaisseur 0.75pt
- **Image** : PNG pré-traité avec coins arrondis, AU-DESSUS du cadre (z-order)
- **Bleed** : L'image déborde de 0.02" pour éliminer le "trou" aux coins

> **Important** : Plus aucune simulation multi-cadres. 1 seul roundRect avec shadow native.

### Slide End — Disclaimer légal

Le bloc légal utilise le texte exact suivant :

> Document établi à titre strictement indicatif et dépourvu de valeur contractuelle. Il a été élaboré sur la base des dispositions légales et réglementaires en vigueur à la date de sa remise, lesquelles sont susceptibles d'évoluer.
>
> Les informations qu'il contient sont strictement confidentielles et destinées exclusivement aux personnes expressément autorisées.
>
> Toute reproduction, représentation, diffusion ou rediffusion, totale ou partielle, sur quelque support ou par quelque procédé que ce soit, ainsi que toute vente, revente, retransmission ou mise à disposition de tiers, est strictement encadrée. Le non-respect de ces dispositions est susceptible de constituer une contrefaçon engageant la responsabilité civile et pénale de son auteur, conformément aux articles L335-1 à L335-10 du Code de la propriété intellectuelle.

**Mise en forme** : Arial 11pt, **alignement centré** (horizontal et vertical), interligne 1.15.

### Corner Marks (marques d'angle) — Symétrie

Les barres verticales sur la slide de fin sont positionnées de manière parfaitement symétrique :

```typescript
// Top right: x = slideWidth - marginX - size, y = marginY
// Bottom left: x = marginX, y = slideHeight - marginY - size
```

Cela garantit des marges identiques depuis les bords de la slide.

### Thème PowerPoint (clrScheme)

Le PPTX exporté embarque un **vrai thème PowerPoint** avec les 10 couleurs utilisateur :

| Slot PowerPoint | Couleur SER1 |
|-----------------|---------------|
| dk1 | c10 (texte principal) |
| lt1 | #FFFFFF (blanc) |
| dk2 | c1 (couleur marque) |
| lt2 | c7 (fond clair) |
| accent1-6 | c2, c3, c4, c5, c6, c8 |
| hlink/folHlink | c9 (liens) |

L'utilisateur voit ses couleurs dans **PowerPoint > Couleurs du thème**.

### Option Thème PPTX

Le `ThemeProvider` expose `pptxColors` qui respecte le paramètre utilisateur :
- **"Appliquer à toute l'interface et aux PowerPoint"** → Utilise les couleurs personnalisées
- **"Appliquer à l'interface uniquement"** → Utilise les couleurs SER1 Classique pour le PPTX

### API d'export

#### Export complet
```typescript
import { exportStudyDeck, downloadPptx } from '@/pptx/export';

const spec: StudyDeckSpec = {
  cover: {
    type: 'cover',
    title: 'Simulation IR',
    subtitle: 'NOM Prénom',
    logoDataUri: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
    leftMeta: '17 janvier 2026',
    rightMeta: 'Conseiller CGP',
  },
  slides: [
    {
      type: 'chapter',
      title: 'Objectifs et contexte',
      subtitle: 'Description courte',
      chapterImageIndex: 1,
    },
    {
      type: 'content',
      title: 'Synthèse',
      subtitle: 'Indicateurs',
      body: 'Contenu...',
      icons: [{ name: 'money', x: 1.5, y: 1.2, w: 0.8, h: 0.8, colorRole: 'accent' }],
    },
  ],
  end: {
    type: 'end',
    legalText: '...',
  },
};

// Export avec thème utilisateur (format ThemeProvider: c1..c10)
const blob = await exportStudyDeck(spec, pptxColors);
downloadPptx(blob, 'simulation.pptx');
```

### Typographie

- **Font** : Arial uniquement
- **H1** : 24pt, bold, ALL CAPS
- **H2** : 16pt, bold
- **Body** : 14pt, normal
- **Footer** : 8pt, normal
- **Legal** : 11pt, normal, interligne 1.15

### Coordonnées exactes (inches)

#### Cover (13.3333" × 7.5")
- Logo : Positionnement dynamique avec **alignement bas 1.5cm sous centre**
  - **Règles** : Pas d'agrandissement, ratio préservé, réduction uniforme si nécessaire
  - **Calcul** : Bas du logo à 3.1594" (1.5cm sous centre slide à 3.75")
  - **Centrage** : Horizontal centré dans zone 4.3646"×1.9896"
- Titre : x=1.5528, y=4.0986, w=10.2277, h=0.8333
- Date (gauche, aligné gauche) : x=0.9784, y=6.0417
- Conseiller (droite, aligné droite) : x=9.4903, y=6.0417

#### Chapter
- Panneau : x=0.5966, y=0.7347, w=12.14, h=5.8704
- Image : x=0.5966, y=0.7347, w=4.2424, h=5.8704
- Titre : x=4.9909, y=0.9223, w=7.3319, h=0.8663
- Accent line : x=5.0818, y=1.7886, w=1.1278

#### Footer
- Date : x=0.9167, y=6.9514, w=1.6875, h=0.3993
- Disclaimer : x=2.9792, y=6.9514, w=7.375, h=0.3993
- Slide num : x=10.7292, y=6.9514, w=1.6875, h=0.3993

### Tests et validation

```bash
npm run typecheck   # Vérifie les types
npm run build       # Vérifie la compilation
```

#### Test manuel
1. Ouvrir la console navigateur (F12)
2. Exécuter : `window.exportSerenityDemoPptx()`
3. Vérifier le fichier PPTX téléchargé :
   - Cover : couleurs thème, logo positionné avec bas aligné 1.5cm sous centre, date alignée gauche, conseiller aligné droite
   - Chapter : accent line sous titre, coins arrondis harmonisés
   - End : disclaimer complet, fond coloré, texte adaptatif

---

## � Slide 3 IR - Synthèse Fiscale Premium

### Architecture anti-overlap

La slide de synthèse IR utilise un **layout à zones strictes** pour garantir aucun chevauchement :

```typescript
// ZONE ALLOCATION (total ~4.4")
// - KPIs:     Y 2.38 → 3.55 (1.17")
// - TMI Bar:  Y 3.65 → 4.15 (0.50") 
// - Callout:  Y 4.20 → 4.50 (0.30") - SECONDARY info
// - HERO:     Y 4.70 → 5.50 (0.80") - PRIMARY result
// - Margin:   Y 5.60 → 5.85 (0.25") - tertiary info
// - Buffer:   Y 5.85 → 6.80 (safety margin to footer)
```

### Hiérarchie visuelle

| Niveau | Élément | Style | Objectif |
|--------|---------|-------|----------|
| **HERO** | Montant impôt | 26pt bold, centré | **Impossible à rater** |
| **SECONDARY** | Part revenu TMI | 9pt italic, centré | Info contextuelle |
| **TERTIARY** | Marge avant TMI | 9pt italic, discret | Complément |

### KPIs compacts

- **4 colonnes alignées** : Revenus, Revenu imposable, Parts, TMI
- **Icônes accent** : Utilisation du thème couleur
- **Couples** : Format inline `D1: X € | D2: Y €`
- **Personnes seules** : Montant unique

### Barre TMI dégradé

- **Gradient progressif** : 0% (25% intensité) → 45% (100% intensité)
- **Segment actif** : Bordure blanche 2.5pt
- **Texte adaptatif** : Blanc sur fonds foncés (30%+)

### Sécurité anti-overlap

```typescript
const SAFETY_CHECK = {
  lastElementEndY: LAYOUT.marginInfo.endY,
  footerStartY: CONTENT_BOTTOM_Y,
  safetyMargin: CONTENT_BOTTOM_Y - LAYOUT.marginInfo.endY, // > 0.5"
};
```

### Fichiers concernés

- **Builder** : `src/pptx/slides/buildIrSynthesis.ts`
- **Design system** : `src/pptx/designSystem/serenity.ts`
- **Export** : `src/pptx/export/exportStudyDeck.ts`

---

## 💳 Slide Crédit - Synthèse Premium (Multi-Prêts)

### Structure du deck Crédit

Le deck Crédit supporte les montages **multi-prêts** (jusqu'à 3 prêts) avec **lissage** optionnel :

**Mono-prêt (1 prêt) :**
```
1. Cover          → "Simulation Crédit Immobilier" + NOM Prénom
2. Chapter 1      → "Votre projet de financement"
3. Synthesis      → 4 KPIs + HERO (Coût total) + barre Capital/Coût
4. Chapter 2      → "Annexes"
5. Annexe         → Explication rédigée style ingénieur patrimonial
6+ Amortization   → Tableau années en colonnes (paginé si > 8 ans)
N. End            → Mentions légales crédit
```

**Multi-prêts (2-3 prêts) :**
```
1. Cover          → "Simulation Crédit Immobilier" + NOM Prénom
2. Chapter 1      → "Votre montage multi-prêts"
3. Global Synth   → Vue d'ensemble multi-prêts + timeline paliers + badge lissage
4. Loan 1 Synth   → Synthèse Prêt N°1 (détail)
5. Loan 2 Synth   → Synthèse Prêt N°2 (si existe)
6. Loan 3 Synth   → Synthèse Prêt N°3 (si existe)
7. Chapter 2      → "Annexes"
8. Annexe         → Global + per-loan + lissage (prose patrimoniale)
9+ Amortization   → Tableau multi-prêts (paginé)
N. End            → Mentions légales crédit
```

### Slide Synthèse Globale (Multi-Prêts) - Design Premium

Layout reproduisant fidèlement la maquette de référence :

| Zone | Contenu | Style |
|------|---------|-------|
| **HERO** | "VOTRE MENSUALITÉ" + valeur | 28pt bold, centré |
| **KPIs** | Capital total, Durée max, Coût total | 3 colonnes icônes (money, gauge, chart-up) |
| **Timeline Paliers** | Jusqu'à 3 segments (vert foncé/moyen/clair) + dates au-dessus | Mensualité dans chaque segment |
| **Barres grises** | 1 barre par année sur durée totale (ex: 20 barres = 20 ans) | Sous la timeline |
| **Bottom row** | 3 icônes : buildings, checklist, balance | Aligné en bas |

#### Icônes business utilisées

Toutes les icônes proviennent de `src/icons/business/svg` :
- **money** : Capital total
- **gauge** : Durée maximale
- **chart-up** : Coût total
- **buildings** : Total remboursé
- **checklist** : Lissage
- **balance** : Assurance décès

#### Palette 3 segments (dérivée thème)
- **Segment 1** : `bgMain` (vert foncé) - texte blanc
- **Segment 2** : `lighten(bgMain, 25%)` (vert moyen) - texte blanc
- **Segment 3** : `lighten(bgMain, 50%)` (vert clair) - texte textMain

### Langue fr-FR

Tous les textes PPTX utilisent `lang: 'fr-FR'` pour la vérification orthographique française dans PowerPoint :
- Appliqué via le helper `addTextBox()` (paramètre automatique)
- Également sur les `slide.addText()` directs dans les builders

### Slides Chapitre (IR + Crédit)

Les slides chapitre utilisent maintenant un wording distinct pour éviter la répétition :
- **subtitle** : Description courte du chapitre (ex: "Vue d'ensemble de votre crédit")
- **body** : Objectif client (ex: "Vous souhaitez mesurer l'efficacité de votre financement...")

### Slide Synthèse Par Prêt

Même layout que la synthèse mono-prêt, avec titre "SYNTHÈSE PRÊT N°X" :

| Zone | Contenu | Style |
|------|---------|-------|
| **KPIs** | Capital, Durée, Taux, Mensualité | 4 colonnes icônes |
| **Visual** | Barre Capital vs Coût | Split bar proportionnelle |
| **HERO** | Coût total du prêt | 24pt bold, centré |

### Annexe Multi-Prêts (style ingénieur patrimonial)

L'annexe utilise un style professionnel avec phrases complètes :
- **Introduction** : Présentation du montage (capital total, durée, nombre de prêts)
- **Détail par prêt** : Caractéristiques complètes (capital, durée, taux, mensualité, coût)
- **Lissage** (si activé) : Explication pédagogique du mécanisme
- **Coûts globaux** : Intérêts + Assurance + Total remboursé
- **Avertissement** : Mention légale complète

### Tableau d'Amortissement Combiné Multi-Prêts

Structure reproduisant fidèlement la maquette de référence :

1. **Section GLOBALE d'abord** (fond blanc/alterné, police 9) :
   - Annuité globale (hors ass.) - bold
   - Intérêts - regular
   - Assurance - regular
   - Capital amorti - regular
   - CRD fin d'année - bold, fond vert clair

2. **Sections par prêt ensuite** (fond gris, police 8) :
   - Prêt N°X Annuité (hors ass.) - bold
   - Assurance
   - Capital amorti
   - CRD fin de période

- **Pagination** : Max 8 années par slide (1/2, 2/2, etc.)
- **Hauteur lignes** : 0.28" (resserrées)
- **Style** : En-tête vert foncé, sections prêts sur fond gris

### Fichiers concernés

- **Builders** :
  - `src/pptx/slides/buildCreditSynthesis.ts` (mono-prêt legacy)
  - `src/pptx/slides/buildCreditGlobalSynthesis.ts` (multi-prêts)
  - `src/pptx/slides/buildCreditLoanSynthesis.ts` (per-loan)
  - `src/pptx/slides/buildCreditAnnexe.ts` (multi-loan aware)
  - `src/pptx/slides/buildCreditAmortization.ts`
- **Deck builder** : `src/pptx/presets/creditDeckBuilder.ts`
- **Types** : `src/pptx/theme/types.ts` (LoanSummary, PaymentPeriod, CreditGlobalSynthesisSlideSpec, etc.)

### Source des données

Les valeurs PPTX proviennent **exactement** de `Credit.jsx` (source de vérité UI) :

```typescript
// ✅ Multi-prêts : Aggrégation correcte
totalCapital: effectiveCapitalPret1 + pretsPlus.reduce((s, p) => s + toNum(p.capital), 0),
loans: [{ index: 1, capital: effectiveCapitalPret1, ... }, ...pretsPlus.map(...)],
paymentPeriods: synthesePeriodes.map(...),
smoothingEnabled: lisserPret1 && pretsPlus.length > 0,
smoothingMode: lissageMode,
```

### Logo Cover

Le logo est chargé depuis `user_metadata.cover_slide_url` (même source que IR) via `useTheme()` :

```typescript
const { colors: themeColors, logo, setLogo } = useTheme()
// ...
const deck = buildCreditStudyDeck(creditData, pptxColors, exportLogo)
```

---

## 📊 Structure PPTX - Modèle réutilisable

Le système de génération PowerPoint suit une architecture modulaire permettant de créer des présentations pour différents simulateurs.

### Types de slides disponibles

| Type | Description | Fichier Builder |
|------|-------------|-----------------|
| **Cover** | Page de garde avec logo, titre, date et conseiller | `buildCover.ts` |
| **Chapter** | Page de chapitre avec image et titre | `buildChapter.ts` |
| **Content** | Page de contenu avec visuels (KPIs, graphiques) | `buildContent.ts` |
| **IR Synthesis** | Synthèse IR (KPIs + barre TMI + impôt) | `buildIrSynthesis.ts` |
| **IR Annexe** | Détail calcul IR rédigé | `buildIrAnnexe.ts` |
| **Credit Synthesis** | Synthèse Crédit mono-prêt (KPIs + HERO + barre Capital/Coût) | `buildCreditSynthesis.ts` |
| **Credit Global Synthesis** | Synthèse multi-prêts (timeline + split bar + lissage) | `buildCreditGlobalSynthesis.ts` |
| **Credit Loan Synthesis** | Synthèse par prêt (Prêt N°1/2/3) | `buildCreditLoanSynthesis.ts` |
| **Credit Annexe** | Détail crédit multi-prêts + lissage (prose patrimoniale) | `buildCreditAnnexe.ts` |
| **Credit Amortization** | Tableau amortissement paginé (années en colonnes) | `buildCreditAmortization.ts` |
| **End** | Slide de fin avec mentions légales | `buildEnd.ts` |

### Enchaînement type d'un deck

```
1. Cover        → Présentation cabinet + client
2. Chapter 1    → Introduction (image thématique)
3. Content      → Données clés visuelles (KPIs, barres)
4. Chapter 2    → Annexe (image thématique)
5. Annexe       → Explication rédigée personnalisée
6. End          → Mentions légales + coordonnées
```

### Zones protégées (NON MODIFIABLES)

- **Header** : Titre (H1 CAPS), sous-titre (H2), accent line
- **Footer** : Date, disclaimer, numéro de slide

#### Fonction centralisée `addHeader()`

Toutes les slides avec header standard utilisent la fonction centralisée `addHeader()` :

```typescript
addHeader(slide, titleText, subtitleText, theme, 'content' | 'chapter');
```

**Comportement** :
- **Normalisation titre** : Force le titre sur UNE SEULE LIGNE (remplace `\n` par espace, collapse espaces multiples)
- **Position barre** : Centrée entre le bas du TEXTE du titre et le haut du sous-titre
- **Sous-titre** : Toujours positionné sous la barre avec gap minimum

**Mode debug** : Activer `DEBUG_LAYOUT_ZONES = true` dans `serenity.ts` pour :
- Afficher des bordures rouges autour des zones titre/sous-titre
- Afficher une ligne verte au niveau du bas du texte titre
- Afficher une ligne bleue au niveau de la barre d'accent
- Logger les positions calculées dans la console

### Zone contenu (MODIFIABLE)

Tout élément ajouté doit respecter :
- **Y min** : `CONTENT_TOP_Y` (après accent line sous-titre)
- **Y max** : `CONTENT_BOTTOM_Y` (avant footer)
- **Pas de chevauchement** avec header/footer

### Règles de style

- **Police** : Arial uniquement
- **Couleurs** : Thème dynamique (`color1` à `color10`), blanc autorisé
- **Pas de hardcoded colors** sauf blanc (`FFFFFF`)

### Création d'un nouveau simulateur

1. Créer un `build[Simulator]Synthesis.ts` pour la slide de synthèse
2. Créer un `build[Simulator]Annexe.ts` pour l'explication rédigée
3. Créer un `[simulator]DeckBuilder.ts` pour assembler le deck
4. Ajouter les types dans `theme/types.ts`
5. Connecter dans `exportStudyDeck.ts`

### Cohérence données UI ↔ PPTX

**Règle critique** : Les valeurs affichées dans le PPTX doivent provenir de la **même source** que l'UI web.

```typescript
// ✅ CORRECT : Réutiliser les champs calculés côté UI
tmiBaseGlobal: result.tmiBaseGlobal,
tmiMarginGlobal: result.tmiMarginGlobal,
pfuIr: result.pfuIr,

// ❌ INCORRECT : Recalculer dans le PPTX builder
// Risque de divergence avec l'UI
```

---

## �� Documentation complémentaire

### Fichiers de documentation
- `ADMIN_COMPTES_ET_SIGNALMENTS.md` : Gestion admin
- `CSS_COLOR_RULES.md` : Règles couleurs
- `DIAGNOSTIC_TMI_FIX.md` : Diagnostics techniques
- `UX_RECOMMENDATIONS.md` : Recommandations UX

### Documentation
- Fichiers techniques dans la racine (`.md`)
- Exemples d'exports dans `docs/` (fichiers Excel/PowerPoint)
- Brainstorming sessions documentées

---

## 🔮 Évolutions prévues

### Court terme
- ✅ Simulateur d'impôt sur le revenu complet (implémenté)
- ✅ Génération PowerPoint automatique (implémentée)
- Centralisation composants UI (design system)

### Moyen terme
- Validation métier renforcée
- Tests E2E automatisés
- Monitoring et analytics

### Long terme
- Multi-cabinet
- API externes intégrées
- Mobile app

---

## 🐛 Débuggage & Maintenance

### Logo Management
- Upload via Settings page (PNG/JPG) with **aspect ratio preservation**
- Storage as **dataUri in user_metadata** (bypasses Storage RLS issues)
- **Smart sizing algorithm** : No upscale, ratio preserved, uniform downscale if needed
- **Precise positioning** : Bottom edge aligned 1.5cm below slide center
- **Synchronous dimension extraction** : PNG/JPEG header parsing for accurate sizing
- Immediate availability for PPTX export after upload
- RLS protection through user_metadata (no Storage bucket needed)

### Logs et monitoring
- Console browser pour le frontend
- Logs Supabase pour l'authentification
- Rapports de bugs via `issue_reports`

### Procédures de fix
- Diagnostic dans fichiers `*_FIX.md`
- Scripts SQL de correction
- Tests de régression

---

## 👥 Équipe & Contributing

### Rôles
- **Développeur frontend** : React/TypeScript/CSS
- **Admin Supabase** : Gestion BDD et authentification
- **CGP** : Validation métier et calculs

### Contributing
1. Créer une branche feature
2. Implémenter avec tests
3. Validation par CGP
4. Merge via PR sur main

---

*Ce document est maintenu à jour avec chaque évolution majeure du projet.*
