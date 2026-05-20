import type { BaseCgRetraiteContract } from '@/data/base-cg-retraite';

export function updateText(value: string): string | null {
  return value.trim() ? value : null;
}

export function formatRateLabel(rate: number | null): string | null {
  if (rate === null) return null;
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(rate * 100)} %`;
}

// Taux pouvant venir du catalogue en string ("0,65 %") ou en number (0.0065).
// L'input modale affiche toujours un libellé "X,XX %" lisible et stocke en décimal au commit.
export function rateInputValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(value * 100)} %`;
  }
  return String(value);
}

export function commitRate(value: string): string | number | null {
  if (!value.trim()) return null;
  // On accepte "0,65", "0,65 %", "0.65%". Le `%` et les espaces sont nettoyés, virgule fr-FR convertie.
  const cleaned = value.replace(/%|\s/g, '').replace(',', '.');
  const parsed = Number(cleaned);
  // Si la saisie est un nombre pur, on stocke en décimal (0.0065). Sinon on conserve le texte (rare).
  if (Number.isFinite(parsed)) return parsed / 100;
  return value.trim();
}

function normalizeRateDraft(value: string | number | null | undefined): string | number | null {
  if (typeof value === 'string') return commitRate(value);
  return value ?? null;
}

function normalizeRatePair(
  labelValue: string | number | null | undefined,
  rateValue: number | null | undefined,
): { label: string | number | null; rate: number | null } {
  if ((labelValue === null || labelValue === undefined) && typeof rateValue === 'number') {
    return {
      label: formatRateLabel(rateValue),
      rate: rateValue,
    };
  }
  const committed = normalizeRateDraft(labelValue);
  if (typeof committed === 'number') {
    return {
      label: formatRateLabel(committed),
      rate: committed,
    };
  }
  if (committed === null) {
    return {
      label: null,
      rate: null,
    };
  }
  return {
    label: committed,
    rate: rateValue ?? null,
  };
}

export function normalizeBaseCgRetraiteContractDraft(
  contract: BaseCgRetraiteContract,
): BaseCgRetraiteContract {
  const transferFees = normalizeRatePair(
    contract.phaseEpargne.fraisTransfertSortant,
    contract.phaseEpargne.fraisTransfertSortantRate,
  );
  const arreragesFees = normalizeRatePair(
    contract.phaseLiquidation.fraisArrerages,
    contract.phaseLiquidation.fraisArreragesRate,
  );

  return {
    ...contract,
    phaseEpargne: {
      ...contract.phaseEpargne,
      rendementFondsEuro: normalizeRateDraft(contract.phaseEpargne.rendementFondsEuro),
      fondsEuroGarantis: normalizeRateDraft(contract.phaseEpargne.fondsEuroGarantis),
      fraisVersements: normalizeRateDraft(contract.phaseEpargne.fraisVersements),
      fraisGestionFondsEuro: normalizeRateDraft(contract.phaseEpargne.fraisGestionFondsEuro),
      fraisGestionUc: normalizeRateDraft(contract.phaseEpargne.fraisGestionUc),
      fraisArbitrage: normalizeRateDraft(contract.phaseEpargne.fraisArbitrage),
      fraisTransfertSortant: transferFees.label,
      fraisTransfertSortantRate: transferFees.rate,
    },
    phaseLiquidation: {
      ...contract.phaseLiquidation,
      tauxTechnique: normalizeRateDraft(contract.phaseLiquidation.tauxTechnique),
      fraisArrerages: arreragesFees.label,
      fraisArreragesRate: arreragesFees.rate,
    },
  };
}

export function formatFieldValue(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

export function parseOptionalInteger(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

export function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
