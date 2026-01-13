# SPEC EXPORT POWERPOINT — PARTIE 3B : INVENTAIRE DATA /SIM/PLACEMENT

## INVENTAIRE EXHAUSTIF DES DONNÉES

**Légende** :
- ✅ = Donnée disponible dans le code
- ⚠️ = Donnée partiellement disponible (nécessite transformation)
- ❌ = Donnée manquante (à créer ou à récupérer)

---

### 1. DONNÉES CLIENT

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `ageActuel` | number | `client.ageActuel` | ✅ | Client 2, Annexe A11 | Âge début simulation |
| `tmiEpargne` | number (0-0.45) | `client.tmiEpargne` | ✅ | Annexe A11 | TMI phase épargne |
| `tmiRetraite` | number (0-0.45) | `client.tmiRetraite` | ✅ | Annexe A11 | TMI phase retraite |
| `situation` | 'single' \| 'couple' | `client.situation` | ✅ | Client 2 | Situation familiale |
| `nomClient` | string | À définir | ❌ | Client 1 (Cover) | Nom complet client |
| `objectifs` | Array<string> | À définir | ❌ | Client 2 | Liste objectifs textuels |

---

### 2. DONNÉES PRODUIT — CONFIGURATION GÉNÉRALE

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `envelope` | string | `product.envelope` | ✅ | Client 3 | 'AV' \| 'PER' \| 'PEA' \| 'CTO' \| 'SCPI' |
| `dureeEpargne` | number | `product.dureeEpargne` | ✅ | Client 2, 4 | Années phase épargne |
| `fraisGestion` | number (0-0.03) | `product.fraisGestion` | ✅ | Client 3, Annexe A4 | % annuel |
| `perBancaire` | boolean | `product.perBancaire` | ✅ | Annexe A8 | PER bancaire (primes non déduites) |
| `optionBaremeIR` | boolean | `product.optionBaremeIR` | ✅ | Annexe A7/A8 | Option barème IR vs PFU |
| `rendementLiquidationOverride` | number \| null | `product.rendementLiquidationOverride` | ✅ | Annexe A4 | Override rendement liquidation |

---

### 3. VERSEMENTS — CONFIGURATION

#### 3.1 Versement Initial

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `montant` | number | `versementConfig.initial.montant` | ✅ | Client 3, Annexe A3 | Versement initial brut |
| `fraisEntree` | number (0-0.05) | `versementConfig.initial.fraisEntree` | ✅ | Annexe A3 | % frais entrée |
| `pctCapitalisation` | number (0-100) | `versementConfig.initial.pctCapitalisation` | ✅ | Client 3, Annexe A3 | % allocation capi |
| `pctDistribution` | number (0-100) | `versementConfig.initial.pctDistribution` | ✅ | Client 3, Annexe A3 | % allocation distrib |

#### 3.2 Versement Annuel

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `montant` | number | `versementConfig.annuel.montant` | ✅ | Client 3, Annexe A3 | Versement annuel brut |
| `fraisEntree` | number (0-0.05) | `versementConfig.annuel.fraisEntree` | ✅ | Annexe A3 | % frais entrée |
| `pctCapitalisation` | number (0-100) | `versementConfig.annuel.pctCapitalisation` | ✅ | Client 3, Annexe A3 | % allocation capi |
| `pctDistribution` | number (0-100) | `versementConfig.annuel.pctDistribution` | ✅ | Client 3, Annexe A3 | % allocation distrib |
| `garantieBonneFin` | Object | `versementConfig.annuel.garantieBonneFin` | ✅ | Annexe A3 | Garantie décès PER |
| `garantieBonneFin.active` | boolean | `.active` | ✅ | Annexe A3 | Si garantie activée |
| `garantieBonneFin.tauxPrime` | number | `.tauxPrime` | ✅ | Annexe A3 | % prime garantie |

#### 3.3 Versements Ponctuels

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `ponctuels[]` | Array | `versementConfig.ponctuels` | ✅ | Annexe A3 | Liste versements exceptionnels |
| `annee` | number | `ponctuel.annee` | ✅ | Annexe A3 | Année du versement |
| `montant` | number | `ponctuel.montant` | ✅ | Annexe A3 | Montant brut |
| `fraisEntree` | number (0-0.05) | `ponctuel.fraisEntree` | ✅ | Annexe A3 | % frais entrée |
| `pctCapitalisation` | number (0-100) | `ponctuel.pctCapitalisation` | ✅ | Annexe A3 | % allocation capi |
| `pctDistribution` | number (0-100) | `ponctuel.pctDistribution` | ✅ | Annexe A3 | % allocation distrib |

