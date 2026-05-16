import type { BaseCgPhaseEpargne } from './types';

const MISSING_VALUE_PATTERN = /^(?:-|n\/a|na|nc|n\.c\.|non communiqué|non communique|non renseigné|non renseigne|à compléter|a compléter)$/i;

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function hasBaseCgRetraiteValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'number') return Number.isFinite(value);
  const text = normalizeText(String(value));
  if (!text) return false;
  return !MISSING_VALUE_PATTERN.test(text);
}

export function formatBaseCgRetraiteRateField(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'number') {
    return `${new Intl.NumberFormat('fr-FR', {
      maximumFractionDigits: 3,
    }).format(value * 100)} %`;
  }
  return String(value);
}

export function formatBaseCgRetraiteValue(value: string | number | null | undefined): string {
  if (!hasBaseCgRetraiteValue(value)) return '';
  if (typeof value === 'number') {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(value);
  }
  return String(value);
}

export function normalizeBaseCgRetraiteGestionFees(
  phaseEpargne: Pick<BaseCgPhaseEpargne, 'fraisGestion' | 'fraisGestionFondsEuro' | 'fraisGestionUc'>,
): Pick<BaseCgPhaseEpargne, 'fraisGestionFondsEuro' | 'fraisGestionUc'> {
  const fallback = phaseEpargne.fraisGestion;
  return {
    fraisGestionFondsEuro: hasBaseCgRetraiteValue(phaseEpargne.fraisGestionFondsEuro)
      ? phaseEpargne.fraisGestionFondsEuro
      : fallback,
    fraisGestionUc: hasBaseCgRetraiteValue(phaseEpargne.fraisGestionUc)
      ? phaseEpargne.fraisGestionUc
      : fallback,
  };
}
