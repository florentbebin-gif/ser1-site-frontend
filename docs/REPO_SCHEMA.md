# Schéma du repository SER1

## 📁 Structure générale

```
SER1/
├── 📄 Configuration
│   ├── package.json                    # Dépendances & scripts
│   ├── vite.config.ts                  # Config Vite
│   ├── tsconfig.json                   # Config TypeScript
│   ├── .gitignore                      # Fichiers ignorés
│   └── .vscode/                        # Config VSCode
│
├── 📄 Documentation
│   ├── README.md                       # Documentation principale
│   ├── README-SUPABASE.md              # Guide Supabase
│   ├── README-ROLE-FIX.md              # Fix rôle admin
│   ├── ADMIN_COMPTES_ET_SIGNALMENTS.md # Guide signalements
│   ├── CSS_COLOR_RULES.md              # Règles couleurs
│   └── *.md                            # Autres docs techniques
│
├── 📄 Base de données
│   ├── supabase-setup.sql              # Setup initial
│   ├── admin_setup.sql                 # Configuration admin
│   ├── create_issue_reports_table.sql  # Table signalements
│   ├── fix-profiles.sql                # Fix rôles
│   └── *.sql                           # Scripts SQL divers
│
├── 📁 Source (src/)
│   ├── 📄 main.jsx                     # Point d'entrée React
│   ├── 📄 App.jsx                      # Composant racine
│   ├── 📄 styles.css                   # Styles globaux
│   ├── 📄 supabaseClient.js            # Client Supabase
│   │
│   ├── 📁 auth/                        # Authentification
│   │   ├── AuthProvider.tsx            # Contexte auth
│   │   ├── useUserRole.ts              # Gestion rôles
│   │   ├── PrivateRoute.jsx            # Routes protégées
│   │   └── AdminGate.jsx               # Gate admin
│   │
│   ├── 📁 components/                  # Composants UI
│   │   ├── UserInfoBanner.jsx          # Banner utilisateur
│   │   ├── IssueReportButton.jsx       # Bouton signalement
│   │   └── [autres composants]
│   │
│   ├── 📁 pages/                       # Pages de l'application
│   │   ├── 📄 Login.jsx                # Connexion
│   │   ├── 📄 Home.jsx                 # Accueil
│   │   ├── 📄 Settings.jsx             # Paramètres principaux
│   │   ├── 📄 SettingsNav.jsx          # Navigation settings
│   │   ├── 📄 SettingsShell.jsx       # Layout settings
│   │   ├── 📄 Credit.jsx               # Crédits
│   │   ├── 📄 Ir.jsx                   # IR
│   │   ├── 📄 PlacementV2.jsx          # Placement
│   │   └── 📁 Sous-Settings/           # Sous-pages settings
│   │       ├── 📄 SettingsComptes.jsx  # Gestion comptes
│   │       ├── 📄 SettingsComptes.css  # Styles comptes
│   │       ├── 📄 SettingsImpots.jsx  # Impôts
│   │       ├── 📄 SettingsFiscalites.jsx # Fiscalités
│   │       ├── 📄 SettingsPrelevements.jsx # Prélèvements
│   │       └── 📄 SettingsTableMortalite.jsx # Table mortalité
│   │
│   ├── 📁 features/                    # Fonctionnalités métier
│   │   ├── 📁 auth/                    # Auth features
│   │   ├── 📁 ui/                      # UI features
│   │   └── [autres features]
│   │
│   ├── 📁 hooks/                       # Hooks personnalisés
│   │   ├── 📄 useTheme.ts              # Hook thème
│   │   └── [autres hooks]
│   │
│   ├── 📁 services/                    # Services API
│   │   ├── 📄 supabaseApi.ts           # API Supabase
│   │   └── [autres services]
│   │
│   ├── 📁 settings/                    # Configuration app
│   │   ├── 📄 ThemeProvider.tsx        # Provider thème
│   │   └── [autres settings]
│   │
│   ├── 📁 utils/                       # Utilitaires
│   │   ├── 📄 constants.ts             # Constantes
│   │   └── [autres utils]
│   │
│   └── 📁 styles/                      # Styles spécifiques
│       └── [fichiers CSS]
│
├── 📁 Supabase Backend
│   └── 📁 functions/                   # Edge Functions
│       └── 📁 admin/
│           ├── 📄 index.ts            # Fonction admin principale
│           ├── 📄 deno.json           # Config Deno
│           └── 📄 [autres fichiers]
│
├── 📁 Assets
│   ├── 📁 public/                      # Fichiers statiques
│   ├── 📁 assets/                      # Images, etc.
│   └── 📄 Logo SER1.png               # Logo application
│
├── 📁 Scripts
│   └── 📁 scripts/                     # Scripts utilitaires
│
├── 📁 Build
│   └── 📁 dist/                        # Build production
│
└── 📁 Dépendances
    └── 📁 node_modules/                # Packages npm
```

## 🔧 Technologies principales

| Technologie | Usage |
|-------------|-------|
| **React 18** | Framework frontend |
| **Vite** | Build tool & dev server |
| **TypeScript** | Typage JavaScript |
| **Supabase** | Backend (auth, DB, functions) |
| **CSS Variables** | Système de thèmes |
| **React Router** | Navigation client |

## 🎯 Fonctionnalités clés

### 1. Authentification & Rôles
- Login/Logout via Supabase Auth
- Rôles : `admin` / `user`
- Protection des routes admin
- Gestion des comptes utilisateurs

### 2. Système de thèmes
- Variables CSS dynamiques
- Sauvegarde en base de données
- Interface de personnalisation

### 3. Signalements
- Formulaire de signalement
- Modal de gestion admin
- Tableau des signalements par utilisateur
- Actions : marquer lu, supprimer

### 4. Pages métiers
- **Impôts** : Calcul et simulation
- **Fiscalités** : Gestion fiscale
- **Prélèvements** : Calcul prélèvements sociaux
- **Placement** : Simulateur d'investissement
- **Crédits** : Calcul de crédits

## 🗄️ Base de données Supabase

### Tables principales
- `auth.users` : Utilisateurs Supabase
- `public.profiles` : Profils utilisateurs (rôle)
- `public.issue_reports` : Signalements
- `public.ui_settings` : Paramètres UI/thèmes

### Edge Functions
- `admin` : Fonction admin pour gestion utilisateurs et signalements

## 🎨 Système de couleurs

Variables CSS définies dans `styles.css` :
- `--color-c1` à `--color-c10` : Palette principale
- `--color-success-*` : États succès
- `--color-warning-*` : États warning  
- `--color-error-*` : États erreur

## 📝 Points d'attention

1. **Rôles admin** : Configurer dans `profiles.role`
2. **Thèmes** : Variables CSS + sauvegarde BDD
3. **Signalements** : Modal premium avec liste/détail
4. **Build** : Vite + TypeScript
5. **Auth** : Supabase Auth + Provider React

---

*Généré le 11/01/2026*
