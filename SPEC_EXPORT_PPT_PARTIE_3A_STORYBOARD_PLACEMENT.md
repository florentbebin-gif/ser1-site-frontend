# SPEC EXPORT POWERPOINT — PARTIE 3A : STORYBOARD PLACEMENT

**Version** : 1.1 | **Date** : 2026-01-12  
**Style Guide** : Voir `STYLE_GUIDE_PPT_PREMIUM.md`

## STORYBOARD PLACEMENT (Simulateur complet 3 phases)

**Contexte** : Simulateur le plus complexe (Épargne → Liquidation → Transmission), comparaison 2 produits, 5 enveloppes possibles (AV, PER, PEA, CTO, SCPI).

### Partie Client (10-14 slides)

#### Slide 1 : Cover
- Fond c1 plein, **ligne blanche AU-DESSUS du titre** (style PAGE 1)
- **Helper** : `drawTitleWithOverline()`
- Titre : Nom client
- Sous-titre : "Étude comparative placement patrimonial"
- Cover image si disponible (10%×8%, bas droit, opacité 60%)

---

#### Slide 2 : Objectifs et horizon
**But** : Contextualiser la simulation  
**Visuel** : 3 blocs + frise temporelle
**Données** : `client.ageActuel`, `product.dureeEpargne`, `transmissionParams.ageAuDeces`, `client.situation`  
**Message** : _"Votre stratégie s'adapte à votre horizon de vie : accumuler, puis profiter, puis transmettre."_

#### Slide 3 : Produits comparés
**But** : Présenter les 2 enveloppes comparées (cartes côte à côte)  
**Données** : `product1/2.envelope`, `versementConfig`, `fraisGestion`, rendements  
**Message** : _"Chaque enveloppe a ses avantages fiscaux et contraintes."_

#### Slide 4 : Phase épargne — Capital acquis (Key Metrics)
**But** : Résultats fin phase épargne (4 KPI par produit)  
**Visuel** : Ligne de 4 KPI avec icônes (style PAGE 3)
- **Helper** : `drawKpiRow()`
- KPI 1 : icône `money` | **Capital acquis** | valeur
- KPI 2 : icône `document` | **Versements cumulés** | valeur
- KPI 3 : icône `money` | **Effort réel** | valeur
- KPI 4 : icône `percent` | **Économie IR** | valeur
**Données** : `epargne.capitalAcquis`, `cumulVersements`, `plusValueLatente`, `effortReel`, `cumulEconomieIR`  
**Message** : _"Le PER coûte moins cher à court terme, l'AV capitalise plus."_

#### Slide 5 : Phase épargne — Graphique évolution
**But** : Croissance du capital sur durée épargne (line chart)  
**Données** : `epargne.rows[]` {annee, capitalFin}  
**Message** : _"Les intérêts composés divergent progressivement."_

#### Slide 6 : Phase épargne — Revenus distribués (si applicable)
**But** : Revenus perçus (SCPI, CTO dividendes)  
**Données** : `cumulRevenusDistribues`, `cumulFiscaliteRevenus`  
**Conditionnel** : Seulement si distribution > 0  
**Message** : _"Ces revenus réduisent l'effort réel."_

#### Slide 7 : Phase liquidation — Synthèse (Key Metrics)
**But** : Revenus pendant retraite (4 KPI par produit)  
**Visuel** : Ligne de 3-4 KPI avec icônes
- **Helper** : `drawKpiRow()`
- KPI 1 : icône `money` | **Revenu annuel moyen net** | valeur
- KPI 2 : icône `money` | **Cumul revenus nets** | valeur
- KPI 3 : icône `scale` | **Capital restant au décès** | valeur
**Données** : `liquidation.revenuAnnuelMoyenNet`, `cumulRetraitsNetsAuDeces`, `capitalRestantAuDeces`  
**Message** : _"L'AV offre plus de revenus ET conserve un capital."_

#### Slide 8 : Phase liquidation — Graphique retraits
**But** : Retraits annuels nets (line chart par âge)  
**Données** : `liquidation.rows[]` {age, retraitNet}  
**Message** : _"Un capital épuisé trop tôt fragilise votre retraite."_

