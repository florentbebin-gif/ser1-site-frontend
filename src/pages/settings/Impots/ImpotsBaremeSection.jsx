import React from 'react';
import SettingsTable from '@/components/settings/SettingsTable';
import { numberOrEmpty } from '@/utils/settingsHelpers.js';

export default function ImpotsBaremeSection({
  incomeTax,
  updateField,
  updateIncomeScale,
  isAdmin,
  openSection,
  setOpenSection,
}) {
  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="impots-header-bareme"
        aria-expanded={openSection === 'bareme'}
        aria-controls="impots-panel-bareme"
        onClick={() => setOpenSection(openSection === 'bareme' ? null : 'bareme')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Barème de l’impôt sur le revenu
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'bareme' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'bareme' && (
        <div
          className="fisc-acc-body"
          id="impots-panel-bareme"
          role="region"
          aria-labelledby="impots-header-bareme"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 8 }}>
            Barème progressif par tranches (taux et retraitement) pour le
            barème actuel et celui de l’année précédente.
          </p>

          <div className="income-tax-columns">
            {/* Colonne 2025 / revenus 2024 */}
            <div className="income-tax-col">
              <div className="settings-field-row" style={{ marginBottom: 10 }}>
                <label style={{ fontWeight: 600 }}>Barème</label>
                <input
                  type="text"
                  value={incomeTax.currentYearLabel || ''}
                  onChange={(e) =>
                    updateField(['incomeTax', 'currentYearLabel'], e.target.value)
                  }
                  disabled={!isAdmin}
                  style={{ width: 220, textAlign: 'left' }}
                  placeholder="Ex: 2026 (revenus 2025)"
                />
              </div>

              {/* Tableau barème 2025 */}
              <SettingsTable
                columns={[
                  { key: 'from', header: 'De' },
                  { key: 'to', header: 'À' },
                  { key: 'rate', header: 'Taux\u00a0%', step: '0.01', className: 'taux-col' },
                ]}
                rows={incomeTax.scaleCurrent}
                onCellChange={(idx, key, value) =>
                  updateIncomeScale('scaleCurrent', idx, key, value)
                }
                disabled={!isAdmin}
              />

              {/* Blocs sous le barème 2025 */}
              <div className="income-tax-extra">
                {/* 1. Plafond du quotient familial */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">
                    Plafond du quotient familial
                  </div>
                  <div className="settings-field-row">
                    <label>Par 1/2 part supplémentaire</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.quotientFamily.current.plafondPartSup
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'quotientFamily', 'current', 'plafondPartSup'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Parent isolé (2 premières parts)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.quotientFamily.current
                          .plafondParentIsoléDeuxPremièresParts
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'incomeTax',
                            'quotientFamily',
                            'current',
                            'plafondParentIsoléDeuxPremièresParts',
                          ],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                </div>

                {/* 2. Décote */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">Décote</div>
                  <div className="settings-field-row">
                    <label>Déclenchement célibataire</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.decote.current.triggerSingle
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'current', 'triggerSingle'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Déclenchement couple</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.decote.current.triggerCouple
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'current', 'triggerCouple'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Montant célibataire</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.decote.current.amountSingle
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'current', 'amountSingle'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Montant couple</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.decote.current.amountCouple
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'current', 'amountCouple'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Taux de la décote</label>
                    <input
                      type="number"
                      step="0.01"
                      value={numberOrEmpty(
                        incomeTax.decote.current.ratePercent
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'current', 'ratePercent'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>%</span>
                  </div>
                </div>

                {/* 3. Abattement 10 % */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">Abattement 10&nbsp;%</div>
                  <div className="settings-field-row">
                    <label>Plafond</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.abat10.current.plafond)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'current', 'plafond'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plancher</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.abat10.current.plancher)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'current', 'plancher'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                </div>

                {/* 4. Abattement 10 % pensions retraite */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">
                    Abattement 10&nbsp;% pensions retraite
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.abat10.retireesCurrent.plafond
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'retireesCurrent', 'plafond'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plancher</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.abat10.retireesCurrent.plancher
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'retireesCurrent', 'plancher'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Colonne 2024 / revenus 2023 */}
            <div className="income-tax-col income-tax-col-right">
              <div className="settings-field-row" style={{ marginBottom: 10 }}>
                <label style={{ fontWeight: 600 }}>Barème</label>
                <input
                  type="text"
                  value={incomeTax.previousYearLabel || ''}
                  onChange={(e) =>
                    updateField(['incomeTax', 'previousYearLabel'], e.target.value)
                  }
                  disabled={!isAdmin}
                  style={{ width: 220, textAlign: 'left' }}
                  placeholder="Ex: 2025 (revenus 2024)"
                />
              </div>

              {/* Tableau barème 2024 */}
              <SettingsTable
                columns={[
                  { key: 'from', header: 'De' },
                  { key: 'to', header: 'À' },
                  { key: 'rate', header: 'Taux\u00a0%', step: '0.01', className: 'taux-col' },
                ]}
                rows={incomeTax.scalePrevious}
                onCellChange={(idx, key, value) =>
                  updateIncomeScale('scalePrevious', idx, key, value)
                }
                disabled={!isAdmin}
              />

              {/* Blocs sous le barème 2024 */}
              <div className="income-tax-extra">
                {/* 1. Plafond du quotient familial */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">
                    Plafond du quotient familial
                  </div>
                  <div className="settings-field-row">
                    <label>Par 1/2 part supplémentaire</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.quotientFamily.previous.plafondPartSup
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'quotientFamily', 'previous', 'plafondPartSup'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Parent isolé (2 premières parts)</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.quotientFamily.previous
                          .plafondParentIsoléDeuxPremièresParts
                      )}
                      onChange={(e) =>
                        updateField(
                          [
                            'incomeTax',
                            'quotientFamily',
                            'previous',
                            'plafondParentIsoléDeuxPremièresParts',
                          ],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                </div>

                {/* 2. Décote */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">Décote</div>
                  <div className="settings-field-row">
                    <label>Déclenchement célibataire</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.decote.previous.triggerSingle
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'previous', 'triggerSingle'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Déclenchement couple</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.decote.previous.triggerCouple
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'previous', 'triggerCouple'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Montant célibataire</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.decote.previous.amountSingle
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'previous', 'amountSingle'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Montant couple</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.decote.previous.amountCouple
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'previous', 'amountCouple'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Taux de la décote</label>
                    <input
                      type="number"
                      step="0.01"
                      value={numberOrEmpty(
                        incomeTax.decote.previous.ratePercent
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'decote', 'previous', 'ratePercent'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>%</span>
                  </div>
                </div>

                {/* 3. Abattement 10 % */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">Abattement 10&nbsp;%</div>
                  <div className="settings-field-row">
                    <label>Plafond</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.abat10.previous.plafond)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'previous', 'plafond'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plancher</label>
                    <input
                      type="number"
                      value={numberOrEmpty(incomeTax.abat10.previous.plancher)}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'previous', 'plancher'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                </div>

                {/* 4. Abattement 10 % pensions retraite */}
                <div className="income-tax-block">
                  <div className="income-tax-block-title">
                    Abattement 10&nbsp;% pensions retraite
                  </div>
                  <div className="settings-field-row">
                    <label>Plafond</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.abat10.retireesPrevious.plafond
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'retireesPrevious', 'plafond'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                  <div className="settings-field-row">
                    <label>Plancher</label>
                    <input
                      type="number"
                      value={numberOrEmpty(
                        incomeTax.abat10.retireesPrevious.plancher
                      )}
                      onChange={(e) =>
                        updateField(
                          ['incomeTax', 'abat10', 'retireesPrevious', 'plancher'],
                          e.target.value === '' ? null : Number(e.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>€</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
