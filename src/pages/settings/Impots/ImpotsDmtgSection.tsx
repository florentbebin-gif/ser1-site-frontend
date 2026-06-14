import React from 'react';
import { LegalRefInlineList } from '@/components/legal/LegalRefLink';
import SettingsTable from '@/components/settings/SettingsTable';
import { numberOrEmpty } from '@/components/settings/settingsHelpers';
import { DMTG_BAREMES_BLOCK_REF_IDS } from '@/domain/settings-references/uiReferenceGroups';
import {
  formatDmtgAmount,
  formatDmtgPercent,
  ReadonlyDmtgTable,
} from '../DmtgSuccession/dmtgDisplay';

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
type DmtgErrorMap = Partial<Record<string, string>>;

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
  errors?: DmtgErrorMap;
}

const categories: DmtgCategoryMeta[] = [
  {
    key: 'ligneDirecte',
    title: 'Ligne directe (enfants, petits-enfants)',
    labelAbattement: 'Abattement par enfant',
  },
  {
    key: 'frereSoeur',
    title: 'Frères et sœurs',
    labelAbattement: 'Abattement frère/sœur',
  },
  {
    key: 'neveuNiece',
    title: 'Neveux et nièces',
    labelAbattement: 'Abattement neveu/nièce',
  },
  {
    key: 'autre',
    title: 'Autres (non-parents)',
    labelAbattement: 'Abattement par défaut',
  },
];

export default function ImpotsDmtgSection({
  dmtg,
  updateDmtgCategory,
  isAdmin,
  errors = {},
}: ImpotsDmtgSectionProps): React.ReactElement {
  return (
    <section className="settings-memento-entry-section settings-dmtg-entry-section">
      <h6>Droits de mutation à titre gratuit (DMTG)</h6>
      <p className="fisc-intro fisc-intro--loose">
        Barèmes applicables aux successions et donations selon le lien de parenté.
        <LegalRefInlineList ids={DMTG_BAREMES_BLOCK_REF_IDS} />
      </p>

      {Object.keys(errors).length > 0 ? (
        <div className="settings-dmtg-inline-errors">
          {Object.entries(errors).map(([key, msg]) => (
            <div key={key} className="settings-dmtg-inline-error">
              {key} : {msg}
            </div>
          ))}
        </div>
      ) : null}

      {categories.map(({ key, title, labelAbattement }) => {
        const category = dmtg[key];
        const rows = category.scale.map(
          (row, index): DmtgScaleTableRow => ({
            ...row,
            _key: `${key}_${index}`,
          }),
        );

        return (
          <div key={key} className="income-tax-block income-tax-block--spaced">
            <div className="income-tax-block-title income-tax-block-title--accent">{title}</div>
            <div className="income-tax-block-body">
              {isAdmin ? (
                <div className="settings-field-row settings-field-row--spaced">
                  <label htmlFor={`impots-dmtg-${key}-abattement`}>{labelAbattement}</label>
                  <input
                    id={`impots-dmtg-${key}-abattement`}
                    type="number"
                    value={numberOrEmpty(category.abattement)}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                      updateDmtgCategory(
                        key,
                        'abattement',
                        event.target.value === '' ? null : Number(event.target.value),
                      )
                    }
                  />
                  <span>EUR</span>
                </div>
              ) : (
                <p className="dmtg-readonly-field">
                  <strong>{labelAbattement}</strong>
                  <span>{formatDmtgAmount(category.abattement)}</span>
                </p>
              )}

              {isAdmin ? (
                <SettingsTable
                  columns={[
                    { key: 'from', header: 'De (EUR)' },
                    { key: 'to', header: 'À (EUR)' },
                    {
                      key: 'rate',
                      header: 'Taux %',
                      step: '0.1',
                      className: 'taux-col',
                    },
                  ]}
                  rows={rows}
                  onCellChange={(idx, colKey, value: CellValue) =>
                    updateDmtgCategory(key, 'scale', { idx, key: colKey, value })
                  }
                />
              ) : (
                <ReadonlyDmtgTable
                  columns={[
                    {
                      key: 'from',
                      header: 'De',
                      render: (value) => formatDmtgAmount(value as number | null),
                    },
                    {
                      key: 'to',
                      header: 'À',
                      render: (value) =>
                        value === null ? 'Au-delà' : formatDmtgAmount(value as number | null),
                    },
                    {
                      key: 'rate',
                      header: 'Taux',
                      className: 'taux-col',
                      render: (value) => formatDmtgPercent(value as number | null),
                    },
                  ]}
                  rows={rows}
                />
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
