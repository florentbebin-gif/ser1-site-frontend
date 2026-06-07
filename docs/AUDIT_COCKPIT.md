# SER1 — Contrat Cockpit Audit

## Rôle du document

`docs/AUDIT_COCKPIT.md` est le **contrat produit / design permanent** de la refonte de `/audit` en
cockpit patrimonial CGP. Il fige la vision, les principes, les contrats UX et les décisions design.

Ce document n'est **pas** une roadmap concurrente. Le **séquencement des PR** vit dans
`docs/ROADMAP.md` (track « UX Cockpit /audit »), qui reste la source unique de séquencement
(principe 14 de la roadmap : pas de roadmap concurrente).

Statut : **UX-00a fige le contrat documentaire.** UX-00b implémentera les tokens CSS, le showroom et
les checks en suivant ce contrat. Cette PR UX-00a ne modifie aucun token CSS, aucun composant, aucune
route, aucun check.

Date de cadrage : 2026-06-07.

## 1. Vision

`/audit` n'est plus un formulaire à remplir : c'est le poste de pilotage depuis lequel le CGP voit ce
qu'il sait, ce qui manque, ce qui alerte, et teste l'effet d'une stratégie avant de l'activer comme
nouvelle version patrimoniale.

Précisions de périmètre :

- `/audit` est **CGP-facing** : l'outil s'adresse au conseiller, pas au client final.
- `/audit` n'est **pas une vue client** : une future « présentation client » sera un mode de
  restitution, pas un modèle de données à introduire maintenant.
- `/audit` n'est **pas une GED** : les documents y sont une couche de preuve discrète, pas un
  gestionnaire de fichiers.
- `/audit` n'est **pas une collection de simulateurs** : c'est une surface de pilotage qui consomme
  le dossier et les moteurs.
- `/audit` **consomme les fondations** `F1` (DossierPatrimonial), `F1.1` (budgetSynthese), `F2`
  (evidence), `F3` (graphe actifs/passifs PP/US/NP), `F5` (société/organigramme/bilans) et `F6`
  (scénarios/recommandations/activation). Il ne possède aucune source de vérité propre.

## 2. Principes produit

1. **Restituer avant de saisir.** L'écran d'entrée affiche un état, pas un champ vide.
2. **Une seule navigation : le rail gauche.** Pas de barre d'onglets horizontale.
3. **Le manque est une donnée de premier rang.** « Inconnu » s'affiche aussi fort qu'une valeur.
4. **Jamais de fausse donnée.** États « à compléter », « à vérifier », « à venir » assumés ; aucun
   chiffre ni score fabriqué.
5. **Le détail vit en drawer XL.** Les pages restent des tableaux de bord ; l'édition fine s'ouvre en
   drawer.
6. **Tout score affiche sa calculabilité et sa confiance.** Pas de note sans indicateur de
   complétude des données qui la fondent.
7. **Le radar montre des arbitrages, pas une note.** Sa fonction est de rendre visible le coût d'une
   stratégie, pas d'atteindre 100/100.
8. **Versionner, ne jamais écraser.** Une stratégie validée devient une nouvelle version active ;
   l'ancienne est archivée et restaurable.
9. **La preuve est discrète mais traçable.** Chaque valeur décisive peut pointer une source ; pas de
   GED.
10. **Les tokens et règles design sont modifiables en phase de développement, mais chaque ouverture
    doit être reverrouillée par doc, showroom et checks.**

## 3. Décisions UX validées

