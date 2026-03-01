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
- [Norme des pages `/sim/*` (baseline `/sim/credit`)](#norme-des-pages-sim-baseline-simcredit)
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
- Pattern standard (forms génériques) : fond `#FFFFFF`, border `1px solid var(--color-c8)`.
- Pattern simulateur `/sim/*` (baseline `/sim/credit`) : fond léger teinté (off-white), border-bottom uniquement, focus `var(--color-c2)`.
- Dans les 2 cas, couleurs non hardcodées (hors exceptions globales) et lisibilité prioritaire.

### Composants (guidelines)
- Buttons : primary = C2 + texte contrasté ; secondary = fond clair + border C8.
- Tables : zebra `C7/WHITE`, borders C8, padding confortable.

### Modales
- Overlay : `rgba(0,0,0,0.5)` (seul rgba autorisé).
- Panel : `#FFFFFF`, centré, `shadow` subtil.

---

## Norme des pages `/sim/*` (baseline `/sim/credit`)
### Source de vérité & périmètre
- Baseline obligatoire : `src/features/credit/Credit.jsx` + `src/features/credit/components/CreditV2.css`.
- Layout partagé : `src/components/simulator/SimulatorShell.css`.
- Styles premium partagés : `src/styles/premium-shared.css`.
- Inputs/select/toggle : `src/features/credit/components/CreditInputs.jsx` + `CreditInputs.css`.
- Cette norme s'applique aux futures pages `/sim/*` sauf exception explicitée en PR.

### 1) Gabarit global page (largeurs, colonnes, structure)
#### Obligatoire
- Conteneur principal : `.sim-page` (`max-width: 1200px; margin: 0 auto; padding: 32px 24px 64px`).
- Exception locale `/sim/credit` : `padding-top: 20px` via `.sim-page.cv2-page`.
- Grille desktop : `grid-template-columns: 1.85fr 1fr; gap: 24px`.
- Même ratio pour la ligne de contrôles (tabs à gauche, toggle de vue à droite).
- Structure minimale :
  1. Header (`h1` + sous-titre + actions)
  2. Ligne de contrôles
  3. Grille gauche/droite
  4. Blocs de détail (tables, accordéons, hypothèses)

#### Recommandé
- Colonne droite sticky pour les blocs de synthèse (`position: sticky; top: 80px`) sur desktop.
- Sur mobile (`max-width: 900px`), passer en mono-colonne, désactiver sticky.

#### Interdit
- Introduire un troisième rail visuel persistant sur desktop.
- Utiliser des largeurs fixes en px pour les colonnes principales.

### 2) Header, titres et barre sous titre
#### Obligatoire
- Header premium : `premium-header` + variante simulateur.
- Titre : `premium-title` (`22px`, `600`, `var(--color-c1)`).
- Sous-titre : `premium-subtitle` (`12px`, `var(--color-c9)`).
- Barre sous header : `border-bottom`.
  - Norme `/sim/*` : `3px solid var(--color-c6)` (validé sur `/sim/credit` et `/sim/ir`).
  - Autres surfaces (hors `/sim/*`) : `2px solid var(--color-c8)`.
- Espacements header `/sim/credit` :
  - `padding-bottom: 8px`
  - `margin-bottom: 16px`
  - `gap: 6px` entre titre et ligne sous-titre/actions.

#### Recommandé
- Conserver la ligne sous-titre/actions en `justify-content: space-between`.
- Garder les actions regroupées à droite dans un container unique.

#### Interdit
- Mettre les actions Export / Mode sous la grille principale.
- Utiliser une barre décorative hardcodée hors tokens.

### 3) Cartes, bordures, ombres, organisation interne
#### Obligatoire
- Cartes de base : `premium-card` (`border: 1px solid C8`, `radius: 12px`, `padding: 20px 24px`, `shadow: 0 2px 12px rgba(0,0,0,0.04)`).
- Carte de guidage (hero de saisie) : `premium-card--guide` avec liseré gauche `3px solid C3`.
- Structure interne d'un bloc de saisie :
  1. Titre (`15px`, `600`, C1) + icône
  2. Sous-titre (`12px`, C9)
  3. Séparateur dégradé
  4. Corps formulaire
- Carte synthèse droite (principale) : `border-left: 3px solid C3`.
- Carte synthèse droite (secondaire / multi-blocs) : `border-left: 3px solid C5`.
- Gradient d'entête subtil (`linear-gradient` C1 5%→transparent) autorisé sur la carte principale.

#### Recommandé
- Espacement entre cartes adjacentes : `20px`.
- Utiliser `font-variant-numeric: tabular-nums` pour toutes les valeurs chiffrées.

#### Interdit
- Ombres fortes/opacités élevées hors pattern premium.
- Bordures verticales internes dans les tableaux de synthèse.

### 4) Barres de séparation (estompées vs solides)
#### Obligatoire
- Séparateur estompé principal (`cv2-loan-card__divider`) :
  - `height: 2px`, `max-width: 200px`,
  - `linear-gradient(90deg, transparent, C8, transparent)`.
- Variante compacte pour zones denses : marge réduite (`--tight`).
- Séparateur solide (`border-bottom: 1px solid C8`) réservé aux titres de section standards.
- Barre de fond sous liste d'onglets : `2px` en dégradé C8->transparent.

#### Règle d'usage
- Estompé : transitions visuelles dans une même card (titre vers contenu, KPI vers détails).
- Solide : structuration stricte d'une section autonome.

#### Interdit
- Doubler deux séparateurs consécutifs (dégradé + bordure solide) sans suppression explicite.

### 5) Inputs, menus déroulants et priorités de remplissage
#### Obligatoire
- Inputs simulateur (pattern `/sim/*`) :
  - `height: 32px`, `font-size: 13px`, `color: C10`.
  - Fond off-white : `color-mix(in srgb, C8 18%, #FFFFFF)`.
  - Base visuelle : `border-bottom: 1px solid transparent`, hover `C8`, focus `C2`.
  - Alignement texte : `text-align: right` sur **tous** les inputs et selects de `/sim/*`, y compris les selects de navigation (Barème, Situation familiale, Résidence, etc.).
- Selects natifs simulateur : même fond off-white + border-bottom + `text-align: right` (pas de select natif navigateur brut).
- Inputs en lecture seule : fond `C7` (override inline acceptable).
- États :
  - Erreur : `border-bottom: C1` + message `11px`.
  - Guide séquentiel : fond `color-mix(C1 8%, white)` sur le premier champ non saisi.
- Select custom (optionnel) :
  - Trigger identique visuellement à un input,
  - dropdown `#FFFFFF`, border `C8`, shadow premium,
  - option hover : mélange `C3`.
- **Implémentation** : chaque feature définit ses règles CSS locales (préfixe feature) en
  suivant ce pattern. Ne pas importer `CreditInputs.css` cross-feature — utiliser
  `src/styles/` pour les tokens partagés (anti-pattern §14).
- Priorité de saisie crédit (onboarding) :
  1. `Montant emprunté`
  2. `Durée`
  3. `Taux annuel (crédit)`

#### Recommandé
- Conserver le format `%` avec normalisation au blur (`0,00`).
- Utiliser les unités visuelles (`€`, `%`, `mois`) en suffixe léger (`C9`).

#### Interdit
- Revenir aux styles natifs navigateur pour les selects dans `/sim/*`.
- Couleurs d'erreur hardcodées hors C1.

### 6) Boutons Exporter et mode simplifié/expert
#### Obligatoire
- Position : dans la zone actions du header, à droite du sous-titre.
- Ordre `/sim/credit` : bouton mode puis `ExportMenu`.
- Taille harmonisée :
  - mode : `padding 8px 16px`, `font-size 13px`, `radius 6px`
  - export trigger : `padding 8px 16px`, `radius 6px`.
- Dropdown export : ancré à droite du bouton, `min-width: 140px`, `z-index: 1000`.

#### Interdit
- Déplacer export en bas de page.
- Ajouter des CTA primaires concurrents dans la même ligne sans justification produit.

### 7) Onglets (ajout/retrait) et comportement
#### Obligatoire
- Pattern onglets prêt :
  - `Prêt 1` toujours présent,
  - `Prêt 2/3` ajoutables selon règles métier,
  - indicateur actif via bordure basse (`2px`) en `C3`.
- Bouton suppression onglet (`×`) hors bouton principal (HTML valide).
- États visuels :
  - hover : texte `C2`, fond `C7`
  - actif : texte `C1`, `font-weight: 600`
  - disabled : texte `C8`.

#### Recommandé
- Conserver le badge `+` circulaire (`18x18`) pour matérialiser l'ajout.
- Garder la logique d'apparition progressive des onglets (progressive disclosure).

#### Interdit
- Autoriser la suppression de l'onglet primaire.
- Utiliser un style d'onglets "pill" pour `/sim/*` tant que la baseline est underline.

### 8) Cartes hero
#### État actuel (baseline)
- Composant hero dédié : **Non défini actuellement**.
- Équivalent utilisé dans `/sim/credit` : `premium-card--guide` (liseré C3 + header avec léger gradient C1).

#### Règle
- Utiliser ce pattern "guide" pour la carte d'entrée principale d'un simulateur.
- Si un vrai composant hero est créé, il doit rester compatible avec:
  - bordure premium (`C8`),
  - accent gauche (`C3`),
  - fond majoritairement neutre (pas de bloc saturé).

### 9) Accordéons (styles et usages)
#### Obligatoire
- Accordéons utilisés sur `/sim/credit` :
  - Échéanciers (`Afficher/Masquer`) via bouton `cv2-schedule__toggle`.
  - Hypothèses/limites via `cv2-hypotheses__toggle`.
- Accordéons utilisés sur `/sim/ir` :
  - Détail du calcul via bouton `.ir-detail-toggle` (adjacent à `.ir-detail-accordion`, hors grid).
  - Hypothèses/limites via `.ir-hypotheses__toggle` (composant `IrDisclaimer`).
- Style minimum :
  - conteneur `#FFFFFF` (tables) ou `C7` (bloc hypothèses),
  - border `1px solid C8`,
  - radius `12px`,
  - chevron animé (rotation 180° open).
- Toggle détail (hors card) : `border 1px solid C8`, `bg C7`, `radius 6px`, `12px`, hover `C2`.
- État initial :
  - échéanciers / détail calcul : fermés par défaut,
  - hypothèses : fermé par défaut (ouverture manuelle).

#### Recommandé
- Garder un wording d'action explicite (`Afficher`/`Masquer`), pas uniquement une icône.

#### Interdit
- Accordéon sans attribut `aria-expanded`.

### 10) Code couleur complet (mapping)
#### Obligatoire
- Tokens uniques `--color-c1..--color-c10` (source: `src/settings/theme.ts` + `src/styles.css`).
- Valeurs par défaut SER1 Classic :
  - C1 `#2B3E37`
  - C2 `#709B8B`
  - C3 `#9FBDB2`
  - C4 `#CFDED8`
  - C5 `#788781`
  - C6 `#CEC1B6`
  - C7 `#F5F3F0`
  - C8 `#D9D9D9`
  - C9 `#7F7F7F`
  - C10 `#000000`
- Usage `/sim/credit` à reproduire :
  - C1 : titres, valeurs clés, emphase finale.
  - C2 : états interactifs actifs (pill active, focus visible).
  - C3 : marqueur actif/tab + liseré guide principal.
  - C4 : fonds d'accent doux (icône section, switch actif).
  - C5 : liseré secondaire (synthèse globale multi-prêts).
  - C6 : accent chaud (barre header crédit, segment donut intérêts).
  - C7 : fonds neutres/hovers légers.
  - C8 : bordures, séparateurs, bases de champs.
  - C9 : texte secondaire/métadonnées.
  - C10 : texte principal.

### 11) Responsive et accessibilité
#### Obligatoire
- Breakpoint `900px` :
  - page en 1 colonne,
  - colonne synthèse au-dessus du formulaire,
  - sticky désactivé.
- Breakpoint `600px` :
  - titre ramené à `18px`,
  - tabs compactés.
- Focus clavier visible sur onglets, boutons toggle, pills, actions export.

#### Interdit
- Supprimer `:focus-visible` sans alternative.

### 12) À faire / À éviter (exemples)
#### À faire
- Réutiliser `sim-page` + `premium-header` + grille `1.85fr/1fr`.
- Placer `Mode` + `Exporter` dans le header, côté droit.
- Utiliser séparateurs dégradés pour les transitions à l'intérieur des cards.
- Implémenter les champs numériques avec alignement à droite et unités suffixées.

#### À éviter
- Réintroduire des couleurs hex ad hoc pour les états UI.
- Mixer plusieurs styles d'inputs dans la même page `/sim/*`.
- Changer la hiérarchie visuelle (synthèse clé noyée sous les tableaux).

### 13) Cas d'exception
- Si un simulateur impose un layout non sticky ou mono-colonne desktop (ex. contraintes métier fortes), documenter:
  - raison produit,
  - impact UX,
  - capture avant/après.
- Si une valeur n'est pas définie dans les sources CSS/JS citées ci-dessus: documenter explicitement `Non défini actuellement`.

### 14) Comment étendre sans casser la norme
1. Partir de `SimulatorShell.css` + `premium-shared.css`.
2. Créer un CSS feature local (ex: `FeatureX.css`) avec préfixe propre.
3. Garder les tokens C1..C10; ne pas créer de palette parallèle.
4. Ajouter les variantes (tabs, hero, accordéon) par composition de classes avant surcharge.
5. Documenter toute dérogation dans cette section + preuve code.

---

## Gouvernance couleurs (C1–C10)
### Regle
- Utiliser uniquement les tokens `C1..C10` via variables CSS `--color-c1..--color-c10`.
- Hardcode interdit sauf exceptions listees ci-dessous.

### Norme d usage (UI)
- C1 : Titres, top bar, elements structurants et actions danger.
- C2 : Actions primaires, liens, CTA et etats interactifs forts.
- C3 : Etat actif ou positif visible (onglet actif, validation, repere).
- C4 : Fond d accent doux pour focus ring, survol leger et zone active.
- C5 : Separation renforcee pour liseres secondaires et blocs de synthese.
- C6 : Accent chaud decoratif pour signatures visuelles non interactives.
- C7 : Fond global et surfaces neutres de l interface.
- C8 : Bordures standard, separateurs fins, contours d inputs et tableaux.
- C9 : Texte secondaire (labels, aides, metadonnees, micro-copie).
- C10 : Texte principal et valeurs a forte lisibilite.

### Exceptions autorisees (liste exhaustive)
- `#FFFFFF` (WHITE) : fond raised (cards/panels) et texte sur fonds tres sombres.
- `#996600` (WARNING) : warning hardcode (le theme user peut rendre tout autre token illisible).
- `rgba(0,0,0,0.5)` : overlay modale (seul rgba autorise).

### Contraste
- Pas de texte blanc sur fond C7.
- Headers colores (ex: Excel header) : couleur de texte calculee selon le fond (helper existant cote Excel).

### Etats semantiques (rappel)
- `danger` : utiliser C1 (pas de rouge hardcode).
- `warning` : WARNING (`#996600`) obligatoire.
- `success/info` : derives de C2-C4 selon contexte.

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
- UI premium shared : `src/components/simulator/SimulatorShell.css`, `src/styles/premium-shared.css`
- Baseline `/sim/credit` : `src/features/credit/Credit.jsx`, `src/features/credit/components/CreditV2.css`
- Inputs simulateur : `src/features/credit/components/CreditInputs.jsx`, `src/features/credit/components/CreditInputs.css`
- ESLint couleurs : `tools/eslint-plugin-ser1-colors/`

