# Succession — Triage des bugs à reproduire avant correction

Ce document gèle l'état du repo après `PR-04`.

Objectif :
- distinguer les régressions réellement reproduites dans le moteur
- éviter de conclure trop tôt à une cause racine UI ou métier
- documenter les cas qui restent à arbitrer

Sources de preuve :
- tests de caractérisation dans [successionBugRepro.test.ts](../src/features/succession/__tests__/successionBugRepro.test.ts)
- moteur succession dans `src/features/succession/*`

## Statut par cas

| Cas | Sujet | Statut actuel | Preuve |
|---|---|---|---|
| `3.2` | DDV usufruit total | `spec mismatch / scénario à rapprocher` | Le moteur applique bien l'art. 669 à 70 ans et produit `400k/600k`, pas un fallback `1/4 PP`. |
| `3.4` | DDV option mixte = `0€` | `non reproduit en moteur` | Avec dates valides, le moteur retourne une masse et des droits non nuls. Sans date, il replie sur `1/4 PP`, toujours non nul. |
| `5.3` / `5.4` / `5.6` | AV `757B = 0€` | `non reproduit en parseur / moteur AV` | Le parseur conserve `versementsApres70` lorsqu'ils sont saisis, et le moteur calcule une base `757B` strictement positive. |
| `8.3` | Frères / sœurs absents du résultat | `confirmed regression` | La dévolution produit bien la ligne `Frères et sœurs`, mais `buildSuccessionDirectDisplayAnalysis` renvoie `0` héritier, `0` transmission row et `result = null`. |
| `8.5` / `8.6` | Parents ignorés | `non reproduit dans le display direct` | Avec conjoint marié et ascendant survivant déclaré, le display garde bien `Conjoint survivant` + `Parent 1`. |
| `14.1` | Horizon du décès sans effet | `non reproduit au niveau moteur` | Deux `referenceDate` différentes changent bien la valorisation DDV et le total de droits. |

## Lecture recommandée

- `non reproduit en moteur` :
  - ne pas corriger le moteur sans preuve complémentaire
  - investiguer d'abord la saisie, le draft, ou l'orchestration UI

- `spec mismatch / scénario à rapprocher` :
  - rapprocher le cas utilisateur exact des inputs réellement injectés dans le repo
  - comparer les dates, le régime, l'option DDV et la masse retenue

## Ce que PR-04 ne conclut pas

- elle ne prouve pas que les retours utilisateur sont faux
- elle prouve seulement que, **dans le repo actuel et avec les inputs reproduits**, ces cas ne justifient pas encore un patch moteur
- toute correction future devra partir d'un fixture plus fidèle au cas utilisateur si un écart persiste