| Décision                                           | Justification                                                       | Risque                                              | Garde-fou                                                                      | Impact roadmap                             |
| -------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------ |
| Radar honnête, sans score global                   | Un radar « note » ment au CGP et promet un calcul indisponible      | Radar souvent grisé en début de dossier             | État grisé designé ; test : axe sans bloquante → `données insuffisantes`       | Radar réel = F6 ; placeholder avant        |
| « Pistes à vérifier » déterministes                | Règles `if` traçables, pas de reco engine ni d'IA                   | Glissement vers « conseil automatisé » (AI Act)     | Wording neutre ; aucune piste sans donnée fondatrice ; module testé            | V1 livrable en lecture seule avant F6      |
| Activation scénario en 3 niveaux                   | Empêche de figer une version sur du vide                            | Matrice de bloquants trop stricte ou trop laxiste   | Bloquants = minimum métier ; reste = avertissement tracé                       | Dépend de F6 + champs F3/F5                |
| IFI sans estimation avant moteur                   | AGENTS + roadmap : pas de calcul indisponible                       | Axe Fiscalité faussé par un IFI non calculé         | L'axe Fiscalité n'utilise pas l'IFI tant qu'il n'est pas calculé               | Section IFI conditionnelle, post-F3        |
| Organigramme auto depuis données structurées       | Réutilise le layout existant ; évite le mini-Figma                  | Généralisation du layout non triviale               | Modèle société/liens en F5 ; org-chart = rendu, jamais source                  | UX-04 gated par F5                         |
| SourceRef manuel = statut, pas confiance           | Un « 100 % fiable » sur saisie manuelle est un faux signal          | Confusion statut de revue vs confiance d'extraction | `confidence` affichée seulement si `kind ∈ {scan, import}`                     | Statuts = F2 ; confiance = scan            |
| Vue client hors scope                              | Aucun écran client en face ; flag de visibilité = dette spéculative | Wording UI non présentable                          | Principe « wording présentable » ; pas de champ `clientVisible` maintenant     | Aucun ; note METIER                        |
| AuditDrawerXL canonique à créer                    | Le détail vit en drawer ; éviter le CSS libre                       | Largeurs/CSS locales                                | Variante d'anatomie modale ; classes canoniques + `check:modal-canon` (UX-00b) | UX-00b ouvre puis reverrouille             |
| Budget & capacité dans `/audit` via F1.1           | Donnée centrale qui alimente radar/retraite/prévoyance/placement    | Extension F1 nécessaire                             | Source de vérité = **synthèse** (revenus/charges/capacité), pas le détail      | Mini-jalon F1.1 avant axes Budget/Retraite |
| Pas de C11-C14 maintenant                          | C1-C10 = palette utilisateur ; data-viz = sémantique dérivée        | Dérive (chaque graphe sa couleur)                   | Tokens `--viz-*` dérivés du thème ; checks couleurs (UX-00b)                   | UX-00b ; réouverture seulement si prouvé   |
| Surfaces : carte / bande / ligne KPI / tuile plate | Permet des surfaces premium riches sans empilement d'ombres         | « Poupées russes » d'ombres                         | Aucune surface élevée dans une surface élevée ; `check:sim-cards` (UX-00b)     | UX-00b                                     |

## 4. Décisions tokens et design

- **C1-C10** restent la **palette configurable utilisateur** (source `src/settings/theme.ts`). On ne
  les remplace pas et on n'ajoute pas de slot configurable.
- **`--viz-1` … `--viz-8`** : tokens sémantiques **data-viz catégoriels** (séries de graphes), à
  créer en UX-00b, dérivés du thème / de la palette utilisateur, sans hex runtime.
- **`--viz-current`** et **`--viz-scenario`** : deux séries du radar (situation actuelle vs
  scénario). Le cuivre (`--accent-signature`) **n'entre pas** dans le radar.
- **`--viz-sequential-*`** : rampe mono-teinte pour anneaux de complétude et jauges.
- **`--state-warning`** doit être **distinct de l'accent signature** : aujourd'hui il dérive de C6,
  qui sert aussi de cuivre premium ; le mélange tue la saillance des alertes. UX-00b découple les
  deux.
- **`--accent-signature`** reste un accent de **marque / version active / KPI héros**, jamais un
  statut d'alerte.
