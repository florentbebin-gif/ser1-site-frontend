# SER1 — Contrat Cockpit Audit

## Rôle du document

`docs/AUDIT_COCKPIT.md` est le **contrat produit / design permanent** de la refonte de `/audit` en
cockpit patrimonial CGP. Il fige la vision, les principes, les contrats UX et les décisions design.

Ce document n'est **pas** une roadmap concurrente. Le **séquencement des PR** vit dans
`docs/ROADMAP.md` (track « UX Cockpit /audit »), qui reste la source unique de séquencement
(principe 14 de la roadmap : pas de roadmap concurrente).

Statut : **UX-00a fige le contrat documentaire.** UX-00a-bis ajoute les contrats d'implémentation
page par page. **UX-00b a verrouillé** les fondations design system de ce contrat — tokens `--viz-*`,
découplage `--state-warning` / `--accent-signature`, taxonomie des surfaces, drawer XL canonique —
avec leur preuve runtime dans `/settings/design-system` et les checks `css-colors` / `modal-canon` /
`sim-cards` étendus, sans coder les pages métier `/audit`. **UX-01 a livré** l'entrée `/audit` en
landing cockpit : Dossier patrimonial (complétude F1, données connues et manques), Objectifs,
Stratégie verrouillée et aperçus prospectifs clairement `à venir`, branchés en lecture réelle sur le
dossier F1 seulement, sans radar réel, score, patrimoine net ni scénario activable.

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

> UX-00a a fixé le contrat sans toucher aux tokens. **UX-00b a livré** les tokens `--viz-*` et le
> découplage `--state-warning` dans `src/styles/index.css`, le showroom `/settings/design-system` et
> l'extension de `tools/ser1-color-policy.mjs` (garde-fou `check:css-colors` sur les `--viz-*`).

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

La piste Épargne salariale reste un signal déterministe “à vérifier” : elle ne devient ni calcul,
ni recommandation, ni carte active tant que le moteur et les settings société correspondants ne sont
pas `ready`. La page Sociétés / organigramme consomme F5 et ne possède pas ses propres règles
société.

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
- UX-00b a créé les classes canoniques (famille `sim-drawer` dans `src/styles/sim/modals.css`) et
  étendu `check:modal-canon` pour en faire la seule source de largeurs de drawer.

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

## 14. Contrats d’implémentation par page /audit

Règles générales :

- Ces contrats ne remplacent pas `docs/ROADMAP.md`, qui reste la source unique du séquencement PR.
- Ces contrats ne rendent pas toutes les pages immédiatement codables : une page ne peut être
  implémentée que si ses dépendances fondations sont livrées.
- Une page `/audit` consomme le dossier central et les fondations ; elle ne possède aucune source de
  vérité propre. Le brouillon local/session est un état temporaire d'édition, pas une source métier
  durable ni un modèle concurrent.
- Les futurs écrans doivent nommer leur fondation et leur adapter dossier. Si l'adapter n'existe pas,
  la page reste `à venir` ou `gated F...`.
- Dans cette track, `F1.1 budgetSynthese` désigne le mini-jalon budget consommé par `/audit`. La
  roadmap générale mentionne aussi `F3bis` pour le modèle budgétaire central ; tant que cette
  convergence n'est pas livrée, les contrats `/audit` gardent la dépendance explicite
  `F1.1 budgetSynthese`.
- Les simulateurs existants servent de patterns métier, de présentation, de modales, de limites et de
  raisonnement, mais ne doivent pas être copiés ni branchés sans adapter dossier explicite.
- Toute donnée indisponible doit être affichée comme `inconnue`, `à compléter`, `à vérifier` ou
  `à venir`.
- Aucun faux KPI, radar, score, patrimoine net, IFI ou scénario ne doit être inventé pour rendre
  l'écran plus beau.

### Template contrat page

| Champ                                                 | Contrat                                                                                           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Page / section rail                                   | Nom stable de la page ou section du rail `/audit`.                                                |
| Objectif CGP                                          | Décision ou lecture métier que le conseiller doit pouvoir mener.                                  |
| Dépendances fondations                                | Fondations livrées requises ; état `gated F...` si elles manquent.                                |
| Source de vérité                                      | Dossier central, fondation, moteur ou output validé consommé ; jamais une source locale `/audit`. |
| View model attendu                                    | Agrégat de lecture attendu par la page, avec états et calculabilité.                              |
| Données lues                                          | Champs dossier, outputs moteur, `SourceRef` ou preuves consultés.                                 |
| Données éditables                                     | Champs que le drawer peut proposer au CGP ; `aucune` si lecture seule.                            |
| Écriture dossier                                      | Adapter ou mutation dossier attendu ; `aucune` si la fondation n'est pas livrée.                  |
| Drawers                                               | Drawers prévus, panneau sources optionnel, et responsabilités de chaque drawer.                   |
| SourceRefs / preuves                                  | Statut de preuve attendu ; confiance numérique seulement pour scan/import.                        |
| États vide / partiel / complet / à vérifier / à venir | États affichables et règle de bascule entre eux.                                                  |
| CTA primaires                                         | Action principale autorisée maintenant.                                                           |
| CTA secondaires                                       | Actions non bloquantes, lecture, navigation ou préparation.                                       |
| Simulateurs à auditer / réutiliser                    | Simulateurs à lire comme patterns, pas comme source de vérité.                                    |
| Patterns UI à reprendre                               | Surfaces, tableaux, drawers, warnings ou formatage réutilisables après adaptation.                |
| Interdits spécifiques                                 | Promesses, calculs ou raccourcis interdits pour cette page.                                       |
| Tests attendus                                        | Tests unitaires, intégration, smoke auth ou checks futurs attendus.                               |
| Hors-scope                                            | Ce que la PR d'implémentation ne doit pas embarquer.                                              |
| PR cible d'implémentation                             | PR roadmap qui doit porter le code.                                                               |

