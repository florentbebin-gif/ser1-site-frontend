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
- [Gouvernance PPTX](#gouvernance-pptx)
- [Gouvernance Excel](#gouvernance-excel)
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

### Séparateur de milliers (règle critique)
- **Tout champ de saisie affichant un montant en euros doit formater la valeur avec `toLocaleString('fr-FR')`** (ex. "100 000" et non "100000").
- Utiliser systématiquement les composants partagés qui implémentent déjà ce formatage : `InputEuro` (Placement/Credit), `IrAmountInput` (IR). Ne pas créer de `<input type="number">` brut pour des montants €.
- Exceptions acceptées (pas de formatage nécessaire) : âges, durées (années/mois), pourcentages (0–100 %), champs admin Settings (tableau de saisie du barème, montants de référence).
- **Anti-pattern** : `<input type="number" value={montant} />` pour un montant € → affiche "1000000" au lieu de "1 000 000", mauvaise lisibilité utilisateur.
- Références implémentées : `InputEuro` dans `inputs.tsx` (Placement), `CreditInputs.tsx` (Credit), `IrAmountInput` dans `IrFormSection.tsx` (IR).
- Références **non encore migrées** (acceptable temporairement) : champs € dans modales Succession (`AssuranceVieModal`, `ScDonationsCard`, `ScAssetsPassifsCard`), champs ponctuel dans `VersementConfigModalSections.tsx`.

### Selects forcés / option unique (règle critique)
- Un `<select>` avec une seule option atteignable (ex. : bénéficiaire quand la situation est "Célibataire") doit recevoir `disabled` + class `is-forced`.
- Styles CSS requis : `background: var(--color-c7); color: var(--color-c9); cursor: not-allowed; pointer-events: none;`
- **Anti-pattern** : laisser un `<select>` actif et cliquable quand une seule option est visible → fausse sensation d'interactivité.
- Référence implémentée : `pl-select.is-forced` dans `PlacementSimulator.css`, utilisé sur le select "Choix du bénéficiaire" en situation "Célibataire".

### Composants (guidelines)
- Buttons : primary = C2 + texte contrasté ; secondary = fond clair + border C8.
- Tables : zebra `C7/WHITE`, borders C8, padding confortable.

### Modales
- Overlay : `rgba(0,0,0,0.5)` (seul rgba autorisé).
- Panel : `#FFFFFF`, centré, `shadow` subtil.
- **Scroll obligatoire** : toute modale dont le contenu peut croître (liste dynamique, formulaire à n entrées) doit appliquer le patron suivant :
  - `max-height: calc(100vh - 40px)` + `display: flex; flex-direction: column` sur le container `.modal`
  - `overflow-y: auto; flex: 1 1 auto; min-height: 0` sur le `.modal__body`
  - Header et footer restent en position statique hors du scroll (pas de `overflow` sur le container).
  - Anti-pattern : `overflow: visible` sur le container sans `max-height` → la modale dépasse la viewport et devient inutilisable.
  - Référence : `sc-dispositions-modal` / `sc-member-modal` (Succession.css), `.vcm` / `.vcm__body` (VersementConfigModal.css).

---

## Norme des pages `/sim/*` (baseline `/sim/credit`)
### Source de vérité & périmètre
- Baseline obligatoire : `src/features/credit/Credit.tsx` + `src/features/credit/components/CreditV2.css`.
- Layout partagé : `src/components/simulator/SimulatorShell.css`.
- Styles premium partagés : `src/styles/premium-shared.css`.
- Inputs/select/toggle : `src/features/credit/components/CreditInputs.tsx` + `CreditInputs.css`.
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
- **Variante `/sim/ir`** : les contrôles (Barème, Résidence) sont non-sticky et défilent avec la page ; les cartes de résultats sont enveloppées dans un wrapper `.ir-results-sticky` sticky. Justification : quand l'utilisateur remplit une longue colonne gauche, les chiffres clés restent visibles en permanence.
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
  - Placeholder numérique : afficher uniquement la valeur (`0`, `0,00`) dans le champ ; l'unité (`€`, `%`, `mois`, etc.) est rendue en suffixe visuel à côté du champ, pas dans le placeholder.
  - Couleur des placeholders : `C9` sur tous les inputs `/sim/*`.
- Selects natifs simulateur : même fond off-white + border-bottom + `text-align: right` (pas de select natif navigateur brut).
- **Selects dans modales `/sim/*`** : appliquer également `height: 32px; box-sizing: border-box` pour aligner visuellement avec les `InputEuro`/`InputPct` adjacents. Référence : `.vcm__select` dans `VersementConfigModal.css`.
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
  suivant ce pattern. Ne pas importer `CreditInputs.css` cross-feature — utiliser
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

| Surface | Contexte coloré | Champs concernés |
|---|---|---|
| `/sim/ir` | Aucun cas confirmé à ce stade | Aucun champ texte/select/date identifié sur fond coloré ; les champs sont dans des cards blanches ou dans des zones sans fond teinté |
| `/sim/credit` | Aucun cas confirmé à ce stade | Aucun champ texte/select/date identifié sur fond coloré ; les formulaires sont dans `CreditLoanForm.tsx` sous card blanche, et les blocs colorés secondaires (`cv2-lissage-card`, détails, hypothèses) ne contiennent pas de champs texte/select/date |
| `/sim/succession` page | `.sc-asset-section` dans `src/features/succession/Succession.css` | Dans `ScAssetsPassifsCard.tsx` : `Porteur`, `Sous-catégorie`, `Montant (€)` pour chaque ligne d’actif/passif détaillée en mode expert |
| `/sim/succession` modale | `.sc-testament-card` dans `src/features/succession/Succession.css` | Dans `DispositionsModal.tsx` : `Testament actif`, `Type de disposition testamentaire`, `Bénéficiaire`, `Quote-part du legs à titre universel (%)`, `Legs particuliers` (`bénéficiaire`, `montant`, `libellé`), `Ascendants survivants` |
| `/sim/placement` page | `.premium-table` dans `src/styles/premium-shared.css` | Dans `PlacementEpargneSection.tsx` : `Enveloppe`, `Durée de la phase épargne` |
| `/sim/placement` page | `.premium-table` dans `src/styles/premium-shared.css` | Dans `PlacementLiquidationSection.tsx` : `Stratégie de retraits`, `Durée de liquidation`, `Rendement capitalisation (liquidation)`, `Mensualité cible`, `Montant du retrait` |
| `/sim/placement` page | `.premium-table` dans `src/styles/premium-shared.css` | Dans `PlacementTransmissionSection.tsx` : `Âge au décès (simulation)`, `Choix du bénéficiaire`, `Nombre de bénéficiaires`, `Tranche DMTG estimée` |
| `/sim/placement` modale | `.vcm__card` dans `src/features/placement/components/VersementConfigModal.css` | Dans `VersementConfigModal.tsx` : `Montant`, `Frais d'entrée`, `Déductibilité` (select + `Économie IR`), `Allocation` (inputs `%` du slider), `Rendement annuel net de FG`, `Taux de distribution / loyers`, `Durée du produit`, `Délai de jouissance`, `Stratégie`, `Au terme du produit, réinvestir vers`, `Coût annuel` des options PER |
| `/sim/placement` modale | `.vcm__ponctuels` dans `src/features/placement/components/VersementConfigModal.css` | Dans `VersementConfigModal.tsx` : `Année`, `Montant`, `Frais d'entrée`, `Allocation` |

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
- Header avec fond dégradé subtil (pas le texte) :
  ```css
  .premium-card--guide .{feature}-card__header {
    background: linear-gradient(135deg, color-mix(in srgb, C1 5%, transparent) 0%, transparent 65%);
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
- Header dégradé diagonal : `linear-gradient(135deg, C1 5%→transparent 65%)`.
  Marges négatives pour étendre aux bords : `margin: -20px -24px 0; padding: 20px 24px 0`.
- Icône **obligatoire** dans le header : 26×26 px, fond C4, stroke C2, SVG inline (`aria-hidden="true"`).
- Structure : icône + titre (flex, `gap: 8px`) + sous-titre facultatif (12px/C9) + séparateur dégradé.

##### Cartes de synthèse droite (hero / summary)
- Classes : `premium-card` + classe feature (ex. `sc-hero-card`, `ir-tmi-card`).
- Liseré gauche : C3 (carte principale) ou C5 (secondaire / multi-blocs).
- Gradient sur la carte entière : `linear-gradient(to bottom, C4 18%→transparent 20%)`.
  Implémenté via `background-image` sur la classe feature (le `background: #FFFFFF` de `.premium-card` reste).
- Icône recommandée dans la zone titre (même spec 26×26 que les cartes guide).

#### Catalogue d'icônes recommandées

| Contexte carte | Icône SVG préconisée |
|---|---|
| Situation familiale / Foyer fiscal | `users` (2 silhouettes) |
| Revenus / saisie tabulaire | `grid` (rect + 2 lignes H + 1 ligne V) |
| Résultat / estimation IR ou prêt | `bar-chart-2` (3 barres verticales) |
| Synthèse multi-prêts / agrégat | `layers` (3 formes empilées) |
| Actifs / Passifs / Patrimoine | `layers` (3 formes empilées) |
| Donations | `gift` |
| Synthèse successorale | `pie-chart` |
| Chronologie des décès | `calendar` |
| Filiation / arbre familial | `share-2` (nœuds réseau) |

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
- Référence : `CollapsibleTable` dans `tables.tsx`, classes `.pl-table-top-scroll` / `.pl-table-scroll-wrap` dans `PlacementSimulator.css`.

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
1. Partir de `SimulatorShell.css` + `premium-shared.css`.
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
- **Source unique** : `app_metadata.role` est la seule source de vérité pour le rôle auth. `user_metadata.role` ne doit jamais être écrit ni lu pour une décision d'autorisation. `profiles.role` est un miroir SQL maintenu par le backend (nécessaire pour `is_admin(uid)` en RLS), pas une source à consommer directement côté frontend.

### Bypass E2E (`__SER1_E2E`) — limites et conditions d'activation

Le flag `window.__SER1_E2E = true` permet aux tests Playwright de contourner l'auth Supabase (mock d'un rôle admin fictif). Ce mécanisme est **strictement borné** :

- **Inactif en prod par défaut** : le bypass ne s'active que si `import.meta.env.DEV === true` **OU** `import.meta.env.VITE_E2E === 'true'`.
- **`VITE_E2E=true`** doit être explicitement défini dans le workflow CI E2E (`.github/workflows/e2e.yml`). Il n'est jamais présent dans le build prod.
- **Jamais côté backend** : `__SER1_E2E` est purement frontend. Il ne bypass aucune garde Edge Function ni aucune RLS.
- **Usage autorisé** : smoke tests Playwright uniquement (test de rendu, navigation). Interdit pour simuler des droits admin réels ou tester des flows qui font des appels `/api/admin`.

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

## Regles de creation des nouvelles pages

Cette section complete la norme existante. Elle fixe le contrat minimal avant d'ajouter une nouvelle page ou un nouveau simulateur.

### Nouvelles pages /sim/*

#### Obligatoire
- Reutiliser la norme `/sim/*` de ce document ; `/sim/credit` reste la baseline par defaut.
- Toute nouvelle page `/sim/*` doit avoir :
  - un header premium
  - une zone actions coherente (mode, export, actions de page)
  - une grille ou un layout explicitement documente si elle deroge a la baseline
  - un comportement de mode compatible avec Home (`ui_settings.mode`)
- Si le mode simplifie masque des champs qui influencent le calcul, ces champs doivent etre neutralises dans le calcul, pas seulement caches visuellement.

#### Recommande
- Partir de `SimulatorShell.css` et `premium-shared.css` avant toute surcharge locale.
- Garder un nombre limite de variantes UI ; documenter toute exception dans cette gouvernance.

#### Interdit
- Creer une page `/sim/*` avec un style structurel autonome sans justification documentee.
- Dupliquer des patterns existants de credit ou ir dans un nouveau CSS si la composition suffit.

### Pages simulateur non finalisees

#### Regle
- Tant qu'un simulateur n'a pas de contrat UI et metier stable, preferer `UpcomingSimulatorPage` a une page incomplete exposee comme definitive.
- Une route "upcoming" doit rester explicite dans l'UX et dans les tests smoke.

### Nouvelles pages /settings/*

#### Obligatoire
- Une page settings s'inscrit dans le shell existant `SettingsShell` ; pas de navigation parallele.
- La route doit etre declaree dans `src/routes/settingsRoutes.ts`.
- La page doit respecter les tokens, la langue francaise, les blocs premium et la discipline SVG inline.
- Si une page est reservee aux admins, la restriction UI ne remplace jamais l'enforcement backend/RLS.

#### Interdit
- Ajouter une page settings avec son propre systeme d'onglets ou sa propre logique de navigation globale.
- Ajouter des couleurs, espacements ou composants one-off non alignes avec le reste des settings sans justification produit.

### Checklist avant ajout d'une page
- Le besoin produit est formule.
- Le point d'entree (route, shell, topbar, reset, mode) est defini.
- Le lieu du calcul est clair (engine vs simple UI).
- La doc pivot pertinente est mise a jour : `ARCHITECTURE.md` pour la structure, `GOUVERNANCE.md` pour le contrat UI.

---

## Anti-patterns
- Calcul métier fiscal dans React (doit aller dans `src/engine/`).
- Import CSS cross-page (styles partagés → `src/styles/`).
- Couleurs hardcodées hors exceptions.
- Logs en prod via `console.log/debug/info/trace` (bloqué ESLint).
- Autorisation basée sur `user_metadata`.

---

---

## Gouvernance PPTX

### Source de vérité
`sim/ir` et `sim/credit` restent les références historiques les plus stabilisées.
- `sim/per/potentiel` suit désormais la même infrastructure d'exports et de thème ; l'ancien simulateur PER retiré des routes ne doit pas servir de référence.
- Succession : non finalisé — ne pas s'en inspirer.

---

### Structure invariante d'un deck

```
Cover → [Chapter → Slides métier]+ → End
```

| Position | Type | Rôle |
|---|---|---|
| 1 | `cover` | Page de garde (titre, client, logo, date, conseiller) |
| 2 | `chapter` | Séparateur de section (image + objectif pédagogique) |
| 3..N-2 | métier | Slides spécifiques (synthesis, annexe, amortization…) |
| N-1 | `chapter` | Séparateur "Annexes" |
| N | `end` | Mentions légales |

Règles :
- `cover` et `end` ne sont jamais répétés.
- Les slides `chapter` ne contiennent jamais de données chiffrées — leur `body` est une phrase d'introduction au client, rédigée en vouvoiement.

---

### Règles des slides de synthèse (schématisation client)

#### Objectif pédagogique
La slide de synthèse doit être comprise en 3 secondes par un client non expert.
Elle ne remplace pas l'explication orale — elle en est le support visuel.
Elle ne contient **pas** de détail de calcul (c'est le rôle de l'annexe).

#### Hiérarchie visuelle obligatoire

```
1. HERO      → LE chiffre que le client retient (impossible à rater)
2. KPIs      → Les 4 paramètres clés (scan en 5 secondes)
3. SCHÉMA    → Un visuel proportionnel qui illustre le ratio principal
4. SECONDAIRE → Callout contextuel sous le HERO (optionnel mais conseillé)
```

#### HERO
- 1 seule métrique centrale, 30–32pt, bold, `textMain`, centré horizontalement.
- Label au-dessus : 13–14pt, `textBody`, normal.
- Accent line décorative sous la valeur : 3pt, `accent`.
- Exemple IR : "Impôt sur le revenu : 9 700 €" (irNet, 30pt).
- Exemple Credit : "Coût total du crédit : 45 200 €" (coutTotalCredit, 32pt).

#### Zone secondaire (callout + margin)
Deux lignes contextuelles en 10–11pt italic sous le HERO :
- Ligne 1 (callout) : valeur d'entrée dans la zone HERO ("Revenus dans cette TMI : X €").
- Ligne 2 (margin) : limite ou écart ("Marge avant changement de TMI : X €").
- Exemple Credit : breakdown "(dont X € d'intérêts + Y € d'assurance)".
- Peut être omis si le domaine n'a pas de notion de seuil ou d'écart.

#### KPIs
- 4 colonnes maximum (au-delà, illisible sur 16:9).
- Chaque KPI = icône centrée (0.48–0.50") + label 9pt + valeur bold 14–15pt + sous-valeur optionnelle 8pt italic.
- Icônes : `addBusinessIconToSlide` depuis `src/pptx/icons/addBusinessIcon.ts`. Catalogue : `BusinessIconName` dans `src/pptx/theme/types.ts`.
- Couleur icônes : `color5` ou `accent` (jamais hardcodée).

#### SCHÉMA visuel
- Construit exclusivement avec des shapes PptxGenJS (`slide.addShape`, `slide.addText`).
  Jamais de SVG, jamais de canvas, jamais d'image générée côté client.
- Formes autorisées : `rect`, `roundRect`, triangle (curseur), line.
- Objectif : traduire un ratio ou une répartition de façon intuitive.
  - **IR** → barre segmentée des tranches TMI, avec curseur positionné proportionnellement.
  - **Credit** → barre bicolore Capital vs Coût total, largeur proportionnelle aux montants.
- Couleurs : gradient thématique `color4` (light) → `color2` (dark) pour les segments.
  Texte sur segment coloré : `getTextColorForBackground()` (contraste auto, jamais hardcodé).
- Un schéma = une seule idée visuelle. Ne pas superposer deux schémas.

#### Anti-patterns synthesis (interdit)
- Tableau HTML/texte dans une slide de synthèse.
- Plus de 4 colonnes KPI.
- Valeurs recalculées dans le slide builder (tout vient du state du sim).
- Deux HERO sur la même slide.
- Texte sous 9pt.

---

### Règles de rédaction des slides annexe (prose française)

#### Objectif
La slide annexe est un texte rédigé en français, qui détaille et justifie les mécanismes appliqués. Elle est destinée à un client qui souhaite comprendre le calcul. Elle complète la slide de synthèse sans la dupliquer.

#### Registre et voix
- **Vouvoiement systématique**.
- Registre : ingénieur patrimonial s'adressant à un client éclairé.
  Termes précis et définis dès leur première apparition (ex : "votre Tranche Marginale d'Imposition (TMI)").
- Ton : affirmatif et pédagogique, pas injonctif.

#### Structure invariante de la prose

```
§1 Situation personnelle    : présenter la situation du client (foyer, actif, paramètres)
§2 Mécanisme(s) appliqué(s) : décrire le calcul dans l'ordre chronologique, en langage naturel
§3 Résultat net             : annoncer le résultat final avec ses composantes
§4 Disclaimer adapté        : avertissement spécifique au domaine du simulateur
```

**Règle** : on part toujours du client, jamais du mécanisme général.
- ✓ "Votre foyer fiscal compte 2,5 parts — le calcul s'applique donc comme suit…"
- ✗ "Le mécanisme du quotient familial consiste à…"

#### Format technique
- Prose continue, **pas de bullet points** (jamais).
- Paragraphes séparés par `\n\n`.
- Valeurs chiffrées du client : `{ text: euro(val), bold: true }` (bold, formaté).
- Reste du texte : normal, 11pt, `textBody`.
- Interligne : `lineSpacingMultiple: 1.3`.
- Alignement : gauche, `valign: 'top'`.
- Zone disponible : `COORDS_CONTENT.content` → `{ y: 2.3754", h: 4.3602" }`.
  **Contrainte dure** : la prose doit tenir dans ces 4.36 pouces. Tester en export réel.

#### Contenu conditionnel
Ne montrer que les mécanismes qui s'appliquent réellement au cas du client :
- Décote IR = 0 → omettre le paragraphe décote.
- Lissage crédit désactivé → omettre le paragraphe lissage.
- Assurance = 0 → omettre la ligne assurance.

Préférer l'absence d'un paragraphe à un paragraphe vide ou à une valeur "0 €".

#### Références légales
Intégrées naturellement dans la prose, entre parenthèses :
"…conformément à l'article 197 du CGI" ou "en application de l'article 779 du CGI".
Pas de section dédiée aux références légales.

#### Formatage des valeurs
- Montants : `euro(val)` → "9 700 €" (pas de décimales pour les gros montants).
- Taux : `pct(val)` → "30 %" (espace insécable avant %).
- Jamais de nombre brut sans unité.

#### Anti-patterns annexe (interdit)
- Bullet points.
- Jargon non défini (TMI sans développer au moins la première fois).
- Valeur sans unité ("9700" au lieu de "9 700 €").
- Commencer par le mécanisme général plutôt que la situation client.
- Dupliquer le HERO de la slide de synthèse mot pour mot.

#### Slide annexe optionnelle
Pour un simulateur simple (peu de mécanismes à expliquer), une `ContentSlideSpec` générique
suffit à la place d'un builder dédié — voir `successionDeckBuilder.ts` pour un exemple.

---

### Règles fondamentales (invariants architecturaux)

| Règle | Détail |
|---|---|
| Couleurs | Via `PptxThemeRoles` uniquement. Seul `#FFFFFF` est hardcodé. |
| Fonte | `Arial` uniquement (`TYPO.fontFace`). Pas d'autre fonte. |
| Coordonnées | En pouces, depuis les constantes de `serenity.ts`. Jamais de valeur en dur. |
| Données | Toujours issues du state du simulateur. Jamais recalculées dans un slide builder. |
| Calculs dérivés | Autorisés uniquement dans le DeckBuilder (ex : `totalRembourse = capital + cout`). |
| Valeurs fiscales | Interdites hardcodées (garde-fou CI : `check:fiscal-hardcode`). |
| Type slide | Préfixe du simulateur obligatoire : `placement-synthesis`, pas `synthesis`. |
| Header | Toujours via `addHeader()`. Pas de positionnement manuel titre/accent/subtitle. |
| Footer | Toujours via `addFooter()`. Date + disclaimer + numéro. |
| Images chapitres | Via `pickChapterImage(simId, ordinal)` depuis `serenity.ts`. Jamais d'index hardcodé. |
| Export wrapper | Obligatoire dans `src/pptx/exports/`. Pas d'appel direct à `exportStudyDeck`. |
| Fichiers legacy | `auditPptx.ts` et `strategyPptx.ts` : hors Serenity, ne pas s'en inspirer. |

---

### Checklist création d'un nouvel export PPTX

| Étape | Action | Fichier | Obligatoire |
|---|---|---|---|
| 1 | Définir `XxxSynthesisSlideSpec` | `src/pptx/theme/types.ts` | ✓ |
| 2 | Ajouter dans l'union `StudyDeckSpec.slides` | `src/pptx/theme/types.ts` | ✓ |
| 3 | Créer `buildXxxStudyDeck()` (deck builder) | `src/pptx/presets/xxxDeckBuilder.ts` | ✓ |
| 4 | Créer `buildXxxSynthesis()` (slide synthèse) | `src/pptx/slides/buildXxxSynthesis.ts` | ✓ |
| 5 | Créer `buildXxxAnnexe()` (slide annexe) | `src/pptx/slides/buildXxxAnnexe.ts` | Si mécanismes à expliquer¹ |
| 6 | Câbler le `else if` dans l'orchestrateur | `src/pptx/export/exportStudyDeck.ts` | ✓ |
| 7 | Re-exporter depuis l'index slides | `src/pptx/slides/index.ts` | ✓ |
| 8 | Créer le wrapper export | `src/pptx/exports/xxxExport.ts` | ✓ |
| 9 | Créer le hook export côté feature | `src/features/xxx/hooks/useXxxExportHandlers.ts` | ✓ |
| 10 | Brancher sur le bouton export de la page | Toolbar du simulateur | ✓ |
| 11 | Test smoke (deck spec sans crash) | `src/features/xxx/__tests__/xxxExport.test.ts` | ✓ |
| 12 | Ajouter le pool d'images dans `CHAPTER_IMAGE_POOLS` | `src/pptx/designSystem/serenity.ts` | ✓ |

¹ Pour un simulateur simple, une `ContentSlideSpec` générique suffit (exemple : succession).

---

### Images chapitres — pool fixe par simulateur

Pool défini dans `src/pptx/designSystem/serenity.ts` via `CHAPTER_IMAGE_POOLS`.
Utiliser `pickChapterImage(simId, chapterOrdinal)` dans chaque deck builder.

| Simulateur | ch.1 | ch.2 |
|---|---|---|
| `ir` | 1 | 3 |
| `credit` | 5 | 7 |
| `per` | 4 | 8 |
| `succession` | 2 | 6 |
| `placement` | 9 | 2 |

Images : `public/pptx/chapters/ch-01.png` à `ch-09.png` — range strict 1–9.
Budget : ≤ 1.2 Mo/image (alerte à 1.6 Mo), ≤ 9 Mo total.

---

### Carte des fichiers PPTX

| Dossier/Fichier | Rôle |
|---|---|
| `src/pptx/designSystem/serenity.ts` | Design system (coords, typo, helpers, pools images) |
| `src/pptx/theme/types.ts` | Types specs slides + theme roles |
| `src/pptx/theme/getPptxThemeFromUiSettings.ts` | Mapping UI c1–c10 → PptxThemeRoles |
| `src/pptx/presets/` | Deck builders par simulateur |
| `src/pptx/slides/` | Slide builders (cover, chapter, content, métier) |
| `src/pptx/exports/` | Wrappers export (API simplifiée par simulateur) |
| `src/pptx/export/exportStudyDeck.ts` | Orchestrateur central |
| `src/pptx/icons/addBusinessIcon.ts` | Icônes business pour PPTX |
| `src/pptx/template/loadBaseTemplate.ts` | Slide masters (COVER, CHAPTER, CONTENT, END) |
| `public/pptx/chapters/` | Images chapitres (ch-01..ch-09, PNG, coins arrondis) |

**Fichiers legacy (hors Serenity — ne pas s'en inspirer) :**
- `src/pptx/auditPptx.ts`
- `src/pptx/strategyPptx.ts`

---

## Gouvernance Excel

### Source de vérité
Les exports **sim/ir** et **sim/credit** sont les deux seuls exports Excel finalisés et constituent
la source de vérité. Tout nouvel export Excel doit s'aligner sur leurs patterns.

Succession et PER sont conformes à l'infrastructure mais présentent de petites divergences
documentées dans la section [Dettes techniques](#dettes-techniques-excel).

Placement est une **dette technique majeure** : format XLS XML legacy, pas de styles OOXML.

---

### Infrastructure : xlsxBuilder

**Fichier** : `src/utils/export/xlsxBuilder.ts`

Tous les exports doivent utiliser `buildXlsxBlob()` de ce module. Il génère un fichier OOXML
natif (ZIP) compatible Excel / LibreOffice / Numbers sans dépendance serveur.

```ts
// Import minimal requis
import { buildXlsxBlob, downloadXlsx, validateXlsxBlob } from '../../../utils/export/xlsxBuilder';
import type { XlsxCell, XlsxSheet } from '../../../utils/export/xlsxBuilder';

// Helper local recommandé (copier depuis IR ou Succession)
const cell = (v: string | number, style?: string): XlsxCell => ({ v, style });
// ou version courte avec helpers nommés :
function h(text: string): XlsxCell { return { v: text, style: 'sHeader' }; }
function sec(text: string): XlsxCell { return { v: text, style: 'sSection' }; }
function money(v: number): XlsxCell { return { v, style: 'sMoney' }; }
function pct(v: number): XlsxCell { return { v: v / 100, style: 'sPercent' }; }
```

❌ **Interdits** :
- Le module `src/utils/export/exportExcel.ts` (format XML MS-Office legacy, produit `.xls`)
- Toute génération de string XML Excel à la main
- L'extension `.xls` dans le nom de fichier de sortie

---

### Couleurs

| Rôle | Couleur | Source | Note |
|---|---|---|---|
| `headerFill` | `c1` | `themeColors?.c1` | Couleur accent principale du thème courant |
| `sectionFill` | `c7` | `themeColors?.c7` | Couleur de séparation du thème courant |

Les deux couleurs doivent **toujours** provenir des props du thème courant, pas de `DEFAULT_COLORS`.

```ts
// Correct (IR et Credit — source de vérité)
const blob = await buildXlsxBlob({
  sheets,
  headerFill: themeColors?.c1,
  sectionFill: themeColors?.c7,
});

// Incorrect (Succession et PER — dette)
const blob = await buildXlsxBlob({
  sheets,
  headerFill: themeColor,         // themeColor = c1 ✓
  sectionFill: DEFAULT_COLORS.c8, // ← hardcoded, ne suit pas le thème ✗
});
```

---

### Tokens de style

Six tokens disponibles dans `xlsxBuilder` :

| Token | Usage | Format OOXML |
|---|---|---|
| `sHeader` | En-tête de colonne | Fond `c1`, texte contrasté auto, gras, centré |
| `sSection` | Titre de section (séparateur) | Fond `c7`, gras |
| `sText` | Texte ordinaire, labels | Pas de format particulier |
| `sCenter` | Valeur centrée (ex. : nombre de parts) | Alignement centre |
| `sMoney` | Montant en euros | `#,##0 "€"` — 0 décimale, séparateur milliers, € suffixé |
| `sPercent` | Taux/pourcentage | `0.00%` — 2 décimales, % suffixé |

Tout token non listé ci-dessus sera ignoré (style par défaut).

---

### Formatage des valeurs

#### Montants € — style `sMoney`
- Passer la **valeur numérique brute**, le format OOXML s'applique automatiquement.
- Arrondir les calculs intermédiaires avant le passage : `Math.round(value)`.
- Le style produit automatiquement : `100 000 €` avec séparateur milliers français.

```ts
// Correct
cell(result.irNet || 0, 'sMoney')           // → "6 913 €"
cell(Math.round(line.interet), 'sMoney')    // → "1 234 €"

// Incorrect ❌
cell(`${result.irNet} €`, 'sText')          // → "6913 €" (pas de séparateur, pas de style)
cell('1 000 €', 'sText')                    // → string brute, non filtrable dans Excel
```

#### Pourcentages — style `sPercent`
- Toujours diviser par 100 avant de passer la valeur (OOXML attend un flottant entre 0 et 1).
- Le style produit automatiquement : `30,00%`.

```ts
// Correct — taux en % (ex. tmiRate = 30)
cell((result.tmiRate || 0) / 100, 'sPercent')    // → "30,00%"

// Correct — taux déjà en décimal (ex. tauxNominal = 0.035)
cell(loanTaux / 100, 'sPercent')                  // → "3,50%"

// Incorrect ❌
cell('30 %', 'sText')                             // → non filtrable, pas de style
cell(`${taux.toFixed(2)} %`, 'sText')             // → "30.00 %" (virgule anglaise)
cell(30 / 100, 'sPercent')                        // → correct
```

#### Textes libres
- Utiliser `sText` pour les labels, descriptions, noms.
- Utiliser `sCenter` pour des valeurs numériques affichées sans format monétaire (ex. : nombre de parts, durée).
- Les chaînes de type `"Oui"` / `"Non"`, `"Marié / Pacsé"`, noms de zones géographiques → `sText`.

---

### Structure des onglets

#### Pattern 2 colonnes Clé / Valeur (onglets Paramètres, Résultats, Inputs)

```
Ligne 1  : [ sHeader "Champ"   | sHeader "Valeur"  ]
Ligne 2  : [ sSection "Revenus"| sSection ""        ]
Ligne 3  : [ sText "Salaires"  | sMoney 45000       ]
...
```

- La première colonne contient toujours les labels.
- Les cellules vides à droite d'une `sSection` reçoivent `cell('', 'sSection')`.
- Pas de ligne de total en bas pour ces onglets (total dans l'onglet Résultats).

#### Pattern tableau horizontal N colonnes (onglets Détails, chronologie)

```
Ligne 1 : [ sHeader "Héritier" | sHeader "Part brute" | sHeader "Droits" | … ]
Ligne 2 : [ sText "Enfant"     | sMoney 150000        | sMoney 12356     | … ]
…
Ligne N : [ sSection "TOTAL"   | sMoney 300000        | sMoney 24712     | … ]  ← ligne total
```

- En-têtes sur la première ligne.
- Ligne de total optionnelle avec `sSection` (utilisée dans Succession/Détails).
- Cellules vides dans la ligne total → `{ v: '', style: 'sSection' }`.

#### Pattern tableau transposé (onglets amortissement Credit)

Utilisé quand les périodes sont nombreuses (mois ou années sur 20–30 ans) :
les **séries sont en lignes**, les **périodes en colonnes**.

```ts
// Avant d'ajouter au sheet : transposer le tableau
const rows = [headerRow, ...dataRows];
const transposed = transpose(rows); // utilitaire interne de useCreditExports
sheet = { name: 'Résumé', rows: transposed, columnWidths: [18, 14, 14, …] };
```

---

### Largeurs de colonnes (`columnWidths`)

Valeurs en unités de largeur Excel (approximativement en caractères).

| Cas d'usage | Valeurs recommandées |
|---|---|
| 2 colonnes clé/valeur — labels courts | `[30, 20]` |
| 2 colonnes clé/valeur — labels longs (IR) | `[36, 22]` |
| 2 colonnes clé/valeur — très larges (hypothèses) | `[45, 30]` |
| 2 colonnes clé/valeur — chronologie | `[42, 35]` |
| Tableau amortissement (8 col.) | `[18, 14, 14, 14, 14, 14, 14, 14]` |
| Tableau Détails IR (4 col.) | `[36, 18, 14, 18]` |
| Tableau Détails Succession (6 col.) | `[20, 18, 18, 18, 18, 15]` |
| Tableau Détails PER (7 col.) | `[10, 18, 18, 15, 15, 18, 18]` |

Toujours déclarer `columnWidths` explicitement — ne pas omettre le paramètre.

---

### Onglet Hypothèses (obligatoire)

Chaque export doit inclure un onglet `Hypothèses` en dernier.
Structure attendue :

```ts
function buildHypothesesSheet(): XlsxSheet {
  const rows = [
    [h('Hypothèse'), h('Référence')],
    ['Libellé de l\'hypothèse 1', 'CGI Art. XXX'],
    ['Libellé de l\'hypothèse 2', 'Hypothèse simplificatrice'],
    [],
    [sec('Avertissement'), sec('')],
    ['Ce document est établi à titre strictement indicatif.', ''],
    ['Il ne constitue pas un conseil juridique ou fiscal.', ''],
  ];
  return { name: 'Hypothèses', rows, columnWidths: [45, 30] };
}
```

- Toujours en dernière position dans le tableau `sheets`.
- Contient : les hypothèses + références CGI + avertissement légal obligatoire.

---

### Validation post-génération (obligatoire)

Toujours appeler `validateXlsxBlob()` après `buildXlsxBlob()` :

```ts
const blob = await buildXlsxBlob({ sheets, headerFill: themeColors?.c1, sectionFill: themeColors?.c7 });
const isValid = await validateXlsxBlob(blob);
if (!isValid) throw new Error('XLSX invalide (signature PK manquante).');
```

Cette validation vérifie la signature ZIP (octets `PK`). Elle protège contre les régressions
silencieuses de `xlsxBuilder`.

---

### Nommage des fichiers

| Pattern | Exemple | Statut |
|---|---|---|
| `simulation-{sim}-YYYYMMDD.xlsx` | `simulation-ir-20260315.xlsx` | ✅ Recommandé (IR) |
| `Simulation-{Sim}.xlsx` | `Simulation-Succession.xlsx` | ✅ Acceptable |
| `SER1_{Sim}_YYYY-MM-DD.xls` | `SER1_Placement_2026-03-15.xls` | ❌ Interdit (legacy) |

Le préfixe `SER1_` est déprécié. L'extension `.xls` est interdite.

Pour obtenir la date au format `YYYYMMDD` :
```ts
const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
downloadXlsx(blob, `simulation-${simId}-${dateStr}.xlsx`);
```

---

### Structure des onglets par simulateur (référence)

| Simulateur | Onglets dans l'ordre | Source |
|---|---|---|
| **IR** | Paramètres · Synthèse impôts · Détails calculs | `useIrExportHandlers.ts` |
| **Credit** | Paramètres · Résumé · Prêt 1 [· Prêt 2 · Prêt 3] | `useCreditExports.ts` |
| **Succession** | Inputs · Résultats · Détails · Chronologie · Hypothèses | `successionXlsx.ts` |
| **Placement** | Paramètres · Épargne P1/P2 · Liquidation P1/P2 · Transmission · Synthèse · Hypothèses | `placementExcelExport.ts` |

---

### Checklist — créer un nouvel export Excel

| Étape | Action | Fichier |
|---|---|---|
| 1 | Créer `build{Sim}XlsxSheet()` pour chaque onglet (fonctions pures) | `src/features/{sim}/{sim}Xlsx.ts` |
| 2 | Terminer par un onglet `Hypothèses` | idem |
| 3 | Appeler `buildXlsxBlob({ sheets, headerFill: c1, sectionFill: c7 })` | idem |
| 4 | Valider avec `validateXlsxBlob(blob)` | idem |
| 5 | Télécharger avec `downloadXlsx(blob, filename)` | idem |
| 6 | Nommer le fichier `simulation-{sim}-YYYYMMDD.xlsx` | idem |
| 7 | Exporter `exportAndDownload{Sim}Xlsx()` en point d'entrée | idem |
| 8 | Écrire un test smoke (PK header + blob non vide) | `src/features/{sim}/__tests__/{sim}Export.test.ts` |

---

### Dettes techniques Excel

Toutes les dettes identifiées à la rédaction initiale ont été corrigées dans le PR
`feat/excel-governance-alignment` :

| Simulateur | Problème résolu |
|---|---|
| **Placement** | Migré vers xlsxBuilder (OOXML), styles €/%, couleurs thème, `.xlsx`, onglet Hypothèses, test smoke |
| **Succession** | `sectionFill` désormais dynamique (c7 du thème), `validateXlsxBlob()` ajouté |
| **PER** | Export XLSX OOXML réintroduit sur `/sim/per/potentiel` via `xlsxBuilder`, avec onglets `Synthèse`, `Cases 2042`, `Hypothèses` et test smoke |
| **Credit** | Nom de fichier corrigé → `simulation-credit-YYYYMMDD.xlsx` |

---

## Références code
- Tokens & defaults : `src/settings/theme.ts`, `src/styles/index.css`
- ThemeProvider V5 : `src/settings/ThemeProvider.tsx`, `src/settings/presets.ts`, `src/settings/theme/types.ts`
- UI premium shared : `src/components/simulator/SimulatorShell.css`, `src/styles/premium-shared.css`
- Baseline `/sim/credit` : `src/features/credit/Credit.tsx`, `src/features/credit/components/CreditV2.css`
- Inputs simulateur : `src/features/credit/components/CreditInputs.tsx`, `src/features/credit/components/CreditInputs.css`
- ESLint couleurs : `tools/eslint-plugin-ser1-colors/`
