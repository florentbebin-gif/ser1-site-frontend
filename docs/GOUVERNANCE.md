# GOUVERNANCE (UI / Couleurs / Thème)

## But
Définir **les règles non négociables** pour garder une UI premium et un theming cohérent (web + PPTX + Excel).

## Audience
Toute personne qui touche : CSS/UI, exports, thème, Settings.

## Ce que ce doc couvre / ne couvre pas
- ✅ Couvre : design system UI, gouvernance couleurs, modes de thème V5, anti-patterns.
- ❌ Ne couvre pas : runbook de debug (voir `docs/RUNBOOK.md`) ni architecture détaillée (voir `docs/ARCHITECTURE.md`).

## Sommaire
- [Règles UI premium](#règles-ui-premium)
- [Gouvernance couleurs (C1–C10)](#gouvernance-couleurs-c1c10)
- [Système de thème V5 (3 modes)](#système-de-thème-v5-3-modes)
- [Sécurité & observabilité (règles)](#sécurité--observabilité-règles)
- [Anti-patterns](#anti-patterns)
- [Références code](#références-code)

---

## Règles UI premium
Principes : épuré, lisible, respirant.

### Hiérarchie des surfaces
- **Fond de page** : `var(--color-c7)`.
- **Cards/panels/modales** : `#FFFFFF` (exception autorisée), border `var(--color-c8)`, radius 8–12px.

### Typographie
- Titres : *Sentence case*, poids 500–600.
- Texte secondaire/labels : `var(--color-c9)`.
- Messages utilisateur : **français**.

### Inputs (règle critique)
- **Fond TOUJOURS blanc** : `background-color: #FFFFFF`.
- Border : `1px solid var(--color-c8)`.
- Focus : `border-color: var(--color-c2)` + ring `var(--color-c4)`.

### Composants (guidelines)
- Buttons : primary = C2 + texte contrasté ; secondary = fond clair + border C8.
- Tables : zebra `C7/WHITE`, borders C8, padding confortable.

### Modales
- Overlay : `rgba(0,0,0,0.5)` (seul rgba autorisé).
- Panel : `#FFFFFF`, centré, `shadow` subtil.

---

## Gouvernance couleurs (C1–C10)
### Règle
- Utiliser uniquement les tokens `C1..C10` via variables CSS `--color-c1..--color-c10`.
- **Hardcode interdit** sauf exceptions listées ci-dessous.

### Tokens par défaut (rôle)
- C1 : brand dark (fonds/titres selon contexte)
- C2 : primary / CTA
- C7 : surface page
- C8 : border
- C9 : text muted
- C10 : text primary

### Exceptions autorisées (liste exhaustive)
- `#FFFFFF` (WHITE) : fond raised (cards/panels) et texte sur fonds très sombres.
- `#996600` (WARNING) : warning hardcodé (le thème user peut rendre tout autre token illisible).
- `rgba(0,0,0,0.5)` : overlay modale (seul rgba autorisé).

### Contraste
- Pas de texte blanc sur fond C7.
- Headers “colorés” (ex: Excel header) : couleur de texte **calculée** selon le fond (helper existant côté Excel).

### États sémantiques (rappel)
- `danger` : utiliser C1 (pas de rouge hardcodé).
- `warning` : WARNING (`#996600`) obligatoire.
- `success/info` : dérivés de C2–C4 selon contexte.

---

## Système de thème V5 (3 modes)
Le theming doit rester **déterministe** et persistant en DB.

### Modes
- `cabinet` : branding du cabinet (source principale, notamment pour PPTX).
- `preset` : thème prédéfini.
- `my` : palette personnalisée de l’utilisateur.

### Règles métier (à respecter)
1. Clic preset → `theme_mode='preset'`, `preset_id=id`, **ne touche jamais** `my_palette`.
2. Clic cabinet → `theme_mode='cabinet'`.
3. Clic “Mon thème” → `theme_mode='my'` + applique `my_palette`.
4. “Enregistrer” → écrit `my_palette` **uniquement** si `themeMode='my'`.
5. `localStorage` = miroir anti-flash (pas source de vérité).

---

## Sécurité & observabilité (règles)

### Autorisation
- Interdit : utiliser `user_metadata` pour des décisions d'autorisation.
- Autorisé : `app_metadata.role` uniquement (frontend + edge + RLS).

### Logs
- Zéro PII (email, nom, montants, RFR, patrimoine, etc.).
- Zéro métriques métier (compteurs de simulations, montants calculés, types produits utilisés).
- En prod : `console.log/debug/info/trace` interdits (ESLint).

---

## Catalogue patrimonial — règles métier

### Contexte & trajectoire
Le client du CGP est une **personne physique** qui souhaite des conseils sur :
- son patrimoine personnel (PP),
- ou l'entreprise qu'il détient (PM).

L'application vise à devenir un SaaS de gestion de patrimoine pour CGP, permettant simulations et analyse patrimoniale. Chaque produit du catalogue doit être qualifié selon ce prisme.

### Règle de regroupement des produits (3 phases fiscales)
On peut regrouper des produits **uniquement** si les 3 phases fiscales sont identiques :
1. **Constitution** — taxation des revenus (intérêts, dividendes, loyers…)
2. **Sortie / Rachat** — fiscalité de la cession ou du rachat
3. **Décès / Transmission** — fiscalité successorale (DMTG, exonérations…)

Ces 3 phases correspondent dans les blocs produit aux clés `constitution`, `sortie`, `deces`.

> Exemple : on ne regroupe PAS les GFA/GFV et les GFF car l'exonération DMTG relève d'articles différents (art. 793 bis vs art. 793 1° 3° CGI).

### Taxonomie des familles (grandeFamille)
| Famille | Contenu | Type |
|---------|---------|------|
| Épargne Assurance | AV, contrat de capitalisation | Wrappers (épargne) |
| Assurance prévoyance | Prévoyance décès, ITT/invalidité, dépendance, emprunteur, obsèques, homme-clé | Protections |
| Épargne bancaire | Livrets, PEL, CEL, CAT, CSL, PEAC, CTO, PEA, PEA-PME | Wrappers (comptes/enveloppes) |
| Valeurs mobilières | Actions, FCPR, FCPI, FIP, OPCI, parts sociales, titres participatifs, BSA/DPS | Actifs détenus en direct |
| Immobilier direct | RP, RS, locatif nu, LMNP, LMP, garages, terrains | Actifs |
| Immobilier indirect | SCPI, GFA/GFV, GFF | Actifs (pierre-papier) |
| Non coté/PE | Actions non cotées, crowdfunding, obligations non cotées, SOFICA, IR-PME | Actifs |
| Créances/Droits | Compte courant associé, prêt entre particuliers, usufruit/nue-propriété | Actifs |
| Dispositifs fiscaux immobilier | Pinel, Malraux, MH, Scellier, Denormandie… | Overlays fiscaux |
| Retraite & épargne salariale | PER, PEE, PERCOL, PERCO, Art. 83/39, Madelin, PERP | Wrappers |
| Autres | Métaux précieux, crypto-actifs, tontine | Actifs divers |

### Règles de holdability (PP / PM)
- **Résidence secondaire** : PP-only (une PM qui détient un immeuble = locatif, pas « résidence »).
- **LMNP / LMP** : PP-only (statut personne physique ; exceptions société à l’IR non gérées).
- **Épargne réglementée** (Livret A, LDDS, LEP, Livret Jeune, PEL, CEL) : PP-only.
- **PEA / PEA-PME / PERIN** : PP-only.
- **Obligations** (OAT, corporate, convertibles) : retirées du catalogue (détention uniquement via CTO/PEA).
- Les produits PP+PM sont **splittés** en deux lignes (PP et PM) dans le catalogue V5.

### Produits non directement souscriptibles (exclus du catalogue)
- OPC / OPCVM / SICAV / FCP / ETF → sous-jacents de CTO/PEA, pas de souscription directe.
- FCPE → sous-jacent de PEE/PERCOL.

### Problèmes identifiés (page BaseContrat)
- **Rulesets vides** : les blocs fiscaux (Constitution/Sortie/Décès) sont des squelettes vides pour la majorité des produits. Les templates existent mais ne sont pas encore assignés par produit.
- **Pas de confirmation avant sync** : le bouton « Synchroniser » écrase sans confirmation. Ajouter un dialog de confirmation.
- **Produits personnalisés perdus après sync** : `syncProductsWithSeed` ne garde que les produits du seed. Les produits ajoutés manuellement par l'admin sont supprimés.
- **Migration label (Entreprise) → (PM)** : les données DB existantes avec le suffixe « (Entreprise) » ne sont pas encore retouchées par la migration V5 (les labels seront mis à jour au prochain sync).

---

## Anti-patterns
- Calcul métier fiscal dans React (doit aller dans `src/engine/`).
- Import CSS cross-page (styles partagés → `src/styles/`).
- Couleurs hardcodées hors exceptions.
- Logs en prod via `console.log/debug/info/trace` (bloqué ESLint).
- Autorisation basée sur `user_metadata`.

---

## Références code
- Tokens & defaults : `src/settings/theme.ts`, `src/styles.css`
- ThemeProvider V5 : `src/settings/ThemeProvider.tsx`, `src/settings/presets.ts`, `src/settings/theme/types.ts`
- UI premium classes : `src/styles.css` + composants Settings (`src/components/settings/SettingsSectionCard.jsx`)
- ESLint couleurs : `tools/eslint-plugin-ser1-colors/`
