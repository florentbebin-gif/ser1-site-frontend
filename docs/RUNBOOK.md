# RUNBOOK (dev / ops)

## But
Donner une procédure **actionnable** pour exécuter, diagnostiquer et opérer le repo (local dev, Supabase, Edge Functions, troubleshooting).

## Audience
Dev qui doit dépanner vite, ou exécuter un parcours local/CI.

## Ce que ce doc couvre / ne couvre pas
- ✅ Couvre : commandes, symptômes→cause→fix, flags debug, Edge Functions, migrations.
- ❌ Ne couvre pas : les conventions UI/couleurs (voir `docs/GOUVERNANCE.md`).

## Sommaire
- [Checks du repo](#checks-du-repo)
- [Dev local (frontend)](#dev-local-frontend)
- [Env vars](#env-vars)
- [Debug flags & console policy](#debug-flags--console-policy)
- [Supabase local + migrations](#supabase-local--migrations)
- [Edge Function admin](#edge-function-admin)
- [Troubleshooting rapide](#troubleshooting-rapide)

---

## Checks du repo
- Check complet :
  - `npm run check` (lint + typecheck + tests + build)

En CI, c'est le gate principal.

---

## Dev local (frontend)
- `npm install`
- `npm run dev`

---

## Env vars
Le repo n’utilise pas `.env` :
- Copier `.env.example` → `.env.local` (local uniquement, gitignored)
- Ne jamais committer de secrets.

Variables attendues :

```bash
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>

# Optionnel (Playwright E2E)
E2E_EMAIL=<email>
E2E_PASSWORD=<password>
```

---

## Debug flags & console policy
### Console
- Autorisé en prod : `console.error`, `console.warn`.
- Interdit en prod : `console.log/debug/info/trace` (bloqué ESLint).

### Activer des logs
- Via `.env.local` (recommandé) :
  - `VITE_DEBUG_AUTH=1`
  - `VITE_DEBUG_PPTX=1`
  - `VITE_DEBUG_COMPTES=1`

- Via `localStorage` (runtime) :
  - `SER1_DEBUG_AUTH=1`
  - `SER1_DEBUG_PPTX=1`
  - `SER1_DEBUG_COMPTES=1`
  - `SER1_DEBUG_ADMIN=1`
  - `SER1_DEBUG_ADMIN_FETCH=1`

Référence code : `src/utils/debugFlags.ts`.

---

## Supabase local + migrations
Source de vérité migrations : `supabase/migrations/`.

Parcours safe (si Supabase CLI configurée) :

> ⚠️ **Danger zone**: `supabase db reset` est destructif (purge totale) et interdit sans demande explicite.  
> Préférer `supabase start` + migrations ciblées si l'objectif ne nécessite pas un reset complet.

```bash
supabase start
supabase db reset
supabase migration list
```

Synchroniser le schéma distant (si besoin) :

```bash
supabase db remote commit --linked
```

---

## Edge Function admin
### Déployer
```bash
npx supabase functions deploy admin --project-ref <ref>
```

### Tester
- Public : `ping_public`
- Auth/admin : via Dashboard Functions ou `supabase functions invoke admin`.

Exemples :

```bash
# Public (pas de token)
supabase functions invoke admin --data '{"action":"ping_public"}'

# Admin (token requis)
supabase functions invoke admin \
  --data '{"action":"list_users"}' \
  --headers '{"Authorization":"Bearer <JWT_ADMIN>"}'
```

Contrat API : `supabase/functions/admin/index.ts`.

Notes CORS : en prod, l'app passe par un proxy Vercel (`api/admin.js`).

---

## Troubleshooting rapide
### CORS / /functions/v1/admin
Symptôme : erreur CORS ou requêtes invisibles côté logs Supabase.
- Vérifier `VITE_SUPABASE_URL` / token.
- Tester `ping_public` depuis navigateur.
- Vérifier preflight `OPTIONS` (Network tab).

### Thème ne s’applique pas / cache stale
- Vider les caches `ser1_theme_cache_*` / `ser1_cabinet_*` dans localStorage.
- Vérifier `theme_mode/preset_id/my_palette` en DB (`ui_settings`).

### RLS / rôle admin
- Vérifier que l’autorisation utilise `app_metadata.role`.
- Interdit : checks `user_metadata`.

Check rapide (régression sécurité) :

```bash
rg "user_metadata.*role" supabase/functions --type ts
rg "user_metadata" supabase/migrations --type sql
```

---

## Mise à jour annuelle des règles fiscales

Procédure à suivre chaque année (PLF, BOFiP, BOSS…). Aucune compétence technique requise — chaque étape est indépendante.

### Étape 1 — Mettre à jour les paramètres Impôts

1. Aller sur `/settings/impots`.
2. Vérifier et corriger : barème IR, PFU, CEHR, droits de succession (DMTG).
3. Enregistrer.

### Étape 2 — Mettre à jour les Prélèvements sociaux

1. Aller sur `/settings/prelevements`.
2. Vérifier et corriger : taux PS patrimoine (17,2 %), tranches retraite.
3. Enregistrer.

### Étape 3 — Vérifier les produits "À vérifier"

1. Aller sur `/settings/base-contrat`.
2. Filtrer les produits marqués "À vérifier" (badge orange).
3. Pour chaque produit : consulter les sources officielles (BOFiP, CGI…), corriger les règles si besoin, passer le niveau de confiance à "Confirmé".

### Étape 4 — Ajouter au moins un cas de test

1. Sur `/settings/base-contrat`, cliquer "Ajouter un cas de test".
2. Choisir un produit, décrire la situation (capital, durée…) et le résultat attendu (imposition, PS…).
3. Valider. Le cas de test est enregistré avec les règles.

> Sans cas de test, un avertissement s'affiche. L'enregistrement reste possible, mais il est recommandé d'avoir au moins 1 test avant de considérer les règles comme publiées.

### Étape 5 — Enregistrer

1. Cliquer "Enregistrer" en bas de la page.
2. Vérifier le message de confirmation.

---

## Initialiser le catalogue Base-Contrat

### Quand l'utiliser

- **Première mise en service** : le catalogue est vide, aucun produit n'a encore été saisi.
- **Après une réinitialisation** : si le catalogue a été vidé accidentellement.

### Ce que ça fait

- **Initialiser le catalogue** (bouton visible si le catalogue est vide) : charge l'ensemble des produits du fichier de référence (`src/constants/base-contrat/catalogue.seed.v1.json`). Chaque produit est créé avec ses métadonnées (grande famille, nature, PP/PM, souscription 2026) mais **sans règles fiscales** — les règles sont à compléter produit par produit.
- **Compléter le catalogue** (bouton visible si le catalogue contient déjà des produits) : ajoute uniquement les produits **absents** du catalogue actuel. **N'écrase jamais** un produit existant ni ses règles.

### Fichier catalogue (base de travail)

- Emplacement : `src/constants/base-contrat/catalogue.seed.v1.json`
- Contenu : ~78 produits couvrant les 13 grandes familles (Assurance, Épargne bancaire, Titres vifs, Fonds/OPC, Immobilier direct, Immobilier indirect, Crypto-actifs, Non coté/PE, Produits structurés, Créances/Droits, Dispositifs fiscaux immo, Métaux précieux, Retraite & épargne salariale).
- Ce fichier est une **base de travail** : il peut être amendé et complété au fil du temps. Toute modification doit passer par une PR (fichier versionné dans le repo).

### Précautions

- L'initialisation ne remplace pas la vérification des règles fiscales : les produits chargés depuis le seed ont le niveau de confiance "À vérifier" par défaut.
- Après initialisation, suivre la procédure "Mise à jour annuelle" pour compléter et valider les règles.

---

## Marquer une phase "Sans objet" (Constitution / Sortie / Décès)

### Quand l'utiliser

Certains produits n'ont pas de règles fiscales pour une ou plusieurs phases de vie :
- **Constitution** : pas applicable pour un actif déjà détenu (ex : immo direct hérité).
- **Sortie / Rachat** : pas de rachat possible (ex : contrat de prévoyance pure, FCPE bloqué).
- **Décès / Transmission** : pas de clause bénéficiaire ou de régime spécifique (ex : compte courant simple).

### Comment faire (admin)

1. Ouvrir la fiche produit (accordéon) sur `/settings/base-contrat`.
2. S'assurer d'être sur la **version active** (version 0, sélecteur en haut de fiche).
3. Sur la colonne de la phase concernée :
   - Si la phase est déjà active : cliquer le bouton **"Sans objet"** à droite du titre de la phase.
   - Si la phase est déjà "Sans objet" : cliquer **"Activer"** pour la rouvrir et configurer des règles.
4. Cliquer **"Enregistrer"** en bas de page pour persister le changement.

### Ce qui est stocké

Le champ `phase.applicable` (booléen) est basculé dans le JSONB `base_contrat_settings.data`. La modification est **réversible** à tout moment.

### Affichage côté utilisateur

Une phase "Sans objet" s'affiche avec un chip grisé "Sans objet" — aucune règle fiscale n'est présentée pour cette phase sur ce produit.

---

## Comprendre les valeurs automatiques (Paramètres Impôts / Prélèvements sociaux)

Certains champs dans les fiches produit affichent **"Valeur automatique"** au lieu d'un nombre fixe. Ces valeurs sont lues dynamiquement depuis les paramètres globaux du cabinet.

### Références connues

| Référence interne | Libellé affiché | Source |
|---|---|---|
| `$ref:tax_settings.pfu.current.rateIR` | Taux IR — PFU (flat tax) | Paramètres Impôts |
| `$ref:tax_settings.pfu.current.rateSocial` | Taux PS — PFU | Paramètres Impôts |
| `$ref:ps_settings.patrimony.current.totalRate` | Taux PS — Patrimoine (taux global) | Paramètres Prélèvements sociaux |

### Modifier une valeur automatique

Ces valeurs **ne sont pas modifiables dans la fiche produit** — elles sont administrées dans :
- `/settings/impots` → Paramètres Impôts (PFU, barème IR…)
- `/settings/prelevements` → Paramètres Prélèvements sociaux (PS patrimoine…)

Un lien **"↗ Ouvrir"** est affiché à côté de chaque valeur automatique pour y accéder directement.

---

## Afficher les détails techniques (pour diagnostic)

En mode normal, la fiche produit affiche uniquement des libellés métier en français. Pour le diagnostic ou la vérification des données brutes :

1. Ouvrir `/settings/base-contrat`.
2. Dans la barre de filtres, cliquer **"⚙ Afficher les détails"**.
3. En mode Détails activé :
   - Les clés internes (`irRatePercent`, `abattementParBeneficiaire`…) sont affichées entre crochets `[...]` à côté du libellé.
   - Les références brutes (`$ref:tax_settings.pfu.current.rateIR`) sont affichées sous le libellé lisible.
4. Cliquer à nouveau sur **"⚙ Mode détaillé"** pour revenir au mode normal.

> Ce mode est non-destructif : il n'affecte pas les données, uniquement l'affichage.

---

## Configurer les règles d'un produit seed

Quand un produit est créé depuis le catalogue seed (ex : LEP, Livret A, SCPI…), ses phases peuvent être vides ou marquées "Sans objet". Cette section explique comment les configurer via le modal guidé.

### Prérequis

- Être connecté en tant qu'administrateur.
- La fonctionnalité est disponible depuis `/settings/base-contrat`.

### Ouvrir le modal de configuration

1. Ouvrir l'accordéon du produit à configurer.
2. Sur la phase souhaitée (Constitution, Sortie, Décès), cliquer sur le bouton **"Configurer les règles"** (visible si la phase est vide ou "Sans objet").

> Si la phase est "Sans objet", la basculer d'abord sur "Applicable" via le toggle de phase (cf. section *Marquer une phase "Sans objet"*), puis cliquer sur "Configurer les règles".

### Étape 1 — Choisir la phase

Le modal affiche les 3 phases avec leur état actuel :
- **Vide** — phase applicable mais aucun bloc défini
- **N blocs** — déjà configurée
- **Sans objet** — non applicable pour ce produit

Sélectionner la phase à configurer.

### Étape 2 — Sélectionner les blocs de règles

Une liste de blocs est proposée, filtrée selon la **Grande famille** du produit (ex : "Épargne bancaire" → blocs PS, note libre). Chaque bloc affiche :
- Son titre en français
- Un aperçu des champs qu'il contient
- Une description contextuelle

Cocher les blocs pertinents. Il est possible d'en sélectionner plusieurs.

> **Blocs fréquents par famille :**
> - Assurance-vie / PER (Assurance) → PFU, PS, Art. 990 I, Art. 757 B
> - CTO / Titres vifs → PFU, note succession
> - PEA → Exonération ancienneté, PS
> - Livret réglementé (Épargne bancaire) → **note informative uniquement** (MVP) — les produits réglementés (LEP, Livret A, LDDS) peuvent être exonérés d'IR ; le bloc PFU n'est pas proposé par défaut pour éviter une erreur métier. Décrire le régime via une note libre jusqu'à la création d'un template "Épargne réglementée / exonération".
> - PER (Retraite & épargne salariale) → Déductibilité versements, rente RVTO

### Étape 3 — Compléter les champs

Pour chaque bloc sélectionné, les champs apparaissent avec :
- **Labels en français** (aucune clé technique visible)
- **Valeurs automatiques** (badge ★) affichées en lecture seule, lues depuis Paramètres Impôts ou Prélèvements sociaux
- **Champs éditables** : saisir la valeur numérique ou cocher l'option
- **Note complémentaire** (optionnelle) : texte libre affiché sous le bloc

### Enregistrer

Cliquer sur **"Enregistrer"** dans le modal. La phase est immédiatement mise à jour dans la fiche produit. Cliquer ensuite sur **"Enregistrer"** en bas de page pour persister en base.

### Modifier un bloc existant

Pour modifier un bloc déjà en place : cliquer directement sur le champ dans la fiche produit (si non publié), ou créer une nouvelle version du produit via **"Nouvelle version / Dupliquer"**.

---

## Repo hygiene — Delete unused

**Règle** : Si ça ne sert plus = on supprime.

### Ce qu'on considère "sert"

- runtime (`src/**` import/usage)
- build/CI (scripts, `.github`, `package.json`)
- tests/fixtures
- documentation référentielle

### Process

1. **Preuve** : prouver 0 usage (rg/find)
2. **PR** : petite PR ciblée
3. **Validation** : `npm run check` passe
4. **Merge** → sinon **revert**

### Interdits

- Pas de dossiers `archive/`, `backup/`, `old/`, `__spike__`, `_raw` "pour plus tard"
- Pas de "parking" durable (même dans `tools/`) sans preuve d'utilité

### Rollback

- `git revert <sha>` annule la PR en 1 commande

---

Voir aussi :
- `docs/ARCHITECTURE.md` (cartographie)
- `docs/GOUVERNANCE.md` (règles UI/couleurs/thème)
