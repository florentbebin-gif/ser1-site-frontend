import type { TresoAssociateRevenueSource } from '@/engine/tresorerie/types';

export const TRESO_REVENUE_SOURCE_LABELS: Record<TresoAssociateRevenueSource, string> = {
  remuneration: 'Rémunération nette avant impôt',
  cca: 'Remboursement CCA',
  cca_interets: 'Intérêts CCA',
  dividendes: 'Dividendes nets de PFU',
  charges_sociales_tns: 'Charges sociales TNS',
  fiscalite: 'Fiscalité',
};

export function getTresoRevenueSourceLabel(source: TresoAssociateRevenueSource): string {
  return TRESO_REVENUE_SOURCE_LABELS[source];
}
