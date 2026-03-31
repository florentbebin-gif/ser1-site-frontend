# Plan de refonte visuelle — PER

## Objet

Ce document cadre la refonte visuelle de `/sim/per` et `/sim/per/potentiel`.

Deux références doivent être conciliées :
- le standard web SER1 déjà stabilisé sur `Home`, `/sim/credit`, `/sim/placement`, `/sim/ir`, `/sim/succession`
- la pédagogie spatiale du classeur Excel PER 2025

La cible n'est pas de reproduire le look Excel. La cible est de récupérer sa lisibilité, sa progression et sa restitution, tout en restant strictement dans la gouvernance visuelle du repo.

## Audit comparatif

### Références web SER1

- `Home` :
  hero centré, hiérarchie très claire, respiration forte, carte principale puis carte secondaire de tuiles.
- `/sim/credit` :
  baseline la plus normative pour un simulateur : header premium, grille `1.85fr / 1fr`, colonne droite sticky, cartes guide à gauche, cartes de synthèse à droite.
- `/sim/placement` :
  très bon usage du rail de phases, des cartes guide avec header dégradé subtil, et d'une structure stable à travers les écrans.
- `/sim/ir` :
  meilleur exemple pour un simulateur fiscal dense : tables lisibles, séparation des groupes, carte de synthèse forte, hiérarchie visuelle claire.
- `/sim/succession` :
  bon usage des hero cards de synthèse, de la verticalité des blocs, et d'une page qui reste lisible malgré une forte densité métier.

### Constats sur le PER actuel

- landing `/sim/per` :
  fonctionnelle, mais plus proche d'une grille de cartes standard que de la grammaire visuelle de `Home`
- `/sim/per/potentiel` :
  utilise encore un sous-système local (`per-page`, `per-card`, `per-fields`, `per-btn`) au lieu de reposer d'abord sur `sim-page`, `premium-header`, `premium-card`, `premium-card--guide`
- l'étape actuelle raconte peu le parcours :
  elle montre des champs, mais n'oriente pas assez l'utilisateur dans la logique `document -> situation -> calcul -> restitution`
- la synthèse actuelle empile plusieurs cartes homogènes :
  elle ne distingue pas assez ce qui est "résultat principal", "preuve déclarative" et "contexte de calcul"

## Points forts des captures Excel

### Marqueurs visuels

- rail latéral fixe avec état actif très visible
- grand titre de page unique
- large surface blanche centrale presque vide hors zones utiles
- séquences très stables d'un écran à l'autre
- comparaison constante `Déclarant 1 / Déclarant 2`
- cartouches de synthèse compacts
- repères métier immédiats :
  `PASS`, `Estimation IR`, `Potentiel Madelin`, aperçu d'avis d'impôt

### Points pédagogiques à conserver

- un écran = une question métier dominante
- la progression reste explicite même quand la page est simple
- la page de saisie montre déjà la conséquence métier dans des blocs compacts
- les synthèses sont des pages de restitution déclarative, pas seulement des dashboards de KPI
- le visuel sépare bien :
  entrée utilisateur, calcul fiscal, restitution déclaration, contexte documentaire

## Cible visuelle

### Landing `/sim/per`

- conserver `Home` comme référence stylistique
- une carte hero principale pour `Contrôle du potentiel épargne retraite`
- un bloc secondaire pour `Transfert` et `Ouverture`
- garder les trois entrées visibles, mais établir une hiérarchie nette entre le simulateur actif et les deux prochains

### Simulateur `/sim/per/potentiel`

- adopter le shell `/sim/*` :
  `sim-page`, `premium-header`, grille desktop `1.85fr / 1fr`
- remplacer le stepper actuel par un vrai rail de parcours PER
- garder une colonne droite sticky dédiée aux repères et à la synthèse contextuelle
- transformer chaque étape en page guidée avec :
  une carte guide principale à gauche,
  un ou deux panneaux d'aide/résultat à droite

### Écrans à produire

- `Mode`
  page très simple, avec décision principale + orientation sur les documents disponibles
- `Avis IR`
  saisie des reports + panneau d'aide expliquant où lire l'avis
- `Déclaration / Estimation`
  grille structurée `foyer`, `estimation IR`, `versements retraite`, `déclarants`
- `Synthèse N-1`
  restitution 2042 + PASS + Madelin + reconstitution du plafond
- `Synthèse N`
  synthèse forte avec résultat principal, potentiel disponible, mutualisation, impact du versement

## Plan d'implémentation

### Lot 1

- documenter l'audit visuel et la cible
- ne pas toucher au runtime

### Lot 2

- refondre la landing `/sim/per`
- conserver le routing existant

### Lot 3

- refondre le shell `/sim/per/potentiel`
- créer le rail de progression et la colonne droite sticky
- brancher les bases de layout sans changer le moteur

### Lot 4

- refondre les étapes `Mode`, `Avis IR`, `Situation fiscale`
- réintroduire la pédagogie Excel par blocs :
  contexte foyer, documents, estimation IR, versements retraite

### Lot 5

- refondre les synthèses
- renforcer la hiérarchie visuelle des résultats
- finaliser mobile, docs et tests

## Critères d'acceptation

- cohérence visuelle nette avec `Home` pour la landing
- cohérence visuelle nette avec `/sim/credit` pour le shell simulateur
- au moins un repère métier fort visible dans chaque écran PER
- lecture `Déclarant 1 / Déclarant 2` immédiate sur les écrans comparatifs
- desktop, tablette et mobile restent lisibles
- `npm run check` passe après chaque lot
