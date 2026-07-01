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

C1-C10 sont configurables par l'utilisateur et restent la source palette. Toute couleur runtime est
un token : aucun litteral hex/rgb/hsl n'est autorise dans le code applicatif hors allowlist
versionnee par `tools/ser1-color-policy.mjs`. Les alias semantiques sont la cible de consommation
UI.

`var(--color-c4)`, `var(--color-c5)` et `var(--color-c6)` directs sont interdits dans le runtime :
utiliser `--surface-active`, `--data-secondary`, `--accent-signature` ou `--state-warning`.
Les `var(--color-c1)`, `var(--color-c2)`, `var(--color-c3)`, `var(--color-c7)`, `var(--color-c8)`,
`var(--color-c9)` et `var(--color-c10)` directs restent toleres aujourd'hui, mais doivent migrer
vers les alias au fil des modifications. C'est cette migration progressive qui conditionne le
dark-mode-ready.

Quand C1 change dans un theme personnalise, la palette est recalculee par les helpers theme
existants ; les alias CSS suivent automatiquement car ils referencent `var(--color-c*)` ou
`color-mix(...)`.

### Alias semantiques

Utiliser les alias pour le code applicatif nouveau :

- surfaces : `--surface-page`, `--surface-card`, `--surface-muted`, `--surface-elevated`,
  `--surface-active` ;
- textes : `--text-primary`, `--text-secondary`, `--text-muted`, `--text-on-action` ;
- bordures : `--border-default`, `--border-strong`, `--border-subtle` ;
- actions : `--action-primary`, `--action-primary-hover`, `--action-secondary` ;
- accents et donnees : `--accent-signature`, `--data-secondary` ;
- etats : `--state-success`, `--state-warning`, `--state-danger`, `--state-info` ;
- systeme : `--overlay-modal`, `--shadow-color`, `--focus-ring-color`, `--focus-ring`.

Les etats semantiques restent themables. `--state-warning` derive de C6 mais est **decouple** de
`--accent-signature` (cuivre) : il est approfondi vers C10 pour rester saillant comme alerte, tandis
que le cuivre reste un accent de marque. Ne pas ajouter de warning hex local, meme pour garantir un
contraste ponctuel ; dans ce cas, corriger la palette ou afficher le contraste dans le showroom.
Les tokens data-viz du cockpit (`--viz-*`) sont decrits dans la section « Cockpit `/audit` ».

`--focus-ring` reste un token compose de box-shadow. Ne pas le remplacer par une couleur simple.
Si un composant a seulement besoin de la couleur, utiliser `--focus-ring-color`.

### Dark-mode-ready

SER1 ne contient pas de moteur de contraste runtime ni de recalcul automatique de dark mode. Le
contrat "dark-mode-ready" est plus simple : l'UI consomme les alias semantiques, et un futur mode
sombre pourra brancher un second jeu d'alias sans modifier chaque composant. Ne pas promettre un
dark mode en deriveant dynamiquement la palette actuelle : `paletteGenerator.ts` reste mono-mode.

### Usages interdits

- Pas de nouvelle couleur fiscale, UI, graphique, statut ou modale en hex local dans `src`.
- Pas de `rgba(...)`, `rgb(...)`, `hsl(...)` ou hex runtime hors allowlist versionnee.
- Pas de couleur de graphique non derivee du theme.
- Pas de texte clair sur fill C4/C7 sans verification de contraste.

Exceptions versionnees : sources theme/presets/bootstrap, showroom palette, tests et fixtures,
migrations de palette, exports PPTX controles et logos de marque externes. L'allowlist executable
est `tools/ser1-color-policy.mjs`.

## Layout simulateur

Toute page `/sim/*` nouvelle ou refondue utilise `SimPageShell` sauf exception documentee.
Le pattern attendu est :

- header compact avec titre, description et actions ;
- zone de saisie principale a gauche ;
- synthese/KPI a droite quand le simulateur produit un diagnostic ;
- etats vide, loading, erreur et disabled prevus ;
- mobile 390 px sans chevauchement, sans texte tronque dans les boutons.

La colonne gauche `DossierRail` est un **fil de parcours discret** (sans cadre, fil vertical a puces,
etape courante seule mise en avant) : c'est un repere, pas un concurrent du contenu. Le toggle Mode
expert est un switch compact dont l'etat actif utilise `--action-primary`. Details : `GOUVERNANCE.md`
(Exception V2-03b et §6). Demo runtime : `/settings/design-system`.

Les cards ne doivent pas etre imbriquees dans d'autres cards. Les sections de page sont des bandes
ou layouts non cadres ; les cards servent aux items repetes, outils cadres et modales.

## Home

La Home est une surface d'orientation, pas un catalogue. Le premier écran canonique affiche :