---

### 4. ALLOCATION — CAPITALISATION & DISTRIBUTION

#### 4.1 Capitalisation

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `rendementAnnuel` | number (0-0.15) | `versementConfig.capitalisation.rendementAnnuel` | ✅ | Client 3, Annexe A4 | Rendement net FG, % annuel |

#### 4.2 Distribution

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `rendementAnnuel` | number (0-0.15) | `versementConfig.distribution.rendementAnnuel` | ✅ | Annexe A4 | Revalorisation capital (SCPI) |
| `tauxDistribution` | number (0-0.10) | `versementConfig.distribution.tauxDistribution` | ✅ | Client 3, Annexe A4 | Loyers/dividendes % annuel |
| `strategie` | string | `versementConfig.distribution.strategie` | ✅ | Annexe A4 | 'apprehender' \| 'stocker' \| 'reinvestir' |
| `delaiJouissance` | number (0-12) | `versementConfig.distribution.delaiJouissance` | ✅ | Annexe A4 | Mois carence (SCPI) |
| `dureeProduit` | number \| null | `versementConfig.distribution.dureeProduit` | ✅ | Annexe A4 | Durée vie produit (SCPI démembrée) |

---

### 5. RÉSULTATS PHASE ÉPARGNE

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `capitalAcquis` | number | `result.epargne.capitalAcquis` | ✅ | **Client 4** | Capital fin phase épargne |
| `cumulVersements` | number | `result.epargne.cumulVersements` | ✅ | Client 4 | Versements bruts cumulés |
| `cumulVersementsNets` | number | `result.epargne.cumulVersementsNets` | ✅ | Annexe A1 | Versements nets (après FE) |
| `cumulEffort` | number | `result.epargne.cumulEffort` | ✅ | Client 4 | Effort brut client |
| `effortReel` | number | `result.totaux.effortReel` | ✅ | **Client 4, 10** | Effort - revenus nets épargne |
| `cumulEconomieIR` | number | `result.epargne.cumulEconomieIR` | ✅ | Client 4, 11 | Économie IR PER |
| `plusValueLatente` | number | `result.epargne.plusValueLatente` | ✅ | Client 4 | Gains cumulés |
| `cumulInterets` | number | `result.epargne.cumulInterets` | ✅ | Annexe A1 | Total intérêts perçus |
| `cumulGains` | number | `result.epargne.cumulGains` | ✅ | Annexe A1 | Total gains |
| `cumulPSFondsEuro` | number | `result.epargne.cumulPSFondsEuro` | ✅ | Client 11, Annexe A11 | PS fonds euro (AV) |
| `cumulRevenusDistribues` | number | `result.epargne.cumulRevenusDistribues` | ✅ | Client 6 | Loyers/dividendes bruts |
| `cumulFiscaliteRevenus` | number | `result.epargne.cumulFiscaliteRevenus` | ✅ | Client 6, 11 | Fiscalité revenus |
| `cumulRevenusNetsPercus` | number | Calculé | ⚠️ | Client 6 | `cumulRevenusDistribues - cumulFiscaliteRevenus` |
| `rows[]` | Array | `result.epargne.rows` | ✅ | Annexe A1/A2 | Détail annuel |

