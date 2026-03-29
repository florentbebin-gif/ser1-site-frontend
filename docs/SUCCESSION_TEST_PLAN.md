# Plan de test Succession — SER1

> Tests manuels à réaliser sur `/sim/succession`
> Dernière mise à jour : 2026-03-29

---

## Méthodologie

### Inventaire des inputs (96 champs actifs)

| Section | Champs | Valeurs clés |
|---|---|---|
| Contexte civil | 5 | situation (6), régime (6), convention PACS (2), dates naissance |
| Famille | 5 | rattachement enfant (3), décédé, type membre (5) |
| Actifs/Passifs expert | 9 | masse (5), catégorie (5), sous-catégorie, montant, qualification juridique (4), RP |
| Actifs/Passifs simplifié | 6 | Ep1/Ep2/Commun × actif/passif |
| Forfait mobilier | 3 | mode (4), %, montant fixe |
| Groupements fonciers | 5 | type GF (4), valeur, masse, quote-part, label |
| Assurance-vie | 8 | clause (3), souscripteur/assuré (2), bénéficiaires preset (3), capitaux, après 70, avant 1998 |
| PER assurance | 5 | clause (3), assuré (2), bénéficiaires, capitaux |
| Prévoyance décès | 4 | assuré (2), capital, dernière prime |
| Donations | 7 | type (2), date, donateur, donataire, valeur, 790G, réserve usufruit |
| Dispositions | 37 | testament (3 types), DDV (3), donation époux (4), attribution, préciput (2 modes), SA, PA, créances, ascendants |
| Temporel & chainage | 2 | décès dans X ans (11 valeurs), ordre décès (2) |

### Calcul combinatoire

Produit cartésien brut : `6 situations × 6 régimes × 4 configs famille × 16 dispositions × 20 produits × 11 horizons` = **> 500 000 cas**.

**Méthode retenue : couverture orthogonale** — 1 variable clé modifiée à la fois autour d'un cas de référence, complétée de croisements critiques. Résultat : **81 tests manuels pertinents**.

### Récapitulatif par bloc

| Bloc | Sujet | Tests |
|---|---|---|
| 1 | Situations familiales de base | 15 |
| 2 | Régimes matrimoniaux | 8 |
| 3 | Dispositions testamentaires | 12 |
| 4 | Produits d'assurance (AV / PER / Prévoyance) | 12 |
| 5 | Actifs mode expert | 8 |
| 6 | Donations | 6 |
| 7 | Chainage & horizons temporels | 6 |
| 8 | Croisements critiques | 7 |
| 9 | Cas limites | 7 |
| **Total** | | **81** |

### Colonnes de résultat

Chaque test comporte une section **"Résultats SER1 : À compléter"** à remplir manuellement après saisie dans le simulateur. Les colonnes BIG sont conservées quand une référence existe.

---

## BLOC 1 — Situations familiales de base

> Régime CRA, dispositions par défaut. Varie uniquement la situation/composition familiale.

---

### 1.1 — Marié CRA · 2 enfants communs · 600 k€ commun

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté légale (CRA) |
| Naissance Ep1 | 01/01/1980 |
| Naissance Ep2 | 01/01/1982 |
| Enfants | 2 communs |
| Actifs | Commun : 600 000 € |
| Dispositions | Par défaut (moteur) |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 (décès Ep1) : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

**Résultats SER1 — Étape 2 (décès Ep2) : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| E1 | | | |
| E2 | | | |

**Résultats BIG — Référence :**

| | Héritage | Droits | Net |
|---|---|---|---|
| 1er décès — Conjoint | 75 000 | 0 | 75 000 |
| 1er décès — E1 | 112 500 | 866 | 111 634 |
| 1er décès — E2 | 112 500 | 866 | 111 634 |
| 2e décès — E1 | 187 500 | 15 694 | 171 806 |
| 2e décès — E2 | 187 500 | 15 694 | 171 806 |

**Vérifier :** Abattement 100 k€/enfant, exonération conjoint, droits totaux cumulés.

---

### 1.2 — Marié CRA · 1 enfant commun · 1 000 k€ commun

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté légale |
| Naissance Ep1 | 01/01/1970 |
| Naissance Ep2 | 01/06/1972 |
| Enfants | 1 commun |
| Actifs | Commun : 1 000 000 € |
| Dispositions | Par défaut |
| Décès | Ep1 en premier |

**Résultats SER1 : À compléter**

| | Étape 1 — Conjoint | Étape 1 — E1 | Étape 2 — E1 |
|---|---|---|---|
| Reçoit brut | | | |
| Droits | | | |
| Net | | | |

**Résultats BIG :**

| | Héritage | Droits | Net |
|---|---|---|---|
| 1er décès — Conjoint | 125 000 | 0 | 125 000 |
| 1er décès — E1 | 375 000 | 53 194 | 321 806 |
| 2e décès — E1 | 625 000 | 103 194 | 521 806 |

---

### 1.3 — Marié CRA · 3 enfants communs · 2 000 k€ commun

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté légale |
| Naissance Ep1 | 15/03/1965 |
| Naissance Ep2 | 20/09/1967 |
| Enfants | 3 communs |
| Actifs | Commun : 2 000 000 € |
| Dispositions | Par défaut |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |
| E3 | | | |

**Résultats BIG :**

| | Héritage | Droits | Net |
|---|---|---|---|
| 1er décès — Conjoint | 250 000 | 0 | 250 000 |
| 1er décès — E1 | 250 000 | 28 194 | 221 806 |
| 2e décès — E1 | 416 667 | 61 528 | 355 139 |

---

### 1.4 — Célibataire · 2 enfants · 400 k€

| Paramètre | Valeur |
|---|---|
| Situation | Célibataire |
| Naissance Ep1 | 01/01/1975 |
| Enfants | 2 (rattachés Ep1) |
| Actifs | Ep1 : 400 000 € |

**Résultats SER1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| E1 | | | |
| E2 | | | |

**Résultats BIG :**

| | Héritage | Droits | Net |
|---|---|---|---|
| E1 | 200 000 | 18 194 | 181 806 |
| E2 | 200 000 | 18 194 | 181 806 |

---

### 1.5 — Veuf/ve · 1 enfant · 800 k€

| Paramètre | Valeur |
|---|---|
| Situation | Veuf/veuve |
| Naissance Ep1 | 10/05/1960 |
| Enfants | 1 (rattaché Ep1) |
| Actifs | Ep1 : 800 000 € |

**Résultats SER1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| E1 | | | |

**Résultats BIG :**

| | Héritage | Droits | Net |
|---|---|---|---|
| E1 | 800 000 | 152 962 | 647 038 |

---

### 1.6 — Pacsé (séparation) · 2 enfants communs · 600 k€

