import React from 'react';
import SettingsTable from '@/components/settings/SettingsTable';
import { numberOrEmpty } from '@/components/settings/settingsHelpers';

type CellValue = string | number | null;
type DmtgCategoryKey = 'ligneDirecte' | 'frereSoeur' | 'neveuNiece' | 'autre';

interface DmtgScaleRow {
  from: number | null;
  to: number | null;
  rate: number | null;
}

interface DmtgScaleTableRow extends DmtgScaleRow {
  _key: string;
  [key: string]: React.Key | number | null;
}

interface DmtgCategory {
  abattement: number | null;
  scale: DmtgScaleRow[];
}

type DmtgSettings = Record<DmtgCategoryKey, DmtgCategory>;

interface DmtgScaleUpdate {
  idx: number;
  key: string;
  value: CellValue;
}

interface DmtgCategoryMeta {
  key: DmtgCategoryKey;
  title: string;
  labelAbattement: string;
}

interface ImpotsDmtgSectionProps {
  dmtg: DmtgSettings;
  updateDmtgCategory: (
    categoryKey: DmtgCategoryKey,
    field: 'abattement' | 'scale',
    value: number | null | DmtgScaleUpdate,
  ) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function ImpotsDmtgSection({
  dmtg,
  updateDmtgCategory,
  isAdmin,
  openSection,
  setOpenSection,
}: ImpotsDmtgSectionProps): React.ReactElement {
  const isOpen = openSection === 'dmtg';
  const categories: DmtgCategoryMeta[] = [
    {
      key: 'ligneDirecte',
      title: 'Ligne directe (enfants, petits-enfants)',
      labelAbattement: 'Abattement par enfant',
    },
    {
      key: 'frereSoeur',
      title: 'Freres et soeurs',
      labelAbattement: 'Abattement frere/soeur',
    },
    {
      key: 'neveuNiece',
      title: 'Neveux et nieces',
      labelAbattement: 'Abattement neveu/niece',
    },
    {
      key: 'autre',
      title: 'Autres (non-parents)',
      labelAbattement: 'Abattement par defaut',
    },
  ];

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="impots-header-dmtg"
        aria-expanded={isOpen}
        aria-controls="impots-panel-dmtg"
        onClick={() => setOpenSection(isOpen ? null : 'dmtg')}
      >
        <span className="settings-premium-title settings-premium-title--flush">
          Droits de Mutation a Titre Gratuit (DMTG)
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? 'v' : '>'}
        </span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="impots-panel-dmtg"
          role="region"
          aria-labelledby="impots-header-dmtg"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 16 }}>
            Baremes applicables aux successions et donations selon le lien de
            parente. Utilises par le simulateur de placement pour la phase de
            transmission.
          </p>

          {categories.map(({ key, title, labelAbattement }) => {
            const category = dmtg[key];

            return (
              <div
                key={key}
                className="income-tax-block"
                style={{ marginBottom: 24 }}
              >
                <div
                  className="income-tax-block-title"
                  style={{
                    color: 'var(--color-c1)',
                    fontWeight: 600,
                    fontSize: 15,
                  }}
                >
                  {title}
                </div>
                <div style={{ paddingLeft: 8 }}>
                  <div className="settings-field-row" style={{ marginBottom: 12 }}>
                    <label>{labelAbattement}</label>
                    <input
                      type="number"
                      value={numberOrEmpty(category.abattement)}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        updateDmtgCategory(
                          key,
                          'abattement',
                          event.target.value === ''
                            ? null
                            : Number(event.target.value)
                        )
                      }
                      disabled={!isAdmin}
                    />
                    <span>EUR</span>
                  </div>
                  <SettingsTable
                    columns={[
                      { key: 'from', header: 'De (EUR)' },
                      { key: 'to', header: 'A (EUR)' },
                      {
                        key: 'rate',
                        header: 'Taux %',
                        step: '0.1',
                        className: 'taux-col',
                      },
                    ]}
                    rows={category.scale.map(
                      (row, index): DmtgScaleTableRow => ({
                        ...row,
                        _key: `${key}_${index}`,
                      })
                    )}
                    onCellChange={(idx, colKey, value: CellValue) =>
                      updateDmtgCategory(key, 'scale', { idx, key: colKey, value })
                    }
                    disabled={!isAdmin}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
