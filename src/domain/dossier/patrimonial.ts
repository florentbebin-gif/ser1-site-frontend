import type {
  AuditAvatarAppearance,
  AuditAvatarKind,
  AvantageMatrimonial,
  CaisseRetraite,
  DdvOption,
  NatureActivite,
  NiveauScolaire,
  ObjectifClient,
  ProcheLien,
  ProcheRattachementBranche,
  ProfessionCsp,
  RenonciationPortee,
  StatutConventionnel,
  StatutSocial,
  TypeAdoption,
} from '@/domain/audit/types';
import type { SourceRef } from './types';

export type DossierPatrimonialStatus = 'draft' | 'active' | 'archived';

export type DossierCompletionStatus = 'empty' | 'partial' | 'complete';

export type DossierRequiredField = 'membre_principal' | 'objectifs_prioritaires';

export type DossierMembreRole = 'client' | 'conjoint' | 'enfant' | 'autre';

export type DossierSituationFamilialeStatut =
  | 'marie'
  | 'pacse'
  | 'concubinage'
  | 'celibataire'
  | 'divorce'
  | 'veuf';

export type DossierRegimeMatrimonialCode =
  | 'communaute_legale'
  | 'communaute_universelle'
  | 'separation_biens'
  | 'participation_acquets'
  | 'communaute_meubles_acquets'
  | 'separation_biens_societe_acquets';

export type DossierDonationType =
  | 'donation_partage'
  | 'donation_simple'
  | 'donation_temporaire_usufruit';

export type DossierContraintePriority = 'haute' | 'moyenne' | 'basse';

export type DossierOperationStatus = 'planned' | 'in_progress' | 'done' | 'cancelled';

export interface DossierFoyer {
  id: string;
  label: string;
  situationFamiliale: DossierSituationFamilialeStatut;
  membrePrincipalId: string | null;
  conjointId: string | null;
  enfantIds: string[];
  procheIds: string[];
}

export interface DossierMembre {
  id: string;
  role: DossierMembreRole;
  prenom: string;
  nom?: string;
  dateNaissance?: string;
  civilite?: 'monsieur' | 'madame';
  nomNaissance?: string;
  lieuNaissance?: string;
  departementNaissance?: string;
  communeNaissance?: string;
  paysNaissance?: string;
  nationalite?: string;
  handicap?: boolean;
  profession?: string;
  csp?: ProfessionCsp;
  natureActivite?: NatureActivite;
  statutSocial?: StatutSocial;
  caisseRetraite?: CaisseRetraite;
  statutConventionnel?: StatutConventionnel;
  tauxPriseEnChargeCpam?: number;
  lienParente?: ProcheLien;
  decede?: boolean;
  fiscalementACharge?: boolean;
  ageLimiteCharge?: number;
  anneesSupplementairesCharge?: number;
  niveauScolaire?: NiveauScolaire;
  gardeAlternee?: boolean;
  adopte?: boolean;
  typeAdoption?: TypeAdoption;
  renoncantSuccession?: boolean;
  renonciationPortee?: RenonciationPortee;
  avatarKind?: AuditAvatarKind;
  avatarAppearance?: AuditAvatarAppearance;
  parentPrincipal?: 'client' | 'conjoint';
  estCommun?: boolean;
  // Identité audit-side stable (round-trip enfants/proches : EnfantInfo.id / ProcheInfo.id)
  localId?: string;
  // Proche non-enfant (role 'autre')
  parentEnfantId?: string;
  rattachementBranche?: ProcheRattachementBranche;
  vivantSousMemeToit?: boolean;
  sourceRefIds: string[];
}

export interface DossierSituationFamiliale {
  statut: DossierSituationFamilialeStatut;
  dateUnion?: string;
  lieuUnion?: string;
  impositionSepareeAnneeUnion?: boolean;
  nonResidentFiscal?: boolean;
  dureeMariagesPrecedents?: number;
  nombreEnfants: number;
}

export interface DossierRegimeMatrimonial {
  regime?: DossierRegimeMatrimonialCode;
  contratMariage: boolean;
  dateContrat?: string;
  notaire?: string;
  donationDernierVivantMr?: boolean;
  donationDernierVivantMme?: boolean;
  ddvOptionMr?: DdvOption;
  ddvOptionMme?: DdvOption;
  avantagesMatrimoniaux?: AvantageMatrimonial[];
  sourceRefIds: string[];
}

