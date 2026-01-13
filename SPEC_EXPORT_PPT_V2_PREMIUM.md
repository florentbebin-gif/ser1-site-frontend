# SPEC EXPORT POWERPOINT V2 — PREMIUM REFONTE

**Version** : 2.0 | **Date** : 2026-01-13  
**Auteur** : Directeur Artistique + Expert pédagogie patrimoniale  
**Scope** : `/sim/ir`, `/sim/credit`, `/sim/placement`  
**Référence visuelle** : `docs/Présentation1 PAGE 1-3.png` (signature premium validée)

---

## 1) AUDIT CRITIQUE — SLIDE PAR SLIDE

### 1.1 Comparaison exports actuels vs Référence Présentation1

| Simulateur | Slide | Problème identifié | Pourquoi NON premium | Fix V2 |
|------------|-------|-------------------|---------------------|--------|
| **IR** | Cover | Ligne sous titre au lieu de AU-DESSUS | Ne reproduit pas PAGE 1 | Ligne blanche 50% largeur **AU-DESSUS** titre |
| **IR** | Synthèse | 3 KPI sans barre TMI visuelle | PAGE 3 montre barre segmentée colorée avec position TMI | Ajouter `drawSegmentedBar()` avec gradient couleurs 0%→45% + marqueur position |
| **IR** | Synthèse | Manque "revenus dans TMI" + "marge avant changement" | Information pédagogique absente | Ajouter 2 lignes explicatives sous barre |
| **IR** | Disclaimer | Texte tronqué (version courte) | Non conforme SPEC | Disclaimer LONG EXACT obligatoire |
| **IR** | Annexes | Absentes | Pas de détail calcul CGP | Ajouter 2 slides annexes (tranches + hypothèses) |
| **Crédit** | Cover | OK (fond c1 + overline) | — | Conserver |
| **Crédit** | Synthèse | 4-5 KPI trop condensés, pas de "carte prêt" | Client ne visualise pas "sa carte crédit" | Créer **LoanSummaryCard** visuel premium |
| **Crédit** | Annexes | Tableau brut sans pagination | Tables >100 lignes illisibles | Split paginated + ajout méthodologie |
| **Crédit** | Annexes | Pas de formules/références | CGP ne peut pas vérifier | Ajouter slide "Formules de calcul" |
| **Placement** | Cover | OK | — | Conserver |
| **Placement** | Synthèse | Pas de "Match" visuel P1 vs P2 | Manque comparaison côte à côte | Créer **MatchCard** 2 colonnes |
| **Placement** | Phases | 3 phases mélangées | Pas de séparation claire Épargne/Liquidation/Transmission | 3 slides dédiées + **PhaseTimeline** |
| **Placement** | Annexes | JSON brut dans Excel | Inexploitable | Tables formatées + texte explicatif |
| **TOUS** | Footer | Inconsistant | Date/disclaimer/page pas alignés | Footer uniforme 3 zones (date | disclaimer court | page) |
| **TOUS** | Marges | 0.5" (trop serré) | STYLE_GUIDE exige 0.75" | Appliquer MARGIN = 0.75" |
| **TOUS** | Valeurs KPI | 24pt (trop petit) | PAGE 3 montre valeurs plus grandes | 28pt contenu, 52pt hero |

### 1.2 Écarts critiques prioritaires

| # | Écart | Impact | Priorité |
|---|-------|--------|----------|
| 1 | **Barre TMI colorée absente (IR)** | Client ne comprend pas progressivité | 🔴 CRITIQUE |
| 2 | **Carte prêt absente (Crédit)** | Pas de synthèse visuelle | 🔴 CRITIQUE |
| 3 | **Match visuel absent (Placement)** | Comparaison P1 vs P2 confuse | 🔴 CRITIQUE |
| 4 | **Annexes sans texte explicatif** | CGP ne peut pas justifier calculs | 🟠 MAJEUR |
| 5 | **Disclaimer tronqué** | Non conformité juridique | 🟠 MAJEUR |
| 6 | **Marges 0.5" au lieu de 0.75"** | Aspect non premium | 🟡 MINEUR |

---

## 2) SPEC V2 — SIMULATEUR IR (Impôt sur le Revenu)

