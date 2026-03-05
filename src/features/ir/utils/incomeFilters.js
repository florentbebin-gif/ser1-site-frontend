export const DEFAULT_INCOME_FILTERS = Object.freeze({
  tns: false,
  pension: false,
  foncier: false,
});

export function normalizeIncomeFilters(filters) {
  return {
    tns: filters?.tns === true,
    pension: filters?.pension === true,
    foncier: filters?.foncier === true,
  };
}

export function hasTaxableIncomeEntries(incomes) {
  const safeIncomes = incomes || {};
  const values = [
    safeIncomes.d1?.salaries,
    safeIncomes.d1?.associes62,
    safeIncomes.d1?.pensions,
    safeIncomes.d1?.bic,
    safeIncomes.d1?.autres,
    safeIncomes.d2?.salaries,
    safeIncomes.d2?.associes62,
    safeIncomes.d2?.pensions,
    safeIncomes.d2?.bic,
    safeIncomes.d2?.autres,
    safeIncomes.capital?.withPs,
    safeIncomes.capital?.withoutPs,
    safeIncomes.fonciersFoyer,
  ];

  return values.some((value) => Number(value) > 0);
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
