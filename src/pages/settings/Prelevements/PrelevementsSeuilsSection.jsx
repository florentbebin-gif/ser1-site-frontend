import React from 'react';
import { numberOrEmpty } from '@/utils/settingsHelpers.js';

export default function PrelevementsSeuilsSection({
  labels,
  retirementThresholds,
  updateField,
  isAdmin,
  openSection,
  setOpenSection,
}) {
  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="prelev-header-seuils"
        aria-expanded={openSection === 'seuils'}
        aria-controls="prelev-panel-seuils"
        onClick={() => setOpenSection(openSection === 'seuils' ? null : 'seuils')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Seuils de revenus pour la CSG, la CRDS et la CASA (RFR)
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'seuils' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'seuils' && (
        <div
          className="fisc-acc-body"
          id="prelev-panel-seuils"
          role="region"
          aria-labelledby="prelev-header-seuils"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 12 }}>
            Seuils de revenu fiscal de référence (RFR) utilisés pour déterminer
            l&apos;exonération ou l&apos;assujettissement aux taux réduit, médian
            ou normal de CSG sur les pensions de retraite. Ces seuils s&apos;appliquent
            aussi pour la CRDS et la CASA. Les montants sont indiqués pour{' '}
            <strong>1 part</strong>, avec une majoration par{' '}
            <strong>quart de part supplémentaire</strong>.
          </p>

          <div className="tax-two-cols">
            {/* Colonne N (ex: 2025) */}
            <div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {labels.currentYearLabel}
              </div>

              {/* Métropole */}
              <div style={{ fontWeight: 500, marginTop: 8, marginBottom: 4 }}>
                Résidence en métropole
              </div>
              <div className="settings-field-row">
                <label>Plafond exonération (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.metropole.rfrMaxExemption1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'metropole',
                        'rfrMaxExemption1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Plafond taux réduit (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.metropole.rfrMaxReduced1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'metropole',
                        'rfrMaxReduced1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Plafond taux médian (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.metropole.rfrMaxMedian1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'metropole',
                        'rfrMaxMedian1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>

              <div className="settings-field-row">
                <label>Majoration par quart – exonération</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.metropole.incrementQuarterExemption
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'metropole',
                        'incrementQuarterExemption',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Majoration par quart – taux réduit</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.metropole.incrementQuarterReduced
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'metropole',
                        'incrementQuarterReduced',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Majoration par quart – taux médian</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.metropole.incrementQuarterMedian
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'metropole',
                        'incrementQuarterMedian',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>

              {/* GMR */}
              <div style={{ fontWeight: 500, marginTop: 16, marginBottom: 4 }}>
                Résidence en Martinique, Guadeloupe, Réunion, Saint-Barthélemy,
                Saint-Martin
              </div>
              <div className="settings-field-row">
                <label>Plafond exonération (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.gmr.rfrMaxExemption1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'gmr',
                        'rfrMaxExemption1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Plafond taux réduit (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.gmr.rfrMaxReduced1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'gmr',
                        'rfrMaxReduced1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Plafond taux médian (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.gmr.rfrMaxMedian1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'gmr',
                        'rfrMaxMedian1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>

              <div className="settings-field-row">
                <label>Majoration par quart – exonération</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.gmr.incrementQuarterExemption
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'gmr',
                        'incrementQuarterExemption',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Majoration par quart – taux réduit</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.gmr.incrementQuarterReduced
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'gmr',
                        'incrementQuarterReduced',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Majoration par quart – taux médian</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.gmr.incrementQuarterMedian
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'gmr',
                        'incrementQuarterMedian',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>

              {/* Guyane */}
              <div style={{ fontWeight: 500, marginTop: 16, marginBottom: 4 }}>
                Résidence en Guyane
              </div>
              <div className="settings-field-row">
                <label>Plafond exonération (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.guyane.rfrMaxExemption1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'guyane',
                        'rfrMaxExemption1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Plafond taux réduit (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.guyane.rfrMaxReduced1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'guyane',
                        'rfrMaxReduced1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Plafond taux médian (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.guyane.rfrMaxMedian1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'guyane',
                        'rfrMaxMedian1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>

              <div className="settings-field-row">
                <label>Majoration par quart – exonération</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.guyane.incrementQuarterExemption
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'guyane',
                        'incrementQuarterExemption',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Majoration par quart – taux réduit</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.guyane.incrementQuarterReduced
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'guyane',
                        'incrementQuarterReduced',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Majoration par quart – taux médian</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.current.guyane.incrementQuarterMedian
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'current',
                        'guyane',
                        'incrementQuarterMedian',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
            </div>

            {/* Colonne N-1 (ex: 2024) */}
            <div className="income-tax-col-right">
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {labels.previousYearLabel}
              </div>

              {/* Métropole */}
              <div style={{ fontWeight: 500, marginTop: 8, marginBottom: 4 }}>
                Résidence en métropole
              </div>
              <div className="settings-field-row">
                <label>Plafond exonération (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.metropole.rfrMaxExemption1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'metropole',
                        'rfrMaxExemption1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Plafond taux réduit (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.metropole.rfrMaxReduced1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'metropole',
                        'rfrMaxReduced1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Plafond taux médian (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.metropole.rfrMaxMedian1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'metropole',
                        'rfrMaxMedian1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>

              <div className="settings-field-row">
                <label>Majoration par quart – exonération</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.metropole.incrementQuarterExemption
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'metropole',
                        'incrementQuarterExemption',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Majoration par quart – taux réduit</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.metropole.incrementQuarterReduced
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'metropole',
                        'incrementQuarterReduced',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Majoration par quart – taux médian</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.metropole.incrementQuarterMedian
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'metropole',
                        'incrementQuarterMedian',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>

              {/* GMR */}
              <div style={{ fontWeight: 500, marginTop: 16, marginBottom: 4 }}>
                Résidence en Martinique, Guadeloupe, Réunion, Saint-Barthélemy,
                Saint-Martin
              </div>
              <div className="settings-field-row">
                <label>Plafond exonération (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.gmr.rfrMaxExemption1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'gmr',
                        'rfrMaxExemption1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Plafond taux réduit (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.gmr.rfrMaxReduced1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'gmr',
                        'rfrMaxReduced1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Plafond taux médian (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.gmr.rfrMaxMedian1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'gmr',
                        'rfrMaxMedian1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>

              <div className="settings-field-row">
                <label>Majoration par quart – exonération</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.gmr.incrementQuarterExemption
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'gmr',
                        'incrementQuarterExemption',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Majoration par quart – taux réduit</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.gmr.incrementQuarterReduced
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'gmr',
                        'incrementQuarterReduced',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Majoration par quart – taux médian</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.gmr.incrementQuarterMedian
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'gmr',
                        'incrementQuarterMedian',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>

              {/* Guyane */}
              <div style={{ fontWeight: 500, marginTop: 16, marginBottom: 4 }}>
                Résidence en Guyane
              </div>
              <div className="settings-field-row">
                <label>Plafond exonération (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.guyane.rfrMaxExemption1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'guyane',
                        'rfrMaxExemption1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Plafond taux réduit (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.guyane.rfrMaxReduced1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'guyane',
                        'rfrMaxReduced1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Plafond taux médian (1 part)</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.guyane.rfrMaxMedian1Part
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'guyane',
                        'rfrMaxMedian1Part',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>

              <div className="settings-field-row">
                <label>Majoration par quart – exonération</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.guyane.incrementQuarterExemption
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'guyane',
                        'incrementQuarterExemption',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Majoration par quart – taux réduit</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.guyane.incrementQuarterReduced
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'guyane',
                        'incrementQuarterReduced',
                      ],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              <div className="settings-field-row">
                <label>Majoration par quart – taux médian</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    retirementThresholds.previous.guyane.incrementQuarterMedian
                  )}
                  onChange={(e) =>
                    updateField(
                      [
                        'retirementThresholds',
                        'previous',
                        'guyane',
                        'incrementQuarterMedian',
                      ],
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
      )}
    </div>
  );
}