### 2.1 Storyboard Partie Client (5 slides)

#### Slide 1 : COVER
**Objectif** : Identifier le client et l'étude  
**Message pédagogique** :
- Professionnalisme du cabinet
- Personnalisation (nom client)

**Visuel** : Style PAGE 1 exact
```
┌──────────────────────────────────────────────────────────────┐
│                     FOND C1 PLEIN (100%)                     │
│                                                              │
│                                                              │
│     ────────────────────────────────────────────────         │  ← Ligne blanche 1.5pt, 50% largeur, CENTRÉE
│                                                              │
│               Etude Impôt sur le revenu                      │  ← 40pt blanc, centré
│                                                              │
│               Madame et Monsieur [NOM]                       │  ← 22pt c4, centré
│                                                              │
│                                                              │
│                       [DATE]                                 │  ← 14pt gris 50%, bas
│                                              [LOGO 10%×8%]   │  ← Opacité 60%, bas droit
└──────────────────────────────────────────────────────────────┘
```

**Layout** : `drawTitleWithOverline()`  
**Données requises** :
- `clientName` (string)
- `date` (string, format "12 janvier 2026")
- `coverUrl` (string | null)

---

#### Slide 2 : OBJECTIFS & CONTEXTE
**Objectif** : Contextualiser (style PAGE 2 - split 50/50)  
**Message pédagogique** :
- Pourquoi cette étude
- Ce que le client va découvrir

**Visuel** : Split image gauche + contenu droit
```
┌─────────────────────────────┬────────────────────────────────┐
│                             │                                │
│                             │  OBJECTIFS & CONTEXTE          │  ← 28pt c1, underline 15%
│                             │  ─────                         │
│      [IMAGE PREMIUM]        │                                │
│      (lion heurtoir)        │  │ Vous souhaitez estimer      │  ← Accent bar 3pt c1
│                             │  │ le montant de votre         │
│                             │  │ impôt sur le revenu.        │  ← 16pt c10
│                             │                                │
│                             │                                │
├─────────────────────────────┴────────────────────────────────┤
│  [DATE]        Document non contractuel...        Page 2     │  ← Footer 8pt c9
└──────────────────────────────────────────────────────────────┘
```

**Layout** : `applySplitLayout({ imagePosition: 'left', imagePct: 45 })` + `drawAccentBar()`  
**Données requises** :
- `splitImageUrl` (string) — image premium à fournir
- `objectifTexte` (string)

---

#### Slide 3 : ESTIMATION DE LA SITUATION FISCALE (HERO)
**Objectif** : Afficher les 4 KPI + barre TMI (style PAGE 3 EXACT)  
**Message pédagogique** :
- TMI visible avec code couleur
- Position du client sur le barème
- Montant dans la tranche + marge avant changement

