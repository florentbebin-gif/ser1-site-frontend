import type { ReactElement } from 'react';
import { LegalRefInlineList } from '@/components/legal/LegalRefLink';
import SettingsTable from '@/components/settings/SettingsTable';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import {
  INCOME_TAX_BAREME_BLOCK_REF_IDS,
  INCOME_TAX_CEHR_BLOCK_REF_IDS,
  INCOME_TAX_DOM_ABATEMENT_REF_IDS,
  INCOME_TAX_PFU_BLOCK_REF_IDS,
} from '@/domain/settings-references/uiReferenceGroups';
import { useImpotsContext } from '../../Impots/ImpotsProvider';
import type {
  ImpotsCehrSettings,
  ImpotsIncomeScaleFieldKey,
  ImpotsIncomeTaxSettings,
  ImpotsPatrimonySettings,
  ImpotsPfuSettings,
} from '../../Impots/impotsSaveAdapter';
import {
  abatFields,
  decoteFields,
  domCols,
  domZones,
  EditableOrReadonlyField,
  formatAmount,
  incomeScaleColumns,
  periodLabel,
  pfuTotal,
  quotientFields,
  ReadonlyFieldRow,
  ReadonlyTable,
  readonlyDomCols,
  readonlyIncomeScaleColumns,
  retireesKey,
  scaleKey,
  SectionBlock,
  yearLabelKey,
  type CellValue,
  type PeriodKey,
} from './MementoImpotsReadPrimitives';

function BaremePeriodColumn({ period }: { period: PeriodKey }): ReactElement {
  const { incomeTax, isAdmin, updateField, updateIncomeScale } = useImpotsContext();
  const selectedScaleKey = scaleKey(period);
  const selectedRetireesKey = retireesKey(period);
  const quotientFamily = incomeTax.quotientFamily[period];
  const decote = incomeTax.decote[period];
  const abat10 = incomeTax.abat10[period];
  const retirees = incomeTax.abat10[selectedRetireesKey];

  return (
    <SettingsYearColumn yearLabel={periodLabel(incomeTax, period)} isRight={period === 'previous'}>
      <SectionBlock title="Millésime et barème">
        <EditableOrReadonlyField
          isAdmin={isAdmin}
          label="Barème"
          path={['incomeTax', yearLabelKey(period)]}
          value={incomeTax[yearLabelKey(period)]}
          onChange={updateField}
          type="text"
        />
        {isAdmin ? (
          <SettingsTable
            columns={incomeScaleColumns}
            rows={incomeTax[selectedScaleKey].map((row, index) => ({
              _key: `${selectedScaleKey}-${index}`,
              ...row,
            }))}
            onCellChange={(index, key, value) =>
              updateIncomeScale(selectedScaleKey, index, key as ImpotsIncomeScaleFieldKey, value)
            }
          />
        ) : (
          <ReadonlyTable
            columns={readonlyIncomeScaleColumns}
            rows={incomeTax[selectedScaleKey].map((row, index) => ({
              _key: `${selectedScaleKey}-${index}`,
              ...row,
            }))}
          />
        )}
      </SectionBlock>

      <SectionBlock title="Plafond du quotient familial">
        {quotientFields.map(({ key, label }) => (
          <EditableOrReadonlyField
            key={key}
            isAdmin={isAdmin}
            label={label}
            path={['incomeTax', 'quotientFamily', period, key]}
            value={quotientFamily[key]}
            onChange={updateField}
            unit="EUR"
          />
        ))}
      </SectionBlock>

      <SectionBlock title="Décote">
        {decoteFields.map(({ key, label, unit, step }) => (
          <EditableOrReadonlyField
            key={key}
            isAdmin={isAdmin}
            label={label}
            path={['incomeTax', 'decote', period, key]}
            value={decote[key]}
            onChange={updateField}
            unit={unit ?? 'EUR'}
            step={step}
          />
        ))}
      </SectionBlock>

      <SectionBlock title="Abattement 10 %">
        {abatFields.map(({ key, label }) => (
          <EditableOrReadonlyField
            key={key}
            isAdmin={isAdmin}
            label={label}
            path={['incomeTax', 'abat10', period, key]}
            value={abat10[key]}
            onChange={updateField}
            unit="EUR"
          />
        ))}
      </SectionBlock>

      <SectionBlock title="Abattement 10 % pensions retraite">
        {abatFields.map(({ key, label }) => (
          <EditableOrReadonlyField
            key={key}
            isAdmin={isAdmin}
            label={label}
            path={['incomeTax', 'abat10', selectedRetireesKey, key]}
            value={retirees[key]}
            onChange={updateField}
            unit="EUR"
          />
        ))}
      </SectionBlock>
    </SettingsYearColumn>
  );
}