#### 5.1 Détail Annuel Épargne (rows[])

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `annee` | number | `row.annee` | ✅ | Annexe A1 | Année simulation |
| `age` | number | `row.age` | ✅ | Annexe A1 | Âge client |
| `versementAnnuel` | number | `row.versementAnnuel` | ✅ | Annexe A1 | Versement brut année N |
| `versementNetAnnee` | number | `row.versementNetAnnee` | ✅ | Annexe A1 | Versement net après FE |
| `capitalDebut` | number | `row.capitalDebut` | ✅ | Annexe A1 | Capital début année |
| `capitalCapi` | number | `row.capitalCapi` | ✅ | Annexe A1 | Capital poche capi |
| `capitalDistrib` | number | `row.capitalDistrib` | ✅ | Annexe A1 | Capital poche distrib |
| `gainsCapitalisation` | number | `row.gainsCapitalisation` | ✅ | Annexe A1 | Gains capi année N |
| `gainsDistribution` | number | `row.gainsDistribution` | ✅ | Annexe A1 | Revalorisation distrib |
| `revenusDistribuesAnnee` | number | `row.revenusDistribuesAnnee` | ✅ | Annexe A1 | Loyers/dividendes année N |
| `fiscaliteRevenusAnnee` | number | `row.fiscaliteRevenusAnnee` | ✅ | Annexe A1 | Fiscalité revenus année N |
| `economieIRAnnee` | number | `row.economieIRAnnee` | ✅ | Annexe A1 | Économie IR PER année N |
| `capitalFin` | number | `row.capitalFin` | ✅ | **Annexe A1, Client 5** | Capital fin année N |
| `cumulVersements` | number | `row.cumulVersements` | ✅ | Annexe A1 | Cumul versements à date |
| `cumulGains` | number | `row.cumulGains` | ✅ | Annexe A1 | Cumul gains à date |

---

### 6. PARAMÈTRES LIQUIDATION

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `mode` | string | `liquidationParams.mode` | ✅ | Client 7 | 'epuiser' \| 'mensualite' \| 'unique' |
| `duree` | number | `liquidationParams.duree` | ✅ | Client 7 | Années (mode épuiser) |
| `mensualiteCible` | number | `liquidationParams.mensualiteCible` | ✅ | Client 7 | €/mois (mode mensualite) |
| `montantUnique` | number | `liquidationParams.montantUnique` | ✅ | Client 7 | € (mode unique) |
| `optionBaremeIR` | boolean | `liquidationParams.optionBaremeIR` | ✅ | Annexe A7/A8 | Option barème IR liquidation |

---

### 7. RÉSULTATS PHASE LIQUIDATION

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `duree` | number | `result.liquidation.duree` | ✅ | Client 7 | Durée effective liquidation |
| `ageFinEpargne` | number | `result.liquidation.ageFinEpargne` | ✅ | Client 7 | Âge début liquidation |
| `ageAuDeces` | number | `result.liquidation.ageAuDeces` | ✅ | Client 7, 9 | Âge décès |
| `revenuAnnuelMoyenNet` | number | `result.liquidation.revenuAnnuelMoyenNet` | ✅ | **Client 7** | Revenu annuel moyen net |
| `cumulRetraitsBruts` | number | `result.liquidation.cumulRetraitsBruts` | ✅ | Annexe A5/A6 | Retraits bruts cumulés |
| `cumulRetraitsNets` | number | `result.liquidation.cumulRetraitsNets` | ✅ | Client 7 | Retraits nets cumulés |
| `cumulRetraitsNetsAuDeces` | number | `result.liquidation.cumulRetraitsNetsAuDeces` | ✅ | **Client 7, 10** | Retraits nets jusqu'au décès |
| `cumulFiscalite` | number | `result.liquidation.cumulFiscalite` | ✅ | Client 11, Annexe A5 | Fiscalité cumulée |
| `cumulFiscaliteAuDeces` | number | `result.liquidation.cumulFiscaliteAuDeces` | ✅ | Client 11 | Fiscalité jusqu'au décès |
| `capitalRestant` | number | `result.liquidation.capitalRestant` | ✅ | Client 7 | Capital fin liquidation |
| `capitalRestantAuDeces` | number | `result.liquidation.capitalRestantAuDeces` | ✅ | **Client 7, 9** | Capital au moment décès |
| `rows[]` | Array | `result.liquidation.rows` | ✅ | Annexe A5/A6 | Détail annuel |

