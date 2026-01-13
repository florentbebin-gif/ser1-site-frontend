# SPEC EXPORT POWERPOINT — PARTIE 3C : EXCEL + DOD + QUESTIONS

---

## E) STRUCTURE EXCEL EXPORT

### Objectif
Export Excel complémentaire au PPT, orienté "data brutes" pour recalcul / vérification CGP.

### Architecture fichier
- Format : `.xlsx` (Excel 2007+)
- Bibliothèque : `xlsx` ou équivalent
- Nom fichier : `Placement_[NomClient]_[Date]_[Produit1]_vs_[Produit2].xlsx`

---

### Onglet 1 : "SYNTHÈSE"

**Objectif** : Vue récapitulative comparative 2 produits (tableau horizontal)

**Structure** :

| **Catégorie** | **Métrique** | **Produit 1** | **Produit 2** | **Delta** | **Meilleur** |
|---------------|--------------|---------------|---------------|-----------|--------------|
| **Client** | Âge actuel | 45 | 45 | — | — |
| | TMI épargne | 30% | 30% | — | — |
| | TMI retraite | 11% | 11% | — | — |
| | Situation | Célibataire | Célibataire | — | — |
| **Produit** | Enveloppe | AV | PER | — | — |
| | Durée épargne | 20 ans | 20 ans | — | — |
| | Frais gestion | 1,0% | 0,8% | +0,2% | Produit 2 |
| **Épargne** | Capital acquis | 612 340 € | 587 220 € | +25 120 € | Produit 1 ✅ |
| | Versements cumulés | 290 000 € | 290 000 € | 0 € | — |
| | Gains cumulés | 322 340 € | 297 220 € | +25 120 € | Produit 1 ✅ |
| | Effort réel | 290 000 € | 203 000 € | +87 000 € | Produit 2 ✅ |
| | Économie IR | 0 € | 87 000 € | -87 000 € | Produit 2 ✅ |
| | Revenus distribués nets | 29 780 € | 0 € | +29 780 € | Produit 1 ✅ |
| **Liquidation** | Durée | 20 ans | 20 ans | 0 ans | — |
| | Revenu annuel moyen net | 28 450 € | 24 180 € | +4 270 € | Produit 1 ✅ |
| | Cumul revenus nets (jusqu'au décès) | 569 000 € | 483 600 € | +85 400 € | Produit 1 ✅ |
| | Capital restant au décès | 43 220 € | 0 € | +43 220 € | Produit 1 ✅ |
| **Transmission** | Régime fiscal | 990 I | DMTG | — | — |
| | Abattement | 152 500 € | 100 000 € | +52 500 € | Produit 1 ✅ |
| | Fiscalité décès | 0 € | 0 € | 0 € | — |
| | Capital transmis net | 43 220 € | 0 € | +43 220 € | Produit 1 ✅ |
| **Totaux** | Effort total | 290 000 € | 290 000 € | 0 € | — |
| | Effort réel | 290 000 € | 203 000 € | +87 000 € | Produit 2 ✅ |
| | Fiscalité totale | 125 000 € | 110 000 € | +15 000 € | Produit 2 ✅ |
| | Revenus nets total | 598 780 € | 483 600 € | +115 180 € | Produit 1 ✅ |
| | Capital transmis net | 43 220 € | 0 € | +43 220 € | Produit 1 ✅ |

**Mise en forme** :
- Entêtes en gras, fond c1
- Lignes catégories en gras, fond c7
- Format monétaire : `# ##0 €`
- Format pourcentage : `0,0%`
- Mise en forme conditionnelle colonne "Meilleur" : ✅ vert si meilleur
- Delta positif = vert si bon pour métrique, rouge si mauvais

---

### Onglet 2 : "ÉPARGNE_PRODUIT_1"

**Objectif** : Détail annuel phase épargne produit 1

**Colonnes** :
1. Année
2. Âge
3. Versement brut (€)
4. Frais entrée (€)
5. Versement net (€)
6. Capital début (€)
7. Capital capi (€)
8. Capital distrib (€)
9. Gains capi (€)
10. Gains distrib (€)
11. Revenus distribués (€)
12. Fiscalité revenus (€)
13. Revenus nets perçus (€)
14. Économie IR (€)
15. Capital fin (€)
16. Cumul versements (€)
17. Cumul gains (€)

**Lignes** : 1 ligne par année (jusqu'à 30 lignes max)

**Format** :
- Entêtes en gras, fond c1
- Lignes alternées (blanc / c7)
- Format monétaire : `# ##0 €`
- Ligne totale en fin (gras, fond c4)
- Bordures tableau (contour 2pt, grille interne 0.5pt)

**Source données** : `result.epargne.rows[]`

---

### Onglet 3 : "ÉPARGNE_PRODUIT_2"

**Structure** : Identique à onglet 2, pour produit 2

---

### Onglet 4 : "LIQUIDATION_PRODUIT_1"

**Objectif** : Détail annuel phase liquidation produit 1

**Colonnes** :
1. Année
2. Âge
3. Au décès ? (Oui/Non)
4. Capital début (€)
5. Gains année (€)
6. Retrait brut (€)
7. Part gains (€)
8. Part capital (€)
9. IR sur gains (€)
10. IR sur capital (€)
11. PS (€)
12. Fiscalité totale (€)
13. Retrait net (€)
14. Capital fin (€)
15. PV latente début (€)
16. PV latente fin (€)

**Lignes** : 1 ligne par année (jusqu'à 30 lignes max)

**Format** :
- Entêtes en gras, fond c2
- Ligne "au décès" : fond c4 (highlight)
- Lignes alternées (blanc / c7)
- Format monétaire : `# ##0 €`
- Ligne totale en fin (gras, fond c4)

**Source données** : `result.liquidation.rows[]`

---

### Onglet 5 : "LIQUIDATION_PRODUIT_2"

**Structure** : Identique à onglet 4, pour produit 2

---

### Onglet 6 : "TRANSMISSION"

**Objectif** : Détail calcul transmission pour les 2 produits

**Structure** :

| **Métrique** | **Produit 1** | **Produit 2** |
|--------------|---------------|---------------|
| **Capital transmis brut** | 43 220 € | 0 € |
| **Régime fiscal** | 990 I | DMTG |
| **Détail 990 I / 757 B / DMTG** | | |
| Âge au décès | 85 ans | 85 ans |
| Âge premier versement | 45 ans | 45 ans |
| Primes < 70 ans ? | Oui | N/A |
| Abattement applicable | 152 500 € | 100 000 € |
| Nombre bénéficiaires | 2 | 2 |
| Abattement par bénéficiaire | 76 250 € | 50 000 € |
| **Calcul assiette taxable** | | |
| Capital transmis brut | 43 220 € | 0 € |
| - Abattement total | 152 500 € | 100 000 € |
| = Assiette taxable | 0 € | 0 € |
| **Fiscalité décès** | | |
| Tranche 1 (base × taux) | 0 € (20%) | 0 € (5%) |
| Tranche 2 (base × taux) | 0 € (31,25%) | 0 € (10%) |
| Taxe forfaitaire / DMTG | 0 € | 0 € |
| **PS décès** | | |
| PS applicables ? | Oui | Non |
| Assiette PS (gains latents) | 8 220 € | 0 € |
| Taux PS | 17,2% | — |
| Montant PS | 1 414 € | 0 € |
| **Total fiscalité décès** | 1 414 € | 0 € |
| **Capital transmis net** | **41 806 €** | **0 €** |

**Format** :
- Sections séparées visuellement (lignes vides, fond c7)
- Format monétaire : `# ##0 €`
- Format pourcentage : `0,0%`

**Source données** : `result.transmission`

---

### Onglet 7 : "PARAMÈTRES"

**Objectif** : Lister tous paramètres utilisés (client, produit, fiscal)

**Structure** :

#### Section A : Client

| Paramètre | Valeur |
|-----------|--------|
| Nom client | Jean Dupont |
| Âge actuel | 45 ans |
| Situation | Célibataire |
| TMI épargne | 30% |
| TMI retraite | 11% |
| Objectifs | Constitution capital retraite, Transmission patrimoine |

#### Section B : Produit 1

| Paramètre | Valeur |
|-----------|--------|
| Enveloppe | Assurance-vie multisupport |
| Durée épargne | 20 ans |
| Frais gestion | 1,0% / an |
| **Versement initial** | |
| Montant brut | 50 000 € |
| Frais entrée | 2,0% (1 000 €) |
| Montant net | 49 000 € |
| Allocation capitalisation | 70% (34 300 €) |
| Allocation distribution | 30% (14 700 €) |
| **Versement annuel** | |
| Montant brut | 12 000 € |
| Frais entrée | 0,0% (0 €) |
| Montant net | 12 000 € |
| Allocation capitalisation | 70% (8 400 €) |
| Allocation distribution | 30% (3 600 €) |
| **Rendements** | |
| Capitalisation | 4,5% / an net FG |
| Distribution (loyers) | 3,0% / an |
| Revalorisation capital distrib | 2,0% / an |
| **Liquidation** | |
| Mode | Épuiser sur N années |
| Durée | 20 ans |
| Rendement liquidation | 4,5% / an |
| Option barème IR | Non (PFU) |

#### Section C : Produit 2

(Idem structure Section B)

#### Section D : Paramètres fiscaux (2024)

| Paramètre | Valeur |
|-----------|--------|
| PFU IR | 12,8% |
| PFU PS | 17,2% |
| PFU total | 30,0% |
| PS patrimoine | 17,2% |
| AV abattement 8 ans (single) | 4 600 € |
| AV abattement 8 ans (couple) | 9 200 € |
| AV seuil primes 150k | 150 000 € |
| AV taux < 150k (8 ans) | 7,5% |
| AV taux >= 150k (8 ans) | 12,8% |
| AV 990 I abattement | 152 500 € / bénéficiaire |
| AV 990 I tranche 1 taux | 20% |
| AV 990 I tranche 1 plafond | 700 000 € |
| AV 990 I tranche 2 taux | 31,25% |
| AV 757 B abattement | 30 500 € (global) |
| PEA ancienneté min (exo IR) | 5 ans |
| Dividendes abattement | 40% |
| DMTG enfants abattement | 100 000 € / enfant |
| DMTG taux choisi (défaut) | 20% |

**Format** :
- Sections séparées visuellement
- Entêtes sections en gras, fond c1
- Format monétaire : `# ##0 €`
- Format pourcentage : `0,0%`

---

### Onglet 8 : "MÉTHODOLOGIE"

**Objectif** : Documentation méthodologique (formules, hypothèses, limites)

**Contenu** (texte libre, mise en forme simple) :

#### A. Formules de calcul

**Phase épargne** :
- Capital fin année N = (Capital début + Versements nets + Gains capi + Gains distrib) - Fiscalité revenus
- Gains capitalisation = Capital capi × Rendement capi
- Gains distribution = Capital distrib × Rendement revalorisation
- Revenus distribués = Capital distrib × Taux distribution
- Fiscalité revenus = Revenus × (TMI + PS)
- Économie IR PER = Versements × TMI épargne

**Phase liquidation** :
- VPM (épuiser sur N ans) = C × r / (1 - (1+r)^-N)
- Quote-part gains = PV latente / Capital total
- Gains dans retrait = Retrait × Quote-part
- Fiscalité AV >= 8 ans = max(0, (Gains - Abattement)) × Taux + Gains × PS
- Fiscalité PER capital = Primes × TMI retraite + Gains × (PFU IR + PS)

**Phase transmission** :
- Capital transmis = Capital restant au décès
- PS décès (AV/PEA UC) = Gains latents × 17,2%
- Fiscalité 990 I = max(0, (Capital - Abattement - 700k)) × 20% + max(0, (Capital - Abattement)) × 31,25%
- Fiscalité DMTG = Barème progressif appliqué après abattement

#### B. Hypothèses simplificatrices

- Rendements constants sur toute la durée (pas de volatilité)
- Pas de rachats partiels non programmés
- Pas de versements libres complémentaires hors programme
- TMI constant sur toute la phase (pas d'évolution revenus)
- Barèmes fiscaux figés (pas de réformes législatives)
- Pas de frais exceptionnels (arbitrages, frais sortie...)
- Inflation non prise en compte (érosion pouvoir d'achat)

#### C. Limites et avertissements

- Simulation indicative, pas une promesse de résultat
- Performance passée ne préjuge pas performance future
- Risque de perte en capital (UC)
- Évolution possible législation fiscale
- Frais de succession (notaire) non inclus
- Changements situation familiale non anticipés
- Garanties complémentaires non détaillées (garantie plancher, rente éducation)
- Consulter votre CGP pour conseil personnalisé

#### D. Source données

- Paramètres fiscaux : Loi de finances 2024, barèmes officiels
- Rendements : Hypothèses client
- Frais : Conditions contractuelles produits
- Date simulation : [Date génération]

**Format** : Texte libre, bullet points, sections, pas de tableau

---

### Onglet 9 : "GRAPHIQUES" (optionnel V2)

**Objectif** : Export graphiques clés pour réutilisation

**Contenu** :
- Graphique évolution capitale épargne (ligne)
- Graphique retraits liquidation (ligne)
- Radar chart comparaison (si export possible en Excel)

**Note** : Dépend des capacités bibliothèque Excel utilisée

---

## F) DEFINITION OF DONE (DoD)

### Critères testables pour validation export PPT Placement

#### 1. **Export PPT généré sans erreur**
- ✅ Fichier `.pptx` généré et téléchargeable
- ✅ Nom fichier respecte format : `Placement_[NomClient]_[Date]_[Produit1]_vs_[Produit2].pptx`
- ✅ Taille fichier < 50 Mo (optimisation images)

#### 2. **Respect thème et tokens couleurs**
- ✅ Toutes les couleurs proviennent des tokens `c1`...`c10` (aucune couleur hardcodée)
- ✅ Cover slide utilise `cover_slide_url` si disponible
- ✅ Polices : Arial (ou équivalent système)
- ✅ Pas de logo hardcodé, utilise logo cabinet si disponible

#### 3. **Structure slides respectée**
- ✅ Partie Client : 10-14 slides (selon présence revenus distribués)
- ✅ Partie Annexes CGP : 8-12 slides
- ✅ Slide Cover présente avec nom client
- ✅ Slide Disclaimer présente avec texte exact fourni
- ✅ Slide Section Header "Annexes CGP" présente

#### 4. **Données Client correctes**
- ✅ Slide 4 : Capital acquis, effort réel, économie IR affichés avec valeurs exactes `result.epargne.*`
- ✅ Slide 7 : Revenus nets liquidation, capital restant au décès affichés avec valeurs exactes `result.liquidation.*`
- ✅ Slide 9 : Capital transmis net, régime fiscal affichés avec valeurs exactes `result.transmission.*`
- ✅ Slide 10 : Deltas calculés correctement (produit1 - produit2)
- ✅ Slide 10 : Meilleurs produits identifiés correctement selon critères

#### 5. **Graphiques présents et corrects**
- ✅ Slide 5 : Graphique ligne évolution capital épargne (2 produits + versements cumulés)
- ✅ Slide 8 : Graphique ligne retraits liquidation (2 produits, par âge)
- ✅ Slide 10 : Radar chart comparaison (5 axes) OU tableau comparatif si radar non dispo
- ✅ Axes gradués, légendes présentes, lisibilité garantie

#### 6. **Annexes détaillées complètes**
- ✅ Annexe A1/A2 : Tableaux épargne détaillés (colonnes année, âge, versement, gains, capital, ...)
- ✅ Annexe A5/A6 : Tableaux liquidation détaillés (colonnes année, âge, retrait, fiscalité, ...)
- ✅ Annexe A3 : Détail versements (initial, annuel, ponctuels) avec allocation
- ✅ Annexe A4 : Hypothèses rendements et frais documentées
- ✅ Annexes A7/A8/A9 : Règles fiscales expliquées avec formules et exemples chiffrés

#### 7. **Conditionnalité revenus distribués**
- ✅ Slide 6 (revenus distribués) présente SEULEMENT si `cumulRevenusDistribues > 0`
- ✅ Si 100% capitalisation : slide 6 omise, numérotation ajustée

#### 8. **Mise en page et lisibilité**
- ✅ Grille 10-12 colonnes respectée (alignements précis)
- ✅ Cartes KPI : fond c7, bordure c3, texte c10, valeur en gras
- ✅ Tableaux : entêtes fond c1, lignes alternées blanc/c7, bordures c8
- ✅ Pas de débordement texte (wrap automatique ou taille police ajustée)
- ✅ Marges uniformes : 0.5" (1.27 cm) sur tous côtés

#### 9. **Comparaison 2 produits cohérente**
- ✅ Tous les slides Client affichent les 2 produits côte à côte (sauf Cover, Objectifs, Section Header)
- ✅ Deltas calculés et affichés avec indicateur visuel (vert/rouge selon métrique)
- ✅ "Meilleur" produit identifié selon critère (effort, revenus, transmission)

#### 10. **Export Excel complémentaire généré**
- ✅ Fichier `.xlsx` généré avec même nom base que PPT
- ✅ 7-8 onglets présents (Synthèse, Épargne 1/2, Liquidation 1/2, Transmission, Paramètres, Méthodologie)
- ✅ Données Excel cohérentes avec données PPT (vérification croisée)
- ✅ Mise en forme conditionnelle active (deltas, meilleurs)

#### 11. **Aucune donnée inventée ou hardcodée**
- ✅ Toutes les données proviennent de `result`, `client`, `product`, `fiscalParams`
- ✅ Pas de valeurs fictives (ex: "XX 000 €" ou "À calculer")
- ✅ Formules fiscales exactes (source : `placementEngine.js`)

#### 12. **Performance et UX**
- ✅ Génération PPT < 10 secondes (pour simulation standard 20 ans épargne + 20 ans liquidation)
- ✅ Pas de freeze UI pendant génération (async ou loading indicator)
- ✅ Message succès clair après téléchargement
- ✅ Bouton "Exporter PPT" activé uniquement si simulation complète (3 phases remplies)

---

## G) QUESTIONS BLOQUANTES ET HYPOTHÈSES

### Questions critiques nécessitant décision USER

#### Q1. **Nom client dans UI Placement**
**Contexte** : Actuellement, `/sim/placement` n'a pas de champ "Nom client".

**Options** :
- A) Ajouter input texte "Nom client" dans UI Placement (recommandé)
- B) Utiliser nom utilisateur connecté (générique)
- C) Laisser champ vide et mettre "Client" par défaut

**Décision attendue** : ?

---

#### Q2. **Objectifs textuels**
**Contexte** : Slide 2 nécessite liste objectifs client (ex: "Constitution capital retraite", "Transmission patrimoine").

**Options** :
- A) Ajouter textarea "Objectifs" (3-5 objectifs max) dans UI Placement
- B) Générer automatiquement selon enveloppes choisies (ex: PER → "Réduction IR immédiate", AV → "Transmission optimisée")
- C) Omettre slide Objectifs

