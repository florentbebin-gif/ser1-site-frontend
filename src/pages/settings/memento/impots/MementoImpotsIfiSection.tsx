import type { ReactElement } from 'react';
import { LegalRefInlineList } from '@/components/legal/LegalRefLink';
import SettingsTable from '@/components/settings/SettingsTable';
import { INCOME_TAX_IFI_BLOCK_REF_IDS } from '@/domain/settings-references/uiReferenceGroups';
import { useImpotsContext } from '../../Impots/ImpotsProvider';
import {
  EditableOrReadonlyField,
  ifiScaleColumns,
  ReadonlyTable,
  readonlyIncomeScaleColumns,
  SectionBlock,
} from './MementoImpotsReadPrimitives';

export default function MementoImpotsIfiSection(): ReactElement {
  const { ifi, isAdmin, updateField } = useImpotsContext();
  const rows = ifi.current.scale.map((row, index) => ({
    _key: `ifi-${index}`,
    ...row,
  }));

  return (
    <section className="settings-impots-entry-section">
      <h6>Impôt sur la fortune immobilière</h6>
      <p className="fisc-intro">
        Seuil d’entrée, abattement résidence principale et barème IFI courant.
        <LegalRefInlineList ids={INCOME_TAX_IFI_BLOCK_REF_IDS} />
      </p>

      <div className="income-tax-extra">
        <SectionBlock title="Seuil et résidence principale">
          <EditableOrReadonlyField
            isAdmin={isAdmin}
            label="Seuil d’entrée IFI"
            path={['ifi', 'current', 'threshold']}
            value={ifi.current.threshold}
            onChange={updateField}
            unit="EUR"
          />
          <EditableOrReadonlyField
            isAdmin={isAdmin}
            label="Abattement résidence principale"
            path={['ifi', 'current', 'residencePrincipaleAbattementRate']}
            value={ifi.current.residencePrincipaleAbattementRate}
            onChange={updateField}
            step="0.1"
            unit="%"
          />
        </SectionBlock>

        <SectionBlock title="Barème IFI">
          {isAdmin ? (
            <SettingsTable
              columns={ifiScaleColumns}
              rows={rows}
              onCellChange={(index, key, value) =>
                updateField(['ifi', 'current', 'scale', String(index), key], value)
              }
            />
          ) : (
            <ReadonlyTable columns={readonlyIncomeScaleColumns} rows={rows} />
          )}
        </SectionBlock>
      </div>
    </section>
  );
}