| Paramètre | Valeur |
|---|---|
| Situation | Pacsé(e) |
| Convention PACS | Séparation de biens |
| Naissance Ep1 | 01/01/1978 |
| Naissance Ep2 | 01/01/1980 |
| Enfants | 2 communs |
| Actifs | Ep1 : 300 000 €, Ep2 : 300 000 € |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Partenaire | | | |
| E1 | | | |
| E2 | | | |

**Vérifier :** Partenaire pacsé NON héritier légal sans testament — sa part doit être 0 sauf disposition.

---

### 1.7 — Pacsé (indivision) · 2 enfants communs · 600 k€

| Paramètre | Valeur |
|---|---|
| Situation | Pacsé(e) |
| Convention PACS | Indivision conventionnelle |
| Naissance Ep1 | 01/01/1978 |
| Naissance Ep2 | 01/01/1980 |
| Enfants | 2 communs |
| Actifs | Commun (indivision) : 600 000 € |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Partenaire | | | |
| E1 | | | |
| E2 | | | |

**Vérifier :** Liquidation indivision PACS 50/50 ; partenaire reçoit la moitié de l'indivision hors succession.

---

### 1.8 — Concubinage · 1 enfant commun · 400 k€

| Paramètre | Valeur |
|---|---|
| Situation | Union libre |
| Naissance Ep1 | 01/01/1982 |
| Naissance Ep2 | 01/01/1984 |
| Enfants | 1 commun |
| Actifs | Ep1 : 400 000 € |

**Résultats SER1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| E1 | | | |

**Vérifier :** Concubin non héritier légal (hors legs) ; E1 reçoit 100 % de la succession Ep1.

---

### 1.9 — Divorcé(e) · 2 enfants · 500 k€

| Paramètre | Valeur |
|---|---|
| Situation | Divorcé(e) |
| Naissance Ep1 | 01/01/1975 |
| Enfants | 2 (rattachés Ep1) |
| Actifs | Ep1 : 500 000 € |

**Résultats SER1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| E1 | | | |
| E2 | | | |

---

### 1.10 — Marié CRA · 0 enfant · conjoint seul · sans ascendants

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté légale |
| Naissance Ep1 | 01/01/1970 |
| Naissance Ep2 | 01/01/1972 |
| Enfants | 0 |
| Ascendants Ep1 | Non |
| Ascendants Ep2 | Non |
| Actifs | Commun : 800 000 € |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | 0 | |

**Vérifier :** Conjoint seul héritier universel, exonéré DMTG.

---

### 1.11 — Marié CRA · 0 enfant · avec ascendants des deux côtés

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté légale |
| Naissance Ep1 | 01/01/1970 |
| Naissance Ep2 | 01/01/1972 |
| Enfants | 0 |
| Ascendants Ep1 | Oui |
| Ascendants Ep2 | Oui |
| Actifs | Commun : 600 000 € |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| Parents Ep1 (retour) | | | |
| Parents Ep2 (retour) | | | |

**Vérifier :** Retour successoral 1/4 par branche parentale, exonération conjoint sur sa part.

---

### 1.12 — Marié CRA · enfants non-communs (Ep1 seulement) · 600 k€

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté légale |
| Naissance Ep1 | 01/01/1975 |
| Naissance Ep2 | 01/01/1977 |
| Enfants | 2 rattachés Ep1 uniquement |
| Actifs | Commun : 600 000 € |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 (Ep1) | | | |
| E2 (Ep1) | | | |

