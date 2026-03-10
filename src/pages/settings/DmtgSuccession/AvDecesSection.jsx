import React from 'react';
import { numberOrEmpty } from '@/utils/settingsHelpers.js';
import SettingsTable from '@/components/settings/SettingsTable';

export default function AvDecesSection({
  avDeces,
  updateAvDeces,
  isAdmin,
  openSection,
  setOpenSection,
  errors,
}) {
  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={openSection === 'avDeces'}
        onClick={() => setOpenSection(openSection === 'avDeces' ? null : 'avDeces')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Assurance-vie décès (990 I / 757 B)
        </span>
        <span className="fisc-acc-chevron">
          {openSection === 'avDeces' ? '▾' : '▸'}
        </span>
      </button>

      {openSection === 'avDeces' && (
        <div className="fisc-acc-body">
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Fiscalité des capitaux décès transmis via l'assurance-vie.
          </p>

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Paramètres généraux
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row" style={{ marginBottom: 8 }}>
                <label>Âge pivot primes (avant/après)</label>
                <input
                  type="number"
                  value={numberOrEmpty(avDeces.agePivotPrimes)}
                  onChange={(e) =>
                    updateAvDeces(
                      ['agePivotPrimes'],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>ans</span>
              </div>
              {errors.agePivotPrimes && (
                <div style={{ color: 'var(--color-error-text)', fontSize: 12, marginLeft: 8 }}>
                  {errors.agePivotPrimes}
                </div>
              )}
            </div>
          </div>

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Primes versées après le 13/10/1998 — avant {avDeces.agePivotPrimes || 70} ans (art. 990 I)
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row" style={{ marginBottom: 8 }}>
                <label>Abattement par bénéficiaire</label>
                <input
                  type="number"
                  value={numberOrEmpty(avDeces.primesApres1998?.allowancePerBeneficiary)}
                  onChange={(e) =>
                    updateAvDeces(
                      ['primesApres1998', 'allowancePerBeneficiary'],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              {errors['primesApres1998.allowancePerBeneficiary'] && (
                <div style={{ color: 'var(--color-error-text)', fontSize: 12, marginLeft: 8 }}>
                  {errors['primesApres1998.allowancePerBeneficiary']}
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Barème par bénéficiaire</div>
                <SettingsTable
                  columns={[
                    { key: 'upTo', header: 'Jusqu\'à (€ cumulé)' },
                    { key: 'ratePercent', header: 'Taux %', step: '0.1', className: 'taux-col' },
                  ]}
                  rows={avDeces.primesApres1998?.brackets || []}
                  onCellChange={(idx, colKey, value) => {
                    const newBrackets = (avDeces.primesApres1998?.brackets || []).map((b, i) =>
                      i === idx ? { ...b, [colKey]: value } : b
                    );
                    updateAvDeces(['primesApres1998', 'brackets'], newBrackets);
                  }}
                  disabled={!isAdmin}
                />
                {Object.entries(errors)
                  .filter(([key]) => key.startsWith('primesApres1998.brackets'))
                  .map(([key, msg]) => (
                    <div key={key} style={{ color: 'var(--color-error-text)', fontSize: 12, marginTop: 2 }}>
                      {msg}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="income-tax-block">
            <div className="income-tax-block-title" style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}>
              Primes versées après {avDeces.agePivotPrimes || 70} ans (art. 757 B)
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row" style={{ marginBottom: 8 }}>
                <label>Abattement global (tous bénéficiaires)</label>
                <input
                  type="number"
                  value={numberOrEmpty(avDeces.apres70ans?.globalAllowance)}
                  onChange={(e) =>
                    updateAvDeces(
                      ['apres70ans', 'globalAllowance'],
                      e.target.value === '' ? null : Number(e.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>€</span>
              </div>
              {errors['apres70ans.globalAllowance'] && (
                <div style={{ color: 'var(--color-error-text)', fontSize: 12, marginLeft: 8 }}>
                  {errors['apres70ans.globalAllowance']}
                </div>
              )}
              <p style={{ fontSize: 12, color: 'var(--color-c9)', margin: '4px 0 0 0' }}>
                Au-delà : taxation aux DMTG (barème succession).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