**Décision attendue** : ?

---

#### Q3. **Génération PPT : où placer le bouton ?**
**Contexte** : `/sim/placement` a 4 étapes (épargne, liquidation, transmission, synthèse).

**Options** :
- A) Bouton "Exporter PPT" sur étape finale "Synthèse" uniquement
- B) Bouton "Exporter PPT" visible sur toutes étapes, mais désactivé si simulation incomplète
- C) Bouton dans menu global (header/sidebar)

**Décision attendue** : ?

---

#### Q4. **Garanties complémentaires détaillées**
**Contexte** : Garantie plancher, rente éducation, capital décès hors `garantieBonneFin` ne sont pas implémentées.

**Options** :
- A) Ajouter ces garanties dans `versementConfig` (extension structure)
- B) Omettre pour V1, enrichir en V2
- C) Documenter seulement `garantieBonneFin` existante

**Décision attendue** : ?

---

#### Q5. **Scénarios de sensibilité**
**Contexte** : Variation rendements +/-1%, TMI +/-5% pour tester robustesse.

**Options** :
- A) Implémenter scénarios multiples (3 scénarios : pessimiste, central, optimiste) → 3 PPT ou 1 PPT avec slides supplémentaires
- B) Hors scope V1, prévoir architecture pour V2
- C) Ne pas implémenter (complexité excessive)

