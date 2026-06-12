# Macro-roadmap settings — Mémento patrimonial & social SER1

Roadmap structurante du chantier mémento (38 PR métier + PR6b de stabilisation, exécutées par lots thématiques depuis la PR 8 — voir « Exécution par lots »). Pointée depuis `docs/ROADMAP.md` § « Mémento settings — roadmap dédiée ».

## Statut d'avancement

Dernière mise à jour : 2026-06-12.

| PR                                               | Périmètre                                                                                                                                                                                                                                                                                                                                                                           | Statut                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| PR 1 — Taxonomie mémento, statuts et gouvernance | `src/domain/settings-memento/` : types, 14 chapitres, validators, garde anti-valeurs                                                                                                                                                                                                                                                                                                | **Livrée** (PR #585, commit `adfde8ee`) |
| PR 2 — Correspondance simulateurs → mémento      | `simulatorCoverage*` : 33 simulateurs registry + sous-types + ROADMAP-only                                                                                                                                                                                                                                                                                                          | **Livrée** (PR #586, commit `92cd5be6`) |
| PR 3 — Route `/settings/memento` et UI V1        | Route, première page mémento, e2e                                                                                                                                                                                                                                                                                                                                                   | **Livrée** (PR #587, commit `a8117ffb`) |
| PR 4 — Coverage adapter et audit mémento         | `coverage.ts`, `check:memento-coverage` branché dans `check:static`                                                                                                                                                                                                                                                                                                                 | **Livrée** (PR #588, commit `744dffb0`) |
| PR 5 — Socle foyer                               | Premier contenu métier : filiation, régime matrimonial, donations antérieures, budget, actif-passif                                                                                                                                                                                                                                                                                 | **Livrée** (PR #590)                    |
| PR 6 — Fiscalité foyer                           | IR, IFI, niches, revenus fonciers, LMNP/LMP, PV immobilières                                                                                                                                                                                                                                                                                                                        | **Livrée** (PR #591)                    |
| PR6b — UX mémento et gouvernance sources         | Séparation vue métier/audit, priorités, intentions, sources externes génériques                                                                                                                                                                                                                                                                                                     | **Livrée**                              |
| PR 7 — Transmission                              | DMTG succession, AV décès, donation/démembrement, Dutreil, variantes société en couverture                                                                                                                                                                                                                                                                                          | **Livrée**                              |
| PR 8 — Placements et Base-Contrat                | Allocation, assurance-vie/capitalisation, PEA/CTO, SCPI                                                                                                                                                                                                                                                                                                                             | **Livrée** (PR #594)                    |
| PR 9 — Immobilier patrimonial                    | Crédit, investissement locatif, SCI, SCPI, dispositifs fiscaux, non-résidents, arbitrage/réemploi                                                                                                                                                                                                                                                                                   | **Livrée**                              |
| PR 13 — International prudent                    | Entrées non-résidents IR/IFI et transmission internationale en `a_verifier`, rattachées aux chapitres existants ; compléments civil (dévolution, réserve, libéralités) et socle démembrement                                                                                                                                                                                        | **Livrée**                              |
| PR 10 à PR 12 — Société et comptabilité          | Grille mémento : IS, mère-fille/QPFC, CCA, résultat distribuable et réserves, capitaux propres, bilans/liasses, primes, emprunts, immobilisations, immobilier détenu, trésorerie, organigramme, projection, valorisation, cession, holding/apport-cession, OBO, épargne salariale partielle, paiement différé/fractionné ; références Code de commerce et CGI annexe III qualifiées | **Livrée**                              |
| Lot R5 — Dirigeant et social                     | Dividendes TNS, rémunération dirigeant, charges sociales assimilé salarié/TNS/libérales, PUMA/CSM, sortie de capitaux et prévoyance dirigeant ; micro-social maintenu absent par décision V5 ; sources URSSAF/BOSS/Service-Public qualifiées quand elles existent, sans moteur social ni valeurs nouvelles                                                                          | **Livrée**                              |
| Lot R6 — Retraite obligatoire                    | Retraite globale, régime général, AGIRC-ARRCO, dirigeant assimilé salarié, SSI, CNAVPL, caisses santé, CIPAV, MSA et autres caisses libérales ; sources Assurance retraite, AGIRC-ARRCO, Service-Public, URSSAF, CNAVPL, CIPAV et MSA qualifiées quand elles existent, sans moteur retraite ni valeurs générationnelles                                                             | **Livrée**                              |
| Lot R7 — Prévoyance et dispositifs transverses   | Dispositifs transverses retraite, réversion, Base CG retraite documentaire et prévoyance obligatoire ; cartographie caisses via `prevoyance.affiliation-caisses`, sources JSONB prévoyance préservées et audit `audit:settings-references -- --with-db` requis                                                                                                                      | **Livrée**                              |
| Lot R8 — Épargne retraite et clôture             | PER, potentiel PER, transfert PER, article 83/PERO, Madelin, PERCOL/PERCO, fiscalité de sortie retraite, lexique sourcé et fraîcheur hebdomadaire des références Settings avec rapport Supabase + bannière Home admin dismissible                                                                                                                                                   | **Livrée**                              |

### Clôture M0-M10 — décision finale

- `/settings/memento` est la page unique du mémento utilisateur et des éditeurs fiscal/social.
- Les éditeurs intégrés écrivent dans les tables Supabase existantes ; les calculateurs lisent
  toujours par `fiscalSettingsCache`, `useFiscalContext` et `settingsDefaults`.
- Aucune migration SQL de consolidation n'est nécessaire pour le regroupement des pages.
- `/settings/base-contrat-retraite` reste séparée, car elle porte la base documentaire des
  contrats retraite.
- Les anciennes routes fiscal/social séparées ne sont plus déclarées dans `SETTINGS_ROUTES`.
- Aucune dette restante identifiée.

### Exécution par lots

Depuis la PR 8, le contenu de la grille mémento est livré par lots thématiques contractualisés en
pré-implémentation : R1 placements = PR 8 (#594), R2 immobilier = PR 9 (#595), R3
civil/international = PR 13 (#596), R4 société/comptabilité = PR 10 à 12, R5 dirigeant/social,
R6 retraite obligatoire, R7 prévoyance (audit `--with-db` requis), R8 épargne retraite et clôture.
Les lots R5 à R8 remplacent les PR 14 à 38 pour le périmètre grille mémento ; les chantiers moteurs
des parties 3 à 5 (modèle charges sociales, pipeline Excel/OCR, domaine retraite, goldens sociaux)
restent des chantiers dédiés hors grille, à re-cadrer à la clôture R8, comme les décisions lexique
(PR 37) et indicateurs économiques. Les sections C et D valent désormais inventaire de périmètre et
de critères de sortie, pas séquencement contractuel ; les tableaux E et F restent la cible de
couverture.

### Backlog de sourcing des lots livrés

Références officielles restant à qualifier pour des entrées déjà livrées (statuts `partiel`,
`planned` ou `a_verifier` motivés dans leur `statusReason`). Qualifier = créer le `refId` dans
`src/domain/legal-references/references.json` avec URL officielle vérifiée puis le rattacher à
l'entrée. R8 vérifie que ces dettes restent explicites ; les compléments non soldés partent en PR
métier dédiée plutôt qu'en dette muette.

| Entrée mémento                                                            | Référence à qualifier                                                                                                                         | Priorité                  |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `societe.groupe-mere-fille-qpfc`                                          | CGI 145 et 216 (éligibilité mère-fille, partagé avec holding)                                                                                 | P1                        |
| `societe.compte-courant-associe`                                          | CGI 39, 1-3° (intérêts de comptes courants)                                                                                                   | P1                        |
| `societe.holding-apport-cession`                                          | CGI 150-0 B ter (report d'imposition de l'apport-cession)                                                                                     | P1                        |
| `societe.cession-titres`                                                  | CGI 150-0 D ter (abattement dirigeant partant à la retraite)                                                                                  | P1                        |
| `societe.valorisation-titres`                                             | Guide DGFiP d'évaluation des entreprises et des titres                                                                                        | P1                        |
| `societe.epargne-salariale`                                               | Forfait social et titres de services (URSSAF/BOSS)                                                                                            | P1/P2                     |
| `societe.organigramme`                                                    | Formes sociales (Code de commerce)                                                                                                            | P2                        |
| `societe.obo`                                                             | Méthode et sources du montage                                                                                                                 | Reportée au jalon société |
| `dirigeant.charges-sociales-assimile-salarie`                             | CSS L311-3 (périmètre assimilé salarié des mandataires) ; qualification BOSS par mandat                                                       | P1                        |
| `dirigeant.dividendes-tns` / `dirigeant.charges-sociales-tns`             | CSS L131-6 et doctrine BOSS/URSSAF par forme sociale pour le régime complet des dividendes TNS                                                | P1                        |
| `dirigeant.puma-csm`                                                      | CSS L380-2 (base légale PUMA/CSM, au-delà de la fiche Service-Public)                                                                         | P1                        |
| `dirigeant.remuneration` / `dirigeant.charges-sociales-assimile-salarie`  | CGI 231 (taxe sur les salaires, si applicable aux rémunérations ou mandats)                                                                   | P2                        |
| `dirigeant.charges-sociales-tns` / `dirigeant.charges-sociales-liberales` | Barèmes URSSAF/BOSS de cotisations sociales par régime, hors cartographie caisses prévoyance déjà portée par `prevoyance.affiliation-caisses` | P1                        |
| `retraite.globale` / `retraite.regime-general`                            | Trimestres assimilés, règles générationnelles et droits multi-régimes au-delà des dispositifs transverses R7                                  | P1                        |
| `retraite.ssi-artisan-commercant`                                         | CSS L633-1 et L635-1, puis doctrine SSI/URSSAF détaillée du régime complémentaire                                                             | P1                        |
| `retraite.cnavpl-professions-liberales`                                   | CSS L643-1 à L643-6 et D643-1 à D643-16 ; sections CNAVPL par profession                                                                      | P1                        |
| `retraite.caisses-sante-liberales`                                        | Sources CARMF, CARCDSF, CARPIMKO, CAVP et CARPV par catégorie retraite                                                                        | P1                        |
| `retraite.autres-caisses-liberales`                                       | Sources CAVEC, CAVAMAC, CNBF, CPRN/CRN et autres caisses non santé                                                                            | P1                        |

Rappels non négociables (détail en section B) :

- `/settings/memento` est le mémento utilisateur et la surface d'édition fiscal/social unique.
- Les tables settings existantes restent propriétaires des valeurs ; les moteurs restent propriétaires des calculs.
- La vue métier du mémento est séparée de l'audit coverage technique ; les priorités et intentions orientent la lecture CGP sans remplacer les statuts.
- Les supports professionnels externes non versionnés peuvent seulement servir d'aide temporaire de cadrage ; ils ne sont jamais cités, référencés, copiés, versionnés, affichés ni utilisés comme sources SER1.
- La taxonomie mémento ne porte aucun taux, barème, seuil, assiette ni formule.
- `/settings/base-contrat-retraite` reste séparée car elle porte la base documentaire contrats retraite.

## A. Diagnostic de la roadmap précédente

La version précédente en 35 PR corrigeait correctement la première version trop découpée : elle
posait `/settings/memento`, séparait temporairement les propriétaires d'écriture et traitait les
supports de cadrage non versionnés comme des aides temporaires. La clôture M10 a remplacé ce modèle
transitoire par une page mémento/édition unique pour le fiscal/social.

Le manque principal est plus structurant : le mémento ne doit pas refléter des supports externes non versionnés. Il doit devenir la grille de couverture des simulateurs et sous-types prévus par `docs/ROADMAP.md` et par `src/domain/simulators`. Cela inclut les entrées `planned`, `placeholder`, `internalOnly`, les sous-types non autonomes et les éléments ROADMAP-only comme OBO, prévoyance dirigeant, fiscalité société interne ou succession/liquidité société.

Le bloc société/comptabilité était insuffisant : une PR générique "Société, IS et fiscalité dirigeant" ne couvre pas le périmètre F5 de `docs/ROADMAP.md`. La roadmap canonique demande explicitement organigramme, bilans/liasses comme sources dossier, projection comptable, réserves, résultat distribuable, CCA, capitaux propres, primes, emprunts, immobilisations, immobilier détenu, valorisation titres, holding, apport-cession, cession, OBO, Dutreil et transmission entreprise.

La nouvelle roadmap conserve la réduction des PR inutiles, mais ajoute deux blocs forts : une couverture simulateurs systématique dès le socle mémento, puis deux PR société/comptabilité dédiées avant les sujets de charges sociales et retraite. La cible passe de 35 à 38 PR, ce qui reste reviewable car l'ajout correspond à des risques métier réels, pas à un redécoupage décoratif.

Preuves repo utilisées :

- `docs/ROADMAP.md:32` impose une registry métier unique consommée par Home, rail, routes, modes, références, champs dossier et tests.
- `docs/ROADMAP.md:579` à `634` liste la matrice cible des simulateurs foyer et société.
- `docs/ROADMAP.md:1108` à `1152` fixe les pages settings cibles et les paramètres manquants.
- `docs/ROADMAP.md:1364` à `1457` cadre F5 : projection comptable, règles société, valorisation, bilans/liasses, tests et interdits.
- `docs/ARCHITECTURE.md:163` à `216` fixe la chaîne settings et la page propriétaire `/settings/memento`.
- `src/domain/simulators/definitions/*.ts` confirme les `SimulatorDefinition` actuelles.

## B. Décisions corrigées

- Les supports professionnels externes non versionnés éventuellement consultés pendant le cadrage servent uniquement d'aide temporaire d'inspiration ou de vérification de couverture. Ils ne sont jamais cités, référencés comme source, copiés, reproduits, versionnés, utilisés comme oracle de test, utilisés pour trancher une règle, affichés dans l'UI ou mentionnés comme source SER1.
- `/settings/memento` est la surface canonique mémento/édition pour le fiscal, le social, la société,
  la transmission, la Base-Contrat patrimoniale et la prévoyance.
- `/settings/memento` sépare la vue métier CGP de l'audit coverage technique.
- Les priorités métier (`critique`, `structurant`, `utile`, `complementaire`) qualifient l'importance d'une entrée sans remplacer son statut de couverture.
- Les intentions métier projettent les chapitres existants vers les parcours utilisateur ; elles ne créent pas une taxonomie concurrente.
- Les éditeurs intégrés dans le mémento écrivent dans les tables Supabase existantes et ne changent
  pas la chaîne fiscale.
- `/settings/memento` devient la page propriétaire des règles société, comptables, IS, valorisation, épargne salariale, apport-cession et PV mobilières.
- `/settings/memento` reste propriétaire des prélèvements sociaux, charges sociales dirigeant, cotisations retraite, PASS/PMSS et assimilé salarié.
- `/settings/memento` porte IR, IFI, revenus fonciers, LMNP/LMP, PV immobilières et fiscalité foyer.
- `/settings/memento` porte DMTG, succession, donation, Dutreil et assurance-vie décès.
- Les règles et overrides Base-Contrat patrimoniaux sont édités dans `/settings/memento`; `/settings/base-contrat-retraite` reste un référentiel contrats/règles/overrides séparé.
- `/settings/memento` porte prévoyance et régimes ; ses sources JSONB ne sont pas écrasées.
- Chaque simulateur ou sous-type prévu doit avoir une entrée mémento.
- Un simulateur `planned` ne devient jamais actif, routé ou cliquable parce qu'il apparaît dans le mémento.
- La taxonomie mémento ne contient pas de taux, barèmes, seuils, assiettes ou formules.
- Les statuts mémento attendus incluent `couvert`, `partiel`, `planned`, `absent`, `a_verifier` et `blocked_missing_official_source`.
- Les sources opposables et versionnées restent les sources officielles ou institutionnelles adaptées ; les calculs nécessitent toujours ces sources.

### Règle d'arbitrage documentaire

En cas de doute sur la couverture métier d'un thème patrimonial, fiscal, social, retraite, prévoyance, société ou transmission, un support professionnel externe non versionné peut seulement servir d'aide temporaire de cadrage hors repo.

Ces supports ne tranchent jamais :

- une valeur ;
- un taux ;
- un seuil ;
- une formule ;
- une condition d'éligibilité ;
- une règle de calcul ;
- une doctrine juridique opposable ;
- un résultat de test.

Pour toute règle consommée par SER1, la source officielle prévaut : CGI, BOFiP, Code civil, Code de commerce, Code de la sécurité sociale, BOSS, URSSAF, Service-public, Assurance retraite, AGIRC-ARRCO, CNAVPL, MSA, caisses professionnelles, Legifrance ou source institutionnelle adaptée.

Si une thématique est identifiée sans source officielle qualifiée, l'entrée mémento doit rester en `a_verifier` ou `blocked_missing_official_source`.

Si un support de cadrage externe contredit une source officielle, la source officielle prévaut.

## C. Nouvelle structure par parties

### Partie 1 — Socle mémento, gouvernance et couverture simulateurs

Objectif : créer le contrat du mémento, la route `/settings/memento`, l'audit coverage et la gouvernance durable.

Contenu métier : chapitres, sous-chapitres, statuts, liens settings, liens simulateurs, distinction doctrine/settings/calcul/sources.

Contenu technique : domaine `settings-memento`, route settings, UI mémento, adapter coverage, checks, documentation.

Nombre cible : 4 PR.

Relève d'une PR : taxonomie, route, coverage adapter, non-régression.

Relève d'un commit : modèle domaine, tables de correspondance, tests, docs.

Critères de sortie : route chargée, `planned` non cliquables, aucune valeur fiscale/sociale/comptable dans la taxonomie.

### Partie 2 — Couverture patrimoniale, fiscale, société et comptabilité

Objectif : couvrir les thèmes patrimoniaux et les fondations société exigées par `docs/ROADMAP.md`.

Contenu métier : foyer, civil, fiscalité foyer, transmission, placements, immobilier, société, comptabilité, valorisation, cession, international.

Contenu technique : enrichissement taxonomie, registry settings, références, ownership settings, tests coverage.

Nombre cible : 10 PR.

Relève d'une PR : tout domaine ayant sources, propriétaire ou risque distinct.

Relève d'un commit : sous-chapitres proches, sources, tests, docs de statut.

Critères de sortie : chaque simulateur foyer/société de la matrice cible pointe vers un chapitre et une page propriétaire ou un statut bloquant.

### Partie 3 — Charges sociales et dirigeant

Objectif : couvrir les charges sociales, les régimes et le dirigeant sans transformer un support de cadrage ou un artefact d'import en source officielle.

Contenu métier : salarié standard, SSI, CARMF, caisses libérales, CIPAV, MSA, assimilé salarié, rémunération dirigeant, TNS.

Contenu technique : modèle social, pipeline d'import ou OCR futur, statuts de validation, tests candidats/goldens.

Nombre cible : 12 PR.

Relève d'une PR : modèle commun, pipeline, groupes de régimes, consolidation.

Relève d'un commit : chaque onglet/régime à l'intérieur d'un groupe reviewable.

Critères de sortie : les 18 onglets sont tracés ; aucun `golden_case` sans source officielle.

### Partie 4 — Retraite obligatoire, caisses et prévoyance

Objectif : structurer les droits obligatoires avant PER et fiscalité de sortie.

Contenu métier : régime général, AGIRC-ARRCO, assimilé salarié, SSI, CNAVPL, caisses, dispositifs transverses, prévoyance obligatoire.

Contenu technique : domaine retraite, liens charges sociales, Base CG retraite, références, tests prudents.

Nombre cible : 8 PR.

Relève d'une PR : chaque famille de régime ou bloc transversal.

Relève d'un commit : caisses d'une même famille si sources/test reviewables.

Critères de sortie : retraite globale et retraite dirigeant ont une couverture honnête, sans dépendre de goldens sociaux complets pour exister comme couverture.

### Partie 5 — Épargne retraite, fiscalité de sortie, lexique et audit final

Objectif : raccorder PER, article 83, Madelin, épargne salariale, fiscalité de liquidation, lexique et audit final.

Contenu métier : épargne retraite, fiscalité des pensions/sorties, lexique SER1, coverage global.

Contenu technique : liens moteurs/settings, checks simulateurs, audit final, bascule optionnelle `/settings`.

Nombre cible : 4 PR.

Relève d'une PR : PER/épargne retraite, fiscalité sortie, lexique, audit final.

Relève d'un commit : sous-types PER, article 83, Madelin, définitions lexique.

Critères de sortie : aucun simulateur prévu n'est absent silencieusement du mémento.

## D. Roadmap PR par PR corrigée

### PR 1 — Taxonomie mémento, statuts et gouvernance

Objectif : créer le contrat du mémento, ses statuts et sa gouvernance permanente.

Pourquoi c'est une PR : toute la roadmap dépend de ce modèle ; il doit être relu seul.

Commits recommandés :

- modèle domaine `settings-memento`;
- statuts `couvert`, `partiel`, `planned`, `absent`, `a_verifier`, `blocked_missing_official_source`;
- règles support de cadrage vs source officielle;
- documentation gouvernance;
- tests anti-valeurs dans la taxonomie.

Périmètre inclus : chapitres, sous-chapitres, statuts, doctrine/settings/calcul/sources.

Périmètre exclu : route, UI, calculs, DB, import Excel.

Fichiers probables : `src/domain/settings-memento/*`, `docs/ARCHITECTURE.md`, `docs/RUNBOOK.md`, tests domaine.

Données / settings concernés : `settings-registry`, `settings-references`, `legal-references` en lecture.

Références à rattacher : sources officielles non obligatoires à ce stade ; supports professionnels externes non versionnés seulement comme aide temporaire de cadrage hors repo.

Tests / checks attendus : `check:settings-registry`, `check:legal-references`, `check:fiscal-hardcode`, `npm run check`.

Critères d'acceptation : aucune valeur fiscale/sociale/comptable dans la taxonomie ; statut bloquant disponible.

Risques : créer un faux moteur ou une nouvelle source de vérité calculatoire.

Garde-fous : tests interdisant taux, seuils, barèmes et formules dans le domaine mémento.

Dépendances : aucune.

Rollback : supprimer le domaine et la documentation ajoutée.

### PR 2 — Correspondance simulateurs ROADMAP vers mémento

Objectif : ajouter le mapping `SimulatorDefinition` et ROADMAP-only vers chapitres mémento.

Pourquoi c'est une PR : c'est la correction majeure demandée ; elle doit être validée avant l'UI.

Commits recommandés :

- import/lecture des IDs registry sans recopier les routes;
- table des simulateurs `active`, `hub`, `placeholder`, `planned`, `internalOnly`;
- table des sous-types et entrées ROADMAP-only;
- tests d'exhaustivité;
- docs d'usage.

Périmètre inclus : tous les simulateurs et sous-types de la section E.

Périmètre exclu : activation de simulateur, nouvelle route `/sim/*`.

Fichiers probables : `src/domain/settings-memento/simulatorCoverage.ts`, tests, docs.

Données / settings concernés : `src/domain/simulators`, `src/routes/simRouteContracts.ts` en lecture.

Références à rattacher : sources par domaine simulées dans PR ultérieures ; ici source interne = registry + `docs/ROADMAP.md`.

Tests / checks attendus : `check:settings-registry`, tests coverage, `check:e2e-auth-pages-coverage` si route settings déjà ajoutée.

Critères d'acceptation : aucun simulateur de `docs/ROADMAP.md` ou de la registry n'est absent silencieusement.

Risques : recréer une registry parallèle.

Garde-fous : mapping dérivé de la registry quand l'entrée existe ; exceptions ROADMAP-only listées explicitement.

Dépendances : PR 1.

Rollback : retirer le mapping coverage.

### PR 3 — Route `/settings/memento` et UI V1

Objectif : créer la page mémento sans remplacer l'onglet général `/settings`.

Pourquoi c'est une PR : le routing settings et le smoke auth sont sensibles.

Commits recommandés :

- ajout `SETTINGS_ROUTES`;
- page `MementoSettings`;
- recherche/filtres/statuts;
- liens vers les sections propriétaires;
- tests route et rendu.

Périmètre inclus : route dédiée, navigation, lecture coverage.

Périmètre exclu : activation de simulateurs planned.

Fichiers probables : `src/routes/settingsRoutes.ts`, `src/pages/SettingsShell.tsx`, `src/pages/settings/MementoSettings.tsx`, styles settings.

Données / settings concernés : `SETTINGS_ROUTES`.

Références à rattacher : affichage des références existantes seulement.

Tests / checks attendus : `check:e2e-auth-pages-coverage`, `test:e2e:auth-pages`, `check:routes-doc-sync`, `npm run check`.

Critères d'acceptation : `/settings/memento` charge ; la navigation settings reste pilotée par `SETTINGS_ROUTES`.

Risques : régression navigation settings.

Garde-fous : route ajoutée par la source unique `SETTINGS_ROUTES`.

Dépendances : PR 1, PR 2.

Rollback : retirer la route et la page mémento.

### PR 4 — Coverage adapter, audit mémento et non-régression settings

Objectif : vérifier automatiquement statuts, références, propriétaires et non-régression routes.

Pourquoi c'est une PR : elle devient le garde-fou de toutes les futures PR.

Commits recommandés :

- adapter coverage;
- script `check:memento-coverage`;
- tests statuts/sources/pages propriétaires;
- tests route société au pluriel;
- documentation runbook.

Périmètre inclus : audit coverage, routes settings déclarées, statut des planned.

Périmètre exclu : contenu métier massif.

Fichiers probables : `scripts/settings-memento/*`, tests routes/settings, docs.

Données / settings concernés : `chain.json`, `references.json`, `settings-registry`, `SETTINGS_ROUTES`.

Références à rattacher : sources officielles requises par claim, pas de nouvelle valeur.

Tests / checks attendus : `check:settings-references`, `check:settings-registry`, `check:legal-references`, `check:e2e-auth-pages-coverage`, `test:e2e:auth-pages`, `npm run check`.

Critères d'acceptation : une entrée sensible sans source officielle ne peut pas être `couvert`.

Risques : check trop permissif ou trop cassant.

Garde-fous : statuts bloquants visibles et tests fixtures.

Dépendances : PR 1 à PR 3.

Rollback : retirer le check et conserver la page mémento non auditée.

### PR 5 — Socle foyer : filiation, régime matrimonial, donations, budget, actif/passif

Objectif : couvrir les fondations foyer prévues par la roadmap.

Pourquoi c'est une PR : ce lot correspond au socle dossier, non à un moteur isolé.

Commits recommandés :

- filiation et branches familiales;
- régime matrimonial et protection conjoint;
- donations antérieures;
- budget/capacité d'épargne;
- actif/passif `internalOnly`.

Périmètre inclus : chapitres mémento et statuts des simulateurs `planned`/`internalOnly`.

Périmètre exclu : activation des simulateurs, moteur actif/passif complet.

Fichiers probables : taxonomie mémento, références, tests coverage.

Données / settings concernés : dossier patrimonial, transmission en lecture.

Références à rattacher : Code civil, CGI/BOFiP pour donations, Service-public.

Tests / checks attendus : `check:legal-references`, `check:settings-references`, tests coverage simulateurs.

Critères d'acceptation : chaque socle foyer a une page propriétaire ou un statut `planned/a_verifier`.

Risques : faire croire qu'un simulateur dossier est actif.

Garde-fous : statuts planned visibles et non cliquables.

Dépendances : PR 4.

Rollback : retirer les entrées socle foyer.

### PR 6 — Fiscalité foyer : IR, IFI, niches, revenus fonciers, LMNP/LMP, PV immobilières

Objectif : couvrir les règles fiscales foyer et les futurs moteurs fiscaux immobiliers.

Pourquoi c'est une PR : même page propriétaire `/settings/memento`, mêmes garde-fous fiscaux.

Commits recommandés :

- IR/quotient/décote/plafonnement/niches;
- IFI;
- revenus fonciers;
- LMNP/LMP;
- PV immobilières;
- tests anti-hardcode.

Périmètre inclus : `ir`, `ifi`, `revenus-fonciers`, `lmnp-lmp`, `plus-values-immobilieres`.

Périmètre exclu : moteurs immobiliers, nouvelles valeurs codées.

Fichiers probables : mémento, `settings-references`, registry settings.

Données / settings concernés : `/settings/memento`, `tax_settings`, `fiscality_settings`, `useFiscalContext`.

Références à rattacher : CGI, BOFiP, Legifrance, Service-public.

Tests / checks attendus : `check:fiscal-hardcode`, `check:raw-fiscal-usage`, `check:settings-references`, tests IR.

Critères d'acceptation : les thèmes non prêts restent `planned` ou `blocked_missing_official_source`.

Risques : valeurs fiscales dupliquées dans le mémento.

Garde-fous : lecture via chaîne fiscale seulement.

Dépendances : PR 4.

Rollback : retirer les mappings fiscaux mémento.

### PR 7 — Transmission, DMTG, donation, démembrement et Dutreil

Objectif : couvrir transmission privée et société sans casser DMTG.

Pourquoi c'est une PR : DMTG est sensible et propriétaire de plusieurs écritures.

Commits recommandés :

- DMTG succession/donation;
- démembrement;
- donation/donation-partage;
- Dutreil;
- tests DMTG non-régression.

Périmètre inclus : `succession`, `donation-demembrement`, `pacte-dutreil`, variantes société en couverture.

Périmètre exclu : activation moteur donation, refonte DMTG.

Fichiers probables : mémento, `settings-references`, tests DMTG.

Données / settings concernés : `/settings/memento`, tables DMTG existantes.

Références à rattacher : Code civil, CGI, BOFiP, Legifrance.

Tests / checks attendus : `check:settings-references`, `check:fiscal-hardcode`, tests succession/DMTG.

Critères d'acceptation : le mémento ne déclenche aucune écriture DMTG.

Risques : brouiller donation privée et transmission entreprise.

Garde-fous : sous-chapitres séparés et propriétaire DMTG conservé.

Dépendances : PR 5, PR 6.

Rollback : retirer les chapitres transmission.

### PR 8 — Placements, Base-Contrat et sous-types enveloppes

Objectif : couvrir placement, allocation et sous-types non autonomes.

Pourquoi c'est une PR : Base-Contrat est un référentiel catalogue/règles/overrides.

Commits recommandés :

- placement/allocation;
- assurance-vie/capitalisation;
- PEA/CTO;
- SCPI comme sous-type placement;
- Base-Contrat.

Périmètre inclus : `placement`, assurance-vie, capitalisation, PEA, CTO, SCPI, comparaison d'enveloppes.

Périmètre exclu : moteur produit universel, nouvelle page settings.

Fichiers probables : mémento, domaine Base-Contrat, références.

Données / settings concernés : `/settings/memento`, `/settings/base-contrat-retraite`, `base_contrat_overrides`.

Références à rattacher : CGI, BOFiP, Code monétaire et financier, AMF si nécessaire.

Tests / checks attendus : tests Base-Contrat, `check:legal-references`, `check:settings-references`.

Critères d'acceptation : les sous-types ne deviennent pas des cartes autonomes simplifiées.

Risques : aplatir Base-Contrat en formulaire.

Garde-fous : liens vers catalogue/règles existants.

Dépendances : PR 4.

Rollback : retirer chapitres placements.

### PR 9 — Immobilier patrimonial : crédit, investissement, SCI, arbitrage

Objectif : couvrir la chaîne immobilière hors fiscalité déjà traitée.

Pourquoi c'est une PR : domaine homogène, mais dépend de plusieurs simulateurs planned.

Commits recommandés :

- crédit et garanties;
- investissement locatif;
- SCI et détention;
- SCPI côté immobilier si retenu;
- vendre/conserver/réemployer.

Périmètre inclus : `credit`, `investissement-locatif`, `sci`, `scpi`, `arbitrage-reemploi`.

Périmètre exclu : moteur immobilier complet.

Fichiers probables : mémento, références, tests coverage.

Données / settings concernés : `/settings/memento`, dossier patrimonial.

Références à rattacher : CGI, BOFiP, Code civil, Code de la consommation, Service-public.

Tests / checks attendus : `check:legal-references`, `check:settings-references`, tests coverage.

Critères d'acceptation : les moteurs planned ne sont pas affichés comme prêts.

Risques : surpromettre une valorisation ou une décision d'arbitrage.

Garde-fous : statuts `planned`/`a_verifier`.

Dépendances : PR 5, PR 6, PR 8.

Rollback : retirer chapitre immobilier.

### PR 10 — Société socle : organigramme, liens capitalistiques, bilans/liasses source

Objectif : couvrir le socle F5 société avant tout moteur dirigeant.

Pourquoi c'est une PR : c'est la fondation absente de la roadmap précédente.

Commits recommandés :

- organigramme société;
- associés et liens capitalistiques;
- formes de société;
- bilans/liasses comme sources dossier;
- tests coverage société.

Périmètre inclus : `organigramme-societe`, `fiscalite-societe` interne, sources dossier société.

Périmètre exclu : moteur holding, moteur valorisation, page bilan exhaustive.

Fichiers probables : mémento, settings registry, docs architecture si contrat évolue.

Données / settings concernés : `/settings/memento`, dossier société futur F5.

Références à rattacher : Code de commerce, Legifrance, doctrine comptable institutionnelle pertinente.

Tests / checks attendus : `check:settings-registry`, `check:legal-references`, coverage mémento.

Critères d'acceptation : organigramme n'est pas présenté comme source de vérité comptable.

Risques : dupliquer les données société dans chaque simulateur.

Garde-fous : dossier société central et adapters futurs.

Dépendances : PR 4.

Rollback : retirer socle société mémento.

### PR 11 — Règles comptables et distribution société

Objectif : couvrir résultat comptable/fiscal, réserves, résultat distribuable, dividendes et CCA.

Pourquoi c'est une PR : règles et sources comptables distinctes de l'organigramme.

Commits recommandés :

- résultat comptable/fiscal;
- réserves/report à nouveau;
- résultat distribuable/dividendes;
- CCA;
- capitaux propres/primes/emprunts/immobilisations.

Périmètre inclus : `projection-comptable`, `tresorerie-societe`, `sortie-capitaux`.

Périmètre exclu : comptabilité générale complète, liasse déclarative, valorisation opposable.

Fichiers probables : mémento, registry settings, `settings-references`.

Données / settings concernés : `/settings/memento`, `comptables-societes.is`, futurs packs F5.

Références à rattacher : Code de commerce, CGI, BOFiP, ANC ou doctrine institutionnelle pertinente.

Tests / checks attendus : `check:settings-registry`, `check:settings-references`, `check:fiscal-hardcode`.

Critères d'acceptation : les règles comptables absentes sont visibles comme `planned` ou `blocked_missing_official_source`.

Risques : inventer des règles de distribution.

Garde-fous : pas de projection depuis valeurs fictives.

Dépendances : PR 10.

Rollback : retirer les entrées règles comptables.

### PR 12 — Valorisation titres, holding, cession, apport-cession, OBO

Objectif : couvrir restructuration et transmission économique de titres société.

Pourquoi c'est une PR : ce bloc a des sources fiscales et juridiques propres.

Commits recommandés :

- valorisation titres;
- cession de titres et PV mobilières;
- holding et apport-cession;
- OBO planned;
- liens Dutreil/transmission entreprise.

Périmètre inclus : `valorisation-titres`, `cession-titres`, `holding`, `obo`, `pacte-dutreil`.

Périmètre exclu : moteur OBO, valorisation opposable, conseil automatique.

Fichiers probables : mémento, `settings-references`, registry settings.

Données / settings concernés : `/settings/memento`.

Références à rattacher : CGI, BOFiP, Code de commerce, Legifrance.

Tests / checks attendus : `check:settings-references`, `check:legal-references`, coverage simulateurs.

Critères d'acceptation : OBO et holding restent `planned/a_verifier` sans moteur.

Risques : promettre une structuration fiable sans méthode.

Garde-fous : statut bloquant si sources ou méthode manquent.

Dépendances : PR 10, PR 11.

Rollback : retirer bloc restructuration.

### PR 13 — International prudent

Objectif : couvrir prudemment les situations internationales dans les chapitres existants, sans créer de chapitre international autonome ni promettre de calcul.

Pourquoi c'est une PR : risque juridique large, sources à vérifier avant toute règle opérationnelle.

Commits recommandés :

- fiscalité foyer des non-résidents;
- transmission internationale;
- conventions fiscales;
- statuts prudents.

Périmètre inclus : entrées non-résidents rattachées à Fiscalité foyer et Transmission, avec statuts `a_verifier`.

Périmètre exclu : moteur international automatisé.

Fichiers probables : mémento.

Données / settings concernés : aucun setting dynamique initial.

Références à rattacher : aucune source affichée tant que les règles de territorialité, retenues et conventions ne sont pas qualifiées.

Tests / checks attendus : `check:legal-references`, coverage.

Critères d'acceptation : aucun calcul international promis, aucune valeur ni règle de territorialité affichée comme opérationnelle.

Risques : surinterprétation fiscale.

Garde-fous : `a_verifier` par défaut.

Dépendances : PR 4.

Rollback : retirer les entrées internationales des chapitres existants.

### PR 14 — Alignement société/settings/simulateurs

Objectif : fermer la Partie 2 en prouvant que société, fiscalité, settings et simulateurs ont des propriétaires cohérents.

Pourquoi c'est une PR : elle évite que F5 reste une dette muette.

Commits recommandés :

- audit des entrées société/comptable;
- tableau consommateurs;
- tests propriétaires;
- docs dettes restantes;
- coverage société final.

Périmètre inclus : société, comptabilité, simulateurs société, pages propriétaires.

Périmètre exclu : nouveaux moteurs.

Fichiers probables : scripts coverage, tests, docs.

Données / settings concernés : `/settings/memento`, registry.

Références à rattacher : sources officielles par claim si claim prêt.

Tests / checks attendus : `check:settings-registry`, `check:settings-references`, `npm run check`.

Critères d'acceptation : aucun sujet société du tableau F n'est absent sans statut.

Risques : check incomplet.

Garde-fous : table F maintenue par tests.

Dépendances : PR 10 à PR 12.

Rollback : retirer audit spécifique société.

### PR 15 — Socle charges sociales

Objectif : créer le modèle commun des cotisations.

Pourquoi c'est une PR : tous les régimes Excel en dépendent.

Commits recommandés : modèle régime/caisse/profession, familles cotisations, assiettes/tranches/plafonds, statuts validation, tests.

Périmètre inclus : salarié, employeur, TNS, assimilé salarié, cas base 100 000 EUR.

Périmètre exclu : parsing Excel, DB, goldens.

Fichiers probables : `src/domain/social-contributions/*`, registry, tests.

Données / settings concernés : `/settings/memento`, `social-dirigeant`.

Références à rattacher : CSS, BOSS, URSSAF, caisses, Code du travail.

Tests / checks attendus : tests domaine, `check:fiscal-hardcode`, `check:raw-fiscal-usage`, `check:settings-registry`.

Critères d'acceptation : `blocked_missing_official_source` testé.

Risques : modèle trop rigide.

Garde-fous : extensibilité par régime et ligne.

Dépendances : PR 1, PR 4.

Rollback : retirer domaine social.

### PR 16 — Pipeline Excel/OCR et inventaire des 18 onglets

Objectif : extraire les candidats depuis l'Excel sans officialiser.

Pourquoi c'est une PR : elle installe la preuve onglet -> ligne -> source -> test.

Commits recommandés : extraction noms onglets, parse candidat, statuts OCR, fixtures minimales, tests pipeline.

Périmètre inclus : inventaire des 18 onglets exacts et cas candidats.

Périmètre exclu : intégration officielle et goldens.

Fichiers probables : `scripts/social-contributions/*`, tests.

Données / settings concernés : cas base 100 000 EUR candidats.

Références à rattacher : Excel uniquement comme vérification interne.

Tests / checks attendus : tests parseur, `check:large-files-baseline`, `npm run check`.

Critères d'acceptation : noms d'onglets conservés, aucune promotion golden.

Risques : OCR confondu avec source officielle.

Garde-fous : statut `draft_from_excel` par défaut.

Dépendances : PR 15.

Rollback : retirer pipeline.

### PR 17 — Charges sociales salarié standard

Objectif : traiter `Salarié 100 000 € brut`.

Pourquoi c'est une PR : salarié standard doit rester séparé de l'assimilé salarié dirigeant.

Commits recommandés : mapping lignes, sources URSSAF/BOSS/CSS, tests candidat, statuts incertains.

Périmètre inclus : cotisations salarié/employeur, tranches, plafonds, résultat candidat.

Périmètre exclu : mandataires sociaux, retraite AGIRC-ARRCO détaillée.

Fichiers probables : domaine social, références, tests.

Données / settings concernés : `/settings/memento`, PASS/PMSS si consommé.

Références à rattacher : URSSAF, BOSS, CSS, Code du travail.

Tests / checks attendus : tests candidats, `check:fiscal-hardcode`, `check:settings-references`.

Critères d'acceptation : chaque ligne est sourcée ou bloquée.

Risques : confusion brut/assiette.

Garde-fous : pas de golden sans source.

Dépendances : PR 15, PR 16.

Rollback : retirer régime salarié.

### PR 18 — Charges sociales SSI commerçant/artisan

Objectif : traiter ensemble commerçant et artisan avec traçabilité séparée.

Pourquoi c'est une PR : même famille SSI, mêmes sources principales, reviewable.

Commits recommandés : commerçant, artisan, sources SSI/URSSAF, tests candidats, comparaison écarts.

Périmètre inclus : `TNS Commerçant Base 100 000 €`, `TNS Artisan Base 100 000 €`.

Périmètre exclu : libéraux, MSA.

Fichiers probables : domaine social TNS, références, tests.

Données / settings concernés : `/settings/memento`.

Références à rattacher : URSSAF, CSS, SSI, Service-public.

Tests / checks attendus : tests candidats par onglet, `check:fiscal-hardcode`.

Critères d'acceptation : une fiche/test par onglet.

Risques : mutualisation excessive.

Garde-fous : traçabilité onglet distincte.

Dépendances : PR 15, PR 16.

Rollback : retirer un régime par commit.

### PR 19 — Charges sociales CARMF médecins

Objectif : traiter les trois variantes CARMF.

Pourquoi c'est une PR : même caisse, variantes testables séparément.

Commits recommandés : non conventionné, secteur 1, secteur 2, sources CARMF, tests variantes.

Périmètre inclus : `TNS CARMF non conventionné Base`, `TNS CARMF secteur 1 Base 100 00`, `TNS CARMF secteur 2 Base 100 00`.

Périmètre exclu : autres professions santé.

Fichiers probables : domaine social santé, références, tests.

Données / settings concernés : CARMF.

Références à rattacher : CARMF, CNAVPL, CSS, URSSAF.

Tests / checks attendus : tests candidats par variante.

Critères d'acceptation : différences de conventionnement explicites.

Risques : erreur d'assiette/conventionnement.

Garde-fous : statut bloquant si source absente.

Dépendances : PR 15, PR 16.

Rollback : retirer une variante.

### PR 20 — Charges sociales santé libérale A

Objectif : traiter CARCD/CARSF/CARPIMKO.

Pourquoi c'est une PR : familles santé proches mais alias à clarifier.

Commits recommandés : CARCD/CARCDSF, CARSF, CARPIMKO, sources caisses, tests.

Périmètre inclus : `TNS CARCD Base 100 000 €`, `TNS CARSF Base 100 000 €`, `TNS CARPIMKO Base 100 000 €`.

Périmètre exclu : CARMF, CAVP, CARPV.

Fichiers probables : domaine social santé, références, tests.

Données / settings concernés : caisses santé.

Références à rattacher : caisses officielles, CNAVPL, CSS, URSSAF.

Tests / checks attendus : tests par onglet, audit alias.

Critères d'acceptation : CARCD/CARCDSF et CARSF sont sourcés ou bloqués.

Risques : nomenclature ambiguë.

Garde-fous : alias officiel obligatoire.

Dépendances : PR 15, PR 16.

Rollback : retirer caisse par caisse.

### PR 21 — Charges sociales santé libérale B

Objectif : traiter CAVP, CAVP biologiste et CARPV.

Pourquoi c'est une PR : lot santé cohérent, CAVP nécessite variantes séparées.

Commits recommandés : CAVP, CAVP biologiste, CARPV, sources, tests.

Périmètre inclus : `TNS CAVP Base 100 000 €`, `TNS CAVP biologiste Base 100 00`, `TNS CARPV Base 100 000 €`.

Périmètre exclu : CARMF/CARPIMKO.

Fichiers probables : domaine social santé, références, tests.

Données / settings concernés : CAVP, CARPV.

Références à rattacher : CAVP, CARPV, CNAVPL, CSS.

Tests / checks attendus : tests par onglet.

Critères d'acceptation : variante biologiste distincte.

Risques : confusion entre CAVP standard et biologiste.

Garde-fous : tests séparés.

Dépendances : PR 15, PR 16.

Rollback : retirer variante par commit.

### PR 22 — Charges sociales droit, conseil, assurance

Objectif : traiter CAVAMAC, CAVEC, CNBF et CRN/CPRN.

Pourquoi c'est une PR : lot non santé, reviewable par commits caisse.

Commits recommandés : CAVAMAC, CAVEC, CNBF, CRN/CPRN, tests candidats.

Périmètre inclus : `TNS CAVAMAC Base 100 000 €`, `TNS CAVEC Base 100 000 €`, `TNS CNBF Base 100 000 €`, `TNS CRN Base 100 000 €`.

Périmètre exclu : CIPAV, MSA.

Fichiers probables : domaine social libéral, références, tests.

Données / settings concernés : caisses professionnelles.

Références à rattacher : textes caisses, CSS, CNAVPL si applicable.

Tests / checks attendus : tests candidats par onglet.

Critères d'acceptation : CRN/CPRN clarifié ou bloqué.

Risques : règles caisse très spécifiques.

Garde-fous : statuts par caisse.

Dépendances : PR 15, PR 16.

Rollback : retirer caisse par caisse.

### PR 23 — Charges sociales CIPAV

Objectif : traiter CIPAV séparément.

Pourquoi c'est une PR : périmètre professions évolutif.

Commits recommandés : mapping onglet, sources CIPAV/CNAVPL, test candidat, note volatilité.

Périmètre inclus : `TNS CIPAV Base 100 000 €`.

Périmètre exclu : autres libéraux.

Fichiers probables : domaine social CIPAV, références, tests.

Données / settings concernés : CIPAV.

Références à rattacher : CIPAV, CNAVPL, CSS, URSSAF.

Tests / checks attendus : test candidat, `check:legal-references`.

Critères d'acceptation : périmètre professions sourcé.

Risques : changement de périmètre.

Garde-fous : `verifiedAt`, volatilité.

Dépendances : PR 15, PR 16.

Rollback : retirer CIPAV.

### PR 24 — Charges sociales MSA

Objectif : traiter MSA séparément.

Pourquoi c'est une PR : règles agricoles spécifiques.

Commits recommandés : mapping onglet, sources MSA, tests, note périmètre.

Périmètre inclus : `TNS MSA Base 100 000 €`.

Périmètre exclu : salariés agricoles si non présents.

Fichiers probables : domaine social MSA, références, tests.

Données / settings concernés : MSA TNS.

Références à rattacher : MSA, CSS, Code rural si nécessaire.

Tests / checks attendus : test candidat, `check:legal-references`.

Critères d'acceptation : périmètre TNS agricole explicite.

Risques : règles agricoles complexes.

Garde-fous : source MSA prioritaire.

Dépendances : PR 15, PR 16.

Rollback : retirer MSA.

### PR 25 — Assimilé salarié, rémunération dirigeant et charges sociales dirigeant

Objectif : séparer mandataire social du salarié standard et raccorder le dirigeant.

Pourquoi c'est une PR : sujet dirigeant, consommé par rémunération, retraite, société.

Commits recommandés : modèle assimilé salarié, rémunération TNS, dividendes TNS, sources URSSAF/BOSS, tests.

Périmètre inclus : `remuneration`, charges sociales dirigeant, TNS, assimilé salarié, dividendes TNS.

Périmètre exclu : bulletin de paie complet, DSN, exhaustivité caisse par caisse.

Fichiers probables : domaine social, registry `social-dirigeant`, tests.

Données / settings concernés : `/settings/memento`, `ps_settings.socialDirigeant`.

Références à rattacher : URSSAF, BOSS, CSS, Code de commerce selon statut.

Tests / checks attendus : `check:settings-registry`, `check:fiscal-hardcode`, tests trésorerie société.

Critères d'acceptation : salarié standard et assimilé salarié distincts.

Risques : mélange fiscal/social/dirigeant.

Garde-fous : entries séparées et statuts par règle.

Dépendances : PR 10, PR 17.

Rollback : retirer couche dirigeant.

### PR 26 — Consolidation charges sociales et promotion goldens

Objectif : consolider les régimes et promouvoir seulement les cas vérifiés.

Pourquoi c'est une PR : fermeture qualité de la Partie 3.

Commits recommandés : matrice couverture, dédoublonnage, promotion golden, tests golden, dettes restantes.

Périmètre inclus : tous les régimes Excel.

Périmètre exclu : nouveaux régimes hors Excel.

Fichiers probables : tests golden, audit social, docs.

Données / settings concernés : tous régimes sociaux.

Références à rattacher : sources officielles par régime ; Excel en vérification interne.

Tests / checks attendus : golden tests, tests candidats, `check:fiscal-hardcode`, `check:settings-references`, `npm run check`.

Critères d'acceptation : aucun golden sans source officielle.

Risques : figer une erreur OCR.

Garde-fous : promotion stricte et rollback par statut.

Dépendances : PR 17 à PR 25.

Rollback : rétrograder les goldens en candidats.

### PR 27 — Socle retraite obligatoire

Objectif : créer la taxonomie retraite obligatoire.

Pourquoi c'est une PR : elle structure retraite globale, dirigeant et caisses.

Commits recommandés : modèle retraite, régimes base/complémentaire, statuts, sources officielles, tests.

Périmètre inclus : âge, durée, trimestres, taux plein, décote/surcote, réversion, points.

Périmètre exclu : PER, Madelin, fiscalité de sortie.

Fichiers probables : `src/domain/retirement/*`, registry, références.

Données / settings concernés : `retraite-prevoyance.*`, PASS/PMSS.

Références à rattacher : Assurance retraite, CSS, AGIRC-ARRCO, CNAVPL, caisses.

Tests / checks attendus : tests domaine, `check:settings-registry`, `check:fiscal-hardcode`.

Critères d'acceptation : PDF retraite utilisé seulement comme plan de couverture.

Risques : hardcode seuils retraite.

Garde-fous : source officielle par règle.

Dépendances : PR 4.

Rollback : retirer domaine retraite.

### PR 28 — Retraite salarié régime général

Objectif : couvrir les droits obligatoires du régime général salarié.

Pourquoi c'est une PR : source et règles spécifiques, socle des calculs salariés.

Commits recommandés : régime général, âge/durée/trimestres, minimum contributif, tests, coverage.

Périmètre inclus : CNAV/régime général.

Périmètre exclu : AGIRC-ARRCO.

Fichiers probables : domaine retraite salarié, références.

Données / settings concernés : PASS/SMIC si centralisés.

Références à rattacher : Assurance retraite, CSS, Service-public, Legifrance.

Tests / checks attendus : tests retraite, `check:fiscal-hardcode`, `check:settings-references`.

Critères d'acceptation : aucune valeur générationnelle hardcodée.

Risques : millésimes.

Garde-fous : `verifiedAt` et volatilité.

Dépendances : PR 27.

Rollback : retirer régime général.

### PR 29 — Retraite complémentaire AGIRC-ARRCO

Objectif : couvrir la complémentaire salarié.

Pourquoi c'est une PR : points/valeurs/règles propres.

Commits recommandés : modèle points, sources AGIRC-ARRCO, tests, liens salarié.

Périmètre inclus : points, valeurs, tranches, droits complémentaires.

Périmètre exclu : simulation carrière complète.

Fichiers probables : domaine retraite complémentaire, références.

Données / settings concernés : valeurs point si centralisées.

Références à rattacher : AGIRC-ARRCO, CSS si applicable.

Tests / checks attendus : tests points, `check:settings-references`.

Critères d'acceptation : base et complémentaire distinguées.

Risques : valeur de point périmée.

Garde-fous : dates de vérification.

Dépendances : PR 28.

Rollback : retirer AGIRC-ARRCO.

### PR 30 — Retraite dirigeant et assimilé salarié

Objectif : relier mandataires, rémunération et droits retraite.

Pourquoi c'est une PR : sujet dirigeant distinct du salarié standard.

Commits recommandés : mandataires, liens social dirigeant, retraite TNS/assimilé, tests articulation.

Périmètre inclus : retraite dirigeant, assimilé salarié, TNS en couverture.

Périmètre exclu : arbitrage rémunération/dividendes complet.

Fichiers probables : domaine retraite, social dirigeant, tests.

Données / settings concernés : `/settings/memento`, `social-dirigeant`, `retraite-prevoyance`.

Références à rattacher : URSSAF, CSS, Assurance retraite, AGIRC-ARRCO.

Tests / checks attendus : tests articulation, `check:settings-registry`.

Critères d'acceptation : séparation salarié/assimilé/TNS.

Risques : mélange statut social et fiscal.

Garde-fous : adapters distincts.

Dépendances : PR 25, PR 28, PR 29.

Rollback : retirer adapter dirigeant retraite.

### PR 31 — Retraite SSI commerçant/artisan

Objectif : couvrir retraite obligatoire SSI.

Pourquoi c'est une PR : même famille que charges sociales SSI, mais domaine retraite distinct.

Commits recommandés : droits commerçant, droits artisan, sources SSI, tests, liens cotisations.

Périmètre inclus : base et complémentaire SSI.

Périmètre exclu : professions libérales.

Fichiers probables : domaine retraite TNS, références.

Données / settings concernés : régimes SSI, `retraite-prevoyance`.

Références à rattacher : SSI, URSSAF, Assurance retraite, CSS.

Tests / checks attendus : tests retraite TNS, coverage.

Critères d'acceptation : lien cotisation -> droit explicite mais prudent.

Risques : droits calculés depuis cotisations non golden.

Garde-fous : `a_verifier` si cotisation non validée.

Dépendances : PR 18, PR 27.

Rollback : retirer retraite SSI.

### PR 32 — CNAVPL et caisses santé retraite

Objectif : couvrir CNAVPL et caisses santé.

Pourquoi c'est une PR : famille cohérente ; split secondaire possible.

Commits recommandés : CNAVPL socle, CARMF, CARCDSF/CARPIMKO, CAVP/CARPV, tests.

Périmètre inclus : caisses santé libérales retraite.

Périmètre exclu : CAVEC/CAVAMAC/CNBF/CRN/MSA.

Fichiers probables : domaine retraite libéral santé, références.

Données / settings concernés : régimes sociaux santé.

Références à rattacher : CNAVPL, caisses officielles, CSS.

Tests / checks attendus : tests par caisse, `check:legal-references`.

Critères d'acceptation : chaque caisse a source ou statut bloquant.

Risques : PR trop volumineuse.

Garde-fous : split caisse par caisse si nécessaire.

Dépendances : PR 19 à PR 21, PR 27.

Rollback : retirer caisse par commit.

### PR 33 — Retraite autres caisses : droit, conseil, assurance, CIPAV, MSA

Objectif : couvrir les autres caisses retraite.

Pourquoi c'est une PR : famille non santé reviewable avec commits par caisse.

Commits recommandés : CAVEC/CAVAMAC, CNBF, CRN/CPRN, CIPAV, MSA, tests.

Périmètre inclus : CAVAMAC, CAVEC, CNBF, CRN/CPRN, CIPAV, MSA.

Périmètre exclu : caisses santé.

Fichiers probables : domaine retraite caisses, références.

Données / settings concernés : régimes PR 22 à PR 24.

Références à rattacher : caisses, CNAVPL, MSA, CSS.

Tests / checks attendus : tests par caisse, coverage.

Critères d'acceptation : MSA et CIPAV identifiables et sourcés.

Risques : lot hétérogène.

Garde-fous : split secondaire si nécessaire.

Dépendances : PR 22 à PR 24, PR 27.

Rollback : retirer caisse par commit.

### PR 34 — Dispositifs transverses retraite, Base CG retraite et prévoyance obligatoire

Statut : livrée par le lot R7, avec grille mémento, références transverses retraite, Base CG retraite documentaire et audit DB prévoyance.

Objectif : couvrir carrière longue, retraite progressive, cumul, réversion, décote/surcote et prévoyance.

Pourquoi c'est une PR : bloc transversal à plusieurs régimes et aux sources JSONB prévoyance.

Commits recommandés : dispositifs départ, réversion, prévoyance obligatoire, Base CG retraite, tests RLS/audit.

Périmètre inclus : `prevoyance`, `prevoyance-dirigeant`, Base CG retraite, dispositifs transverses.

Périmètre exclu : écrasement JSONB, calcul multi-carrières complet.

Fichiers probables : domaine retraite, prévoyance, références, tests.

Données / settings concernés : `/settings/memento`, `/settings/base-contrat-retraite`.

Références à rattacher : Assurance retraite, CSS, Code du travail, caisses, Service-public.

Tests / checks attendus : `check:settings-rls`, `check:supabase-rls` si DB, `audit:settings-references -- --with-db`, tests retraite.

Critères d'acceptation : sources JSONB prévoyance préservées.

Risques : régression prévoyance/RLS.

Garde-fous : mémento en lecture.

Dépendances : PR 27 à PR 33.

Rollback : retirer liens transverses.

### PR 35 — PER, article 83, Madelin et épargne salariale

Statut : **Livrée par le lot R8**. Le périmètre livré est mémento et chaînage documentaire :
entrées PER individuel, potentiel PER, transfert PER, article 83/PERO, Madelin et PERCOL/PERCO.
Aucun moteur épargne salariale nouveau n'est activé.

Objectif : raccorder épargne retraite après les droits obligatoires.

Pourquoi c'est une PR : même macro-sujet, mais dépend de la retraite obligatoire.

Commits recommandés : PER, article 83, Madelin, compléments épargne salariale, tests liens IR/retraite.

Périmètre inclus : `per`, `per-potentiel`, `per-transfert`, article 83, Madelin, compléments moteur/settings `epargne-salariale` après la couverture mémento partielle R4.

Périmètre exclu : fiscalité de sortie détaillée, activation moteur épargne salariale.

Fichiers probables : domaines PER/Base-Contrat retraite, registry, références.

Données / settings concernés : `/settings/base-contrat-retraite`, `/settings/memento`, PASS.

Références à rattacher : CGI, BOFiP, Code du travail, BOSS, URSSAF, Service-public.

Tests / checks attendus : tests PER existants, `check:fiscal-hardcode`, `check:settings-registry`.

Critères d'acceptation : PER vient avant fiscalité de sortie.

Risques : masquer retraite obligatoire.

Garde-fous : liens seulement après PR retraite.

Dépendances : PR 27 à PR 34.

Rollback : retirer chapitres épargne retraite.

### PR 36 — Fiscalité pensions, sorties et prélèvements sociaux retraite

Statut : **Livrée par le lot R8**. La fiscalité de sortie retraite est rattachée aux claims IR,
prélèvements sociaux et Base-Contrat existants, sans recalcul IR dans le mémento.

Objectif : couvrir fiscalité des pensions et sorties après PER.

Pourquoi c'est une PR : dépendance corrigée ; fiscalité sortie dépend de PER.

Commits recommandés : pensions imposables, sorties PER, PS retraite, tests IR/PER, coverage.

Périmètre inclus : pensions, rentes, capital, sorties PER, prélèvements sociaux retraite.

Périmètre exclu : refonte moteur IR.

Fichiers probables : domaines retraite/PER, `settings-references`, tests.

Données / settings concernés : `/settings/memento`, PER.

Références à rattacher : CGI, BOFiP, Assurance retraite, Service-public.

Tests / checks attendus : `check:fiscal-hardcode`, `check:raw-fiscal-usage`, tests IR/PER, `npm run check`.

Critères d'acceptation : aucune fiscalité de sortie sans source officielle.

Risques : double calcul IR.

Garde-fous : calculs dans moteurs, mémento doctrinal.

Dépendances : PR 35.

Rollback : retirer fiscalité sortie.

### PR 37 — Lexique SER1 sourcé

Statut : **Livrée par le lot R8**. Le lexique vit dans `src/domain/settings-memento/lexicon.ts` ;
chaque terme sensible est sourcé ou marqué `a_verifier`, sans copie de définition externe.

Objectif : créer le lexique interne du mémento.

Pourquoi c'est une PR : transverse, sensible juridiquement et fiscalement.

Commits recommandés : modèle lexique, termes pédagogiques, termes juridiques/fiscaux/sociaux, termes calculatoires, tests sources.

Périmètre inclus : trois niveaux de termes.

Périmètre exclu : copie de définitions externes.

Fichiers probables : `src/domain/settings-memento/lexicon*`, UI lexique, tests.

Données / settings concernés : liens moteurs/settings/références.

Références à rattacher : sources officielles selon terme.

Tests / checks attendus : `check:legal-references`, tests lexique.

Critères d'acceptation : chaque terme sensible est sourcé ou `a_verifier`.

Risques : contenu éditorial copié.

Garde-fous : reformulation SER1.

Dépendances : PR 1, PR 3.

Rollback : retirer lexique.

### PR 38 — Audit final, fraîcheur des références et bascule optionnelle `/settings`

Statut : **Livrée par le lot R8**. La fraîcheur hebdomadaire est matérialisée par le workflow
`Settings reference audit`, les tables Supabase `reference_audit_reports` et
`reference_audit_acknowledgements`, puis la bannière Home admin dismissible. La bascule `/settings`
reste non activée.

Objectif : valider la couverture complète, installer la fraîcheur périodique des références Settings et décider si `/settings/memento` devient l'entrée principale.

Pourquoi c'est une PR : fermeture du chantier, avec impact potentiel routing.

Commits recommandés : audit coverage final, tableau dettes, fraîcheur périodique des références, stockage Supabase du dernier rapport, bannière admin Home dismissible, E2E, docs finales, bascule `/settings` optionnelle.

Périmètre inclus : tous domaines, tous simulateurs, sous-types, settings propriétaires ; audit périodique `audit:settings-references -- --stale --with-db` avec fetch URL explicite ; tables Supabase `reference_audit_reports` et acquittements admin ; bannière Home visible seulement pour les admins quand le dernier rapport demande une action.

Périmètre exclu : nouveaux contenus métier.

Fichiers probables : scripts audit, workflow qualité, migrations Supabase, Home, hook lecture admin, tests E2E, docs structurantes.

Données / settings concernés : tous domaines mémento ; rapport JSONB du dernier audit de références ; acquittement par admin et par rapport.

Références à rattacher : toutes sources consolidées.

Tests / checks attendus : `npm run check`, `test:e2e:auth-pages`, `audit:settings-references -- --stale --with-db`, `check:supabase-rls`, `check:supabase-migrations`, checks fiscal/social/registry.

Critères d'acceptation : aucun simulateur prévu n'est absent silencieusement ; un rapport non OK apparaît sur la Home admin une seule fois par rapport tant qu'il n'est pas acquitté ; aucun message n'est affiché quand le rapport est OK ; l'audit n'est jamais exécuté dans le navigateur.

Risques : bascule `/settings` prématurée ; alerte admin trop bruyante ; écriture Supabase depuis GitHub Actions mal isolée.

Garde-fous : bascule seulement si coverage et E2E verts ; le job planifié produit le rapport, l'app le lit seulement ; écriture Supabase par service role, lecture RLS admin, acquittement admin tracé.

Dépendances : PR 1 à PR 37.

Rollback : annuler uniquement la redirection, la bannière ou l'audit trop strict ; conserver les tables si elles portent déjà des rapports historiques utiles.

## E. Tableau simulateurs → mémento

| Simulateur / sous-type                                        | Statut roadmap            | Chapitre mémento                             | Page settings propriétaire                             | Règles/settings nécessaires                              | Sources officielles attendues                      | PR cible        | Statut mémento attendu   |
| ------------------------------------------------------------- | ------------------------- | -------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------- | -------------------------------------------------- | --------------- | ------------------------ |
| Filiation familiale (`filiation` / ROADMAP `foyer-filiation`) | planned                   | Foyer / Socle dossier                        | Aucune page settings                                   | Modèle dossier famille                                   | Code civil si règle civile                         | PR 5            | planned                  |
| Régime matrimonial (`regime-matrimonial`)                     | planned                   | Civil / Régimes matrimoniaux                 | `/settings/memento` si règles DMTG liées               | Clauses, masses, protection conjoint                     | Code civil, Service-public                         | PR 5            | planned                  |
| Donations antérieures (`donations-anterieures`)               | planned                   | Transmission / Donations antérieures         | `/settings/memento`                                    | Rappel fiscal, abattements, historique                   | CGI, BOFiP, Code civil                             | PR 5, PR 7      | planned                  |
| Actif/passif interne (`actif-passif`)                         | internalOnly              | Patrimoine / Synthèse actif-passif           | Aucune page settings directe                           | Actifs, passifs, PP/US/NP                                | Code civil, CGI selon usage                        | PR 5            | internalOnly             |
| Budget & capacité d'épargne (`budget`)                        | planned                   | Foyer / Budget                               | Aucune page settings                                   | Revenus, charges, capacité                               | Non calcul fiscal ; sources dossier                | PR 5            | planned                  |
| Fiscalité IR (`ir`)                                           | active                    | Fiscalité foyer / IR                         | `/settings/memento`                                    | Barème IR, quotient, décote, PFU, CEHR/CDHR              | CGI, BOFiP                                         | PR 6            | couvert                  |
| IFI (`ifi`)                                                   | planned                   | Fiscalité foyer / IFI                        | `/settings/memento`                                    | Barème, seuil, dettes, biens imposables                  | CGI, BOFiP                                         | PR 6            | planned/partiel          |
| Retraite globale (`retraite`)                                 | planned                   | Retraite / Retraite globale                  | `/settings/memento`                                    | PS retraite, PASS, cotisations, droits                   | Assurance retraite, CSS, AGIRC-ARRCO, caisses      | PR 27-34        | planned                  |
| PER hub (`per`)                                               | hub                       | Épargne retraite / PER                       | `/settings/base-contrat-retraite`, `/settings/memento` | PER individuel, PASS, IR                                 | CGI, BOFiP, CMF                                    | PR 35           | couvert                  |
| PER potentiel (`per-potentiel`)                               | active                    | Épargne retraite / Potentiel PER             | `/settings/base-contrat-retraite`, `/settings/memento` | Plafonds, PASS, IR                                       | CGI, BOFiP                                         | PR 35           | couvert                  |
| PER transfert (`per-transfert`)                               | active                    | Épargne retraite / Transfert PER             | `/settings/base-contrat-retraite`                      | Contrats retraite, PS retraite, PASS                     | CMF, CGI, BOFiP                                    | PR 35           | couvert                  |
| Placement & allocation (`placement`)                          | active                    | Placements / Allocation                      | `/settings/memento`                                    | AV/capitalisation, PFU, PS, DMTG                         | CGI, BOFiP, AMF/CMF                                | PR 8            | couvert                  |
| Assurance-vie / capitalisation                                | sous-type                 | Placements / Assurance-vie et capitalisation | `/settings/memento`                                    | Fiscalité vie/décès, rachat, transmission                | CGI, BOFiP, Code assurances                        | PR 8            | partiel/couvert          |
| PEA / CTO                                                     | sous-type                 | Placements / Enveloppes titres               | `/settings/memento`                                    | PFU, PS, régimes PEA/CTO                                 | CGI, BOFiP, AMF                                    | PR 8            | partiel                  |
| SCPI (`scpi`)                                                 | planned                   | Immobilier / SCPI                            | `/settings/memento`                                    | Revenus fonciers, IFI, détention                         | CGI, BOFiP, AMF                                    | PR 8, PR 9      | planned                  |
| Crédit & garanties (`credit`)                                 | active                    | Immobilier / Crédit                          | Aucune page settings initiale                          | Échéancier, assurance, garanties                         | Code consommation, Code assurances                 | PR 9            | couvert                  |
| Investissement locatif                                        | planned                   | Immobilier / Investissement locatif          | `/settings/memento`                                    | IR, PS, revenus fonciers, LMNP                           | CGI, BOFiP                                         | PR 9            | planned                  |
| Revenus fonciers                                              | planned                   | Immobilier / Revenus fonciers                | `/settings/memento`                                    | Micro-foncier, réel, déficit                             | CGI, BOFiP                                         | PR 6            | planned                  |
| LMNP / LMP                                                    | planned                   | Immobilier / Location meublée                | `/settings/memento`                                    | Régimes, seuils, amortissements si moteur                | CGI, BOFiP                                         | PR 6            | planned                  |
| SCI & mode de détention                                       | planned                   | Immobilier / SCI                             | `/settings/memento` si société                         | Détention, transmission, fiscalité                       | Code civil, CGI, Code commerce                     | PR 9            | planned                  |
| Plus-values immobilières                                      | planned                   | Immobilier / PV immobilières                 | `/settings/memento`                                    | Abattements durée, PS                                    | CGI, BOFiP                                         | PR 6            | planned                  |
| Vendre / conserver / réemployer                               | planned                   | Arbitrage / Réemploi                         | `/settings/memento`                                    | Fiscalité sortie, enveloppes, cession titres             | CGI, BOFiP                                         | PR 9, PR 12     | planned                  |
| Prévoyance (`prevoyance`)                                     | active                    | Prévoyance / Protection familiale            | `/settings/memento`                                    | Régimes, maintien, garanties                             | CSS, Code assurances, caisses                      | PR 34           | partiel/couvert          |
| Succession & liquidité (`succession`)                         | active                    | Transmission / Succession                    | `/settings/memento`                                    | DMTG, AV décès, démembrement                             | Code civil, CGI, BOFiP                             | PR 7            | couvert                  |
| Donation & démembrement                                       | planned                   | Transmission / Donation                      | `/settings/memento`                                    | DMTG, Dutreil, IFI si utile                              | Code civil, CGI, BOFiP                             | PR 7            | planned                  |
| Organigramme société                                          | planned                   | Société / Organigramme                       | `/settings/memento`                                    | Formes, associés, liens capitalistiques                  | Code commerce, Legifrance                          | PR 10           | planned                  |
| Valorisation titres                                           | planned                   | Société / Valorisation                       | `/settings/memento`                                    | Méthodes, bilans, quote-part                             | Code commerce, doctrine comptable, BOFiP si fiscal | PR 12           | planned                  |
| Projection comptable                                          | planned                   | Société / Projection comptable               | `/settings/memento`                                    | Résultat, réserves, distribution, IS                     | Code commerce, CGI, ANC                            | PR 11           | planned                  |
| Trésorerie société                                            | active                    | Société / Trésorerie                         | `/settings/memento`                                    | IS, mère-fille/QPFC, charges sociales dirigeant          | CGI, BOFiP, URSSAF                                 | PR 10-12, PR 25 | partiel/couvert          |
| Placement trésorerie intégré                                  | sous-type                 | Société / Trésorerie                         | `/settings/memento`                                    | Allocation société, produits éligibles                   | CGI, BOFiP, AMF                                    | PR 11, PR 12    | partiel                  |
| CCA                                                           | sous-type                 | Société / Sortie de capitaux                 | `/settings/memento`                                    | CCA, intérêts, remboursement                             | Code commerce, CGI, BOFiP                          | PR 11           | planned                  |
| Filiales                                                      | sous-type                 | Société / Groupe                             | `/settings/memento`                                    | Liens, mère-fille, dividendes                            | Code commerce, CGI, BOFiP                          | PR 10, PR 11    | planned                  |
| Emprunts société                                              | sous-type                 | Société / Financement                        | `/settings/memento`                                    | Dettes, intérêts, immobilisations                        | Code commerce, doctrine comptable                  | PR 11           | planned                  |
| Rémunération dirigeant                                        | planned                   | Dirigeant / Rémunération                     | `/settings/memento`                                    | IR, dividendes, charges sociales, retraite               | URSSAF, BOSS, CSS, CGI                             | PR 25, PR 30    | planned                  |
| Épargne salariale                                             | placeholder               | Société / Épargne salariale                  | `/settings/memento`                                    | Participation, intéressement, abondement, forfait social | Code travail, BOSS, URSSAF                         | PR 10-12, PR 35 | partiel puis compléments |
| Cession de titres société                                     | planned                   | Société / Cession                            | `/settings/memento`                                    | PV mobilières, PFU, PS, apport-cession                   | CGI, BOFiP                                         | PR 12           | planned                  |
| Sortie de capitaux / CCA                                      | planned                   | Dirigeant / Sortie de capitaux               | `/settings/memento`                                    | Dividendes, CCA, PUMA/CSM, PS                            | CGI, BOFiP, URSSAF, CSS                            | PR 11, PR 25    | planned                  |
| Holding / apport-cession                                      | planned                   | Société / Holding                            | `/settings/memento`                                    | Mère-fille, QPFC, apport-cession, PV                     | CGI, BOFiP, Code commerce                          | PR 12           | planned                  |
| OBO                                                           | planned ROADMAP-only      | Société / OBO                                | `/settings/memento`                                    | Valorisation, financement, cession, holding              | Code commerce, CGI, BOFiP                          | PR 12           | planned/a_verifier       |
| Fiscalité société                                             | internalOnly ROADMAP-only | Société / Fiscalité société                  | `/settings/memento`                                    | IS, distribution, QPFC, PV titres                        | CGI, BOFiP                                         | PR 10-12        | internalOnly             |
| Pacte Dutreil                                                 | planned                   | Transmission entreprise / Dutreil            | `/settings/memento`                                    | Éligibilité, engagements, titres                         | CGI, BOFiP, Code commerce                          | PR 7, PR 12     | planned                  |
| Prévoyance dirigeant                                          | planned ROADMAP-only      | Dirigeant / Prévoyance                       | `/settings/memento`                                    | Statut dirigeant, garanties, cotisations                 | CSS, caisses, Code assurances                      | PR 34           | planned                  |
| Donation & démembrement société                               | planned ROADMAP-only      | Transmission entreprise / Donation titres    | `/settings/memento`                                    | DMTG, valeur titres, démembrement                        | Code civil, CGI, BOFiP                             | PR 7, PR 12     | planned                  |
| Succession & liquidité société                                | planned ROADMAP-only      | Transmission entreprise / Liquidité          | `/settings/memento`                                    | Valeur titres, liquidité, DMTG                           | Code civil, CGI, BOFiP                             | PR 7, PR 12     | planned                  |

## F. Tableau spécifique société / comptabilité

| Sujet société/comptable              | Simulateurs consommateurs                                               | Page propriétaire                | Settings/règles nécessaires                              | Sources attendues                        | PR cible        | Statut                   |
| ------------------------------------ | ----------------------------------------------------------------------- | -------------------------------- | -------------------------------------------------------- | ---------------------------------------- | --------------- | ------------------------ |
| IS                                   | `tresorerie-societe`, `projection-comptable`, `cession-titres`          | `/settings/memento`              | Taux réduit/normal, seuils, assiette                     | CGI, BOFiP                               | PR 10-11        | partiel/couvert          |
| QPFC                                 | `tresorerie-societe`, `holding`, `cession-titres`                       | `/settings/memento`              | Quote-part frais et charges, mère-fille                  | CGI, BOFiP                               | PR 11-12        | partiel                  |
| Mère-fille                           | `tresorerie-societe`, `holding`                                         | `/settings/memento`              | Conditions, QPFC, dividendes filiales                    | CGI, BOFiP                               | PR 11-12        | partiel                  |
| Réserves                             | `projection-comptable`, `sortie-capitaux`, `tresorerie-societe`         | `/settings/memento`              | Réserve légale, réserves distribuables                   | Code commerce, doctrine comptable        | PR 11           | planned                  |
| Résultat distribuable                | `projection-comptable`, `sortie-capitaux`                               | `/settings/memento`              | Résultat, report, réserves, distribution                 | Code commerce                            | PR 11           | planned                  |
| Dividendes                           | `remuneration`, `sortie-capitaux`, `tresorerie-societe`                 | `/settings/memento`              | Régime fiscal, social TNS si applicable                  | CGI, BOFiP, URSSAF                       | PR 11, PR 25    | partiel                  |
| CCA                                  | `tresorerie-societe`, `sortie-capitaux`                                 | `/settings/memento`              | Apports, remboursement, intérêts                         | Code commerce, CGI, BOFiP                | PR 11           | planned                  |
| Capitaux propres                     | `projection-comptable`, `valorisation-titres`                           | `/settings/memento`              | Capital, réserves, résultat, report                      | Code commerce, doctrine comptable        | PR 11           | planned                  |
| Primes                               | `projection-comptable`, `valorisation-titres`                           | `/settings/memento`              | Primes d'émission/fusion/apport si consommées            | Code commerce, doctrine comptable        | PR 11           | planned                  |
| Emprunts société                     | `tresorerie-societe`, `projection-comptable`, OBO                       | `/settings/memento`              | Encours, intérêts, échéancier, actif financé             | Code commerce, doctrine comptable        | PR 11-12        | planned                  |
| Immobilisations                      | `projection-comptable`, `valorisation-titres`                           | `/settings/memento`              | Immobilisations, amortissements si moteur                | Doctrine comptable, ANC                  | PR 11           | planned                  |
| Immobilier détenu                    | `valorisation-titres`, `ifi`, `sci`, `tresorerie-societe`               | `/settings/memento`              | Détention société, IFI, fiscalité société                | CGI, BOFiP, Code commerce                | PR 9-11         | planned                  |
| Formes de société                    | `organigramme-societe`, `holding`, `pacte-dutreil`                      | `/settings/memento`              | SARL/SAS/SCI/holding, statuts utiles                     | Code commerce, Code civil                | PR 10           | planned                  |
| Organigramme                         | `organigramme-societe`, `holding`, `cession-titres`, `pacte-dutreil`    | `/settings/memento`              | Liens, associés, participations                          | Code commerce                            | PR 10           | planned                  |
| Liens capitalistiques                | `organigramme-societe`, `holding`, `valorisation-titres`                | `/settings/memento`              | Détention directe/indirecte, contrôle                    | Code commerce                            | PR 10           | planned                  |
| Valorisation titres                  | `valorisation-titres`, `cession-titres`, `pacte-dutreil`                | `/settings/memento`              | Méthodes simples, quote-part, bilans                     | Doctrine comptable, BOFiP si fiscal      | PR 12           | planned                  |
| Holding                              | `holding`, `cession-titres`, `tresorerie-societe`                       | `/settings/memento`              | Mère-fille, QPFC, structure, réemploi                    | CGI, BOFiP, Code commerce                | PR 12           | planned                  |
| Apport-cession                       | `holding`, `cession-titres`                                             | `/settings/memento`              | Report/sursis, réemploi, délais                          | CGI, BOFiP                               | PR 12           | planned                  |
| Cession de titres                    | `cession-titres`, `arbitrage-reemploi`, `holding`                       | `/settings/memento`              | PV mobilières, PFU, abattements si applicables           | CGI, BOFiP                               | PR 12           | planned                  |
| OBO                                  | OBO ROADMAP-only, `holding`, `valorisation-titres`                      | `/settings/memento`              | Valeur, financement, cash-out, structure                 | Code commerce, CGI, BOFiP                | PR 12           | planned/a_verifier       |
| Dutreil                              | `pacte-dutreil`, donation société, succession société                   | `/settings/memento`              | Exonération, engagements, activité, titres               | CGI, BOFiP, Code commerce                | PR 7, PR 12     | planned                  |
| Épargne salariale                    | `epargne-salariale`, `remuneration`, `projection-comptable`, `retraite` | `/settings/memento`              | Intéressement, participation, abondement, forfait social | Code travail, BOSS, URSSAF               | PR 10-12, PR 35 | partiel puis compléments |
| Sortie de capitaux                   | `sortie-capitaux`, `remuneration`, `tresorerie-societe`                 | `/settings/memento`              | Dividendes, CCA, rémunération, PS/PUMA                   | CGI, BOFiP, URSSAF, CSS                  | PR 11, PR 25    | planned                  |
| Bilans/liasses comme sources dossier | `projection-comptable`, `valorisation-titres`, `tresorerie-societe`     | Pas une page settings exhaustive | Source evidence/dossier, adapters futurs                 | Doctrine comptable, documents entreprise | PR 10-11        | planned                  |

## G. Tableau ancien découpage / nouveau découpage

| Ancien découpage 35 PR       | Nouveau rattachement | Changement                                                                     |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| Taxonomie seule              | PR 1 + PR 2          | Ajout mapping simulateurs dès le socle                                         |
| Route/UI mémento             | PR 3                 | Conservé                                                                       |
| Coverage/audit               | PR 4                 | Renforcé avec non-régression routes et planned non cliquables                  |
| Civil/foyer dispersé         | PR 5                 | Regroupé comme socle dossier foyer                                             |
| Fiscal foyer                 | PR 6                 | Renforcé avec moteurs fiscaux immobiliers de ROADMAP                           |
| Transmission/DMTG            | PR 7                 | Conservé, enrichi Dutreil et variantes société                                 |
| Placements/Base-Contrat      | PR 8                 | Conservé, sous-types explicites                                                |
| Immobilier                   | PR 9                 | Renforcé avec `credit`, `sci`, `arbitrage-reemploi`                            |
| Société générique            | PR 10 à PR 14        | Découpé en socle société, règles comptables, restructuration, audit alignement |
| Charges sociales             | PR 15 à PR 26        | Conservé par familles, ajout dirigeant explicite                               |
| Retraite                     | PR 27 à PR 34        | Conservé, enrichi dirigeant/Base CG/prévoyance                                 |
| PER/épargne/fiscalité sortie | PR 35 à PR 36        | Dépendance corrigée : fiscalité sortie après PER                               |
| Lexique                      | PR 37                | Conservé                                                                       |
| Audit final                  | PR 38                | Renforcé avec couverture simulateurs et société/comptabilité                   |

## H. Premier lot exécutable

Premier lot recommandé : Partie 1, PR 1 à PR 4.

**Statut : lot livré** (PR #585 à #588, voir « Statut d'avancement » en tête). Les critères de
sortie ci-dessous sont tenus et verrouillés en continu par `npm run check:memento-coverage`.

Ordre :

1. PR 1 — Taxonomie mémento, statuts et gouvernance.
2. PR 2 — Correspondance simulateurs ROADMAP vers mémento.
3. PR 3 — Route `/settings/memento` et UI V1.
4. PR 4 — Coverage adapter, audit mémento et non-régression settings.

Critères de sortie :

- `/settings/memento` existe et charge.
- `/settings` conserve son comportement actuel.
- `/settings/memento` est la seule route settings fiscal/social canonique.
- La taxonomie ne contient aucune valeur fiscale, sociale ou comptable.
- Tous les simulateurs et sous-types de la section E sont représentés.
- Les `planned` ne sont pas cliquables comme des simulateurs actifs.
- Les statuts incluent `blocked_missing_official_source`.
- Les checks routes/settings/références sont verts.

Check-list avant implémentation :

- lire `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/METIER.md`, `docs/ROADMAP.md`, `docs/RUNBOOK.md`, `.github/CONTRIBUTING.md`;
- vérifier `git status`;
- prouver `SETTINGS_ROUTES` et `/settings/memento`;
- prouver `src/domain/simulators` et la matrice `docs/ROADMAP.md`;
- vérifier les scripts npm existants avant de les citer;
- définir un contrat de PR avec hors-scope clair;
- prévoir `check:e2e-auth-pages-coverage`, `test:e2e:auth-pages`, `check:settings-references`, `check:settings-registry`, `check:fiscal-hardcode`, `npm run check`.

Prompt archivé ayant servi à l'exécution PR 8 (PR #594), relu après consolidation M6 pour pointer vers la surface propriétaire actuelle :

```text
Implémente uniquement la PR 8 de docs/MEMENTO_ROADMAP.md : placements, Base-Contrat et sous-types enveloppes (allocation, assurance-vie/capitalisation, PEA/CTO, SCPI). Respecte AGENTS.md, lis docs/ARCHITECTURE.md, docs/METIER.md, docs/ROADMAP.md, docs/RUNBOOK.md et .github/CONTRIBUTING.md. Les entrées passent par MEMENTO_ENTRIES dans src/domain/settings-memento/ avec /settings/memento comme page propriétaire. Les raccords Base-Contrat doivent réutiliser les claimKeys et références existants, sans créer de référentiel artificiel, sans retoucher SCPI hors PR8 et sans activer de simulateur planned. Aucun hardcode fiscal/social/comptable. Lance check:memento-coverage, check:fiscal-hardcode, check:raw-fiscal-usage, check:settings-references, check:settings-registry, check:legal-references puis npm run check avant commit.
```
