# SPEC EXPORT POWERPOINT PREMIUM — PARTIE 2/3 : STORYBOARDS

**Version** : 1.1 | **Date** : 2026-01-12  
**Style Guide** : Voir `STYLE_GUIDE_PPT_PREMIUM.md`

---

## C) STORYBOARDS DÉTAILLÉS PAR SIMULATEUR

### Slides communes (tous simulateurs)

#### Slide 1 : Cover (obligatoire)
**But** : Identifier l'étude et le client  
**Visuel** : Fond c1 plein, **ligne blanche AU-DESSUS du titre** (style PAGE 1)  
**Helper** : `drawTitleWithOverline()`  
**Données** : `clientName`, `studyType`, `date`, `coverUrl?`  
**Message pédagogique** : Professionnalisme, identité visuelle cabinet

#### Slide N-1 : Section Header "Annexes CGP" (si annexes)
**But** : Marquer transition vers partie technique  
**Visuel** : Fond c1/dégradé, titre "Annexes CGP — Détails de calcul"  
**Données** : Aucune (transition)  
**Message pédagogique** : Séparation claire client/CGP

#### Slide N : Disclaimer (obligatoire)
**But** : Conformité réglementaire  
**Visuel** : Texte sobre, fond blanc/c7  
**Données** : Texte disclaimer exact  
**Message pédagogique** : Sérieux juridique

---

## STORYBOARD IR (Impôt sur le Revenu)

### Partie Client (3-4 slides)

#### Slide 1 : Cover
- Titre : Nom client
- Sous-titre : "Simulation Impôt sur le Revenu"
- Cover image si disponible

#### Slide 2 : Notions clés IR
**But** : Expliquer concepts (TMI, taux moyen, parts fiscales)  
**Visuel** :
- Titre : "COMPRENDRE L'IMPÔT SUR LE REVENU" + underline court
- **Helper** : `drawTitleWithUnderline()`
- 3 blocs explicatifs (texte sobre, sans icônes) :
  - **Revenu net imposable** : Total revenus après déductions
  - **TMI (Tranche Marginale)** : Taux appliqué à la dernière tranche
  - **Taux moyen** : Impôt total / Revenu net imposable
- Schéma barème progressif (5 tranches) : barre segmentée horizontale
- **Helper** : `drawSegmentedBar()`

**Données requises** :
- `concepts` : [{icon, title, definition}]
- `baremeVisuel` : 5 tranches IR avec taux [0%, 11%, 30%, 41%, 45%]

**Règles de mise en page** :
- Blocs espacés régulièrement (grille 3 colonnes)
- Schéma barème en bas, largeur 80%, hauteur 25%
- Police body 13pt pour définitions

**Message pédagogique** :  
_"L'impôt progressif signifie que chaque tranche est taxée à un taux différent, pas tout le revenu au TMI."_

---

#### Slide 3 : Résultats simulation (Key Metrics)
**But** : Afficher métriques principales  
**Visuel** : Ligne de 4 KPI avec icônes (style PAGE 3)
- **Helper** : `drawKpiRow()`
- KPI 1 : icône `money` | **Estimation revenus** | `70 000 €`
- KPI 2 : icône `document` | **Revenu imposable** | `75 000 €`
- KPI 3 : icône `scale` | **Parts fiscales** | `2,00`
- KPI 4 : icône `percent` | **TMI** | `30 %`
- Barre tranches IR sous les KPI
- **Helper** : `drawSegmentedBar()` avec `activeIndex` sur tranche courante
- Résultat final en bas : "Estimation du montant de votre impôt sur le revenu : **8 831 €**"
- **Helper** : `drawResultLine()`

**Données requises** :
- `revenuNetImposable` (number)
- `nombreParts` (number)
- `tmi` (number, en %)
- `impotBrut` (number)
- `tauxMoyen` (number, calculé) : `(impotBrut / revenuNetImposable) * 100`
- `trancheActive` (number) : index tranche TMI (0-4)

