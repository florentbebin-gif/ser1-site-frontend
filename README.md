# SER1 – Simulateur épargne retraite (frontend)

Application web React permettant :

- la **connexion sécurisée** via Supabase,
- l’accès à plusieurs **simulateurs** (épargne / placement, crédit…),
- la **configuration centrale** de paramètres fiscaux et graphiques (page Paramètres).

Déployé sur **Vercel** avec **Vite** comme outil de build.  
L’application consomme :

- une **API backend** (Render ou autre) pour certains calculs,
- une base **Supabase** (authentification, paramètres, fichiers).

---

## 1. Architecture globale

### Frontend

- **Framework** : React + Vite
- **Typage** : JavaScript (pas de TypeScript à ce jour)
- **State management** : `useState`, `useEffect` et état local dans chaque page
- **Routing** : géré dans `src/App.jsx` (pages Login, Home, Placement, Crédit, Paramètres, etc.)

### Backend / services externes

- **Backend applicatif** (calculs, santé de l’API, etc.)
  - URL base injectée par `VITE_API_BASE_URL`
  - Routes déjà utilisées :  
    - `GET /health`  
    - `POST /api/placement` (calculs de la page Placement)
- **Supabase**
  - **Auth** : gestion des utilisateurs, login / reset / invitation.
  - **Database** : stockage des paramètres fiscaux (table `tax_settings`, etc.).
  - **Storage** : bucket (ex. `covers`) pour stocker la **page de garde / image PowerPoint**.

---

## 2. Arborescence (simplifiée)

> Les noms peuvent légèrement évoluer, se référer aux fichiers réels pour les détails.