- un rail gauche léger avec `Dossier de travail` et `Mode utilisateur` ;
- un en-tête d'accueil `Bonjour,` avec icône, titre et sous-texte d'orientation ;
- deux cartes d'entrée : action dossier dominante à libellé dynamique (`Nouvelle analyse patrimoniale`, `Continuer le dossier`, `Reprendre la stratégie`, puis `Continuer le scénario` quand un signal fiable existe) et action scan secondaire contextualisée ;
- si un dossier est actif, une demi-jauge `Structuration du dossier` est visuellement attachée à la carte scan ; à vide, aucune jauge ni `0 %` n'est affiché ;
- un séparateur discret, puis `SIMULATEURS` sans sous-texte d'accompagnement ;
- deux espaces fermés par défaut : `Foyer & patrimoine privé` et `Société & dirigeant`, chacun avec une accroche unique.

Au chargement, ne pas afficher d'onglets, de carte simulateur individuelle, de grille complète ni de
panneau détail. L'en-tête d'espace ouvre seulement l'espace et l'onglet correspondant ; le panneau détail
simulateur apparait uniquement après clic explicite sur une carte simulateur visible.

## Densité 100 %

Le rendu de référence SER1 est le navigateur à 100 %, avec une densité visuelle équivalente à
l'ancien usage à 80 %. Sur un écran Windows affiché à 125 %, une capture physique `1900x900`
correspond à un viewport CSS proche de `1520x720` : ce viewport doit donc rester un cas de
vérification prioritaire.

Repères desktop :

- topbar complète avec session : environ 48 px CSS, soit 60 px physiques à 125 % ;
- Home : colonne centrale autour de 864 px CSS, rail gauche autour de 148 px CSS ;
- contrôles courants : 30-34 px CSS maximum hors besoin tactile mobile ;
- cible tactile mobile : `--touch-target-mobile`, soit 44 px CSS ;
- texte courant : `--font-size-md`, soit 11 px CSS ;
- titres de page compacts : `--font-size-2xl`, soit 18 px CSS ;
- KPI très visibles : `--font-size-3xl`, soit 22 px CSS maximum par défaut.

Ne pas utiliser `zoom`, `transform: scale(...)` ni un wrapper global pour simuler cette densité.
Densifier d'abord les tokens et primitives partagées, puis corriger localement uniquement les pages
qui échappent encore au contrat.

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

Utiliser `SimAmountInputEuro`, `SimAmountInputPercent`, `SimAmountInputNumeric`, `SimSelect`,
`SimTemporalField` (dates/mois, valeur ISO interne) et les wrappers locaux qui les deleguent. Ne pas
ajouter de `<input type="number">`, `type="date"` ou `type="month"` brut dans `/sim/*` (gardes-fous
`check:no-raw-number-input` et `check:no-raw-temporal-input`).

## Settings UI vs Simulator UI

Settings UI :

- pages admin, denses, orientees gestion ;
- composants `SettingsSectionCard`, `SettingsTable`, `SettingsModalShell` pour les modales admin ;
- champs natifs autorises pour saisies de baremes/admin quand le check l'autorise ;
- objectif : edition fiable, lisibilite de tables, actions admin.

Cas `/settings/memento` :

- les accordéons principaux portent un titre court et un sous-titre d'une phrase ;
- chaque chapitre suit la même hiérarchie : `Lire`, `Paramètres des calculateurs`, `Sources et
couverture`, puis audit admin global ;
- `Lire` reste une zone de lecture métier : pas de pastille de pilotage, pas de valeur révisable en
  prose, pas de jargon technique type `claimKey` ou `registryKey` ;
- les valeurs administrées et les champs éditables restent dans `Paramètres des calculateurs` ;
- les références et pastilles de couverture restent dans `Sources et couverture` ou dans l'audit
  admin, avec libellé d'axe explicite ;
- les axes de statut ne sont pas distingués par la couleur seule : emplacement, préfixe et source de
  donnée doivent rester lisibles (`Couverture`, `Revue`, `Source`, `Fraîcheur`, `Paramètre`,
  `Simulateur`) ;
- les panneaux admin comme `Pilotage mises à jour` et `Audit & sources` restent fermés par défaut,
  denses mais sans scroll horizontal desktop/mobile.

Simulator UI :

- pages client/conseiller, restitution premium et pedagogique ;
- primitives `Sim*`, `SimPageShell`, `src/styles/sim/index.css` ;
- champs numeriques formates, KPI et etats vides explicites ;
- objectif : comprehension immediate, diagnostic et export.

