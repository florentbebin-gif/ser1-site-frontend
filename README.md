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

Ce document sert de **synthèse fonctionnelle et technique** afin de pouvoir reprendre
le développement ultérieurement sans contexte préalable.

---

## 1. Stack technique

### Frontend
- **React** (Vite)
- JavaScript
- CSS natif (pas de framework type MUI / Tailwind)
- Gestion d’état locale (`useState`, `useEffect`)
- Routing géré dans `App.jsx`

### Backend / Services
- ❌ Aucun backend applicatif dédié
- ✅ **Supabase uniquement** :
  - Authentification
  - Base de données (paramètres et configurations)
  - Storage (images – page de garde PowerPoint)

---

## 2. Architecture du projet

```text
src/
  main.jsx                # Entrée React / Vite
  App.jsx                 # Routing global + topbar commune

  supabaseClient.js       # Initialisation Supabase
  styles/
    global.css            # Styles globaux (layout, topbar, boutons)
    premium-shared.css    # Styles partagés "premium"

  pages/
    Login.jsx             # Connexion / reset / invitation
    Home.jsx              # Accueil avec tuiles de navigation
    PlacementV2.jsx       # Simulateur de placement
    Placement.css
    Credit.jsx            # Simulateur de crédit
    Credit.css
    Settings/
      SettingsPage.jsx    # Page Paramètres principale
      SettingsNav.jsx     # Navigation interne par pilules
      Settings.css
      Sous-Settings/
        SettingsGeneraux.jsx
        SettingsImpots.jsx
        SettingsPrelevements.jsx
        SettingsFiscalites.jsx
        SettingsBaseContrats.jsx
        SettingsTableMortalite.jsx

  components/             # Composants transverses (Topbar, Timeline, etc.)
  utils/                  # Fonctions utilitaires (export Excel, reset, etc.)
  engine/                 # Moteurs de calcul (placement, transmission, IR…)
```

---

## 3. Navigation & Topbar

La topbar est commune à toutes les pages (sauf login si non connecté).

### Boutons disponibles (icônes)
- 🏠 **Accueil** : retour à la Home.
- 💾 **Sauvegarder** : déclenche `saveGlobalState()` et produit un fichier `.ser1`.
- 📂 **Charger** : ouvre un fichier `.ser1` et restaure tous les simulateurs.
- 🔄 **Réinitialiser** :
  - Sur l’accueil : reset **global** (tous les simulateurs + sessionStorage associés).
  - Sur une page simulateur : reset **ciblé** (`triggerPageReset('placement')`, `triggerPageReset('credit')`, etc.).
- ⚙️ **Paramètres** : accès à la configuration (visible uniquement si session active).
- 🚪 **Déconnexion** : `supabase.auth.signOut()`.

Les boutons sont des puces arrondies, texte affiché via tooltip au survol.

---

## 4. Authentification & rôles

- **Supabase Auth** (email / mot de passe, reset, invitation).
- Le rôle (`admin` ou `user`) est stocké dans `user_metadata`.
  ```json
  {
    "role": "admin"
  }
  ```
- **Admin** : peut modifier et enregistrer les paramètres.
- **User** : lecture seule (les champs sont désactivés et le bouton “Enregistrer” masqué).

---

## 5. Pages principales

### 5.1 Home
Tuiles de navigation vers Placement, Crédit, Paramètres, futures simulations (IR, stratégie…).

### 5.2 Simulateur Placement (`PlacementV2.jsx`)
- Compare **2 placements** (capitalisation / distribution).
- Phases : Épargne → Liquidation → Transmission.
- Paramètres : versements initiaux, périodiques, répartition Capi/Distrib, rendement, frais.
- Résultats : tables détaillées, synthèse comparative, export Excel (Paramètres + Épargne/Liquidation/Transmission pour chaque produit).
- Reset dédié via topbar.

