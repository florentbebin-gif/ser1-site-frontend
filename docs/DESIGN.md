# DESIGN SER1

## Role du document

`docs/DESIGN.md` est le contrat operationnel du design system SER1 pour les humains et les LLM.
Il decrit quoi utiliser, quoi eviter et comment verifier une page. Les details historiques,
les audits et les exceptions longues restent dans `docs/GOUVERNANCE.md`.

Sources runtime :

- palette utilisateur : `src/settings/theme.ts`, exposee en CSS par
  `src/settings/theme/hooks/useThemeSync.ts` sous `--color-c1` a `--color-c10` ;
- alias semantiques : `src/styles/index.css`, derives uniquement des C1-C10 ;
- primitives simulateurs : `src/components/ui/sim/*` et `src/styles/sim/index.css` ;
- showroom admin : `/settings/design-system`.

## Couleurs

### Palette C1-C10

- C1 : ancrage institutionnel, titres forts, elements de marque.
- C2 : action principale, focus metier, controles actifs.
- C3 : etat actif, graphiques primaires, focus secondaire.
- C4 : fill doux, etats subtils, fonds de selection.
- C5 : data secondaire, graphes et textes techniques.
- C6 : signature cuivre, accent premium.
- C7 : fond de page et surfaces teintees.
- C8 : bordures, separateurs, contours.
- C9 : texte secondaire et meta.
- C10 : texte primaire a contraste maximal.

C1-C10 sont configurables par l'utilisateur. Toute couleur ajoutee au runtime doit donc etre
derivee de C1-C10 ou d'un alias semantique, jamais d'un hex local. Quand C1 change dans un theme
personnalise, la palette est recalculee par les helpers theme existants ; les alias CSS suivent
automatiquement car ils referencent `var(--color-c*)` ou `color-mix(...)`.

### Alias semantiques

Utiliser les alias pour le code applicatif nouveau :

- surfaces : `--surface-page`, `--surface-card`, `--surface-muted`, `--surface-elevated` ;
- textes : `--text-primary`, `--text-secondary`, `--text-muted`, `--text-on-action` ;
- bordures : `--border-default`, `--border-strong`, `--border-subtle` ;
- actions : `--action-primary`, `--action-primary-hover`, `--action-secondary` ;
- etats : `--state-success`, `--state-warning`, `--state-danger`, `--state-info` ;
- systeme : `--overlay-modal`, `--focus-ring-color`, `--focus-ring`.

`--focus-ring` reste un token compose de box-shadow. Ne pas le remplacer par une couleur simple.
Si un composant a seulement besoin de la couleur, utiliser `--focus-ring-color`.

### Usages interdits

- Pas de nouvelle couleur fiscale, UI, graphique, statut ou modale en hex local dans `src`.
- Pas de `rgba(0, 0, 0, ...)` nouveau hors ombre/overlay documente.
- Pas de couleur de graphique non derivee du theme.
- Pas de texte clair sur fill C4/C7 sans verification de contraste.

Exceptions existantes tolerees : blanc pur pour cartes/modales/chips, ombres et overlays,
presets theme, tests qui prouvent une valeur, exports PPTX qui ont leur contrat propre.

## Layout simulateur

Toute page `/sim/*` nouvelle ou refondue utilise `SimPageShell` sauf exception documentee.
Le pattern attendu est :

- header compact avec titre, description et actions ;
- zone de saisie principale a gauche ;
- synthese/KPI a droite quand le simulateur produit un diagnostic ;
- etats vide, loading, erreur et disabled prevus ;
- mobile 390 px sans chevauchement, sans texte tronque dans les boutons.

Les cards ne doivent pas etre imbriquees dans d'autres cards. Les sections de page sont des bandes
ou layouts non cadres ; les cards servent aux items repetes, outils cadres et modales.

## Formattage et alignements