export interface DossierDonationSynthetique {
  id: string;
  type: DossierDonationType;
  date: string;
  montant?: number;
  beneficiaireLabel: string;
  description?: string;
  sourceRefIds: string[];
}

export interface DossierObjectif {
  id: string;
  code: ObjectifClient | string;
  label: string;
  priority: number;
  sourceRefIds: string[];
}

export interface DossierContrainte {
  id: string;
  label: string;
  description?: string;
  priority: DossierContraintePriority;
  sourceRefIds: string[];
}

export interface DossierOperationPrevue {
  id: string;
  label: string;
  description?: string;
  horizon?: string;
  status: DossierOperationStatus;
  sourceRefIds: string[];
}

export interface DossierCompletion {
  scope: 'f1_core';
  status: DossierCompletionStatus;
  missingRequiredFields: DossierRequiredField[];
  updatedAt: string | null;
}

export interface DossierPatrimonial {
  id: string;
  ownerUserId: string | null;
  status: DossierPatrimonialStatus;
  foyer: DossierFoyer;
  membres: DossierMembre[];
  situationFamiliale: DossierSituationFamiliale;
  regimeMatrimonial: DossierRegimeMatrimonial | null;
  donationsSynthetiques: DossierDonationSynthetique[];
  objectifs: DossierObjectif[];
  contraintes: DossierContrainte[];
  operationsPrevues: DossierOperationPrevue[];
  sourceRefs: SourceRef[];
  completion: DossierCompletion;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ClockOptions {
  now?: string;
}

interface CreateDossierOptions extends ClockOptions {
  id?: string;
  ownerUserId?: string | null;
}

interface EvaluateCompletionOptions extends ClockOptions {}

export const DOSSIER_PATRIMONIAL_COMPLETION_LABELS: Record<DossierCompletionStatus, string> = {
  empty: 'à compléter',
  partial: 'partiel',
  complete: 'complet',
};

export function createEmptyDossierPatrimonial(
  options: CreateDossierOptions = {},
): DossierPatrimonial {
  const id = options.id ?? createGeneratedId();
  const now = options.now ?? new Date().toISOString();

  const dossier: DossierPatrimonial = {
    id,
    ownerUserId: options.ownerUserId ?? null,
    status: 'draft',
    foyer: {
      id: `foyer-${id}`,
      label: 'Foyer patrimonial',
      situationFamiliale: 'celibataire',
      membrePrincipalId: null,
      conjointId: null,
      enfantIds: [],
      procheIds: [],
    },
    membres: [],
    situationFamiliale: {
      statut: 'celibataire',
      nombreEnfants: 0,
    },
    regimeMatrimonial: null,
    donationsSynthetiques: [],
    objectifs: [],
    contraintes: [],
    operationsPrevues: [],
    sourceRefs: [],
    completion: {
      scope: 'f1_core',
      status: 'empty',
      missingRequiredFields: ['membre_principal', 'objectifs_prioritaires'],
      updatedAt: now,
    },
    createdAt: now,
    updatedAt: now,
  };

  return {
    ...dossier,
    completion: evaluateDossierPatrimonialCompletion(dossier, { now }),
  };
}

export function evaluateDossierPatrimonialCompletion(
  dossier: Pick<DossierPatrimonial, 'foyer' | 'membres' | 'objectifs'>,
  options: EvaluateCompletionOptions = {},
): DossierCompletion {
  const missingRequiredFields: DossierRequiredField[] = [];
  const membrePrincipal = dossier.membres.find(
    (membre) => membre.id === dossier.foyer.membrePrincipalId,
  );
  const hasMembrePrincipal = Boolean(
    membrePrincipal?.prenom.trim() &&
    membrePrincipal.nom?.trim() &&
    membrePrincipal.dateNaissance?.trim(),
  );
  const hasObjectifs = dossier.objectifs.length > 0;

  if (!hasMembrePrincipal) missingRequiredFields.push('membre_principal');
  if (!hasObjectifs) missingRequiredFields.push('objectifs_prioritaires');

  const status =
    !membrePrincipal && !hasObjectifs
      ? 'empty'
      : missingRequiredFields.length === 0
        ? 'complete'
        : 'partial';

  return {
    scope: 'f1_core',
    status,
    missingRequiredFields,
    updatedAt: options.now ?? new Date().toISOString(),
  };
}

function createGeneratedId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  const timestamp = Date.now().toString().padStart(12, '0').slice(-12);
  return `00000000-0000-4000-8000-${timestamp}`;
}