**Règles de mise en page** :
- KPI en ligne horizontale, espacement égal
- Icônes 0.45"×0.45", centrées au-dessus labels
- Valeurs 24pt c1 bold, labels 11pt c9

**Message pédagogique** :  
_"Votre taux moyen (18,2%) est inférieur à votre TMI (41%) grâce à la progressivité."_

---

#### Slide 4 : Impacts comparés (si scénarios multiples)
**But** : Comparer situation actuelle vs optimisation (ex: avec PER)  
**Visuel** : Tableau comparatif 2 colonnes
- Colonne 1 : Sans optimisation
- Colonne 2 : Avec PER 10 000 €
- Lignes :
  - Revenu net imposable | 265 000 € | 255 000 €
  - TMI | 41% | 41%
  - Impôt brut | 48 320 € | 44 670 €
  - **Économie IR** | — | **-3 650 €** ✅ (vert)

**Données requises** :
- `scenario1` : {revenu, tmi, impot}
- `scenario2` : {revenu, tmi, impot}
- `deltaImpot` (number) : `scenario1.impot - scenario2.impot`

**Règles de mise en page** :
- Tableau centré, largeur 70%
- Header fond c1, texte blanc bold 14pt
- Lignes alternées c7/blanc
- Delta : si négatif → vert #059669, si positif → rouge #DC2626

**Règles conditionnelles** :
- Slide présente SEULEMENT si 2+ scénarios calculés
- Si 1 seul scénario : omettre cette slide

**Message pédagogique** :  
_"Le PER réduit votre revenu imposable, donc votre impôt. Vérifier plafond déductibilité."_

---

### Annexes CGP (2-3 slides)

#### Slide A1 : Détail tranches IR
**But** : Montrer calcul détaillé par tranche  
**Visuel** : Tableau annexe dense
- Titre : "Annexe A1 — Calcul détaillé par tranche"
- Colonnes : Tranche | Taux | Revenu imposable dans tranche | Impôt calculé
- Lignes (5 tranches barème 2024) :
  - 0 € → 11 294 € | 0% | 11 294 € | 0 €
  - 11 295 € → 28 797 € | 11% | 17 503 € | 1 925 €
  - 28 798 € → 82 341 € | 30% | 53 544 € | 16 063 €
  - 82 342 € → 177 106 € | 41% | 23 659 € | 9 700 €
  - > 177 106 € | 45% | 0 € | 0 €
  - **TOTAL par part** | — | **106 000 €** | **27 688 €**
  - **TOTAL foyer (2,5 parts)** | — | **265 000 €** | **48 320 €**

**Données requises** :
- `detailTranches` (Array<{tranche, taux, montant, impot}>)
- `baremeIR` (Array) : barème officiel année N
- `revenuParPart` (number) : `revenuNetImposable / nombreParts`
- `impotBrut` (number)

**Règles de mise en page** :
- Police 11pt (annexe)
- Bordures c8 0.5pt
- Ligne total : fond c2, texte blanc bold

**Message pédagogique** :  
_"Ce tableau permet de vérifier le calcul ligne par ligne selon barème officiel."_

---

#### Slide A2 : Hypothèses et limites
**But** : Préciser hypothèses de calcul  
**Visuel** : Méthodologie (blocs)
- Titre : "Annexe A2 — Hypothèses et limites"
- **Section 1 : Barème appliqué**
  - Barème IR 2024 (ou année N)
  - Source : Loi de finances 2024
- **Section 2 : Revenus pris en compte**
  - Salaires nets imposables (après 10% abattement ou frais réels)
  - BIC/BNC (bénéfices professionnels)
  - Revenus fonciers nets (après charges)
  - Pensions retraite (après 10% abattement)
  - Revenus mobiliers (intérêts, dividendes)