**Décision attendue** : ?

---

#### Q6. **Export Excel : généré automatiquement avec PPT ou séparément ?**
**Contexte** : Export Excel peut être généré en même temps que PPT ou via bouton séparé.

**Options** :
- A) Générer automatiquement Excel + PPT en même temps (2 fichiers téléchargés)
- B) Bouton séparé "Exporter Excel" (permet génération indépendante)
- C) Excel uniquement, pas de PPT (CGP préfère Excel pour recalculs)

**Décision attendue** : ?

---

#### Q7. **Radar chart ou tableau comparatif ?**
**Contexte** : Slide 10 comparaison : radar chart visuellement efficace MAIS complexe à générer en PPT.

**Options** :
- A) Implémenter radar chart (PptxGenJS supporte charts, mais configuration complexe)
- B) Utiliser tableau comparatif simple avec indicateurs visuels (✅❌)
- C) Utiliser graphique barres horizontales (plus simple que radar)

**Décision attendue** : ?

---

#### Q8. **Disclaimer : identique pour tous simulateurs ou spécifique ?**
**Contexte** : Disclaimer fourni PARTIE 1 semble générique. Placement nécessite-t-il disclaimer spécifique ?

**Options** :
- A) Utiliser disclaimer générique fourni (identique IR/Crédit/Placement)
- B) Ajouter disclaimer spécifique Placement (ex: "Rendements non garantis, risque perte capital UC")
- C) Pas de disclaimer slide (seulement mentions légales en footer)

