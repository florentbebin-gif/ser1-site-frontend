import { IrSelect } from './IrSelect';
import { IrAmountInput, parseIntegerInput } from './IrAmountInput';
import type { IrFormSectionProps } from './irTypes';

type IrIncomeSectionProps = Pick<
  IrFormSectionProps,
  | 'status'
  | 'setIncomes'
  | 'incomes'
  | 'updateIncome'
  | 'formatMoneyInput'
  | 'realMode'
  | 'setRealModeState'
  | 'realExpenses'
  | 'setRealExpensesState'
  | 'abat10SalD1'
  | 'abat10SalD2'
  | 'psGeneralRate'
  | 'psExceptionRate'
  | 'fmtPct'
  | 'capitalMode'
  | 'setCapitalMode'
  | 'pfuRateIR'
  | 'deductions'
  | 'setDeductions'
  | 'credits'
  | 'setCredits'
  | 'abat10PensionsFoyer'
  | 'euro0'
  | 'isExpert'
  | 'incomeFilters'
  | 'setIncomeFilters'
>;

export function IrIncomeSection({
  status,
  setIncomes,
  incomes,
  updateIncome,
  formatMoneyInput,
  realMode,
  setRealModeState,
  realExpenses,
  setRealExpensesState,
  abat10SalD1,
  abat10SalD2,
  psGeneralRate,
  psExceptionRate,
  fmtPct,
  capitalMode,
  setCapitalMode,
  pfuRateIR,
  deductions,
  setDeductions,
  credits,
  setCredits,
  abat10PensionsFoyer,
  euro0,
  isExpert,
  incomeFilters,
  setIncomeFilters,
}: IrIncomeSectionProps) {
  const showTnsRows = incomeFilters?.tns === true;
  const showPensionRows = incomeFilters?.pension === true;
  const showFoncierRow = incomeFilters?.foncier === true;

  const toggleIncomeFilter = (key: 'tns' | 'pension' | 'foncier') => {
    setIncomeFilters((prev) => ({
      ...prev,
      [key]: prev?.[key] !== true,
    }));
  };

  if (status === null) {
    return null;
  }

  return (
    <div className="ir-table-wrapper premium-card premium-card--guide sim-card--guide">
      <div className="ir-income-card__header sim-card__header sim-card__header--bleed">
        <div className="ir-income-card__header-row">
          <div className="ir-income-card__title sim-card__title sim-card__title-row">
            <div className="ir-section-icon-wrapper sim-card__icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
            </div>
            Revenus imposables
          </div>
          <div className="ir-income-filters" role="group" aria-label="Filtres des lignes de revenus imposables">
            <button
              type="button"
              className={`ir-income-filter-btn${showTnsRows ? ' is-active' : ''}`}
              onClick={() => toggleIncomeFilter('tns')}
              aria-pressed={showTnsRows}
              data-testid="ir-filter-tns"
            >
              TNS
            </button>
            <button
              type="button"
              className={`ir-income-filter-btn${showPensionRows ? ' is-active' : ''}`}
              onClick={() => toggleIncomeFilter('pension')}
              aria-pressed={showPensionRows}
              data-testid="ir-filter-pension"
            >
              Pension
            </button>
            <button
              type="button"
              className={`ir-income-filter-btn${showFoncierRow ? ' is-active' : ''}`}
              onClick={() => toggleIncomeFilter('foncier')}
              aria-pressed={showFoncierRow}
              data-testid="ir-filter-foncier"
            >
              Foncier
            </button>
          </div>
        </div>
        <p className="ir-income-card__subtitle">Renseignez vos sources de revenus par catégorie pour affiner le calcul</p>
      </div>
      <div className="ir-card-divider sim-divider" />
      <table className={`ir-table ${status === 'single' ? 'ir-table-single' : ''}`} aria-label="Revenus imposables">
        <colgroup>
          <col style={{ width: '40%' }} />
          <col style={{ width: '30%' }} />
          <col style={{ width: '30%' }} />
        </colgroup>
        <thead>
          <tr>
            <th aria-label="Catégorie"></th>
            <th>Déclarant 1</th>
            <th>Déclarant 2</th>
          </tr>
        </thead>
        <tbody>
          <tr className="ir-divider-row"><td colSpan={3}><div className="ir-divider-row__inner" /></td></tr>
          <tr data-testid="ir-salary-row">
            <td>Traitements et salaires</td>
            <td>
              <IrAmountInput
                testId="ir-salary-d1-input"
                value={formatMoneyInput(incomes.d1.salaries)}
                onChange={(e) => updateIncome('d1', 'salaries', parseIntegerInput(e))}
              />
            </td>
            <td>
              <IrAmountInput
                testId="ir-salary-d2-input"
                value={formatMoneyInput(incomes.d2.salaries)}
                onChange={(e) => updateIncome('d2', 'salaries', parseIntegerInput(e))}
              />
            </td>
          </tr>
          {showTnsRows && (
            <tr>
              <td>Revenus des associés / gérants</td>
              <td>
                <IrAmountInput
                  value={formatMoneyInput(incomes.d1.associes62)}
                  onChange={(e) => updateIncome('d1', 'associes62', parseIntegerInput(e))}
                />
              </td>
              <td>
                <IrAmountInput
                  value={formatMoneyInput(incomes.d2.associes62)}
                  onChange={(e) => updateIncome('d2', 'associes62', parseIntegerInput(e))}
                />
              </td>
            </tr>
          )}
          <tr className="ir-row-title">
            <td>Frais réels ou abattement 10 %</td>
            <td>
              <div className="ir-inline-field-row">
                <IrSelect
                  style={{ flex: 1 }}
                  value={realMode.d1}
                  onChange={(v) =>
                    setRealModeState((m) => ({ ...m, d1: v as typeof realMode.d1 }))
                  }
                  options={[
                    { value: 'reels', label: 'FR' },
                    { value: 'abat10', label: '10%' },
                  ]}
                />
                {realMode.d1 === 'reels' ? (
                  <IrAmountInput
                    style={{ flex: 1 }}
                    value={formatMoneyInput(realExpenses.d1)}
                    onChange={(e) => {
                      setRealExpensesState((r) => ({ ...r, d1: parseIntegerInput(e) }));
                    }}
                  />
                ) : (
                  <IrAmountInput
                    style={{ flex: 1 }}
                    className="ir-table-input--readonly"
                    readOnly
                    value={formatMoneyInput(abat10SalD1)}
                  />
                )}
              </div>
            </td>
            <td>
              <div className="ir-inline-field-row">
                <IrSelect
                  style={{ flex: 1 }}
                  value={realMode.d2}
                  onChange={(v) =>
                    setRealModeState((m) => ({ ...m, d2: v as typeof realMode.d2 }))
                  }
                  options={[
                    { value: 'reels', label: 'FR' },
                    { value: 'abat10', label: '10%' },
                  ]}
                />
                {realMode.d2 === 'reels' ? (
                  <IrAmountInput
                    style={{ flex: 1 }}
                    value={formatMoneyInput(realExpenses.d2)}
                    onChange={(e) => {
                      setRealExpensesState((r) => ({ ...r, d2: parseIntegerInput(e) }));
                    }}
                  />
                ) : (
                  <IrAmountInput
                    style={{ flex: 1 }}
                    className="ir-table-input--readonly"
                    readOnly
                    value={formatMoneyInput(abat10SalD2)}
                  />
                )}
              </div>
            </td>
          </tr>
          <tr className="ir-divider-row"><td colSpan={3}><div className="ir-divider-row__inner" /></td></tr>
          {showTnsRows && (
            <tr>
              <td>BIC‑BNC‑BA imposables</td>
              <td>
                <IrAmountInput
                  value={formatMoneyInput(incomes.d1.bic)}
                  onChange={(e) => updateIncome('d1', 'bic', parseIntegerInput(e))}
                />
              </td>
              <td>
                <IrAmountInput
                  value={formatMoneyInput(incomes.d2.bic)}
                  onChange={(e) => updateIncome('d2', 'bic', parseIntegerInput(e))}
                />
              </td>
            </tr>
          )}
          <tr>
            <td>Autres revenus imposables</td>
            <td>
              <IrAmountInput
                value={formatMoneyInput(incomes.d1.autres)}
                onChange={(e) => updateIncome('d1', 'autres', parseIntegerInput(e))}
              />
            </td>
            <td>
              <IrAmountInput
                value={formatMoneyInput(incomes.d2.autres)}
                onChange={(e) => updateIncome('d2', 'autres', parseIntegerInput(e))}
              />
            </td>
          </tr>
          {(showPensionRows || showFoncierRow || isExpert) && (
            <tr className="ir-divider-row"><td colSpan={3}><div className="ir-divider-row__inner" /></td></tr>
          )}

          {showPensionRows && (
            <>
              <tr>
                <td>Pensions, retraites et rentes</td>
                <td>
                  <IrAmountInput
                    value={formatMoneyInput(incomes.d1.pensions)}
                    onChange={(e) => updateIncome('d1', 'pensions', parseIntegerInput(e))}
                  />
                </td>
                <td>
                  <IrAmountInput
                    value={formatMoneyInput(incomes.d2.pensions)}
                    onChange={(e) => updateIncome('d2', 'pensions', parseIntegerInput(e))}
                  />
                </td>
              </tr>
              <tr className="ir-row-title">
                <td>Abattement 10&nbsp;% pensions (foyer)</td>
                <td colSpan={2} style={{ textAlign: 'center' }}>
                  {euro0(abat10PensionsFoyer)}
                </td>
              </tr>
            </>
          )}

          {showPensionRows && (showFoncierRow || isExpert) && (
            <tr className="ir-divider-row"><td colSpan={3}><div className="ir-divider-row__inner" /></td></tr>
          )}

          {showFoncierRow && (
            <tr>
              <td>Revenus fonciers nets (PS a {fmtPct(psExceptionRate)} %)</td>
              <td colSpan={2}>
                <IrAmountInput
                  value={formatMoneyInput(incomes.fonciersFoyer || 0)}
                  onChange={(e) => {
                    setIncomes((prev) => ({ ...prev, fonciersFoyer: parseIntegerInput(e) }));
                  }}
                />
              </td>
            </tr>
          )}

          {isExpert && (
            <>
              {showFoncierRow && (
                <tr className="ir-divider-row"><td colSpan={3}><div className="ir-divider-row__inner" /></td></tr>
              )}
              <tr>
                <td>RCM soumis aux PS a {fmtPct(psGeneralRate)} %</td>
                <td colSpan={2}>
                  <IrAmountInput
                    value={formatMoneyInput(incomes.capital?.withPs || 0)}
                    onChange={(e) => updateIncome('capital', 'withPs', parseIntegerInput(e))}
                  />
                </td>
              </tr>
              <tr>
                <td>RCM non soumis aux PS</td>
                <td colSpan={2}>
                  <IrAmountInput
                    value={formatMoneyInput(incomes.capital?.withoutPs || 0)}
                    onChange={(e) => updateIncome('capital', 'withoutPs', parseIntegerInput(e))}
                  />
                </td>
              </tr>
              <tr>
                <td>Option d&apos;imposition des RCM</td>
                <td colSpan={2}>
                  <IrSelect
                    value={capitalMode}
                    onChange={(mode) => setCapitalMode(mode as IrFormSectionProps['capitalMode'])}
                    options={[
                      { value: 'pfu', label: `PFU ${fmtPct(pfuRateIR)} %` },
                      { value: 'bareme', label: "Barème de l'IR (abattement 40 %)" },
                    ]}
                  />
                </td>
              </tr>
              <tr className="ir-divider-row"><td colSpan={3}><div className="ir-divider-row__inner" /></td></tr>
              <tr className="ir-row-title">
                <td>Déductions (pensions alimentaires, etc.)</td>
                <td colSpan={2}>
                  <IrAmountInput
                    value={formatMoneyInput(deductions)}
                    onChange={(e) => setDeductions(parseIntegerInput(e))}
                  />
                </td>
              </tr>
              <tr className="ir-row-title">
                <td>Réductions / crédits d&apos;impôt</td>
                <td colSpan={2}>
                  <IrAmountInput
                    value={formatMoneyInput(credits)}
                    onChange={(e) => setCredits(parseIntegerInput(e))}
                  />
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
