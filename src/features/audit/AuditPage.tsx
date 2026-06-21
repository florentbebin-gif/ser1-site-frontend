/**
 * AuditPage — composant racine de la route /audit (UX-01).
 *
 * Restitue d'abord la landing 3 cartes (état du dossier F1), puis bascule vers
 * le wizard de saisie existant à la demande. Une seule route /audit : la
 * bascule landing ↔ saisie est un état interne, pas une nouvelle route métier.
 */

import { useCallback, useMemo, useState } from 'react';
import type { ReactElement } from 'react';

import type { DossierAudit } from '@/domain/audit/types';
import { createEmptyDossier, ensureDossierAuditUuid } from '@/domain/audit/types';
import { buildDossierPatrimonialFromAudit } from '@/domain/dossier';

import AuditLanding, { type AuditLandingDestination } from './AuditLanding';
import AuditWizard, { type AuditWizardStepId } from './AuditWizard';
import { buildAuditLandingViewModel } from './auditLandingViewModel';
import { loadDraftFromSession } from './utils/storage';

type AuditView = 'landing' | 'wizard';

function readSessionDraft(): DossierAudit {
  const stored = loadDraftFromSession();
  return stored ? ensureDossierAuditUuid(stored) : createEmptyDossier();
}

const DESTINATION_TO_STEP: Record<AuditLandingDestination, AuditWizardStepId> = {
  dossier: 'famille',
  civil: 'civil',
  objectifs: 'objectifs',
};

export default function AuditPage(): ReactElement {
  const [view, setView] = useState<AuditView>('landing');
  const [initialStep, setInitialStep] = useState<AuditWizardStepId>('famille');
  const [draft, setDraft] = useState<DossierAudit>(readSessionDraft);

  const viewModel = useMemo(
    () => buildAuditLandingViewModel(buildDossierPatrimonialFromAudit(draft)),
    [draft],
  );

  const handleOpenAudit = useCallback((destination: AuditLandingDestination) => {
    setInitialStep(DESTINATION_TO_STEP[destination]);
    setView('wizard');
  }, []);

  const handleBackToSynthese = useCallback(() => {
    setDraft(readSessionDraft());
    setView('landing');
  }, []);

  if (view === 'wizard') {
    return <AuditWizard initialStep={initialStep} onBackToSynthese={handleBackToSynthese} />;
  }

  return <AuditLanding viewModel={viewModel} onOpenAudit={handleOpenAudit} />;
}