Ne pas importer une convention settings dans un simulateur pour aller plus vite. Ne pas faire du
showroom `/settings/design-system` une exception visuelle : il doit montrer les styles reels.
Le showroom est compose de sections extraites dans `src/pages/settings/designSystem/`. Toute
nouvelle demo = nouveau fichier section + son test dedie ; ne pas reinjecter de preview inline dans
`SettingsDesignSystem.tsx`.

## Composants canoniques

Solides pour `/sim/*` :

- `SimPageShell`, `SimActionButton`, `SimAmountInputEuro`, `SimAmountInputPercent`,
  `SimAmountInputNumeric`, `SimSelect`, `SimMetric`, `SimDelta`, `SimStatusBadge`,
  `SimCollapsibleTable`, `SimModalShell`, `SimModalSectionNav`, `SimEmptyState`,
  `SimSkeleton*`, `SimTooltip`, `SimInfoButton`, `SimSegmentedControl`, `SimTemporalField`,
  `SimPageStepper`.

Non canoniques ou a couvrir au besoin :

- checkbox, switch, radio ;
- textarea ;
- alert/toast ;
- drawer ;
- tabs/accordion generiques.

Avant d'ajouter une primitive, prouver les usages existants par `rg`, puis preferer un wrapper mince
sur les styles `Sim*` plutot qu'une nouvelle famille CSS.

## Bascules, onglets et switch

Trois familles seulement, choisies par la **semantique** (jamais par gout visuel). Ne pas creer de
toggle CSS ad hoc par feature.

- **Choix court mutuellement exclusif** (ex. Mensuel/Annuel, Particulier/Entreprise) : composant
  `SimSegmentedControl` (`role="radiogroup"`, visuel `.sim-segmented` = pill blanc, actif = carte
  blanche + ombre). C'est le seul visuel segmente autorise.
- **Navigation entre etapes/panneaux** (workflow PER, phases Placement, fiche contrat) : onglets
  **soulignes** (`role="tablist"`, `aria-selected`, etape courante `aria-current`). Motif partage :
  `.sim-underlined-tabs` + `.sim-underlined-tab` (baseline degradee C8, actif C3). Ne pas styliser
  une navigation en pill segmente.
- **On/off binaire** (Mode expert, options Placement/Crédit) : switch à genou (« bouton pilule »).
  **Piste OFF = `--color-c8`** pour tous les switches du repo (`mode-toggle-pill`, `pl-toggle__switch`,
  `ci-toggle__switch`) ; l'état actif reste propre au contexte (`--action-primary` pour `ModeToggle`).

Cas distinct, hors de ces familles : les cartes-option riches (ex. `.ts-phase-source` Tresorerie,
choix avec sous-libelles) restent un `role="radiogroup"` de cartes, pas un segmente.

Regle d'accessibilite : ne jamais convertir une navigation (`tablist`) en `radiogroup`, ni l'inverse.
Voir l'inventaire et les exceptions dans `GOUVERNANCE.md`. Demo runtime : `/settings/design-system`
(« Primitives UI » → Controle segmente et onglets soulignes).

## Modales

Toute modale suit l'**anatomie canonique** (header, fermeture ronde, nav de section, corps, footer,
largeurs) decrite dans `GOUVERNANCE.md` §16d. Points non negociables :

- Shell : `SimModalShell` (/sim) ou `SettingsModalShell` (admin), meme anatomie visuelle.
- Deux familles visuelles seulement : **normale sans menu gauche** et **avec menu gauche**. Les
  modales avec menu gauche composent `sim-modal-layout--with-nav`, `sim-modal-layout__nav` et
  `sim-modal-layout__content`; le visuel des items vient de `SimModalSectionNav` ou d'un `tablist`
  accessible reutilisant `sim-modal-section-nav__item`.
- Nav de sections (≥ 2 rubriques) : **laterale gauche, actif gris**. Jamais d'onglets en haut sur
  desktop ni de nav blanche bordee divergente. Detail et exceptions : `GOUVERNANCE.md` §16d.
- Footer toujours present : `Annuler` (ghost) + `Valider`/`Enregistrer` (primary) ; destructif a gauche
  (`sim-modal-btn--danger`). Pas de footer a un seul bouton ambigu (`Terminer`).
- Largeurs : classes canoniques (`--sm/md/lg/xl`), `--lg` par defaut, `--xl` contenu large.
- Champs : primitives `Sim*` (dont `SimTemporalField` pour dates/mois) ; les modales Settings qui
  reprennent l'anatomie simulateur utilisent aussi `SimFieldShell`/`SimSelect` pour eviter les champs
  natifs divergents. Sur fond blanc, les champs gardent le fond gris canonique ; sur fond teinte
  (panneau de section, modale avec menu gauche, bloc secondaire), le conteneur pose
  `--sim-input-bg: var(--surface-card)` pour rendre les inputs blancs. Interdit : redéfinir le
  `background` directement sur `.sim-field__control` ou `.sim-field__select-trigger`.

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
4. Utiliser les alias semantiques pour l'UI ; ne jamais ajouter de litteral hex/rgb/hsl runtime,
   ni de `var(--color-c4/c5/c6)` direct.
