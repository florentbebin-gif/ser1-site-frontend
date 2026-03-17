import type {
  FamilyMember,
  SuccessionAssetDetailEntry,
  SuccessionAssuranceVieEntry,
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDonationEntry,
  SuccessionEnfant,
  SuccessionLiquidationContext,
  SuccessionPatrimonialContext,
  SuccessionTestamentConfig,
} from './successionDraft.types';

export const DEFAULT_SUCCESSION_CIVIL_CONTEXT: SuccessionCivilContext = {
  situationMatrimoniale: 'celibataire',
  regimeMatrimonial: null,
  pacsConvention: 'separation',
  dateNaissanceEpoux1: undefined,
  dateNaissanceEpoux2: undefined,
};

export const DEFAULT_SUCCESSION_LIQUIDATION_CONTEXT: SuccessionLiquidationContext = {
  actifEpoux1: 0,
  actifEpoux2: 0,
  actifCommun: 0,
  nbEnfants: 0,
};

export const DEFAULT_SUCCESSION_TESTAMENT_CONFIG: SuccessionTestamentConfig = {
  active: false,
  dispositionType: null,
  beneficiaryRef: null,
  quotePartPct: 50,
  particularLegacies: [],
};

export const DEFAULT_SUCCESSION_DEVOLUTION_CONTEXT: SuccessionDevolutionContext = {
  nbEnfantsNonCommuns: 0,
  choixLegalConjointSansDDV: null,
  testamentsBySide: {
    epoux1: { ...DEFAULT_SUCCESSION_TESTAMENT_CONFIG, particularLegacies: [] },
    epoux2: { ...DEFAULT_SUCCESSION_TESTAMENT_CONFIG, particularLegacies: [] },
  },
  ascendantsSurvivantsBySide: {
    epoux1: false,
    epoux2: false,
  },
};

export const DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT: SuccessionPatrimonialContext = {
  donationsRapportables: 0,
  donationsHorsPart: 0,
  legsParticuliers: 0,
  donationEntreEpouxActive: false,
  donationEntreEpouxOption: 'usufruit_total',
  preciputMontant: 0,
  attributionIntegrale: false,
  attributionBiensCommunsPct: 50,
  forfaitMobilierMode: 'auto',
  forfaitMobilierPct: 5,
  forfaitMobilierMontant: 0,
  abattementResidencePrincipale: false,
  ageDecesManuel: null,
};

export const DEFAULT_SUCCESSION_ENFANTS_CONTEXT: SuccessionEnfant[] = [];
export const DEFAULT_SUCCESSION_DONATIONS: SuccessionDonationEntry[] = [];
export const DEFAULT_SUCCESSION_ASSET_DETAILS: SuccessionAssetDetailEntry[] = [];
export const DEFAULT_SUCCESSION_ASSURANCE_VIE: SuccessionAssuranceVieEntry[] = [];
export const DEFAULT_SUCCESSION_FAMILY_MEMBERS: FamilyMember[] = [];