### Landing /audit - 3 cartes

| Champ                                                 | Contrat                                                                                                                                                                                            |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page / section rail                                   | Entrée `/audit` avec trois surfaces principales : Dossier patrimonial, Objectifs, Stratégie verrouillée, plus aperçus prospectifs non actifs.                                                      |
| Objectif CGP                                          | Voir rapidement le niveau de complétude F1, les objectifs connus et les zones stratégiques encore non calculables.                                                                                 |
| Dépendances fondations                                | `F1` + `UX-00b`. Livrable après `UX-00b`; les données stratégiques restent `à venir` tant que F6 manque.                                                                                           |
| Source de vérité                                      | `DossierPatrimonial` F1, complétude F1, objectifs, contraintes et opérations prévues disponibles.                                                                                                  |
| View model attendu                                    | `auditLandingViewModel` ou équivalent : état dossier, objectifs, TMI `à venir`, stratégie verrouillée, aucun radar réel.                                                                           |
| Données lues                                          | Foyer, situation familiale, régime matrimonial, donations synthétiques, objectifs, contraintes, opérations prévues, complétude F1.                                                                 |
| Données éditables                                     | Aucune édition directe sur la landing ; édition via pages/drawers dédiés.                                                                                                                          |
| Écriture dossier                                      | Aucune écriture depuis les cartes, hors navigation vers un drawer ou une page d'édition F1.                                                                                                        |
| Drawers                                               | Aucun drawer obligatoire ; liens possibles vers drawers F1 existants après UX-03.                                                                                                                  |
| SourceRefs / preuves                                  | Badges de provenance F1 si disponibles ; sinon état `source inconnue` sans confiance numérique.                                                                                                    |
| États vide / partiel / complet / à vérifier / à venir | `vide`, `partiel`, `complet F1`, TMI `à venir`, masses/société/versioning `à venir`, stratégie verrouillée.                                                                                        |
| CTA primaires                                         | Ouvrir/compléter le dossier F1 ; reprendre l'audit.                                                                                                                                                |
| CTA secondaires                                       | Voir objectifs ; voir manques ; afficher ce qui reste à livrer.                                                                                                                                    |
| Simulateurs à auditer / réutiliser                    | Aucun branchement simulateur. Lire seulement les patterns de cartes de synthèse des simulateurs actifs si utiles.                                                                                  |
| Patterns UI à reprendre                               | Cartes élevées sans carte imbriquée, micro-tuiles plates, badges d'état non portés par la couleur seule.                                                                                           |
| Interdits spécifiques                                 | Pas de radar réel, pas de faux patrimoine net, pas de score, pas de scénario activable, pas de mock métier trompeur.                                                                               |
| Tests attendus                                        | Smoke auth `/audit`, rendu états `vide`/`partiel`/`complet`, absence de faux radar réel.                                                                                                           |
| Hors-scope                                            | Branchement réel StrategyRadar, activation scénario, moteur F6, org-chart F5 et patrimoine F3. Les aperçus peuvent rester visibles s'ils sont `à venir`, non sources de vérité et non interactifs. |
| PR cible d'implémentation                             | `UX-01`.                                                                                                                                                                                           |

Jalons prospectifs conservés par UX-01 :

| Élément visible                         | Fichier / preuve UX-01                                                                               | Contrat d'honnêteté                                                           | PR cible / jalon |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------- |
| TMI                                     | `src/features/audit/auditLandingViewModel.ts` expose seulement `tmiLabel: 'à venir'`                 | Ne pas afficher de taux réel tant que la fiscalité IR/TMI n'est pas raccordée | UX-06a           |
| Masses successorales / patrimoine       | `src/features/audit/AuditLanding.tsx` rend un aperçu verrouillé `Masses successorales`               | Pas de droits, patrimoine net, IFI ou calcul successoral affiché en UX-01     | F3 puis UX-05    |
| Organigramme société                    | `src/features/audit/AuditLanding.tsx` rend un aperçu `Organigramme société`                          | Nœuds génériques uniquement ; aucun lien de détention réel avant F5           | F5 puis UX-04    |
| Versions & sauvegardes                  | `src/features/audit/AuditLanding.tsx` rend `Versions & sauvegardes` avec sauvegarde distante à venir | Pas de restauration/version active/scénario activable avant le versioning F6  | F6 puis UX-07    |
| Stratégie, recommandations et scénarios | `src/features/audit/AuditLanding.tsx` rend `Stratégie` avec libellé `Verrouillé`                     | Non cliquable, pas de radar réel, pas de score, pas de scénario activable     | F6 puis UX-07    |

### Rail dynamique /audit

