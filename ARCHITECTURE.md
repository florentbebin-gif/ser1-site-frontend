flowchart TD
    U[Utilisateur<br/>navigateur] -->|HTTP/HTTPS| FE[Vercel<br/>ser1-site-frontend]
    FE -->|REST /api/*| BE[Render<br/>ser1-backend (Express)]
    BE -->|SQL & Auth| DB[Supabase<br/>PostgreSQL + Auth]
    subgraph GitHub
      GFE[repo: ser1-site-frontend] -->|CI/CD| V[Vercel]
      GBE[repo: ser1-backend] -->|CI/CD| R[Render]
    end
    classDef box fill:#f7fafc,stroke:#94a3b8,color:#111827,stroke-width:1px
    class FE,BE,DB,U,GFE,GBE,V,R box


# Architecture du projet SER1 — Simulateur épargne retraite

Ce projet est un front-end React utilisant Supabase pour l’authentification et la gestion des utilisateurs.  
Le déploiement est réalisé sur **Vercel**.

---

## Structure des dossiers
│
├─ pages/ # Pages principales de l'application
│ ├─ Login.jsx # Connexion + récupération de mot de passe + invitation
│ ├─ Home.jsx # Page d'accueil (tuiles)
│ ├─ Sim.jsx # Module de simulation épargne retraite
│ ├─ Credit.jsx # Vue sur les crédits
│ ├─ Placement.jsx # Vue sur les placements
│ └─ Params.jsx # Paramétrage administrateur
│
├─ components/ # Composants réutilisables
│ └─ ProtectedRoute.jsx # Protection des pages par authentification
│
├─ context/
│ └─ ParamsProvider.jsx # Stockage des paramètres applicatifs
│
├─ utils/
│ └─ idle.js # Déconnexion automatique après inactivité
│
├─ supabaseClient.js # Initialisation du client Supabase
├─ App.jsx # Router principal
└─ main.jsx # Entrée Vite app

## Authentification Supabase

L'écran **Login.jsx** gère :
- Connexion classique
- Récupération de mot de passe (`type=recovery`)
- Invitation utilisateur (`type=invite`)

Lors d’une récupération ou d’une invitation :
→ Supabase renvoie l’utilisateur vers `/login#type=<invitation|recovery>`  
→ La page affiche une **boîte de changement de mot de passe** au-dessus du formulaire de connexion.

---

## Sécurité

| Protection | Implémentation |
|-----------|----------------|
| Pages privées | `ProtectedRoute.jsx` vérifie la session |
| Session persistée | `supabase.auth.getSession()` + listener |
| Déconnexion automatique | `utils/idle.js` (timer + reset événements) |

---

## Déploiement

| Environnement | Service |
|---------------|---------|
| Hébergement | Vercel |
| Auth / DB | Supabase |

Les variables d’environnement Supabase sont configurées dans Vercel.
Vue d’ensemble

Stack : React + Vite.

Entrée : src/main.jsx (monte l’app et les providers).

Routing & layout global : src/App.jsx

Pages : src/pages/* (Home, Params, Credit, Placement, Login, etc.)

Auth & garde : src/ProtectedRoute.jsx (protège les pages privées)

Reset “par page” : src/ResetContext.jsx (événement de reset)

chaque page s’abonne via onResetEvent et vide ses champs uniquement.

Styles : src/styles.css (+ styles locaux éventuels)

(Ancien) reset global : src/utils/reset.js (gardé pour compat / utilitaires, mais la logique de reset passe maintenant par le context)

Démarrage de l’app
src/main.jsx

Monte l’application dans #root.

Emballe <App /> avec les providers (ex. ResetProvider, éventuellement Auth provider).

C’est le fichier où tu ajoutes/retire des providers globaux.

src/App.jsx

Déclare la topbar et les routes.

Exemples de routes :

/login → page de connexion / reset de mdp

/ → Home (tuiles)

/params → Paramètres

/credit → Crédit

/placement → Placement

Les pages privées sont protégées par <ProtectedRoute> :

<Route
  path="/credit"
  element={
    <ProtectedRoute>
      <Credit />
    </ProtectedRoute>
  }
/>


Gère aussi l’affichage conditionnel du bouton Reset dans la topbar (visible sur les pages qui l’utilisent, ex. Crédit et Placement).

Le bouton appelle requestReset() (fourni par ResetContext) → déclenche un événement auquel les pages sont abonnées.

Authentification & sécurité
src/ProtectedRoute.jsx

Vérifie l’état de session (via ton utilité d’auth/supabase).

Redirige vers /login si l’utilisateur n’est pas loggé.

src/pages/Login.jsx

Gère :

Connexion classique (email/mot de passe)

Flow recovery / invite / reauth via le hash de l’URL (ex: #type=recovery&access_token=...).

Affiche une box de réinitialisation de mot de passe quand type=recovery (ou invite) est présent.

C’est pour ça que les liens d’emails Supabase (recovery/invite) te redirigent correctement vers la page Login, qui affiche la box de nouveau mot de passe.

Topbar & boutons

La topbar est dans App.jsx (composant layout global).

Boutons affichés :

HOME → /

Paramètres → /params

Déconnexion → action signOut

Reset → optionnel/conditionnel (uniquement sur pages comme Crédit/Placement)

Au click : requestReset() (du ResetContext)

Le style des boutons/topbar est géré par tes classes + styles.css.

Page Home (les tuiles)
src/pages/Home.jsx

Affiche les tuiles (cartes) vers les simulateurs.

Techniquement :

Un tableau local décrit les tuiles (titre, icône/emoji, chemin).

On .map() pour générer les cartes (avec <Link to="/credit"> etc.).

Le style des tuiles est dans styles.css + classes locales du composant.

Si les tuiles n’apparaissent pas, c’est généralement :

Le tableau des tuiles est vide/commenté,

Le CSS masque accidentellement la zone,

Ou la route de Home ne pointe plus vers la bonne page.

Pages métier (Crédit / Placement / …)
Emplacement

src/pages/Credit.jsx

src/pages/Placement.jsx

Chaque page s’enregistre au reset pour vider ses champs (et seulement ses champs).
Typiquement :

useEffect(() => {
  const off = onResetEvent?.(() => {
    // vider les champs SAISIS, réinitialiser les date pickers, etc.
    // … et rien d’autre
  });
  return off || (() => {});
}, []);


Exemple Crédit : après reset, on vide les inputs et on supprime les prêts 2 & 3 (setPretsPlus([])) comme tu le souhaitais.

Reset : comment ça marche maintenant
src/ResetContext.jsx

Fournit deux choses :

requestReset() : émet un reset

onResetEvent(cb) : écoute un reset et exécute cb

Le bouton Reset (topbar) appelle requestReset().

Chaque page s’abonne avec onResetEvent et vide ses états locaux.

✅ Avantages : pas de “gros reset global” qui casse tout,
✅ Comportement local et prévisible,
✅ Une page peut choisir précisément quoi réinitialiser.

src/utils/reset.js (legacy)

Ancienne logique, conservée si tu en as encore besoin (export Excel, helpers, etc.).

Pour le “reset de page”, on utilise désormais le ResetContext.

Styles

Le gros du style global est dans src/styles.css.

Chaque page ajoute ses classes (cards, inputs, grilles).

La topbar et les tuiles utilisent aussi ce CSS.

Ajouter une nouvelle tuile et une page

Voici la recette pas à pas :

Créer la page

src/pages/MonSimulateur.jsx

Structure type (avec reset local) :

import React, { useEffect, useState } from 'react';
import { onResetEvent } from '../ResetContext';

export default function MonSimulateur() {
  const [valA, setValA] = useState('');
  const [valB, setValB] = useState(0);

  useEffect(() => {
    const off = onResetEvent?.(() => {
      setValA('');
      setValB(0);
    });
    return off || (() => {});
  }, []);

  return (
    <div className="container">
      {/* ton UI */}
    </div>
  );
}