**Vérifier :** Conjoint limité à 1/4 PP (présence d'enfants non-communs).

---

### 1.13 — Marié CRA · enfants non-communs des deux côtés · 800 k€

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté légale |
| Naissance Ep1 | 01/01/1970 |
| Naissance Ep2 | 01/01/1972 |
| Enfants | 1 rattaché Ep1 + 1 rattaché Ep2 |
| Actifs | Commun : 800 000 € |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E (Ep1) | | | |

**Vérifier :** E(Ep2) n'hérite pas de Ep1. Conjoint 1/4 PP.

---

### 1.14 — Marié CRA · enfant décédé + 1 petit-enfant représentant

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté légale |
| Naissance Ep1 | 01/01/1955 |
| Naissance Ep2 | 01/01/1957 |
| Enfants | 2 communs dont 1 décédé (cocher "décédé") |
| Membres familiaux | 1 petit-enfant (enfant du décédé) |
| Actifs | Commun : 1 000 000 € |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 (vivant) | | | |
| Petit-enfant (représentation) | | | |

**Vérifier :** Abattement réduit petit-enfant représentant (CGI art. 779).

---

### 1.15 — Marié CRA · sans enfants · frère/sœur héritier

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté légale |
| Naissance Ep1 | 01/01/1965 |
| Naissance Ep2 | 01/01/1967 |
| Enfants | 0 |
| Ascendants | Non |
| Membres | 1 frère/sœur (côté Ep1) |
| Actifs | Commun : 500 000 € |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Abattement | Droits | Net |
|---|---|---|---|---|
| Conjoint | | — | 0 | |
| Frère/sœur | | 15 932 € | | |

**Vérifier :** Frère/sœur hérite uniquement si parent décédé + 0 enfant ; barème 35/45 %.

---

## BLOC 2 — Régimes matrimoniaux

> 2 enfants communs, actifs identiques à chaque test. Varie uniquement le régime.

---

### 2.1 — Séparation de biens · actifs déséquilibrés

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Séparation de biens |
| Naissance Ep1 | 01/01/1970 |
| Naissance Ep2 | 01/01/1972 |
| Enfants | 2 communs |
| Actifs | Ep1 : 200 000 €, Ep2 : 400 000 € |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

**Vérifier :** Seuls les 200 k€ propres Ep1 entrent dans la succession ; pas de masse commune.

---

### 2.2 — Séparation de biens + indivision séparatiste 70/30

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Séparation de biens |
| Naissance Ep1 | 01/01/1972 |
| Naissance Ep2 | 01/01/1974 |
| Enfants | 2 communs |
| Actifs expert | Ep1 propre : 300 000 €, Indivision (70 % Ep1 / 30 % Ep2) : 200 000 € |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| | Valeur |
|---|---|
| Propres Ep1 | 300 000 |
| Quote-part Ep1 indivision (70 %) | 140 000 |
| Total succession Ep1 | |

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

---

### 2.3 — Communauté universelle · sans stipulation contraire

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté universelle |
| Naissance Ep1 | 01/01/1960 |
| Naissance Ep2 | 01/01/1962 |
| Enfants | 2 communs |
| Actifs | Commun : 800 000 € |
| Stipulation contraire CU | Non |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

---

### 2.4 — Communauté universelle + stipulation contraire + bien propre par nature

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté universelle |
| Naissance Ep1 | 01/01/1960 |
| Naissance Ep2 | 01/01/1962 |
| Enfants | 2 communs |
| Actifs expert | Bien CU (commun) : 600 000 €, Bien propre-par-nature Ep1 : 200 000 € |
| Stipulation contraire CU | Oui |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| Actif | Entre dans succession ? | Valeur |
|---|---|---|
| Bien CU 600 k€ | Non (revient conjoint) | — |
| Propre-par-nature Ep1 200 k€ | Oui | 200 000 |

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

---

### 2.5 — Communauté meubles et acquêts · biens de natures mixtes

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté meubles et acquêts |
| Naissance Ep1 | 01/01/1968 |
| Naissance Ep2 | 01/01/1970 |
| Enfants | 2 communs |
| Actifs expert | Immobilier propre Ep1 (immeuble, avant union) : 300 000 €, Meuble commun : 200 000 € |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

**Vérifier :** Immeuble propre (300 k€) reste propre Ep1 ; meuble (200 k€) intègre masse commune.

---

### 2.6 — Participation aux acquêts · patrimoines déséquilibrés

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Participation aux acquêts |
| Naissance Ep1 | 01/01/1965 |
| Naissance Ep2 | 01/01/1967 |
| Enfants | 2 communs |
| Actifs | Ep1 : 800 000 €, Ep2 : 200 000 € |
| Participation acquêts | Actif, patrimoine originaire Ep1 : 100 k€, Ep2 : 50 k€ |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| | Valeur |
|---|---|
| Actif Ep1 avant créance | 800 000 |
| Créance participation Ep2 sur Ep1 | |
| Actif net succession Ep1 | |

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

---

### 2.7 — Séparation de biens + société d'acquêts · attribution survivant 100 %

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Séparation biens + société d'acquêts |
| Naissance Ep1 | 01/01/1968 |
| Naissance Ep2 | 01/01/1970 |
| Enfants | 2 communs |
| Actifs expert | Ep1 propre : 200 000 €, Société d'acquêts : 400 000 € |
| SA — liquidation | Attribution au survivant : 100 % |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| Masse | Valeur | Vers succession |
|---|---|---|
| SA (400 k€) | 400 000 | Non (attribuée conjoint) |
| Propre Ep1 (200 k€) | 200 000 | Oui |

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint (SA + succession) | | | |
| E1 | | | |
| E2 | | | |

---

### 2.8 — Marié CRA · passifs partiels · 2 enfants

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté légale |
| Naissance Ep1 | 01/01/1975 |
| Naissance Ep2 | 01/01/1977 |
| Enfants | 2 communs |
| Actifs | Commun : 500 000 € |
| Passifs | Commun : 150 000 € |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| | Valeur |
|---|---|
| Actif brut | 500 000 |
| Passif | 150 000 |
| Actif net | 350 000 |

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

---

## BLOC 3 — Dispositions testamentaires

> Base : Marié CRA, 2 enfants communs, 800 k€ commun, Ep1 né 01/01/1963, Ep2 né 01/01/1965. Varie uniquement la disposition.

---

### 3.1 — Choix légal conjoint · usufruit total

| Paramètre | Valeur |
|---|---|
| Base | Voir intro Bloc 3 |
| Choix légal conjoint | Usufruit de la totalité (art. 757 CC) |
| Décès dans | 0 an (Ep2 : 60 ans) |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Valeur fiscale UF/NP | Droits | Net |
|---|---|---|---|
| Conjoint (usufruit — 60 ans = 50 %) | | 0 | |
| E1 (nue-propriété) | | | |
| E2 (nue-propriété) | | | |

**Vérifier :** Barème CGI 669 : 60 ans → usufruit 50 % ; abattement 100 k€ sur valeur NP de chaque enfant.

---

### 3.2 — Choix légal conjoint · 1/4 pleine propriété

| Paramètre | Valeur |
|---|---|
| Base | Voir intro Bloc 3 |
| Choix légal conjoint | 1/4 en pleine propriété (art. 757 CC) |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | 0 | |
| E1 | | | |
| E2 | | | |

---

### 3.3 — Donation entre époux · usufruit total

| Paramètre | Valeur |
|---|---|
| Base | Voir intro Bloc 3 |
| Donation entre époux | Oui — Totalité en usufruit |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Valeur fiscale | Droits | Net |
|---|---|---|---|
| Conjoint (usufruit DDV — 60 ans) | | 0 | |
| E1 (nue-propriété) | | | |
| E2 (nue-propriété) | | | |

---

### 3.4 — Donation entre époux · pleine propriété (quotité disponible)

| Paramètre | Valeur |
|---|---|
| Base | Voir intro Bloc 3 |
| Donation entre époux | Oui — Quotité disponible en pleine propriété |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint (1/3 PP — 2 enfants) | | 0 | |
| E1 | | | |
| E2 | | | |

**Vérifier :** Quotité disponible spéciale époux avec 2 enfants = 1/3 PP.

---

### 3.5 — Donation entre époux · option mixte (1/4 PP + 3/4 UF)

| Paramètre | Valeur |
|---|---|
| Base | Voir intro Bloc 3 |
| Donation entre époux | Oui — Option mixte 1/4 PP + 3/4 usufruit |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Part PP | Part UF/NP | Droits | Net |
|---|---|---|---|---|
| Conjoint | | | 0 | |
| E1 | | | | |
| E2 | | | | |

---

### 3.6 — Attribution intégrale · 100 % biens communs

| Paramètre | Valeur |
|---|---|
| Base | Voir intro Bloc 3 |
| Attribution intégrale | Oui — 100 % biens communs |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

**Vérifier :** La totalité des biens communs revient au conjoint survivant via clause d'attribution intégrale.

---

### 3.7 — Attribution intégrale · 75 % biens communs

| Paramètre | Valeur |
|---|---|
| Base | Voir intro Bloc 3 |
| Attribution intégrale | Oui — 75 % biens communs |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

---

### 3.8 — Préciput global · 100 k€

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Séparation biens + société d'acquêts |
| Enfants | 2 communs |
| Actifs expert | SA : 400 000 € |
| Mode préciput | Global — 100 000 € |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| | Valeur |
|---|---|
| SA avant préciput | 400 000 |
| Préciput (hors succession) | 100 000 |
| SA à partager | 300 000 |

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint (préciput + part SA) | | | |
| E1 | | | |
| E2 | | | |

---

### 3.9 — Préciput cible · résidence principale

| Paramètre | Valeur |
|---|---|
| Base | Voir intro Bloc 3 |
| Actifs expert | RP commune : 400 000 €, Autres commun : 400 000 € |
| Mode préciput | Cible — résidence principale |

**Résultats SER1 — Étape 1 : À compléter**

| Masse | Valeur | Succession |
|---|---|---|
| RP (préciput cible) | 400 000 | Non (conjoint) |
| Autres commun | 400 000 | Oui (partagé) |

| Héritier | RP préciput | Part succession | Droits | Net |
|---|---|---|---|---|
| Conjoint | 400 000 | | 0 | |
| E1 | — | | | |
| E2 | — | | | |

---

### 3.10 — Testament · legs universel à E1 uniquement

| Paramètre | Valeur |
|---|---|
| Base | Voir intro Bloc 3 |
| Testament Ep1 | Legs universel → E1 |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Base | Droits | Net |
|---|---|---|---|---|
| E1 (legs universel) | | Réserve + quotité | | |
| E2 (réservataire) | | Réserve seule | | |
| Conjoint | | | 0 | |

**Vérifier :** Réserve héréditaire E2 protégée ; E1 reçoit sa réserve + quotité disponible.

---

### 3.11 — Testament · legs particulier à un tiers

| Paramètre | Valeur |
|---|---|
| Base | Voir intro Bloc 3 |
| Membres | 1 tierce personne |
| Testament Ep1 | Legs particulier : 50 000 € → tiers |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Tiers (legs particulier) | 50 000 | | |
| Conjoint | | 0 | |
| E1 | | | |
| E2 | | | |

**Vérifier :** Legs particulier déduit avant calcul des parts réservataires ; tiers barème 60 %.

---

### 3.12 — Créances entre masses · récompense Ep1 → communauté

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté légale |
| Enfants | 2 communs |
| Actifs expert | Commun : 500 000 €, Ep1 propre : 100 000 € |
| Créance | Ep1 → Communauté : 80 000 € (récompense, active) |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| | Valeur |
|---|---|
| Propres Ep1 | 100 000 |
| Quote-part Ep1 (50 % commun) | 250 000 |
| Récompense récupérée | 80 000 |
| Total succession Ep1 | |

| Héritier | Reçoit brut | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

---

## BLOC 4 — Produits d'assurance (AV · PER · Prévoyance)

> Base sauf précision : Marié CRA, 2 enfants communs, actifs commun 400 k€.

---

### 4.1 — AV clause standard · avant 70 ans · capitaux 150 k€

| Paramètre | Valeur |
|---|---|
| Naissance Ep1 | 01/01/1970 |
| AV (Ep1 souscripteur/assuré) | Capitaux : 150 000 €, Après 70 ans : 0, Avant 1998 : 0 |
| Clause bénéficiaire | Standard (conjoint puis enfants) |

**Résultats SER1 : À compléter**

| Héritier | Héritage | AV reçue | Droits AV | Droits succ. | Net |
|---|---|---|---|---|---|
| Conjoint | | 150 000 | 0 (exonéré) | 0 | |
| E1 | | | | | |
| E2 | | | | | |

**Vérifier :** AV < abattement 990I (152 500 €/bénéf.) → 0 droits si conjoint seul bénéficiaire.

---

### 4.2 — AV clause standard · versements après 70 ans · art. 757B

| Paramètre | Valeur |
|---|---|
| Naissance Ep1 | 01/01/1950 |
| AV (Ep1) | Capitaux : 200 000 €, Dont après 70 ans : 120 000 € |
| Clause bénéficiaire | Standard (conjoint puis enfants) |

**Résultats SER1 : À compléter**

| Héritier | AV avant 70 | AV après 70 | Droits 757B | Net AV |
|---|---|---|---|---|
| Conjoint | | | 0 (exonéré) | |
| E1 | | | | |
| E2 | | | | |

**Vérifier :** 757B — abattement global 30 500 € partagé ; excédent soumis DMTG selon lien.

---

### 4.3 — AV clause démembrée · conjoint 60 ans

| Paramètre | Valeur |
|---|---|
| Naissance Ep1 | 01/01/1963 |
| Naissance Ep2 | 01/01/1965 (survivant, 60 ans) |
| AV (Ep1) | Capitaux : 200 000 €, Clause démembrée, âge usufruitier : 60 |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Valeur fiscale | Base imposable | Droits | Net |
|---|---|---|---|---|
| Conjoint (UF 50 %) | 100 000 | — (exonéré) | 0 | |
| E1 (NP 25 %) | 50 000 | 50 000 − 152 500 | | |
| E2 (NP 25 %) | 50 000 | 50 000 − 152 500 | | |

**Vérifier :** CGI 669 : 60 ans → UF 50 % ; abattement 990I s'applique sur valeur UF et NP séparément.

---

### 4.4 — AV clause personnalisée · conjoint 60 % + enfants 40 %

| Paramètre | Valeur |
|---|---|
| Naissance Ep1 | 01/01/1965 |
| AV (Ep1) | Capitaux : 300 000 €, Clause personnalisée : Conjoint 60 %, E1 20 %, E2 20 % |

**Résultats SER1 : À compléter**

| Héritier | AV reçue | Abattement 990I | Base imposable | Droits | Net |
|---|---|---|---|---|---|
| Conjoint | 180 000 | — (exonéré) | 0 | 0 | |
| E1 | 60 000 | 152 500 | 0 | 0 | |
| E2 | 60 000 | 152 500 | 0 | 0 | |

---

### 4.5 — AV dépassant abattement 990I · imposable

| Paramètre | Valeur |
|---|---|
| Naissance Ep1 | 01/01/1965 |
| AV (Ep1) | Capitaux : 500 000 €, Clause : E1 50 %, E2 50 % |

**Résultats SER1 : À compléter**

| Héritier | AV reçue | Abattement 990I | Base imposable | Droits 990I | Net |
|---|---|---|---|---|---|
| E1 | 250 000 | 152 500 | 97 500 | | |
| E2 | 250 000 | 152 500 | 97 500 | | |

**Vérifier :** Prélèvement 20 % jusqu'à 700 k€/bénéficiaire, 31,25 % au-delà.

---

### 4.6 — AV versements avant 13/10/1998 · exonération totale

| Paramètre | Valeur |
|---|---|
| Naissance Ep1 | 01/01/1948 |
| AV (Ep1) | Capitaux : 200 000 €, Dont avant 13/10/1998 : 200 000 € |
| Clause | E1 50 %, E2 50 % |

**Résultats SER1 : À compléter**

| Héritier | AV reçue | Droits | Net |
|---|---|---|---|
| E1 | 100 000 | 0 (exonéré) | |
| E2 | 100 000 | 0 (exonéré) | |

**Vérifier :** Ancien régime 990I : 100 % exonéré si versements avant le 13/10/1998.

---

### 4.7 — AV versements mixtes · 3 tranches

| Paramètre | Valeur |
|---|---|
| Naissance Ep1 | 01/01/1948 |
| AV (Ep1) | Capitaux : 300 000 €, Avant 1998 : 50 000 €, Après 70 ans : 80 000 € |
| Clause | E1 50 %, E2 50 % |

**Résultats SER1 : À compléter**

| Tranche | Montant | Régime | Droits |
|---|---|---|---|
| Avant 13/10/1998 | 50 000 | Exonéré | 0 |
| Avant 70 ans (hors 1998) | 170 000 | 990I | |
| Après 70 ans | 80 000 | 757B | |

**Vérifier :** Segmentation correcte des 3 tranches dans l'affichage.

---

### 4.8 — PER non liquidé · assuré < 70 ans

| Paramètre | Valeur |
|---|---|
| Naissance Ep1 | 01/01/1972 |
| PER (Ep1 assuré) | Capitaux : 80 000 €, Clause standard |

**Résultats SER1 : À compléter**

| Héritier | PER reçu | Régime fiscal | Droits | Net |
|---|---|---|---|---|
| Conjoint | | | | |
| E1 | | | | |
| E2 | | | | |

**Vérifier :** PER < 70 ans → art. 990I (même régime AV avant 70 ans).

---

### 4.9 — PER non liquidé · assuré > 70 ans

| Paramètre | Valeur |
|---|---|
| Naissance Ep1 | 01/01/1950 |
| PER (Ep1 assuré) | Capitaux : 100 000 €, Clause standard |

**Résultats SER1 : À compléter**

| Héritier | PER reçu | Régime fiscal | Abattement 757B | Droits | Net |
|---|---|---|---|---|---|
| Conjoint | | | 0 (exonéré) | 0 | |
| E1 | | | | | |
| E2 | | | | | |

**Vérifier :** PER > 70 ans → art. 757B ; abattement global 30 500 € partagé entre bénéficiaires.

---

### 4.10 — Prévoyance décès · prime non excessive

| Paramètre | Valeur |
|---|---|
| Naissance Ep1 | 01/01/1975 |
| Prévoyance (Ep1) | Capital décès : 150 000 €, Dernière prime : 2 000 € |
| Clause | Conjoint |

**Résultats SER1 : À compléter**

| Héritier | Capital reçu | Droits | Net |
|---|---|---|---|
| Conjoint | 150 000 | | |

**Vérifier :** Prévoyance hors succession (prime non manifestement exagérée) ; droits nuls ou réduits.

---

### 4.11 — AV + PER + Prévoyance combinées

| Paramètre | Valeur |
|---|---|
| Naissance Ep1 | 01/01/1968 |
| Actifs | Commun : 200 000 € |
| AV (Ep1) | 100 000 €, clause conjoint 100 % |
| PER (Ep1) | 80 000 €, clause standard |
| Prévoyance (Ep1) | Capital 50 000 €, prime 1 500 € |

**Résultats SER1 : À compléter**

| Produit | Bénéficiaire | Reçu | Régime | Droits | Net |
|---|---|---|---|---|---|
| AV | Conjoint | 100 000 | 990I | 0 | |
| PER | (clause) | 80 000 | 990I | | |
| Prévoyance | (clause) | 50 000 | Hors succ. | | |
| Succession | | | DMTG | | |

**Vérifier :** Abattements 990I distincts AV vs PER ou partagés ? (point de conformité moteur).

---

### 4.12 — AV clause démembrée + PER clause démembrée · conjoint 65 ans

| Paramètre | Valeur |
|---|---|
| Naissance Ep1 | 01/01/1960 |
| Naissance Ep2 | 01/01/1962 (survivant, 63 ans) |
| AV (Ep1) | Capitaux : 200 000 €, Clause démembrée, âge UF : 63 |
| PER (Ep1) | Capitaux : 150 000 €, Clause démembrée, âge UF : 63 |

**Résultats SER1 : À compléter**

| Produit | Héritier | Valeur fiscale | Droits | Net |
|---|---|---|---|---|
| AV | Conjoint UF (40 %) | 80 000 | 0 | |
| AV | E1 NP (30 %) | 60 000 | | |
| AV | E2 NP (30 %) | 60 000 | | |
| PER | Conjoint UF (40 %) | 60 000 | 0 | |
| PER | E1 NP (30 %) | 45 000 | | |
| PER | E2 NP (30 %) | 45 000 | | |

**Vérifier :** CGI 669 : 63 ans → UF 40 % ; abattements 990I appliqués séparément par produit.

---

## BLOC 5 — Actifs mode expert

---

### 5.1 — Résidence principale · abattement 20 %

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Actifs expert | RP commune 500 000 € (cocher abattement RP), Autres commun : 100 000 € |

**Résultats SER1 — Étape 1 : À compléter**

| Actif | Brut | Après abattement 20 % |
|---|---|---|
| RP | 500 000 | |
| Autres | 100 000 | — |
| Total actif net | | |

| Héritier | Part | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

---

### 5.2 — Qualification juridique · propre Ep1 + commun

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Actifs expert | Bien Ep1 (propre, avant union) : 400 000 €, Bien commun : 200 000 € |

**Résultats SER1 — Étape 1 : À compléter**

| Masse | Valeur | Entre dans succession |
|---|---|---|
| Propre Ep1 | 400 000 | Oui (100 %) |
| Commun (moitié Ep1) | 100 000 | Oui |
| Total | 500 000 | |

| Héritier | Part | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

---

### 5.3 — GFA · abattement 75 %

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Actifs expert | GFA commun : 400 000 €, Autres commun : 100 000 € |

**Résultats SER1 — Étape 1 : À compléter**

| Actif | Brut | Abattement 75 % | Net taxable |
|---|---|---|---|
| GFA | 400 000 | | |
| Autres | 100 000 | — | 100 000 |

| Héritier | Part | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

---

### 5.4 — GFV · abattement 75 %

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Actifs expert | GFV commun : 300 000 €, Autres : 200 000 € |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Part | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

**Vérifier :** Abattement 75 % GFV = même règle que GFA.

---

### 5.5 — Indivision séparatiste · 50/50

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), séparation de biens, 2 enfants |
| Actifs expert | Bien indivision (50 % Ep1 / 50 % Ep2) : 400 000 € |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| | Valeur |
|---|---|
| Quote-part Ep1 (50 %) | 200 000 |
| Quote-part Ep2 (50 %) — hors succession | 200 000 |