- **Pas de couleur locale, pas de hex/rgb/hsl runtime.** Toute couleur de graphe passe par
  `--viz-*` ou `--state-*`.
- Si, en UX-00b, il est **prouvé** que C1-C10 + dérivation sémantique ne permettent pas une data-viz
  accessible et lisible, alors seulement la question d'une extension C11-C14 pourra être rouverte,
  par **PR dédiée**, verrouillée par docs + showroom + checks.

> Cette PR **UX-00a ne modifie pas encore les tokens CSS** ni `tools/ser1-color-policy.mjs`. Elle
> fixe le contrat ; UX-00b mettra à jour tokens, showroom et checks.

## 5. Contrat radar V1

Axes finaux (ordre **verrouillé**, jamais réordonné) :

1. **Fiscalité maîtrisée**
2. **Protection familiale**
3. **Transmission préparée**
4. **Patrimoine productif**
5. **Revenus futurs sécurisés**
6. **Capacité d'épargne**

### Détail par axe

| Axe                      | Définition                                                   | Données bloquantes                                  | Données utiles                               | Fondations         | Levier possible                     |
| ------------------------ | ------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------- | ------------------ | ----------------------------------- |
| Fiscalité maîtrisée      | Pression IR + PS vs potentiel d'optimisation                 | Revenus foyer, situation familiale, parts           | Revenus fonciers, plafonds PER (IFI exclu)   | F1.1 + IR existant | Versement PER, optimisation foncier |
| Protection familiale     | Couverture décès/invalidité vs besoins                       | Foyer, revenus, présence/absence prévoyance         | Emprunts, quotités, enfants à charge         | F1 + F3 + V2-10    | Vérifier prévoyance                 |
| Transmission préparée    | Anticipation des droits vs dispositifs mobilisés             | Régime matrimonial, filiation, actifs nets          | Donations antérieures, clauses bénéficiaires | F3 + succession    | Donation, préparation transmission  |
| Patrimoine productif     | Diversification et rendement vs patrimoine dormant           | Actifs (montants + classes)                         | Passifs, allocation cible, liquidités        | F3                 | Revoir l'allocation                 |
| Revenus futurs sécurisés | Retraite + revenus du patrimoine vs objectif de train de vie | budgetSynthese (objectif), revenus retraite estimés | Placements générateurs, allocation           | F1.1 + retraite    | PER, allocation orientée revenus    |
| Capacité d'épargne       | Marge disponible après train de vie                          | budgetSynthese (revenus + charges)                  | Opérations prévues, échéances crédits        | F1.1               | Réallouer la capacité               |

### Comportement si données insuffisantes

- Sommet d'axe tiré vers le centre et **hachuré**, libellé `données insuffisantes`, **aucun polygone
  fermé trompeur**.
- Au clic : ouvre le drawer d'axe directement sur « ce qui manque ».

### Exemple de wording par axe

- État `score` : `Fiscalité maîtrisée — score indicatif 62/100 · confiance moyenne`.
- État `tendance` : `Transmission préparée — tendance : vigilance · données partielles`.
- État `insuffisant` : `Patrimoine productif — données insuffisantes · renseignez les actifs`.

### Règles

- Pas de score global.
- Pas d'aire du radar utilisée comme note.
- Pas de 0 ni de 50 par défaut.
- `score` seulement si `calculability = score`.
- Sinon `tendance` (qualitatif, sans chiffre) ou `insuffisant` (axe grisé).
- Score affichable uniquement si **toutes les données bloquantes** sont présentes **et** si **au
  moins 70 % des données utiles** sont présentes.
- Axe grisé si **une** donnée bloquante manque.
- Confiance : `haute` / `moyenne` / `faible`, affichée comme anneau, pas comme pourcentage.
- Au clic : afficher les données manquantes et les leviers.

### Interdits de wording

- « note patrimoniale »
- « score global »
- « santé patrimoniale /100 »
- « optimisé à X % »

