import { describe, expect, it } from 'vitest';
import { extractFiscalParams, simulateComplete } from '..';
import { DEFAULT_VERSEMENT_CONFIG, normalizeVersementConfig } from '../versementConfig';

const fiscalParams = extractFiscalParams({}, {});

function makeClient(overrides: Record<string, unknown> = {}) {
  return {
    ageActuel: 45,
    tmiEpargne: 0.30,
    tmiRetraite: 0.11,
    situation: 'single',
    ...overrides,
  };
}

function makeLiquidationParams(overrides: Record<string, unknown> = {}) {
  return {
    mode: 'epuiser',
    duree: 20,
    mensualiteCible: 500,
    montantUnique: 50000,
    optionBaremeIR: false,
    ...overrides,
  };
}

function makeTransmissionParams(overrides: Record<string, unknown> = {}) {
  return {
    ageAuDeces: 85,
    agePremierVersement: 45,
    nbBeneficiaires: 2,
    beneficiaryType: 'enfants',
    ...overrides,
  };
}

describe('simulateComplete effortTotal', () => {
  it('matches total contributions when the product has no tax deduction and no distributed income', () => {
    const result = simulateComplete(
      {
        envelope: 'AV',
        dureeEpargne: 1,
        versementConfig: normalizeVersementConfig({
          ...DEFAULT_VERSEMENT_CONFIG,
          initial: {
            ...DEFAULT_VERSEMENT_CONFIG.initial,
            montant: 100000,
            pctCapitalisation: 100,
            pctDistribution: 0,
          },
          annuel: {
            ...DEFAULT_VERSEMENT_CONFIG.annuel,
            montant: 0,
          },
        }),
      },
      makeClient(),
      makeLiquidationParams(),
      makeTransmissionParams(),
      fiscalParams,
    );

    expect(result.totaux.effortTotal).toBe(result.epargne.cumulVersements);
    expect(result.totaux.effortTotal).toBe(100000);
  });

  it('subtracts current-year income-tax savings when the product is deductible', () => {
    const result = simulateComplete(
      {
        envelope: 'PER',
        dureeEpargne: 1,
        versementConfig: normalizeVersementConfig({
          ...DEFAULT_VERSEMENT_CONFIG,
          initial: {
            ...DEFAULT_VERSEMENT_CONFIG.initial,
            montant: 100000,
            pctCapitalisation: 100,
            pctDistribution: 0,
          },
          annuel: {
            ...DEFAULT_VERSEMENT_CONFIG.annuel,
            montant: 0,
          },
        }),
      },
      makeClient({ tmiEpargne: 0.30 }),
      makeLiquidationParams(),
      makeTransmissionParams(),
      fiscalParams,
    );

    expect(result.epargne.cumulEconomieIR).toBe(30000);
    expect(result.totaux.effortTotal).toBe(result.epargne.cumulVersements - result.epargne.cumulEconomieIR);
    expect(result.totaux.effortTotal).toBe(70000);
  });

  it('adds distributed net income for products that pay out cash during the period', () => {
    const result = simulateComplete(
      {
        envelope: 'SCPI',
        dureeEpargne: 2,
        versementConfig: normalizeVersementConfig({
          ...DEFAULT_VERSEMENT_CONFIG,
          initial: {
            ...DEFAULT_VERSEMENT_CONFIG.initial,
            montant: 100000,
            pctCapitalisation: 0,
            pctDistribution: 100,
            fraisEntree: 0,
          },
          annuel: {
            ...DEFAULT_VERSEMENT_CONFIG.annuel,
            montant: 0,
          },
          distribution: {
            ...DEFAULT_VERSEMENT_CONFIG.distribution,
            tauxDistribution: 0.06,
            rendementAnnuel: 0.02,
            strategie: 'apprehender',
            delaiJouissance: 0,
          },
        }),
      },
      makeClient(),
      makeLiquidationParams(),
      makeTransmissionParams(),
      fiscalParams,
    );

    expect(result.epargne.cumulRevenusNetsPercus).toBeGreaterThan(0);
    expect(result.totaux.effortTotal).toBe(
      result.epargne.cumulVersements
      - result.epargne.cumulEconomieIR
      + result.epargne.cumulRevenusNetsPercus,
    );
    expect(result.totaux.effortTotal).toBeGreaterThan(result.epargne.cumulVersements);
    expect(result.totaux.effortTotal).toBeGreaterThan(result.totaux.effortReel);
  });
});