**Décision attendue** : ?

---

#### Q9. **Frais de notaire dans transmission**
**Contexte** : Frais notaire succession (2-5% capital transmis) ne sont pas calculés actuellement.

**Options** :
- A) Ajouter estimation forfaitaire (ex: 3% capital transmis)
- B) Ajouter input "Frais notaire estimés" (€)
- C) Omettre (hors scope fiscal)

**Décision attendue** : ?

---

#### Q10. **Profil risque investisseur**
**Contexte** : Slide 12 Risques pourrait être enrichi avec profil risque client.

**Options** :
- A) Ajouter dropdown "Profil risque" (Prudent / Équilibré / Dynamique) dans UI
- B) Déduire automatiquement selon allocation (100% capi = dynamique, 100% distrib = prudent)
- C) Omettre (pas pertinent pour simulation)

**Décision attendue** : ?

---

### Hypothèses retenues (sauf décision contraire)

1. **Nom client** : Input texte libre dans UI Placement, requis pour génération PPT
2. **Objectifs** : Générés automatiquement selon enveloppes (ex: PER → "Réduction IR", AV → "Transmission optimisée")
3. **Bouton PPT** : Sur étape "Synthèse" uniquement, activé si simulation complète
4. **Garanties complémentaires** : Seulement `garantieBonneFin` documentée, autres omises V1
5. **Scénarios sensibilité** : Hors scope V1, architecture prévue pour V2
6. **Export Excel** : Généré automatiquement avec PPT (2 fichiers)
7. **Radar chart** : Remplacé par tableau comparatif avec indicateurs visuels (plus simple)
8. **Disclaimer** : Utiliser disclaimer générique fourni PARTIE 1
9. **Frais notaire** : Omis (hors scope fiscal)
10. **Profil risque** : Omis V1

