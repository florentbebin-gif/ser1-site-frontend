import type {
  SuccessionChronologySlideSpec,
  SuccessionChronologyStepSummary,
} from '@/pptx/theme/types';

import { fmt, orderLabel } from './formatters';
import { buildBeneficiarySummaries, buildDirectBeneficiarySummaries } from './synthesis';
import type { SuccessionChronologieStep, SuccessionData } from './types';

function droitsHorsSuccession(step: SuccessionChronologieStep): number {
  return (step.droitsAssuranceVie ?? 0) + (step.droitsPer ?? 0) + (step.droitsPrevoyance ?? 0);
}

function buildChronologyStep(
  title: string,
  subtitle: string,
  step: SuccessionChronologieStep,
): SuccessionChronologyStepSummary {
  const horsSuccession = droitsHorsSuccession(step);
  return {
    title,
    subtitle,
    masseTransmise: fmt(step.masseTotaleTransmise ?? step.actifTransmis),
    partConjoint: fmt(step.partConjoint),
    autresBeneficiaires: fmt(step.partEnfants),
    droitsSuccession: fmt(step.droitsEnfants),
    droitsHorsSuccession: horsSuccession > 0 ? fmt(horsSuccession) : undefined,
    beneficiaries: buildBeneficiarySummaries(step.beneficiaries),
  };
}

function buildDirectChronologyStep(data: SuccessionData): SuccessionChronologyStepSummary {
  const partConjoint = data.heritiers
    .filter((heir) => heir.lien === 'conjoint')
    .reduce((sum, heir) => sum + heir.partBrute, 0);
  const masseTransmise =
    data.heritiers.reduce((sum, heir) => sum + heir.partBrute, 0) || data.actifNetSuccession;
  const autresBeneficiaires = Math.max(0, masseTransmise - partConjoint);

  return {
    title: 'Succession directe',
    subtitle: 'Transmission issue de la situation simulée',
    masseTransmise: fmt(masseTransmise),
    partConjoint: fmt(partConjoint),
    autresBeneficiaires: fmt(autresBeneficiaires),
    droitsSuccession: fmt(data.totalDroits),
    beneficiaries: buildDirectBeneficiarySummaries(data),
  };
}

export function buildChronologySlide(data: SuccessionData): SuccessionChronologySlideSpec {
  const chronologie = data.predecesChronologie;
  if (!chronologie || !chronologie.applicable || !chronologie.step1 || !chronologie.step2) {
    return {
      type: 'succession-chronology',
      title: 'Chronologie des décès',
      subtitle: 'Succession directe simulée',
      applicable: false,
      orderLabel: chronologie ? orderLabel(chronologie.order) : 'Chronologie non transmise',
      steps: [buildDirectChronologyStep(data)],
      totalDroits: fmt(data.totalDroits),
    };
  }

  return {
    type: 'succession-chronology',
    title: 'Chronologie des décès',
    subtitle: 'Simulation du premier décès puis du second décès',
    applicable: true,
    orderLabel: orderLabel(chronologie.order),
    steps: [
      buildChronologyStep(
        `1er décès — ${chronologie.firstDecedeLabel}`,
        'Transmission initiale',
        chronologie.step1,
      ),
      buildChronologyStep(
        `2e décès — ${chronologie.secondDecedeLabel}`,
        'Transmission finale',
        chronologie.step2,
      ),
    ],
    totalDroits: fmt(chronologie.totalDroits),
  };
}
