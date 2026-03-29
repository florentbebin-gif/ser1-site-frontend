import type { RegimeMatrimonial } from '../../engine/civil';
import type { LienParente } from '../../engine/succession';
import type {
  SuccessionAssetPocket,
  SuccessionPersonParty,
} from './successionPatrimonialModel';

export interface PersistedHeritierRow {
  lien: LienParente;
  partSuccession: number;
}

export interface PersistedSuccessionForm {
  actifNetSuccession: number;
  heritiers: PersistedHeritierRow[];
}

export type SituationMatrimoniale =
  | 'celibataire'
  | 'marie'
  | 'pacse'
  | 'concubinage'
  | 'divorce'
  | 'veuf';

export type PacsConvention = 'separation' | 'indivision';
export type SuccessionPrimarySide = 'epoux1' | 'epoux2';
export type SuccessionDispositionTestamentaire =
  | 'legs_universel'
  | 'legs_titre_universel'
  | 'legs_particulier';
export type SuccessionDonationEntreEpouxOption =
  | 'usufruit_total'
  | 'pleine_propriete_quotite'
  | 'mixte'
  | 'pleine_propriete_totale';
export type SuccessionChoixLegalConjointSansDDV = 'usufruit' | 'quart_pp' | null;
export type SuccessionSocieteAcquetsLiquidationMode = 'quotes' | 'attribution_survivant';
export type SuccessionPreciputMode = 'global' | 'cible';
export type SuccessionInterMassClaimKind = 'recompense' | 'creance';
export type SuccessionAssetLegalNature =
  | 'non_qualifie'
  | 'propre'
  | 'propre_par_nature'
  | 'commun';
export type SuccessionAssetOrigin =
  | 'non_precise'
  | 'avant_union'
  | 'acquisition_onereuse'
  | 'donation_succession'
  | 'emploi_remploi'
  | 'clause_matrimoniale';
export type SuccessionMeubleImmeubleLegal = 'non_qualifie' | 'meuble' | 'immeuble';

export interface SuccessionCivilContext {
  situationMatrimoniale: SituationMatrimoniale;
  regimeMatrimonial: RegimeMatrimonial | null;
  pacsConvention: PacsConvention;
  dateNaissanceEpoux1?: string;
  dateNaissanceEpoux2?: string;
}

export interface SuccessionLiquidationContext {
  actifEpoux1: number;
  actifEpoux2: number;
  actifCommun: number;
  nbEnfants: number;
}

export type SuccessionBeneficiaryRef =
  | `principal:${SuccessionPrimarySide}`
  | `enfant:${string}`
  | `family:${string}`;

export interface SuccessionParticularLegacyEntry {
  id: string;
  beneficiaryRef: SuccessionBeneficiaryRef | null;
  amount: number;
  label?: string;
}

export interface SuccessionTestamentConfig {
  active: boolean;
  dispositionType: SuccessionDispositionTestamentaire | null;
  beneficiaryRef: SuccessionBeneficiaryRef | null;
  quotePartPct: number;
  particularLegacies: SuccessionParticularLegacyEntry[];
}

export interface SuccessionDevolutionContext {
  nbEnfantsNonCommuns: number;
  choixLegalConjointSansDDV: SuccessionChoixLegalConjointSansDDV;
  testamentsBySide: {
    epoux1: SuccessionTestamentConfig;
    epoux2: SuccessionTestamentConfig;
  };
  ascendantsSurvivantsBySide: {
    epoux1: boolean;
    epoux2: boolean;
  };
}

export interface SuccessionDevolutionContextInput
  extends Partial<Omit<SuccessionDevolutionContext, 'testamentsBySide' | 'ascendantsSurvivantsBySide'>> {
  testamentsBySide?: {
    epoux1?: Partial<SuccessionTestamentConfig>;
    epoux2?: Partial<SuccessionTestamentConfig>;
  };
  ascendantsSurvivantsBySide?: Partial<SuccessionDevolutionContext['ascendantsSurvivantsBySide']>;
}

export interface SuccessionSocieteAcquetsConfig {
  active: boolean;
  liquidationMode: SuccessionSocieteAcquetsLiquidationMode;
  quoteEpoux1Pct: number;
  quoteEpoux2Pct: number;
  attributionSurvivantPct: number;
}

export interface SuccessionParticipationAcquetsConfig {
  active: boolean;
  useCurrentAssetsAsFinalPatrimony: boolean;
  patrimoineOriginaireEpoux1: number;
  patrimoineOriginaireEpoux2: number;
  patrimoineFinalEpoux1: number;
  patrimoineFinalEpoux2: number;
  quoteEpoux1Pct: number;
  quoteEpoux2Pct: number;
}

export interface SuccessionPreciputSelection {
  id: string;
  sourceType: 'asset' | 'groupement_foncier';
  sourceId: string;
  labelSnapshot: string;
  pocket: SuccessionAssetPocket;
  amount: number;
  enabled: boolean;
}

export interface SuccessionInterMassClaim {
  id: string;
  kind: SuccessionInterMassClaimKind;
  fromPocket: SuccessionAssetPocket;
  toPocket: SuccessionAssetPocket;
  amount: number;
  enabled: boolean;
  label?: string;
}

