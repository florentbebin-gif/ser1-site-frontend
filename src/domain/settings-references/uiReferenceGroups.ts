import type { LegalReferenceId } from '@/domain/legal-references';

export const INCOME_TAX_BAREME_BLOCK_CLAIM_KEYS = [
  'income-tax-scale-current',
  'quotient-familial-plafond-current',
  'income-tax-decote-current',
  'abat10-salaries-current',
  'abat10-pensions-current',
] as const;

export const INCOME_TAX_BAREME_BLOCK_REF_IDS = [
  'boi-ir-liq-20-10',
  'cgi-197',
  'cgi-193-197',
  'boi-ir-liq-20-20-20',
  'boi-ir-liq-20-20-30',
  'boi-rsa-base-30-50',
  'cgi-83-3',
  'boi-rsa-pens-30-10-10',
  'cgi-158',
] as const satisfies readonly LegalReferenceId[];

export const INCOME_TAX_DOM_ABATEMENT_CLAIM_KEYS = ['income-tax-dom-abatement-current'] as const;

export const INCOME_TAX_DOM_ABATEMENT_REF_IDS = [
  'boi-ir-liq-20-30-10',
  'cgi-197',
] as const satisfies readonly LegalReferenceId[];

export const INCOME_TAX_PFU_BLOCK_CLAIM_KEYS = ['pfu-ir-current', 'patrimony-current'] as const;

export const INCOME_TAX_PFU_BLOCK_REF_IDS = [
  'boi-rppm-rcm-30-20',
  'cgi-200-a',
  'service-public-ps-revenus-capital-2026',
  'css-l136-6',
  'css-l136-8',
  'css-l136-7',
] as const satisfies readonly LegalReferenceId[];

export const INCOME_TAX_CEHR_BLOCK_CLAIM_KEYS = ['cehr-current', 'cdhr-current'] as const;

export const INCOME_TAX_CEHR_BLOCK_REF_IDS = [
  'boi-ir-chr',
  'cgi-223-sexies',
  'cgi-224',
] as const satisfies readonly LegalReferenceId[];

export const INCOME_TAX_IFI_BLOCK_CLAIM_KEYS = ['ifi-current'] as const;

export const INCOME_TAX_IFI_BLOCK_REF_IDS = [
  'boi-pat-ifi-40-10',
  'cgi-964',
  'cgi-977',
] as const satisfies readonly LegalReferenceId[];

export const INCOME_TAX_CORPORATE_BLOCK_CLAIM_KEYS = ['corporate-tax-current'] as const;

export const INCOME_TAX_CORPORATE_BLOCK_REF_IDS = [
  'cgi-209',
  'cgi-219',
  'boi-is-liq-10',
  'boi-is-liq-20',
] as const satisfies readonly LegalReferenceId[];

export const PRELEVEMENTS_PASS_CLAIM_KEYS = ['pass-latest'] as const;

export const PRELEVEMENTS_PASS_REF_IDS = [
  'urssaf-pass-2026',
  'ameli-pass-2026',
] as const satisfies readonly LegalReferenceId[];

export const PRELEVEMENTS_PATRIMOINE_CLAIM_KEYS = ['patrimony-current'] as const;

export const PRELEVEMENTS_PATRIMOINE_REF_IDS = [
  'service-public-ps-revenus-capital-2026',
  'css-l136-6',
  'css-l136-8',
  'css-l136-7',
] as const satisfies readonly LegalReferenceId[];

export const PRELEVEMENTS_RETRAITE_CLAIM_KEYS = ['retirement-current-brackets'] as const;

export const PRELEVEMENTS_RETRAITE_REF_IDS = [
  'boss-protection-sociale-complementaire',
  'css-l136-8',
] as const satisfies readonly LegalReferenceId[];

export const PRELEVEMENTS_SEUILS_CLAIM_KEYS = ['retirement-thresholds-current'] as const;

export const PRELEVEMENTS_SEUILS_REF_IDS = [
  'css-l136-8',
] as const satisfies readonly LegalReferenceId[];

export const PRELEVEMENTS_SOCIAL_DIRIGEANT_CLAIM_KEYS = [
  'social-dirigeant-dividendes-tns',
] as const;

export const PRELEVEMENTS_SOCIAL_DIRIGEANT_REF_IDS = [
  'urssaf-dividendes-tns-cotisations-sociales',
] as const satisfies readonly LegalReferenceId[];

export const DMTG_BAREMES_BLOCK_CLAIM_KEYS = ['dmtg-fiscal-values-current'] as const;

export const DMTG_BAREMES_BLOCK_REF_IDS = [
  'boi-enr-dmtg-10-50-30',
  'boi-enr-dmtg-10-50-20',
  'cgi-777',
  'cgi-779',
] as const satisfies readonly LegalReferenceId[];

export const SETTINGS_UI_REFERENCE_GROUPS = [
  {
    claimKeys: INCOME_TAX_BAREME_BLOCK_CLAIM_KEYS,
    refIds: INCOME_TAX_BAREME_BLOCK_REF_IDS,
  },
  {
    claimKeys: INCOME_TAX_DOM_ABATEMENT_CLAIM_KEYS,
    refIds: INCOME_TAX_DOM_ABATEMENT_REF_IDS,
  },
  {
    claimKeys: INCOME_TAX_PFU_BLOCK_CLAIM_KEYS,
    refIds: INCOME_TAX_PFU_BLOCK_REF_IDS,
  },
  {
    claimKeys: INCOME_TAX_CEHR_BLOCK_CLAIM_KEYS,
    refIds: INCOME_TAX_CEHR_BLOCK_REF_IDS,
  },
  {
    claimKeys: INCOME_TAX_IFI_BLOCK_CLAIM_KEYS,
    refIds: INCOME_TAX_IFI_BLOCK_REF_IDS,
  },
  {
    claimKeys: INCOME_TAX_CORPORATE_BLOCK_CLAIM_KEYS,
    refIds: INCOME_TAX_CORPORATE_BLOCK_REF_IDS,
  },
  {
    claimKeys: PRELEVEMENTS_PASS_CLAIM_KEYS,
    refIds: PRELEVEMENTS_PASS_REF_IDS,
  },
  {
    claimKeys: PRELEVEMENTS_PATRIMOINE_CLAIM_KEYS,
    refIds: PRELEVEMENTS_PATRIMOINE_REF_IDS,
  },
  {
    claimKeys: PRELEVEMENTS_RETRAITE_CLAIM_KEYS,
    refIds: PRELEVEMENTS_RETRAITE_REF_IDS,
  },
  {
    claimKeys: PRELEVEMENTS_SEUILS_CLAIM_KEYS,
    refIds: PRELEVEMENTS_SEUILS_REF_IDS,
  },
  {
    claimKeys: PRELEVEMENTS_SOCIAL_DIRIGEANT_CLAIM_KEYS,
    refIds: PRELEVEMENTS_SOCIAL_DIRIGEANT_REF_IDS,
  },
  {
    claimKeys: DMTG_BAREMES_BLOCK_CLAIM_KEYS,
    refIds: DMTG_BAREMES_BLOCK_REF_IDS,
  },
] as const;