#### Slide 9 : Phase transmission — Synthèse (Key Metrics)
**But** : Capital transmis net aux héritiers  
**Visuel** : Ligne de 3-4 KPI avec icônes
- **Helper** : `drawKpiRow()`
- KPI 1 : icône `money` | **Capital transmis brut** | valeur
- KPI 2 : icône `scale` | **Abattement** | valeur
- KPI 3 : icône `percent` | **Fiscalité décès** | valeur
- KPI 4 : icône `money` | **Capital transmis net** | valeur (highlight)
**Données** : `transmission.capitalTransmis`, `regime`, `abattement`, `taxe`, `capitalTransmisNet`  
**Message** : _"L'assurance-vie bénéficie d'avantages fiscaux successoraux."_

#### Slide 10 : Comparaison globale
**But** : Vue 360° (tableau + radar chart)  
**Données** : `comparison.deltas`, `meilleurEffort`, `meilleurRevenus`, `meilleurTransmission`  
**Message** : _"Le PER est économe court terme, l'AV performante long terme. Stratégie mixte possible."_

#### Slide 11 : Frais et fiscalité (récap)
**But** : Détailler frais et fiscalité totale vie du contrat  
**Données** : `cumulEconomieIR`, `cumulPSFondsEuro`, `cumulFiscaliteRevenus`, `liquidation.cumulFiscalite`, `transmission.taxe`  
**Message** : _"La fiscalité globale sur durée de vie complète doit guider votre choix."_

#### Slide 12 : Risques et points de vigilance
**But** : Alerter sur risques (2 blocs avec accent bar vertical)  
**Visuel** : 2 colonnes (Produit 1 / Produit 2), chaque colonne avec liste de points
- **Helper** : `drawAccentBar()` à gauche de chaque bloc
- Risques en **texte c9**, points de vigilance en **texte c10 bold**
**Données** : `risques` {av: [string], per: [string]}  
**Message** : _"Tout placement comporte des risques. Diversifier est essentiel."_

#### Slide 13 : Synthèse — Quel produit choisir ?
**But** : Aide à la décision (tableau priorité → solution)  
**Données** : `recommandations[]` {critere, solution}  
**Message** : _"Votre CGP peut vous accompagner pour arbitrer selon vos priorités."_

#### Slide 14 : Section Header "Annexes CGP"
Transition vers annexes détaillées

---

### Annexes CGP (8-12 slides)

#### Slide A1-A2 : Tableau épargne détaillé (Produit 1 & 2)
**But** : Année par année, phase épargne  
**Colonnes** : Année | Âge | Versement brut | Versement net | Gains capi | Revenus distrib | Fiscalité | Capital fin  
**Données** : `result.epargne.rows[]`

#### Slide A3 : Détail versements et allocation
**But** : Lister tous versements (initial, annuels, ponctuels) + allocation  
**Données** : `product.versementConfig` {initial, annuel, ponctuels}

#### Slide A4 : Hypothèses rendements et frais
**But** : Documenter tous paramètres financiers  
**Données** : rendements, frais gestion, frais entrée, stratégie distribution

#### Slide A5-A6 : Tableau liquidation détaillé (Produit 1 & 2)
**But** : Année par année, phase liquidation  
**Colonnes** : Année | Âge | Capital début | Gains | Retrait brut | Part gains | Fiscalité | Retrait net | Capital fin  
**Données** : `result.liquidation.rows[]`

#### Slide A7 : Règles fiscales retraits (AV)
**But** : Expliquer fiscalité retraits AV (< 8 ans, >= 8 ans, quote-part gains, formules)  
**Données** : `fiscalParams` AV

#### Slide A8 : Règles fiscales retraits (PER)
**But** : Expliquer fiscalité sorties PER (capital, rente, PER bancaire)  
**Données** : `fiscalParams` PER

#### Slide A9 : Règles fiscales transmission (990 I / 757 B / DMTG)
**But** : Expliquer régimes fiscaux décès (3 régimes, abattements, barèmes)  
**Données** : `fiscalParams` transmission

#### Slide A10 : Formules de calcul (récapitulatif)
**But** : Documenter formules clés (épargne, liquidation, transmission)  
**Données** : Formules mathématiques

#### Slide A11 : Hypothèses client et paramètres fiscaux
**But** : Lister tous paramètres client + fiscaux utilisés  
**Données** : `client`, `fiscalParams` complets

#### Slide A12 : Limites et avertissements
**But** : Préciser limites de la simulation (hypothèses simplificatrices, éléments non pris en compte, risques)  
**Données** : Texte méthodologique

#### Slide N : Disclaimer
Texte exact fourni PARTIE 1
