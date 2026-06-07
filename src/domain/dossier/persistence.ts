import type { SourceRef } from './types';
import type {
  DossierCompletionStatus,
  DossierFoyer,
  DossierMembre,
  DossierPatrimonial,
  DossierPatrimonialStatus,
  DossierRegimeMatrimonial,
  DossierSituationFamiliale,
  DossierDonationSynthetique,
  DossierObjectif,
  DossierContrainte,
  DossierOperationPrevue,
} from './patrimonial';

export const DOSSIERS_PATRIMONIAUX_TABLE = 'dossiers_patrimoniaux';

export interface DossierPatrimonialPayload {
  foyer: DossierFoyer;
  membres: DossierMembre[];
  situationFamiliale: DossierSituationFamiliale;
  regimeMatrimonial: DossierRegimeMatrimonial | null;
  donationsSynthetiques: DossierDonationSynthetique[];
  objectifs: DossierObjectif[];
  contraintes: DossierContrainte[];
  operationsPrevues: DossierOperationPrevue[];
  completion: DossierPatrimonial['completion'];
}

export interface DossierPatrimonialRow {
  id: string;
  user_id: string;
  title: string;
  status: DossierPatrimonialStatus;
  completion_status: DossierCompletionStatus;
  data: DossierPatrimonialPayload;
  source_refs: SourceRef[];
  created_at: string;
  updated_at: string;
}

export function toDossierPatrimonialRow(
  dossier: DossierPatrimonial,
  userId: string,
): DossierPatrimonialRow {
  const now = new Date().toISOString();
  return {
    id: dossier.id,
    user_id: userId,
    title: dossier.foyer.label,
    status: dossier.status,
    completion_status: dossier.completion.status,
    data: {
      foyer: dossier.foyer,
      membres: dossier.membres,
      situationFamiliale: dossier.situationFamiliale,
      regimeMatrimonial: dossier.regimeMatrimonial,
      donationsSynthetiques: dossier.donationsSynthetiques,
      objectifs: dossier.objectifs,
      contraintes: dossier.contraintes,
      operationsPrevues: dossier.operationsPrevues,
      completion: dossier.completion,
    },
    source_refs: dossier.sourceRefs,
    created_at: dossier.createdAt ?? dossier.updatedAt ?? now,
    updated_at: dossier.updatedAt ?? now,
  };
}

export function fromDossierPatrimonialRow(row: DossierPatrimonialRow): DossierPatrimonial {
  return {
    id: row.id,
    ownerUserId: row.user_id,
    status: row.status,
    foyer: row.data.foyer,
    membres: row.data.membres,
    situationFamiliale: row.data.situationFamiliale,
    regimeMatrimonial: row.data.regimeMatrimonial,
    donationsSynthetiques: row.data.donationsSynthetiques,
    objectifs: row.data.objectifs,
    contraintes: row.data.contraintes,
    operationsPrevues: row.data.operationsPrevues,
    sourceRefs: row.source_refs,
    completion: {
      ...row.data.completion,
      status: row.completion_status,
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
