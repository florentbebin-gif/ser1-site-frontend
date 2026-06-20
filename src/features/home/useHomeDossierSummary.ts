import { useMemo } from 'react';

import { ensureDossierAuditUuid } from '@/domain/audit/types';
import { buildDossierPatrimonialFromAudit } from '@/domain/dossier';
import {
  buildAuditLandingViewModel,
  loadDraftFromSession,
  type AuditLandingMember,
} from '@/features/audit';

import {
  buildHomeDossierState,
  deriveHomeDossierState,
  type HomeDossierState,
} from './homeDossierState';

export interface HomeDossierSummary {
  /** Un dossier est saisi en cache ou chargé (foyer engagé). */
  hasDossier: boolean;
  principal: AuditLandingMember | null;
  conjoint: AuditLandingMember | null;
  state: HomeDossierState;
}

const EMPTY_SUMMARY: HomeDossierSummary = {
  hasDossier: false,
  principal: null,
  conjoint: null,
  state: deriveHomeDossierState({
    hasDossier: false,
    hasObjectifs: false,
    progress: null,
  }),
};

/**
 * Résumé du dossier de travail pour l'accueil. Réutilise exactement la chaîne de
 * la landing /audit (brouillon de session → dossier patrimonial → view-model),
 * donc couvre aussi bien « dossier saisi en cache » que « dossier chargé ».
 */
export function useHomeDossierSummary(): HomeDossierSummary {
  return useMemo(() => {
    const draft = loadDraftFromSession();
    if (!draft) {
      return EMPTY_SUMMARY;
    }

    const vm = buildAuditLandingViewModel(
      buildDossierPatrimonialFromAudit(ensureDossierAuditUuid(draft)),
    );

    return {
      hasDossier: vm.hasDossier,
      principal: vm.synthese.principal,
      conjoint: vm.synthese.conjoint,
      state: buildHomeDossierState(vm),
    };
  }, []);
}
