/**
 * Tests unitaires - Module Calculations
 */

import { describe, it, expect } from 'vitest';
import { calculateBaselineProjection, calculateStrategyProjection, compareScenarios } from '../calculations';
import type { DossierAudit } from '../../audit/types';
import { createEmptyDossier } from '../../audit/types';
import type { ProduitConfig } from '../types';
import { DEFAULT_TAX_SETTINGS } from '../../../constants/settingsDefaults';

function createTestDossier(): DossierAudit {
  const base = createEmptyDossier();
  return {
    ...base,
    situationFamiliale: {
      ...base.situationFamiliale,
      mr: { prenom: 'Jean', nom: 'Dupont', dateNaissance: '1970-01-01' },
      situationMatrimoniale: 'marie',
      mme: { prenom: 'Marie', nom: 'Dupont', dateNaissance: '1972-06-15' },
      enfants: [{ prenom: 'Paul', dateNaissance: '2000-03-20', estCommun: true }],
    },
    situationFiscale: {
      anneeReference: 2023,
      revenus: [],
      revenuFiscalReference: 80000,
      nombreParts: 2.5,
      impotRevenu: 10000,
      tmi: 30,
    },
    actifs: [
      { id: '1', libelle: 'RP', valeur: 400000, proprietaire: 'commun', type: 'residence_principale' },
      { id: '2', libelle: 'Épargne', valeur: 50000, proprietaire: 'commun', type: 'livret' },
    ],
    passif: {
      emprunts: [{ id: 'e1', libelle: 'Crédit RP', type: 'immobilier', capitalInitial: 200000, capitalRestantDu: 150000, mensualite: 1200, tauxInteret: 2, dateDebut: '2018-01-01', dateFin: '2038-01-01' }],
      autresDettes: [],
    },
    objectifs: ['reduire_fiscalite'],
  } as DossierAudit;
}