**Visuel** : Reproduction fidèle PAGE 3
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  ESTIMATION DE LA SITUATION FISCALE                          │  ← 28pt c1, underline
│  ─────                                                       │
│                                                              │
│  [💵]           [📄]           [⚖️]            [%]           │  ← Icônes SVG 0.45"
│  Estimation     Estimation     Nombre de       TMI           │  ← 11pt c9
│  de vos         du revenu      parts                         │
│  revenus        imposable      fiscales                      │
│                                                              │
│  Déclarant 1    75 000 €       2,00            30%           │  ← 28pt c1 bold
│    50 000 €                                                  │  ← 11pt c9 (sublabel)
│  Déclarant 2                                                 │
│    20 000 €                                                  │
│                                                              │
│  ┌────┬─────────┬──────────────────┬────────────┬──────────┐ │
│  │ 0% │   11%   │       30%        │    41%     │   45%    │ │  ← Barre segmentée
│  └────┴─────────┴────────▼─────────┴────────────┴──────────┘ │
│                        16 370 €                              │  ← Montant dans TMI
│                                                              │
│  ══════════════════════════════════════════════════════════  │
│                                                              │
│  Estimation du montant de votre impôt sur le revenu :        │
│                                            ═══════           │
│                                            8 831 €           │  ← 24pt c1 bold, underline c2
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  [DATE]        Document non contractuel...        Page 3     │
└──────────────────────────────────────────────────────────────┘
```

**Layout** : `drawKpiRow()` + `drawSegmentedBar()` + `drawResultLine()`  
**Données requises** :
- `revenus.d1` (number) — revenus déclarant 1
- `revenus.d2` (number) — revenus déclarant 2
- `revenuNetImposable` (number)
- `nombreParts` (number)
- `tmi` (number, en %)
- `trancheActive` (number, index 0-4)
- `montantDansTMI` (number) — **NOUVEAU** : revenus imposés à la TMI
- `margeAvantChangement` (number) — **NOUVEAU** : euros avant tranche suivante
- `impotBrut` (number)

**Règle barre TMI** :
- Couleurs gradient : `c7` (0%) → `c8` (11%) → `c4` (30%) → `c2` (41%) → `c1` (45%)
- Largeur segments proportionnelle aux tranches barème
- Marqueur ▼ sur tranche active + montant dessous

---

#### Slide 4 : DÉTAIL PAR TRANCHE (tableau client simplifié)
**Objectif** : Montrer calcul tranche par tranche (version client)  
**Message pédagogique** :
- Comprendre que chaque tranche a son taux
- Vérifier le calcul est correct

**Visuel** : Tableau épuré (max 6 lignes)
```
┌──────────────────────────────────────────────────────────────┐
│  DÉTAIL DU CALCUL PAR TRANCHE                                │
│  ─────                                                       │
│                                                              │
│  Tranche                   Taux      Revenu        Impôt     │  ← Header 14pt c1 semibold
│  ─────────────────────────────────────────────────────────   │  ← Ligne 2pt c1
│  0 € → 11 294 €            0%        11 294 €      0 €       │
│  11 295 € → 28 797 €       11%       17 503 €      1 925 €   │
│  28 798 € → 82 341 €       30%       23 703 €      7 111 €   │  ← Tranche active en bold c2
│  ─────────────────────────────────────────────────────────   │
│  TOTAL (par part)                    52 500 €      9 036 €   │  ← 14pt c1 bold
│  TOTAL foyer (1,5 parts)             78 750 €      8 831 €   │  ← Après décote/plafond QF
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Données requises** :
- `detailTranches[]` {tranche, taux, montant, impot}
- `nombreParts`
- `impotBrut`

---

#### Slide 5 : DISCLAIMER
**Objectif** : Conformité juridique  
**Visuel** : Texte exact, fond blanc, sobre

**Données requises** :
- `LONG_DISCLAIMER` (constant, texte exact de PARTIE 1)

---

### 2.2 Storyboard Annexes CGP (3 slides)

#### Slide A1 : ANNEXE — BARÈME IR APPLIQUÉ
**Objectif** : Documenter barème officiel utilisé  
**Message** : _"Barème IR 2024 applicable aux revenus 2023 (Loi de Finances 2024)"_

**Contenu** :
- Tableau barème officiel (5 tranches)
- Source : Article 197 CGI
- Référentiel : BOI-IR-LIQ-20
- Note : "Tranches revalorisées de 4,8% vs 2023"

**Données** : `baremeIR[]`, `anneeBareme`, `sourceJuridique`

---

#### Slide A2 : ANNEXE — HYPOTHÈSES ET MÉTHODOLOGIE
**Objectif** : Lister toutes les hypothèses de calcul  
**Contenu** (avec accent bar gauche) :
- **Revenus pris en compte** : Salaires nets (après 10%), BIC/BNC, fonciers nets, pensions, mobiliers
- **Abattements appliqués** : 10% salaires (min 472€, max 13 522€)
- **Non pris en compte** : Crédits d'impôt, réductions fiscales, décote, revenus exceptionnels
- **Formule quotient familial** : Revenu imposable ÷ Nombre de parts
- **Plafond QF** : 1 759 € par demi-part supplémentaire

**Données** : `hypotheses[]`, `exclusions[]`, `plafondQF`

---

#### Slide A3 : DISCLAIMER LONG
(Identique slide 5 partie client)

---

## 3) SPEC V2 — SIMULATEUR CRÉDIT

### 3.1 Storyboard Partie Client (6 slides)

#### Slide 1 : COVER
(Identique IR — style PAGE 1)