| Champ                                                 | Contrat                                                                                                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Page / section rail                                   | Rail gauche `/audit`, sections affichables conditionnellement selon fondations disponibles.                                                      |
| Objectif CGP                                          | Comprendre sa position, l'état de chaque section, les manques et les sections `à venir`.                                                         |
| Dépendances fondations                                | `F1`. Les sections F2/F3/F5/F6 restent visibles seulement si le contrat produit les prévoit, avec état `à venir`.                                |
| Source de vérité                                      | `DossierPatrimonial`, `DossierVersion`, complétude, `SourceRef` minimal si disponible.                                                           |
| View model attendu                                    | View model rail centralisé : section, route/anchor, statut, manque, gated foundation, libellé accessible.                                        |
| Données lues                                          | Complétude F1, version active, état source minimal, disponibilité des fondations.                                                                |
| Données éditables                                     | Aucune.                                                                                                                                          |
| Écriture dossier                                      | Aucune.                                                                                                                                          |
| Drawers                                               | Aucun drawer ; le rail navigue vers les pages ou sections.                                                                                       |
| SourceRefs / preuves                                  | Peut afficher un manque de preuve, jamais une confiance numérique.                                                                               |
| États vide / partiel / complet / à vérifier / à venir | `vide`, `partiel`, `complet`, `à vérifier`, `à venir`, avec texte visible ; jamais couleur seule.                                                |
| CTA primaires                                         | Naviguer vers la section disponible.                                                                                                             |
| CTA secondaires                                       | Voir les manques ; revenir à la synthèse.                                                                                                        |
| Simulateurs à auditer / réutiliser                    | Aucun branchement ; vérifier le chaînage rail déjà utilisé par `/sim/*` sans dupliquer les routes.                                               |
| Patterns UI à reprendre                               | `DossierRail`, statuts textuels, puces/position, accessibilité clavier.                                                                          |
| Interdits spécifiques                                 | Pas de liste locale concurrente de routes/pages, pas de duplication de chaînage, pas de section active si fondation absente sans état `à venir`. |
| Tests attendus                                        | Tests du view model rail, statuts textuels, sections gated, absence de seconde liste de routes.                                                  |
| Hors-scope                                            | Création de nouvelles routes, changement `AppLayout`, réécriture du rail global.                                                                 |
| PR cible d'implémentation                             | `UX-02`.                                                                                                                                         |

### Foyer & famille et Objectifs F1

État runtime : UX-03a a remplacé le wizard legacy par une expérience cockpit unique. `Foyer &
famille` est une page en 4 cartes F1 (situation familiale, filiation, régime matrimonial &
donations, situation professionnelle) ; `Objectifs` est une page séparée en fin de parcours. Les
deux pages utilisent le rail gauche, la topbar, la barre d'état et `AuditDrawerXL`, sans navigation
horizontale d'étapes.

| Champ                                                 | Contrat                                                                                                                                                        |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page / section rail                                   | Pages cockpit : `Foyer & famille` puis `Objectifs`, sans wizard horizontal ni sidebar locale concurrente.                                                      |
| Objectif CGP                                          | Stabiliser les données familiales et les objectifs qui conditionnent la suite de l'audit.                                                                      |
| Dépendances fondations                                | `F1` + `UX-00b`. Livrable après `UX-00b` si les drawers écrivent via adapter F1.                                                                               |
| Source de vérité                                      | `DossierPatrimonial` F1.                                                                                                                                       |
| View model attendu                                    | Agrégat F1 : membres, liens, régime, donations synthétiques, profession, objectifs et états de complétude.                                                     |
| Données lues                                          | Identité foyer, membres, personnes liées, régime matrimonial, donations synthétiques, profession, objectifs, contraintes, opérations prévues, `sourceRefs` F1. |
| Données éditables                                     | Membre foyer, enfant/personne liée, régime matrimonial, donation synthétique, profession, objectif/contrainte/opération prévue.                                |
| Écriture dossier                                      | Save via adapter F1 ; pas de modèle famille local concurrent.                                                                                                  |
| Drawers                                               | Membre foyer ; enfant/personne liée ; régime matrimonial ; donation synthétique ; profession ; objectif/contrainte/opération prévue.                           |
| SourceRefs / preuves                                  | Statut source par valeur structurante si disponible ; donnée manuelle = statut seul.                                                                           |
| États vide / partiel / complet / à vérifier / à venir | `vide`, `à compléter`, `partiel`, `complet F1`, `à vérifier` si source ou cohérence incertaine.                                                                |
| CTA primaires                                         | Ajouter/éditer une personne, un régime, une donation, une profession ou un objectif.                                                                           |
| CTA secondaires                                       | Voir les alertes de cohérence ; accéder aux pages Succession/Prévoyance quand disponibles.                                                                     |
| Simulateurs à auditer / réutiliser                    | `/sim/succession` pour filiation, donations, régime, warnings et modales ; `/sim/prevoyance` pour personnes à protéger si pertinent.                           |
| Patterns UI à reprendre                               | Warnings succession, modales structurées, listes de personnes, badges de relation.                                                                             |
| Interdits spécifiques                                 | Pas de liquidation successorale exhaustive, pas de reconstitution notariale complète, pas de duplication d'un modèle famille local.                            |
| Tests attendus                                        | Lecture dossier F1, édition via drawer, sauvegarde dossier, états `à compléter`/`à vérifier`.                                                                  |
| Hors-scope                                            | Moteur succession complet, calcul de droits, vue client, scan documentaire.                                                                                    |
| PR cible d'implémentation                             | `UX-03a.1` et `UX-03a.4` livrés ; extensions F1 futures à rattacher ici sans recréer de wizard.                                                                |

### Budget & capacité

