import React from 'react';
import { LegalRefLink } from '@/components/legal/LegalRefLink';
import SettingsTable from '@/components/settings/SettingsTable';
import { numberOrEmpty } from '@/components/settings/settingsHelpers';
import {
  formatDmtgAmount,
  formatDmtgPercent,
  formatDmtgYears,
  ReadonlyDmtgTable,
} from './dmtgDisplay';
import { AV_DECES_LEGAL_REFERENCE_IDS } from './dmtgLegalReferenceIds';

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
  errors: AvDecesErrorMap;
}

export default function AvDecesSection({
  avDeces,
  updateAvDeces,
  isAdmin,
  errors,
}: AvDecesSectionProps): React.ReactElement {
  const bracketRows = avDeces.primesApres1998.brackets.map(
    (bracket, index): AvDecesBracketRow => ({
      ...bracket,
      _key: `av-deces-${index}`,
    }),
  );

  return (
    <section className="settings-memento-entry-section settings-dmtg-entry-section">
      <h6>Assurance-vie décès</h6>
      <p className="dmtg-intro">
        Fiscalité des capitaux décès transmis via l’assurance-vie (
        <LegalRefLink id={AV_DECES_LEGAL_REFERENCE_IDS.cgi990I} /> /{' '}
        <LegalRefLink id={AV_DECES_LEGAL_REFERENCE_IDS.cgi757B} />
        ).
      </p>

      <div className="income-tax-block dmtg-block--mb16">
        <div className="dmtg-block-title">Paramètres généraux</div>
        <div className="dmtg-indent">
          {isAdmin ? (
            <div className="settings-field-row dmtg-field-row--mb8">
              <label htmlFor="av-deces-age-pivot">Âge pivot primes (avant/après)</label>
              <input
                id="av-deces-age-pivot"
                type="number"
                value={numberOrEmpty(avDeces.agePivotPrimes)}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  updateAvDeces(
                    ['agePivotPrimes'],
                    event.target.value === '' ? null : Number(event.target.value),
                  )
                }
              />
              <span>ans</span>
            </div>
          ) : (
            <p className="dmtg-readonly-field">
              <strong>Âge pivot primes (avant/après)</strong>
              <span>{formatDmtgYears(avDeces.agePivotPrimes)}</span>
            </p>
          )}
          {errors.agePivotPrimes ? (
            <div className="dmtg-field-error">{errors.agePivotPrimes}</div>
          ) : null}
        </div>
      </div>

      <div className="income-tax-block dmtg-block--mb16">
        <div className="dmtg-block-title">
          Primes versées après le 13/10/1998 - avant {avDeces.agePivotPrimes || 70} ans (
          <LegalRefLink id={AV_DECES_LEGAL_REFERENCE_IDS.cgi990I} />)
        </div>
        <div className="dmtg-indent">
          {isAdmin ? (
            <div className="settings-field-row dmtg-field-row--mb8">
              <label htmlFor="av-deces-allowance-per-beneficiary">
                Abattement par bénéficiaire
              </label>
              <input
                id="av-deces-allowance-per-beneficiary"
                type="number"
                value={numberOrEmpty(avDeces.primesApres1998.allowancePerBeneficiary)}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  updateAvDeces(
                    ['primesApres1998', 'allowancePerBeneficiary'],
                    event.target.value === '' ? null : Number(event.target.value),
                  )
                }
              />
              <span>EUR</span>
            </div>
          ) : (
            <p className="dmtg-readonly-field">
              <strong>Abattement par bénéficiaire</strong>
              <span>{formatDmtgAmount(avDeces.primesApres1998.allowancePerBeneficiary)}</span>
            </p>
          )}
          {errors['primesApres1998.allowancePerBeneficiary'] ? (
            <div className="dmtg-field-error">
              {errors['primesApres1998.allowancePerBeneficiary']}
            </div>
          ) : null}

          <div className="dmtg-subsection--mt12">
            <div className="dmtg-subsection-title">Barème par bénéficiaire</div>
            {isAdmin ? (
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
                rows={bracketRows}
                onCellChange={(idx, colKey, value: CellValue) => {
                  const fieldKey = colKey as BracketFieldKey;
                  const newBrackets = avDeces.primesApres1998.brackets.map((bracket, index) =>
                    index === idx
                      ? {
                          ...bracket,
                          [fieldKey]: value as number | null,
                        }
                      : bracket,
                  );
                  updateAvDeces(['primesApres1998', 'brackets'], newBrackets);
                }}
              />
            ) : (
              <ReadonlyDmtgTable
                columns={[
                  {
                    key: 'upTo',
                    header: 'Jusqu’à',
                    render: (value) =>
                      value === null ? 'Au-delà' : formatDmtgAmount(value as number | null),
                  },
                  {
                    key: 'ratePercent',
                    header: 'Taux',
                    className: 'taux-col',
                    render: (value) => formatDmtgPercent(value as number | null),
                  },
                ]}
                rows={bracketRows}
              />
            )}
            {Object.entries(errors)
              .filter(
                ([key, msg]) =>
                  key.startsWith('primesApres1998.brackets') && typeof msg === 'string',
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
          Primes versées après {avDeces.agePivotPrimes || 70} ans (
          <LegalRefLink id={AV_DECES_LEGAL_REFERENCE_IDS.cgi757B} />)
        </div>
        <div className="dmtg-indent">
          {isAdmin ? (
            <div className="settings-field-row dmtg-field-row--mb8">
              <label htmlFor="av-deces-global-allowance">
                Abattement global (tous bénéficiaires)
              </label>
              <input
                id="av-deces-global-allowance"
                type="number"
                value={numberOrEmpty(avDeces.apres70ans.globalAllowance)}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  updateAvDeces(
                    ['apres70ans', 'globalAllowance'],
                    event.target.value === '' ? null : Number(event.target.value),
                  )
                }
              />
              <span>EUR</span>
            </div>
          ) : (
            <p className="dmtg-readonly-field">
              <strong>Abattement global (tous bénéficiaires)</strong>
              <span>{formatDmtgAmount(avDeces.apres70ans.globalAllowance)}</span>
            </p>
          )}
          {errors['apres70ans.globalAllowance'] ? (
            <div className="dmtg-field-error">{errors['apres70ans.globalAllowance']}</div>
          ) : null}
          <p className="dmtg-note--mt4">Au-delà : taxation aux DMTG (barème succession).</p>
        </div>
      </div>
    </section>
  );
}
