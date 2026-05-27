import type {
  LogoPlacement,
  SuccessionAnnexStep,
  SuccessionAssetAnnexSlideSpec,
  SuccessionFamilyContextSlideSpec,
} from '@/pptx/theme/types';

export interface SuccessionChronologieBeneficiary {
  label: string;
  brut: number;
  droits: number;
  net: number;
  capitauxDecesNets?: number;
  droitsAssuranceVie990I?: number;
  droitsSuccession?: number;
  transmissionNetteSuccession?: number;
  exonerated?: boolean;
}

export interface SuccessionChronologieStep {
  actifTransmis: number;
  assuranceVieTransmise?: number;
  perTransmis?: number;
  prevoyanceTransmise?: number;
  masseTotaleTransmise?: number;
  droitsAssuranceVie?: number;
  droitsPer?: number;
  droitsPrevoyance?: number;
  partConjoint: number;
  partEnfants: number;
  droitsEnfants: number;
  beneficiaries?: SuccessionChronologieBeneficiary[];
}

export interface SuccessionData {
  actifNetSuccession: number;
  totalDroits: number;
  tauxMoyenGlobal: number;
  heritiers: Array<{
    lien: string;
    partBrute: number;
    abattement: number;
    baseImposable: number;
    droits: number;
    tauxMoyen: number;
  }>;
  predecesChronologie?: {
    applicable: boolean;
    order: 'epoux1' | 'epoux2';
    firstDecedeLabel: string;
    secondDecedeLabel: string;
    step1: SuccessionChronologieStep | null;
    step2: SuccessionChronologieStep | null;
    societeAcquets?: {
      configured: boolean;
      totalValue: number;
      firstEstateContribution: number;
      survivorShare: number;
      preciputAmount: number;
      survivorAttributionAmount: number;
      liquidationMode: 'quotes' | 'attribution_survivant';
      deceasedQuotePct: number;
      survivorQuotePct: number;
      attributionIntegrale: boolean;
    } | null;
    participationAcquets?: {
      configured: boolean;
      active: boolean;
      useCurrentAssetsAsFinalPatrimony: boolean;
      patrimoineOriginaireEpoux1: number;
      patrimoineOriginaireEpoux2: number;
      patrimoineFinalEpoux1: number;
      patrimoineFinalEpoux2: number;
      acquetsEpoux1: number;
      acquetsEpoux2: number;
      creditor: 'epoux1' | 'epoux2' | null;
      debtor: 'epoux1' | 'epoux2' | null;
      quoteAppliedPct: number;
      creanceAmount: number;
      firstEstateAdjustment: number;
    } | null;
    interMassClaims?: {
      configured: boolean;
      totalRequestedAmount: number;
      totalAppliedAmount: number;
      claims: Array<{
        id: string;
        kind: 'recompense' | 'creance';
        label?: string;
        fromPocket:
          | 'epoux1'
          | 'epoux2'
          | 'communaute'
          | 'societe_acquets'
          | 'indivision_pacse'
          | 'indivision_concubinage'
          | 'indivision_separatiste';
        toPocket:
          | 'epoux1'
          | 'epoux2'
          | 'communaute'
          | 'societe_acquets'
          | 'indivision_pacse'
          | 'indivision_concubinage'
          | 'indivision_separatiste';
        requestedAmount: number;
        appliedAmount: number;
      }>;
    } | null;
    affectedLiabilities?: {
      totalAmount: number;
      byPocket: Array<{
        pocket:
          | 'epoux1'
          | 'epoux2'
          | 'communaute'
          | 'societe_acquets'
          | 'indivision_pacse'
          | 'indivision_concubinage'
          | 'indivision_separatiste';
        amount: number;
      }>;
    } | null;
    preciput?: {
      mode: 'global' | 'cible' | 'none';
      requestedAmount: number;
      appliedAmount: number;
      usesGlobalFallback: boolean;
      selections: Array<{
        id: string;
        label: string;
        requestedAmount: number;
        appliedAmount: number;
      }>;
    } | null;
    assuranceVieTotale?: number;
    perTotale?: number;
    prevoyanceTotale?: number;
    totalDroits: number;
    warnings?: string[];
  };
  annexBeneficiarySteps?: SuccessionAnnexStep[];
  assetAnnex?: Omit<SuccessionAssetAnnexSlideSpec, 'type' | 'title' | 'subtitle'>;
  familyContext?: Omit<SuccessionFamilyContextSlideSpec, 'type' | 'title' | 'subtitle'>;
  assumptions?: string[];
  clientName?: string;
}

export interface AdvisorInfo {
  name?: string;
  title?: string;
  office?: string;
}

export interface UiSettingsForPptx {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  c6: string;
  c7: string;
  c8: string;
  c9: string;
  c10: string;
}

export type { LogoPlacement };
