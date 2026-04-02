import type { DmtgSettings } from '../../engine/civil';
import type { LienParente } from '../../engine/succession';
import type {
  FamilyMember,
  SuccessionAssetPocket,
  SuccessionAssetDetailEntry,
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDonationEntry,
  SuccessionEnfant,
  SuccessionGroupementFoncierEntry,
  SuccessionLiquidationContext,
  SuccessionPatrimonialContext,
} from './successionDraft';
import type { SuccessionFiscalSnapshot } from './successionFiscalContext';
import type { SuccessionParticipationAcquetsSummary } from './successionParticipationAcquets';
import type {
  SuccessionAffectedLiabilitySummary,
  SuccessionInterMassClaimsSummary,
} from './successionInterMassClaims';
import type { SuccessionAssetTransmissionBasis } from './successionTransmissionBasis';

export type SuccessionChainOrder = 'epoux1' | 'epoux2';
export type SuccessionChainRegime = 'communaute_legale' | 'separation_biens' | 'communaute_universelle';

export interface SuccessionChainStep {
  actifTransmis: number;
  partConjoint: number;
  partEnfants: number;
  droitsConjoint: number;
  droitsEnfants: number;
  beneficiaries: SuccessionChainBeneficiary[];
}

export interface SuccessionChainSocieteAcquetsSummary {
  configured: boolean;
  totalValue: number;
  firstEstateContribution: number;
  survivorShare: number;
  preciputAmount: number;
  survivorAttributionAmount: number;
  liquidationMode: SuccessionPatrimonialContext['societeAcquets']['liquidationMode'];
  deceasedQuotePct: number;
  survivorQuotePct: number;
  attributionIntegrale: boolean;
}

export interface SuccessionChainPreciputSelectionSummary {
  id: string;
  sourceType: 'asset' | 'groupement_foncier';
  sourceId: string;
  label: string;
  pocket: SuccessionAssetPocket;
  requestedAmount: number;
  appliedAmount: number;
}

export interface SuccessionChainPreciputSummary {
  mode: 'global' | 'cible' | 'none';
  pocket: SuccessionAssetPocket | null;
  requestedAmount: number;
  appliedAmount: number;
  usesGlobalFallback: boolean;
  selections: SuccessionChainPreciputSelectionSummary[];
}

export interface SuccessionChainInterMassClaimSummary {
  configured: boolean;
  totalRequestedAmount: number;
  totalAppliedAmount: number;
  claims: Array<{
    id: string;
    kind: 'recompense' | 'creance';
    label?: string;
    fromPocket: SuccessionAssetPocket;
    toPocket: SuccessionAssetPocket;
    requestedAmount: number;
    appliedAmount: number;
  }>;
}

export interface SuccessionChainAffectedLiabilitySummary {
  totalAmount: number;
  byPocket: Array<{
    pocket: SuccessionAssetPocket;
    amount: number;
  }>;
}

export interface SuccessionChainBeneficiary {
  id: string;
  label: string;
  lien: LienParente;
  brut: number;
  droits: number;
  net: number;
  exonerated?: boolean;
}

export interface SuccessionChainageAnalysis {
  applicable: boolean;
  order: SuccessionChainOrder;
  firstDecedeLabel: string;
  secondDecedeLabel: string;
  step1: SuccessionChainStep | null;
  step2: SuccessionChainStep | null;
  societeAcquets: SuccessionChainSocieteAcquetsSummary | null;
  participationAcquets: SuccessionParticipationAcquetsSummary | null;
  preciput: SuccessionChainPreciputSummary | null;
  interMassClaims: SuccessionChainInterMassClaimSummary | null;
  affectedLiabilities: SuccessionChainAffectedLiabilitySummary | null;
  totalDroits: number;
  warnings: string[];
}

export interface SuccessionChainageInput {
  civil: SuccessionCivilContext;
  liquidation: SuccessionLiquidationContext;
  regimeUsed: SuccessionChainRegime | null;
  order: SuccessionChainOrder;
  dmtgSettings: DmtgSettings;
  survivorEconomicInflows?: Record<'epoux1' | 'epoux2', number>;
  attributionBiensCommunsPct?: number;
  patrimonial?: Partial<Pick<
    SuccessionPatrimonialContext,
    | 'attributionIntegrale'
    | 'donationEntreEpouxActive'
    | 'donationEntreEpouxOption'
    | 'stipulationContraireCU'
    | 'preciputMode'
    | 'preciputSelections'
    | 'preciputMontant'
    | 'participationAcquets'
    | 'societeAcquets'
    | 'interMassClaims'
  >>;
  societeAcquetsNetValue?: number;
  assetEntries?: SuccessionAssetDetailEntry[];
  groupementFoncierEntries?: SuccessionGroupementFoncierEntry[];
  transmissionBasis?: SuccessionAssetTransmissionBasis;
  interMassClaimsSummary?: SuccessionInterMassClaimsSummary | null;
  affectedLiabilitySummary?: SuccessionAffectedLiabilitySummary | null;
  abattementResidencePrincipale?: boolean;
  forfaitMobilierMode?: SuccessionPatrimonialContext['forfaitMobilierMode'];
  forfaitMobilierPct?: number;
  forfaitMobilierMontant?: number;
  enfantsContext?: SuccessionEnfant[];
  familyMembers?: FamilyMember[];
  devolution?: Pick<SuccessionDevolutionContext, 'testamentsBySide'>;
  referenceDate?: Date;
  donations?: SuccessionDonationEntry[];
  donationSettings?: SuccessionFiscalSnapshot['donation'];
}

export interface SuccessionChainStepComputation {
  transmission: { droits: number; beneficiaries: SuccessionChainBeneficiary[] };
  partConjoint: number;
  partAutresBeneficiaires: number;
  carryOverToStep2: number;
  warnings: string[];
}