| Champ                                                 | Contrat                                                                                                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Page / section rail                                   | Page Budget & capacité.                                                                                                                         |
| Objectif CGP                                          | Lire la synthèse revenus/charges/train de vie/capacité d'épargne sans promettre un budget détaillé.                                             |
| Dépendances fondations                                | `F1.1 budgetSynthese`. `Gated F1.1` tant que la synthèse budget n'est pas livrée.                                                               |
| Source de vérité                                      | `budgetSynthese`, pas le détail mensuel exhaustif.                                                                                              |
| View model attendu                                    | Synthèse budget : revenus agrégés, charges agrégées, train de vie, capacité d'épargne, complétude et provenance.                                |
| Données lues                                          | Revenus agrégés, charges agrégées, train de vie, capacité d'épargne, `sourceRefs` si disponibles.                                               |
| Données éditables                                     | Champs de synthèse F1.1 uniquement ; aucun détail mensuel si non prévu par F1.1.                                                                |
| Écriture dossier                                      | Adapter budget F1.1 ; pas de passage silencieux d'un défaut métier au moteur.                                                                   |
| Drawers                                               | Drawer synthèse budget : revenus agrégés, charges agrégées, train de vie, capacité d'épargne, sources.                                          |
| SourceRefs / preuves                                  | Source par agrégat si disponible ; `source inconnue` sinon ; confiance numérique seulement scan/import.                                         |
| États vide / partiel / complet / à vérifier / à venir | `à venir` avant F1.1, puis `vide`, `partiel`, `complet`, `à vérifier`.                                                                          |
| CTA primaires                                         | Compléter la synthèse budget F1.1.                                                                                                              |
| CTA secondaires                                       | Voir provenance ; ouvrir simulateur pattern seulement en navigation séparée si disponible.                                                      |
| Simulateurs à auditer / réutiliser                    | `/sim/ir` pour revenus/fiscalité ; `/sim/per` pour capacité retraite ; `/sim/placement` pour effort d'épargne ; `/sim/credit` pour mensualités. |
| Patterns UI à reprendre                               | Format montants, lignes KPI, warnings de mensualité/capacité, champs montant via primitives adaptées en code futur.                             |
| Interdits spécifiques                                 | Pas de budget mensuel détaillé si non prévu par F1.1, pas de capacité inventée, pas de défaut métier transmis silencieusement au moteur.        |
| Tests attendus                                        | Affichage synthèse, états incomplets, format montants, provenance.                                                                              |
| Hors-scope                                            | Moteur de budget mensuel, catégorisation bancaire, import OCR, projection retraite.                                                             |
| PR cible d'implémentation                             | `UX-03b`.                                                                                                                                       |

### Documents / preuves

| Champ                                                 | Contrat                                                                                                                                 |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Page / section rail                                   | Couche Documents / preuves et panneau source optionnel dans les drawers.                                                                |
| Objectif CGP                                          | Relier les valeurs décisives à une preuve sans transformer `/audit` en GED.                                                             |
| Dépendances fondations                                | `F2 evidence`. Les futures UX consommatrices restent gated tant que F2 manque.                                                          |
| Source de vérité                                      | `SourceRef` / evidence.                                                                                                                 |
| View model attendu                                    | Statut source par champ : source manquante, source reliée, validé, à vérifier, rejeté si F2 le prévoit.                                 |
| Données lues                                          | Document, page, extrait, champ, valeur, statut de revue, type de source, confiance scan/import si disponible.                           |
| Données éditables                                     | Statut de revue et liaison source si F2 le livre ; aucune extraction moteur sans validation CGP.                                        |
| Écriture dossier                                      | Mutation F2/evidence ou adapter SourceRef ; aucun champ non validé ne devient hypothèse moteur silencieuse.                             |
| Drawers                                               | Panneau source optionnel : document, page, extrait, champ, statut de revue ; drawer document futur si F2 le prévoit.                    |
| SourceRefs / preuves                                  | Donnée manuelle = statut seul ; confiance numérique uniquement pour scan/import.                                                        |
| États vide / partiel / complet / à vérifier / à venir | `source manquante`, `source reliée`, `validé`, `à vérifier`, `à venir` avant F2.                                                        |
| CTA primaires                                         | Valider ou marquer `à vérifier` une source quand F2 est livré.                                                                          |
| CTA secondaires                                       | Voir source, rejeter une extraction, demander pièce complémentaire si le workflow documentaire le prévoit.                              |
| Simulateurs à auditer / réutiliser                    | Aucun simulateur comme source ; auditer seulement les patterns de badges provenance s'ils existent.                                     |
| Patterns UI à reprendre                               | SourceBadge, panneau latéral, statuts textuels, filets discrets.                                                                        |
| Interdits spécifiques                                 | `/audit` ne devient pas une GED, pas d'upload/OCR dans UX-00a-bis, pas de champ extrait utilisé comme hypothèse moteur sans validation. |
| Tests attendus                                        | Statut source, `reviewStatus`, validation/rejet, aucun champ non validé consommé silencieusement.                                       |
| Hors-scope                                            | Upload, OCR, file de traitement, visionneuse complète, moteur documentaire.                                                             |
| PR cible d'implémentation                             | `F2`, puis futures PR UX consommatrices.                                                                                                |

### Patrimoine / actifs / passifs

État runtime : UX-03a.2 livre déjà une page cockpit `Actifs / passifs` minimaliste. Elle porte un
inventaire déclaratif et des états honnêtes (`inventaire saisi`, `données partielles`, `à structurer
F3`) sans afficher patrimoine net, droits PP/US/NP, droits successoraux ou graphe patrimonial. Le
contrat ci-dessous reste la cible **F3 réelle** qui remplacera cet inventaire déclaratif quand le
graphe central sera disponible.