#### 7.1 Détail Annuel Liquidation (rows[])

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `annee` | number | `row.annee` | ✅ | Annexe A5 | Année liquidation |
| `age` | number | `row.age` | ✅ | **Annexe A5, Client 8** | Âge client |
| `isAgeAuDeces` | boolean | `row.isAgeAuDeces` | ✅ | Annexe A5 | Marquer ligne au décès |
| `capitalDebut` | number | `row.capitalDebut` | ✅ | Annexe A5 | Capital début année |
| `gainsAnnee` | number | `row.gainsAnnee` | ✅ | Annexe A5 | Gains année N |
| `retraitBrut` | number | `row.retraitBrut` | ✅ | Annexe A5 | Retrait brut année N |
| `partGains` | number | `row.partGains` | ✅ | Annexe A5 | Part gains dans retrait |
| `partCapital` | number | `row.partCapital` | ✅ | Annexe A5 | Part capital dans retrait |
| `totalCapitalRestant` | number | `row.totalCapitalRestant` | ✅ | Annexe A5 | Capital hors gains |
| `totalInteretsRestants` | number | `row.totalInteretsRestants` | ✅ | Annexe A5 | Gains latents restants |
| `pvLatenteDebut` | number | `row.pvLatenteDebut` | ✅ | Annexe A5 | PV latente début année |
| `pvLatenteAvantRetrait` | number | `row.pvLatenteAvantRetrait` | ✅ | Annexe A5 | PV après gains, avant retrait |
| `pvLatenteFin` | number | `row.pvLatenteFin` | ✅ | Annexe A5 | PV latente fin année |
| `irSurGains` | number | `row.irSurGains` | ✅ | Annexe A5 | IR sur part gains |
| `irSurCapital` | number | `row.irSurCapital` | ✅ | Annexe A5 | IR sur part capital (PER) |
| `ps` | number | `row.ps` | ✅ | Annexe A5 | PS sur retrait |
| `fiscaliteTotal` | number | `row.fiscaliteTotal` | ✅ | Annexe A5 | Fiscalité totale année N |
| `retraitNet` | number | `row.retraitNet` | ✅ | **Annexe A5, Client 8** | Retrait net année N |
| `capitalFin` | number | `row.capitalFin` | ✅ | Annexe A5 | Capital fin année N |

---

### 8. PARAMÈTRES TRANSMISSION

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `ageAuDeces` | number | `transmissionParams.ageAuDeces` | ✅ | Client 2, 7, 9 | Âge décès estimé |
| `agePremierVersement` | number | `transmissionParams.agePremierVersement` | ✅ | Annexe A9 | Âge 1er versement (990I/757B) |
| `nbBeneficiaires` | number | `transmissionParams.nbBeneficiaires` | ✅ | Client 9, Annexe A9 | Nombre bénéficiaires |
| `beneficiaryType` | string | `transmissionParams.beneficiaryType` | ✅ | Annexe A9 | 'enfants' \| 'conjoint' \| 'autre' |

---

### 9. RÉSULTATS PHASE TRANSMISSION

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `regime` | string | `result.transmission.regime` | ✅ | **Client 9** | '990 I' \| '757 B' \| 'DMTG' \| 'Exo conjoint' |
| `capitalTransmis` | number | `result.transmission.capitalTransmis` | ✅ | **Client 9** | Capital transmis brut |
| `abattement` | number | `result.transmission.abattement` | ✅ | Client 9 | Abattement applicable |
| `assiette` | number | `result.transmission.assiette` | ✅ | Annexe A9 | Assiette taxable |
| `taxeForfaitaire` | number | `result.transmission.taxeForfaitaire` | ✅ | Annexe A9 | Taxe 990 I |
| `taxeDmtg` | number | `result.transmission.taxeDmtg` | ✅ | Annexe A9 | Droits succession DMTG |
| `taxe` | number | `result.transmission.taxe` | ✅ | Client 9, 11 | Taxe totale décès |
| `capitalTransmisNet` | number | `result.transmission.capitalTransmisNet` | ✅ | **Client 9, 10** | Capital transmis net |
| `psDeces` | Object | `result.transmission.psDeces` | ✅ | Client 9 | PS décès (détail) |
| `psDeces.applicable` | boolean | `psDeces.applicable` | ✅ | Annexe A9 | Si PS applicables |
| `psDeces.assiette` | number | `psDeces.assiette` | ✅ | Annexe A9 | Assiette PS (gains latents) |
| `psDeces.taux` | number | `psDeces.taux` | ✅ | Annexe A9 | Taux PS (17,2%) |
| `psDeces.montant` | number | `psDeces.montant` | ✅ | Client 9, 11 | Montant PS décès |
| `psDeces.note` | string | `psDeces.note` | ✅ | Annexe A9 | Note explicative |

---

