import type { Dispatch, ReactElement, SetStateAction } from 'react';
import { LegalRefInlineList } from '@/components/legal/LegalRefLink';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';
import SettingsTable from '@/components/settings/SettingsTable';
import SettingsTitleWithIcon from '@/components/settings/SettingsTitleWithIcon';
import { INCOME_TAX_IFI_BLOCK_REF_IDS } from '@/domain/settings-references/uiReferenceGroups';

interface IfiScaleRow {
  from: number | null;
  to: number | null;
  rate: number | null;
  [key: string]: number | null;
}

interface IfiSettings {
  current: {
    threshold: number | null;
    residencePrincipaleAbattementRate: number | null;
    scale: IfiScaleRow[];
  };
}

interface ImpotsIfiSectionProps {
  ifi: IfiSettings;
  updateField: (path: string[], value: string | number | null) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: Dispatch<SetStateAction<string | null>>;
}

const ifiScaleColumns = [
  { key: 'from', header: 'De' },
  { key: 'to', header: 'À' },
  { key: 'rate', header: 'Taux %', step: '0.01', className: 'taux-col' },
];

export default function ImpotsIfiSection({
  ifi,
  updateField,
  isAdmin,
  openSection,
  setOpenSection,
}: ImpotsIfiSectionProps): ReactElement {
  const isOpen = openSection === 'ifi';

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header fisc-acc-header--with-icon"
        id="impots-header-ifi"
        aria-expanded={isOpen}
        aria-controls="impots-panel-ifi"
        onClick={() => setOpenSection(isOpen ? null : 'ifi')}
      >
        <SettingsTitleWithIcon
          icon="building"
          className="settings-premium-title settings-premium-title--flush"
        >
          Impôt sur la fortune immobilière
        </SettingsTitleWithIcon>
        <span className="fisc-acc-chevron">{isOpen ? 'v' : '>'}</span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="impots-panel-ifi"
          role="region"
          aria-labelledby="impots-header-ifi"
        >
          <p className="fisc-intro">
            Seuil d’entrée, abattement résidence principale et barème IFI courant.
            <LegalRefInlineList ids={INCOME_TAX_IFI_BLOCK_REF_IDS} />
          </p>

          <div className="income-tax-extra">
            <div className="income-tax-block">
              <div className="income-tax-block-title">Seuil et résidence principale</div>
              <div className="income-tax-block-body">
                <SettingsFieldRow
                  label="Seuil d’entrée IFI"
                  path={['ifi', 'current', 'threshold']}
                  value={ifi.current.threshold}
                  onChange={updateField}
                  unit="EUR"
                  disabled={!isAdmin}
                />
                <SettingsFieldRow
                  label="Abattement résidence principale"
                  path={['ifi', 'current', 'residencePrincipaleAbattementRate']}
                  value={ifi.current.residencePrincipaleAbattementRate}
                  onChange={updateField}
                  step="0.1"
                  unit="%"
                  disabled={!isAdmin}
                />
              </div>
            </div>

            <div className="income-tax-block">
              <div className="income-tax-block-title">Barème IFI</div>
              <SettingsTable
                columns={ifiScaleColumns}
                rows={ifi.current.scale.map((row, index) => ({
                  _key: `ifi-${index}`,
                  ...row,
                }))}
                onCellChange={(index, key, value) =>
                  updateField(['ifi', 'current', 'scale', String(index), key], value)
                }
                disabled={!isAdmin}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