| Champ                                                 | Contrat                                                                                                                                            |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page / section rail                                   | Patrimoine, actifs, passifs.                                                                                                                       |
| Objectif CGP                                          | Lire les actifs/passifs, leurs détenteurs et droits sans recalcul local concurrent.                                                                |
| Dépendances fondations                                | `F3`. `Gated F3` tant que le graphe actifs/passifs PP/US/NP manque.                                                                                |
| Source de vérité                                      | Graphe actifs/passifs PP/US/NP.                                                                                                                    |
| View model attendu                                    | Tableau actifs/passifs avec détenteurs, droits PP/US/NP, valorisation, sourceRefs et patrimoine net seulement si calculable par F3.                |
| Données lues                                          | Actifs, passifs, détenteurs, droits PP/US/NP, valorisation, sourceRefs, patrimoine net si calculable.                                              |
| Données éditables                                     | Actif/passif via drawer seulement après F3 ; aucune carte autonome Home simplifiée.                                                                |
| Écriture dossier                                      | Adapter F3 ; pas de patrimoine net local recalculé hors modèle F3.                                                                                 |
| Drawers                                               | Actif, passif, détenteur/droits, source.                                                                                                           |
| SourceRefs / preuves                                  | Source de valorisation et preuve de détention si disponibles ; `à vérifier` sinon.                                                                 |
| États vide / partiel / complet / à vérifier / à venir | `à venir` avant F3, puis `vide`, `partiel`, `complet`, `à vérifier` pour valorisation/droits.                                                      |
| CTA primaires                                         | Compléter actif/passif quand F3 est livré.                                                                                                         |
| CTA secondaires                                       | Voir droits PP/US/NP ; voir provenance ; naviguer vers simulateurs patterns.                                                                       |
| Simulateurs à auditer / réutiliser                    | `/sim/placement`, `/sim/credit`, `/sim/succession`, `/sim/tresorerie-societe` avec prudence pour les actifs société.                               |
| Patterns UI à reprendre                               | Tableaux patrimoniaux, format montants, warnings crédit/succession, tableau 5 colonnes PP/US/NP ou équivalent décrit ici.                          |
| Interdits spécifiques                                 | Pas de patrimoine net local recalculé hors F3, pas de classes d'actifs inventées, pas d'actif/passif interne comme carte Home simplifiée autonome. |
| Tests attendus                                        | Lecture F3, droits PP/US/NP, actifs/passifs manquants, sourceRefs.                                                                                 |
| Hors-scope                                            | Moteur allocation, IFI, cession société, import bancaire, calcul successoral complet.                                                              |
| PR cible d'implémentation                             | `UX-05`.                                                                                                                                           |

### Fiscalité / IR / IFI conditionnel

État runtime : UX-03a.3 livre déjà une page cockpit `Fiscalité` déclarative. Elle qualifie les
données fiscales connues et les points à confirmer sans calculer l'IR depuis `/audit`, sans TMI
calculée, sans optimisation réelle et sans hardcode fiscal. Le contrat ci-dessous décrit la cible
fiscalité calculée, conditionnée par les moteurs et fondations concernés.

| Champ                                                 | Contrat                                                                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Page / section rail                                   | Fiscalité, IR, IFI conditionnel.                                                                                                       |
| Objectif CGP                                          | Lire les sorties fiscales réelles disponibles et qualifier l'IFI sans estimation avant moteur.                                         |
| Dépendances fondations                                | `UX-06a` : F3 + moteurs réels disponibles selon périmètre. `UX-06b` : pilote IFI livré.                                                |
| Source de vérité                                      | `DossierPatrimonial`, settings fiscaux via chaîne fiscale, outputs moteurs.                                                            |
| View model attendu                                    | États IR calculable/non calculable, IFI à qualifier avant moteur, IFI calculé seulement après pilote IFI.                              |
| Données lues                                          | Situation familiale, revenus, parts, outputs IR/PS/TMI si disponibles, actifs F3 pour qualification IFI, settings fiscaux centralisés. |
| Données éditables                                     | Aucune règle fiscale ; corrections de données dossier seulement via drawers dédiés.                                                    |
| Écriture dossier                                      | Aucune écriture fiscale directe ; les settings fiscaux restent dans la chaîne fiscale.                                                 |
| Drawers                                               | Drawer lecture fiscale/provenance ; lien vers données dossier bloquantes.                                                              |
| SourceRefs / preuves                                  | Sources de revenus/avis IR si F2 disponible ; aucune confiance numérique sur saisie manuelle.                                          |
| États vide / partiel / complet / à vérifier / à venir | IR disponible si données suffisantes ; IFI `à qualifier` avant moteur ; IFI calculé seulement après pilote.                            |
| CTA primaires                                         | Compléter les données bloquantes ; lancer/ouvrir le moteur réel si disponible.                                                         |
| CTA secondaires                                       | Voir limites ; ouvrir `/sim/ir` comme simulateur autonome.                                                                             |
| Simulateurs à auditer / réutiliser                    | `/sim/ir`; futur pilote IFI.                                                                                                           |
| Patterns UI à reprendre                               | Warnings fiscaux, format montants/taux, exposition des hypothèses et limites moteur.                                                   |
| Interdits spécifiques                                 | Aucun hardcode fiscal, aucune estimation IFI avant moteur, aucun `IFI estimé` sans calcul réel, source et limites.                     |
| Tests attendus                                        | Absence hardcodes, états `à venir`, consommation outputs moteur.                                                                       |
| Hors-scope                                            | Création moteur IFI, modification settings fiscaux, duplication règles fiscales dans l'UI.                                             |
| PR cible d'implémentation                             | `UX-06a`, puis `UX-06b` après pilote IFI.                                                                                              |