export interface SuccessionPatrimonialContext {
  donationsRapportables: number;
  donationsHorsPart: number;
  legsParticuliers: number;
  donationEntreEpouxActive: boolean;
  donationEntreEpouxOption: SuccessionDonationEntreEpouxOption;
  stipulationContraireCU: boolean;
  societeAcquets: SuccessionSocieteAcquetsConfig;
  participationAcquets: SuccessionParticipationAcquetsConfig;
  preciputMode: SuccessionPreciputMode;
  preciputSelections: SuccessionPreciputSelection[];
  interMassClaims: SuccessionInterMassClaim[];
  preciputMontant: number;
  attributionIntegrale: boolean;
  attributionBiensCommunsPct: number;
  forfaitMobilierMode: 'off' | 'auto' | 'pct' | 'montant';
  forfaitMobilierPct: number;
  forfaitMobilierMontant: number;
  abattementResidencePrincipale: boolean;
  decesDansXAns: 0 | 5 | 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50;
}

export type SuccessionDonationEntryType = 'rapportable' | 'hors_part' | 'legs_particulier';

export interface SuccessionDonationEntry {
  id: string;
  type: SuccessionDonationEntryType;
  montant: number;
  date?: string;
  donateur?: string;
  donataire?: string;
  valeurDonation?: number;
  valeurActuelle?: number;
  donSommeArgentExonere?: boolean;
  avecReserveUsufruit?: boolean;
}

export type SuccessionAssetCategory =
  | 'immobilier'
  | 'financier'
  | 'professionnel'
  | 'divers'
  | 'passif';

export interface SuccessionAssetDetailEntry {
  id: string;
  pocket: SuccessionAssetPocket;
  category: SuccessionAssetCategory;
  subCategory: string;
  amount: number;
  label?: string;
  legalNature?: SuccessionAssetLegalNature;
  origin?: SuccessionAssetOrigin;
  meubleImmeubleLegal?: SuccessionMeubleImmeubleLegal;
  quotePartEpoux1Pct?: number;
}

export type SuccessionAssuranceVieContractType = 'standard' | 'demembree' | 'personnalisee';

export interface SuccessionAssuranceVieEntry {
  id: string;
  typeContrat: SuccessionAssuranceVieContractType;
  souscripteur: SuccessionPersonParty;
  assure: SuccessionPersonParty;
  clauseBeneficiaire?: string;
  capitauxDeces: number;
  versementsApres70: number;
  versementsAvant13101998?: number;
  ageUsufruitier?: number;
}

export interface SuccessionPerEntry {
  id: string;
  typeContrat: SuccessionAssuranceVieContractType;
  assure: SuccessionPersonParty;
  clauseBeneficiaire?: string;
  capitauxDeces: number;
  ageUsufruitier?: number;
}

export type GroupementFoncierType = 'GFA' | 'GFV' | 'GFF' | 'GF';

export interface SuccessionGroupementFoncierEntry {
  id: string;
  type: GroupementFoncierType;
  label?: string;
  valeurTotale: number;
  pocket: SuccessionAssetPocket;
  quotePartEpoux1Pct?: number;
}

export interface SuccessionPrevoyanceDecesEntry {
  id: string;
  souscripteur: SuccessionPersonParty;
  assure: SuccessionPersonParty;
  capitalDeces: number;
  dernierePrime: number;
  clauseBeneficiaire?: string;
}

export type SuccessionEnfantRattachement = 'commun' | 'epoux1' | 'epoux2';

export interface SuccessionEnfant {
  id: string;
  prenom?: string;
  rattachement: SuccessionEnfantRattachement;
  deceased?: boolean;
}

export type FamilyMemberType =
  | 'petit_enfant'
  | 'parent'
  | 'frere_soeur'
  | 'oncle_tante'
  | 'tierce_personne';

export type FamilyBranch = SuccessionPrimarySide;

export interface FamilyMember {
  id: string;
  type: FamilyMemberType;
  branch?: FamilyBranch;
  parentEnfantId?: string;
}

export interface ParsedSuccessionDraftPayload {
  form: PersistedSuccessionForm;
  civil: SuccessionCivilContext;
  liquidation: SuccessionLiquidationContext;
  devolution: SuccessionDevolutionContext;
  patrimonial: SuccessionPatrimonialContext;
  enfants: SuccessionEnfant[];
  familyMembers: FamilyMember[];
  donations: SuccessionDonationEntry[];
  assetEntries: SuccessionAssetDetailEntry[];
  assuranceVieEntries: SuccessionAssuranceVieEntry[];
  perEntries: SuccessionPerEntry[];
  groupementFoncierEntries: SuccessionGroupementFoncierEntry[];
  prevoyanceDecesEntries: SuccessionPrevoyanceDecesEntry[];
  ui: {
    chainOrder: SuccessionPrimarySide;
  };
}

export interface SuccessionDraftPayloadV18 extends ParsedSuccessionDraftPayload {
  version: 18;
}

export interface SuccessionDraftPayloadV19 extends ParsedSuccessionDraftPayload {
  version: 19;
}

export interface SuccessionDraftPayloadV20 extends ParsedSuccessionDraftPayload {
  version: 20;
}

export interface SuccessionDraftPayloadV21 extends ParsedSuccessionDraftPayload {
  version: 21;
}

export interface SuccessionDraftPayloadV22 extends ParsedSuccessionDraftPayload {
  version: 22;
}

export interface SuccessionDraftPayloadV23 extends ParsedSuccessionDraftPayload {
  version: 23;
}

export interface SuccessionDraftPayloadV24 extends ParsedSuccessionDraftPayload {
  version: 24;
}

export interface SuccessionDraftPayloadV25 extends ParsedSuccessionDraftPayload {
  version: 25;
}

export interface SuccessionDraftPayloadV26 extends ParsedSuccessionDraftPayload {
  version: 26;
}

export interface SuccessionDraftPayloadV27 extends ParsedSuccessionDraftPayload {
  version: 27;
}