#### Slide 2 : OBJECTIFS & CONTEXTE
(Identique IR — style PAGE 2 split)
**Texte** : _"Vous souhaitez financer un projet immobilier et comparer les conditions de crédit."_

---

#### Slide 3 : CARTE SYNTHÈSE DU PRÊT (HERO)
**Objectif** : Visualiser "sa carte crédit" en un coup d'œil  
**Message pédagogique** :
- Tous les paramètres clés sur une "carte"
- Design premium type carte bancaire

**Visuel** : **LoanSummaryCard** (nouveau composant)
```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  VOTRE CRÉDIT IMMOBILIER                                     │
│  ─────                                                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ╔══════════════════════════════════════════════════╗   │  │
│  │ ║                                                  ║   │  │
│  │ ║   CAPITAL EMPRUNTÉ        300 000 €             ║   │  │  ← 32pt c1 bold
│  │ ║   ─────────────────────────────────────────────  ║   │  │
│  │ ║                                                  ║   │  │
│  │ ║   Durée          25 ans (300 mois)              ║   │  │  ← 16pt c10
│  │ ║   Taux nominal   1,85 %                         ║   │  │
│  │ ║   Taux assurance 0,36 %                         ║   │  │
│  │ ║   ─────────────────────────────────────────────  ║   │  │
│  │ ║                                                  ║   │  │
│  │ ║   MENSUALITÉ TOTALE       1 456 € /mois         ║   │  │  ← 28pt c2 bold
│  │ ║   (dont assurance 90 €)                         ║   │  │  ← 12pt c9
│  │ ║                                                  ║   │  │
│  │ ║   TAEG                    2,28 %                ║   │  │
│  │ ╚══════════════════════════════════════════════════╝   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Layout** : `drawLoanSummaryCard()` (nouveau helper)  
**Données requises** :
- `capitalEmprunte`
- `dureeAnnees`, `dureeMois`
- `tauxNominal`, `tauxAssurance`
- `mensualiteTotale`, `mensualiteAssurance`
- `taeg`

---

#### Slide 4 : COÛT TOTAL DU CRÉDIT
**Objectif** : Visualiser répartition capital/intérêts/assurance  
**Visuel** : Graphique barres horizontales empilées (pas camembert)

```
┌──────────────────────────────────────────────────────────────┐
│  COÛT TOTAL DU CRÉDIT                                        │
│  ─────                                                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Capital      ████████████████████████████  300 000 €   │  │  ← c1, 68%
│  │ Intérêts     ██████████████                113 500 €   │  │  ← c2, 26%
│  │ Assurance    ████                           27 000 €   │  │  ← c4, 6%
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ═══════════════════════════════════════════════════════════ │
│  TOTAL REMBOURSÉ                              440 500 €      │  ← 24pt c1 bold
│  ═══════════════════════════════════════════════════════════ │
│                                                              │
│  💡 Le coût du crédit représente 47% du capital emprunté.    │  ← Note pédagogique
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Données** : `capitalEmprunte`, `coutTotalInterets`, `coutTotalAssurance`, `totalRembourse`

---

#### Slide 5 : ÉVOLUTION AMORTISSEMENT
**Objectif** : Montrer évolution part intérêts vs capital  
**Visuel** : Area chart empilé (par année, pas par mois)

**Données** : `echeancierResume[]` {annee, partInterets, partCapital}

---

#### Slide 6 : DISCLAIMER

---

### 3.2 Storyboard Annexes CGP (6 slides)

#### Slide A1-A3 : TABLEAU D'AMORTISSEMENT (paginé)
- A1 : Mois 1-100
- A2 : Mois 101-200
- A3 : Mois 201-300

**Colonnes** : Mois | CRD début | Intérêts | Assurance | Amort. | Mensualité | CRD fin

**Texte d'introduction** (sur A1) :
> "Ce tableau détaille mois par mois le remboursement de votre crédit. Les intérêts diminuent progressivement tandis que la part de capital remboursé augmente."

---

#### Slide A4 : FORMULES DE CALCUL
**Contenu** :
```
MENSUALITÉ (crédit amortissable) :
M = C × r / (1 - (1+r)^-N)

Où :
- C = capital emprunté (300 000 €)
- r = taux mensuel (1,85% / 12 = 0,154%)
- N = nombre de mois (300)

INTÉRÊTS mois i : I = CRD × r
AMORTISSEMENT mois i : A = M - I
CRD fin mois i : CRD_fin = CRD_début - A
```