### 10. TOTAUX SYNTHÈSE

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `effortTotal` | number | `result.totaux.effortTotal` | ✅ | Client 10, 11 | Effort brut total |
| `effortReel` | number | `result.totaux.effortReel` | ✅ | **Client 10** | Effort - revenus nets épargne |
| `revenusNetsEpargne` | number | `result.totaux.revenusNetsEpargne` | ✅ | Client 10 | Revenus nets phase épargne |
| `economieIRTotal` | number | `result.totaux.economieIRTotal` | ✅ | Client 10, 11 | Économie IR totale |
| `revenusNetsLiquidation` | number | `result.totaux.revenusNetsLiquidation` | ✅ | **Client 10** | Revenus nets jusqu'au décès |
| `revenusNetsTotal` | number | `result.totaux.revenusNetsTotal` | ✅ | Client 10 | Revenus nets toute durée |
| `fiscaliteTotale` | number | `result.totaux.fiscaliteTotale` | ✅ | Client 11 | Fiscalité totale vie contrat |
| `capitalTransmisNet` | number | `result.totaux.capitalTransmisNet` | ✅ | **Client 10** | Capital transmis net final |

---

### 11. COMPARAISON (2 PRODUITS)

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `deltas.effortTotal` | number | `comparison.deltas.effortTotal` | ✅ | **Client 10** | Delta effort réel |
| `deltas.capitalAcquis` | number | `comparison.deltas.capitalAcquis` | ✅ | **Client 10** | Delta capital acquis |
| `deltas.revenusNetsLiquidation` | number | `comparison.deltas.revenusNetsLiquidation` | ✅ | **Client 10** | Delta revenus nets retraite |
| `deltas.capitalTransmisNet` | number | `comparison.deltas.capitalTransmisNet` | ✅ | **Client 10** | Delta capital transmis net |
| `deltas.economieIR` | number | `comparison.deltas.economieIR` | ✅ | Client 10 | Delta économie IR |
| `deltas.fiscaliteTotale` | number | `comparison.deltas.fiscaliteTotale` | ✅ | Client 10 | Delta fiscalité totale |
| `meilleurEffort` | string | `comparison.meilleurEffort` | ✅ | Client 10 | Enveloppe meilleur effort |
| `meilleurRevenus` | string | `comparison.meilleurRevenus` | ✅ | Client 10 | Enveloppe meilleurs revenus |
| `meilleurTransmission` | string | `comparison.meilleurTransmission` | ✅ | Client 10 | Enveloppe meilleure transmission |

---

### 12. PARAMÈTRES FISCAUX (Supabase Settings)

| Champ | Type | Source | Statut | Slide(s) | Notes |
|-------|------|--------|--------|----------|-------|
| `pfuIR` | number | `fiscalParams.pfuIR` | ✅ | Annexe A11 | PFU IR (12,8%) |
| `pfuPS` | number | `fiscalParams.pfuPS` | ✅ | Annexe A11 | PFU PS (17,2%) |
| `pfuTotal` | number | `fiscalParams.pfuTotal` | ✅ | Annexe A11 | PFU total (30%) |
| `psPatrimoine` | number | `fiscalParams.psPatrimoine` | ✅ | Annexe A11 | PS patrimoine (17,2%) |
| `avAbattement8ansSingle` | number | `fiscalParams.avAbattement8ansSingle` | ✅ | Annexe A7 | AV abattement 8 ans (4 600 €) |
| `avAbattement8ansCouple` | number | `fiscalParams.avAbattement8ansCouple` | ✅ | Annexe A7 | AV abattement 8 ans (9 200 €) |
| `avSeuilPrimes150k` | number | `fiscalParams.avSeuilPrimes150k` | ✅ | Annexe A7 | AV seuil primes (150 000 €) |
| `avTauxSousSeuil8ans` | number | `fiscalParams.avTauxSousSeuil8ans` | ✅ | Annexe A7 | Taux < 150k (7,5%) |
| `avTauxSurSeuil8ans` | number | `fiscalParams.avTauxSurSeuil8ans` | ✅ | Annexe A7 | Taux >= 150k (12,8%) |
| `av990IAbattement` | number | `fiscalParams.av990IAbattement` | ✅ | Annexe A9 | 990 I abattement (152 500 €) |
| `av990ITranche1Taux` | number | `fiscalParams.av990ITranche1Taux` | ✅ | Annexe A9 | 990 I tranche 1 (20%) |
| `av990ITranche1Plafond` | number | `fiscalParams.av990ITranche1Plafond` | ✅ | Annexe A9 | 990 I plafond T1 (700 000 €) |
| `av990ITranche2Taux` | number | `fiscalParams.av990ITranche2Taux` | ✅ | Annexe A9 | 990 I tranche 2 (31,25%) |
| `av757BAbattement` | number | `fiscalParams.av757BAbattement` | ✅ | Annexe A9 | 757 B abattement (30 500 €) |
| `peaAncienneteMin` | number | `fiscalParams.peaAncienneteMin` | ✅ | Annexe A11 | PEA ancienneté min (5 ans) |
| `dividendesAbattementPercent` | number | `fiscalParams.dividendesAbattementPercent` | ✅ | Annexe A11 | Dividendes abattement (40%) |
| `dmtgTauxChoisi` | number | `fiscalParams.dmtgTauxChoisi` | ✅ | Annexe A9 | Taux DMTG choisi (20%) |
| `dmtgScale` | Array | `fiscalParams.dmtgScale` | ✅ | Annexe A9 | Barème DMTG progressif |