### Prévoyance

| Champ                                                 | Contrat                                                                                                         |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Page / section rail                                   | Prévoyance.                                                                                                     |
| Objectif CGP                                          | Identifier les contrats et alertes déterministes sans recommandation prescriptive.                              |
| Dépendances fondations                                | F3 et rattachement `/sim/prevoyance` ou données contrats structurées.                                           |
| Source de vérité                                      | `DossierPatrimonial` + contrats prévoyance structurés si disponibles.                                           |
| View model attendu                                    | État contrats, personnes à protéger, dettes à couvrir, alertes déterministes calculables.                       |
| Données lues                                          | Famille F1, revenus F1.1 si disponibles, passifs F3, contrats prévoyance structurés, sourceRefs.                |
| Données éditables                                     | Contrats prévoyance seulement si le modèle structuré existe ; sinon état `à venir`.                             |
| Écriture dossier                                      | Adapter contrats prévoyance futur ; aucune estimation locale durable.                                           |
| Drawers                                               | Contrat prévoyance, personne protégée, source.                                                                  |
| SourceRefs / preuves                                  | Statut source contrat ; `à vérifier` si garantie ou bénéficiaire incomplet.                                     |
| États vide / partiel / complet / à vérifier / à venir | Sans contrat, contrats incomplets, contrats structurés, alertes déterministes, `à venir` si données manquantes. |
| CTA primaires                                         | Compléter contrat ou données bloquantes quand le modèle existe.                                                 |
| CTA secondaires                                       | Voir dettes/famille liées ; ouvrir simulateur prévoyance autonome.                                              |
| Simulateurs à auditer / réutiliser                    | `/sim/prevoyance`; `/sim/credit` pour dettes à couvrir ; `/sim/succession` pour protection familiale.           |
| Patterns UI à reprendre                               | Alertes, limites, contrats, personnes à protéger.                                                               |
| Interdits spécifiques                                 | Pas de besoin de couverture calculé sans revenus/dettes/famille suffisants, pas de recommandation prescriptive. |
| Tests attendus                                        | États sans contrat, contrats incomplets, alertes déterministes.                                                 |
| Hors-scope                                            | Moteur de recommandation, conseil automatique, reprise non adaptée des hypothèses du simulateur.                |
| PR cible d'implémentation                             | `UX-06a` ou PR dédiée selon roadmap.                                                                            |

### Retraite / PER

| Champ                                                 | Contrat                                                                                                                                                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page / section rail                                   | Retraite / PER.                                                                                                                                                                                 |
| Objectif CGP                                          | Lire les données retraite et outputs PER/rente seulement quand ils existent et sont rattachés au dossier.                                                                                       |
| Dépendances fondations                                | `F1.1` + `V2-08`/rattachement.                                                                                                                                                                  |
| Source de vérité                                      | `budgetSynthese`, données retraite, outputs PER/retraite.                                                                                                                                       |
| View model attendu                                    | État insuffisant ou outputs réels, provenance, hypothèses explicites.                                                                                                                           |
| Données lues                                          | Capacité d'épargne, revenus, données retraite, outputs PER/retraite, fiscalité IR si disponible.                                                                                                |
| Données éditables                                     | Données retraite structurées si modèle livré ; sinon aucune.                                                                                                                                    |
| Écriture dossier                                      | Adapter retraite/PER ; les hypothèses locales PER ne deviennent pas vérité dossier sans adapter.                                                                                                |
| Drawers                                               | Données retraite, hypothèses, source, output moteur si disponible.                                                                                                                              |
| SourceRefs / preuves                                  | Source de revenu/retraite ; statut seul pour saisie manuelle.                                                                                                                                   |
| États vide / partiel / complet / à vérifier / à venir | Données insuffisantes, outputs réels, `à venir` si moteur/rattachement absent.                                                                                                                  |
| CTA primaires                                         | Compléter données retraite ou ouvrir output moteur disponible.                                                                                                                                  |
| CTA secondaires                                       | Naviguer vers PER autonome ; voir limites.                                                                                                                                                      |
| Simulateurs à auditer / réutiliser                    | `/sim/per`, `/sim/ir`, `/sim/placement`.                                                                                                                                                        |
| Patterns UI à reprendre                               | Hypothèses PER, format rente/capital, limites moteur, warnings fiscaux.                                                                                                                         |
| Interdits spécifiques                                 | Pas de revenu futur sécurisé inventé, pas de projection retraite sans moteur ou données explicitement insuffisantes, pas de reprise d'hypothèses PER locales comme vérité dossier sans adapter. |
| Tests attendus                                        | États insuffisants, outputs réels vs `à venir`, provenance.                                                                                                                                     |
| Hors-scope                                            | Création moteur retraite, conseil PER prescriptif, modification chaîne fiscale.                                                                                                                 |
| PR cible d'implémentation                             | `UX-06a` ou rattachement `V2-08`.                                                                                                                                                               |

### Placement / allocation

