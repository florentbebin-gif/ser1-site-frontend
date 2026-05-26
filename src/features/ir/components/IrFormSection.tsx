import { SimActionButton } from '@/components/ui/sim';
import { IconUsers } from '@/icons/ui';
import { IrSelect } from './IrSelect';
import type { IrFormSectionProps } from './irTypes';
import { IrIncomeSection } from './IrIncomeSection';

export function IrFormSection({
  status,
  setStatus,
  isIsolated,
  setIsIsolated,
  setIncomes,
  setParts,
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
  children,
  setChildren,
  incomeFilters,
  setIncomeFilters,
}: IrFormSectionProps) {
  return (
    <div className="ir-left premium-section">
      <div className="ir-table-wrapper premium-card premium-card--guide sim-card--guide">
        <div className="ir-situation-card__header sim-card__header sim-card__header--bleed">
          <div className="ir-situation-card__title sim-card__title sim-card__title-row">
            <div className="ir-section-icon-wrapper sim-card__icon">
              <IconUsers />
            </div>
            Situation familiale
          </div>
        </div>
        <div className="ir-card-divider sim-divider" />
        <div className="ir-guide-card__grid">
          <div className="ir-field premium-field" data-testid="ir-situation-field">
            <label htmlFor="ir-situation-select">Situation familiale</label>
            <IrSelect
              id="ir-situation-select"
              value={status ?? ''}
              placeholder="Sélectionner une situation…"
              testId="ir-situation-select"
              onChange={(newStatus) => {
                setStatus(newStatus as IrFormSectionProps['status']);
                if (newStatus === 'couple') {
                  setIsIsolated(false);
                } else {
                  setIncomes((prev) => ({
                    ...prev,
                    d2: {
                      salaries: 0,
                      associes62: 0,
                      pensions: 0,
                      bic: 0,
                      fonciers: 0,
                      autres: 0,
                    },
                  }));
                  setRealModeState((prev) => ({ ...prev, d2: 'abat10' }));
                  setRealExpensesState((prev) => ({ ...prev, d2: 0 }));
                }
                setParts(0);
              }}
              options={[
                { value: 'single', label: 'Célibataire / Veuf / Divorcé' },
                { value: 'couple', label: 'Marié / Pacsé' },
              ]}
            />
            {status === 'single' && (
              <label className="ir-checkbox-label">
                <input
                  type="checkbox"
                  className="ir-checkbox"
                  checked={isIsolated}
                  onChange={(e) => setIsIsolated(e.target.checked)}
                />
                Parent isolé
              </label>
            )}
          </div>

          <div className="ir-children-zone">
            <SimActionButton
              variant="add"
              mode="text"
              label="Ajouter un enfant"
              onClick={() => setChildren((c) => [...c, { id: Date.now(), mode: 'charge' }])}
            />
            <div className="ir-children-list">
              {children.map((child, idx) => (
                <div key={child.id} className="ir-child-row">
                  <span className="ir-child-row__label">E{idx + 1}</span>
                  <IrSelect
                    style={{ flex: 1 }}
                    value={child.mode}
                    onChange={(v) =>
                      setChildren((list) =>
                        list.map((c) =>
                          c.id === child.id ? { ...c, mode: v as typeof child.mode } : c,
                        ),
                      )
                    }
                    options={[
                      { value: 'charge', label: 'À charge' },
                      { value: 'shared', label: 'Garde alternée' },
                    ]}
                  />
                  <SimActionButton
                    variant="delete"
                    mode="icon"
                    label="Supprimer"
                    onClick={() => setChildren((list) => list.filter((c) => c.id !== child.id))}
                    ariaLabel={`Supprimer enfant ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div id="ir-revenus" data-sim-step-id="ir-revenus">
        <IrIncomeSection
          status={status}
          setIncomes={setIncomes}
          incomes={incomes}
          updateIncome={updateIncome}
          realMode={realMode}
          setRealModeState={setRealModeState}
          realExpenses={realExpenses}
          setRealExpensesState={setRealExpensesState}
          abat10SalD1={abat10SalD1}
          abat10SalD2={abat10SalD2}
          psGeneralRate={psGeneralRate}
          psExceptionRate={psExceptionRate}
          fmtPct={fmtPct}
          capitalMode={capitalMode}
          setCapitalMode={setCapitalMode}
          pfuRateIR={pfuRateIR}
          deductions={deductions}
          setDeductions={setDeductions}
          credits={credits}
          setCredits={setCredits}
          abat10PensionsFoyer={abat10PensionsFoyer}
          euro0={euro0}
          isExpert={isExpert}
          incomeFilters={incomeFilters}
          setIncomeFilters={setIncomeFilters}
        />
      </div>
    </div>
  );
}
