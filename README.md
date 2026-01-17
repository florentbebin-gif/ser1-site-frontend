# SER1 — Audit Patrimonial Express + Stratégie Guidée

Application web interne pour CGP permettant :
- la **connexion sécurisée des utilisateurs** (admin / user),
- l'**audit patrimonial complet** (6 étapes : famille, civil, actifs, passif, fiscalité, objectifs),
- la **stratégie guidée** avec recommandations automatiques et projections comparées,
- l'accès à plusieurs **simulateurs financiers** (IR, placement, crédit),
- la **sauvegarde et le chargement de dossiers complets** en local,
- la **gestion centralisée de paramètres** (fiscalité, couleurs, logo d'étude),
- la **conformité RGPD** (pas de stockage serveur des noms clients, export/import JSON local).

✅ Projet **100 % frontend**  
✅ Basé sur **React 18 + TypeScript + Vite 5 + Supabase**  
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
│   ├── 📁 supabase/                # Config Supabase locale
│   │   ├── 📄 config.toml         # Config projet Supabase
│   │   ├── 📁 functions/          # Fonctions edge
│   │   └── 📁 .temp/              # Fichiers temporaires
│   └── 📁 assets/                  # Assets de référence
│       ├── 📁 _signalements_ref/
│       └── 📁 _style_ref/
│
├── 📁 docs/                       # Documentation et exports
│   ├── 📄 *.xlsx                  # Fichiers Excel exemples
│   └── 📄 brainstorming-session-results.md
│
├── � scripts/                    # Scripts utilitaires
│   ├── 📄 admin-smoke.ps1         # Script admin PowerShell
│   └── 📄 validate_ir_excel.mjs   # Validation exports IR
│
├── 📁 public/                     # Fichiers statiques
│   ├── 📁 ui/                      # Assets UI
│   │   └── 📁 login/
│   │       └── 📄 login-bg.png    # Fond d'écran login
│   └── 📁 pptx/                    # Assets PowerPoint
│       ├── 📁 chapters/            # Images chapitres (max 10)
│       └── 📁 icons/                    # Icônes PPTX (générées depuis src/icons/business/svg)
├── 📁 dist/                       # Build de production
├── 📁 node_modules/               # Dépendances npm
├── 📁 .vscode/                    # Configuration VS Code
├── 📁 .windsurf/                  # Configuration Windsurf
│
├── 📄 *.sql                       # Scripts SQL Supabase
└── 📄 *.md                        # Documentation technique

---

## 🛠 Stack technique

### Frontend
- **React 18** avec TypeScript
- **Vite 5** comme bundler
- **CSS natif** (pas de framework UI)
- **React Router DOM** pour la navigation
- **Supabase Client** pour l'authentification et BDD
- **PPTXGenJS** pour la génération PowerPoint
- **Zod** pour la validation des données

### Backend & Services
- **Supabase** (authentification + base de données + storage)
- **Aucun backend applicatif dédié**

### Outils de développement
- **ESLint** avec configuration React/TypeScript
- **Vitest** pour les tests unitaires
- **PowerShell** pour les scripts d'administration

---

## 🛠 Setup Supabase

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
| `profiles` | Profils utilisateurs (rôles) |
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
cp .env.example .env
# Éditer .env avec vos clés Supabase
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
- **Settings** : Navigation par pilules (Généraux, Impôts, Prélèvements, Fiscalités, Base contrats, Table mortalité)
- **Stockage Supabase** : Table `tax_settings` pour tous les paramètres fiscaux
- **Storage** : Logos pour page de garde PowerPoint
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

### Simulateur Crédit
- Crédit amortissable ou in fine
- Assurance CRD/CI intégrée
- Lissage avec plusieurs prêts
- Tableaux d'amortissement mensuels/annuels

### Gestion des données
- **Sauvegarde** : Fichier `.ser1` avec état complet
- **Chargement** : Restauration de tous les simulateurs
- **Réinitialisation** : Globale (accueil) ou ciblée (par page)
- **Exports** : Excel (implémenté), PowerPoint (prévu)

---

## 🗄 Base de données Supabase

### Tables principales
- `tax_settings` : Paramètres fiscaux (JSON)
- `profiles` : Profils utilisateurs (rôles)
- `issue_reports` : Rapports de bugs

### Storage
- Bucket pour logos page de garde PowerPoint
- Accès protégé par RLS (Row Level Security)

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
- **Covers dynamiques** (Supabase Storage) : Logos uploadés par les admins dans `{user.id}/page_de_garde.{ext}`

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
│   └── loadLogoDataUri.ts       # Chargement logo Supabase
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
    logoUrl: 'https://supabase.../logo.png',
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
- Logo : x=4.4844, y=1.9542, w=4.3646, h=1.9896
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
   - Cover : couleurs thème, date alignée gauche, conseiller aligné droite
   - Chapter : accent line sous titre, coins arrondis harmonisés
   - End : disclaimer complet, fond coloré, texte adaptatif

---

## 📚 Documentation complémentaire

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
- Automatic insertion on PPTX cover slides with **contain sizing** (no deformation)
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
