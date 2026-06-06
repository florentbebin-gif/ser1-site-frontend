import { describe, expect, it } from 'vitest';
import { LEGAL_REFERENCE_BY_ID, getLegalReference } from '@/domain/legal-references';
import {
  AVANTAGES_MATRIMONIAUX_REFERENCE,
  LIBERALITES_REFERENCE,
} from '../DmtgSuccession/dmtgReferenceData';
import {
  AVANTAGES_MATRIMONIAUX_VIGILANCE_LEGAL_REFERENCE_IDS,
  AV_DECES_LEGAL_REFERENCE_IDS,
  DONATION_SECTION_LEGAL_REFERENCE_IDS,
  RESERVE_CIVIL_LEGAL_REFERENCE_IDS,
} from '../DmtgSuccession/dmtgLegalReferenceIds';

function unique(ids: readonly string[]): string[] {
  return Array.from(new Set(ids));
}

function listDisplayedDmtgLegalRefIds(): string[] {
  return unique([
    ...LIBERALITES_REFERENCE.flatMap((item) => item.legalRefIds),
    ...AVANTAGES_MATRIMONIAUX_REFERENCE.flatMap((item) => item.legalRefIds),
    ...Object.values(AV_DECES_LEGAL_REFERENCE_IDS),
    ...DONATION_SECTION_LEGAL_REFERENCE_IDS,
    ...Object.values(RESERVE_CIVIL_LEGAL_REFERENCE_IDS),
    ...Object.values(AVANTAGES_MATRIMONIAUX_VIGILANCE_LEGAL_REFERENCE_IDS).flat(),
  ]);
}

describe('références juridiques DMTG affichées', () => {
  it('résout tous les legalRefIds exposés dans les settings DMTG', () => {
    const missingReferenceIds = listDisplayedDmtgLegalRefIds().filter(
      (id) => !LEGAL_REFERENCE_BY_ID.has(id),
    );

    expect(missingReferenceIds).toEqual([]);
  });

  it('tague tous les legalRefIds affichés pour le setting DMTG', () => {
    const untaggedReferenceIds = listDisplayedDmtgLegalRefIds().filter(
      (id) => !getLegalReference(id).relatedSettings?.includes('dmtg'),
    );

    expect(untaggedReferenceIds).toEqual([]);
  });
});
