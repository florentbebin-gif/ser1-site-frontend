/**
 * Placement defaults and normalizers.
 */

import type { EpargneRow } from '@/engine/placement/types';
import {
  DEFAULT_VERSEMENT_CONFIG,
  normalizeVersementConfig,
  type VersementConfig,
  type VersementConfigInput,
} from '@/engine/placement/versementConfig';
import { formatDmtgRange, formatPercent } from './formatters';

export interface PlacementProductLiquidationState {
  optionBaremeIR?: boolean;
}

export interface PlacementProductDraft extends Record<string, unknown> {
  versementConfig: VersementConfig;
  envelope: string;
  dureeEpargne: number;
  perBancaire: boolean;
  optionBaremeIR: boolean;
  fraisGestion: number;
  rendementLiquidationOverride: number | null;
  liquidation?: PlacementProductLiquidationState;
}

export interface PlacementClient {
  ageActuel: number;
  tmiEpargne: number;
  tmiRetraite: number;
  situation: string;
}

export interface PlacementLiquidationState {
  mode: string;
  duree: number;
  mensualiteCible: number;
  montantUnique: number;
  optionBaremeIR: boolean;
}

export interface PlacementTransmissionState {
  ageAuDeces: number;
  nbBeneficiaires: number;
  dmtgTaux: number | null;
  beneficiaryType: string;
}

export type PlacementStep = 'epargne' | 'liquidation' | 'transmission' | 'synthese';

export interface PlacementSimulatorState {
  step: PlacementStep;
  client: PlacementClient;
  products: PlacementProductDraft[];
  liquidation: PlacementLiquidationState;
  transmission: PlacementTransmissionState;
}

export interface DmtgScaleItem {
  from?: number | null;
  to?: number | null;
  rate?: number | null;
}

export interface DmtgOption {
  value: number;
  label: string;
  rangeFrom: number;
  rangeTo: number | null;
  key: string;
}

export type EpargneRowWithReinvest = EpargneRow & {
  cumulReinvestissement: number;
};

export const EPSILON = 1e-6;

export const DEFAULT_PRODUCT: PlacementProductDraft = {
  envelope: 'AV',
  dureeEpargne: 20,
  perBancaire: false,
  optionBaremeIR: false,
  fraisGestion: 0.01,
  rendementLiquidationOverride: null,
  versementConfig: normalizeVersementConfig(DEFAULT_VERSEMENT_CONFIG),
};

export const DEFAULT_CLIENT: PlacementClient = {
  ageActuel: 45,
  tmiEpargne: 0.30,
  tmiRetraite: 0.11,
  situation: 'single',
};

export const DEFAULT_LIQUIDATION: PlacementLiquidationState = {
  mode: 'epuiser',
  duree: 25,
  mensualiteCible: 500,
  montantUnique: 50000,
  optionBaremeIR: false,
};

export const DEFAULT_DMTG_RATE = 0.20;

export const DEFAULT_TRANSMISSION: PlacementTransmissionState = {
  ageAuDeces: 85,
  nbBeneficiaires: 2,
  dmtgTaux: null,
  beneficiaryType: 'enfants',
};

export const BENEFICIARY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'conjoint', label: 'Conjoint / partenaire PACS' },
  { value: 'enfants', label: 'Enfant(s)' },
];

export function normalizeProduct(
  product: Partial<PlacementProductDraft> = {},
): PlacementProductDraft {
  return {
    ...DEFAULT_PRODUCT,
    ...product,
    versementConfig: normalizeVersementConfig(
      (product.versementConfig as VersementConfigInput | VersementConfig | undefined) ||
        DEFAULT_VERSEMENT_CONFIG,
    ),
  };
}

export function sanitizeStep(step: unknown): PlacementStep {
  const allowed = new Set<PlacementStep>(['epargne', 'liquidation', 'transmission', 'synthese']);
  return typeof step === 'string' && allowed.has(step as PlacementStep) ? (step as PlacementStep) : 'epargne';
}

export function normalizeLoadedState(
  payload: Partial<PlacementSimulatorState> & Record<string, unknown> = {},
): PlacementSimulatorState {
  const products = Array.isArray(payload.products) ? payload.products : [];
  const product1 = normalizeProduct((products[0] as Partial<PlacementProductDraft>) || {});
  const product2 = normalizeProduct((products[1] as Partial<PlacementProductDraft>) || {});

  return {
    step: sanitizeStep(payload.step),
    client: { ...DEFAULT_CLIENT, ...(payload.client || {}) },
    products: [product1, product2],
    liquidation: { ...DEFAULT_LIQUIDATION, ...(payload.liquidation || {}) },
    transmission: { ...DEFAULT_TRANSMISSION, ...(payload.transmission || {}) },
  };
}

export function buildPersistedState(state: PlacementSimulatorState): PlacementSimulatorState {
  return {
    step: state.step,
    client: state.client,
    products: state.products,
    liquidation: state.liquidation,
    transmission: state.transmission,
  };
}

export function getRendementLiquidation(
  product: Pick<
    PlacementProductDraft,
    'envelope' | 'rendementLiquidationOverride' | 'versementConfig'
  > | null | undefined,
): number | null {
  if (!product || product.envelope === 'SCPI') return null;
  const override = product.rendementLiquidationOverride;
  if (typeof override === 'number') return override;
  return product.versementConfig?.capitalisation?.rendementAnnuel ?? 0.03;
}

export function buildDmtgOptions(scale: DmtgScaleItem[] | null | undefined): DmtgOption[] {
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

export function buildCustomDmtgOption(value: number): DmtgOption {
  return {
    value,
    label: `Personnalisé (${formatPercent(value)})`,
    rangeFrom: 0,
    rangeTo: null,
    key: 'dmtg-custom',
  };
}

export const DEFAULT_STATE: PlacementSimulatorState = {
  step: 'epargne',
  client: DEFAULT_CLIENT,
  products: [
    normalizeProduct({ envelope: 'AV' }),
    normalizeProduct({ envelope: 'PER' }),
  ],
  liquidation: DEFAULT_LIQUIDATION,
  transmission: DEFAULT_TRANSMISSION,
};

export function withReinvestCumul(rows: EpargneRow[] = []): EpargneRowWithReinvest[] {
  let cumul = 0;
  return rows.map((row) => {
    const montant = row.reinvestissementDistribNetAnnee ?? 0;
    cumul += montant;
    return { ...row, cumulReinvestissement: cumul };
  });
}
