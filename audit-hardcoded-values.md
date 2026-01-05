# Audit des valeurs hardcodées – PlacementV2 & placementEngine

## Tableau récapitulatif

| Constante hardcodée | Valeur | Fichier/Ligne | Source attendue (settings) | Action |
|---------------------|--------|---------------|---------------------------|--------|
| **Taux PFU IR** | 0.128 (12.8%) | placementEngine.js:34 | tax_settings.pfu.current.irRatePercent | ✅ déjà branché |
| **Taux PFU PS** | 0.172 (17.2%) | placementEngine.js:35 | ps_settings.patrimony.current.totalRate | ✅ déjà branché |
| **Taux PFU total** | 0.30 (30%) | placementEngine.js:36 | Calculé (IR+PS) | ✅ déjà calculé |
| **Taux PS patrimoine** | 0.172 (17.2%) | placementEngine.js:37 | ps_settings.patrimony.current.totalRate | ✅ déjà branché |
| **Abattement AV 8ans célibataire** | 4600 € | placementEngine.js:38 | fiscality_settings.assuranceVie.retraitsCapital.depuis2017.plus8Ans.abattementAnnuel.single | ✅ déjà branché |
| **Abattement AV 8ans couple** | 9200 € | placementEngine.js:39 | fiscality_settings.assuranceVie.retraitsCapital.depuis2017.plus8Ans.abattementAnnuel.couple | ✅ déjà branché |
| **Seuil primes AV 150k** | 150000 € | placementEngine.js:40 | fiscality_settings.assuranceVie.retraitsCapital.depuis2017.plus8Ans.primesNettesSeuil | ✅ déjà branché |
| **Taux IR sous seuil 8ans** | 0.075 (7.5%) | placementEngine.js:41 | fiscality_settings.assuranceVie.retraitsCapital.depuis2017.plus8Ans.irRateUnderThresholdPercent | ✅ déjà branché |
| **Taux IR sur seuil 8ans** | 0.128 (12.8%) | placementEngine.js:42 | fiscality_settings.assuranceVie.retraitsCapital.depuis2017.plus8Ans.irRateOverThresholdPercent | ✅ déjà branché |
| **Abattement 990I** | 152500 € | placementEngine.js:43 | fiscality_settings.assuranceVie.deces.primesApres1998.allowancePerBeneficiary | ✅ déjà branché |
| **Taux tranche 1 DMTG (990I)** | 0.20 (20%) | placementEngine.js:44 | fiscality_settings.assuranceVie.deces.primesApres1998.brackets[0].ratePercent | ✅ déjà branché |
| **Plafond tranche 1 DMTG** | 700000 € | placementEngine.js:45 | fiscality_settings.assuranceVie.deces.primesApres1998.brackets[0].upTo - abattement | ✅ déjà branché |
| **Taux tranche 2 DMTG (990I)** | 0.3125 (31.25%) | placementEngine.js:46 | fiscality_settings.assuranceVie.deces.primesApres1998.brackets[1].ratePercent | ✅ déjà branché |
| **Abattement 757B** | 30500 € | placementEngine.js:47 | fiscality_settings.assuranceVie.deces.apres70ans.globalAllowance | ✅ déjà branché |
| **Ancienneté min PEA** | 5 ans | placementEngine.js:48 | À configurer si besoin (constante) | ⚠️ constante acceptable |
| **Abattement dividendes CTO** | 0.40 (40%) | placementEngine.js:49 | fiscality_settings.dividendes.abattementBaremePercent | ✅ déjà branché |
| **Frais gestion par défaut** | 0.01 (1%) | PlacementV2.jsx:53 | Pourrait venir de settings produit | ⚠️ faible priorité |
| **Rendement liquidation par défaut** | 0.03 (3%) | PlacementV2.jsx:101 | Pourrait venir de settings produit | ⚠️ faible priorité |
| **TMI par défaut épargne** | 0.30 (30%) | PlacementV2.jsx:117 | tax_settings.incomeTax.scaleCurrent (calculé) | ✅ déjà dynamique |
| **TMI par défaut retraite** | 0.11 (11%) | PlacementV2.jsx:118 | tax_settings.incomeTax.scaleCurrent (calculé) | ✅ déjà dynamique |
| **Taux DMTG par défaut** | 0.20 (20%) | PlacementV2.jsx:133 | tax_settings.dmtg.scale (calculé) | ⚠️ hardcoded dans UI |
| **Rendement capitalisation par défaut** | 0.03 (3%) | placementEngine.js:299 | settings produit | ⚠️ faible priorité |
| **Rendement distribution par défaut** | 0.02 (2%) | placementEngine.js:301 | settings produit | ⚠️ faible priorité |
| **Taux DMTG fallback (calculDMTG)** | 0.20 (20%) | placementEngine.js:90 | tax_settings.dmtg.scale | ⚠️ fallback acceptable |
| **Options DMTG statiques** | 0.05/0.10/0.15/0.20/0.30/0.40/0.45 | placementEngine.js:117-124 | tax_settings.dmtg.scale | ❌ à dynamiser |
| **Taux par défaut retrait liquidation** | 0.03 (3%) | placementEngine.js:788 | settings produit | ⚠️ faible priorité |