function BaremeSection(): ReactElement {
  return (
    <section className="settings-impots-entry-section">
      <h6>Barème de l’impôt sur le revenu</h6>
      <p className="fisc-intro fisc-intro--compact">
        Barème progressif par tranches, quotient familial, décote et abattements 10 %.
        <LegalRefInlineList ids={INCOME_TAX_BAREME_BLOCK_REF_IDS} />
      </p>
      <div className="income-tax-columns">
        <BaremePeriodColumn period="current" />
        <BaremePeriodColumn period="previous" />
      </div>
    </section>
  );
}

function DomSection(): ReactElement {
  const { incomeTax, isAdmin, updateField } = useImpotsContext();

  return (
    <section className="settings-impots-entry-section">
      <h6>Abattement DOM sur l’IR</h6>
      <p className="fisc-intro fisc-intro--compact">
        Appliqué sur l’impôt issu du barème après plafonnement du quotient familial et avant décote,
        réductions et crédits.
        <LegalRefInlineList ids={INCOME_TAX_DOM_ABATEMENT_REF_IDS} />
      </p>
      <div className="tax-two-cols">
        {(['current', 'previous'] as const).map((period) => {
          const rows = domZones.map((zone) => ({
            _key: zone._key,
            zone: zone.zone,
            ratePercent: incomeTax.domAbatement?.[period]?.[zone.zoneKey]?.ratePercent,
            cap: incomeTax.domAbatement?.[period]?.[zone.zoneKey]?.cap,
          }));

          return (
            <SettingsYearColumn
              key={period}
              yearLabel={periodLabel(incomeTax, period)}
              isRight={period === 'previous'}
            >
              <SectionBlock title="Barème DOM">
                {isAdmin ? (
                  <SettingsTable
                    columns={domCols}
                    rows={rows}
                    onCellChange={(index, key, value: CellValue) => {
                      const zone = domZones[index];
                      if (!zone) return;
                      updateField(
                        ['incomeTax', 'domAbatement', period, zone.zoneKey, key],
                        value === null ? '' : value,
                      );
                    }}
                  />
                ) : (
                  <ReadonlyTable columns={readonlyDomCols} rows={rows} />
                )}
              </SectionBlock>
            </SettingsYearColumn>
          );
        })}
      </div>
    </section>
  );
}

function PfuPeriodColumn({
  period,
  pfu,
  patrimony,
  incomeTax,
}: {
  period: PeriodKey;
  pfu: ImpotsPfuSettings;
  patrimony: ImpotsPatrimonySettings;
  incomeTax: ImpotsIncomeTaxSettings;
}): ReactElement {
  const { isAdmin, updateField } = useImpotsContext();
  const psRate = patrimony[period].generalRate;

  return (
    <SettingsYearColumn yearLabel={periodLabel(incomeTax, period)} isRight={period === 'previous'}>
      <SectionBlock title="Taux PFU">
        <EditableOrReadonlyField
          isAdmin={isAdmin}
          label="Part impôt sur le revenu"
          path={['pfu', period, 'rateIR']}
          value={pfu[period].rateIR}
          onChange={updateField}
          step="0.1"
          unit="%"
        />
        <ReadonlyFieldRow label="Prélèvements sociaux calculés" value={psRate} unit="%" />
        <ReadonlyFieldRow
          label="Taux global PFU calculé"
          value={pfuTotal(pfu[period].rateIR, psRate)}
          unit="%"
        />
      </SectionBlock>
    </SettingsYearColumn>
  );
}

