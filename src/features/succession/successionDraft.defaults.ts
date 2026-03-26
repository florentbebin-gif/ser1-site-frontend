import type {
  FamilyMember,
  SuccessionAssetDetailEntry,
  SuccessionAssuranceVieEntry,
  SuccessionCivilContext,
  SuccessionDevolutionContext,
  SuccessionDonationEntry,
  SuccessionEnfant,
  SuccessionLiquidationContext,
  SuccessionPerEntry,
  SuccessionParticipationAcquetsConfig,
  SuccessionPatrimonialContext,
  SuccessionSocieteAcquetsConfig,
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

export const DEFAULT_SUCCESSION_SOCIETE_ACQUETS_CONFIG: SuccessionSocieteAcquetsConfig = {
  active: false,
  liquidationMode: 'quotes',
  quoteEpoux1Pct: 50,
  quoteEpoux2Pct: 50,
  attributionSurvivantPct: 0,
};

export const DEFAULT_SUCCESSION_PARTICIPATION_ACQUETS_CONFIG: SuccessionParticipationAcquetsConfig = {
  active: false,
  useCurrentAssetsAsFinalPatrimony: true,
  patrimoineOriginaireEpoux1: 0,
  patrimoineOriginaireEpoux2: 0,
  patrimoineFinalEpoux1: 0,
  patrimoineFinalEpoux2: 0,
  quoteEpoux1Pct: 50,
  quoteEpoux2Pct: 50,
};

export const DEFAULT_SUCCESSION_PATRIMONIAL_CONTEXT: SuccessionPatrimonialContext = {
  donationsRapportables: 0,
  donationsHorsPart: 0,
  legsParticuliers: 0,
  donationEntreEpouxActive: false,
  donationEntreEpouxOption: 'usufruit_total',
  stipulationContraireCU: false,
  societeAcquets: { ...DEFAULT_SUCCESSION_SOCIETE_ACQUETS_CONFIG },
  participationAcquets: { ...DEFAULT_SUCCESSION_PARTICIPATION_ACQUETS_CONFIG },
  preciputMode: 'global',
  preciputSelections: [],
  interMassClaims: [],
  preciputMontant: 0,
  attributionIntegrale: false,
  attributionBiensCommunsPct: 50,
  forfaitMobilierMode: 'off',
  forfaitMobilierPct: 5,
  forfaitMobilierMontant: 0,
  abattementResidencePrincipale: false,
  decesDansXAns: 0,
};

export const DEFAULT_SUCCESSION_ENFANTS_CONTEXT: SuccessionEnfant[] = [];
export const DEFAULT_SUCCESSION_DONATIONS: SuccessionDonationEntry[] = [];
export const DEFAULT_SUCCESSION_ASSET_DETAILS: SuccessionAssetDetailEntry[] = [];
export const DEFAULT_SUCCESSION_ASSURANCE_VIE: SuccessionAssuranceVieEntry[] = [];
export const DEFAULT_SUCCESSION_PER: SuccessionPerEntry[] = [];
export const DEFAULT_SUCCESSION_FAMILY_MEMBERS: FamilyMember[] = [];