- **Section 3 : Déductions appliquées**
  - 10% abattement salaires (min 472 €, max 13 522 €)
  - Charges déductibles (pensions alimentaires, PERP/PER...)
- **Section 4 : Exclusions**
  - Crédits d'impôt NON pris en compte (emploi domicile, garde enfants...)
  - Réductions fiscales NON prises en compte (dons, Pinel...)
  - Décote NON appliquée (si impôt brut < seuil)
  - Quotient familial complexe (garde alternée) : estimation simplifiée
- **Note finale** : "Cette simulation est indicative. Le montant réel peut varier selon déclaration fiscale complète et niches fiscales."

**Données requises** :
- `hypotheses` (Array<string>) : liste hypothèses
- `anneeBareme` (number) : 2024
- `exclusions` (Array<string>) : liste éléments non pris en compte

**Règles de mise en page** :
- Blocs fond transparent, accent bar vertical c1 à gauche
- **Helper** : `drawAccentBar()` pour chaque bloc
- Bullet points pour listes
- Exclusions en **texte c9 italic** (pas d'icône)

**Message pédagogique** :  
_"Simulation pré-remplissage, pas substitut à déclaration officielle. Consulter votre CGP pour optimisation fiscale complète."_

---

#### Slide N : Disclaimer
Texte exact fourni PARTIE 1

---

## STORYBOARD CRÉDIT (Crédit immobilier)

### Partie Client (4-5 slides)

#### Slide 1 : Cover
- Titre : Nom client
- Sous-titre : "Simulation Crédit Immobilier"
- Cover image si disponible

---

#### Slide 2 : Synthèse crédit (Key Metrics)
**But** : Afficher paramètres et métriques principales  
**Visuel** : Ligne de 4-5 KPI avec icônes (style PAGE 3)
- **Helper** : `drawKpiRow()`
- KPI 1 : icône `money` | **Capital emprunté** | `300 000 €`
- KPI 2 : (sans icône) | **Durée** | `25 ans` | _(300 mois)_
- KPI 3 : icône `percent` | **Taux nominal** | `1,85 %`
- KPI 4 : icône `money` | **Mensualité** | `1 456 €`
- KPI 5 : icône `percent` | **TAEG** | `2,28 %`

**Données requises** :
- `capitalEmprunte` (number)
- `dureeAnnees` (number)
- `dureeMois` (number) : `dureeAnnees * 12`
- `tauxNominal` (number, en %, annuel)
- `tauxAssurance` (number, en %, annuel)
- `mensualiteTotale` (number) : mensu capital+intérêts + mensu assurance
- `taeg` (number, en %, annuel) : à calculer ou fourni

**Règles de mise en page** :
- KPI en ligne horizontale, espacement égal
- Icônes 0.45"×0.45", centrées au-dessus labels
- Valeurs 24pt c1 bold, labels 11pt c9
- Pas de bordure/fond visible sur KPI

**Message pédagogique** :  
_"Le TAEG inclut tous les frais (assurance, frais de dossier) et reflète le coût réel du crédit."_

---

#### Slide 3 : Coût total du crédit
**But** : Visualiser coût global et répartition  
**Visuel** :
- Titre : "Coût total du crédit"
- **Camembert (pie chart)** :
  - Bleu (c1, 68%) : Capital emprunté
  - Orange (c2, 26%) : Intérêts totaux
  - Vert (c4, 6%) : Assurance totale
- **Sous le graphique : Tableau récap**
  - Ligne 1 : Capital emprunté | 300 000 €
  - Ligne 2 : Intérêts totaux | 113 500 €
  - Ligne 3 : Assurance totale | 27 000 €
  - Ligne 4 (total, fond c2) : **Total remboursé** | **440 500 €**

**Données requises** :
- `capitalEmprunte` (number)
- `coutTotalInterets` (number) : somme intérêts échéancier
- `coutTotalAssurance` (number) : somme assurances échéancier
- `coutTotal` (number) : `coutTotalInterets + coutTotalAssurance`
- `totalRembourse` (number) : `capitalEmprunte + coutTotal`

**Règles de mise en page** :
- Graphique centré, diamètre 40% largeur slide
- Tableau sous graphique, largeur 60%, centré
- Pourcentages affichés sur chaque part du camembert

**Message pédagogique** :  
_"Le coût du crédit représente 47% du capital emprunté sur 25 ans. Plus la durée est longue, plus les intérêts sont élevés."_

---

#### Slide 4 : Amortissement visuel
**But** : Montrer évolution CRD et répartition intérêts/capital  
**Visuel** : **Graphique en aires empilées (area chart)**
- Axe X : Années (0 → 25)
- Axe Y : Montant mensuel (€)
- Aire 1 (c2, opaque) : Part intérêts (décroissante)
- Aire 2 (c1, opaque) : Part capital (croissante)
- Ligne supérieure (c10, pointillés) : Mensualité totale constante

**Données requises** :
- `echeancierResume` (Array) : par année, regroupé depuis échéancier mensuel
  - `{annee, partInteretsMoyenne, partCapitalMoyenne, mensualiteTotale}`
- Calculé depuis `echeancier` complet (regroupement par année pour lisibilité)

**Règles de mise en page** :
- Graphique centré, largeur 80%, hauteur 60%
- Légende bas : "Intérêts" (c2), "Capital" (c1), "Mensualité totale" (c10 pointillés)
- Axe X : labels tous les 5 ans (0, 5, 10, 15, 20, 25)

**Règles conditionnelles** :
- Lisibilité : max 25 points (1 par an), PAS 300 mois (illisible)

**Message pédagogique** :  
_"Au début, vous payez surtout des intérêts. Vers la fin, presque tout rembourse le capital. C'est pourquoi un remboursement anticipé en début de prêt est plus avantageux."_

---

#### Slide 5 : Sensibilité taux (si calculé)
**But** : Comparer impact de taux différents  
**Visuel** : Tableau comparatif
- Titre : "Sensibilité au taux d'intérêt"
- Colonnes : Taux | Mensualité | Coût total | Écart vs taux négocié
- Lignes (4 scénarios taux) :
  - 1,50% | 1 380 € | 414 000 € | **-26 500 €** ✅
  - **1,85% (négocié)** | **1 456 €** | **440 500 €** | **—** (ligne en gras)
  - 2,20% | 1 535 € | 468 500 € | **+28 000 €** (rouge)
  - 2,50% | 1 600 € | 490 000 € | **+49 500 €** (rouge)

**Données requises** :
- `sensibilite` (Array<{taux, mensualite, coutTotal, delta}>)
- `tauxNegocie` (number) : taux de référence

**Règles de mise en page** :
- Ligne référence (taux négocié) : fond c7, bold
- Deltas : vert si négatif, rouge si positif
- Tableau centré, largeur 70%

**Règles conditionnelles** :
- Slide présente SEULEMENT si sensibilité calculée (optionnelle)
- Si non calculée : omettre cette slide

**Message pédagogique** :  
_"0,35% d'écart = 26 500 € sur 25 ans. Négocier le taux est crucial. Un courtier peut vous aider."_

---

### Annexes CGP (3-4 slides)

#### Slide A1-A3 : Tableau d'amortissement complet (split si >100 lignes)
**But** : Échéancier détaillé mois par mois  
**Visuel** : Tableau annexe dense
- Titre : "Annexe A1 — Tableau d'amortissement (mois 1-100)"
- Colonnes : Mois | CRD début | Intérêts | Assurance | Amortissement | Mensualité | CRD fin
- Lignes : Mois 1 à 100 (police 10pt)

**Données requises** :
- `echeancier` (Array<{mois, crd, interets, assurance, amort, mensu, crdFin}>) : jusqu'à 300 lignes

**Règles de mise en page** :
- Si échéancier > 100 lignes : split en 3 slides
  - A1 : mois 1-100
  - A2 : mois 101-200
  - A3 : mois 201-300
- Police 10pt, lignes alternées c7/blanc
- Bordures c8 0.5pt
- Dernière ligne (mois 300) : CRD fin = 0,00 €

**Message pédagogique** :  
_"Tableau exhaustif pour recalcul manuel et vérification propositions banques."_

---

#### Slide A4 : Formules de calcul
**But** : Documenter formules utilisées  
**Visuel** : Méthodologie (blocs formules)
- Titre : "Annexe A4 — Formules de calcul"
- **Mensualité (crédit amortissable)** :
  ```
  M = C × (r / (1 - (1+r)^-N))
  Où :
  C = capital emprunté
  r = taux mensuel (taux annuel / 12)
  N = nombre de mois
  ```
- **Intérêts mois i** : `I_i = CRD_début × r`
- **Amortissement mois i** : `A_i = M - I_i`
- **CRD fin mois i** : `CRD_fin = CRD_début - A_i`
- **Assurance** :
  - Sur Capital Initial (CI) : `Assur_i = Capital × taux_assur_mensuel` (constant)
  - Sur CRD : `Assur_i = CRD_début × taux_assur_mensuel` (dégressif)
- **TAEG (Taux Annuel Effectif Global)** : Taux actuariel incluant intérêts + assurance + frais dossier (norme européenne)

**Données requises** :
- `formules` (Object) : {mensualite, interets, amortissement, crd, assurance, taeg}
- `typeAmort` (string) : 'amortissable' | 'inFine'
- `typeAssurance` (string) : 'CI' | 'CRD'

**Règles de mise en page** :
- Blocs formules fond c7, bordure c3
- Police monospace 11pt pour formules mathématiques
- Notation claire avec légende variables

**Message pédagogique** :  
_"Formules standardisées, vérifiables avec une calculatrice scientifique. Conformes aux normes bancaires."_

---

#### Slide A5 : Hypothèses et conditions
**But** : Lister toutes les hypothèses  
**Visuel** : Méthodologie (bullet points)
- Titre : "Annexe A5 — Hypothèses et conditions"
- **Type crédit** : Amortissable / In fine
- **Taux** : Fixe / Variable
  - Si variable : révision annuelle, cap +/- X%, index Euribor 3M
- **Assurance** :
  - Taux : fixe sur Capital Initial (CI) / sur CRD
  - Quotité : 100% / 50%-50% (couple)
- **Frais de dossier** : X € (inclus/exclus du capital emprunté)
- **Frais de garantie** : Hypothèque / Caution (montant estimatif)
- **Hypothèse : Pas de remboursement anticipé**
- **Hypothèse : Pas de modulation de mensualité**
- **Barème** : Taux en vigueur au JJ/MM/AAAA
- **Note** : "Simulation indicative. Conditions réelles dépendent de l'établissement prêteur, de votre profil emprunteur (apport, revenus, endettement, âge, état de santé pour assurance)."

**Données requises** :
- `typeCredit` (string) : 'amortissable' | 'inFine'
- `typeTaux` (string) : 'fixe' | 'variable'
- `typeAssurance` (string) : 'CI' | 'CRD'
- `fraisDossier` (number)
- `fraisGarantie` (number)
- `dateSimulation` (Date)

**Règles de mise en page** :
- Bullet points hiérarchiques (niveaux 1 et 2)
- Sections bien séparées
- Note finale en italic c9

**Message pédagogique** :  
_"Conditions à confirmer avec votre banque. Simulation = ordre de grandeur pour comparer les offres."_

---

#### Slide N : Disclaimer

---

## (Suite en PARTIE 3 : STORYBOARD PLACEMENT + INVENTAIRE DATA + EXCEL + DOD)
