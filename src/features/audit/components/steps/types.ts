import type { DossierAudit } from '@/domain/audit/types';

export interface StepProps {
  dossier: DossierAudit;
  updateDossier: (_updates: Partial<DossierAudit>) => void;
}
