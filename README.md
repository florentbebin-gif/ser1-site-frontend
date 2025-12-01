# SER1 — Simulateur d’épargne retraite

Application web interne permettant :
- la **connexion sécurisée des utilisateurs**,
- l’accès à plusieurs **simulateurs financiers** (placement, crédit),
- la **gestion centralisée de paramètres** (fiscalité, couleurs, page de garde),
- la préparation de futures **éditions PowerPoint d’étude patrimoniale**.

✅ Projet **100 % frontend**  
✅ Basé sur **React + Supabase**  
✅ Déployé sur **Vercel**

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
  styles.css              # Styles globaux (layout, topbar, boutons)

  pages/
    Login.jsx             # Connexion / reset / invitation
    Home.jsx              # Accueil avec tuiles de navigation

    Placement.jsx         # Simulateur de placement
    Placement.css

    Credit.jsx            # Simulateur de crédit
    Credit.css

    Settings.jsx          # Page Paramètres principale
    SettingsNav.jsx       # Navigation interne par pilules
    Settings.css

    Sous-Settings/
      SettingsGeneraux.jsx
      SettingsImpots.jsx
      SettingsPrelevements.jsx
      SettingsFiscalites.jsx
      SettingsBaseContrats.jsx
      SettingsTableMortalite.jsx

      SettingsGeneraux.css
      SettingsImpots.css
Les composants transverses (topbar, boutons icônes, pilules, etc.)
sont gérés directement dans App.jsx et les pages associées.

3. Navigation & Topbar
La topbar est commune à toutes les pages (sauf login si non connecté).

Boutons disponibles (icônes)
🏠 Home → retour à l’accueil

💾 Save → prévu (non implémenté)

📂 Charger → prévu (non implémenté)

🔄 Reset → remet à zéro le simulateur actif (Placement / Crédit)

⚙️ Paramètres → visible uniquement si session active

🚪 Déconnexion → Supabase signOut

UX
Boutons sous forme de puces arrondies

Taille uniforme sur toutes les pages

Texte affiché via tooltip au survol

Le bouton Reset est spécifique à chaque page

4. Authentification & rôles
Authentification
Gérée par Supabase Auth

Connexion email / mot de passe

Gestion de :

réinitialisation de mot de passe

invitation utilisateur

Rôles
Le rôle est stocké dans les user_metadata Supabase.

Exemple :

json
Copier le code
{
  "role": "admin"
}
Admin

Peut modifier et sauvegarder les paramètres

User

Accès en lecture seule

Le statut est affiché dans la page Paramètres :

Utilisateur : email — Statut : User / Admin

5. Pages principales
5.1. Home
Page d’accueil avec des tuiles de navigation vers :

Simulateur Placement

Simulateur Crédit

Paramètres

Futures fonctionnalités (IR, épargne globale, etc.)

5.2. Simulateur Placement
Placement.jsx

Objectif : comparer plusieurs placements financiers.

Fonctionnalités :

4 placements comparables

capitalisation / distribution

Paramètres :

mois de souscription

rendement net

placement initial

frais d’entrée

versements programmés

durée

Résultats :

tableau annuel (Année 1, 2, …)

graphique de valorisation

Calculs réalisés en frontend

Bouton Reset dédié dans la topbar

5.3. Simulateur Crédit
Credit.jsx

Fonctionnalités :

Crédit amortissable

Assurance emprunteur

Vue mensuelle / annuelle

Tableau d’amortissement détaillé

Synthèse :

mensualité

coût total intérêts + assurance

Export Excel :

tableau d’amortissement

onglet “Paramètres saisis”

Bouton Reset dédié dans la topbar

6. Page Paramètres
Navigation interne via pilules :

Généraux

Impôts

Prélèvements sociaux

Fiscalités contrats

Base contrats

Table de mortalité

Style des pilules
Fond : #F2F2F2

Hover : bordure #9FBDB2

Active : fond #CFDED8

Clic sur la pilule active : aucun effet

6.1. Sous-page « Généraux »
Palette de couleurs de l’étude
10 couleurs configurables

Chaque couleur est saisissable :

via un color picker

via un champ texte hexadécimal

Valeurs par défaut :

#2B3E37, #709B8B, #9FBDB2, #CFDED8,

#788781, #CEC1B6, #F5F3F0, #D9D9D9,

#7F7F7F, #000000

Les choix sont sauvegardés en base

Ces couleurs seront utilisées ultérieurement pour les exports PowerPoint

Page de garde PowerPoint
Upload d’une image (jpg / png)

Stockage dans Supabase Storage

Une seule image active par utilisateur

Affichage d’une miniature

Possibilité de supprimer l’image

Cette image sera utilisée comme première page des éditions PowerPoint

6.2. Sous-page « Impôts »
Page structurée en deux colonnes permanentes :

2025 (revenus 2024)

2024 (revenus 2023)

Sections :

Barème de l’impôt sur le revenu

Tranches (de / à / taux / retraitement)

Quotient familial

Décote

Abattement 10 %

Abattement 10 % retraités

PFU (flat tax)

CEHR / CDHR

Impôt sur les sociétés

Caractéristiques :

Champs modifiables uniquement pour les admins

Users : lecture seule

Bouton “Enregistrer les paramètres” visible pour admin uniquement

Stockage :

Table Supabase : tax_settings

Les données sont stockées sous forme JSON

Une ligne globale (id = 1)

7. Supabase
Auth
Utilisateurs

Métadonnées (rôles)

Database
tax_settings : paramètres fiscaux globaux

Tables additionnelles possibles pour l’évolution

Storage
Bucket dédié aux images (page de garde)

Accès contrôlé par policies Supabase

Utilisation pour les futures éditions PowerPoint

8. Variables d’environnement
env
Copier le code
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxx
➡️ Aucune API backend externe n’est requise.

9. Déploiement
Repo GitHub connecté à Vercel

Build via Vite

Variables d’environnement définies dans Vercel

Déploiement automatique à chaque push sur la branche principale

10. Pistes d’évolution
Simulateur d’impôt sur le revenu

Sauvegarde et chargement de dossiers clients

Génération automatique de PowerPoint

Centralisation des composants UI

Validation métier et contrôles utilisateurs