Ajouter la route

Dans src/App.jsx :

import MonSimulateur from './pages/MonSimulateur';
// …
<Route
  path="/mon-simulateur"
  element={
    <ProtectedRoute>
      <MonSimulateur />
    </ProtectedRoute>
  }
/>


Afficher une tuile sur la Home

Dans src/pages/Home.jsx, ajoute un objet à la liste :

const tiles = [
  // … tuiles existantes
  {
    to: '/mon-simulateur',
    icon: '🧮',
    title: 'Mon simulateur',
    subtitle: 'Petit descriptif',
  },
];


(Optionnel) Bouton Reset visible ?

Si tu veux le bouton Reset dans la topbar uniquement sur ta nouvelle page :

Dans App.jsx, là où tu décides la visibilité du bouton Reset, ajoute le pathname :

const showReset = ['/credit', '/placement', '/mon-simulateur'].includes(location.pathname);


Et c’est tout. La page est protégée, a sa tuile, sait se reset, et affiche (ou non) le bouton Reset.

En cas de “page blanche” / “tuiles invisibles”

Checklist ultra-rapide :

Route Home : dans App.jsx, la route / rend bien <Home /> ?

Home.jsx :

Le tableau des tuiles existe et n’est pas vide ?

Les <Link to="…"> pointent vers des routes réellement déclarées dans App.jsx ?

CSS :

Pas de display:none / visibility:hidden accidentel sur les conteneurs.

Pas d’overlay qui couvrirait la zone.

Console :

Aucune erreur React/Vite bloquante ?

Pas d’import manquant (ex. “Could not resolve …”) ?
