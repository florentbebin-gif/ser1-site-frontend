import type {
  SuccessionAnnexBeneficiaryRow,
  SuccessionAnnexStep,
  SuccessionAnnexTableSlideSpec,
  SuccessionAssetAnnexSlideSpec,
} from '@/pptx/theme/types';

import { LIEN_LABELS } from './formatters';
import type { SuccessionChronologieStep, SuccessionData } from './types';

function stepToBeneficiaryRows(step: SuccessionChronologieStep): SuccessionAnnexBeneficiaryRow[] {
  return (step.beneficiaries ?? []).map((b) => ({
    label: b.label,
    capitauxDecesNets: b.capitauxDecesNets ?? 0,
    droitsAssuranceVie990I: b.droitsAssuranceVie990I ?? 0,
    droitsSuccession: b.droitsSuccession ?? b.droits,
    transmissionNetteSuccession: b.transmissionNetteSuccession ?? b.net,
    exonerated: b.exonerated,
  }));
}

function totalRow(rows: SuccessionAnnexBeneficiaryRow[]): SuccessionAnnexBeneficiaryRow {
  return {
    label: 'Total',
    capitauxDecesNets: rows.reduce((s, b) => s + b.capitauxDecesNets, 0),
    droitsAssuranceVie990I: rows.reduce((s, b) => s + b.droitsAssuranceVie990I, 0),
    droitsSuccession: rows.reduce((s, b) => s + b.droitsSuccession, 0),
    transmissionNetteSuccession: rows.reduce((s, b) => s + b.transmissionNetteSuccession, 0),
    isTotal: true,
  };
}

export function buildAnnexTableSlide(data: SuccessionData): SuccessionAnnexTableSlideSpec {
  if (data.annexBeneficiarySteps && data.annexBeneficiarySteps.length > 0) {
    return {
      type: 'succession-annex-table',
      title: 'Détail des droits par bénéficiaire',
      subtitle: 'Répartition par décès et par bénéficiaire',
      steps: data.annexBeneficiarySteps,
    };
  }

  const chronologie = data.predecesChronologie;
  const steps: SuccessionAnnexStep[] = [];

  if (chronologie?.applicable && chronologie.step1 && chronologie.step2) {
    const s1 = stepToBeneficiaryRows(chronologie.step1);
    steps.push({
      title: `1er décès — ${chronologie.firstDecedeLabel}`,
      beneficiaries: [...s1, totalRow(s1)],
    });
    const s2 = stepToBeneficiaryRows(chronologie.step2);
    steps.push({
      title: `2e décès — ${chronologie.secondDecedeLabel}`,
      beneficiaries: [...s2, totalRow(s2)],
    });
  } else {
    const rows: SuccessionAnnexBeneficiaryRow[] = data.heritiers.map((h) => ({
      label: LIEN_LABELS[h.lien] ?? h.lien,
      capitauxDecesNets: 0,
      droitsAssuranceVie990I: 0,
      droitsSuccession: h.droits,
      transmissionNetteSuccession: Math.max(0, h.partBrute - h.droits),
    }));
    steps.push({
      title: 'Succession directe simulée',
      beneficiaries: [...rows, totalRow(rows)],
    });
  }

  return {
    type: 'succession-annex-table',
    title: 'Détail des droits par bénéficiaire',
    subtitle: 'Répartition par décès et par bénéficiaire',
    steps,
  };
}

export function buildAssetAnnexSlide(
  assetAnnex: SuccessionData['assetAnnex'],
): SuccessionAssetAnnexSlideSpec | null {
  if (!assetAnnex || assetAnnex.columns.length === 0 || assetAnnex.rows.length === 0) return null;
  return {
    type: 'succession-annex-assets',
    title: 'Détail des actifs saisis',
    subtitle: 'Répartition par personne et par masse patrimoniale',
    ...assetAnnex,
  };
}