5. Prevoir etats vide, loading, erreur, disabled.
6. Formater euros, pourcentages, taux, dates et unites selon ce document.
7. Verifier clavier, focus, labels, modales Escape.
8. Tester desktop, tablette et mobile 390 px.
9. Lancer les checks UI pertinents puis `npm run check` avant commit final.

## Cockpit `/audit` — règles verrouillées (UX-00b)

Le contrat complet du cockpit `/audit` vit dans `docs/AUDIT_COCKPIT.md`. UX-00a a figé le contrat ;
**UX-00b a verrouillé** les fondations design system ci-dessous (tokens, showroom, checks), sans coder
les pages métier. Démo runtime : `/settings/design-system` (sections « Surfaces cockpit »,
« Data-viz cockpit », « Modales » → drawer /audit).

### Data-viz & statuts

- C1-C10 restent la palette configurable utilisateur. On n'ajoute pas de slot configurable.
- Les graphes, radars, jauges et statuts du cockpit consomment des tokens sémantiques dérivés du
  thème, définis dans `src/styles/index.css` : `--viz-1`…`--viz-8` (séries catégorielles),
  `--viz-current`/`--viz-scenario` (radar), `--viz-sequential-1`…`-5` (anneaux/jauges).
- `--state-warning` est **découplé** de `--accent-signature` (cuivre) : le cuivre est un accent de
  marque / version active / KPI héros, jamais un statut d'alerte.
- Aucune couleur locale, aucun hex/rgb/hsl runtime ; toute couleur de graphe passe par `--viz-*` ou
  `--state-*`. Garde-fou : `check:css-colors` interdit tout littéral de couleur dans un `--viz-*` et
  interdit le cuivre dans les séries du radar.
- Une extension C11-C14 n'est envisagée que si la dérivation accessible depuis C1-C10 est prouvée
  insuffisante, par PR dédiée verrouillée par docs + showroom + checks.
- Les branches familiales de `/audit` ne créent pas de nouveaux slots C11-C14 : elles passent par
  `--audit-family-branch-common`, `--audit-family-branch-client` et
  `--audit-family-branch-conjoint`, alias locaux dérivés des tokens existants. Usage autorisé :
  connecteurs, liserés et anneaux légers. Interdit : fond de carte coloré, état UI ou information
  portée par la couleur seule.
- Les avatars de filiation passent par `--audit-avatar-surface`, `--audit-avatar-ring` et
  `--audit-avatar-ink`. Ces alias corrigent le contraste avatar/capsule sans créer de palette
  persistée : la branche client/conjoint peut seulement remplacer l'anneau ou le liseré.

### Surfaces — taxonomie à 4 niveaux

Classes canoniques dans `src/styles/sim/surfaces.css` :

- **Carte** : surface élevée (bordure + rayon + ombre), outil cadré (`premium-card` / `sim-card`) ;
  pas d'autre carte élevée à l'intérieur.
- **Bande** (`sim-band`) : section interne sans élévation, séparée par espacement ou filet
  `--border-subtle`.
- **Ligne KPI** (`sim-kpi-line`) : label + valeur, typographique, sans cadre.
- **Micro-tuile plate** (`sim-tile-flat`) : fond `--surface-muted`, rayon léger, sans ombre ni
  bordure forte ; autorisée dans une carte car non élevée.
- Règle : aucune surface avec ombre dans une surface avec ombre. Garde-fou : `check:sim-cards`
  interdit `box-shadow` sur les classes plates.

### Drawer /audit

- Famille canonique `sim-drawer` dans `src/styles/sim/modals.css` : drawer ancré à droite,
  **variante de l'anatomie modale** (réutilise `sim-modal__header` / `__footer` / `__close` et la nav
  latérale `sim-modal-layout--with-nav`). Anatomie : header, menu interne gauche optionnel, corps,
  panneau sources optionnel (`sim-drawer__sources`), footer stable Annuler/Enregistrer. Largeurs
  canoniques uniquement via `sim-drawer--md`, `sim-drawer--lg` et `sim-drawer--xl`, choisies selon la
  densité du contenu.
- Aucune largeur locale ; `check:modal-canon` bloque toute largeur de drawer racine hors fichier
  canonique. Le focus trap, `Escape` et le retour focus restent portés par le futur composant shell
  (UX-03).

### Motion courte

- Durées 120–260 ms ; pas de `scale`/`zoom` ; pas de glow permanent.
- `prefers-reduced-motion` respecté.
- Un seul point focal animé par écran (le radar dans le cockpit).