function PfuSection(): ReactElement {
  const { pfu, patrimony, incomeTax } = useImpotsContext();

  return (
    <section className="settings-impots-entry-section">
      <h6>Prélèvement forfaitaire unique</h6>
      <p className="fisc-intro">
        La part prélèvements sociaux est lue depuis la section sociale ; seule la part IR du PFU est
        éditée ici.
        <LegalRefInlineList ids={INCOME_TAX_PFU_BLOCK_REF_IDS} />
      </p>
      <div className="tax-two-cols">
        <PfuPeriodColumn period="current" pfu={pfu} patrimony={patrimony} incomeTax={incomeTax} />
        <PfuPeriodColumn period="previous" pfu={pfu} patrimony={patrimony} incomeTax={incomeTax} />
      </div>
    </section>
  );
}

function CehrRateRows({
  period,
  rows,
  path,
}: {
  period: PeriodKey;
  rows: ImpotsCehrSettings[PeriodKey]['single'];
  path: Array<string>;
}): ReactElement {
  const { isAdmin, updateField } = useImpotsContext();

  return (
    <>
      {rows.map((row, index) => (
        <EditableOrReadonlyField
          key={`${path.join('-')}-${period}-${index}`}
          isAdmin={isAdmin}
          label={`De ${formatAmount(row.from)} à ${row.to == null ? 'plus' : formatAmount(row.to)}`}
          path={[...path, String(index), 'rate']}
          value={row.rate}
          onChange={updateField}
          step="0.1"
          unit="%"
        />
      ))}
    </>
  );
}

function CehrSection(): ReactElement {
  const { cehr, cdhr, incomeTax, isAdmin, updateField } = useImpotsContext();

  return (
    <section className="settings-impots-entry-section">
      <h6>CEHR / CDHR</h6>
      <p className="fisc-intro">
        Contribution exceptionnelle sur les hauts revenus et contribution différentielle sur les
        hauts revenus.
        <LegalRefInlineList ids={INCOME_TAX_CEHR_BLOCK_REF_IDS} />
      </p>
      <div className="tax-two-cols">
        {(['current', 'previous'] as const).map((period) => {
          const cehrData = cehr[period];
          const cdhrData = cdhr[period];

          return (
            <SettingsYearColumn
              key={period}
              yearLabel={periodLabel(incomeTax, period)}
              isRight={period === 'previous'}
            >
              <SectionBlock title="CEHR – personne seule">
                <CehrRateRows
                  period={period}
                  rows={cehrData.single}
                  path={['cehr', period, 'single']}
                />
              </SectionBlock>
              <SectionBlock title="CEHR – couple">
                <CehrRateRows
                  period={period}
                  rows={cehrData.couple}
                  path={['cehr', period, 'couple']}
                />
              </SectionBlock>
              <SectionBlock title="CDHR (taux minimal)">
                <EditableOrReadonlyField
                  isAdmin={isAdmin}
                  label="Taux effectif minimal"
                  path={['cdhr', period, 'minEffectiveRate']}
                  value={cdhrData.minEffectiveRate}
                  onChange={updateField}
                  step="0.1"
                  unit="%"
                />
                <EditableOrReadonlyField
                  isAdmin={isAdmin}
                  label="Seuil RFR – personne seule"
                  path={['cdhr', period, 'thresholdSingle']}
                  value={cdhrData.thresholdSingle}
                  onChange={updateField}
                  unit="EUR"
                />
                <EditableOrReadonlyField
                  isAdmin={isAdmin}
                  label="Seuil RFR – couple"
                  path={['cdhr', period, 'thresholdCouple']}
                  value={cdhrData.thresholdCouple}
                  onChange={updateField}
                  unit="EUR"
                />
              </SectionBlock>
            </SettingsYearColumn>
          );
        })}
      </div>
    </section>
  );
}

export default function MementoImpotsIrSection(): ReactElement {
  return (
    <>
      <BaremeSection />
      <DomSection />
      <PfuSection />
      <CehrSection />
    </>
  );
}
