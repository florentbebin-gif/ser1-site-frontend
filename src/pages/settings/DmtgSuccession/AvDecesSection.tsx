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
        <span className="settings-premium-title settings-premium-title--flush">
          Assurance-vie décès (990 I / 757 B)
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div className="fisc-acc-body">
          <p className="dmtg-intro">
            Fiscalité des capitaux décès transmis via l’assurance-vie.
          </p>

          <div className="income-tax-block dmtg-block--mb16">
            <div className="dmtg-block-title">
              Paramètres généraux
            </div>
            <div className="dmtg-indent">
              <div className="settings-field-row dmtg-field-row--mb8">
                <label>Âge pivot primes (avant/après)</label>
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
                <div className="dmtg-field-error">
                  {errors.agePivotPrimes}
                </div>
              )}
            </div>
          </div>

          <div className="income-tax-block dmtg-block--mb16">
            <div className="dmtg-block-title">
              Primes versées après le 13/10/1998 - avant {avDeces.agePivotPrimes || 70}{' '}
              ans (art. 990 I)
            </div>
            <div className="dmtg-indent">
              <div className="settings-field-row dmtg-field-row--mb8">
                <label>Abattement par bénéficiaire</label>
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
                <div className="dmtg-field-error">
                  {errors['primesApres1998.allowancePerBeneficiary']}
                </div>
              )}

              <div className="dmtg-subsection--mt12">
                <div className="dmtg-subsection-title">
                  Barème par bénéficiaire
                </div>
                <SettingsTable
                  columns={[
                    { key: 'upTo', header: 'Jusqu’à (EUR cumulés)' },
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
                    <div key={key} className="dmtg-field-error--mt2">
                      {msg}
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="income-tax-block">
            <div className="dmtg-block-title">
              Primes versées après {avDeces.agePivotPrimes || 70} ans (art. 757 B)
            </div>
            <div className="dmtg-indent">
              <div className="settings-field-row dmtg-field-row--mb8">
                <label>Abattement global (tous bénéficiaires)</label>
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
                <div className="dmtg-field-error">
                  {errors['apres70ans.globalAllowance']}
                </div>
              )}
              <p className="dmtg-note--mt4">
                Au-delà : taxation aux DMTG (barème succession).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
