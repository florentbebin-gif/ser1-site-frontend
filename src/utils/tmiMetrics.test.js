/**
 * Tests pour les métriques TMI robustes
 * Scénarios A-D requis par l'utilisateur
 */

import { computeIrPlafonneFoyer, computeMarginalRate, computeTmiMetrics } from './tmiMetrics.js';

// Barème IR simplifié pour les tests (approximatif 2024)
const DEFAULT_SCALE = [
  { from: 0, to: 11294, rate: 0 },
  { from: 11294, to: 28797, rate: 11 },
  { from: 28797, to: 82341, rate: 30 },
  { from: 82341, to: 177106, rate: 41 },
  { from: 177106, to: null, rate: 45 }
];

// Plafonds QF approximatifs
const DEFAULT_PLAFOND_PART_SUP = 1678; // 2024
const DEFAULT_PLAFOND_PARENT_ISO = 3959; // 2024

/**
 * Scénario A: Marié/Pacsé, revenus imposables foyer = 90 000 €, parts = 2
 * TMI attendue 30% (comme aujourd'hui)
 * "dans TMI" et "marge" doivent être cohérents et stables
 */
function testScenarioA() {
  console.log('=== SCÉNARIO A: Marié/Pacsé 90k€ ===');
  
  const params = {
    scale: DEFAULT_SCALE,
    partsNb: 2,
    basePartsForQf: 2,
    extraParts: 0,
    extraHalfParts: 0,
    plafondPartSup: DEFAULT_PLAFOND_PART_SUP,
    plafondParentIso2: DEFAULT_PLAFOND_PARENT_ISO,
    isCouple: true,
    isIsolated: false
  };
  
  const revenuImposable = 90000;
  const metrics = computeTmiMetrics(revenuImposable, params);
  
  console.log('Revenu imposable:', revenuImposable);
  console.log('TMI calculée:', metrics.tmiRate + '%');
  console.log('Revenus dans TMI:', metrics.revenusDansTmi + '€');
  console.log('Marge avant changement:', metrics.margeAvantChangement ? metrics.margeAvantChangement + '€' : '—');
  console.log('Seuil bas foyer:', metrics.seuilBasFoyer);
  console.log('Seuil haut foyer:', metrics.seuilHautFoyer);
  
  // Vérifications
  const assertions = [];
  assertions.push(['TMI = 30%', metrics.tmiRate === 30]);
  assertions.push(['Revenus dans TMI > 0', metrics.revenusDansTmi > 0]);
  assertions.push(['Marge > 0', metrics.margeAvantChangement > 0]);
  assertions.push(['Seuil bas cohérent', metrics.seuilBasFoyer >= 0 && metrics.seuilBasFoyer < revenuImposable]);
  
  // Invariant: revenus dans TMI + marge ≈ largeur tranche
  if (metrics.seuilHautFoyer) {
    const largeurTranche = metrics.seuilHautFoyer - metrics.seuilBasFoyer;
    const somme = metrics.revenusDansTmi + metrics.margeAvantChangement;
    assertions.push(['Invariant largeur tranche', Math.abs(somme - largeurTranche) < 100]);
  }
  
  assertions.forEach(([desc, result]) => {
    console.log(`  ✓ ${desc}: ${result ? 'PASS' : 'FAIL'}`);
  });
  
  return assertions.every(([_, result]) => result);
}

/**
 * Scénario B: Célibataire, 2 enfants à charge, parent isolé OFF, revenu imposable foyer = 90 000 €
 * Actuellement TMI 41% mais "dans TMI = 0€" et marge énorme => DOIT ÊTRE CORRIGÉ
 */
