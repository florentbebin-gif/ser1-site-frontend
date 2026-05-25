import { SimAmountInputEuro } from '@/components/ui/sim';
import { IrSelect } from './IrSelect';
import type { IrFormSectionProps } from './irTypes';

type IrIncomeSectionProps = Pick<
  IrFormSectionProps,
  | 'status'
  | 'setIncomes'
  | 'incomes'
  | 'updateIncome'
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

interface IrEuroFieldProps {
  value: number;
  onChange?: (_value: number) => void;
  readOnly?: boolean;
  testId?: string;
  className?: string;
}

function IrEuroField({
  value,
  onChange = () => {},
  readOnly = false,
  testId,
  className,
}: IrEuroFieldProps) {
  return (
    <SimAmountInputEuro
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      testId={testId}
      fieldClassName={`ir-table-input${className ? ` ${className}` : ''}`}
      rowClassName="ir-table-input__row"
      unitClassName="ir-table-input__unit"
    />
  );
}

export function IrIncomeSection({
  status,
  setIncomes,
  incomes,
  updateIncome,
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
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
            </div>
            Revenus imposables
          </div>
          <div
            className="ir-income-filters"
            role="group"
            aria-label="Filtres des lignes de revenus imposables"
          >
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
        <p className="ir-income-card__subtitle">
          Renseignez vos sources de revenus par catégorie pour affiner le calcul
        </p>
      </div>
      <div className="ir-card-divider sim-divider" />
      <table
        className={`ir-table ${status === 'single' ? 'ir-table-single' : ''}`}
        aria-label="Revenus imposables"
      >
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
          <tr className="ir-divider-row">
            <td colSpan={3}>
              <div className="ir-divider-row__inner" />
            </td>
          </tr>
          <tr data-testid="ir-salary-row">
            <td>Traitements et salaires</td>
            <td>
              <IrEuroField
                testId="ir-salary-d1-input"
                value={incomes.d1.salaries ?? 0}
                onChange={(value) => updateIncome('d1', 'salaries', value)}
              />
            </td>
            <td>
              <IrEuroField
                testId="ir-salary-d2-input"
                value={incomes.d2.salaries ?? 0}
                onChange={(value) => updateIncome('d2', 'salaries', value)}
              />
            </td>
          </tr>
          {showTnsRows && (
            <tr>
              <td>Revenus des associés / gérants</td>
              <td>
                <IrEuroField
                  value={incomes.d1.associes62 ?? 0}
                  onChange={(value) => updateIncome('d1', 'associes62', value)}
                />
              </td>
              <td>
                <IrEuroField
                  value={incomes.d2.associes62 ?? 0}
                  onChange={(value) => updateIncome('d2', 'associes62', value)}
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
                  onChange={(v) => setRealModeState((m) => ({ ...m, d1: v as typeof realMode.d1 }))}
                  options={[
                    { value: 'reels', label: 'FR' },
                    { value: 'abat10', label: '10%' },
                  ]}
                />
                {realMode.d1 === 'reels' ? (
                  <IrEuroField
                    value={realExpenses.d1}
                    onChange={(e) => {
                      setRealExpensesState((r) => ({ ...r, d1: e }));
                    }}
                  />
                ) : (
                  <IrEuroField className="ir-table-input--readonly" readOnly value={abat10SalD1} />
                )}
              </div>
            </td>
            <td>
              <div className="ir-inline-field-row">
                <IrSelect
                  style={{ flex: 1 }}
                  value={realMode.d2}
                  onChange={(v) => setRealModeState((m) => ({ ...m, d2: v as typeof realMode.d2 }))}
                  options={[
                    { value: 'reels', label: 'FR' },
                    { value: 'abat10', label: '10%' },
                  ]}
                />
                {realMode.d2 === 'reels' ? (
                  <IrEuroField
                    value={realExpenses.d2}
                    onChange={(e) => {
                      setRealExpensesState((r) => ({ ...r, d2: e }));
                    }}
                  />
                ) : (
                  <IrEuroField className="ir-table-input--readonly" readOnly value={abat10SalD2} />
                )}
              </div>
            </td>
          </tr>
          <tr className="ir-divider-row">
            <td colSpan={3}>
              <div className="ir-divider-row__inner" />
            </td>
          </tr>
          {showTnsRows && (
            <tr>
              <td>BIC‑BNC‑BA imposables</td>
              <td>
                <IrEuroField
                  value={incomes.d1.bic ?? 0}
                  onChange={(value) => updateIncome('d1', 'bic', value)}
                />
              </td>
              <td>
                <IrEuroField
                  value={incomes.d2.bic ?? 0}
                  onChange={(value) => updateIncome('d2', 'bic', value)}
                />
              </td>
            </tr>
          )}
          <tr>
            <td>Autres revenus imposables</td>
            <td>
              <IrEuroField
                value={incomes.d1.autres ?? 0}
                onChange={(value) => updateIncome('d1', 'autres', value)}
              />
            </td>
            <td>
              <IrEuroField
                value={incomes.d2.autres ?? 0}
                onChange={(value) => updateIncome('d2', 'autres', value)}
              />
            </td>
          </tr>
          {(showPensionRows || showFoncierRow || isExpert) && (
            <tr className="ir-divider-row">
              <td colSpan={3}>
                <div className="ir-divider-row__inner" />
              </td>
            </tr>
          )}

          {showPensionRows && (
            <>
              <tr>
                <td>Pensions, retraites et rentes</td>
                <td>
                  <IrEuroField
                    value={incomes.d1.pensions ?? 0}
                    onChange={(value) => updateIncome('d1', 'pensions', value)}
                  />
                </td>
                <td>
                  <IrEuroField
                    value={incomes.d2.pensions ?? 0}
                    onChange={(value) => updateIncome('d2', 'pensions', value)}
                  />
                </td>
              </tr>
              <tr className="ir-row-title">
                <td>Abattement 10&nbsp;% pensions (foyer)</td>
                <td colSpan={2} className="ir-td--center">
                  {euro0(abat10PensionsFoyer)}
                </td>
              </tr>
            </>
          )}

          {showPensionRows && (showFoncierRow || isExpert) && (
            <tr className="ir-divider-row">
              <td colSpan={3}>
                <div className="ir-divider-row__inner" />
              </td>
            </tr>
          )}

          {showFoncierRow && (
            <tr>
              <td>Revenus fonciers nets (PS a {fmtPct(psExceptionRate)} %)</td>
              <td colSpan={2}>
                <IrEuroField
                  value={incomes.fonciersFoyer || 0}
                  onChange={(e) => {
                    setIncomes((prev) => ({ ...prev, fonciersFoyer: e }));
                  }}
                />
              </td>
            </tr>
          )}

          {isExpert && (
            <>
              {showFoncierRow && (
                <tr className="ir-divider-row">
                  <td colSpan={3}>
                    <div className="ir-divider-row__inner" />
                  </td>
                </tr>
              )}
              <tr>
                <td>RCM soumis aux PS a {fmtPct(psGeneralRate)} %</td>
                <td colSpan={2}>
                  <IrEuroField
                    value={incomes.capital?.withPs || 0}
                    onChange={(value) => updateIncome('capital', 'withPs', value)}
                  />
                </td>
              </tr>
              <tr>
                <td>RCM non soumis aux PS</td>
                <td colSpan={2}>
                  <IrEuroField
                    value={incomes.capital?.withoutPs || 0}
                    onChange={(value) => updateIncome('capital', 'withoutPs', value)}
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
              <tr className="ir-divider-row">
                <td colSpan={3}>
                  <div className="ir-divider-row__inner" />
                </td>
              </tr>
              <tr className="ir-row-title">
                <td>Déductions (pensions alimentaires, etc.)</td>
                <td colSpan={2}>
                  <IrEuroField value={deductions} onChange={(value) => setDeductions(value)} />
                </td>
              </tr>
              <tr className="ir-row-title">
                <td>Réductions / crédits d&apos;impôt</td>
                <td colSpan={2}>
                  <IrEuroField value={credits} onChange={(value) => setCredits(value)} />
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  );
}
