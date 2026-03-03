export const DEFAULT_INCOME_FILTERS = Object.freeze({
  tns: true,
  pension: true,
  foncier: true,
});

export function normalizeIncomeFilters(filters) {
  return {
    tns: filters?.tns !== false,
    pension: filters?.pension !== false,
    foncier: filters?.foncier !== false,
  };
}

export function applyIncomeFilters(incomes, filters) {
  const safeIncomes = incomes || {};
  const normalizedFilters = normalizeIncomeFilters(filters);

  const d1 = safeIncomes.d1 || {};
  const d2 = safeIncomes.d2 || {};

  return {
    ...safeIncomes,
    d1: {
      ...d1,
      associes62: normalizedFilters.tns ? d1.associes62 : 0,
      bic: normalizedFilters.tns ? d1.bic : 0,
      pensions: normalizedFilters.pension ? d1.pensions : 0,
    },
    d2: {
      ...d2,
      associes62: normalizedFilters.tns ? d2.associes62 : 0,
      bic: normalizedFilters.tns ? d2.bic : 0,
      pensions: normalizedFilters.pension ? d2.pensions : 0,
    },
    fonciersFoyer: normalizedFilters.foncier ? safeIncomes.fonciersFoyer : 0,
  };
}
