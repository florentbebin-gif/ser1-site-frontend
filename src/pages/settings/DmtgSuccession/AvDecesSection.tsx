import React from 'react';
import { numberOrEmpty } from '@/components/settings/settingsHelpers';
import SettingsTable from '@/components/settings/SettingsTable';

type CellValue = string | number | null;
type BracketFieldKey = 'upTo' | 'ratePercent';
type AvDecesErrorMap = Partial<Record<string, string>>;

interface AvDecesBracket {
  upTo: number | null;
  ratePercent: number | null;
}

interface AvDecesBracketRow extends AvDecesBracket {
  _key: string;
  [key: string]: React.Key | number | null;
}

interface AvDecesSettings {
  agePivotPrimes: number | null;
  primesApres1998: {
    allowancePerBeneficiary: number | null;
    brackets: AvDecesBracket[];
  };
  apres70ans: {
    globalAllowance: number | null;
  };
}

interface AvDecesSectionProps {
  avDeces: AvDecesSettings;
  updateAvDeces: (path: string[], value: number | AvDecesBracket[] | null) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
  errors: AvDecesErrorMap;
}

export default function AvDecesSection({
  avDeces,
  updateAvDeces,
  isAdmin,
  openSection,
  setOpenSection,
  errors,
}: AvDecesSectionProps): React.ReactElement {
  const isOpen = openSection === 'avDeces';

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        aria-expanded={isOpen}
        onClick={() => setOpenSection(isOpen ? null : 'avDeces')}
      >
        <span className="settings-premium-title" style={{ margin: 0 }}>
          Assurance-vie deces (990 I / 757 B)
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div className="fisc-acc-body">
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Fiscalite des capitaux deces transmis via l'assurance-vie.
          </p>

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div
              className="income-tax-block-title"
              style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}
            >
              Parametres generaux
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row" style={{ marginBottom: 8 }}>
                <label>Age pivot primes (avant/apres)</label>
                <input
                  type="number"
                  value={numberOrEmpty(avDeces.agePivotPrimes)}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    updateAvDeces(
                      ['agePivotPrimes'],
                      event.target.value === '' ? null : Number(event.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>ans</span>
              </div>
              {errors.agePivotPrimes && (
                <div
                  style={{
                    color: 'var(--color-error-text)',
                    fontSize: 12,
                    marginLeft: 8,
                  }}
                >
                  {errors.agePivotPrimes}
                </div>
              )}
            </div>
          </div>

          <div className="income-tax-block" style={{ marginBottom: 16 }}>
            <div
              className="income-tax-block-title"
              style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}
            >
              Primes versees apres le 13/10/1998 - avant {avDeces.agePivotPrimes || 70}{' '}
              ans (art. 990 I)
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row" style={{ marginBottom: 8 }}>
                <label>Abattement par beneficiaire</label>
                <input
                  type="number"
                  value={numberOrEmpty(
                    avDeces.primesApres1998.allowancePerBeneficiary
                  )}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    updateAvDeces(
                      ['primesApres1998', 'allowancePerBeneficiary'],
                      event.target.value === '' ? null : Number(event.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>EUR</span>
              </div>
              {errors['primesApres1998.allowancePerBeneficiary'] && (
                <div
                  style={{
                    color: 'var(--color-error-text)',
                    fontSize: 12,
                    marginLeft: 8,
                  }}
                >
                  {errors['primesApres1998.allowancePerBeneficiary']}
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  Bareme par beneficiaire
                </div>
                <SettingsTable
                  columns={[
                    { key: 'upTo', header: "Jusqu'a (EUR cumule)" },
                    {
                      key: 'ratePercent',
                      header: 'Taux %',
                      step: '0.1',
                      className: 'taux-col',
                    },
                  ]}
                  rows={avDeces.primesApres1998.brackets.map(
                    (bracket, index): AvDecesBracketRow => ({
                      ...bracket,
                      _key: `av-deces-${index}`,
                    })
                  )}
                  onCellChange={(idx, colKey, value: CellValue) => {
                    const fieldKey = colKey as BracketFieldKey;
                    const newBrackets = avDeces.primesApres1998.brackets.map(
                      (bracket, index) =>
                        index === idx
                          ? {
                              ...bracket,
                              [fieldKey]: value as number | null,
                            }
                          : bracket
                    );
                    updateAvDeces(['primesApres1998', 'brackets'], newBrackets);
                  }}
                  disabled={!isAdmin}
                />
                {Object.entries(errors)
                  .filter(
                    ([key, msg]) =>
                      key.startsWith('primesApres1998.brackets') &&
                      typeof msg === 'string'
                  )
                  .map(([key, msg]) => (
                    <div
                      key={key}
                      style={{
                        color: 'var(--color-error-text)',
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      {msg}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="income-tax-block">
            <div
              className="income-tax-block-title"
              style={{ color: 'var(--color-c1)', fontWeight: 600, fontSize: 15 }}
            >
              Primes versees apres {avDeces.agePivotPrimes || 70} ans (art. 757 B)
            </div>
            <div style={{ paddingLeft: 8 }}>
              <div className="settings-field-row" style={{ marginBottom: 8 }}>
                <label>Abattement global (tous beneficiaires)</label>
                <input
                  type="number"
                  value={numberOrEmpty(avDeces.apres70ans.globalAllowance)}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    updateAvDeces(
                      ['apres70ans', 'globalAllowance'],
                      event.target.value === '' ? null : Number(event.target.value)
                    )
                  }
                  disabled={!isAdmin}
                />
                <span>EUR</span>
              </div>
              {errors['apres70ans.globalAllowance'] && (
                <div
                  style={{
                    color: 'var(--color-error-text)',
                    fontSize: 12,
                    marginLeft: 8,
                  }}
                >
                  {errors['apres70ans.globalAllowance']}
                </div>
              )}
              <p style={{ fontSize: 12, color: 'var(--color-c9)', margin: '4px 0 0 0' }}>
                Au-dela : taxation aux DMTG (bareme succession).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