describe('Calculations Module', () => {
  describe('calculateBaselineProjection', () => {
    it('génère 11 projections (années 0 à 10)', () => {
      const dossier = createTestDossier();
      const scenario = calculateBaselineProjection(dossier);

      expect(scenario.projections.length).toBe(11);
      expect(scenario.projections[0].annee).toBe(0);
      expect(scenario.projections[10].annee).toBe(10);
    });

    it('le patrimoine initial correspond aux actifs - passifs', () => {
      const dossier = createTestDossier();
      const scenario = calculateBaselineProjection(dossier);

      // 400000 + 50000 - 150000 = 300000
      expect(scenario.projections[0].patrimoineTotal).toBeCloseTo(300000, 0);
    });

    it('le patrimoine croît sur 10 ans', () => {
      const dossier = createTestDossier();
      const scenario = calculateBaselineProjection(dossier);

      expect(scenario.projections[10].patrimoineTotal).toBeGreaterThan(scenario.projections[0].patrimoineTotal);
    });

    it('contient des hypothèses', () => {
      const dossier = createTestDossier();
      const scenario = calculateBaselineProjection(dossier);

      expect(scenario.hypotheses.length).toBeGreaterThan(0);
    });
  });

  describe('calculateStrategyProjection', () => {
    it('génère 11 projections', () => {
      const dossier = createTestDossier();
      const produits: ProduitConfig[] = [];
      const scenario = calculateStrategyProjection(dossier, produits);

      expect(scenario.projections.length).toBe(11);
    });

    it('avec PER, l\'IR est réduit', () => {
      const dossier = createTestDossier();
      
      const baselineScenario = calculateBaselineProjection(dossier);
      
      const produits: ProduitConfig[] = [{
        id: 'p1',
        type: 'per',
        libelle: 'PER',
        versementsProgrammes: 500, // 500€/mois = 6000€/an
        dureeAnnees: 10,
        tauxRendementEstime: 3,
      }];
      
      const strategieScenario = calculateStrategyProjection(dossier, produits);

      // L'IR devrait être plus faible avec le PER
      expect(strategieScenario.projections[1].impotRevenu).toBeLessThan(baselineScenario.projections[1].impotRevenu);
    });

    it('avec versements, le patrimoine augmente plus', () => {
      const dossier = createTestDossier();
      
      const baselineScenario = calculateBaselineProjection(dossier);
      
      const produits: ProduitConfig[] = [{
        id: 'p1',
        type: 'assurance_vie',
        libelle: 'AV',
        versementsProgrammes: 300,
        dureeAnnees: 10,
        tauxRendementEstime: 3,
      }];
      
      const strategieScenario = calculateStrategyProjection(dossier, produits);

      // Le patrimoine devrait être plus élevé avec les versements
      expect(strategieScenario.projections[10].patrimoineTotal).toBeGreaterThan(baselineScenario.projections[10].patrimoineTotal);
    });
  });

  describe('compareScenarios', () => {
    it('calcule les écarts correctement', () => {
      const dossier = createTestDossier();

      const baseline = calculateBaselineProjection(dossier);

      const produits: ProduitConfig[] = [{
        id: 'p1',
        type: 'per',
        libelle: 'PER',
        versementsProgrammes: 500,
        dureeAnnees: 10,
        tauxRendementEstime: 3,
      }];

      const strategie = calculateStrategyProjection(dossier, produits);
      const comparaison = compareScenarios(baseline, strategie);

      expect(comparaison.baseline).toBe(baseline);
      expect(comparaison.strategie).toBe(strategie);
      expect(typeof comparaison.ecarts.patrimoineTotal).toBe('number');
      expect(typeof comparaison.ecarts.economieImpots).toBe('number');
    });

    it('économie d\'impôts positive avec PER', () => {
      const dossier = createTestDossier();

      const baseline = calculateBaselineProjection(dossier);

      const produits: ProduitConfig[] = [{
        id: 'p1',
        type: 'per',
        libelle: 'PER',
        versementsProgrammes: 500,
        dureeAnnees: 10,
        tauxRendementEstime: 3,
      }];

      const strategie = calculateStrategyProjection(dossier, produits);
      const comparaison = compareScenarios(baseline, strategie);

      expect(comparaison.ecarts.economieImpots).toBeGreaterThan(0);
    });
  });

  /**
   * Cohérence IR — source unique
   *
   * Ces tests s'assurent que le module Stratégie utilise bien le même barème IR
   * que le dossier fiscal centralisé (DEFAULT_TAX_SETTINGS / fiscalContext),
   * et non un barème alternatif en dur. Ils capturent le comportement de référence
   * post-P1-06-06 (alignement Stratégie / simulateur IR).
   */
  describe('Cohérence IR — même barème que dossier fiscal (post-P1)', () => {
    it('baseline et stratégie sans produits produisent le même IR à chaque année', () => {
      const dossier = createTestDossier();
      const baseline = calculateBaselineProjection(dossier);
      const strategie = calculateStrategyProjection(dossier, []);

      // Sans PER ni produit, les revenus imposables sont identiques → même IR
      baseline.projections.forEach((proj, idx) => {
        expect(strategie.projections[idx].impotRevenu).toBe(proj.impotRevenu);
      });
    });

    it('valeur IR de référence : revenu 80 000 €, 2,5 parts → barème scaleCurrent 2025', () => {
      // createTestDossier() : revenuFiscalReference=80000, nombreParts=2.5
      // taxablePerPart = 80000 / 2.5 = 32000
      // computeProgressiveTax(scaleCurrent, 32000) :
      //   0–11 497 @0%   : 0
      //   11 498–29 315 @11% : 17817 × 0.11 = 1959.87
      //   29 316–32 000 @30% : 2684  × 0.30 =  805.20
      //   taxPerPart = 2765.07
      //   impotRevenu = round(2765.07 × 2.5) = 6913
      //
      // Ce chiffre change si quelqu'un remplace scaleCurrent par un barème en dur différent.
      const dossier = createTestDossier();
      const baseline = calculateBaselineProjection(dossier);

      // Les revenus sont constants → même IR chaque année
      expect(baseline.projections[0].impotRevenu).toBe(6913);
      expect(baseline.projections[5].impotRevenu).toBe(6913);
      expect(baseline.projections[10].impotRevenu).toBe(6913);
    });

    it('le barème scaleCurrent est celui de DEFAULT_TAX_SETTINGS (pas un barème alternatif)', () => {
      // Vérifie que le nombre de tranches est cohérent avec le barème 2025
      const scale = DEFAULT_TAX_SETTINGS.incomeTax.scaleCurrent;
      expect(scale.length).toBe(5); // 5 tranches (0%, 11%, 30%, 41%, 45%)
      expect(scale[0].rate).toBe(0);
      expect(scale[scale.length - 1].rate).toBe(45);
    });
  });
});
