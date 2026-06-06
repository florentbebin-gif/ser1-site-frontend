import type { LegalReferenceId } from '@/domain/legal-references';

export const AV_DECES_LEGAL_REFERENCE_IDS = {
  cgi990I: 'cgi-990-i',
  cgi757B: 'cgi-757-b',
} as const satisfies Record<string, LegalReferenceId>;

export const DONATION_SECTION_LEGAL_REFERENCE_IDS = [
  'cgi-784',
  'cgi-790-g',
  'boi-enr-dmtg-10-50-50',
] as const satisfies readonly LegalReferenceId[];

export const RESERVE_CIVIL_LEGAL_REFERENCE_IDS = {
  reserve: 'code-civil-913',
  conjoint: 'code-civil-757',
} as const satisfies Record<string, LegalReferenceId>;

export const AVANTAGES_MATRIMONIAUX_VIGILANCE_LEGAL_REFERENCE_IDS = {
  qualification: ['code-civil-1516', 'code-civil-1525', 'code-civil-1527'],
  enfantsNonCommuns: ['code-civil-1527', 'code-civil-1094-1'],
  divorce: ['code-civil-265'],
} as const satisfies Record<string, readonly LegalReferenceId[]>;