| Héritier | Part | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

---

### 5.6 — Passif affecté par masse · Ep1 uniquement

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Actifs expert | Ep1 propre : 500 000 €, Passif Ep1 : 80 000 € |

**Résultats SER1 — Étape 1 : À compléter**

| | Valeur |
|---|---|
| Actif brut Ep1 | 500 000 |
| Passif affecté Ep1 | 80 000 |
| Actif net transmis | |

| Héritier | Part | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

---

### 5.7 — Forfait mobilier · mode pourcentage 5 %

| Paramètre | Valeur |
|---|---|
| Situation | Célibataire, 2 enfants |
| Actifs expert | Immobilier Ep1 : 400 000 €, Autres Ep1 : 200 000 € |
| Forfait mobilier | Mode % — 5 % |

**Résultats SER1 : À compléter**

| | Valeur |
|---|---|
| Base avant forfait | 600 000 |
| Forfait mobilier 5 % | 30 000 |
| Total actif avec forfait | 630 000 |

| Héritier | Part | Droits | Net |
|---|---|---|---|
| E1 | | | |
| E2 | | | |

---

### 5.8 — Forfait mobilier · mode montant fixe

| Paramètre | Valeur |
|---|---|
| Situation | Célibataire, 2 enfants |
| Actifs expert | Ep1 : 500 000 € |
| Forfait mobilier | Mode montant fixe : 20 000 € |

