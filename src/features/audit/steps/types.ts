import type { DossierAudit } from '../types';

export interface StepProps {
  dossier: DossierAudit;
  updateDossier: (_updates: Partial<DossierAudit>) => void;
}
