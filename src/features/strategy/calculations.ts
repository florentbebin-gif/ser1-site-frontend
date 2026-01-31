/**
 * Calculs de projections financières
 * 
 * Projections simplifiées MVP :
 * - Baseline : situation actuelle sans intervention
 * - Stratégie : avec les produits sélectionnés
 */

import type { DossierAudit } from '../audit/types';
import type { ProduitConfig, Projection, Scenario, ComparaisonScenarios } from './types';
import { calculateIR } from '../../engine/tax';

const HORIZON_ANNEES = 10; // Projection sur 10 ans par défaut

/**
 * Calcule la projection baseline (sans intervention)
 */
export function calculateBaselineProjection(dossier: DossierAudit): Scenario {
  const projections: Projection[] = [];
  
  const totalActifs = dossier.actifs.reduce((sum, a) => sum + a.valeur, 0);
  const totalPassifs = dossier.passif.emprunts.reduce((sum, e) => sum + e.capitalRestantDu, 0);

  // Hypothèses baseline
  const tauxCroissancePatrimoine = 0.02; // 2% par an (inflation)
  const revenuAnnuel = dossier.situationFiscale.revenuFiscalReference;

  for (let annee = 0; annee <= HORIZON_ANNEES; annee++) {
    const actifs = totalActifs * Math.pow(1 + tauxCroissancePatrimoine, annee);
    const passifs = totalPassifs * Math.pow(0.95, annee); // Remboursement progressif
    const patrimoineTotal = actifs - passifs;

    // Calcul IR (simplifié, revenu constant)
    const irResult = calculateIR({
      revenuNetImposable: revenuAnnuel,
      nbParts: dossier.situationFiscale.nombreParts,
    });

    projections.push({
      annee,
      patrimoineTotal,
      actifs,
      passifs,
      revenusAnnuels: revenuAnnuel,
      impotRevenu: irResult.result.impotBrut,
      ifi: dossier.situationFiscale.ifi,
    });
  }

  return {
    id: 'baseline',
    nom: 'Situation actuelle',
    description: 'Projection sans intervention du CGP',
    projections,
    hypotheses: [
      'Croissance du patrimoine : 2% par an (inflation)',
      'Revenus constants',
      'Remboursement progressif des emprunts',
    ],
  };
}

/**
 * Calcule la projection avec stratégie
 */
export function calculateStrategyProjection(
  dossier: DossierAudit,
  produits: ProduitConfig[]
): Scenario {
  const projections: Projection[] = [];
  
  const totalActifs = dossier.actifs.reduce((sum, a) => sum + a.valeur, 0);
  const totalPassifs = dossier.passif.emprunts.reduce((sum, e) => sum + e.capitalRestantDu, 0);
  const revenuAnnuel = dossier.situationFiscale.revenuFiscalReference;

  // Calcul des versements PER pour déduction IR
  const versementsPER = produits
    .filter(p => p.type === 'per')
    .reduce((sum, p) => sum + (p.versementsProgrammes || 0) * 12, 0);

  const tauxCroissancePatrimoine = 0.03; // 3% avec stratégie optimisée

  for (let annee = 0; annee <= HORIZON_ANNEES; annee++) {
    let actifs = totalActifs * Math.pow(1 + tauxCroissancePatrimoine, annee);
    const passifs = totalPassifs * Math.pow(0.95, annee);

    // Ajout des versements programmés capitalisés
    produits.forEach(produit => {
      if (produit.versementsProgrammes && annee > 0) {
        const versementsAnnuels = produit.versementsProgrammes * 12;
        const taux = (produit.tauxRendementEstime || 3) / 100;
        const capitalise = versementsAnnuels * ((Math.pow(1 + taux, annee) - 1) / taux);
        actifs += capitalise;
      }
      if (produit.montantInitial && annee > 0) {
        const taux = (produit.tauxRendementEstime || 3) / 100;
        actifs += produit.montantInitial * (Math.pow(1 + taux, annee) - 1);
      }
    });

    const patrimoineTotal = actifs - passifs;

    // Calcul IR avec déduction PER
    const revenuImposable = Math.max(0, revenuAnnuel - versementsPER);
    const irResult = calculateIR({
      revenuNetImposable: revenuImposable,
      nbParts: dossier.situationFiscale.nombreParts,
    });

    projections.push({
      annee,
      patrimoineTotal,
      actifs,
      passifs,
      revenusAnnuels: revenuAnnuel,
      impotRevenu: irResult.result.impotBrut,
      ifi: dossier.situationFiscale.ifi,
    });
  }

  return {
    id: 'strategie',
    nom: 'Stratégie CGP',
    description: 'Projection avec mise en place de la stratégie',
    projections,
    hypotheses: [
      'Croissance du patrimoine : 3% par an (optimisation)',
      `Versements PER : ${versementsPER.toLocaleString('fr-FR')} € / an`,
      'Déduction fiscale des versements PER',
      'Rendement moyen des placements : 3%',
    ],
  };
}

/**
 * Compare les deux scénarios
 */
export function compareScenarios(
  baseline: Scenario,
  strategie: Scenario
): ComparaisonScenarios {
  const dernierAnneeBaseline = baseline.projections[baseline.projections.length - 1];
  const dernierAnneeStrategie = strategie.projections[strategie.projections.length - 1];

  const ecartPatrimoine = dernierAnneeStrategie.patrimoineTotal - dernierAnneeBaseline.patrimoineTotal;

  // Somme des économies d'impôts sur la période
  const economieImpots = baseline.projections.reduce((sum, proj, idx) => {
    return sum + (proj.impotRevenu - strategie.projections[idx].impotRevenu);
  }, 0);

  // Estimation succession (simplifié)
  const economieSuccession = 0; // À affiner selon les produits

  return {
    baseline,
    strategie,
    ecarts: {
      patrimoineTotal: ecartPatrimoine,
      economieImpots,
      economieSuccession,
    },
  };
}
