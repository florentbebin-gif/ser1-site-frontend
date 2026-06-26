import type { SourceRef } from './types';
import { evaluateDossierPatrimonialCompletion } from './patrimonial';
import type {
  DossierCompletionStatus,
  DossierContrainte,
  DossierDonationSynthetique,
  DossierFoyer,
  DossierMembre,
  DossierObjectif,
  DossierOperationPrevue,
  DossierPatrimonial,
  DossierPatrimonialStatus,
  DossierRegimeMatrimonial,
  DossierSituationFamiliale,
  DossierTestamentSynthetique,
} from './patrimonial';
import { normalizeDossierRegimeDdvOptions } from './ddvOptionMigration';

export const DOSSIERS_PATRIMONIAUX_TABLE = 'dossiers_patrimoniaux';

export interface DossierPatrimonialPayload {
  foyer: DossierFoyer;
  membres: DossierMembre[];
  situationFamiliale: DossierSituationFamiliale;
  regimeMatrimonial: DossierRegimeMatrimonial | null;
  donationsSynthetiques: DossierDonationSynthetique[];
  testamentsSynthetiques?: DossierTestamentSynthetique[];
  objectifs: DossierObjectif[];
  contraintes: DossierContrainte[];
  operationsPrevues: DossierOperationPrevue[];
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

export type DossierPatrimonialUpsertRow = Omit<DossierPatrimonialRow, 'created_at' | 'updated_at'>;

export interface DossierPatrimonialListRow {
  id: string;
  title: string;
  status: DossierPatrimonialStatus;
  completion_status: DossierCompletionStatus;
  created_at: string;
  updated_at: string;
}

export function toDossierPatrimonialUpsertRow(
  dossier: DossierPatrimonial,
  userId: string,
): DossierPatrimonialUpsertRow {
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
      testamentsSynthetiques: dossier.testamentsSynthetiques,
      objectifs: dossier.objectifs,
      contraintes: dossier.contraintes,
      operationsPrevues: dossier.operationsPrevues,
    },
    source_refs: dossier.sourceRefs,
  };
}

export function fromDossierPatrimonialRow(row: DossierPatrimonialRow): DossierPatrimonial {
  const completion = evaluateDossierPatrimonialCompletion(
    {
      foyer: row.data.foyer,
      membres: row.data.membres,
      objectifs: row.data.objectifs,
    },
    { now: row.updated_at },
  );

  if (completion.status !== row.completion_status) {
    throw new Error(
      `Complétude dossier incohérente pour ${row.id}: colonne=${row.completion_status}, modèle=${completion.status}`,
    );
  }

  const regimeMatrimonial = normalizeDossierRegimeDdvOptions(row.data.regimeMatrimonial);

  return {
    id: row.id,
    ownerUserId: row.user_id,
    status: row.status,
    foyer: row.data.foyer,
    membres: row.data.membres,
    situationFamiliale: row.data.situationFamiliale,
    regimeMatrimonial,
    donationsSynthetiques: row.data.donationsSynthetiques,
    testamentsSynthetiques: row.data.testamentsSynthetiques ?? [],
    objectifs: row.data.objectifs,
    contraintes: row.data.contraintes,
    operationsPrevues: row.data.operationsPrevues,
    sourceRefs: row.source_refs,
    completion,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