---

## H) LIVRABLES FINAUX

### Livrables SPEC (documentation)

✅ **SPEC_EXPORT_PPT_PARTIE_1.md** : Audit repo + PPT Template System
✅ **SPEC_EXPORT_PPT_PARTIE_2_STORYBOARDS.md** : Storyboards IR + Crédit
✅ **SPEC_EXPORT_PPT_PARTIE_3A_STORYBOARD_PLACEMENT.md** : Storyboard Placement
✅ **SPEC_EXPORT_PPT_PARTIE_3B_INVENTORY_DATA_PLACEMENT.md** : Inventaire data Placement
✅ **SPEC_EXPORT_PPT_PARTIE_3C_EXCEL_DOD_QUESTIONS.md** : Excel + DoD + Questions

### Livrables CODE (à implémenter après validation SPEC)

🔲 **src/pptx/placementPptx.ts** : Générateur PPT Placement
🔲 **src/utils/placementExcelExport.ts** : Générateur Excel Placement
🔲 **UI : Ajout champ "Nom client"** dans `/sim/placement`
🔲 **UI : Bouton "Exporter PPT + Excel"** sur étape Synthèse
🔲 **Tests unitaires** : `placementPptx.test.ts`, `placementExcelExport.test.ts`

---

## NEXT STEPS

1. **Validation USER** : Lire SPEC complète (3 parties), valider approche, répondre questions bloquantes
2. **Itération SPEC** : Ajuster selon feedbacks USER
3. **Go/No-Go implémentation** : Validation finale avant coding
4. **Implémentation** : Coder `placementPptx.ts` selon SPEC
5. **Tests** : Valider DoD (12 critères)
6. **Déploiement** : Merge + prod

---

**FIN DU DOCUMENT — SPEC EXPORT POWERPOINT PREMIUM — PARTIE 3C**