| Champ                                                 | Contrat                                                                                                                                |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Page / section rail                                   | Placement / allocation.                                                                                                                |
| Objectif CGP                                          | Lire les actifs financiers et leur lien avec objectifs/horizon/capacité sans recommander automatiquement une allocation.               |
| Dépendances fondations                                | F3 + V2-09.                                                                                                                            |
| Source de vérité                                      | Actifs financiers, enveloppes, objectifs, horizon, capacité d'épargne.                                                                 |
| View model attendu                                    | Répartition lisible, état partiel, lien objectifs, calculabilité des indicateurs.                                                      |
| Données lues                                          | Actifs financiers F3, enveloppes, objectifs F1, horizon, budgetSynthese, sourceRefs.                                                   |
| Données éditables                                     | Actif/enveloppe via F3 ; objectifs via F1 ; pas d'allocation cible automatique.                                                        |
| Écriture dossier                                      | Adapter F3/V2-09 ; aucune vérité allocation locale.                                                                                    |
| Drawers                                               | Actif financier, enveloppe, objectif lié, source.                                                                                      |
| SourceRefs / preuves                                  | Source de valorisation/enveloppe ; `à vérifier` si donnée incomplète.                                                                  |
| États vide / partiel / complet / à vérifier / à venir | `à venir` avant F3/V2-09, puis `partiel`, `complet`, `à vérifier`.                                                                     |
| CTA primaires                                         | Compléter actifs financiers ou objectifs.                                                                                              |
| CTA secondaires                                       | Voir simulateur Placement autonome ; voir limites.                                                                                     |
| Simulateurs à auditer / réutiliser                    | `/sim/placement`, `/sim/per`, `/sim/succession`.                                                                                       |
| Patterns UI à reprendre                               | Répartition, enveloppes, objectifs, warnings de limites.                                                                               |
| Interdits spécifiques                                 | Pas de recommandation d'allocation automatique, pas de score `patrimoine productif` sans calculabilité, pas de fausse diversification. |
| Tests attendus                                        | Lecture actifs financiers, état partiel, lien objectifs.                                                                               |
| Hors-scope                                            | Robo-advisor, allocation cible automatique, arbitrage prescriptif.                                                                     |
| PR cible d'implémentation                             | Après F3 / rattachement V2-09.                                                                                                         |

### Sociétés / organigramme

| Champ                                                 | Contrat                                                                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Page / section rail                                   | Sociétés / organigramme.                                                                                                                                     |
| Objectif CGP                                          | Visualiser la détention société depuis un modèle structuré, puis éditer les données en drawer/table.                                                         |
| Dépendances fondations                                | `F5`. `Gated F5` tant que le modèle société/liens n'est pas livré.                                                                                           |
| Source de vérité                                      | Modèle société/liens F5.                                                                                                                                     |
| View model attendu                                    | Org-chart rendu automatiquement depuis F5, table liens capital/droits de vote/PP/US/NP, validations.                                                         |
| Données lues                                          | Sociétés, associés, liens capital, droits de vote, PP/US/NP, CCA, filiales, emprunts si F5 les porte.                                                        |
| Données éditables                                     | Société, associé/lien de détention, droits, source, uniquement via modèle F5.                                                                                |
| Écriture dossier                                      | Adapter F5 ; org-chart rendu, jamais source de données.                                                                                                      |
| Drawers                                               | Société, lien de détention, associé, source.                                                                                                                 |
| SourceRefs / preuves                                  | Source statuts/Kbis/table de capitalisation si disponible ; `à vérifier` sinon.                                                                              |
| États vide / partiel / complet / à vérifier / à venir | `à venir` avant F5, puis `vide`, `partiel`, `complet`, `à vérifier`.                                                                                         |
| CTA primaires                                         | Ajouter/éditer société ou lien quand F5 existe.                                                                                                              |
| CTA secondaires                                       | Voir incohérences capital/droits ; ouvrir simulateur trésorerie société autonome.                                                                            |
| Simulateurs à auditer / réutiliser                    | `/sim/tresorerie-societe`, uniquement pour patterns société, associés, CCA, filiales, emprunts, allocation, modales et limites.                              |
| Patterns UI à reprendre                               | Table associés, modales société, warnings de cohérence, limites métier.                                                                                      |
| Interdits spécifiques                                 | Org-chart jamais source de vérité, pas de drag-and-drop créateur de donnée, pas de duplication de modèle société local, pas de cession/holding/OBO inventés. |
| Tests attendus                                        | Validation capital 100 %, droits de vote, rendu depuis modèle F5, drawer société.                                                                            |
| Hors-scope                                            | Moteur holding/OBO, cession, drag-and-drop créateur de données, calcul bilanciel non livré.                                                                  |
| PR cible d'implémentation                             | `UX-04`.                                                                                                                                                     |

### Pilotage stratégique réel : radar / pistes / versioning