---

#### Slide A5 : HYPOTHÈSES ET CONDITIONS
**Contenu** :
- Type crédit : Amortissable à taux fixe
- Assurance : Sur capital initial (CI) / Sur CRD
- Frais de dossier : inclus/exclus
- Garantie : Hypothèque / Caution
- **Non pris en compte** : Remboursement anticipé, modulation mensualité
- Source : Conditions au JJ/MM/AAAA

---

#### Slide A6 : DISCLAIMER

---

## 4) SPEC V2 — SIMULATEUR PLACEMENT

### 4.1 Storyboard Partie Client (9 slides)

#### Slide 1 : COVER
**Sous-titre** : "Analyse comparative de placements patrimoniaux"

#### Slide 2 : OBJECTIFS & CONTEXTE (split)
**Texte** : _"Vous souhaitez comparer deux stratégies de placement sur votre horizon de vie."_

---

#### Slide 3 : TIMELINE — VOTRE HORIZON DE VIE
**Objectif** : Visualiser les 3 phases (nouveau composant **PhaseTimeline**)  
**Message** : _"3 phases distinctes : constituer, profiter, transmettre"_

**Visuel** :
```
┌──────────────────────────────────────────────────────────────┐
│  VOTRE HORIZON DE VIE                                        │
│  ─────                                                       │
│                                                              │
│       45 ans            65 ans                  85 ans       │
│         │                 │                       │          │
│    ┌────┴─────────────────┴───────────────────────┴────┐     │
│    │  ÉPARGNE (20 ans)  │  LIQUIDATION (20 ans)  │ TR │     │
│    │  ████████████████  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │ ░░ │     │
│    │  Je verse          │  Je perçois des        │Décès│     │
│    │  pour constituer   │  revenus               │     │     │
│    └────────────────────┴────────────────────────┴─────┘     │
│                                                              │
│  💡 Durée épargne : 20 ans | Durée liquidation : 20 ans      │
│     Âge au décès hypothétique : 85 ans                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Données** : `client.ageActuel`, `product.dureeEpargne`, `transmission.ageAuDeces`

---

#### Slide 4 : MATCH — PRODUITS COMPARÉS
**Objectif** : Présenter les 2 enveloppes côte à côte (**MatchCard**)  
**Message** : _"AV vs PER : fiscalité et flexibilité différentes"_

**Visuel** :
```
┌──────────────────────────────────────────────────────────────┐
│  VOS PRODUITS COMPARÉS                                       │
│  ─────                                                       │
│                                                              │
│  ┌─────────────────────────┐   ┌─────────────────────────┐   │
│  │      PRODUIT 1          │   │      PRODUIT 2          │   │
│  │  ═══════════════════    │   │  ═══════════════════    │   │
│  │                         │   │                         │   │
│  │  Assurance-Vie          │   │  PER Individuel         │   │  ← 20pt c1 bold
│  │                         │   │                         │   │
│  │  Versement initial      │   │  Versement initial      │   │
│  │  50 000 €               │   │  50 000 €               │   │
│  │                         │   │                         │   │
│  │  Versements annuels     │   │  Versements annuels     │   │
│  │  12 000 €               │   │  12 000 €               │   │
│  │                         │   │                         │   │
│  │  Rendement net          │   │  Rendement net          │   │
│  │  4,5 %                  │   │  4,5 %                  │   │
│  │                         │   │                         │   │
│  │  Frais de gestion       │   │  Frais de gestion       │   │
│  │  0,80 %                 │   │  0,80 %                 │   │
│  │                         │   │                         │   │
│  └─────────────────────────┘   └─────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Données** : `products[0]`, `products[1]` (envelope, versements, rendement, frais)

---

#### Slide 5 : PHASE ÉPARGNE — RÉSULTATS
**Objectif** : Capital acquis à fin épargne (KPI + deltas)  
**Message** : _"Je verse combien, sur quoi, rendement, capital obtenu"_