**Résultats SER1 : À compléter**

| | Valeur |
|---|---|
| Actif déclaré | 500 000 |
| Forfait fixe | 20 000 |
| Total | 520 000 |

| Héritier | Part | Droits | Net |
|---|---|---|---|
| E1 | | | |
| E2 | | | |

---

## BLOC 6 — Donations

---

### 6.1 — Donation rapportable · dans les 15 ans · E1

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Actifs | Commun : 600 000 € |
| Donation | Type : avance de part, Donateur Ep1 → Donataire E1, Valeur : 50 000 €, Date : il y a 5 ans |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Part légale | Donation rappelée | Part finale | Droits | Net |
|---|---|---|---|---|---|
| Conjoint | | — | | | |
| E1 | | 50 000 | | | |
| E2 | | — | | | |

**Vérifier :** Masse fictive reconstituée ; abattement 100 k€ réduit de 50 k€ pour E1.

---

### 6.2 — Donation hors part · dans les 15 ans · E1

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Actifs | Commun : 600 000 € |
| Donation | Type : hors part, Donateur Ep1 → E1, Valeur : 80 000 €, Date : il y a 3 ans |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Part | Donation rappelée fiscalement | Droits | Net |
|---|---|---|---|---|
| Conjoint | | | | |
| E1 | | 80 000 | | |
| E2 | | — | | |