```text
src/
  main.jsx                # Entrée Vite/React
  App.jsx                 # Routing et topbar commune

  supabaseClient.js       # Initialisation du client Supabase
  styles.css              # Style global (layout, topbar, boutons, etc.)

  utils/
    ...                   # Fonctions utilitaires (formatage, calculs...)

  components/
    Topbar.jsx            # Barre supérieure commune
    SmoothChart.jsx       # Composant graphique (Placement)
    InputWithUnit.jsx     # Champ + unité (Placement)

  pages/
    Login.jsx             # Page de connexion / récupération
    Home.jsx              # Page d'accueil avec tuiles de navigation

    Placement.jsx         # Simulateur de placements (capit./distribution)
    Placement.css

    Credit.jsx            # Simulateur de crédit
    Credit.css

    Settings.jsx          # Page Paramètres principale (onglet Général + sous-onglets)
    Settings.css
    SettingsNav.jsx       # Navigation "pilules" des sous-pages

    Sous-Settings/
      SettingsGeneraux.jsx      # Sous-page "Généraux"
      SettingsImpots.jsx        # Sous-page "Impôts"
      SettingsPrelevements.jsx  # Sous-page "Prélèvements sociaux" (squelette)
      SettingsFiscalites.jsx    # Sous-page "Fiscalités contrats" (squelette)
      SettingsBaseContrats.jsx  # Sous-page "Base contrats" (squelette)
      SettingsTableMortalite.jsx# Sous-page "Table de mortalité" (squelette)

      SettingsGeneraux.css
      SettingsImpots.css
      ...<
---

##3. Navigation & topbar
La navigation de haut niveau est gérée dans App.jsx :

/login (ou racine non authentifiée) → page Login

/ → Home (tuiles)

/sim/placement → page Placement

/sim/credit → page Crédit

/settings/* → page Paramètres (et sous-pages)

Topbar commune
Topbar (ou logique équivalente dans App.jsx) affiche :

Logo / titre : SER1 — Simulateur épargne retraite

Icônes boutons :

Home → retour à la page d’accueil

Reset → réinitialisation du simulateur courant (Placement ou Crédit)

Save → prévu pour sauvegarder un scénario (TODO)

Charger (icône dossier) → prévu pour recharger un scénario (TODO)

Paramètres (engrenage) → visible uniquement si session active (user connecté), ouvre la page Paramètres

Déconnexion (icône logout) → appel à supabase.auth.signOut() puis redirection login

Les boutons sont stylés comme des puces arrondies avec icônes, le texte s’affiche en tooltip au survol (par ex. “Charger un dossier”).

---

##4. Authentification & gestion des rôles
Auth Supabase
Connexion par email/mot de passe via Login.jsx.

Gestion des cas :

lien de réinitialisation (#type=recovery)

invitation (#type=invite)

Dans ces cas, l’utilisateur est invité à choisir un nouveau mot de passe dans la page Login.

Rôle User / Admin
Le rôle est déterminé via user.user_metadata :

js
Copier le code
const isAdmin =
  user &&
  ((typeof user?.user_metadata?.role === 'string' &&
    user.user_metadata.role.toLowerCase() === 'admin') ||
    user?.user_metadata?.is_admin === true);
Admin : peut modifier et sauvegarder les paramètres (Impôts, couleurs, etc.).

User : voit les valeurs en lecture seule (inputs désactivés, mais pas de message “lecture seule”).

Le statut est affiché dans la page Paramètres (bandeau Utilisateur : xxx — Statut : User/Admin).

Les métadonnées sont éditées côté Supabase, dans Authentication → Users → Edit user metadata
(par exemple {"role": "admin"}).

---

##5. Pages fonctionnelles
5.1. Home
Page d’accueil avec des tuiles permettant d’accéder :

au simulateur de placement,

au simulateur de crédit,

aux paramètres,

et aux futurs simulateurs (impôt sur le revenu, épargne, contrôle du potentiel, etc.).

5.2. Placement
src/pages/Placement.jsx + Placement.css

Objectif : comparer 4 placements (1 & 2 en capitalisation, 3 & 4 en distribution).

Champs principaux :

mois de souscription,

rendement net,

placement initial,

frais d’entrée,

versement programmé (montant + fréquence),

durée en années.

Calculs :

réalisés dans la page (fonctions utilitaires) ou via backend /api/placement suivant la version.

affichage :

tableau des années (Année 1, Année 2, …) avec valeur finale par produit,

graphique via SmoothChart sous le tableau.

Bouton Reset dans la topbar :

remet tous les champs aux valeurs par défaut,

n’affecte que cette page.

5.3. Crédit
src/pages/Credit.jsx

Simulateur de crédit amortissable (et prêts additionnels).

Champs :

type de crédit,

durée,

montant emprunté,

date de souscription,

taux annuel (crédit / assurance),

mode de calcul assurance,

vue mensuelle / annuelle.

Résultats :

synthèse (mensualité totale, coût total des intérêts + assurance),

tableau d’amortissement détaillé (intérêts, assurance, amortissement, CRD total).

Export :

bouton Exporter → Excel :

onglet tableau d’amortissement,

onglet supplémentaire avec rappel des paramètres saisis (label + valeur).

Topbar :

bouton Reset = remise à zéro des champs de la page crédit.

5.4. Paramètres (Settings)
src/pages/Settings.jsx + sous-pages dans src/pages/Sous-Settings/

La page affiche :

la topbar commune (avec Home / Paramètres / Déconnexion),

un bandeau indiquant l’utilisateur et le statut (User/Admin),

un jeu de “pilules” (onglets internes) :

Généraux

Impôts

Prélèvements sociaux

Fiscalités contrats

Base contrats

Table de mortalité

Les pilules :

style “pilule” (#F2F2F2, ombre),

au survol : bordure #9FBDB2,

pilule active : fond #CFDED8,

clic sur la pilule active : ne fait rien (pas de déconnexion ou reload).

5.4.1. Sous-page « Généraux »
SettingsGeneraux.jsx + SettingsGeneraux.css

Deux blocs principaux :

Choix du code couleur de l’étude

10 couleurs paramétrables :

Couleur 1 : par défaut #2B3E37

Couleur 2 : #709B8B

Couleur 3 : #9FBDB2

Couleur 4 : #CFDED8

Couleur 5 : #788781

Couleur 6 : #CEC1B6

Couleur 7 : #F5F3F0

Couleur 8 : #D9D9D9

Couleur 9 : #7F7F7F

Couleur 10 : #000000

Chaque couleur est saisissable via :

un color picker (<input type="color" />)

ET un champ texte pour un code hexadécimal (#RRGGBB).

Les choix sont sauvegardés en base (structure exacte à voir dans SettingsGeneraux.jsx).

Ces couleurs serviront plus tard dans les exports PowerPoint.

Choix de la page de garde de l’étude

Upload d’une image (png/jpg, ~1200×700 recommandé).

L’image est envoyée sur Supabase Storage dans un bucket (ex: covers).

Une URL ou un chemin de fichier est stocké dans la base (table liée au user, voir SettingsGeneraux.jsx).

Une miniature est affichée sur la page si une image est déjà définie.

Possibilité de supprimer la page de garde (bouton qui efface l’URL en base et le fichier du Storage).

5.4.2. Sous-page « Impôts »
SettingsImpots.jsx + SettingsImpots.css

Sous-page la plus structurée actuellement.

Bandeau utilisateur (email + statut).

4 grandes sections :

Barème de l’impôt sur le revenu

Affiché en 2 colonnes :

gauche : 2025 (revenus 2024)

droite : 2024 (revenus 2023)

Pour chaque année :

tableau des tranches :

De, À, Taux %, Retraitement €

en dessous, 4 blocs :

Plafond du quotient familial

par 1/2 part supplémentaire

parent isolé (2 premières parts)

Décote

déclenchement célibataire

déclenchement couple

montant célibataire

montant couple

taux de décote (%)

Abattement 10 %

plafond

plancher

Abattement 10 % pensions retraite

plafond

plancher

Stockage :

tout est regroupé dans un JSON incomeTax → table tax_settings.

PFU (flat tax)

2 colonnes (2025 / 2024) avec les mêmes valeurs aujourd’hui :

part IR (%),

part prélèvements sociaux (%),

taux global PFU (%).

CEHR / CDHR

CEHR :

grilles personne seule et couple (tranches de revenus & taux).

CDHR :

taux effectif minimal,

seuil RFR personne seule,

seuil RFR couple.

Impôt sur les sociétés

Taux normal IS (%),

taux réduit IS (%),

seuil de bénéfice au taux réduit (€).

Sauvegarde :

un bouton “Enregistrer les paramètres impôts” (visible pour admin seulement),

upsert dans Supabase table tax_settings, ligne id = 1, champ data (JSON).

Pour les autres sous-pages (Prélèvements sociaux, Fiscalités contrats, Base contrats, Table de mortalité), seules des squelettes sont en place pour l’instant. La mécanique pourra suivre la même logique que SettingsImpots.jsx.

---

##6. Données stockées côté Supabase
6.1. Auth
Table système auth.users (gérée par Supabase).

Métadonnées :

user_metadata.role (ex: "admin" ou "user"),

éventuellement user_metadata.is_admin: true.

6.2. Paramètres fiscaux
Table tax_settings

id (integer, clé primaire – 1 pour l’instance globale)

data (JSONB) : structure semblable à DEFAULT_TAX_SETTINGS définie dans SettingsImpots.jsx.

Pour connaître le schéma exact, ouvrir la table dans le dashboard Supabase (section Table Editor).

6.3. Storage
Bucket (ex. covers) :

contient les pages de garde uploadées.

accessible via une policy autorisant l’upload / lecture des images par les utilisateurs authentifiés.

L’URL publique (ou le chemin) est stockée dans une table de settings utilisateur
(voir l’implémentation de SettingsGeneraux.jsx pour le nom exact de la table / colonne).

---

##7. Variables d’environnement
Créer un fichier .env à la racine du projet (non commité) :

bash
Copier le code
VITE_API_BASE_URL=https://ser1-backend.onrender.com   # ou domaine interne / prod
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<clé anonyme Supabase>
Sur Vercel, reproduire les mêmes clés dans Settings → Environment Variables.

---

##8. Démarrer en local
bash
Copier le code
npm install
npm run dev
# ou yarn dev / pnpm dev suivant l’outil
Par défaut : http://localhost:5173

---

##9. Déploiement
Repo GitHub relié à Vercel.

Branch principale : main.

Chaque push déclenche :

un build Vite,

un déploiement preview,

un déploiement production selon la configuration Vercel.

CORS côté backend : penser à autoriser le domaine Vercel (et/ou le domaine custom).

---

##10. TODO / pistes d’évolution
Simulateurs supplémentaires :

Impôt sur le revenu (en utilisant les paramètres de SettingsImpots.jsx),

simulateur épargne global, contrôle du potentiel, etc.

Sauvegarde / chargement de dossiers :

implémenter le backend + tables de scénarios,

brancher les boutons Save / Charger dans la topbar.

Export PowerPoint :

générer des PPTX en utilisant la palette de couleurs et la page de garde choisies dans les Paramètres.

Refactorisation :

factoriser le code des sous-pages Settings en composants réutilisables,

éventuellement introduire TypeScript pour plus de robustesse,

ajouter des tests unitaires pour les calculs financiers.