**Visuel** : 2 colonnes KPI avec deltas
```
┌──────────────────────────────────────────────────────────────┐
│  PHASE ÉPARGNE — CAPITAL ACQUIS                              │
│  ─────                                                       │
│                                                              │
│       ASSURANCE-VIE              PER INDIVIDUEL              │
│                                                              │
│  [💵] Capital acquis         [💵] Capital acquis             │
│       612 340 €                   587 220 €                  │
│                                   Δ -25 120 €                │  ← Delta rouge
│                                                              │
│  [📄] Versements cumulés     [📄] Versements cumulés         │
│       290 000 €                   290 000 €                  │
│                                                              │
│  [💵] Effort réel            [💵] Effort réel                │
│       290 000 €                   203 000 €                  │
│                                   Δ -87 000 € ✅              │  ← Delta vert
│                                                              │
│  [%]  Économie IR cumulée    [%]  Économie IR cumulée        │
│       0 €                         87 000 €                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Données** : `epargne.capitalFin`, `cumulVersements`, `effortReel`, `cumulEconomieIR`, `deltas`

---

#### Slide 6 : PHASE LIQUIDATION — RÉSULTATS
**Objectif** : Revenus perçus pendant retraite  
**Message** : _"Revenus nets, fiscalité, stratégie de retrait"_

**Visuel** : KPI + graphique évolution retraits

**Données** : `liquidation.totalRetraits`, `totalFiscalite`, `revenuAnnuelMoyenNet`, `capitalRestantAuDeces`

---

#### Slide 7 : PHASE TRANSMISSION — RÉSULTATS
**Objectif** : Capital transmis net aux héritiers  
**Message** : _"Si décès à X ans, combien transmis net"_

**Visuel** : KPI + régime fiscal appliqué

**Données** : `transmission.capitalTransmis`, `abattement`, `regime`, `taxe`, `capitalTransmisNet`

---

#### Slide 8 : SYNTHÈSE COMPARATIVE FINALE
**Objectif** : Vue globale "Net Global" = Revenus + Transmission  
**Message** : _"Quel produit gagne sur l'ensemble du cycle de vie ?"_

**Visuel** : Tableau synthèse 2 colonnes + gagnant surligné
```
┌──────────────────────────────────────────────────────────────┐
│  SYNTHÈSE COMPARATIVE                                        │
│  ─────                                                       │
│                                                              │
│                          AV              PER                 │
│  ────────────────────────────────────────────────────────    │
│  Effort réel             290 000 €       203 000 €     ✅    │
│  Capital acquis          612 340 €       587 220 €           │
│  Revenus nets liquidation 569 000 €      483 600 €           │
│  Capital transmis net    156 500 €       89 400 €            │
│  ────────────────────────────────────────────────────────    │
│  NET GLOBAL              725 500 €       573 000 €     ✅    │  ← Gagnant en bold c2
│  ════════════════════════════════════════════════════════    │
│                                                              │
│  💡 L'AV offre un meilleur rendement global sur 40 ans,      │
│     malgré un effort initial supérieur.                      │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Données** : Agrégation des 3 phases + `deltas.netGlobal`

---

#### Slide 9 : DISCLAIMER

---

### 4.2 Storyboard Annexes CGP (8 slides)

#### Slide A1-A2 : TABLEAU ÉPARGNE DÉTAILLÉ (P1 & P2)
**Colonnes** : Année | Âge | Versement brut | Versement net | Gains capi | Revenus distrib | Fiscalité | Capital fin

**Texte d'introduction** :
> "Ce tableau détaille année par année la constitution de votre capital. Les versements nets tiennent compte des frais d'entrée. Les gains sont calculés au taux de rendement net de frais de gestion."

---

#### Slide A3 : DÉTAIL VERSEMENTS ET ALLOCATION
**Contenu** :
- Versement initial : 50 000 € (frais 2%, net 49 000 €)
- Versements annuels : 12 000 € × 20 ans = 240 000 €
- Versements ponctuels : liste si applicable
- Allocation : 70% capitalisation / 30% distribution
- Stratégie distribution : Réinvestir vers capitalisation

---

#### Slide A4-A5 : TABLEAU LIQUIDATION DÉTAILLÉ (P1 & P2)
**Colonnes** : Année | Âge | Capital début | Gains | Retrait brut | Quote-part gains | Fiscalité IR+PS | Retrait net | Capital fin