function testScenarioB() {
  console.log('\n=== SCÉNARIO B: Célibataire 2 enfants, parent isolé OFF, 90k€ ===');
  
  const params = {
    scale: DEFAULT_SCALE,
    partsNb: 3, // 1 + 0.5 * 2 enfants = 2 parts, mais ici on simule 3 parts totales
    basePartsForQf: 1,
    extraParts: 2, // 2 demi-parts = 1 part
    extraHalfParts: 2,
    plafondPartSup: DEFAULT_PLAFOND_PART_SUP,
    plafondParentIso2: DEFAULT_PLAFOND_PARENT_ISO,
    isCouple: false,
    isIsolated: false
  };
  
  const revenuImposable = 90000;
  const metrics = computeTmiMetrics(revenuImposable, params);
  
  console.log('Revenu imposable:', revenuImposable);
  console.log('TMI calculée:', metrics.tmiRate + '%');
  console.log('Revenus dans TMI:', metrics.revenusDansTmi + '€');
  console.log('Marge avant changement:', metrics.margeAvantChangement ? metrics.margeAvantChangement + '€' : '—');
  console.log('Seuil bas foyer:', metrics.seuilBasFoyer);
  console.log('Seuil haut foyer:', metrics.seuilHautFoyer);
  
  // Vérifications - doit corriger le bug "dans TMI = 0€" et "marge énorme"
  const assertions = [];
  assertions.push(['TMI cohérente (30-41%)', metrics.tmiRate >= 30 && metrics.tmiRate <= 41]);
  assertions.push(['Revenus dans TMI > 0', metrics.revenusDansTmi > 0]);
  assertions.push(['Marge raisonnable < 100k', !metrics.margeAvantChangement || metrics.margeAvantChangement < 100000]);
  assertions.push(['Pas de valeur absurde', metrics.margeAvantChangement !== 270588]);
  
  assertions.forEach(([desc, result]) => {
    console.log(`  ✓ ${desc}: ${result ? 'PASS' : 'FAIL'}`);
  });
  
  return assertions.every(([_, result]) => result);
}

/**
 * Scénario C: Célibataire, 2 enfants à charge, parent isolé ON, revenu imposable foyer = 90 000 €
 * Doit montrer la différence ON/OFF dans les calculs
 */
function testScenarioC() {
  console.log('\n=== SCÉNARIO C: Célibataire 2 enfants, parent isolé ON, 90k€ ===');
  
  const params = {
    scale: DEFAULT_SCALE,
    partsNb: 3,
    basePartsForQf: 1,
    extraParts: 2,
    extraHalfParts: 2,
    plafondPartSup: DEFAULT_PLAFOND_PART_SUP,
    plafondParentIso2: DEFAULT_PLAFOND_PARENT_ISO,
    isCouple: false,
    isIsolated: true // DIFFÉRENCE avec scénario B
  };
  
  const revenuImposable = 90000;
  const metrics = computeTmiMetrics(revenuImposable, params);
  
  console.log('Revenu imposable:', revenuImposable);
  console.log('TMI calculée:', metrics.tmiRate + '%');
  console.log('Revenus dans TMI:', metrics.revenusDansTmi + '€');
  console.log('Marge avant changement:', metrics.margeAvantChangement ? metrics.margeAvantChangement + '€' : '—');
  console.log('Seuil bas foyer:', metrics.seuilBasFoyer);
  console.log('Seuil haut foyer:', metrics.seuilHautFoyer);
  
  // Comparaison avec scénario B (parent isolé OFF)
  const paramsB = { ...params, isIsolated: false };
  const metricsB = computeTmiMetrics(revenuImposable, paramsB);
  
  console.log('--- Comparaison parent isolé OFF vs ON ---');
  console.log('TMI OFF vs ON:', metricsB.tmiRate + '% vs ' + metrics.tmiRate + '%');
  console.log('Marge OFF vs ON:', 
    (metricsB.margeAvantChangement || 0) + '€ vs ' + (metrics.margeAvantChangement || 0) + '€');
  
  const assertions = [];
  assertions.push(['TMI cohérente', metrics.tmiRate >= 0 && metrics.tmiRate <= 45]);
  assertions.push(['Revenus dans TMI > 0', metrics.revenusDansTmi > 0]);
  assertions.push(['Différence détectable ON/OFF', 
    metrics.tmiRate !== metricsB.tmiRate || 
    Math.abs((metrics.margeAvantChangement || 0) - (metricsB.margeAvantChangement || 0)) > 100
  ]);
  
  assertions.forEach(([desc, result]) => {
    console.log(`  ✓ ${desc}: ${result ? 'PASS' : 'FAIL'}`);
  });
  
  return assertions.every(([_, result]) => result);
}

/**
 * Scénario D: Cas seuil - Marié/Pacsé, revenu imposable foyer = 167 647 €
 * TMI doit basculer de 30% à 41%, si juste après seuil "dans TMI" ≈ quelques euros
 */