**Vérifier :** Hors part = pas de rapport civil ; rappel fiscal CGI 784 (15 ans) réduit l'abattement disponible.

---

### 6.3 — Donation ancienne · hors rappel fiscal (> 15 ans)

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Actifs | Commun : 800 000 € |
| Donation | Type : rapportable, Ep1 → E1, 100 000 €, Date : il y a 20 ans |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Part | Droits (abattement 100 k€ reconstitué) | Net |
|---|---|---|---|
| Conjoint | | | |
| E1 | | | |
| E2 | | | |

**Vérifier :** Donation > 15 ans = hors rappel fiscal ; abattement 100 k€ entier disponible pour E1.

---

### 6.4 — Don familial exonéré 790G · 31 865 €

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Actifs | Commun : 500 000 € |
| Donation | Type : avance part, Ep1 (< 80 ans) → E1 (majeur), 31 865 €, Cocher "Don familial 790G" |

**Résultats SER1 : À compléter**

| | Valeur |
|---|---|
| Droits donation | 0 (exonéré 790G) |
| Rappel fiscal succession | |

| Héritier | Part succession | Abattement restant | Droits | Net |
|---|---|---|---|---|
| E1 | | | | |
| E2 | | | | |

---

### 6.5 — Donation avec réserve d'usufruit

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Actifs | Commun : 600 000 € |
| Donation | Rapportable, Ep1 → E1, Valeur donation : 150 000 €, Cocher "Avec réserve d'usufruit" |

**Résultats SER1 — Étape 1 : À compléter**

| | Valeur |
|---|---|
| Valeur NP rappelée | |
| Abattement 100 k€ − NP rappelée | |

| Héritier | Part | Droits | Net |
|---|---|---|---|
| E1 | | | |
| E2 | | | |

---

### 6.6 — Multi-donations · rapportable + hors part + 790G

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 3 enfants |
| Actifs | Commun : 1 500 000 € |
| Donation 1 | Rapportable Ep1 → E1 : 80 000 €, il y a 5 ans |
| Donation 2 | Hors part Ep1 → E2 : 60 000 €, il y a 8 ans |
| Donation 3 | Avance part Ep1 → E3 : 31 865 €, 790G coché |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Part légale | Rappel fiscal | Abattement restant | Droits | Net |
|---|---|---|---|---|---|
| Conjoint | | — | — | 0 | |
| E1 | | 80 000 | | | |
| E2 | | 60 000 | | | |
| E3 | | 31 865 | | | |

---

## BLOC 7 — Chainage & horizons temporels

---

### 7.1 — Ep2 décède en premier · inversion chainage

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Actifs | Ep1 : 200 000 €, Ep2 : 400 000 €, Commun : 400 000 € |
| Décès | Ep2 en premier (toggle inversé) |

**Résultats SER1 — Étape 1 (décès Ep2) : À compléter**

| Masse Ep2 | Valeur |
|---|---|
| Propres Ep2 | 400 000 |
| Moitié commun | 200 000 |
| Total | 600 000 |

| Héritier | Part | Droits | Net |
|---|---|---|---|
| Conjoint (Ep1) | | 0 | |
| E1 | | | |
| E2 | | | |

---

### 7.2 — Décès dans 10 ans · usufruit conjoint réduit

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Naissance Ep1 | 01/01/1965 (mourra à 71 ans) |
| Naissance Ep2 | 01/01/1967 (survivant, 79 ans au décès) |
| Actifs | Commun : 800 000 € |
| Décès dans | 10 ans |
| Choix légal conjoint | Usufruit total |

**Résultats SER1 : À compléter**

| Héritier | Âge au décès | Valeur UF/NP | Droits | Net |
|---|---|---|---|---|
| Conjoint UF (79 ans → 20 %) | 79 | | 0 | |
| E1 NP (80 %) | — | | | |
| E2 NP (80 %) | — | | | |

---

### 7.3 — Décès dans 20 ans · NP quasi pleine propriété

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Naissance Ep1 | 01/01/1965 |
| Naissance Ep2 | 01/01/1967 (survivant, 89 ans au décès) |
| Actifs | Commun : 800 000 € |
| Décès dans | 20 ans |
| Choix légal conjoint | Usufruit total |

**Résultats SER1 : À compléter**

| Héritier | Âge au décès | Valeur UF/NP | Droits | Net |
|---|---|---|---|---|
| Conjoint UF (89 ans → 10 %) | 89 | | 0 | |
| E1 NP (90 %) | — | | | |
| E2 NP (90 %) | — | | | |

**Vérifier :** NP ≈ PP → droits enfants très proches d'une transmission PP.

---

### 7.4 — Comparaison 0 an vs 10 ans · même cas de base

Réaliser les deux variantes avec les mêmes paramètres, uniquement le curseur "Décès dans" change.