| Champ                                                 | Contrat                                                                                                                                       |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Page / section rail                                   | Pilotage stratégique réel : radar, pistes, versioning.                                                                                        |
| Objectif CGP                                          | Voir les arbitrages calculables, les pistes déterministes et activer une version seulement quand les bloquants sont levés.                    |
| Dépendances fondations                                | `F6` + `F1.1` + `F3`. `Gated F6` tant que scénarios/recommandations/activation manquent.                                                      |
| Source de vérité                                      | `DossierVersion`, `StrategyActivation`, outputs moteurs, calculabilité par axe.                                                               |
| View model attendu                                    | Radar sans score global, axes verrouillés, calculabilité affichée, pistes déterministes, activation/rollback versionnés.                      |
| Données lues                                          | Versions dossier, outputs moteurs, F1/F1.1/F3/F5 selon axe, bloquants, données fondatrices citées.                                            |
| Données éditables                                     | Aucune donnée métier directe ; activation crée une nouvelle version active si conditions réunies.                                             |
| Écriture dossier                                      | Activation F6 : nouvelle version active, ancienne archivée, rollback possible ; aucune activation sur bloquants.                              |
| Drawers                                               | Détail axe, piste, activation, rollback, source.                                                                                              |
| SourceRefs / preuves                                  | Chaque piste cite une donnée fondatrice ; aucune piste sans preuve ou donnée.                                                                 |
| États vide / partiel / complet / à vérifier / à venir | Axe insuffisant hachuré ou explicitement indisponible, calculable, à vérifier, activable, bloqué.                                             |
| CTA primaires                                         | Activer une stratégie seulement sans bloquants ; revenir à une version archivée.                                                              |
| CTA secondaires                                       | Voir calculabilité, voir piste, voir données fondatrices.                                                                                     |
| Simulateurs à auditer / réutiliser                    | `/sim/ir`, `/sim/succession`, `/sim/per`, `/sim/placement`, `/sim/credit`, `/sim/prevoyance`, `/sim/tresorerie-societe` selon F5.             |
| Patterns UI à reprendre                               | Warnings, exposition d'hypothèses, comparaison actuelle/scénario, wording neutre.                                                             |
| Interdits spécifiques                                 | Pas de recommandation IA, pas de `SER1 conseille`, pas de score si données insuffisantes, pas de version active créée sur données bloquantes. |
| Tests attendus                                        | Calculability, pistes sans donnée fondatrice interdites, activation, rollback, états insuffisants.                                            |
| Hors-scope                                            | IA prescriptive, score global, activation hors F6, contournement des moteurs.                                                                 |
| PR cible d'implémentation                             | `UX-07`.                                                                                                                                      |

### Réutilisation des simulateurs existants

Les simulateurs existants sont des sources de patterns, pas des sources de vérité `/audit`.

| Domaine / page `/audit`             | Simulateurs à auditer     |
| ----------------------------------- | ------------------------- |
| Fiscalité                           | `/sim/ir`                 |
| Succession / famille / transmission | `/sim/succession`         |
| Budget / dette                      | `/sim/credit`             |
| Retraite                            | `/sim/per`                |
| Placement                           | `/sim/placement`          |
| Prévoyance                          | `/sim/prevoyance`         |
| Société                             | `/sim/tresorerie-societe` |

Pour chaque simulateur, le LLM futur doit relever :

- composants utiles ;
- modales utiles ;
- formatage ;
- warnings ;
- hypothèses et limites ;
- outputs réellement calculés ;
- limites métier ;
- tests existants.

Interdits :

- copier-coller une logique de simulateur dans `/audit` ;
- brancher un simulateur sans adapter dossier ;
- considérer un simulateur actif comme preuve que la page cockpit correspondante est livrable ;
- exposer un simulateur `planned` comme carte active ou donnée disponible.

## 15. Séquence PR

Le séquencement détaillé (objectif, hors scope, dépendances, DoD, checks) vit dans `docs/ROADMAP.md`,
section « Track UX Cockpit /audit ». Ici, seul l'ordre logique est rappelé :

1. **UX-00a** — Documents cockpit audit (contrat produit/design initial).
2. **UX-00a-bis** — Contrats d'implémentation page par page `/audit`.
3. **UX-00b** — Tokens, showroom, checks design system.
4. **UX-01** — Landing 3 cartes.
5. **UX-02** — Rail dynamique.
6. **F1.1** — budgetSynthese.
7. **UX-03** — famille / filiation / régime / objectifs.
8. **UX-03b** — budget & capacité.
9. **F2** — evidence.
10. **F3** — patrimoine PP/US/NP.
11. **UX-05** — patrimoine / actifs / passifs.
12. **UX-06a** — fiscalité / prévoyance / retraite.
13. **pilote IFI**.
14. **UX-06b** — IFI conditionnel.
15. **F5** — société / organigramme / bilans.
16. **UX-04** — sociétés / org-chart.
17. **F6** — scénarios / radar / versioning.
18. **UX-07** — pilotage réel.
19. **UX-08** — polish.

> `docs/AUDIT_COCKPIT.md` est le contrat produit/design ; `docs/ROADMAP.md` porte le séquencement. Ne
> pas créer de `docs/AUDIT_COCKPIT_ROADMAP.md`.

## 16. Dettes interdites

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

## 17. Questions restantes

- UX-00b a livré une dérivation `--viz-*` depuis C1-C10 (séries, radar, rampe), prouvée dans le
  showroom. Reste ouvert : un **audit de contraste / distinction** formel des 8 séries catégorielles
  sur la palette par défaut et les thèmes personnalisés (non bloquant pour UX-00b).
- Extension **C11-C14** : **non nécessaire** à ce stade (la dérivation suffit). À ne rouvrir que si
  l'audit ci-dessus prouve l'insuffisance, par PR dédiée verrouillée par docs + showroom + checks.
- Définir le **niveau exact de tests visuels** pour UX-08.
- Cadrer le **moment** où un futur mode de présentation client devra être traité (vue, pas modèle de
  données).
