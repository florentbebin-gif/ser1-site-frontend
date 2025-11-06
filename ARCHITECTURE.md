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

