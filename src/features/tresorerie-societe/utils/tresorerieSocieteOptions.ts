import type {
  AllocationPocketInput,
  AssociateKind,
  CompanyInput,
  CompanyKind,
  LegalForm,
  OwnershipRight,
} from '@/engine/tresorerie/types';
import {
  ALLOCATION_HORIZON_OPTIONS,
  COMPANY_KIND_CODES,
  COMPANY_KIND_LABELS,
} from '@/domain/tresorerie/societeOptions';

export { ALLOCATION_HORIZON_OPTIONS, COMPANY_KIND_CODES, COMPANY_KIND_LABELS };

export const ASSOCIATE_KIND_OPTIONS = [
  { value: 'pp', label: 'Associé PP' },
  { value: 'pm', label: 'Associé PM' },
] satisfies Array<{ value: AssociateKind; label: string }>;

export const OWNERSHIP_OPTIONS = [
  { value: 'pleine_propriete', label: 'Pleine propriété' },
  { value: 'usufruit', label: 'Usufruit' },
  { value: 'nue_propriete', label: 'Nue-propriété' },
] satisfies Array<{ value: OwnershipRight; label: string }>;

export const COMPANY_CREATION_TYPE_OPTIONS = [
  { value: 'newco', label: 'Société à créer' },
  { value: 'existante', label: 'Société existante' },
] satisfies Array<{ value: CompanyInput['creationType']; label: string }>;

export const LEGAL_FORM_OPTIONS = [
  { value: 'sas', label: 'SAS' },
  { value: 'sc', label: 'SC' },
  { value: 'sarl', label: 'SARL' },
  { value: 'sa', label: 'SA' },
  { value: 'selarl', label: 'SELARL' },
  { value: 'spfpl', label: 'SPFPL' },
  { value: 'selas', label: 'SELAS' },
  { value: 'autre', label: 'Autre' },
] satisfies Array<{ value: LegalForm; label: string }>;

export const COMPANY_KIND_OPTIONS = (Object.keys(COMPANY_KIND_LABELS) as CompanyKind[]).map(
  (kind) => ({
    value: kind,
    label: `${COMPANY_KIND_LABELS[kind]} (${COMPANY_KIND_CODES[kind]})`,
  }),
) satisfies Array<{ value: CompanyKind; label: string }>;

export const ALLOCATION_KIND_OPTIONS = [
  { value: 'distribution', label: 'Distribution' },
  { value: 'capitalisation', label: 'Capitalisation' },
] satisfies Array<{ value: AllocationPocketInput['kind']; label: string }>;