| Paramètre | 7.4A — Décès immédiat | 7.4B — Décès dans 10 ans |
|---|---|---|
| Naissance Ep1 | 01/01/1972 | 01/01/1972 |
| Naissance Ep2 | 01/01/1974 | 01/01/1974 |
| Actifs | Commun : 600 000 € | Commun : 600 000 € |
| Décès dans | 0 | 10 |
| Choix légal conjoint | Usufruit total | Usufruit total |

**Résultats SER1 : À compléter**

| Scénario | Âge conjoint | % UF | Droits E1 | Droits E2 |
|---|---|---|---|---|
| 7.4A — 0 an | 50 | | | |
| 7.4B — 10 ans | 60 | | | |

---

### 7.5 — Ep1 très âgé · Ep2 jeune · écart usufruit maximal

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Naissance Ep1 | 01/01/1940 (décédant à 85 ans) |
| Naissance Ep2 | 01/01/1972 (survivant à 53 ans) |
| Actifs | Commun : 800 000 € |
| Choix légal conjoint | Usufruit total |

**Résultats SER1 : À compléter**

| Héritier | Âge | % UF | Valeur fiscale | Droits | Net |
|---|---|---|---|---|---|
| Conjoint UF (53 ans → 60 %) | 53 | 60 % | | 0 | |
| E1 NP (40 %) | — | — | | | |
| E2 NP (40 %) | — | — | | | |

---

### 7.6 — Décès dans 30 ans · usufruit résiduel

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Naissance Ep1 | 01/01/1965 |
| Naissance Ep2 | 01/01/1967 (survivant, 99 ans) |
| Actifs | Commun : 800 000 € |
| Décès dans | 30 ans |
| Choix légal conjoint | Usufruit total |

**Résultats SER1 : À compléter**

| Héritier | Âge au décès | % UF (CGI 669) | Valeur fiscale | Droits | Net |
|---|---|---|---|---|---|
| Conjoint UF (99 ans → 10 %) | 99 | 10 % | | 0 | |
| E1 NP | — | 90 % | | | |
| E2 NP | — | 90 % | | | |

---

## BLOC 8 — Croisements critiques

---

### 8.1 — Communauté universelle + donation entre époux + AV

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Communauté universelle |
| Naissance Ep1 | 01/01/1960 |
| Naissance Ep2 | 01/01/1962 (65 ans) |
| Enfants | 2 communs |
| Actifs | Commun : 1 000 000 € |
| Donation entre époux | Oui — Totalité en usufruit |
| AV (Ep1) | Capitaux : 200 000 €, Clause conjoint 100 % |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Héritage | AV | Droits total | Net |
|---|---|---|---|---|
| Conjoint | | 200 000 | 0 | |
| E1 | | — | | |
| E2 | | — | | |

---

### 8.2 — Séparation de biens + enfants non-communs + préciput global

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e) |
| Régime | Séparation biens + société d'acquêts |
| Enfants | 1 rattaché Ep1 + 1 rattaché Ep2 |
| Actifs expert | Ep1 propre : 300 000 €, SA : 200 000 € |
| Mode préciput | Global — 100 000 € |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| Masse | Valeur | Sort |
|---|---|---|
| SA (préciput) | 100 000 | Conjoint hors succession |
| SA (reste) | 100 000 | Partagé |
| Propre Ep1 | 300 000 | Succession |

| Héritier | Part | Droits | Net |
|---|---|---|---|
| Conjoint | | | |
| E (Ep1) | | | |

**Vérifier :** E(Ep2) n'hérite pas de Ep1 ; préciput prélevé avant partage SA.

---

### 8.3 — PACS séparation + enfant non-commun + AV conjoint

| Paramètre | Valeur |
|---|---|
| Situation | Pacsé(e) |
| Convention PACS | Séparation |
| Naissance Ep1 | 01/01/1975 |
| Enfants | 1 rattaché Ep1 uniquement |
| Actifs | Ep1 : 400 000 € |
| AV (Ep1) | Capitaux : 150 000 €, Clause partenaire 100 % |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Héritage | AV | Droits AV | Net |
|---|---|---|---|---|
| E1 (seul héritier légal) | | — | — | |
| Partenaire (AV seulement) | — | 150 000 | 0 (990I) | |

---

### 8.4 — CRA + enfant décédé représenté + AV + donation rapportable

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA |
| Naissance Ep1 | 01/01/1948 |
| Enfants | 2 dont 1 décédé + 1 petit-enfant représentant |
| Actifs | Commun : 1 000 000 € |
| AV (Ep1) | Capitaux : 200 000 €, Clause enfants parts égales |
| Donation | Rapportable Ep1 → E1 (vivant) : 100 000 €, il y a 10 ans |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Héritage | Rappel fiscal | AV | Droits | Net |
|---|---|---|---|---|---|
| Conjoint | | — | — | 0 | |
| E1 (vivant) | | 100 000 | 100 000 | | |
| PE (représentation) | | — | 100 000 | | |

---

### 8.5 — Participation aux acquêts + patrimoine très déséquilibré + AV

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), participation aux acquêts |
| Enfants | 2 communs |
| Actifs | Ep1 : 1 200 000 €, Ep2 : 200 000 € |
| Participation | Originaire Ep1 : 50 k€, Ep2 : 50 k€ |
| AV (Ep1) | Capitaux : 300 000 €, Clause conjoint 100 % |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| | Valeur |
|---|---|
| Actif Ep1 avant créance | 1 200 000 |
| Créance participation Ep2 | |
| Actif net succession | |

| Héritier | Héritage | AV | Droits | Net |
|---|---|---|---|---|
| Conjoint | | 300 000 | 0 | |
| E1 | | — | | |
| E2 | | — | | |

---

### 8.6 — CRA + DDV usufruit + préciput cible RP + AV démembrée

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Naissance Ep1 | 01/01/1963 |
| Naissance Ep2 | 01/01/1965 (60 ans) |
| Actifs expert | RP commune : 600 000 €, Autres commun : 400 000 € |
| Donation entre époux | Oui — usufruit total |
| Mode préciput | Cible — RP |
| AV (Ep1) | 200 000 €, clause démembrée, âge UF : 60 |

**Résultats SER1 — Étape 1 : À compléter**

| Flux | Héritier | Valeur | Droits | Net |
|---|---|---|---|---|
| Préciput cible RP | Conjoint | 600 000 | 0 | |
| DDV usufruit (Autres) | Conjoint UF | | 0 | |
| DDV nue-propriété | E1 | | | |
| DDV nue-propriété | E2 | | | |
| AV usufruit | Conjoint UF | | 0 | |
| AV nue-propriété | E1 | | | |
| AV nue-propriété | E2 | | | |

---

### 8.7 — CMA + GFA + qualification juridique + donation rapportable

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), communauté meubles et acquêts, 3 enfants |
| Actifs expert | GFA commun : 600 000 €, Immeuble propre Ep1 (immeuble, avant union) : 300 000 €, Meuble commun : 100 000 € |
| Donation | Rapportable Ep1 → E1 : 100 000 €, date récente |

