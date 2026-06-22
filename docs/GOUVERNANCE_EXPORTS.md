# GOUVERNANCE EXPORTS (PPTX / Excel)

## But

Définir les règles non négociables pour garder des exports PPTX et Excel cohérents, thémés, testables et maintenables.

## Audience

Toute personne qui touche :

- `src/pptx/**`
- `src/utils/export/**`
- les wrappers d’export côté feature
- les hooks ou menus d’export dans les simulateurs

## Ce que ce doc couvre / ne couvre pas

- ✅ Couvre : architecture des exports, Serenity, wrappers, checklist PPTX, infrastructure Excel, onglet `Hypothèses`, validation.
- ❌ Ne couvre pas : la norme UI web `/sim/*` ni le thème de l’application web (voir `docs/GOUVERNANCE.md`).

## Sommaire

- [Gouvernance PPTX](#gouvernance-pptx)
- [Gouvernance Excel](#gouvernance-excel)
- [Références code](#références-code)

---

## Gouvernance PPTX

### Source de vérité

- Orchestrateur : `src/pptx/export/exportStudyDeck.ts`
- Design system : `src/pptx/designSystem/serenity.ts`
- Types de spec : `src/pptx/theme/types.ts`
- Slides : `src/pptx/slides/**`
- Deck builders : `src/pptx/presets/**`

### Règle de périmètre

- Le composant UI d’une feature n’importe jamais directement `exportStudyDeck`.
- Le point d’entrée runtime doit être un wrapper feature-owned ou un wrapper dédié export.
- Cette règle est vérifiée par `npm run check:arch` via `no-export-study-deck-from-ui`.
- `src/pptx/**` n’importe jamais `src/features/**`. Les types, labels ou helpers partagés
  doivent vivre dans `src/domain/**`, `src/engine/**`, `src/reporting/**` ou dans un module
  PPTX dédié selon leur responsabilité réelle.
- Cette frontière est vérifiée par `npm run check:arch` via `pptx-no-features`.
- Les wrappers feature-owned restent le point d’entrée runtime autorisé pour les exports actifs :
  - `src/features/strategy/export/exportStrategy.ts` adapte `src/pptx/strategyPptx.ts`
- `/audit` ne fournit plus d'export PPTX runtime ; la sauvegarde locale du brouillon audit reste hors périmètre PPTX.

### Architecture cible Serenity

Un deck Serenity suit toujours cette chaîne :

1. state du simulateur / feature
2. wrapper export ou hook export de la feature
3. deck builder `src/pptx/presets/**`
4. slide builders `src/pptx/slides/**`
5. orchestrateur `exportStudyDeck.ts`

### Structure invariante d’un deck

- Slide cover
- Slides chapter si le simulateur est découpé en parties
- Slide de synthèse obligatoire
- Slide d’annexe / contenu si le mécanisme doit être expliqué
- Slide de fin si le simulateur l’utilise déjà

### Invariants PPTX

| Règle            | Détail                                                                       |
| ---------------- | ---------------------------------------------------------------------------- |
| Couleurs         | Via `PptxThemeRoles` uniquement ; seul `#FFFFFF` reste hardcodé              |
| Fonte            | `Arial` uniquement                                                           |
| Coordonnées      | En pouces depuis `serenity.ts`                                               |
| Données          | Issues du state du simulateur ; pas de recalcul métier dans le slide builder |
| Calculs dérivés  | Autorisés uniquement via helper engine/domain ou test de parité UI/export    |
| Fiscalité        | Jamais de valeur fiscale hardcodée                                           |
| Header / Footer  | Toujours via les helpers partagés                                            |
| Images chapitres | Toujours via `pickChapterImage(simId, ordinal)`                              |
| Wrapper          | Obligatoire entre la feature et la génération réelle                         |
| Tests            | Smoke export + parité pour toute métrique partagée UI/export                 |

### Marquage IA des exports — conditionnel à la livraison PR V2-14

Cette règle est **inactive tant que PR V2-14 n'est pas livré**. Aucun export actuel ne consomme de donnée issue d'un pipeline IA ; aucune contrainte n'est exigée pour les exports existants ni les développements en cours qui ne s'appuient pas sur l'IA.

À partir de la livraison de **PR V2-14 — Scan documentaire** (`docs/ROADMAP.md`), tout export qui contient au moins une donnée issue du pipeline IA (champ préremplis par scan documentaire, point validé après extraction LLM, valeur dérivée d'une extraction) devra :

- Porter une **métadonnée document** `ai_assisted: true` (PPTX : propriété custom dédiée ; Excel : cellule de header ou note documentaire).
- Afficher un **badge visuel** « assisté par IA » ou « extrait par IA » sur la slide cover et sur les sections où la donnée IA-extraite est utilisée.
- Conserver la traçabilité au niveau du champ source (`sourceRef` documentaire) côté SER1, sans nécessairement la pousser dans l'export.

Cohérence : la règle matérialise la bonne pratique art. 50 § 2 et l'engagement volontaire art. 95 documentés dans `docs/AI_ACT_CADRAGE.md` (sections « Déclinaison UI / UX art. 50 » et « Obligations techniques et engagement volontaire art. 95 »). Elle est posée ici en amont pour que les développements d'exports en cours (`/audit`, `PR V2-08` PER, `/strategy`) puissent l'anticiper sans rework, mais elle ne crée aucune dette tant que PR V2-14 n'a pas livré la première donnée IA-extraite.

### Alignement avec l'UI simulateur

- Les unités affichées dans l'export doivent être identiques à celles de la page : si la sidebar affiche une rente annuelle, aucune slide ne doit parler de rente mensuelle.
- Les valeurs numériques utilisent le même niveau de transformation utilisateur que l'UI : montants lisibles, taux en `%`, pas de taux décimaux bruts (`0.0495`) dans les textes de slide.
- Toute page `/sim/*` qui affiche un bloc `Hypothèses et limites` doit reprendre ces hypothèses dans le deck, soit dans une slide dédiée, soit dans une annexe clairement identifiée.
- Les limites juridiques, référentiels indicatifs, CG non garanties, fallbacks et simplifications visibles dans l'UI doivent être présents dans l'étude remise au client.
- Interdit : corriger un disclaimer dans la page web sans mettre à jour le PPTX correspondant quand l'export existe.
- Interdit : dupliquer une formule financière dans `src/pptx/**` si une métrique identique existe dans l'UI ou l'engine. Ajouter ou mettre à jour `npm run check:export-parity`.

### Slides de synthèse

- Une slide de synthèse traduit une seule idée visuelle.
- Pas de tableau HTML déguisé dans une slide de synthèse.
- Pas de texte inférieur à `9pt`.
- Les schémas visuels utilisent uniquement des shapes PptxGenJS.
- Le contraste du texte sur fond coloré passe par les helpers de contraste, pas par une couleur hardcodée.

### Slides annexe / prose

- Registre : français, vouvoiement, ton pédagogique.
- Structure recommandée :
  1. situation du client
  2. mécanismes appliqués
  3. résultat net
  4. disclaimer adapté
- Pas de bullet points dans une slide annexe narrative.
- Les valeurs chiffrées restent formatées avec leurs unités (`€`, `%`, etc.).

### Checklist PPTX

| Étape | Action                                                              |
| ----- | ------------------------------------------------------------------- |
| 1     | définir les specs de slide dans `src/pptx/theme/types.ts` si besoin |
| 2     | créer ou adapter le deck builder `src/pptx/presets/**`              |
| 3     | créer ou adapter les slide builders `src/pptx/slides/**`            |
| 4     | câbler l’orchestrateur ou le preset                                 |
| 5     | créer le wrapper d’export                                           |
| 6     | brancher le hook ou le menu d’export côté feature                   |
| 7     | ajouter au minimum un test smoke d’export                           |
| 8     | vérifier les chapitres / assets si un chapitre illustré est utilisé |

### Images chapitres

- Pool fixé dans `CHAPTER_IMAGE_POOLS` de `serenity.ts`
- Images autorisées : `public/pptx/chapters/ch-01.png` à `ch-09.png`
- Budgets :
  - cible `<= 1.2 Mo` par image
  - alerte `> 1.6 Mo`
  - cible `<= 9 Mo` au total
- Vérification : `npm run check:pptx-images`.

### Carte des fichiers PPTX

| Dossier/Fichier                                | Rôle                            |
| ---------------------------------------------- | ------------------------------- |
| `src/pptx/designSystem/serenity.ts`            | design system PPTX              |
| `src/pptx/theme/types.ts`                      | types de specs + rôles de thème |
| `src/pptx/theme/getPptxThemeFromUiSettings.ts` | mapping thème web -> thème PPTX |
| `src/pptx/presets/`                            | deck builders par simulateur    |
| `src/pptx/slides/`                             | slide builders                  |
| `src/pptx/exports/`                            | wrappers export standardisés    |
| `src/pptx/export/exportStudyDeck.ts`           | orchestrateur central           |
| `public/pptx/chapters/`                        | assets chapitres                |

### Spécificités Trésorerie société

- Le wrapper runtime est `src/features/tresorerie-societe/export/tresoreriePptxWrapper.ts`.
- Les slides dédiées sont typées par `TresorerieSchemaSlideSpec`, `TresorerieTimelineSlideSpec`, `TresorerieFlowMechanismSlideSpec`, `TresorerieAllocationMatrixSlideSpec`, `TresorerieAllocationCardsSlideSpec`, `TresorerieSynthesisSlideSpec`, `TresorerieProjectionSlideSpec` et `TresorerieHypothesesSlideSpec`.
- Le deck client suit l'ordre : contexte société et associé, parcours de revenus, mécanisme des flux, lecture des poches, organisation de la trésorerie, synthèse, annexe comptable paginée, hypothèses.
- La projection comptable distingue le compte bancaire, le solde protégé, la liquidité disponible, les montants investis et la trésorerie consolidée.
- Les slides client ne doivent jamais reprendre le vocabulaire issu des fichiers de travail externes ; employer “Trésorerie société”, “CCA”, “société IS” et “matrice de trésorerie”.
- Le PPTX et l'Excel consomment `TresoInputsV6`, `TresoProjectionRow[]` et les KPI calculés par la feature ; les formats V1→V5 sont migrés avant export.

---

## Gouvernance Excel

### Source de vérité

- Exports finalisés de référence :
  - `sim/ir`
  - `sim/credit`
- Exports alignés sur l’infrastructure mais avec écarts encore tolérés :
  - `succession`
  - `per`
- Dette technique majeure encore présente :
  - `placement`

### Artefacts Office

- Les fichiers Office de travail (`.xls`, `.xlsx`, `.xlsm`, `.ppt`, `.pptx`) ne sont pas versionnes.
- Le garde-fou `npm run check:no-office-artifacts` verifie les fichiers suivis par Git et echoue si un artefact Office est ajoute par erreur.
- Cette regle ne concerne pas les exports runtime : conserver `src/pptx/**`, `src/features/*/export/**` et `src/utils/export/**`, qui sont du code applicatif actif.

### Infrastructure obligatoire

- Builder OOXML : `src/utils/export/xlsxBuilder.ts`
- Les exports doivent passer par :
  - `buildXlsxBlob()`
  - `downloadXlsx()`
  - `validateXlsxBlob()` si la feature valide son blob

### Interdits Excel

- génération de XML Excel à la main
- retour au vieux format `.xls`
- reconstitution manuelle d’un zip OOXML
- usage de l’ancien legacy supprimé `exportExcel.ts`

### Couleurs et thème

- `headerFill` doit venir du thème courant (`themeColors?.c1`)
- `sectionFill` doit venir du thème courant (`themeColors?.c7`)
- Ne pas retomber sur des couleurs fixes si le thème runtime est disponible

### Styles de cellule

Les styles doivent rester dérivés du contrat du builder partagé. Les plus utilisés :

- `sHeader`
- `sSection`
- `sText`
- `sMoney`
- `sPercent`
- `sDate`

### Formatage des valeurs

- Montants : nombre natif + style monétaire, jamais string brute formatée
- Pourcentages : valeur décimale + style `%`
- Dates : ISO ou `Date`, jamais chaîne libre si la colonne est censée rester triable
- Interdiction des valeurs métier concaténées dans une string non exploitable par Excel

### Structure des onglets

- Un export métier doit rendre des onglets nommés, stables et compréhensibles.
- L’onglet `Hypothèses` est obligatoire dès qu’il existe des simplifications, warnings, fallback métier ou hypothèses d’export.
- La largeur des colonnes doit être explicitée via `columnWidths` quand le rendu le nécessite.
- Pour `/sim/tresorerie-societe`, l’ordre attendu est `Projection`, `Revenus associés`, `Hypothèses`.

### Validation post-génération

Après génération :

1. le blob doit être valide
2. l’archive doit s’ouvrir dans Excel / LibreOffice / Numbers
3. les onglets doivent être présents dans le bon ordre
4. les valeurs monétaires / pourcentages doivent rester filtrables et triables

### Nommage des fichiers

- extension `.xlsx` obligatoire
- nom court, lisible, lié au simulateur
- pas de suffixe technique incompréhensible côté utilisateur

### Checklist Excel

| Étape | Action                                                         |
| ----- | -------------------------------------------------------------- |
| 1     | construire les `XlsxSheet[]` dans la feature                   |
| 2     | utiliser `buildXlsxBlob()`                                     |
| 3     | injecter `headerFill` et `sectionFill` depuis le thème courant |
| 4     | prévoir l’onglet `Hypothèses` si nécessaire                    |
| 5     | vérifier les largeurs de colonnes utiles                       |
| 6     | ajouter ou mettre à jour le test d’export                      |
| 7     | vérifier l’ouverture du fichier dans un client réel            |

### Dettes techniques Excel

- `placement` doit encore converger vers l’infrastructure OOXML standard
- les divergences de `succession` et `per` sont acceptables tant qu’elles restent documentées et testées

---

## Références code

- Builder OOXML : `src/utils/export/xlsxBuilder.ts`
- Fingerprint exports : `src/utils/export/exportFingerprint.ts`
- Wrapper Strategy : `src/features/strategy/export/exportStrategy.ts`
- Deck builders : `src/pptx/presets/**`
- Slides : `src/pptx/slides/**`
- Orchestrateur PPTX : `src/pptx/export/exportStudyDeck.ts`
