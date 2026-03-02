import React from 'react';
import { IrSelect } from './IrSelect';

export function IrFormSection({
  status,
  setStatus,
  isIsolated,
  setIsIsolated,
  setIncomes,
  setParts,
  incomes,
  updateIncome,
  formatMoneyInput,
  realMode,
  setRealModeState,
  realExpenses,
  setRealExpensesState,
  abat10SalD1,
  abat10SalD2,
  psPatrimonyRate,
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
}) {
  return (
    <div className="ir-left premium-section">
      <div className="ir-table-wrapper premium-card premium-card--guide">
        <div className="ir-guide-card__grid">
          {/* Colonne gauche : Situation familiale */}
          <div className="ir-field premium-field" data-testid="ir-situation-field">
            <label>Situation familiale</label>
            <IrSelect
              value={status}
              testId="ir-situation-select"
              onChange={(newStatus) => {
                setStatus(newStatus);
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

          {/* Colonne droite : Gestion des enfants */}
          <div className="ir-children-zone">
            <button
              type="button"
              className="ir-child-add-btn"
              onClick={() => setChildren((c) => [...c, { id: Date.now(), mode: 'charge' }])}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Ajouter un enfant
            </button>
            <div className="ir-children-list">
              {children.map((child, idx) => (
                <div key={child.id} className="ir-child-row">
                  <span className="ir-child-row__label">E{idx + 1}</span>
                  <IrSelect
                    style={{ flex: 1 }}
                    value={child.mode}
                    onChange={(v) =>
                      setChildren((list) =>
                        list.map((c) => (c.id === child.id ? { ...c, mode: v } : c)),
                      )
                    }
                    options={[
                      { value: 'charge', label: 'À charge' },
                      { value: 'shared', label: 'Garde alternée' },
                    ]}
                  />
                  <button
                    type="button"
                    className="ir-child-remove-btn"
                    onClick={() => setChildren((list) => list.filter((c) => c.id !== child.id))}
                    aria-label={`Supprimer enfant ${idx + 1}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ir-table-wrapper premium-card premium-card--guide">
        <div className="ir-income-card__header">
          <div className="ir-income-card__title">
            <div className="ir-section-icon-wrapper ir-section-icon-wrapper--card">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="12" y1="3" x2="12" y2="21" />
              </svg>
            </div>
            Revenus imposables
          </div>
          <p className="ir-income-card__subtitle">Renseignez vos sources de revenus par catégorie pour affiner le calcul</p>
        </div>
        <div className="ir-card-divider" />
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
            <tr data-testid="ir-salary-row">
              <td>Traitements et salaires</td>
              <td>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 €"
                  data-testid="ir-salary-d1-input"
                  value={formatMoneyInput(incomes.d1.salaries)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    updateIncome('d1', 'salaries', raw === '' ? 0 : Number(raw));
                  }}
                />
              </td>
              <td>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 €"
                  data-testid="ir-salary-d2-input"
                  value={formatMoneyInput(incomes.d2.salaries)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    updateIncome('d2', 'salaries', raw === '' ? 0 : Number(raw));
                  }}
                />
              </td>
            </tr>
            <tr>
              <td>Revenus des associés / gérants</td>
              <td>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 €"
                  value={formatMoneyInput(incomes.d1.associes62)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    updateIncome('d1', 'associes62', raw === '' ? 0 : Number(raw));
                  }}
                />
              </td>
              <td>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 €"
                  value={formatMoneyInput(incomes.d2.associes62)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    updateIncome('d2', 'associes62', raw === '' ? 0 : Number(raw));
                  }}
                />
              </td>
            </tr>
            <tr className="ir-row-title">
              <td>Frais réels ou abattement 10 %</td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  <IrSelect
                    style={{ flex: 1 }}
                    value={realMode.d1}
                    onChange={(v) => setRealModeState((m) => ({ ...m, d1: v }))}
                    options={[
                      { value: 'reels', label: 'FR' },
                      { value: 'abat10', label: '10%' },
                    ]}
                  />
                  {realMode.d1 === 'reels' ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      style={{ flex: 1 }}
                      value={formatMoneyInput(realExpenses.d1)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        setRealExpensesState((r) => ({ ...r, d1: raw === '' ? 0 : Number(raw) }));
                      }}
                    />
                  ) : (
                    <input type="text" style={{ flex: 1, background: '#FFFFFF' }} readOnly value={formatMoneyInput(abat10SalD1)} />
                  )}
                </div>
              </td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  <IrSelect
                    style={{ flex: 1 }}
                    value={realMode.d2}
                    onChange={(v) => setRealModeState((m) => ({ ...m, d2: v }))}
                    options={[
                      { value: 'reels', label: 'FR' },
                      { value: 'abat10', label: '10%' },
                    ]}
                  />
                  {realMode.d2 === 'reels' ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      style={{ flex: 1 }}
                      value={formatMoneyInput(realExpenses.d2)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        setRealExpensesState((r) => ({ ...r, d2: raw === '' ? 0 : Number(raw) }));
                      }}
                    />
                  ) : (
                    <input type="text" style={{ flex: 1, background: '#FFFFFF' }} readOnly value={formatMoneyInput(abat10SalD2)} />
                  )}
                </div>
              </td>
            </tr>
            {/* ── Divider ── */}
            <tr className="ir-divider-row"><td colSpan={3}><div className="ir-divider-row__inner" /></td></tr>
            <tr>
              <td>BIC&#8209;BNC&#8209;BA imposables</td>
              <td>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 €"
                  value={formatMoneyInput(incomes.d1.bic)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    updateIncome('d1', 'bic', raw === '' ? 0 : Number(raw));
                  }}
                />
              </td>
              <td>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 €"
                  value={formatMoneyInput(incomes.d2.bic)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    updateIncome('d2', 'bic', raw === '' ? 0 : Number(raw));
                  }}
                />
              </td>
            </tr>
            <tr>
              <td>Autres revenus imposables</td>
              <td>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 €"
                  value={formatMoneyInput(incomes.d1.autres)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    updateIncome('d1', 'autres', raw === '' ? 0 : Number(raw));
                  }}
                />
              </td>
              <td>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 €"
                  value={formatMoneyInput(incomes.d2.autres)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    updateIncome('d2', 'autres', raw === '' ? 0 : Number(raw));
                  }}
                />
              </td>
            </tr>
            {/* ── Divider ── */}
            <tr className="ir-divider-row"><td colSpan={3}><div className="ir-divider-row__inner" /></td></tr>
            <tr>
              <td>Pensions, retraites et rentes</td>
              <td>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 €"
                  value={formatMoneyInput(incomes.d1.pensions)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    updateIncome('d1', 'pensions', raw === '' ? 0 : Number(raw));
                  }}
                />
              </td>
              <td>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 €"
                  value={formatMoneyInput(incomes.d2.pensions)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    updateIncome('d2', 'pensions', raw === '' ? 0 : Number(raw));
                  }}
                />
              </td>
            </tr>
            <tr className="ir-row-title">
              <td>Abattement 10&nbsp;% pensions (foyer)</td>
              <td colSpan={2} style={{ textAlign: 'center' }}>
                {euro0(abat10PensionsFoyer)}
              </td>
            </tr>

            {/* ── Divider ── */}
            <tr className="ir-divider-row"><td colSpan={3}><div className="ir-divider-row__inner" /></td></tr>
            <tr>
              <td>Revenus fonciers nets</td>
              <td colSpan={2}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0 €"
                  value={formatMoneyInput(incomes.fonciersFoyer || 0)}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    const val = raw === '' ? 0 : Number(raw);
                    setIncomes((prev) => ({ ...prev, fonciersFoyer: val }));
                  }}
                />
              </td>
            </tr>

            {isExpert && (
              <>
                {/* ── Divider ── */}
                <tr className="ir-divider-row"><td colSpan={3}><div className="ir-divider-row__inner" /></td></tr>
                <tr>
                  <td>RCM soumis aux PS à {fmtPct(psPatrimonyRate)} %</td>
                  <td colSpan={2}>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(incomes.capital.withPs)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        updateIncome('capital', 'withPs', raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                </tr>

                <tr>
                  <td>RCM non soumis aux PS à {fmtPct(psPatrimonyRate)} %</td>
                  <td colSpan={2}>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(incomes.capital.withoutPs)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        updateIncome('capital', 'withoutPs', raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Option d&apos;imposition des RCM</td>
                  <td colSpan={2}>
                    <IrSelect
                      value={capitalMode}
                      onChange={setCapitalMode}
                      options={[
                        { value: 'pfu', label: `PFU ${fmtPct(pfuRateIR)} %` },
                        { value: 'bareme', label: "Barème de l'IR (abattement 40 %)" },
                      ]}
                    />
                  </td>
                </tr>

                {/* ── Divider ── */}
                <tr className="ir-divider-row"><td colSpan={3}><div className="ir-divider-row__inner" /></td></tr>
                <tr>
                  <td>Déductions (pensions alimentaires, etc.)</td>
                  <td colSpan={2}>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(deductions)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        setDeductions(raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Réductions / crédits d&apos;impôt</td>
                  <td colSpan={2}>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(credits)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        setCredits(raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
