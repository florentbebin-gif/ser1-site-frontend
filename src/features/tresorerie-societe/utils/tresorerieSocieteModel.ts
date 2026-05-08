import type {
  AssociateInput,
  CompanyInput,
  CompanyKind,
} from '@/engine/tresorerie/types';
import {
  getAssociateProfile,
  getCapitalPct,
  getEconomicPct,
  getSelectedAssociate,
  getSelectedAssociateId,
} from '@/engine/tresorerie/runtimeAccessors';

export {
  getAssociateProfile,
  getCapitalPct,
  getEconomicPct,
  getSelectedAssociate,
  getSelectedAssociateId,
};

export const COMPANY_KIND_LABELS: Record<CompanyKind, string> = {
  holding_patrimoniale: 'Holding patrimoniale',
  holding_remuneration: 'Holding de rémunération',
  holding_animatrice: 'Holding animatrice',
  societe_exploitation: 'Société d’exploitation',
};

export const COMPANY_KIND_CODES: Record<CompanyKind, string> = {
  holding_patrimoniale: 'HP',
  holding_remuneration: 'HR',
  holding_animatrice: 'HA',
  societe_exploitation: 'SE',
};

export function getCompanyKind(company: CompanyInput): CompanyKind {
  return company.companyKind ?? 'holding_patrimoniale';
}

export function getCompanyKindLabel(company: CompanyInput): string {
  return COMPANY_KIND_LABELS[getCompanyKind(company)];
}

export function getCompanyKindCode(company: CompanyInput): string {
  return COMPANY_KIND_CODES[getCompanyKind(company)];
}

export function getOwnershipTotals(associates: AssociateInput[]): {
  capitalPct: number;
  economicRightsPct: number;
} {
  return associates.reduce(
    (sum, associate) => ({
      capitalPct: sum.capitalPct + getCapitalPct(associate),
      economicRightsPct: sum.economicRightsPct + getEconomicPct(associate),
    }),
    { capitalPct: 0, economicRightsPct: 0 },
  );
}