function testScenarioD() {
  console.log('\n=== SCÉNARIO D: Marié/Pacsé seuil 167k€ ===');
  
  const params = {
    scale: DEFAULT_SCALE,
    partsNb: 2,
    basePartsForQf: 2,
    extraParts: 0,
    extraHalfParts: 0,
    plafondPartSup: DEFAULT_PLAFOND_PART_SUP,
    plafondParentIso2: DEFAULT_PLAFOND_PARENT_ISO,
    isCouple: true,
    isIsolated: false
  };
  
  const revenuImposable = 167647;
  const metrics = computeTmiMetrics(revenuImposable, params);
  
  console.log('Revenu imposable:', revenuImposable);
  console.log('TMI calculée:', metrics.tmiRate + '%');
  console.log('Revenus dans TMI:', metrics.revenusDansTmi + '€');
  console.log('Marge avant changement:', metrics.margeAvantChangement ? metrics.margeAvantChangement + '€' : '—');
  
  // Test de stabilité autour du seuil
  const revenuMoins = revenuImposable - 1000;
  const revenuPlus = revenuImposable + 1000;
  
  const metricsM = computeTmiMetrics(revenuMoins, params);
  const metricsP = computeTmiMetrics(revenuPlus, params);
  
  console.log('TMI à', revenuMoins + '€:', metricsM.tmiRate + '%');
  console.log('TMI à', revenuPlus + '€:', metricsP.tmiRate + '%');
  
  const assertions = [];
  assertions.push(['TMI = 41%', metrics.tmiRate === 41]);
  assertions.push(['Revenus dans TMI > 0', metrics.revenusDansTmi > 0]);
  assertions.push(['Marge cohérente vers 45%', metrics.margeAvantChangement > 0]);
  assertions.push(['Cohérence autour du seuil', 
    metricsM.tmiRate <= metrics.tmiRate && metrics.tmiRate <= metricsP.tmiRate
  ]);
  
  assertions.forEach(([desc, result]) => {
    console.log(`  ✓ ${desc}: ${result ? 'PASS' : 'FAIL'}`);
  });
  
  return assertions.every(([_, result]) => result);
}

/**
 * Test de la dernière tranche (marge = null → affichage "—")
 */
function testLastBracket() {
  console.log('\n=== TEST: Dernière tranche ===');
  
  const params = {
    scale: DEFAULT_SCALE,
    partsNb: 1,
    basePartsForQf: 1,
    extraParts: 0,
    extraHalfParts: 0,
    plafondPartSup: DEFAULT_PLAFOND_PART_SUP,
    plafondParentIso2: DEFAULT_PLAFOND_PARENT_ISO,
    isCouple: false,
    isIsolated: false
  };
  
  const revenuImposable = 300000; // Bien dans la dernière tranche
  const metrics = computeTmiMetrics(revenuImposable, params);
  
  console.log('Revenu imposable:', revenuImposable);
  console.log('TMI calculée:', metrics.tmiRate + '%');
  console.log('Revenus dans TMI:', metrics.revenusDansTmi + '€');
  console.log('Marge avant changement:', metrics.margeAvantChangement ? metrics.margeAvantChangement + '€' : '—');
  
  const assertions = [];
  assertions.push(['TMI = 45%', metrics.tmiRate === 45]);
  assertions.push(['Marge = null (dernière tranche)', metrics.margeAvantChangement === null]);
  assertions.push(['Revenus dans TMI > 0', metrics.revenusDansTmi > 0]);
  
  assertions.forEach(([desc, result]) => {
    console.log(`  ✓ ${desc}: ${result ? 'PASS' : 'FAIL'}`);
  });
  
  return assertions.every(([_, result]) => result);
}

/**
 * Exécution de tous les tests
 */
function runAllTests() {
  console.log('🧪 TESTS MÉTRIQUES TMI ROBUSTES\n');
  
  const results = [
    testScenarioA(),
    testScenarioB(), 
    testScenarioC(),
    testScenarioD(),
    testLastBracket()
  ];
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n📊 RÉSULTATS: ${passed}/${total} tests réussis`);
  
  if (passed === total) {
    console.log('✅ Tous les tests passent !');
  } else {
    console.log('❌ Certains tests échouent, vérifier l\'implémentation');
  }
  
  return passed === total;
}

// Exporter pour utilisation en module ou exécution directe
if (typeof window === 'undefined') {
  // Node.js ou environnement de test
  runAllTests();
}

export { runAllTests, testScenarioA, testScenarioB, testScenarioC, testScenarioD };
