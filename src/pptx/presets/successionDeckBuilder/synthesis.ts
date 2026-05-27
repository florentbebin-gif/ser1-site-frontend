import type {
  SuccessionBeneficiarySummary,
  SuccessionFamilyContextSlideSpec,
  SuccessionSynthesisSlideSpec,
} from '@/pptx/theme/types';

import { compactCount, fmt, fmtPct, LIEN_LABELS } from './formatters';
import type { SuccessionChronologieBeneficiary, SuccessionData } from './types';

export function buildBeneficiarySummaries(
  beneficiaries: SuccessionChronologieBeneficiary[] | undefined,
  limit = 4,
): SuccessionBeneficiarySummary[] {
  return (beneficiaries ?? []).slice(0, limit).map((beneficiary) => ({
    label: beneficiary.label,
    gross: fmt(beneficiary.brut),
    tax: beneficiary.exonerated ? 'Exonéré' : fmt(beneficiary.droits),
    net: fmt(beneficiary.net),
    exonerated: beneficiary.exonerated,
  }));
}

export function buildDirectBeneficiarySummaries(
  data: SuccessionData,
): SuccessionBeneficiarySummary[] {
  return data.heritiers.slice(0, 4).map((heir) => ({
    label: LIEN_LABELS[heir.lien] ?? heir.lien,
    gross: fmt(heir.partBrute),
    tax: heir.droits === 0 ? 'Exonéré' : fmt(heir.droits),
    net: fmt(Math.max(0, heir.partBrute - heir.droits)),
    exonerated: heir.droits === 0,
  }));
}

export function buildSynthesisSlide(data: SuccessionData): SuccessionSynthesisSlideSpec {
  const beneficiaryCount =
    data.heritiers.length || data.predecesChronologie?.step1?.beneficiaries?.length || 0;

  return {
    type: 'succession-synthesis',
    title: 'Synthèse de votre simulation',
    subtitle: 'Principaux indicateurs successoraux',
    heroLabel: 'Droits estimés',
    heroValue: fmt(data.totalDroits),
    heroCaption: data.predecesChronologie?.applicable
      ? 'Total cumulé sur la chronologie simulée'
      : 'Estimation sur la succession directe simulée',
    kpis: [
      { icon: 'money', label: 'Masse transmise', value: fmt(data.actifNetSuccession) },
      { icon: 'balance', label: 'Droits cumulés', value: fmt(data.totalDroits) },
      { icon: 'percent', label: 'Taux moyen', value: fmtPct(data.tauxMoyenGlobal) },
      { icon: 'checklist', label: 'Bénéficiaires', value: compactCount(beneficiaryCount) },
    ],
  };
}

export function buildFamilyContextSlide(
  familyContext: SuccessionData['familyContext'],
): SuccessionFamilyContextSlideSpec | null {
  if (!familyContext) return null;
  return {
    type: 'succession-family-context',
    title: 'Contexte familial et dispositions',
    subtitle: 'Situation civile, régime matrimonial et filiation',
    ...familyContext,
  };
}
