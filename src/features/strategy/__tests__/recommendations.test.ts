/**
 * Tests unitaires - Module Recommendations
 */

import { describe, it, expect } from 'vitest';
import { generateRecommendations, filterRecommendationsByObjectif } from '../recommendations';
import type { DossierAudit } from '../../audit/types';
import { createEmptyDossier } from '../../audit/types';

function createTestDossier(overrides: Partial<DossierAudit> = {}): DossierAudit {
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
      ...base.situationFiscale,
      revenuFiscalReference: 100000,
      nombreParts: 2.5,
      impotRevenu: 15000,
      tmi: 30,
    },
    actifs: [
      { id: '1', libelle: 'RP', valeur: 500000, proprietaire: 'commun', type: 'residence_principale' },
      { id: '2', libelle: 'Livrets', valeur: 80000, proprietaire: 'commun', type: 'livret' },
    ],
    passif: {
      emprunts: [{ id: 'e1', libelle: 'Crédit RP', type: 'immobilier', capitalInitial: 300000, capitalRestantDu: 200000, mensualite: 1500, tauxInteret: 2, dateDebut: '2015-01-01', dateFin: '2035-01-01' }],
      autresDettes: [],
    },
    ...overrides,
  } as DossierAudit;
}

describe('Recommendations Module', () => {
  describe('generateRecommendations', () => {
    it('génère des recommandations pour objectif reduire_fiscalite avec TMI 30%', () => {
      const dossier = createTestDossier({
        objectifs: ['reduire_fiscalite'],
      });

      const recos = generateRecommendations(dossier);

      expect(recos.length).toBeGreaterThan(0);
      expect(recos.some(r => r.id === 'reco-per-ir')).toBe(true);
    });

    it('génère des recommandations pour objectif proteger_conjoint', () => {
      const dossier = createTestDossier({
        objectifs: ['proteger_conjoint'],
      });

      const recos = generateRecommendations(dossier);

      expect(recos.length).toBeGreaterThan(0);
      expect(recos.some(r => r.objectifsCibles.includes('proteger_conjoint'))).toBe(true);
    });

    it('génère des recommandations pour objectif preparer_transmission', () => {
      const dossier = createTestDossier({
        objectifs: ['preparer_transmission'],
      });

      const recos = generateRecommendations(dossier);

      expect(recos.some(r => r.objectifsCibles.includes('preparer_transmission'))).toBe(true);
    });

    it('génère des recommandations pour objectif developper_patrimoine avec liquidités', () => {
      const dossier = createTestDossier({
        objectifs: ['developper_patrimoine'],
      });

      const recos = generateRecommendations(dossier);

      // Avec 80000€ de liquidités, devrait recommander diversification
      expect(recos.some(r => r.id === 'reco-diversification')).toBe(true);
    });

    it('trie les recommandations par priorité (haute en premier)', () => {
      const dossier = createTestDossier({
        objectifs: ['reduire_fiscalite', 'developper_patrimoine'],
      });

      const recos = generateRecommendations(dossier);

      // Première reco devrait être haute priorité
      expect(recos[0].priorite).toBe('haute');
    });

    it('ne génère pas de reco IFI si pas d\'IFI', () => {
      const dossier = createTestDossier({
        objectifs: ['reduire_fiscalite'],
        situationFiscale: {
          anneeReference: 2023,
          revenus: [],
          revenuFiscalReference: 100000,
          nombreParts: 2.5,
          impotRevenu: 15000,
          tmi: 30,
          ifi: 0, // Pas d'IFI
        },
      });

      const recos = generateRecommendations(dossier);

      expect(recos.some(r => r.id === 'reco-ifi-scpi')).toBe(false);
    });

    it('génère reco IFI si IFI > 0', () => {
      const dossier = createTestDossier({
        objectifs: ['reduire_fiscalite'],
        situationFiscale: {
          anneeReference: 2023,
          revenus: [],
          revenuFiscalReference: 100000,
          nombreParts: 2.5,
          impotRevenu: 15000,
          tmi: 30,
          ifi: 5000,
        },
      });

      const recos = generateRecommendations(dossier);

      expect(recos.some(r => r.id === 'reco-ifi-scpi')).toBe(true);
    });
  });

  describe('filterRecommendationsByObjectif', () => {
    it('filtre correctement par objectif', () => {
      const dossier = createTestDossier({
        objectifs: ['reduire_fiscalite', 'proteger_conjoint'],
      });

      const allRecos = generateRecommendations(dossier);
      const filtered = filterRecommendationsByObjectif(allRecos, 'reduire_fiscalite');

      expect(filtered.every(r => r.objectifsCibles.includes('reduire_fiscalite'))).toBe(true);
    });
  });
});
