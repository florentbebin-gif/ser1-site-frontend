export {
  addPhase,
  buildNextPhase,
  computeComplement,
  computeNetRevenue,
  getActivePhase,
  getAssociateAnnualIncomeNeedForYear,
  getAssociateRevenuePhaseForYear,
  getPhaseEndYear,
  hasAssociateAnnualIncomeNeedForYear,
  isRevenuePhaseV6,
  removePhase,
  sortPhases,
  updatePhase,
  type RevenuePhaseInput,
} from '@/engine/tresorerie/revenuePhases';

import type { AssociateRevenuePhaseInputV6 } from '@/engine/tresorerie/types';

function fmtEuro(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR')} €`;
}

/**
 * Compose le titre d'un palier à partir des sous-phases actives.
 * Ex. : "Phase constitution CCA & Rémunération" / "Phase remboursement CCA" / "Phase dividendes".
 */
export function getPhaseTitle(phase: AssociateRevenuePhaseInputV6): string {
  const parts: string[] = [];
  if (phase.ccaContribution.enabled) parts.push('constitution CCA');
  if (phase.remuneration.enabled && phase.remuneration.source !== 'none') parts.push('Rémunération');
  if (phase.ccaRepayment.enabled && phase.ccaRepayment.strategy !== 'aucun') parts.push('remboursement CCA');
  if (phase.distribution.enabled && phase.distribution.dividendsStrategy !== 'aucun') parts.push('dividendes');
  if (parts.length === 0) return phase.label?.trim() ? phase.label.trim() : 'Phase non paramétrée';
  // Capitalise le premier mot : "constitution CCA & Rémunération" → "Constitution CCA & Rémunération".
  const joined = parts.join(' & ');
  return `Phase ${joined.charAt(0).toLowerCase()}${joined.slice(1)}`;
}

/**
 * Renvoie les lignes de montants à afficher sous le titre du palier.
 * Ex. : ["Apport en CCA 20 000 €/an", "Rémunération 10 000 €/an nets"].
 */
export function getPhaseAmountLines(phase: AssociateRevenuePhaseInputV6): string[] {
  const lines: string[] = [];

  if (phase.ccaContribution.enabled) {
    const annual = phase.ccaContribution.annual;
    if (annual && annual.amount > 0) {
      lines.push(`Apport en CCA ${fmtEuro(annual.amount)}/an`);
    }
    const exceptional = phase.ccaContribution.exceptional;
    if (exceptional && exceptional.amount > 0) {
      lines.push(`Apport CCA exceptionnel ${fmtEuro(exceptional.amount)} en ${exceptional.year}`);
    }
  }

  if (phase.remuneration.enabled && phase.remuneration.source !== 'none') {
    const loaded = Math.max(0, phase.remuneration.loadedAnnualCost);
    const rate = Math.max(0, Math.min(phase.remuneration.socialChargeRate, 1));
    const net = loaded * (1 - rate);
    lines.push(`Rémunération ${fmtEuro(net)}/an nets`);
  }

  if (phase.ccaRepayment.enabled && phase.ccaRepayment.strategy !== 'aucun') {
    if (phase.ccaRepayment.strategy === 'montant_cible' && phase.ccaRepayment.targetAmount) {
      lines.push(`Remboursement CCA ${fmtEuro(phase.ccaRepayment.targetAmount)}/an`);
    } else {
      lines.push('Remboursement CCA max');
    }
  }

  if (phase.distribution.enabled && phase.distribution.dividendsStrategy !== 'aucun') {
    if (
      phase.distribution.dividendsStrategy === 'montant_cible' &&
      phase.distribution.dividendsTargetAmountNet
    ) {
      lines.push(`Dividendes ${fmtEuro(phase.distribution.dividendsTargetAmountNet)} €/an`);
    } else {
      lines.push('Dividendes max');
    }
  }

  return lines;
}