**Résultats SER1 — Étape 1 : À compléter**

| Actif | Brut | Abattement | Net taxable |
|---|---|---|---|
| GFA (75 %) | 600 000 | | |
| Propre Ep1 immeuble | 300 000 | — | |
| Meuble commun (50 %) | 50 000 | — | |
| Total succession | | | |

| Héritier | Part | Rappel | Droits | Net |
|---|---|---|---|---|
| Conjoint | | — | 0 | |
| E1 | | 100 000 | | |
| E2 | | — | | |
| E3 | | — | | |

---

## BLOC 9 — Cas limites

---

### 9.1 — Actif net nul · passif = actif

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Actifs | Commun : 300 000 € |
| Passifs | Commun : 300 000 € |

**Résultats SER1 — Étape 1 : À compléter**

| | Valeur |
|---|---|
| Actif brut | 300 000 |
| Passif | 300 000 |
| Actif net | 0 |

| Héritier | Reçoit | Droits | Net |
|---|---|---|---|
| Conjoint | 0 | 0 | 0 |
| E1 | 0 | 0 | 0 |
| E2 | 0 | 0 | 0 |

**Vérifier :** Succession déficitaire correctement affichée ; aucun droit.

---

### 9.2 — Masse successorale nulle · tout en AV

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 2 enfants |
| Actifs | Commun : 0 € |
| AV (Ep1) | Capitaux : 600 000 €, Clause E1 50 % / E2 50 % |

**Résultats SER1 : À compléter**

| Héritier | Héritage | AV | Droits AV | Net |
|---|---|---|---|---|
| Conjoint | 0 | — | — | 0 |
| E1 | 0 | 300 000 | | |
| E2 | 0 | 300 000 | | |

**Vérifier :** Succession vide sans erreur moteur ; droits uniquement sur AV.

---

### 9.3 — Succession collatérale · frères/sœurs sans enfants ni ascendants

| Paramètre | Valeur |
|---|---|
| Situation | Célibataire |
| Naissance Ep1 | 01/01/1965 |
| Enfants | 0 |
| Ascendants | Non |
| Membres | 2 frères/sœurs (côté Ep1) |
| Actifs | Ep1 : 200 000 € |

**Résultats SER1 : À compléter**

| Héritier | Part brute | Abattement | Base imposable | Droits (35/45 %) | Net |
|---|---|---|---|---|---|
| F/S 1 | 100 000 | 15 932 | | | |
| F/S 2 | 100 000 | 15 932 | | | |

---

### 9.4 — Succession neveux/nièces · représentation d'un frère décédé

| Paramètre | Valeur |
|---|---|
| Situation | Célibataire |
| Naissance Ep1 | 01/01/1960 |
| Enfants | 0 |
| Ascendants | Non |
| Membres | 1 frère (coché décédé) + 2 neveux/nièces (membres familiaux) |
| Actifs | Ep1 : 300 000 € |

**Résultats SER1 : À compléter**

| Héritier | Part brute | Abattement | Droits (55 %) | Net |
|---|---|---|---|---|
| Neveu/nièce 1 | 150 000 | 7 967 | | |
| Neveu/nièce 2 | 150 000 | 7 967 | | |

---

### 9.5 — Masse très élevée · tranche haute barème DMTG

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA, 3 enfants |
| Naissance Ep1 | 01/01/1955 |
| Actifs | Commun : 5 000 000 € |
| Décès | Ep1 en premier |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Part brute | Abattement | Base imposable | Droits | Net |
|---|---|---|---|---|---|
| Conjoint | | | — (exonéré) | 0 | |
| E1 | | | | | |
| E2 | | | | | |
| E3 | | | | | |

**Vérifier :** Tranche 45 % correctement calculée au-dessus de 1 805 677 €.

---

### 9.6 — Conjoint seul survivant · pas d'enfants ni d'ascendants

| Paramètre | Valeur |
|---|---|
| Situation | Marié(e), CRA |
| Enfants | 0 |
| Ascendants | Non |
| Actifs | Commun : 800 000 € |

**Résultats SER1 — Étape 1 : À compléter**

| Héritier | Reçoit | Droits | Net |
|---|---|---|---|
| Conjoint | 400 000 (50 % commun) | 0 | 400 000 |

---

### 9.7 — Legs universel à un tiers · célibataire sans héritiers

| Paramètre | Valeur |
|---|---|
| Situation | Célibataire |
| Naissance Ep1 | 01/01/1960 |
| Enfants | 0 |
| Ascendants | Non |
| Membres | 1 tierce personne |
| Actifs | Ep1 : 400 000 € |
| Testament | Legs universel → tierce personne |

**Résultats SER1 : À compléter**

| Héritier | Part brute | Abattement | Base imposable | Droits (60 %) | Net |
|---|---|---|---|---|---|
| Tiers | 400 000 | 1 594 | | | |

**Vérifier :** Barème 60 % tiers non parent, abattement 1 594 €.

---

## Annexe — Récapitulatif des inputs couverts

| Section | Champs | Couverture |
|---|---|---|
| Situation familiale (6 valeurs) | `celibataire`, `marie`, `pacse`, `concubinage`, `divorce`, `veuf` | Blocs 1, 8, 9 |
| Régime matrimonial (6 valeurs) | CRA, CU, sep. biens, participation, CMA, SA | Blocs 1–3, 8 |
| Convention PACS (2) | Séparation, indivision | Bloc 1 |
| Composition famille | 0/1/2/3 enfants, non-communs, décédé+représentation, ascendants, membres | Bloc 1 |
| Actifs simplifié | 6 cases Ep1/Ep2/Commun × actif/passif | Blocs 1–2, 7, 9 |
| Actifs expert | qualification juridique, passif affecté, indivision, RP, GFA/GFV | Bloc 5 |
| Forfait mobilier (4 modes) | off, auto, %, montant | Bloc 5 |
| Groupements fonciers (4 types) | GFA, GFV, GFF, GF | Blocs 5, 8 |
| Assurance-vie (3 clauses) | standard, démembrée, personnalisée + tranches | Bloc 4 |
| PER (< 70 ans / > 70 ans) | standard + âge | Bloc 4 |
| Prévoyance | capital + prime | Blocs 4, 8 |
| Donations (2 types) | rapportable, hors part, 790G, réserve usufruit | Bloc 6 |
| Dispositions (tous types) | DDV, DEE (4), attribution, préciput (global/cible), legs, créances | Blocs 3, 8 |
| Horizons temporels (6 valeurs) | 0, 10, 20, 30 ans, comparaison | Bloc 7 |
| Ordre chainage | Ep1 en premier / Ep2 en premier | Blocs 1, 7, 8 |
