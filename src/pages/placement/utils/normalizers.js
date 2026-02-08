/**
 * Placement Normalizers & Constants — Valeurs par défaut et fonctions de normalisation
 */

import { DEFAULT_VERSEMENT_CONFIG, normalizeVersementConfig } from '../../../utils/versementConfig.js';
import { formatPercent, formatDmtgRange } from './formatters.js';

// ─── Constants ───────────────────────────────────────────────────────

export const EPSILON = 1e-6;

export const DEFAULT_PRODUCT = {
  envelope: 'AV',
  dureeEpargne: 20,
  perBancaire: false,
  optionBaremeIR: false,
  fraisGestion: 0.01,
  rendementLiquidationOverride: null,
  versementConfig: normalizeVersementConfig(DEFAULT_VERSEMENT_CONFIG),
};

export const DEFAULT_CLIENT = {
  ageActuel: 45,
  tmiEpargne: 0.30,
  tmiRetraite: 0.11,
  situation: 'single',
};

export const DEFAULT_LIQUIDATION = {
  mode: 'epuiser',
  duree: 25,
  mensualiteCible: 500,
  montantUnique: 50000,
  optionBaremeIR: false,
};

export const DEFAULT_DMTG_RATE = 0.20;

export const DEFAULT_TRANSMISSION = {
  ageAuDeces: 85,
  nbBeneficiaires: 2,
  dmtgTaux: null,
  beneficiaryType: 'enfants',
};

export const BENEFICIARY_OPTIONS = [
  { value: 'conjoint', label: 'Conjoint / partenaire PACS' },
  { value: 'enfants', label: 'Enfant(s)' },
];

// ─── Normalizers ─────────────────────────────────────────────────────

export function normalizeProduct(product = {}) {
  return {
    ...DEFAULT_PRODUCT,
    ...product,
    versementConfig: normalizeVersementConfig(
      product.versementConfig || DEFAULT_VERSEMENT_CONFIG
    ),
  };
}

export function sanitizeStep(step) {
  const allowed = new Set(['epargne', 'liquidation', 'transmission', 'synthese']);
  return allowed.has(step) ? step : 'epargne';
}

export function normalizeLoadedState(payload = {}) {
  const products = Array.isArray(payload.products) ? payload.products : [];
  const product1 = normalizeProduct(products[0]);
  const product2 = normalizeProduct(products[1]);

  return {
    step: sanitizeStep(payload.step),
    client: { ...DEFAULT_CLIENT, ...(payload.client || {}) },
    products: [product1, product2],
    liquidation: { ...DEFAULT_LIQUIDATION, ...(payload.liquidation || {}) },
    transmission: { ...DEFAULT_TRANSMISSION, ...(payload.transmission || {}) },
  };
}

export function buildPersistedState(state) {
  return {
    step: state.step,
    client: state.client,
    products: state.products,
    liquidation: state.liquidation,
    transmission: state.transmission,
  };
}

export function getRendementLiquidation(product) {
  if (!product || product.envelope === 'SCPI') return null;
  const override = product.rendementLiquidationOverride;
  if (typeof override === 'number') return override;
  return product.versementConfig?.capitalisation?.rendementAnnuel ?? 0.03;
}

// ─── DMTG builders ───────────────────────────────────────────────────

export function buildDmtgOptions(scale) {
  if (!Array.isArray(scale) || !scale.length) {
    return [
      {
        value: DEFAULT_DMTG_RATE,
        label: `${formatPercent(DEFAULT_DMTG_RATE)} (par défaut)`,
        rangeFrom: 0,
        rangeTo: null,
        key: 'dmtg-default',
      },
    ];
  }

  return [...scale]
    .sort((a, b) => (a?.rate ?? 0) - (b?.rate ?? 0))
    .map((tranche, idx) => {
      const rateValue = (tranche?.rate ?? 0) / 100;
      return {
        value: rateValue,
        label: `${formatPercent(rateValue)} (${formatDmtgRange(tranche?.from, tranche?.to)})`,
        rangeFrom: typeof tranche?.from === 'number' ? tranche.from : 0,
        rangeTo: typeof tranche?.to === 'number' ? tranche.to : null,
        key: `dmtg-${idx}-${rateValue}`,
      };
    });
}

export function buildCustomDmtgOption(value) {
  return {
    value,
    label: `Personnalisé (${formatPercent(value)})`,
    rangeFrom: 0,
    rangeTo: null,
    key: 'dmtg-custom',
  };
}

// ─── Default state ───────────────────────────────────────────────────

export const DEFAULT_STATE = {
  step: 'epargne',
  client: DEFAULT_CLIENT,
  products: [
    normalizeProduct({ envelope: 'AV' }),
    normalizeProduct({ envelope: 'PER' }),
  ],
  liquidation: DEFAULT_LIQUIDATION,
  transmission: DEFAULT_TRANSMISSION,
};

// ─── withReinvestCumul ───────────────────────────────────────────────

export function withReinvestCumul(rows = []) {
  let cumul = 0;
  return rows.map((row) => {
    const montant = row.reinvestissementDistribNetAnnee ?? 0;
    cumul += montant;
    return { ...row, cumulReinvestissement: cumul };
  });
}
