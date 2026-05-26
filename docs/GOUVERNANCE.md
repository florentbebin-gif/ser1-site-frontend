# GOUVERNANCE (UI / Couleurs / Thème)

## But

Définir **les règles non négociables** pour garder une UI premium et un theming web cohérent.

## Audience

Toute personne qui touche : CSS/UI, thème, Settings, pages `/sim/*`.

## Ce que ce doc couvre / ne couvre pas

- ✅ Couvre : design system UI, gouvernance couleurs, baseline `/sim/*`, modes de thème V5, anti-patterns.
- ❌ Ne couvre pas : runbook de debug (voir `docs/RUNBOOK.md`), architecture détaillée (voir `docs/ARCHITECTURE.md`) ni gouvernance PPTX/Excel (voir `docs/GOUVERNANCE_EXPORTS.md`).

## Sommaire

- [Règles UI premium](#règles-ui-premium)
- [Propriété des styles](#propriété-des-styles)
- [Norme des pages `/sim/*` (baseline `/sim/credit`)](#norme-des-pages-sim-baseline-simcredit)
  - [§0 Checklist d'audit obligatoire pour une page `/sim/*`](#0-checklist-daudit-obligatoire-pour-une-page-sim)
  - [§16 Anatomie complète et patterns prouvés](#16-anatomie-complète-dune-page-sim--patterns-prouvés)
  - [§17 Diagnostic /sim/per/potentiel](#17-diagnostic-simper-potentiel--écarts-et-cibles)
- [Gouvernance couleurs (C1–C10)](#gouvernance-couleurs-c1c10)
- [Système de thème V5 (3 modes)](#système-de-thème-v5-3-modes)
- [Sécurité & observabilité (règles)](#sécurité--observabilité-règles)
- [Anti-patterns](#anti-patterns)
- [Gouvernance exports (renvoi)](#gouvernance-exports)
- [Références code](#références-code)

---

## Règles UI premium

Principes : épuré, lisible, respirant.

### Hiérarchie des surfaces

- **Fond de page** : `var(--color-c7)`.
- **Cards/panels/modales** : `#FFFFFF` (exception autorisée), border `var(--color-c8)`, radius 8–12px.

### Typographie

- Titres : _Sentence case_, poids 500–600.
- Texte secondaire/labels : `var(--color-c9)`.
- Messages utilisateur : **français**.
- Les textes affichés à l’utilisateur doivent inclure les accents et les apostrophes typographiques.

### Inputs (règle critique)

- Pattern standard (forms génériques) : fond `#FFFFFF`, border `1px solid var(--color-c8)`.
- Pattern simulateur `/sim/*` (baseline `/sim/credit`) : fond léger teinté (off-white), border-bottom uniquement, focus `var(--color-c2)`.
- Dans les 2 cas, couleurs non hardcodées (hors exceptions globales) et lisibilité prioritaire.

### Séparateur de milliers (règle critique)

- **Tout champ de saisie affichant un montant en euros doit formater la valeur avec `toLocaleString('fr-FR')`** (ex. "100 000" et non "100000").
- Utiliser systématiquement les composants partagés qui implémentent déjà ce formatage : `InputEuro` (Placement/Credit), `IrAmountInput` (IR). Ne pas créer de `<input type="number">` brut pour des montants €.
- Exceptions acceptées (pas de formatage nécessaire) : âges, durées (années/mois), pourcentages (0–100 %), champs admin Settings (tableau de saisie du barème, montants de référence).
- **Anti-pattern** : `<input type="number" value={montant} />` pour un montant € → affiche "1000000" au lieu de "1 000 000", mauvaise lisibilité utilisateur.
- Références implémentées : `InputEuro` dans `PlacementFormControls.tsx` (Placement), `CreditInputs.tsx` (Credit), `IrAmountInput` dans `IrFormSection.tsx` (IR).
- Références **non encore migrées** (acceptable temporairement) : champs € dans modales Succession (`AssuranceVieModal`, `ScDonationsCard`, `ScAssetsPassifsCard`), champs ponctuel dans `VersementConfigModalSections.tsx`.

### Taux et pourcentages (règle critique)

- Les moteurs et catalogues peuvent stocker les taux en décimal (`0.0495`), mais l'utilisateur doit toujours saisir et lire un pourcentage (`4,95 %`).
- Toute UI qui édite un taux doit séparer conversion UI ↔ donnée : affichage en %, sauvegarde en décimal si le type ou le moteur l'exige.
- Les parseurs doivent accepter virgule et point (`4,95`, `4.95`) et conserver les textes contractuels déjà explicites (`NC`, `TMG 2 %`, `taux garanti selon millésime`).
- Les champs de taux doivent avoir un suffixe visuel (`%`, `% / an`, `% du capital`) et ne jamais exposer une valeur brute décimale.
- Pour auditer une page, chercher `Rate`, `taux`, `frais`, `rendement`, `pourcentage`, `%` dans les fichiers UI, helpers de normalisation, tests et exports.

### Selects forcés / option unique (règle critique)

- Un `<select>` avec une seule option atteignable (ex. : bénéficiaire quand la situation est "Célibataire") doit recevoir `disabled` + class `is-forced`.
- Styles CSS requis : `background: var(--color-c7); color: var(--color-c9); cursor: not-allowed; pointer-events: none;`
- **Anti-pattern** : laisser un `<select>` actif et cliquable quand une seule option est visible → fausse sensation d'interactivité.
- Référence implémentée : `pl-select.is-forced` dans `src/features/placement/styles/controls.css`, utilisé sur le select "Choix du bénéficiaire" en situation "Célibataire".

### Composants (guidelines)

- Buttons : primary = C2 + texte contrasté ; secondary = fond clair + border C8.
- Tables : zebra `C7/WHITE`, borders C8, padding confortable.
- Aide contextuelle champ : `SimInfoButton` uniquement, intégré dans le label du champ via `SimFieldShell label={ReactNode}`. Un lien ou bouton texte "Info" / "Comprendre" éloigné du champ est un écart UX.

### Home — entrée scan documentaire IA

- La Home garde la hiérarchie : `AUDIT & STRATÉGIE` en entrée métier principale, puis `SIMULATEURS` en bloc secondaire.
- Le scan documentaire IA n'est pas un simulateur. Il prépare un dossier d'audit ; il doit donc être placé dans le bloc `AUDIT & STRATÉGIE`, avant le séparateur et avant la section `SIMULATEURS`.
- Pattern cible desktop : deux actions dans le bloc central, de même famille visuelle que `hero-tile` :
  - `Nouvelle stratégie` / audit manuel ;
  - `Préparer un dossier par documents` / scan IA.
- Si une seule action doit rester dominante, garder `Nouvelle stratégie` en premier et afficher le scan IA comme action secondaire alignée ou empilée sous la première, sans descendre dans la grille des simulateurs.
- Le libellé public doit éviter "chat IA" ou "assistant". Préférer `Scan documentaire`, `Préparer un dossier par documents` ou `Traitement documentaire IA`.
- Le flux ouvert par cette action doit afficher une revue guidée : documents, extraction, champs proposés, sources, score de confiance, actions `Valider`, `Corriger`, `Ignorer`, `Demander pièce complémentaire`. Pas de zone de chat libre CGP ↔ LLM.

### Modales

- Overlay : `rgba(0,0,0,0.5)` (seul rgba autorisé).
- Panel : `#FFFFFF`, centré, `shadow` subtil.
- Modales `/sim/*` : utiliser `SimModalShell` et ses slots (`title`, `subtitle`, `children`, `footer`), sauf exception documentée.
- Accessibilité modale : `SimModalShell` doit porter `role="dialog"`, `aria-modal="true"` et `aria-labelledby` relié au titre visible.
- Footer : les boutons d'action sont passés via la prop `footer`, alignés à droite, avec les classes partagées `sim-modal-btn--ghost` et `sim-modal-btn--primary`.
- **Scroll obligatoire** : toute modale dont le contenu peut croître (liste dynamique, formulaire à n entrées) doit appliquer le patron suivant :
  - `max-height: calc(100vh - 40px)` + `display: flex; flex-direction: column` sur le container `.modal`
  - `overflow-y: auto; flex: 1 1 auto; min-height: 0` sur le `.modal__body`
  - Header et footer restent en position statique hors du scroll (pas de `overflow` sur le container).
  - Anti-pattern : `overflow: visible` sur le container sans `max-height` → la modale dépasse la viewport et devient inutilisable.
  - Référence : `sc-dispositions-modal` / `sc-member-modal` (`src/features/succession/styles/modals.css`), `.vcm` / `.vcm__body` (`src/features/placement/styles/versements-modal.css`).

---

## Propriété des styles

Le repo reste en CSS global classique, mais la propriété des styles est désormais stricte.

### Domaines autorisés

- `src/styles/index.css` : tokens, reset, variables racines, rien d’autre.
- `src/styles/app/*` : chrome applicatif global (`topbar`, breadcrumbs, chips, états shell).
- `src/styles/premium-shared.css` : primitives premium transverses chargées une seule fois dans `src/main.tsx`.
- `src/styles/sim/*` : baseline partagée `/sim/*`.
- `src/pages/settings/styles/*` : styles partagés et page-specific du domaine settings.
- `src/features/<feature>/styles/*` : styles locaux d’une feature. Pour l’audit : `src/features/audit/styles/*`.

### Règles

- Un style n’est promu vers le partagé que s’il est prouvé sur plusieurs surfaces runtime ou imposé par cette gouvernance.
- Une feature ne doit jamais importer le CSS d’une autre feature.
- Les entrées simulateur importent `@/styles/sim/index.css` puis leur bundle local `./styles/index.css`.
- `premium-shared.css` ne doit plus être importé par les features runtime.
- Les styles inline sont réservés aux valeurs réellement dynamiques (dimensions, couleurs calculées, géométrie runtime).

### Garde-fous

- `npm run lint:css` : lint syntaxique CSS.
- `npm run check:css-structure` : vérifie les contrats d’import et l’absence de retour vers les anciens points d’entrée CSS.

---

## Norme des pages `/sim/*` (baseline `/sim/credit`)

### Source de vérité & périmètre

- Baseline obligatoire : `src/features/credit/Credit.tsx` + `src/features/credit/styles/index.css`.
- Baseline produit cible : **SIM SER1 2026 hybride**. Elle conserve les repères éprouvés `/sim/credit` et `/sim/ir`, mais impose des états vides utiles, des actions header stables (`Mode expert`, `Exporter`) et un ordre mobile orienté saisie.
- Layout partagé : `src/styles/sim/index.css`.
- Implémentation page-level de référence : `src/components/ui/sim/SimPageShell.tsx`.
- Styles premium partagés : `src/styles/premium-shared.css`.
- Inputs/select/toggle : `src/features/credit/components/CreditInputs.tsx` + `src/features/credit/styles/fields.css`.
- Cette norme s'applique aux futures pages `/sim/*` sauf exception explicitée en PR.

### 0) Checklist d'audit obligatoire pour une page `/sim/*`

Cette checklist est le contrat minimum pour créer, modifier ou auditer une page simulateur. Un LLM chargé d'un audit doit répondre en findings `chemin:ligne`, avec preuve (`rg`, import, classe, test ou extrait), impact et recommandation minimale.

#### Lecture préalable

- Identifier la route dans `src/routes/appRoutes.ts`, le composant runtime et les CSS importés.
- Vérifier que l'entrée simulateur importe d'abord `@/styles/sim/index.css`, puis son CSS local.
- Comparer la page aux références : `/sim/credit`, `/sim/ir`, `/sim/succession`, `/sim/per/transfert`.
- Chercher les écarts par `rg`, par exemple :
  ```powershell
  rg -n "SimInfoButton|sim-info-btn|Frais|Comprendre|Info|modal|Hypothèses|premium-card--guide|sim-card--guide|/mois|Rate|taux" src/features/<feature>
  ```

#### Structure page

- Le premier écran doit être l'outil utilisable, pas une page marketing.
- Le shell doit suivre `SimPageShell` ou reproduire son contrat : header, contrôles, grille `1.85fr / 1fr`, colonne droite sticky, sections pleine largeur en bas.
- Les actions globales (`ExportMenu`, mode simplifié/expert) restent dans le header. Ne pas ajouter de doublon d'export ou d'édition dans la sidebar.
- La navigation de workflow utilise des tabs underline avec états `aria-selected`, `disabled` si nécessaire, pas des pills décoratifs.

#### Blocs et liserés

- Tous les blocs de saisie ou de décision métier de la colonne gauche doivent être des cards avec bordure et liseré : `premium-card premium-card--guide sim-card--guide`.
- Les headers de blocs utilisent `sim-card__header--bleed` quand la card reprend le pattern simulateur.
- Un bloc sans liseré ou sans cadre dans une page `/sim/*` est un écart, sauf justification documentée.
- Les sous-titres de blocs doivent porter une aide métier. Interdit : sous-titre technique ou interne du type "base locale", "source JSON", "version extraite", "enrichissable depuis settings". Les accès settings ou référentiels vont en action contextuelle dans le header du bloc.

#### Champs, montants et taux

- Les montants en euros saisis ou affichés dans des KPI doivent utiliser le format français avec séparateurs de milliers (`100 000`, pas `100000`).
- Les taux stockés en décimal (`0.0495`) doivent être affichés et saisis en pourcentage utilisateur (`4,95 %`). La saisie doit accepter virgule et point.
- Dès qu'un champ, helper, type ou colonne contient `Rate`, `taux`, `frais`, `rendement`, `TMG`, `pourcentage` ou `%`, l'audit doit vérifier :
  - conversion décimal vers pourcentage et retour vers décimal ;
  - suffixe visuel `%` ou `% / an` ;
  - absence de valeur brute `0.0495` visible ;
  - conservation des textes contractuels explicites (`NC`, `TMG 2 %`, phrases libres).
- Les unités ne sont pas dans le placeholder : elles sont rendues en suffixe visuel.
- Les champs d'information calculée courte peuvent être rendus en badge inline près du label, pas en bandeau grossier. Exemple : `Taux conversion 3,00 %`.

#### Boutons d'information

- Toute aide contextuelle liée à un champ doit utiliser `SimInfoButton` (`src/components/ui/sim/SimInfoButton.tsx`) dans le label du `SimFieldShell`.
- Le bouton est un petit `i` rond, adjacent au libellé du champ, avec `aria-label` explicite.
- Interdit : bouton texte long sous le champ, bouton isolé dans le footer du bloc, ou lien "Comprendre..." éloigné de l'input concerné.
- Si une page a une modale explicative mais aucun `SimInfoButton` près du libellé concerné, c'est un finding UX.

#### Modales

- Toute modale simulateur doit utiliser `SimModalShell`.
- Les boutons de validation/annulation passent par la prop `footer`, pas par un footer bricolé dans le body.
- Les boutons de footer utilisent `sim-modal-btn sim-modal-btn--ghost` et `sim-modal-btn sim-modal-btn--primary`, alignés à droite.
- Les formulaires modaux suivent la même logique d'inputs que la page : montants lisibles, taux en %, `SimSelect` pour les selects, scroll body si contenu long.
- Le bouton qui ouvre une modale doit être positionné dans le contexte métier : près du champ concerné via `SimInfoButton`, dans les actions du bloc, ou dans une zone d'actions inline sobre. Pas de CTA primaire concurrent si la modale est secondaire.

#### Sidebar, KPI et graphiques

- La colonne droite contient la synthèse, pas de formulaire principal.
- Si les prérequis de calcul ne sont pas renseignés, la colonne droite affiche un état vide utile via le pattern partagé `.sim-sidebar-empty-state`, plutôt que des KPI à zéro ou une colonne vide.
- Un KPI principal : label 11px, valeur 26-30px, `font-variant-numeric: tabular-nums`, unité explicite (`/an`, `%`, `€`) et cohérente avec les tableaux/export.
- Les KPI secondaires sont courts, en grille 2x2 ou stack dense.
- Les alertes métier ou "points d'attention" doivent être non verbeuses : libellé fort + détail d'une ligne maximum, avec état neutre si rien n'est détecté.
- Les donuts, barres segmentées et graphiques visuels restent dans la colonne droite. Taille donut cible : 56-64px desktop / 48px mobile, avec `aria-label` et légende compacte.
- Interdit : graphique ou donut décoratif dans la colonne de saisie.

#### Accordéons, détails et hypothèses

- Les sections de détail longues (comparaison, échéancier, projection, audit volumineux) sont repliables avec bouton local, chevron ou signe explicite, et `aria-expanded`.
- Les détails et comparaisons sont fermés par défaut, sauf bloc métier volontairement prioritaire. Exemple accepté : audit Base CG ouvert par défaut pour devoir de conseil.
- Le bas de page doit contenir un bloc `Hypothèses et limites` repliable, fermé par défaut, dès que la page contient :
  - hypothèses de calcul ;
  - fallback ou approximation ;
  - référentiel indicatif ;
  - règle fiscale/sociale simplifiée ;
  - incertitude documentaire ou juridique.
- Les disclaimers métier ne doivent pas vivre uniquement dans une modale : ils doivent être retrouvables en bas de page et dans les exports si la recommandation client s'appuie dessus.

#### Sorties et cohérence d'unités

- Les unités doivent être cohérentes sur toute la page, les tableaux, les graphiques, la sidebar et l'export. Exemple : une rente annualisée ne doit laisser aucun `/mois`.
- Toute conversion métier visible dans un KPI doit être issue du moteur ou d'un helper testé, jamais d'une valeur d'acceptation hardcodée.
- Les hypothèses affichées dans la page doivent être reprises dans les exports PPTX/XLSX quand l'étude peut être remise au client.

#### Revue d'écarts attendue

Pour une demande du type "trouve les écarts de normes sur `/sim/tresorerie-societe`", la réponse doit au minimum couvrir :

- shell/layout/header/actions ;
- liserés/cadres des blocs ;
- champs montants/taux/unités ;
- boutons d'info `i` ;
- modales/footer ;
- KPI/sidebar/donut ;
- tabs/navigation ;
- accordéons/détails ;
- hypothèses et limites ;
- cohérence export si la page exporte.

### 1) Gabarit global page (largeurs, colonnes, structure)

#### Obligatoire

- Conteneur principal : `.sim-page` (`max-width: 1200px; margin: 0 auto; padding: 32px 24px 64px`).
- Exception locale `/sim/credit` : `padding-top: 20px` via `.sim-page.cv2-page`.
- Grille desktop : `grid-template-columns: 1.85fr 1fr; gap: 24px`.
- Rythme vertical des colonnes : `SimPageShell.Main` / `.sim-grid__col--main` espace les blocs de page de `24px` ; `SimPageShell.Side` / `.sim-grid__col--side` espace les cards de synthèse de `16px`.
- Même ratio pour la ligne de contrôles (tabs à gauche, toggle de vue à droite).
- Structure minimale :
  1. Header (`h1` + sous-titre + actions)
  2. Ligne de contrôles
  3. Grille gauche/droite
  4. Blocs de détail (tables, accordéons, hypothèses)
- Le rendu de cette structure doit désormais passer par `SimPageShell`, sauf exception documentée en PR.

#### Recommandé

- Colonne droite sticky pour les blocs de synthèse (`position: sticky; top: 80px`) sur desktop.
- **Variante `/sim/ir`** : les contrôles (Barème, Résidence) sont non-sticky et défilent avec la page ; les cartes de résultats sont enveloppées dans un wrapper `.ir-results-sticky` sticky. Justification : quand l'utilisateur remplit une longue colonne gauche, les chiffres clés restent visibles en permanence.
- Sur mobile (`max-width: 900px`), passer en mono-colonne, désactiver sticky et afficher la saisie avant la synthèse par défaut.
- Exception mobile : `mobileSideFirst` reste possible uniquement si la page justifie explicitement que la synthèse est utile avant la saisie.

#### Interdit

- Introduire un troisième rail visuel persistant sur desktop.
- Utiliser des largeurs fixes en px pour les colonnes principales.
- Dépasser localement le `max-width: 1200px` de `.sim-page`.
- Corriger l'espacement entre blocs par une série de marges locales de colonne ; enrichir le shell partagé sauf exception documentée en PR.

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
- Carte synthèse droite (secondaire / multi-blocs) : `border-left: 3px solid C3`.
- Gradient d'entête subtil (`linear-gradient` C4 18%→transparent) autorisé sur la carte principale.

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
  - Exception selects longs : `text-align: left` est accepté pour des libellés métier longs si la page le documente et garde le même composant partagé (`SimSelect` ou trigger équivalent).
  - Placeholder numérique : afficher uniquement la valeur (`0`, `0,00`) dans le champ ; l'unité (`€`, `%`, `mois`, etc.) est rendue en suffixe visuel à côté du champ, pas dans le placeholder.
  - Couleur des placeholders : `C9` sur tous les inputs `/sim/*`.
- Selects natifs simulateur : même fond off-white + border-bottom + `text-align: right` (pas de select natif navigateur brut).
- **Selects dans modales `/sim/*`** : utiliser `SimSelect` pour reprendre le rendu partagé de `src/styles/sim/fields.css` et l'aligner visuellement avec les `InputEuro`/`InputPct` adjacents.
- Inputs en lecture seule passifs (valeur calculée non modifiable) : fond `C7` (override inline acceptable).
- Inputs inactifs conditionnels (ex. : champ désactivé par un select de mode) : fond `#FFFFFF` pour signaler visuellement l'inactivité — exception listée aux couleurs hardcodées.
- Contraste sur surface colorée : si un input / select / champ date-month / trigger de select custom est placé sur une surface déjà teintée (premium-table, sous-card C7/C8, modal interne teintée, bloc secondaire coloré), l’intérieur du contrôle doit être blanc (#FFFFFF).
- Implémentation recommandée : utiliser une variable CSS d’héritage de type `--sim-input-bg`, avec fond par défaut off-white et override à `#FFFFFF` porté par le conteneur coloré, pas par chaque champ individuellement.
- Exception unités : ne pas dupliquer une unité déjà portée par un menu déroulant ou par ses options/libellés.
- États :
  - Erreur : `border-bottom: C1` + message `11px`.
  - Guide séquentiel : fond `color-mix(C1 8%, white)` sur le premier champ non saisi.
- Select custom (optionnel) :
  - Trigger identique visuellement à un input,
  - dropdown `#FFFFFF`, border `C8`, shadow premium,
  - option hover : mélange `C3`.
- **Implémentation** : chaque feature définit ses règles CSS locales (préfixe feature) en
  suivant ce pattern. Ne pas importer `src/features/credit/styles/fields.css` cross-feature — utiliser
  `src/styles/` pour les tokens partagés (anti-pattern §14).
- Priorité de saisie crédit (onboarding) :
  1. `Montant emprunté`
  2. `Durée`
  3. `Taux annuel (crédit)`

#### Recommandé

- Conserver le format `%` avec normalisation au blur (`0,00`).
- Utiliser les unités visuelles (`€`, `%`, `mois`) en suffixe léger (`C9`).
- Initialiser les boutons optionnels d'affichage de sous-sections (filtres, catégories additionnelles, etc.) à l'état inactif par défaut, sauf exigence produit documentée.

#### Interdit

- Revenir aux styles natifs navigateur pour les selects dans `/sim/*`.
- Couleurs d'erreur hardcodées hors C1.

#### Audit des champs sur fond coloré (mars 2026)

| Surface                  | Contexte coloré                                                                     | Champs concernés                                                                                                                                                                                                                                                                                                                           |
| ------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/sim/ir`                | Aucun cas confirmé à ce stade                                                       | Aucun champ texte/select/date identifié sur fond coloré ; les champs sont dans des cards blanches ou dans des zones sans fond teinté                                                                                                                                                                                                       |
| `/sim/credit`            | Aucun cas confirmé à ce stade                                                       | Aucun champ texte/select/date identifié sur fond coloré ; les formulaires sont dans `CreditLoanForm.tsx` sous card blanche, et les blocs colorés secondaires (`cv2-lissage-card`, détails, hypothèses) ne contiennent pas de champs texte/select/date                                                                                      |
| `/sim/succession` page   | `.sc-asset-section` dans `src/features/succession/styles/assets.css`                | Dans `ScAssetsPassifsCard.tsx` : `Porteur`, `Sous-catégorie`, `Montant (€)` pour chaque ligne d’actif/passif détaillée en mode expert                                                                                                                                                                                                      |
| `/sim/succession` modale | `.sc-testament-card` dans `src/features/succession/styles/assets.css`               | Dans `DispositionsModal.tsx` : `Testament actif`, `Type de disposition testamentaire`, `Bénéficiaire`, `Quote-part du legs à titre universel (%)`, `Legs particuliers` (`bénéficiaire`, `montant`, `libellé`), `Ascendants survivants`                                                                                                     |
| `/sim/placement` page    | `.premium-table` dans `src/styles/premium-shared.css`                               | Dans `PlacementEpargneSection.tsx` : `Enveloppe`, `Durée de la phase épargne`                                                                                                                                                                                                                                                              |
| `/sim/placement` page    | `.premium-table` dans `src/styles/premium-shared.css`                               | Dans `PlacementLiquidationSection.tsx` : `Stratégie de retraits`, `Durée de liquidation`, `Rendement capitalisation (liquidation)`, `Mensualité cible`, `Montant du retrait`                                                                                                                                                               |
| `/sim/placement` page    | `.premium-table` dans `src/styles/premium-shared.css`                               | Dans `PlacementTransmissionSection.tsx` : `Âge au décès (simulation)`, `Choix du bénéficiaire`, `Nombre de bénéficiaires`, `Tranche DMTG estimée`                                                                                                                                                                                          |
| `/sim/placement` modale  | `.vcm__card` dans `src/features/placement/styles/versements-modal-shell.css`        | Dans `VersementConfigModal.tsx` : `Montant`, `Frais d'entrée`, `Déductibilité` (select + `Économie IR`), `Allocation` (inputs `%` du slider), `Rendement annuel net de FG`, `Taux de distribution / loyers`, `Durée du produit`, `Délai de jouissance`, `Stratégie`, `Au terme du produit, réinvestir vers`, `Coût annuel` des options PER |
| `/sim/placement` modale  | `.vcm__ponctuels` dans `src/features/placement/styles/versements-modal-content.css` | Dans `VersementConfigModal.tsx` : `Année`, `Montant`, `Frais d'entrée`, `Allocation`                                                                                                                                                                                                                                                       |

### 6) Boutons Exporter et mode simplifié/expert

#### Obligatoire

- Position : dans la zone actions du header, à droite du sous-titre.
- Ordre `/sim/credit` : bouton mode puis `ExportMenu`.
- Taille harmonisée :
  - mode : `padding 8px 16px`, `font-size 13px`, `radius 6px`
  - export trigger : `padding 8px 16px`, `radius 6px`.
- Dropdown export : ancré à droite du bouton, `min-width: 140px`, `z-index: 1000`.
- Source de vérité du mode : `ui_settings.mode` via `useUserMode` (piloté depuis Home).
- Le mode de Home doit être appliqué par défaut sur toute nouvelle page `/sim/*`.
- Si un toggle local est nécessaire dans une page simulateur, il doit être un override non persistant (session de la page uniquement), sans écrire dans `ui_settings`.
- Pattern de référence (baseline `/sim/credit`) :
  - `const { mode } = useUserMode()`
  - `const [localMode, setLocalMode] = useState(null)`
  - `const isExpert = (localMode ?? mode) === 'expert'`
  - `onClick` toggle local : `setLocalMode(isExpert ? 'simplifie' : 'expert')`

#### Interdit

- Déplacer export en bas de page.
- Ajouter des CTA primaires concurrents dans la même ligne sans justification produit.
- Initialiser un simulateur avec un `useState(false)` / `useState(true)` isolé pour le mode (cela ignore Home).
- Persister un changement de mode depuis une page `/sim/*` dans `ui_settings` si l'intention est un simple override local.

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

#### Patron canonique (validé sur `/sim/credit` et `/sim/ir`)

- Classe obligatoire : `premium-card premium-card--guide`.
- Liseré gauche : `border-left: 3px solid C3`.
- Header avec fond dégradé subtil du haut vers le bas — classe partagée **obligatoire** : `sim-card__header--bleed` (définie dans `src/styles/sim/surfaces.css`) :
  ```css
  /* Référence canonique — ne pas recréer feature par feature */
  .sim-card__header--bleed {
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--color-c4) 18%, transparent) 0%,
      transparent 65%
    );
    border-radius: 10px 10px 0 0;
    margin: -20px -24px 0;
    padding: 20px 24px 0;
  }
  ```
  Les marges négatives compensent le `padding: 20px 24px` de la card, étendant le fond jusqu'aux bords.
- Structure interne : icône (28×28, fond C4, stroke C2) + titre (15px/600/C1) + sous-titre (12px/C9) + séparateur dégradé.
- Corps : table groupée ou grille de champs selon la complexité du simulateur.

#### Règle

- Ce pattern est la carte d'entrée principale de chaque simulateur.
- Ne pas utiliser de couleur saturée pour le fond (dégradé subtil uniquement).
- Si un vrai composant hero est créé, il doit rester compatible avec : bordure C8, accent gauche C3, fond majoritairement neutre.

#### Distinction cartes gauche (guide) vs cartes droite (synthèse)

##### Cartes d'entrée gauche (guide)

- Classes : `premium-card premium-card--guide` (ou `sc-card--guide` selon feature).
- Liseré gauche : `border-left: 3px solid C3`.
- Header dégradé **du haut vers le bas** via la classe partagée `sim-card__header--bleed` : `linear-gradient(to bottom, C4 18%→transparent 65%)`.
  Marges négatives pour étendre aux bords : `margin: -20px -24px 0; padding: 20px 24px 0`.
  **Ne jamais recréer ce style feature par feature** — toujours ajouter `sim-card__header--bleed` à l'élément header.
- Icône **obligatoire** dans le header : 26×26 px, fond C4, stroke C2, SVG inline (`aria-hidden="true"`).
- Structure : icône + titre (flex, `gap: 8px`) + sous-titre facultatif (12px/C9) + séparateur dégradé.

##### Cartes de synthèse droite (hero / summary)

- Classes : `premium-card` + classe feature (ex. `sc-hero-card`, `ir-tmi-card`).
- Liseré gauche : C3, y compris pour les cartes secondaires / multi-blocs.
- Gradient sur la carte entière : `linear-gradient(to bottom, C4 18%→transparent 20%)`.
  Implémenté via `background-image` sur la classe feature (le `background: #FFFFFF` de `.premium-card` reste).
- Icône recommandée dans la zone titre (même spec 26×26 que les cartes guide).

#### Catalogue d'icônes recommandées

| Contexte carte                     | Icône SVG préconisée                   |
| ---------------------------------- | -------------------------------------- |
| Situation familiale / Foyer fiscal | `users` (2 silhouettes)                |
| Revenus / saisie tabulaire         | `grid` (rect + 2 lignes H + 1 ligne V) |
| Résultat / estimation IR ou prêt   | `bar-chart-2` (3 barres verticales)    |
| Synthèse multi-prêts / agrégat     | `layers` (3 formes empilées)           |
| Actifs / Passifs / Patrimoine      | `layers` (3 formes empilées)           |
| Donations                          | `gift`                                 |
| Synthèse successorale              | `pie-chart`                            |
| Chronologie des décès              | `calendar`                             |
| Filiation / arbre familial         | `share-2` (nœuds réseau)               |

Règles icônes :

- SVG inline uniquement, `stroke="currentColor"`, `strokeWidth="1.8"`, `fill="none"`.
- Ne pas réutiliser deux fois la même icône dans la même page.
- Choisir une icône qui évoque le domaine métier, pas la mise en forme visuelle.

### 9) Accordéons (styles et usages)

#### Obligatoire

- Accordéons utilisés sur `/sim/credit` :
  - Échéanciers (`Afficher/Masquer`) via bouton `cv2-schedule__toggle`.
  - Hypothèses/limites via `cv2-hypotheses__toggle`.
- Accordéons utilisés sur `/sim/ir` :
  - Détail du calcul via `.ir-detail-card.premium-card` (pleine largeur, hors grid, visible uniquement si résultat calculé) — header `.ir-detail-header` avec titre `.ir-detail-title` à gauche, bouton `.ir-detail-toggle` à droite ; miroir du pattern `cv2-schedule`.
  - Hypothèses/limites via `.ir-hypotheses__toggle` (composant `IrDisclaimer`).
- Style minimum :
  - conteneur `#FFFFFF` (tables) ou `C7` (bloc hypothèses),
  - border `1px solid C8`,
  - radius `12px`,
  - chevron animé (rotation 180° open).
- Toggle détail (dans card, header droite) : même style que `cv2-schedule__toggle` — `border 1px solid C8`, `bg C7`, `radius 6px`, `12px`, hover `C2`.
- État initial :
  - échéanciers / détail calcul : fermés par défaut,
  - hypothèses : fermé par défaut (ouverture manuelle).

#### Recommandé

- Garder un wording d'action explicite (`Afficher`/`Masquer`), pas uniquement une icône.

#### Scroll horizontal dans les accordéons (règle critique)

- Tout tableau accordéon (`CollapsibleTable`) doit utiliser `.pl-table-top-scroll` + `.pl-table-scroll-wrap` pour afficher la scrollbar horizontale premium **au-dessus** des en-têtes de colonnes.
- La scrollbar du haut est synchronisée avec la scrollbar du bas via deux event listeners JS (`useEffect` dans `CollapsibleTable`).
- Styles scrollbar webkit : hauteur 4px, couleur C5 (thumb) / C8 (track), radius 2px.
- **Anti-pattern** : `overflow-x: auto` directement sur un `<table>` ou sur le wrapper sans double scrollbar → scrollbar invisible au chargement, mauvaise UX.
- Référence : `CollapsibleTable` dans `src/features/placement/components/PlacementTables.tsx`, classes `.pl-table-top-scroll` / `.pl-table-scroll-wrap` dans `src/features/placement/styles/results.css`.

#### Interdit

- Accordéon sans attribut `aria-expanded`.

### 10) Code couleur complet (mapping)

#### Obligatoire

- Tokens uniques `--color-c1..--color-c10` (source: `src/settings/theme.ts` + `src/styles/index.css`).
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
  - C5 : accent secondaire de données, jamais pour les liserés KPI.
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
- Garder les placeholders numériques sans unité dans le champ.

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

1. Partir de `src/styles/sim/index.css` + `premium-shared.css`.
2. Créer un CSS feature local (ex: `FeatureX.css`) avec préfixe propre.
3. Garder les tokens C1..C10; ne pas créer de palette parallèle.
4. Ajouter les variantes (tabs, hero, accordéon) par composition de classes avant surcharge.
5. Documenter toute dérogation dans cette section + preuve code.

### 15) Tableaux de saisie groupés (pattern `/sim/ir`)

Quand un simulateur utilise une `<table>` à l'intérieur d'une `premium-card--guide` (structure plus complexe qu'une grille de champs) :

#### Obligatoire

- **Séparateur immédiatement sous le `<thead>`** : première ligne du `<tbody>` = `<tr class="ir-divider-row">` (divider estompé pleine largeur), pour séparer visuellement les en-têtes de colonnes des données.
- **Séparateurs entre groupes** : `<tr class="ir-divider-row"><td colSpan={n}><div class="ir-divider-row__inner" /></td></tr>` — gradient `linear-gradient(90deg, transparent, C8, transparent)`, hauteur 1px.
- **Labels de sous-section** (`ir-row-title`) :
  - `font-weight: 600`
  - `color: C9` sur le premier `td` (libellé)
  - `background: transparent`
  - Utilisé pour : « Frais réels ou abattement 10 % », « Abattement 10 % pensions (foyer) », « Déductions », « Réductions / crédits d'impôt ».
- **Inputs inactifs conditionnels** : quand une ligne combine un select de mode + un input conditionnel (actif/inactif selon le mode), l'input en lecture seule prend `background: #FFFFFF` pour signaler l'inactivité (voir §5).
- **Lignes avec dropdown unitaire** : si l'unité est déjà incluse dans le select ou ses options (ex. `10%`, `PFU 12,8 %`), ne pas la répéter dans le contrôle déroulant ; seuls les champs numériques adjacents gardent leur suffixe propre si nécessaire.

#### Mode simplifié / expert

- Les champs masqués en mode simplifié (`isExpert = false`) doivent être **exclus du moteur de calcul** (pas seulement masqués visuellement).
- Pattern : passer `0` ou valeur neutre pour les paramètres masqués dans l'appel au moteur fiscal.

#### Recommandé

- Garder 3 colonnes max (label / Déclarant 1 / Déclarant 2).
- Utiliser `colSpan` pour les champs foyer (partagés entre déclarants).

---

### 16) Anatomie complète d'une page /sim/\* — Patterns prouvés

Cette section comble les trous des §1-§15. Elle ne les duplique pas. Chaque règle porte un statut :

- **baseline partagée** — prouvée sur ≥2 simulateurs parmi IR, Crédit, Placement, Succession.
- **recette feature** — pattern d'un seul simulateur, réutilisable mais pas encore généralisé.
- **exception documentée** — divergence connue, à corriger ou justifier explicitement en PR.

#### 16a) Schéma d'anatomie de page

```
┌─────────────────────────────────────────────────────────────────┐
│ HEADER (§2) — .premium-header + variante feature               │
│ h1.premium-title (22px/600/C1)                                 │
│ p.premium-subtitle (12px/400/C9)                               │
│ actions à droite : [mode toggle] [ExportMenu]                  │
│ border-bottom: 3px solid C6                                     │
├─────────────────────────────────────────────────────────────────┤
│ CONTRÔLES (§7) — onglets/phases + toggle vue                   │
│ tabs underline : border-bottom 2px, actif C3, hover C2/C7      │
│ baseline sous les tabs : gradient 2px C8→transparent           │
├─────────────────────────┬───────────────────────────────────────┤
│ GAUCHE 1.85fr           │ DROITE 1fr (sticky top: 80px)        │
│ .premium-card--guide    │ carte hero : border-left 3px C3      │
│ border-left: 3px C3     │ gradient fond C4 18%→transparent     │
│ Saisie / formulaires    │ KPI principal 26-30px/700/C1         │
│ Inputs off-white (§5)   │ KPI secondaires 2×2, 15px/600        │
│                         │ Graphiques (donut, barre)            │
│                         │ carte secondaire border-left 3px C3  │
├─────────────────────────┴───────────────────────────────────────┤
│ PLEINE LARGEUR — accordéon détail (§9), hypothèses (§9)        │
│ margin-top: 8-32px                                             │
└─────────────────────────────────────────────────────────────────┘
```

**Statut** : baseline partagée.
**Preuves** : `src/styles/sim/layout.css`, `src/features/credit/styles/shell.css`, `src/features/ir/styles/shell.css`, `src/features/placement/styles/shell.css`, `src/features/succession/styles/layout.css`.

#### 16b) Grilles intra-carte

| Pattern            | CSS                                                     | Usage                               | Statut            | Preuves                                                                                                                                                                               |
| ------------------ | ------------------------------------------------------- | ----------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2 col. symétrique  | `grid-template-columns: repeat(2, 1fr)`                 | Foyer fiscal, couple D1/D2, KPI 2×2 | baseline partagée | `src/features/ir/styles/details.css` `.ir-guide-card__grid`, `src/features/succession/styles/layout.css` `.sc-civil-grid`, `src/features/per/styles/steps.css` `.per-declarants-grid` |
| 3 col. tableau     | `label minmax(220px,1.5fr) + 2×input minmax(140px,1fr)` | Revenus couple, contributions       | baseline partagée | `src/features/ir/styles/forms.css` `.ir-table`, `src/features/placement/styles/tables.css` `.pl-ir-table`, `src/features/per/styles/steps.css` `.per-contribution-table.is-couple`    |
| KPI 2×2            | `repeat(2, minmax(0,1fr)), gap: 8px 14px`               | Synthèse droite                     | baseline partagée | `src/features/ir/styles/summary.css` `.ir-tmi-bar`, `src/features/succession/styles/summary.css` `.sc-synth-kpis`, `src/features/credit/styles/summary.css` `.cv2-summary__details`   |
| Stack vertical     | `flex-direction: column; gap: 6-12px`                   | Breakdown, listes d'éléments        | baseline partagée | tous simulateurs                                                                                                                                                                      |
| 2 col. asymétrique | `minmax(0, 0.85fr) minmax(0, 1.15fr)`                   | Guide (docs/avis) + preview         | recette feature   | `src/features/per/styles/steps.css` `.per-avis-layout` uniquement                                                                                                                     |

#### 16c) Placement des graphiques et KPI visuels

| Règle                                             | Détail                                                                           | Statut            | Preuves                                                                                                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Graphiques uniquement dans la colonne droite      | Donut, pie, barre segmentée → carte hero de synthèse                             | baseline partagée | `src/features/ir/styles/summary.css` `.ir-summary-donut`, `src/features/succession/styles/summary.css` `.sc-synth-donut`, `src/features/credit/styles/summary.css` `.cv2-summary__donut-wrap`                       |
| Jamais de graphique dans la zone de saisie gauche | —                                                                                | baseline partagée | aucun contre-exemple sur les 4 simulateurs baseline                                                                                                                                                                 |
| KPI principal                                     | label 11px/500/C9 · valeur 26-30px/700/C1 · `font-variant-numeric: tabular-nums` | baseline partagée | `src/features/ir/styles/summary.css` `.ir-summary-total-hero__value`, `src/features/credit/styles/summary.css` `.cv2-summary__kpi-main-value`, `src/features/succession/styles/summary.css` `.sc-synth-hero__value` |
| KPI secondaires 2×2                               | label 10-11px/uppercase/C9 · valeur 15px/600/C1                                  | baseline partagée | `src/features/ir/styles/summary.css` `.ir-tmi-row`, `src/features/succession/styles/summary.css` `.sc-synth-kpi`                                                                                                    |
| Taille donut                                      | 56-64px desktop / 48px mobile                                                    | baseline partagée | `src/features/ir/styles/summary.css` `.ir-summary-donut`, `src/features/credit/styles/summary.css` `.cv2-summary__donut-wrap`                                                                                       |
| Barre segmentée TMI                               | `grid: repeat(5,1fr)`, radius 6px, inactif C8 / actif C4+C1                      | recette feature   | `src/features/ir/styles/summary.css` `.ir-tmi-bar` uniquement                                                                                                                                                       |

#### 16d) Critères d'usage des modales

| Critère                                                                       | Modale | Inline             |
| ----------------------------------------------------------------------------- | ------ | ------------------ |
| Saisie détaillée d'un élément (contrat AV, versement, disposition, testament) | Oui    | Non                |
| Formulaire principal de la page                                               | Non    | Oui                |
| Consultation de résultat / breakdown plafonds                                 | Non    | Oui (accordéon §9) |
| Configuration ponctuelle > 3 champs                                           | Oui    | —                  |
| Configuration ponctuelle ≤ 3 champs                                           | —      | Oui                |

Largeurs standardisées :

- Standard : `max-width: 520px`
- Famille/élargi : `max-width: 620px`
- Large : `max-width: 720px`
- Dispositions : `max-width: 1200px`

Structure modale (pattern canonique) :

```css
/* overlay */
position: fixed;
inset: 0;
background: rgba(0, 0, 0, 0.45); /* seul rgba autorisé */
backdrop-filter: blur(3px);
z-index: 1000;

/* panel */
background: #ffffff;
border-radius: 14px;
max-height: calc(100vh - 40px);
display: flex;
flex-direction: column; /* scroll obligatoire (§Modales) */

/* header */
padding: 18px 20px;
border-bottom: 1px solid var(--color-c8);

/* body */
padding: 20px;
overflow-y: auto;
flex: 1 1 auto;
min-height: 0; /* scroll obligatoire */

/* footer */
padding: 16px 20px;
border-top: 1px solid var(--color-c8);
/* boutons à droite, gap: 10px */
```

Boutons modale : utiliser les classes partagées de `src/styles/sim/buttons.css` (`sim-modal-btn--ghost`, `sim-modal-btn--primary`) via le footer de `SimModalShell`. Une feature ne recrée ces boutons que si elle documente l'écart.

**Statut** : baseline partagée.
**Preuves** : `src/components/ui/sim/SimModalShell.tsx` · `src/styles/sim/modals.css` · `src/styles/sim/buttons.css`.

#### 16e) Responsive « saisie d'abord »

À `max-width: 900px`, la colonne de saisie reste **au-dessus** de la synthèse par défaut. L'utilisateur renseigne d'abord les prérequis ; la synthèse affiche ensuite un état vide utile ou les KPI calculés.

```css
@media (max-width: 900px) {
  .{feature}-grid { grid-template-columns: 1fr; }
  .{feature}-right { position: static; }
}
```

La remontée de la synthèse via `order: -1` ou `mobileSideFirst` devient une exception documentée, pas la norme.

**Statut** : baseline partagée SIM SER1 2026.
**Preuves** : `src/components/ui/sim/SimPageShell.tsx`, `src/styles/sim/surfaces.css`.

#### 16f) Boutons — Catalogue consolidé

| Variante             | Fond                                  | Bordure                          | Texte                  | Padding                      | Radius  | Usage                                                          |
| -------------------- | ------------------------------------- | -------------------------------- | ---------------------- | ---------------------------- | ------- | -------------------------------------------------------------- |
| Primary              | `C2`                                  | aucune                           | `#FFFFFF`, 13-14px/600 | `10px 18px`                  | `8px`   | Action principale de page                                      |
| Primary modale       | `C3`, hover `C2`                      | `C3`, hover `C2`                 | `#FFFFFF`, 13px/700    | `0 14px`, `min-height: 34px` | `6px`   | Valider/Confirmer dans une modale via `sim-modal-btn--primary` |
| Secondary            | `#FFFFFF` ou `C7`                     | `1px solid C8`                   | C9, 13-14px/500        | `10px 18px`                  | `6-8px` | Action secondaire / Annuler                                    |
| Chip filtre inactif  | `C7`                                  | `1px solid C8`                   | C9, 12px/500           | `4px 10px`                   | `999px` | Filtres de catégories                                          |
| Chip filtre actif    | `color-mix(in srgb, C3 22%, #FFFFFF)` | `color-mix(in srgb, C3 55%, C8)` | C1, 12px/500           | `4px 10px`                   | `999px` | Filtre sélectionné                                             |
| Action texte (ajout) | transparent                           | aucune                           | C2, 12px/400           | `4px 0`                      | —       | « + Ajouter un enfant »                                        |
| Toggle accordéon     | `C7`                                  | `1px solid C8`                   | C9, 12px/400           | `6px 12px`                   | `6px`   | Afficher/Masquer détail                                        |

Règles communes : `font-family: inherit`, hover → C2 texte ou fond C7 selon variante, disabled → `opacity: 0.4; cursor: not-allowed`.

**Statut** : baseline partagée pour toutes les variantes sauf mention contraire.

#### 16g) Cards de saisie simulateurs — contrat visuel vérifié

Les blocs de saisie ou de décision métier dans `/sim/*` utilisent le contrat complet :
`premium-card premium-card--guide sim-card--guide`.

- `premium-card` fournit la surface, la bordure et le rythme interne.
- `premium-card--guide` pose le liseré gauche commun.
- `sim-card--guide` active les règles simulateurs, notamment les headers avec `sim-card__header--bleed`.

Exceptions autorisées : cartes de synthèse (`sim-summary-card`), états (`sim-state-card`),
cartes compactes (`premium-card-compact`) et cartes explicitement listées dans
`scripts/check-sim-cards.mjs` quand elles ne sont pas des blocs de saisie.

La règle est contrôlée par `npm run check:sim-cards`.

#### 16h) Séparateurs simulateurs — règle d’usage

Les pages `/sim/*` utilisent les séparateurs partagés de `src/styles/sim/dividers.css`.
Une feature ne recrée pas de divider local si une variante partagée couvre le cas.

- `sim-divider` : séparateur estompé épais, placé sous un titre de carte ou de panneau pour
  installer la hiérarchie visuelle.
- `sim-divider sim-divider--soft` : séparateur estompé fin, utilisé au milieu d’un bloc pour
  séparer deux sous-parties sans créer une nouvelle carte.
- `sim-divider sim-divider--tight` : alias compact conservé pour les usages existants ; pour du
  nouveau code, préférer `sim-divider--soft`.
- `sim-divider sim-divider--solid` : ligne fine pleine, utilisée en bas de bloc avant une
  conclusion, un total, une annexe ou une zone de synthèse finale.

La colonne de droite ne doit pas afficher de KPI à zéro quand les prérequis métier sont absents.
Elle affiche soit rien quand la page a explicitement choisi une colonne désactivée, soit un seul
`SimEmptyState` `variant="sidebar"` quand un repère d’attente aide l’utilisateur.

#### 16i) État vide sidebar — règle d’usage

Les simulateurs ne rendent pas de cartes KPI calculées tant que les prérequis essentiels de la
page ne sont pas satisfaits. L’état d’attente autorisé dans une colonne de droite est
`SimEmptyState variant="sidebar"` : un titre court, une phrase d’invitation métier, puis une micro
prévisualisation optionnelle de ce qui apparaîtra après saisie.

Le message doit aider à poursuivre la saisie sans recréer un onboarding lourd. Une page avec des
onglets métier peut désactiver totalement la colonne droite si cela allège mieux la lecture, mais
elle ne doit pas compenser par des KPI à zéro.

#### 16j) Révélation progressive — règle d’usage

Les informations d’une page `/sim/*` sont classées en trois niveaux :

- Niveau 1 : saisie et décisions indispensables, visibles immédiatement.
- Niveau 2 : synthèse, alertes et repères d’aide à la décision, visibles dès que calculables.
- Niveau 3 : hypothèses, détails techniques, projections longues et annexes, repliés par défaut
  sauf lorsqu’ils sont le cœur de la tâche courante.

Un bouton de disclosure fermé doit annoncer ce qu’il contient : nombre de lignes, état, période ou
objet métier quand l’information est disponible. Les scrolls internes dans les grandes cards sont
évités ; on préfère replier, masquer ou révéler une section complète.

#### 16k) Stepper visuel discret — règle d’usage

`SimPageStepper` est une primitive optionnelle, désactivée par défaut sur les simulateurs tant
qu'elle n'apporte pas un vrai repère métier. Les pages avec onglets métier natifs, comme Placement
ou PER, ne dupliquent pas cette navigation.

Quand il est utilisé, il sert de repère et de raccourci de scroll, pas de parcours forcé : aucun
bouton global "Suivant" n’est ajouté. Il ne contient jamais `Synthèse`, `Hypothèses`, ni une annexe
technique : ces zones ne sont pas des étapes métier. Le composant est sémantiquement un
`<nav aria-label="Étapes du simulateur">` et l’étape courante porte `aria-current="step"`.

Un menu vertical gauche persistant est interdit par défaut sur `/sim/*` : il ajoute un troisième
rail de lecture et alourdit les pages. Une exception doit être prouvée par un besoin métier
documenté en PR.

#### 16l) Contrat UX simulateur

Chaque page `/sim/*` qui consomme les primitives transverses expose un contrat `SimPageUXContract`
via un hook dédié à sa feature. Ce contrat centralise :

- les prérequis métier (`readiness`) ;
- l’état de disponibilité de la synthèse (`synthesisReady`) ;
- la cible de synthèse (`synthesisTargetId`) ;
- les étapes de navigation optionnelles (`stepperSteps`), absentes par défaut ;
- les sections métier adressables (`sections`).

Le JSX de page consomme ce contrat pour brancher `SimViewSynthesisCTA`, les états vides et, si une
page le justifie, `SimPageStepper`, afin d’éviter les règles divergentes d’un simulateur à l’autre.

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
- C5 : Separation renforcee et accent secondaire hors liseres KPI.
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

> Sécurité & observabilité — migré vers `docs/ARCHITECTURE.md` § Sécurité & observabilité (ces règles relèvent de l'architecture).

---

> Catalogue patrimonial — règles métier : migré vers `docs/METIER.md` § Catalogue patrimonial (ces règles sont métier, pas UI).

---

> Règles de création des nouvelles pages : migré et fusionné dans `docs/ARCHITECTURE.md` § Conventions de création (évite le doublon).

---

## Anti-patterns

Index canonique de ce qu'il ne faut **jamais** faire dans l'UI SER1. Pour le détail
et la justification de chaque règle, suivre le lien vers la section concernée.

### Architecture & styles

- ❌ Calcul métier fiscal dans React → doit aller dans `src/engine/`.
- ❌ Import CSS cross-feature → utiliser `src/styles/` pour les tokens partagés
  (voir [§Propriété des styles](#propriété-des-styles)).
- ❌ Importer `premium-shared.css` depuis une feature runtime
  (voir [§Propriété des styles](#propriété-des-styles)).
- ❌ Couleurs hex hardcodées hors exceptions
  (voir [§Gouvernance couleurs](#gouvernance-couleurs-c1c10) — seules
  `#FFFFFF`, `#996600`, `rgba(0,0,0,0.5)` sont autorisées).
- ❌ Styles inline pour des valeurs **statiques** → inline réservé au dynamique
  (dimensions, géométrie runtime, couleurs calculées).

### Inputs & selects

- ❌ `<input type="number" value={montant} />` pour un montant € → affiche
  "1000000" au lieu de "1 000 000". Utiliser `InputEuro` / `IrAmountInput`
  (voir [§Règles UI premium](#règles-ui-premium)).
- ❌ `<select>` actif et cliquable quand une seule option est atteignable →
  utiliser `disabled` + `is-forced` (voir [§Règles UI premium](#règles-ui-premium)).
- ❌ Selects natifs navigateur bruts dans `/sim/*` → fond off-white +
  `text-align: right` obligatoire (voir [§5 Inputs](#5-inputs-menus-déroulants-et-priorités-de-remplissage)).
- ❌ Couleurs d'erreur hardcodées hors C1.
- ❌ Unité (`€`, `%`, `mois`) dans le placeholder du champ → l'unité est en
  suffixe visuel, le placeholder ne contient que la valeur (`0`, `0,00`).

### Layout & cartes (`/sim/*`)

- ❌ Troisième rail visuel persistant sur desktop
  (voir [§1 Gabarit global](#1-gabarit-global-page-largeurs-colonnes-structure)).
- ❌ Largeurs fixes en px pour les colonnes principales.
- ❌ Actions Export / Mode placées sous la grille principale → header droite.
- ❌ Réintroduire `useState(false)` isolé pour le mode → utiliser `useUserMode`
  (voir [§6 Boutons Exporter](#6-boutons-exporter-et-mode-simplifiéexpert)).
- ❌ Persister un override local de mode dans `ui_settings` depuis `/sim/*`.
- ❌ Ombres fortes / opacités élevées hors pattern premium.
- ❌ Recréer feature par feature le style `sim-card__header--bleed` → toujours
  réutiliser la classe partagée (voir [§8 Cartes hero](#8-cartes-hero)).
- ❌ Bordures verticales internes dans les tableaux de synthèse.
- ❌ Doubler deux séparateurs consécutifs (dégradé + bordure solide).

### Modales

- ❌ `overflow: visible` sur le container modale sans `max-height` → la modale
  dépasse la viewport (voir [§Règles UI premium](#règles-ui-premium)).
- ❌ rgba autres que `rgba(0,0,0,0.5)` pour l'overlay.

### Tableaux & accordéons

- ❌ `overflow-x: auto` directement sur un `<table>` → scrollbar invisible,
  utiliser `pl-table-top-scroll` + `pl-table-scroll-wrap`
  (voir [§Scroll horizontal](#scroll-horizontal-dans-les-accordéons-règle-critique)).
- ❌ Accordéon sans `aria-expanded`.

### Onglets

- ❌ Style "pill" pour `/sim/*` tant que la baseline est underline.
- ❌ Suppression de l'onglet primaire.

### Sécurité & observabilité

- ❌ `console.log/debug/info/trace` en prod (bloqué ESLint).
- ❌ Autorisation basée sur `user_metadata` Supabase.

### Accessibilité

- ❌ Supprimer `:focus-visible` sans alternative.

---

## Gouvernance exports

- Toute règle PPTX / Excel est désormais regroupée dans `docs/GOUVERNANCE_EXPORTS.md`.
- Si une PR touche `src/pptx/**`, `src/utils/export/**`, un wrapper export feature-owned, ou la structure des livrables client, la mise à jour de `docs/GOUVERNANCE_EXPORTS.md` est obligatoire.

---

## Références code

- Tokens & defaults : `src/settings/theme.ts`, `src/styles/index.css`
- ThemeProvider V5 : `src/settings/ThemeProvider.tsx`, `src/settings/presets.ts`, `src/settings/theme/types.ts`
- UI premium shared : `src/styles/sim/index.css`, `src/styles/premium-shared.css`
- Baseline `/sim/credit` : `src/features/credit/Credit.tsx`, `src/features/credit/styles/index.css`
- Inputs simulateur : `src/features/credit/components/CreditInputs.tsx`, `src/features/credit/styles/fields.css`
- Contrat exports PPTX/XLSX : `docs/GOUVERNANCE_EXPORTS.md`
- ESLint couleurs : `tools/eslint-plugin-ser1-colors/`