## 6. Contrat « Pistes à vérifier »

Nom UI canonique : **`Pistes à vérifier`**.

Wording autorisé :

- `Signal détecté` (eyebrow par item)
- `À explorer avec le client`

Wording interdit :

- `SER1 recommande`
- `SER1 conseille`
- `La meilleure stratégie est`
- `SER1 pense à…` comme titre canonique (anthropomorphise et glisse vers le conseil automatisé ; à
  éviter au regard de `docs/AI_ACT_CADRAGE.md`).

Règle : V1 **déterministe**, sans IA, sans appel réseau, sans ranking magique. Ordre des pistes =
priorité fixe documentée.

Règles initiales (chaque piste cite sa donnée fondatrice) :

| Règle             | Condition (données)                                                 | Piste affichée                   |
| ----------------- | ------------------------------------------------------------------- | -------------------------------- |
| PER               | TMI élevée **et** capacité d'épargne positive                       | Tester un versement PER          |
| IFI               | Patrimoine immobilier significatif                                  | Vérifier l'assujettissement IFI  |
| Protection        | (conjoint **ou** enfants **ou** emprunts) **et** prévoyance absente | Vérifier la protection familiale |
| Transmission      | Actif net élevé **et** enfants                                      | Préparer la transmission         |
| Statut dirigeant  | Dirigeant **ou** société détenue                                    | Analyser rémunération / statut   |
| Foncier           | Revenus fonciers identifiés                                         | Optimiser le foncier / LMNP      |
| Épargne salariale | Société familiale **et** membre actif                               | Étudier l'épargne salariale      |

Interdictions : aucune piste sans donnée fondatrice ; aucun verbe prescriptif ; aucune piste tirée
d'un calcul non disponible (ex. pas de piste IFI chiffrée tant que l'IFI n'est pas calculé — seulement
« vérifier l'assujettissement »).

Masquage : dossier vide → la zone affiche « Complétez le dossier pour faire émerger des pistes », pas
une liste vide.

## 7. Contrat versioning

S'appuie sur les contrats de domaine existants (`DossierVersion`, `StrategyActivation`,
`WORKING_DOSSIER_VERSION` dans `src/domain/dossier/types.ts`). Câblage réel = **F6**.

- **Version active** : `DossierVersion.status = 'active'`. Une seule à la fois ; référence du
  patrimoine et des simulateurs.
- **Scénario en test** : `WORKING_DOSSIER_VERSION` (`draft`, `isPersisted = false`) ; modifiable sans
  toucher l'active.
- **Application comme nouvelle version active** : `StrategyActivation { replacesVersionId,
activatedVersionId, sourceRefIds }` → nouvelle `active`, ancienne → `archived`.
- **Archive** : liste des `archived` triées par `activatedAt`, avec `versionCode`, `label` et résumé
  des deltas.
- **Rollback** : ré-activer une `archived` (même mécanique inversée) + confirmation.
- **Comparaison avant/après** : radar (actuel vs scénario) + deltas des KPI (patrimoine net, droits
  succession, IFI quand calculé, budget).
- **Activation suffisante / partielle / bloquée** :

| Niveau    | Condition                           | Comportement                                             | Wording                                       |
| --------- | ----------------------------------- | -------------------------------------------------------- | --------------------------------------------- |
| Suffisant | Toutes bloquantes du type présentes | Activation directe                                       | « Appliquer comme nouvelle version active »   |
| Partiel   | Bloquantes OK, utiles incomplètes   | Activation + trace des manques dans `StrategyActivation` | Badge « Activée sur données partielles »      |
| Bloqué    | ≥ 1 bloquante manquante             | Activation interdite                                     | « Complétez : {liste} » + CTA vers la section |

Wording : `Appliquer comme nouvelle version active`, `Restaurer cette version`. Jamais `écraser`.