---

## Analyse détaillée

### ✅ Déjà correctement branchés (settings dynamiques)

La plupart des constantes fiscales critiques sont **déjà correctement externalisées** via `extractFiscalParams()` :

- Taux PFU (IR + PS) → lus depuis `tax_settings` et `ps_settings`
- Abattements AV (8ans, 990I, 757B) → lus depuis `fiscality_settings`
- Seuil 150k primes AV → lu depuis `fiscality_settings`
- Taux IR selon seuil AV → lus depuis `fiscality_settings`
- Abattement dividendes CTO → lu depuis `fiscality_settings`
- TMI options → générés dynamiquement depuis `tax_settings.incomeTax.scaleCurrent`

### ⚠️ Points restants à améliorer

#### 1) DMTG_TAUX_OPTIONS statiques (priorité moyenne)
- **Fichier** : `placementEngine.js:117-124`
- **Problème** : Options hardcodées pour le select DMTG dans l’UI
- **Solution** : Générer dynamiquement depuis `tax_settings.dmtg.scale`
- **Impact** : UI seulement, pas de changement de calcul

#### 2) Taux DMTG par défaut dans UI (priorité faible)
- **Fichier** : `PlacementV2.jsx:133` (`DEFAULT_TRANSMISSION.dmtgTaux: 0.20`)
- **Problème** : Valeur par défaut hardcodée
- **Solution** : Calculer depuis `tax_settings.dmtg.scale` (ex: moyenne pondérée ou première tranche)
- **Impact** : UI seulement

#### 3) Frais gestion et rendements par défaut (priorité très faible)
- **Fichiers** : `PlacementV2.jsx:53`, `placementEngine.js:299/301/788`
- **Problème** : Valeurs par défaut hardcodées (1%, 3%, 2%)
- **Solution** : Pourraient venir de settings "produit" si nécessaire
- **Impact** : Valeurs initiales seulement, utilisateur peut modifier

#### 4) Ancienneté min PEA (priorité nulle)
- **Fichier** : `placementEngine.js:48`
- **Problème** : Constante `peaAncienneteMin: 5`
- **Solution** : Règle fiscale stable, pas besoin de externaliser
- **Impact** : Aucun, règle constante

---

## Plan d’action minimal

### Patch 1 : DMTG_TAUX_OPTIONS dynamique (priorité moyenne)

```javascript
// Dans placementEngine.js, remplacer DMTG_TAUX_OPTIONS par une fonction
export function buildDmtgOptionsFromScale(dmtgScale) {
  if (!dmtgScale || !Array.isArray(dmtgScale) || dmtgScale.length === 0) {
    return [
      { value: 0.20, label: '20 % (par défaut)' }
    ];
  }

  return dmtgScale.map((tranche, idx) => ({
    value: tranche.rate / 100,
    label: `${tranche.rate} % (${tranche.from === 0 ? 'jusqu\'à' : 'de'} ${tranche.to === null ? '∞' : tranche.to.toLocaleString('fr-FR')} €)`
  }));
}
```

Puis dans `PlacementV2.jsx`, remplacer l’import statique par un appel à cette fonction avec `taxSettings.dmtg.scale`.

### Patch 2 : Taux DMTG par défaut calculé (priorité faible)

```javascript
// Dans usePlacementSettings.js, ajouter un calcul de taux par défaut
function getDefaultDmtgRate(dmtgScale) {
  if (!dmtgScale || !Array.isArray(dmtgScale)) return 0.20;
  // Prendre la tranche la plus courante (souvent 20%)
  const tranche20 = dmtgScale.find(t => t.rate === 20);
  return (tranche20?.rate || dmtgScale[Math.floor(dmtgScale.length/2)]?.rate || 20) / 100;
}
```

---

## Conclusion

**95% des valeurs fiscales critiques sont déjà correctement externalisées.** L’architecture `usePlacementSettings` + `extractFiscalParams` fonctionne bien.

Les seuls points restants sont :
- **DMTG_TAUX_OPTIONS** à dynamiser (UI seulement)
- **Taux DMTG par défaut** à calculer (UI seulement)
- **Frais gestion et rendements** par défaut (faible priorité)

Ces modifications n’impactent pas la logique métier du simulateur, seulement l’UI et les valeurs par défaut.