**Texte d'introduction** :
> "Ce tableau montre les retraits effectués pendant la phase de liquidation. La fiscalité dépend de l'ancienneté du contrat et de la quote-part de gains dans chaque retrait."

---

#### Slide A6 : RÈGLES FISCALES — RACHATS AV
**Contenu** :
```
FISCALITÉ DES RACHATS ASSURANCE-VIE (après 8 ans)

Quote-part gains = Plus-value latente × (Retrait / Capital)

Versements avant 27/09/2017 :
- Barème IR ou PFL 7,5%

Versements après 27/09/2017 :
- PFU 12,8% (ou barème IR sur option)
- Abattement 4 600 € (célibataire) / 9 200 € (couple)

Prélèvements sociaux : 17,2% sur les gains
```

**Données** : `fiscalParams.av`

---

#### Slide A7 : RÈGLES FISCALES — TRANSMISSION
**Contenu** :
```
RÉGIMES FISCAUX AU DÉCÈS

┌───────────────────────────────────────────────────────────┐
│ ARTICLE 990 I CGI (AV versements avant 70 ans)            │
│ - Abattement : 152 500 € par bénéficiaire                 │
│ - Taux : 20% jusqu'à 700 000 €, puis 31,25%               │
│ - PS sur plus-values : 17,2%                              │
├───────────────────────────────────────────────────────────┤
│ ARTICLE 757 B CGI (AV versements après 70 ans)            │
│ - Abattement global : 30 500 €                            │
│ - Au-delà : DMTG selon lien de parenté                    │
│ - Plus-values : exonérées !                               │
├───────────────────────────────────────────────────────────┤
│ DMTG (PER, PEA, CTO)                                      │
│ - Droits de mutation selon barème succession              │
│ - Abattement enfants : 100 000 € chacun                   │
│ - Taux : 5% à 45% selon tranche                           │
└───────────────────────────────────────────────────────────┘
```

**Données** : `fiscalParams.transmission`

---

#### Slide A8 : DISCLAIMER

---

## 5) SLIDE KIT RÉUTILISABLE

### 5.1 Composants définis

| Composant | Usage | Helpers existants | À créer |
|-----------|-------|-------------------|---------|
| **Cover** | Page de garde tous simulateurs | `drawTitleWithOverline()` | ✅ Existe |
| **SplitImage** | Objectifs & Contexte (style PAGE 2) | `applySplitLayout()` | ✅ Existe |
| **KPI4** | Ligne de 3-4 KPI avec icônes | `drawKpiRow()` | ✅ Existe |
| **SegmentedBracket** | Barre TMI colorée avec position | `drawSegmentedBar()` | 🔧 Améliorer couleurs |
| **LoanSummaryCard** | Carte synthèse crédit | — | 🆕 À créer |
| **MatchCard** | Comparaison P1 vs P2 côte à côte | — | 🆕 À créer |
| **PhaseTimeline** | Frise 3 phases (Épargne/Liquidation/Transmission) | — | 🆕 À créer |
| **ResultLine** | Résultat final souligné | `drawResultLine()` | ✅ Existe |
| **AnnexTablePaged** | Tableau annexe avec pagination auto | — | 🆕 À créer |
| **Disclaimer** | Slide disclaimer standard | — | ✅ Template |

### 5.2 Nouveaux helpers à implémenter

#### `drawLoanSummaryCard(slide, options)`
```typescript
interface LoanSummaryCardOptions {
  x?: number;
  y?: number;
  width?: number;
  capital: number;
  dureeAnnees: number;
  dureeMois: number;
  tauxNominal: number;
  tauxAssurance: number;
  mensualiteTotale: number;
  mensualiteAssurance: number;
  taeg: number;
  colors: PptxColors;
}
```

#### `drawMatchCard(slide, options)`
```typescript
interface MatchCardOptions {
  x?: number;
  y?: number;
  product1: { label: string; metrics: {key: string; value: string}[] };
  product2: { label: string; metrics: {key: string; value: string}[] };
  colors: PptxColors;
}
```

#### `drawPhaseTimeline(slide, options)`
```typescript
interface PhaseTimelineOptions {
  x?: number;
  y?: number;
  width?: number;
  ageActuel: number;
  ageFinEpargne: number;
  ageAuDeces: number;
  colors: PptxColors;
}
```