Matrice V1 « type de stratégie → données bloquantes » :

| Stratégie               | Données bloquantes                                                   |
| ----------------------- | -------------------------------------------------------------------- |
| Donation / démembrement | Filiation + régime matrimonial + actifs (F3) + donations antérieures |
| Prévoyance              | Foyer + revenus (F1.1) + emprunts (F3) + contrats prévoyance         |
| IFI                     | Actifs immobiliers + dettes + détention PP/US/NP (F3)                |
| Versement PER           | budgetSynthese + revenus + TMI (IR)                                  |
| Rémunération dirigeant  | Société + statut + bilan (F5)                                        |
| Transmission entreprise | Organigramme + valorisation titres (F5) + filiation                  |
| Retraite                | budgetSynthese + revenus retraite estimés                            |

## 8. Contrat rail gauche

Sections (ordre canonique) :

- Dossier
- Situation familiale
- Filiation
- Régime matrimonial & donations
- Situation professionnelle
- Budget & capacité
- Sociétés / organigramme
- Patrimoine
- Actifs
- Passifs
- Fiscalité
- IFI (conditionnel)
- Succession
- Prévoyance
- Retraite
- Placements
- Objectifs
- Synthèse

Statuts (dimension de complétude, distincte de l'`availability` actuelle du `DossierRail`) :

- vide
- partiel
- complet
- à vérifier
- alerte
- masqué

Règles :

- Le statut ne dépend **jamais de la couleur seule** : glyphe + label obligatoires.
- IFI, Sociétés, Prévoyance et Retraite sont **conditionnels** (apparition / promotion selon les
  données du dossier).
- Le rail **signale** mais **ne bloque pas** la navigation : le CGP peut sauter une étape.

## 9. Contrat AuditDrawerXL

- Drawer **XL ancré à droite**.
- **Variante canonique de l'anatomie modale SER1**, pas une nouvelle famille CSS.
- Header clair.
- Menu interne gauche **optionnel** (rubriques).
- Corps central.
- Panneau **sources optionnel** à droite.
- Footer stable : `Annuler` (ghost) + `Enregistrer` (primary), destructif à gauche.
- Accessibilité : focus trap, `Escape`, retour focus, `role="dialog"`, `aria-modal`, titre accessible.
- **Aucune largeur locale.**
- UX-00b créera les classes canoniques (famille `sim-drawer` dans `src/styles/sim/modals.css`) et
  étendra `check:modal-canon` pour en faire la seule source de largeurs de drawer.

## 10. Contrat surfaces

Taxonomie à 4 niveaux :

- **Carte** : surface élevée (bordure + rayon + ombre), outil cadré ; **pas d'autre carte élevée à
  l'intérieur**.
- **Bande** : section interne sans élévation, séparée par espacement ou filet `--border-subtle`.
- **Ligne KPI** : label + valeur, typographique, sans cadre.
- **Micro-tuile plate** : fond `--surface-muted`, rayon léger, **sans ombre, sans bordure forte** ;
  autorisée dans une carte car non élevée.

Règle : **aucune surface avec ombre dans une surface avec ombre.**

## 11. Contrat organigramme société

- **V1 = rendu automatique depuis des liens structurés.** Pas de graphe libre drag-and-drop.
- Saisie via **drawer / table** (actions guidées : ajouter société / personne / lien) ; l'org-chart
  se redessine après chaque lien.
- Templates de départ : holding + exploitation ; SCI patrimoniale ; holding + plusieurs filiales.
- Liens : `% capital`, `% droits de vote`, démembrement `PP/US/NP`.
- Validation automatique : capital = 100 % ; droits de vote = 100 % si renseignés ; `NP + US = PP`
  cohérent ; personnes physiques / morales explicites.
- Clic sur une société → **drawer XL** (identité, associés, liens, dirigeant, statut TNS/assimilé,
  rémunération, dividendes, bilan, capitaux propres, réserves, résultat distribuable, immobilisations,
  immobilier détenu, emprunts, prévoyance/Madelin, documents sources).
- Le **modèle société/liens vit en F5** ; l'org-chart est un **rendu**, jamais une source parallèle.
- Alertes métier : dirigeant assimilé salarié → « statut TNS souvent moins coûteux, vérifier
  holding » ; travail en famille → « épargne salariale déployable ».
- **V2 éventuelle** : drag **uniquement pour réorganiser l'affichage**, jamais pour créer la donnée ;
  à ne lancer que si une vraie valeur est prouvée.

## 12. Contrat documents / preuves

- `/audit` n'est **pas une GED**.
- Les documents sont une **couche de preuve discrète**, adossée à `SourceRef` (F2).
- **SourceBadge** (en carte) : pastille discrète par valeur décisive — `source manquante` /
  `source reliée` / `validé` / `à vérifier`. La confiance n'y est jamais affichée.
- **SourcePanel** (en drawer, colonne droite optionnelle) : document, page, champ, valeur, statut de
  revue, et **confiance affichée uniquement pour `kind ∈ {scan, import}`**.
- Données manuelles : **statut seul** (manquante / reliée / validé / à vérifier), pas de confiance
  numérique.
- Données importées (futures) : confiance numérique + **validation CGP obligatoire avant usage
  moteur**.
- Upload, OCR, file de traitement et visionneuse de documents sont **hors scope** ici : ils relèvent
  de la roadmap documentaire (V2-14).

## 13. Pages métier prévues

| Page                           | Objectif                                    | Cartes prévues                                    | Drawers prévus                | Données nécessaires            | Dépendance      | État avant moteur                   |
| ------------------------------ | ------------------------------------------- | ------------------------------------------------- | ----------------------------- | ------------------------------ | --------------- | ----------------------------------- |
| Situation familiale            | Cadrer foyer et régime                      | Foyer, Régime                                     | Foyer                         | Foyer, régime matrimonial      | F1              | Disponible                          |
| Filiation                      | Visualiser la filiation                     | Org-chart familial, Liste des personnes           | Personne                      | Membres, liens                 | F1              | Disponible                          |
| Régime matrimonial & donations | Régime, clauses, donations antérieures      | Régime, Donations                                 | Donation                      | Régime, donations              | F1              | Disponible                          |
| Situation professionnelle      | Statut et revenus pro par personne          | Statut, Revenus pro                               | Situation pro                 | Membres, revenus               | F1 / F1.1       | Disponible (revenus via F1.1)       |
| Budget & capacité              | Train de vie et capacité d'épargne          | Revenus, Charges, Capacité d'épargne              | Budget                        | budgetSynthese                 | F1.1            | Synthèse seule ; détail = futur sim |
| Sociétés                       | Organigramme de détention et détail société | Organigramme, Cohérence                           | Société XL, Lien de détention | Sociétés, liens, bilans        | F5              | « à venir » avant F5                |
| Patrimoine                     | Vue net et allocation                       | Patrimoine net, Répartition, Allocation           | —                             | Actifs, passifs (F3)           | F3              | « à venir » avant F3                |
| Actifs                         | Inventaire par classe et détention          | Une carte par classe, Tableau 5 colonnes PP/US/NP | Actif                         | Actifs F3                      | F3              | « à venir » avant F3                |
| Passifs                        | Emprunts et garanties                       | Une carte par emprunt                             | Passif                        | Passifs F3                     | F3              | « à venir » avant F3                |
| Fiscalité                      | IR, PS, TMI, pistes                         | IR/PS, TMI, Revenus fonciers, Pistes              | Avis IR / Revenus             | IR + F1.1                      | IR / F1.1       | Disponible (IR existant)            |
| IFI                            | Qualifier l'assujettissement                | Assiette, Estimation (post-moteur), Leviers       | Biens IFI                     | Immobilier F3 + moteur IFI     | F3 + pilote IFI | « à qualifier / calcul à venir »    |
| Succession                     | Transmission nette et droits par héritier   | Transmission nette, Droits, Couverture            | Hypothèses (1er/2nd décès)    | Succession + DMTG              | F3 + succession | Partiel selon données               |
| Prévoyance                     | Besoins vs garanties                        | Besoin en capital, Incapacité/invalidité          | Contrat                       | Prévoyance + revenus + passifs | F3 + V2-10      | Partiel                             |
| Retraite                       | Revenus retraite vs objectif                | Retraite nette, Taux de remplacement              | Carrière / hypothèses         | Retraite + budgetSynthese      | F1.1 + retraite | « à venir » avant moteur            |
| Placements                     | Encours par enveloppe                       | Une carte par enveloppe                           | Contrat (ISIN, clause)        | Placements F3                  | F3              | « à venir » avant F3                |
| Objectifs                      | Hiérarchiser les objectifs                  | Liste hiérarchisée, Badges domaine                | Objectif                      | Objectifs F1                   | F1              | Disponible                          |
| Synthèse                       | Récapitulatif et top pistes                 | KPI, Complétude, Alertes, Radar miniature         | —                             | Agrégat dossier                | F1→F6           | Progressif                          |

## 14. Séquence PR

Le séquencement détaillé (objectif, hors scope, dépendances, DoD, checks) vit dans `docs/ROADMAP.md`,
section « Track UX Cockpit /audit ». Ici, seul l'ordre logique est rappelé :

1. **UX-00a** — Documents cockpit audit (cette PR).
2. **UX-00b** — Tokens, showroom, checks design system.
3. **UX-01** — Landing 3 cartes.
4. **UX-02** — Rail dynamique.
5. **F1.1** — budgetSynthese.
6. **UX-03** — famille / filiation / régime / objectifs.
7. **UX-03b** — budget & capacité.
8. **F2** — evidence.
9. **F3** — patrimoine PP/US/NP.
10. **UX-05** — patrimoine / actifs / passifs.
11. **UX-06a** — fiscalité / prévoyance / retraite.
12. **pilote IFI**.
13. **UX-06b** — IFI conditionnel.
14. **F5** — société / organigramme / bilans.
15. **UX-04** — sociétés / org-chart.
16. **F6** — scénarios / radar / versioning.
17. **UX-07** — pilotage réel.
18. **UX-08** — polish.

> `docs/AUDIT_COCKPIT.md` est le contrat produit/design ; `docs/ROADMAP.md` porte le séquencement. Ne
> pas créer de `docs/AUDIT_COCKPIT_ROADMAP.md`.

## 15. Dettes interdites

- Aucun score affiché sans `calculability = score`.
- Aucune couleur de graphe hors `--viz-*` / `--state-*`.
- Aucune largeur locale de carte, modale ou drawer.
- Aucune surface élevée dans une surface élevée.
- Aucun `confidence` numérique sur donnée manuelle.
- Aucune estimation IFI avant moteur IFI.
- Aucune piste sans donnée fondatrice.
- Aucune version active créée sur données bloquantes manquantes.
- Aucune règle design ouverte en UX-00b laissée non reverrouillée.
- Aucun second fichier roadmap concurrent.
- Aucune fausse donnée pour créer un effet visuel.

## 16. Questions restantes

- Vérifier techniquement, en UX-00b, la dérivation **accessible** de `--viz-*` depuis C1-C10
  (contraste, distinction des séries).
- Décider en UX-00b si une extension **C11-C14** est réellement nécessaire — uniquement si l'échec de
  la dérivation est prouvé, et par PR dédiée verrouillée par docs + showroom + checks.
- Définir le **niveau exact de tests visuels** pour UX-08.
- Cadrer le **moment** où un futur mode de présentation client devra être traité (vue, pas modèle de
  données).
