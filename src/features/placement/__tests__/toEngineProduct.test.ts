import { describe, expect, it } from 'vitest';
import { simulateComplete, extractFiscalParams } from '../../../engine/placementEngine.js';
import { DEFAULT_VERSEMENT_CONFIG, normalizeVersementConfig } from '../../../utils/versementConfig.js';
import { toEngineProduct, computeRendementPondere } from '../adapters/toEngineProduct.js';

const baseProduct = {
  envelope: 'AV',
  dureeEpargne: 20,
  perBancaire: false,
  optionBaremeIR: false,
  fraisGestion: 0.01,
  rendementLiquidationOverride: null,
  versementConfig: normalizeVersementConfig(DEFAULT_VERSEMENT_CONFIG),
};

const baseState = {
  client: {
    ageActuel: 45,
    tmiEpargne: 0.30,
    tmiRetraite: 0.11,
    situation: 'single',
  },
  liquidation: {
    mode: 'epuiser',
    duree: 25,
    mensualiteCible: 500,
    montantUnique: 50000,
    optionBaremeIR: false,
  },
  transmission: {
    ageAuDeces: 85,
    nbBeneficiaires: 2,
    dmtgTaux: 0.2,
    beneficiaryType: 'enfants',
  },
  products: [
    { ...baseProduct, envelope: 'AV' },
    { ...baseProduct, envelope: 'PER' },
  ],
};

function getRendementLiquidationLocal(product: any) {
  if (!product || product.envelope === 'SCPI') return null;
  const override = product.rendementLiquidationOverride;
  if (typeof override === 'number') return override;
  return product.versementConfig?.capitalisation?.rendementAnnuel ?? 0.03;
}

function legacyBuildEngineProduct(product: any) {
  const { versementConfig, envelope, dureeEpargne, perBancaire, optionBaremeIR, fraisGestion } = product;
  const normalizedConfig = normalizeVersementConfig(versementConfig);
  const { initial, annuel, ponctuels, capitalisation, distribution } = normalizedConfig;

  const pctCapi = (initial.pctCapitalisation || 0) / 100;
  const pctDistrib = (initial.pctDistribution || 0) / 100;
  const rendementCapi = capitalisation.rendementAnnuel || 0;
  const rendementDistrib = distribution.tauxDistribution || 0;
  const rendementMoyen = pctCapi * rendementCapi + pctDistrib * rendementDistrib;
  const tauxRevalo = pctDistrib > 0 ? distribution.rendementAnnuel || 0 : 0;

  return {
    envelope,
    dureeEpargne,
    perBancaire,
    optionBaremeIR,
    fraisGestion,
    versementInitial: initial.montant,
    versementAnnuel: annuel.montant,
    fraisEntree: initial.fraisEntree,
    rendement: rendementMoyen,
    tauxRevalorisation: tauxRevalo,
    delaiJouissance: pctDistrib > 0 ? (distribution.delaiJouissance || 0) : 0,
    dureeProduit: pctDistrib > 0 ? distribution.dureeProduit : null,
    strategieCompteEspece: pctDistrib > 0 ? distribution.strategie : 'reinvestir_capi',
    reinvestirVersAuTerme: distribution.reinvestirVersAuTerme || 'capitalisation',
    pctCapitalisation: initial.pctCapitalisation,
    pctDistribution: initial.pctDistribution,
    versementConfig,
    versementsPonctuels: ponctuels,
    garantieBonneFin: annuel.garantieBonneFin,
    exonerationCotisations: annuel.exonerationCotisations,
  };
}

describe('placement toEngineProduct', () => {
  it('computeRendementPondere reproduit la moyenne pondérée', () => {
    const r = computeRendementPondere({
      pctCapitalisation: 70,
      pctDistribution: 30,
      rendementCapitalisation: 0.05,
      tauxDistribution: 0.08,
    });
    expect(r).toBeCloseTo(0.059, 8);
  });

  it('mappe un produit AV standard de façon identique au legacy', () => {
    const product = baseState.products[0];
    expect(toEngineProduct(product)).toEqual(legacyBuildEngineProduct(product));
  });

  it('gère la part distribution à 0 (stratégie par défaut + revalo 0)', () => {
    const product = {
      ...baseState.products[0],
      versementConfig: {
        ...baseState.products[0].versementConfig,
        initial: {
          ...baseState.products[0].versementConfig.initial,
          pctCapitalisation: 100,
          pctDistribution: 0,
        },
      },
    };

    const out = toEngineProduct(product);
    expect(out.tauxRevalorisation).toBe(0);
    expect(out.strategieCompteEspece).toBe('reinvestir_capi');
    expect(out).toEqual(legacyBuildEngineProduct(product));
  });

  it('gère les champs distribution quand la part distribution > 0', () => {
    const product = {
      ...baseState.products[1],
      versementConfig: {
        ...baseState.products[1].versementConfig,
        initial: {
          ...baseState.products[1].versementConfig.initial,
          pctCapitalisation: 40,
          pctDistribution: 60,
        },
        distribution: {
          ...baseState.products[1].versementConfig.distribution,
          tauxDistribution: 0.07,
          rendementAnnuel: 0.03,
          delaiJouissance: 2,
          dureeProduit: 12,
          strategie: 'cash',
        },
      },
    };

    const out = toEngineProduct(product);
    expect(out.tauxRevalorisation).toBe(0.03);
    expect(out.delaiJouissance).toBe(2);
    expect(out.dureeProduit).toBe(12);
    expect(out.strategieCompteEspece).toBe('cash');
    expect(out).toEqual(legacyBuildEngineProduct(product));
  });
});

describe('placement toEngineProduct parity with simulateComplete', () => {
  const fiscalParams = extractFiscalParams({}, {});
  const client = baseState.client;
  const transmission = { ...baseState.transmission, agePremierVersement: client.ageActuel };

  const scenarios = [
    baseState.products[0],
    baseState.products[1],
    {
      ...baseState.products[0],
      envelope: 'SCPI',
      versementConfig: {
        ...baseState.products[0].versementConfig,
        initial: {
          ...baseState.products[0].versementConfig.initial,
          montant: 120000,
          pctCapitalisation: 30,
          pctDistribution: 70,
        },
      },
    },
  ];

  it.each(scenarios)('produit %# -> output simulateComplete identique avant/après', (product) => {
    const liquidationParams = {
      ...baseState.liquidation,
      rendement: getRendementLiquidationLocal(product) ?? undefined,
    };

    const legacyResult = simulateComplete(
      legacyBuildEngineProduct(product),
      client,
      liquidationParams,
      transmission,
      fiscalParams,
    );

    const extractedResult = simulateComplete(
      toEngineProduct(product),
      client,
      liquidationParams,
      transmission,
      fiscalParams,
    );

    expect(extractedResult).toEqual(legacyResult);
  });
});