#### `drawAnnexTable(slide, options)` (avec auto-pagination)
```typescript
interface AnnexTableOptions {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  maxRowsPerSlide?: number; // défaut 25
  introText?: string; // Texte pédagogique avant tableau
  colors: PptxColors;
}
// Retourne nombre de slides créées
```

---

## 6) LISTE DES CHAMPS DE DONNÉES MANQUANTS

| # | Champ | Simulateur | Type | Description |
|---|-------|------------|------|-------------|
| 1 | `montantDansTMI` | IR | number | Revenus imposés à la TMI (pour affichage sous barre) |
| 2 | `margeAvantChangement` | IR | number | Euros avant passage tranche suivante |
| 3 | `splitImageUrl` | TOUS | string | URL image premium pour slide split 50/50 |
| 4 | `hypotheses[]` | IR | string[] | Liste hypothèses de calcul |
| 5 | `sourceJuridique` | IR | string | Référence BOI barème |
| 6 | `echeancierResume[]` | Crédit | array | Échéancier agrégé par année (pas mois) |
| 7 | `introTextAnnexe` | TOUS | string | Texte pédagogique introduction annexes |
| 8 | `regimeTransmission` | Placement | string | "990 I" / "757 B" / "DMTG" |
| 9 | `netGlobal` | Placement | number | Somme revenus liquidation + capital transmis net |
| 10 | `gagnant` | Placement | "P1" / "P2" | Produit gagnant sur net global |

---

## 7) DEFINITION OF DONE — 15 CRITÈRES DESIGN

| # | Critère | Test | Attendu |
|---|---------|------|---------|
| 1 | **Marges** | Mesurer zone utile | 0.75" tous côtés |
| 2 | **Cover overline** | Vérifier ligne | Ligne blanche AU-DESSUS titre, 50% largeur |
| 3 | **Footer 3 zones** | Vérifier alignement | Date (gauche) + Disclaimer court (centre) + Page (droite) |
| 4 | **Valeurs KPI** | Mesurer taille police | 28pt contenu, 52pt hero |
| 5 | **Barre TMI (IR)** | Vérifier présence | Barre segmentée 5 couleurs + marqueur position |
| 6 | **Carte prêt (Crédit)** | Vérifier présence | LoanSummaryCard avec tous paramètres |
| 7 | **Match P1/P2 (Placement)** | Vérifier présence | MatchCard 2 colonnes côte à côte |
| 8 | **PhaseTimeline (Placement)** | Vérifier présence | Frise 3 phases avec âges |
| 9 | **Annexes paginées** | Compter lignes | Max 25 lignes/slide, split auto si plus |
| 10 | **Texte intro annexes** | Vérifier présence | Paragraphe explicatif avant chaque tableau |
| 11 | **Disclaimer LONG** | Comparer texte | Texte exact SPEC PARTIE 1 (3 paragraphes) |
| 12 | **Icônes SVG** | Vérifier affichage | 4 icônes (money, document, scale, percent) sans emoji |
| 13 | **Palette couleurs** | Vérifier tokens | Uniquement c1-c10, pas de couleurs hardcodées |
| 14 | **Split image** | Vérifier slide 2 | Au moins 1 slide split 50/50 image+contenu |
| 15 | **Pas de slide orpheline** | Compter slides | Toutes slides ont contenu significatif, pas de slide <30% remplie |

---

## 8) PROCHAINES ÉTAPES

1. **Implémenter nouveaux helpers** : `drawLoanSummaryCard`, `drawMatchCard`, `drawPhaseTimeline`, `drawAnnexTable`
2. **Améliorer `drawSegmentedBar`** : Ajouter gradient couleurs pour barre TMI
3. **Ajouter champs manquants** dans les moteurs de calcul
4. **Créer assets images** : Images premium pour slides split (lion, architecture, patrimoine)
5. **Mettre à jour générateurs** : `irPptx.ts`, `creditPptx.ts`, `placementPptx.ts`
6. **Tests visuels** : Générer exports et comparer pixel-perfect avec Présentation1

---

*Document SPEC V2 — Version 2.0 — 13 janvier 2026*