---

### 13. DONNÉES MANQUANTES OU À CRÉER

| Donnée | Type | Usage | Priorité | Solution proposée |
|--------|------|-------|----------|-------------------|
| **Nom client** | string | Cover slide | 🔴 Haute | Input libre OU récupérer depuis `dossier.situationFamiliale` si dossier lié |
| **Objectifs textuels** | Array<string> | Slide 2 Objectifs | 🟡 Moyenne | Input libre textarea (ex: "Constitution capital retraite", "Transmission patrimoine", "Compléter revenus retraite") |
| **Logo cabinet** | Base64 | Cover optionnel | 🟢 Basse | Déjà disponible si stocké en user_metadata |
| **Frais notaire succession** | number | Client 11 optionnel | 🟢 Basse | Hors scope actuel (estimation forfaitaire 2-5% si nécessaire) |
| **Garanties complémentaires détail** | Object | Annexe A3 | 🟡 Moyenne | Partiellement disponible (`garantieBonneFin`), à compléter si besoin garantie plancher, rente éducation |
| **Scénarios sensibilité** | Array | Annexes optionnel | 🟢 Basse | Hors scope V1 (futures évolutions) |
| **Profil risque investisseur** | string | Client 12 Risques | 🟢 Basse | Input libre ('prudent' \| 'équilibré' \| 'dynamique') optionnel |
| **Recommandations structurées** | Array<{critere, solution}> | Client 13 | 🟡 Moyenne | Générer automatiquement selon résultats comparaison |

---

## SYNTHÈSE STATUT DONNÉES

### Données disponibles (✅) : ~95%
- Toutes les données de simulation (épargne, liquidation, transmission) sont disponibles dans `placementEngine.js`
- Tous les paramètres fiscaux sont disponibles depuis Supabase settings
- Comparaison 2 produits avec deltas calculés
- Détail annuel complet (rows épargne + liquidation)

### Données manquantes critiques (❌) : ~2%
- **Nom client** : nécessaire pour Cover + personnalisation
- **Objectifs textuels** : enrichissement qualitatif slide 2

### Données optionnelles (🟢) : ~3%
- Logo cabinet (probablement déjà disponible)
- Frais notaire (estimation forfaitaire possible)
- Profil risque (enrichissement slide 12)
- Scénarios sensibilité (V2)

---

## RECOMMANDATIONS IMPLÉMENTATION

### Phase 1 : Données critiques
1. Ajouter input "Nom client" dans UI `/sim/placement`
2. Ajouter textarea "Objectifs" (optionnel, 3-5 objectifs max)
3. Récupérer `cover_slide_url` depuis `user.user_metadata` (déjà implémenté dans ThemeProvider)

### Phase 2 : Données calculées
1. Générer automatiquement `recommandations[]` selon résultats (logique simple : if meilleurEffort === 'PER' → recommander PER pour réduction IR, etc.)
2. Calculer `revenusNetsPercus` épargne : `cumulRevenusDistribues - cumulFiscaliteRevenus`

### Phase 3 : Enrichissements optionnels (V2)
1. Input "Profil risque" (dropdown)
2. Scénarios sensibilité (variations rendement +/-1%, TMI +/-5%)
3. Garanties complémentaires détaillées (garantie plancher, rente éducation)
