# SER1 — Audit Patrimonial Express + Stratégie Guidée

Application web interne pour CGP permettant :
- la **connexion sécurisée des utilisateurs** (admin / user),
- l'**audit patrimonial complet** (6 étapes : famille, civil, actifs, passif, fiscalité, objectifs),
- la **stratégie guidée** avec recommandations automatiques et projections comparées,
- l'accès à plusieurs **simulateurs financiers** (IR, placement, crédit),
- la **sauvegarde et le chargement de dossiers complets** en local,
- la **gestion centralisée de paramètres** (fiscalité, couleurs, page de garde),
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
│       └── 📁 icons/               # Icônes PPTX (max 5)
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
- **Storage** : Images pour page de garde PowerPoint
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
- Bucket pour images page de garde PowerPoint
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
    ├── chapters/                 # Images chapitres PowerPoint (max 10)
    │   ├── ch-01.jpg
    │   ├── ch-02.jpg
    │   └── ...
    └── icons/                    # Icônes PowerPoint (max 5)
        ├── mail.svg
        ├── phone.svg
        └── ...
```

### Règles de nommage

- **Images chapitres** : `ch-01.jpg` à `ch-10.jpg` (maximum 10 images)
- **Icônes** : Noms descriptifs en minuscules (ex: `mail.svg`, `phone.svg`)
- **UI** : Contexte fonctionnel (ex: `login-bg.png`)

### Recommandations techniques

| Type | Format | Qualité | Taille recommandée |
|------|--------|---------|--------------------|
| Photos chapitres | JPG | 82-88% | 1200-1600px largeur |
| Icônes | SVG (préféré) ou PNG | - | 32-64px |
| Fond d'écran | JPG/PNG | 85% | 1920×1080px minimum |

### Distinction importante

- **Assets statiques** (`public/pptx/*`) : Images fixes intégrées dans l'application
- **Covers dynamiques** (Supabase Storage) : Images de page de garde uploadées par les admins dans `{user.id}/page_de_garde.{ext}`

### Restrictions

- ❌ **Aucun screenshot** dans le repository (docs/ ou racine)
- ❌ **Aucune image** à la racine du repo
- ❌ **dist/ jamais versionné** (build artifacts)
- ✅ **Maximum 10 images chapitres** et **5 icônes** pour maintenir la simplicité

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
- Simulateur d'impôt sur le revenu complet
- Génération PowerPoint automatique
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
