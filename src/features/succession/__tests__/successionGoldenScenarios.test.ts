import { describe, expect, it } from 'vitest';
import { DEFAULT_DMTG } from '../../../engine/civil';
import { calculateSuccession, type HeritiersInput } from '../../../engine/succession';
import { buildSuccessionAvFiscalAnalysis } from '../successionAvFiscal';
import type { SuccessionDevolutionAnalysis } from '../successionDevolution';
import type { SuccessionBeneficiaryRef } from '../successionDraft';
import { buildSuccessionDirectDisplayAnalysis } from '../successionDisplay';
import { buildSuccessionFiscalSnapshot } from '../successionFiscalContext';
import type { SuccessionTestamentDistributionBeneficiary } from '../successionTestament';
import { makeCivil, makeDevolution } from './fixtures';
import {
  ASSURANCE_VIE_757B_NOTARIAL_REFERENCE,
  SUCCESSION_NOTARIAL_REFERENCES,
} from './fixtures/notarialReferences';

function buildSyntheticBeneficiaries(
  heirs: HeritiersInput[],
  ids?: string[],
): SuccessionTestamentDistributionBeneficiary[] {
  return heirs.map((heir, index) => ({
    id: ids?.[index] ?? `beneficiaire-${index + 1}`,
    beneficiaryRef: `family:beneficiaire-${index + 1}` as SuccessionBeneficiaryRef,
    label: `Bénéficiaire ${index + 1}`,
    lien: heir.lien,
    partSuccession: heir.partSuccession,
    source: 'testament',
    ...(heir.lien === 'conjoint' ? { exonerated: true } : {}),
  }));
}

function buildSyntheticDevolution(
  heirs: HeritiersInput[],
  ids?: string[],
): SuccessionDevolutionAnalysis {
  const total = heirs.reduce((sum, heir) => sum + heir.partSuccession, 0);
  return {
    masseReference: total,
    nbEnfantsTotal: 0,
    nbEnfantsNonCommuns: 0,
    reserve: null,
    lines: [],
    testamentDistribution: {
      dispositionType: 'legs_particulier',
      beneficiaries: buildSyntheticBeneficiaries(heirs, ids),
      plafondTestament: total,
      requestedAmount: total,
      distributedAmount: total,
      warnings: [],
    },
    warnings: [],
  };
}

describe('références notariales succession', () => {
  it('fige un corpus sourcé couvrant les liens et rappels critiques', () => {
    expect(SUCCESSION_NOTARIAL_REFERENCES).toHaveLength(7);
    for (const reference of SUCCESSION_NOTARIAL_REFERENCES) {
      expect(reference.sources.length).toBeGreaterThan(0);
      expect(reference.sources.every((source) => (
        source.url.includes('service-public.fr')
        || source.url.includes('service-public.gouv.fr')
        || source.url.includes('legifrance.gouv.fr')
      ))).toBe(true);
    }
  });

  it.each(SUCCESSION_NOTARIAL_REFERENCES)(
    '$id - le moteur calcule les droits attendus',
    (reference) => {
      const result = calculateSuccession({
        ...reference.engineInput,
        dmtgSettings: DEFAULT_DMTG,
      }).result;

      expect(result.totalDroits).toBe(reference.expected.totalDroits);
      reference.expected.details.forEach((expectedDetail, index) => {
        expect(result.detailHeritiers[index]).toMatchObject(expectedDetail);
      });
    },
  );

  it.each(SUCCESSION_NOTARIAL_REFERENCES)(
    '$id - la succession directe restitue les mêmes droits',
    (reference) => {
      const directHeirs = reference.directDisplay?.heirs ?? reference.engineInput.heritiers.map((heir) => ({
        lien: heir.lien,
        partSuccession: heir.partSuccession,
      }));
      const devolution = buildSyntheticDevolution(directHeirs, reference.directDisplay?.heirIds);
      const analysis = buildSuccessionDirectDisplayAnalysis({
        civil: makeCivil(reference.directDisplay?.civil ?? {}),
        devolution,
        devolutionContext: makeDevolution({}),
        dmtgSettings: DEFAULT_DMTG,
        enfantsContext: [],
        familyMembers: [],
        order: 'epoux1',
        actifNetSuccession: directHeirs.reduce((sum, heir) => sum + heir.partSuccession, 0),
        donationsContext: reference.directDisplay?.donations,
        donationSettings: reference.directDisplay?.donationSettings,
        referenceDate: reference.directDisplay?.referenceDate
          ? new Date(reference.directDisplay.referenceDate)
          : undefined,
      });

      expect(analysis.result?.totalDroits).toBe(reference.expected.totalDroits);
      reference.expected.details.forEach((expectedDetail, index) => {
        expect(analysis.result?.detailHeritiers[index]).toMatchObject(expectedDetail);
      });
    },
  );

  it('fige le traitement assurance-vie 757 B sur bénéficiaire tiers', () => {
    const analysis = buildSuccessionAvFiscalAnalysis(
      [ASSURANCE_VIE_757B_NOTARIAL_REFERENCE.entry],
      makeCivil({ situationMatrimoniale: 'celibataire' }),
      [],
      [],
      buildSuccessionFiscalSnapshot(null),
    );

    const line = analysis.byAssure.epoux1.lines[0];
    expect(line).toMatchObject(ASSURANCE_VIE_757B_NOTARIAL_REFERENCE.expectedLine);
    expect(analysis.totalDroits).toBe(ASSURANCE_VIE_757B_NOTARIAL_REFERENCE.expectedTotalDroits);
  });
});