- Montants euros : affichage `fr-FR`, separateur de milliers, unite `€` visible hors du nombre.
- Champs euros : valeur alignee a droite, unite dans le suffixe ou la colonne unite.
- Pourcentages : virgule ou point acceptes en saisie, affichage en `%`, jamais decimal brut.
- Taux annuels : afficher `% / an` quand l'horizon est annuel ; `%` seul si le contexte est evident.
- Durees : libelles explicites `ans`, `mois`, `annees`, selon la granularite.
- Dates : format utilisateur `jj/mm/aaaa`; source ou export technique en ISO seulement si le
  contexte est technique.
- Nombres non monetaires : alignement a droite dans les champs, alignement tabulaire dans les tables.
- Labels : au-dessus du champ dans les simulateurs, courts, en sentence case.
- Unites : ne pas les saisir dans le champ ; elles sont affichees par le composant.

Utiliser `SimAmountInputEuro`, `SimAmountInputPercent`, `SimAmountInputNumeric`, `SimSelect` et les
wrappers locaux qui les deleguent. Ne pas ajouter de `<input type="number">` brut dans `/sim/*`.

## Settings UI vs Simulator UI

Settings UI :

- pages admin, denses, orientees gestion ;
- composants `SettingsSectionCard`, `SettingsTable`, modales settings existantes ;
- champs natifs autorises pour saisies de baremes/admin quand le check l'autorise ;
- objectif : edition fiable, lisibilite de tables, actions admin.

Simulator UI :

- pages client/conseiller, restitution premium et pedagogique ;
- primitives `Sim*`, `SimPageShell`, `src/styles/sim/index.css` ;
- champs numeriques formates, KPI et etats vides explicites ;
- objectif : comprehension immediate, diagnostic et export.

Ne pas importer une convention settings dans un simulateur pour aller plus vite. Ne pas faire du
showroom `/settings/design-system` une exception visuelle : il doit montrer les styles reels.

## Composants canoniques

Solides pour `/sim/*` :

- `SimPageShell`, `SimActionButton`, `SimAmountInputEuro`, `SimAmountInputPercent`,
  `SimAmountInputNumeric`, `SimSelect`, `SimMetric`, `SimDelta`, `SimStatusBadge`,
  `SimCollapsibleTable`, `SimModalShell`, `SimModalSectionNav`, `SimEmptyState`,
  `SimSkeleton*`, `SimTooltip`, `SimInfoButton`, `SimSegmentedControl`, `SimPageStepper`.

Non canoniques ou a couvrir au besoin :

- checkbox, switch, radio ;
- textarea, date ;
- alert/toast ;
- drawer ;
- tabs/accordion generiques.

Avant d'ajouter une primitive, prouver les usages existants par `rg`, puis preferer un wrapper mince
sur les styles `Sim*` plutot qu'une nouvelle famille CSS.

## Accessibilite

- Focus visible sur tout controle interactif avec `--focus-ring`.
- Label accessible obligatoire pour champ, bouton icon-only et select.
- Boutons icon-only : `aria-label` descriptif, icone decorative `aria-hidden`.
- Modales : `role="dialog"`, `aria-modal`, titre accessible, focus trap, retour focus, fermeture
  Escape et bouton fermer nomme.
- Select custom : role listbox/option, navigation ArrowUp/ArrowDown, Enter pour selectionner,
  Escape pour fermer, option disabled ignoree.
- Disabled : lisible, non cliquable, contraste suffisant, raison visible si necessaire.
- Mobile : ordre de tabulation logique et actions sticky non chevauchantes.

## Checklist nouvelle page LLM

1. Lire `docs/DESIGN.md` et `docs/GOUVERNANCE.md`.
2. Prouver route, imports et styles existants par `rg`.
3. Pour `/sim/*`, partir de `SimPageShell` et des primitives `Sim*`.
4. Utiliser les alias semantiques ou C1-C10, aucune nouvelle couleur hardcodee.
5. Prevoir etats vide, loading, erreur, disabled.
6. Formater euros, pourcentages, taux, dates et unites selon ce document.
7. Verifier clavier, focus, labels, modales Escape.
8. Tester desktop, tablette et mobile 390 px.
9. Lancer les checks UI pertinents puis `npm run check` avant commit final.