### 5.3 Simulateur Crédit (`Credit.jsx`)
- Crédit amortissable ou in fine, assurance CRD/CI, lissage avec d’autres prêts.
- Vue mensuelle / annuelle + tableaux d’amortissement.
- Export Excel : paramètres saisis + échéanciers.
- Reset dédié via topbar.

### 5.4 Paramètres (`SettingsPage.jsx`)
- Navigation par pilules (Généraux, Impôts, Prélèvements, Fiscalités, Base contrats, Table mortalité).
- Les couleurs des pilules (fond #F2F2F2, hover #9FBDB2, active #CFDED8) sont définies dans `Settings.css`.
- Sous-page “Généraux” : palette de 10 couleurs + upload d’une image pour les exports (stockage Supabase).
- Sous-pages fiscales : **principe “zéro taux en dur”** → tous les taux, abattements et tranches sont saisis ici (table `tax_settings`).
- Stockage : table Supabase `tax_settings` (1 ligne JSON `{ id: 1, data: {...} }`).

---

## 6. Règles design & thèmes couleurs

- **Palette globale** : 10 couleurs configurables depuis `/settings/generaux`. Aucun composant ne doit introduire une couleur “random” si un token existe déjà.
- **Typographies & layout** : CSS natif. Les sections premium (Placement Transmission, info cards, etc.) réutilisent `premium-shared.css` pour assurer cohérence.
- **Disclaimers & cartes** : utiliser les classes locales (`.pl-disclaimer`, `.ir-disclaimer`, `.credit-hypotheses`) au lieu de styles partagés pour éviter les effets de bord.
- **Accessibilité** : contrastes vérifiés manuellement lors des revues UI. Les tables sensibles (transmission) imposent centrage et `table-layout: fixed` pour garantir la lisibilité.

---

## 7. Paramètres & administration

- **Accès** : `/settings` nécessite une session Supabase active. Navigation par pilules (Généraux, Impôts, Prélèvements, Fiscalités, Base contrats, Table mortalité).
- **Gestion des droits** : `session.user.user_metadata.role` pilote l’édition. Seuls les admins voient le bouton “Enregistrer les paramètres” et les champs actifs.
- **Persistant storage** :
  - Table `tax_settings` (Supabase) contenant l’ensemble des paramètres (abattements, barèmes IR, PS, fiscalités contrats…) sous forme d’un objet JSON.
  - Bucket Supabase Storage pour l’image de page de garde PowerPoint (une seule image active par cabinet).
- **Principe “zéro taux en dur”** : toute évolution métier doit lire ses taux/abattements depuis les settings admin. Si un fallback est nécessaire, il doit être implémenté dans les settings par défaut, jamais dans le moteur.

---

## 8. Supabase

- **Auth** : utilisateurs + `user_metadata.role`.
- **Database** : table `tax_settings` pour l’ensemble des paramètres fiscaux.
- **Storage** : bucket pour les images (page de garde). Accès protégé par RLS et policies Supabase.

---

## 9. Variables d’environnement

Créer un fichier `.env` à la racine :

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxx
```

Aucune API backend externe supplémentaire.

---

## 10. Déploiement

- Repo GitHub connecté à Vercel.
- `npm run build` (Vite) → déploiement automatique sur branche `main`.
- Variables d’environnement configurées dans Vercel.

---

## 11. Exports

- **Excel Placement** : depuis `/sim/placement`, export structuré en onglets (Paramètres, Épargne, Liquidation, Transmission) pour chacun des deux produits simulés. Généré via `utils/exportExcel.js`.
- **Excel Crédit** : depuis `/sim/credit`, export des paramètres saisis et du tableau d’amortissement (mensuel ou annuel) avec assurance intégrée.
- **PowerPoint** : non implémenté. Pré-requis existants : palette couleurs et page de garde dans Supabase Storage. À implémenter via `pptxgenjs` ou équivalent.

---

## 12. Pistes d’évolution

- Simulateur d’impôt sur le revenu complet.
- Génération automatique de présentations PowerPoint.
- Centralisation des composants UI (design system / tokens).
- Validation métier renforcée (contrôles de saisie, disclaimers).
