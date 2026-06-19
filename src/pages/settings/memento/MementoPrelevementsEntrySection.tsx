import type { ReactElement, ReactNode } from 'react';
import { LegalRefInlineList } from '@/components/legal/LegalRefLink';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';
import SettingsTable from '@/components/settings/SettingsTable';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import {
  PRELEVEMENTS_PASS_REF_IDS,
  PRELEVEMENTS_PATRIMOINE_REF_IDS,
  PRELEVEMENTS_RETRAITE_REF_IDS,
  PRELEVEMENTS_SEUILS_REF_IDS,
  PRELEVEMENTS_SOCIAL_DIRIGEANT_REF_IDS,
} from '@/domain/settings-references/uiReferenceGroups';
import { usePrelevementsContext } from '../Prelevements/PrelevementsProvider';
import type {
  PrelevementsRetirementBracketKey,
  PrelevementsRetirementYearKey,
} from '../Prelevements/prelevementsSaveAdapter';
import type { MementoEntrySectionProps } from './mementoEntrySections';

type Unit = '%' | 'EUR' | 'text';
type RegionKey = 'metropole' | 'gmr' | 'guyane';
type ThresholdFieldKey =
  | 'rfrMaxExemption1Part'
  | 'rfrMaxReduced1Part'
  | 'rfrMaxMedian1Part'
  | 'incrementQuarterExemption'
  | 'incrementQuarterReduced'
  | 'incrementQuarterMedian';

interface FieldDefinition {
  label: string;
  path: string[];
  value: string | number | null | undefined;
  unit?: Unit;
  step?: string;
}

interface ReadonlyColumn {
  key: string;
  header: string;
  className?: string;
  format?: (value: unknown) => ReactNode;
}

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
});
const amountFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

const patrimonyFields = [
  { key: 'generalRate', label: 'PS - cas général', step: '0.1' },
  { key: 'exceptionRate', label: "PS - régime d'exception", step: '0.1' },
  { key: 'csgDeductibleRate', label: 'CSG déductible (au barème)', step: '0.1' },
] as const;

const retirementColumns = [
  { key: 'label', header: 'Tranche', type: 'display' as const },
  { key: 'rfrMin1Part', header: 'RFR min (1 part)' },
  { key: 'rfrMax1Part', header: 'RFR max (1 part)' },
  { key: 'csgRate', header: 'CSG %', step: '0.1' },
  { key: 'crdsRate', header: 'CRDS %', step: '0.1' },
  { key: 'casaRate', header: 'CASA %', step: '0.1' },
  { key: 'maladieRate', header: 'Maladie %', step: '0.1' },
  { key: 'totalRate', header: 'Total %', step: '0.1' },
  { key: 'csgDeductibleRate', header: 'CSG ded. %', step: '0.1' },
];

const readonlyRetirementColumns: ReadonlyColumn[] = [
  { key: 'label', header: 'Tranche' },
  { key: 'rfrMin1Part', header: 'RFR min (1 part)', format: formatAmount },
  { key: 'rfrMax1Part', header: 'RFR max (1 part)', format: formatUpperAmount },
  { key: 'csgRate', header: 'CSG', format: formatPercent },
  { key: 'crdsRate', header: 'CRDS', format: formatPercent },
  { key: 'casaRate', header: 'CASA', format: formatPercent },
  { key: 'maladieRate', header: 'Maladie', format: formatPercent },
  { key: 'totalRate', header: 'Total', format: formatPercent },
  { key: 'csgDeductibleRate', header: 'CSG déd.', format: formatPercent },
];

const regionSections = [
  { key: 'metropole', label: 'Résidence en métropole' },
  {
    key: 'gmr',
    label: 'Résidence en Martinique, Guadeloupe, Réunion, Saint-Barthélemy, Saint-Martin',
  },
  { key: 'guyane', label: 'Résidence en Guyane' },
] as const satisfies readonly { key: RegionKey; label: string }[];

const thresholdFields = [
  { key: 'rfrMaxExemption1Part', label: 'Plafond exonération (1 part)' },
  { key: 'rfrMaxReduced1Part', label: 'Plafond taux réduit (1 part)' },
  { key: 'rfrMaxMedian1Part', label: 'Plafond taux médian (1 part)' },
  { key: 'incrementQuarterExemption', label: 'Majoration par quart - exonération' },
  { key: 'incrementQuarterReduced', label: 'Majoration par quart - taux réduit' },
  { key: 'incrementQuarterMedian', label: 'Majoration par quart - taux médian' },
] as const satisfies readonly { key: ThresholdFieldKey; label: string }[];

function formatAmount(value: unknown): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Non renseigné';
  return `${amountFormatter.format(value)} €`;
}

function formatUpperAmount(value: unknown): string {
  if (value == null) return 'Plus';
  return formatAmount(value);
}

function formatPercent(value: unknown): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Non renseigné';
  return `${percentFormatter.format(value)} %`;
}

function formatText(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') return 'Non renseigné';
  return value;
}

function formatValue(value: unknown, unit?: Unit): string {
  if (unit === '%') return formatPercent(value);
  if (unit === 'EUR') return formatAmount(value);
  return formatText(value);
}

function ReadonlyTable({
  columns,
  rows,
}: {
  columns: ReadonlyColumn[];
  rows: Array<Record<string, unknown>>;
}): ReactElement {
  return (
    <table className="settings-table settings-memento-readonly-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} className={column.className}>
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={String(row._key ?? rowIndex)}>
            {columns.map((column) => (
              <td key={column.key} className={column.className}>
                {column.format ? column.format(row[column.key]) : String(row[column.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReadonlyFieldRow({ field }: { field: FieldDefinition }): ReactElement {
  return (
    <div className="settings-prelevements-readonly-row">
      <span>{field.label}</span>
      <strong>{formatValue(field.value, field.unit)}</strong>
    </div>
  );
}

function EditableOrReadonlyField({
  field,
  isAdmin,
  updateField,
}: {
  field: FieldDefinition;
  isAdmin: boolean;
  updateField: (path: string[], value: string | number | null) => void;
}): ReactElement {
  if (!isAdmin) return <ReadonlyFieldRow field={field} />;

  return (
    <SettingsFieldRow
      label={field.label}
      path={field.path}
      value={field.value ?? null}
      onChange={updateField}
      unit={field.unit === 'text' ? undefined : field.unit}
      step={field.step}
    />
  );
}

function SectionFrame({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <section className="settings-prelevements-entry-section">
      <h6>{title}</h6>
      {children}
    </section>
  );
}

function SectionBlock({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <div className="income-tax-block">
      <div className="income-tax-block-title">{title}</div>
      <div className="income-tax-block-body">{children}</div>
    </div>
  );
}

function PatrimonyPeriodColumn({
  period,
  label,
}: {
  period: 'current' | 'previous';
  label: string;
}): ReactElement {
  const { isAdmin, patrimony, updateField } = usePrelevementsContext();

  return (
    <SettingsYearColumn yearLabel={label} isRight={period === 'previous'}>
      <SectionBlock title="Taux de prélèvements">
        {patrimonyFields.map((field) => (
          <EditableOrReadonlyField
            key={`${period}-${field.key}`}
            isAdmin={isAdmin}
            updateField={updateField}
            field={{
              label: field.label,
              path: ['patrimony', period, field.key],
              value: patrimony[period][field.key],
              step: field.step,
              unit: '%',
            }}
          />
        ))}
      </SectionBlock>
    </SettingsYearColumn>
  );
}

function PatrimonySection(): ReactElement {
  const { effectiveLabels } = usePrelevementsContext();

  return (
    <SectionFrame title="Prélèvements sociaux sur patrimoine et capital">
      <>
        <p className="fisc-intro">
          Cas général pour les revenus du capital au taux en vigueur ; taux d'exception pour les
          revenus fonciers, plus-values immobilières, assurance-vie, PEP et épargne logement selon
          les cas.
          <LegalRefInlineList ids={PRELEVEMENTS_PATRIMOINE_REF_IDS} />
        </p>
        <div className="tax-two-cols">
          <PatrimonyPeriodColumn period="current" label={effectiveLabels.currentYearLabel} />
          <PatrimonyPeriodColumn period="previous" label={effectiveLabels.previousYearLabel} />
        </div>
      </>
    </SectionFrame>
  );
}

function PassHistorySection(): ReactElement {
  const { isAdmin, passRows, updatePassAmount } = usePrelevementsContext();

  return (
    <SectionBlock title="Historique du PASS">
      <p className="fisc-intro fisc-intro--compact">
        Historique du plafond annuel de la sécurité sociale utilisé par les paramètres de
        prélèvements sociaux.
        <LegalRefInlineList ids={PRELEVEMENTS_PASS_REF_IDS} />
      </p>
      <table className="settings-table settings-memento-readonly-table">
        <thead>
          <tr>
            <th>Année</th>
            <th className="settings-table-amount-col">PASS</th>
          </tr>
        </thead>
        <tbody>
          {passRows.map((row, index) => (
            <tr key={row.year}>
              <td>{row.year}</td>
              <td className="settings-table-amount-col">
                {isAdmin ? (
                  <input
                    type="number"
                    aria-label={`PASS ${row.year}`}
                    value={row.pass_amount ?? ''}
                    placeholder="À renseigner"
                    onChange={(event) => updatePassAmount(index, event.target.value)}
                  />
                ) : (
                  formatAmount(row.pass_amount)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionBlock>
  );
}

function RetirementBracketsSection(): ReactElement {
  const { effectiveLabels, isAdmin, retirement, updateRetirementBracket } =
    usePrelevementsContext();
  const yearPeriods: Array<{
    yearKey: PrelevementsRetirementYearKey;
    label: string;
    prefix: string;
  }> = [
    { yearKey: 'current', label: effectiveLabels.currentYearLabel, prefix: 'retCur' },
    { yearKey: 'previous', label: effectiveLabels.previousYearLabel, prefix: 'retPrev' },
  ];

  return (
    <SectionBlock title="Prélèvements sociaux sur pensions de retraite">
      <p className="fisc-intro fisc-intro--compact">
        Barème des prélèvements sociaux sur les pensions de retraite (RFR pour 1 part). Les montants
        sont ajustés en fonction des parts, mais la base stockée reste la base 1 part.
        <LegalRefInlineList ids={PRELEVEMENTS_RETRAITE_REF_IDS} />
      </p>
      {yearPeriods.map(({ yearKey, label, prefix }, index) => {
        const rows = retirement[yearKey].brackets.map((bracket, bracketIndex) => ({
          ...bracket,
          _key: `${prefix}-${bracketIndex}`,
        }));

        return (
          <div
            key={yearKey}
            className={`income-tax-block${index > 0 ? ' income-tax-block--mt12' : ''}`}
          >
            <div className="income-tax-block-title">{label}</div>
            {isAdmin ? (
              <SettingsTable
                columns={retirementColumns}
                rows={rows}
                onCellChange={(bracketIndex, key, value) =>
                  updateRetirementBracket(
                    yearKey,
                    bracketIndex,
                    key as PrelevementsRetirementBracketKey,
                    value,
                  )
                }
                className="settings-table--spaced"
              />
            ) : (
              <ReadonlyTable columns={readonlyRetirementColumns} rows={rows} />
            )}
          </div>
        );
      })}
    </SectionBlock>
  );
}

function ThresholdRegionBlock({
  period,
  region,
}: {
  period: 'current' | 'previous';
  region: (typeof regionSections)[number];
}): ReactElement {
  const { isAdmin, retirementThresholds, updateField } = usePrelevementsContext();
  const values = retirementThresholds[period][region.key];

  return (
    <SectionBlock title={region.label}>
      {thresholdFields.map((field) => (
        <EditableOrReadonlyField
          key={`${period}-${region.key}-${field.key}`}
          isAdmin={isAdmin}
          updateField={updateField}
          field={{
            label: field.label,
            path: ['retirementThresholds', period, region.key, field.key],
            value: values?.[field.key] ?? null,
            unit: 'EUR',
          }}
        />
      ))}
    </SectionBlock>
  );
}

function RetirementThresholdsSection(): ReactElement {
  const { effectiveLabels } = usePrelevementsContext();

  return (
    <SectionBlock title="Seuils RFR pour CSG, CRDS et CASA">
      <p className="fisc-intro fisc-intro--compact">
        Seuils de revenu fiscal de référence utilisés pour déterminer l'exonération ou
        l'assujettissement aux taux réduit, médian ou normal sur les pensions de retraite.
        <LegalRefInlineList ids={PRELEVEMENTS_SEUILS_REF_IDS} />
      </p>
      <div className="tax-two-cols">
        <SettingsYearColumn yearLabel={effectiveLabels.currentYearLabel}>
          {regionSections.map((region) => (
            <ThresholdRegionBlock key={`current-${region.key}`} period="current" region={region} />
          ))}
        </SettingsYearColumn>
        <SettingsYearColumn yearLabel={effectiveLabels.previousYearLabel} isRight>
          {regionSections.map((region) => (
            <ThresholdRegionBlock
              key={`previous-${region.key}`}
              period="previous"
              region={region}
            />
          ))}
        </SettingsYearColumn>
      </div>
    </SectionBlock>
  );
}

function RetirementGlobalSection(): ReactElement {
  return (
    <SectionFrame title="Repères sociaux retraite">
      <>
        <PassHistorySection />
        <RetirementBracketsSection />
        <RetirementThresholdsSection />
      </>
    </SectionFrame>
  );
}

function DividendsTnsSection(): ReactElement {
  const { isAdmin, socialDirigeant, updateField } = usePrelevementsContext();

  return (
    <SectionFrame title="Seuil social des dividendes TNS">
      <>
        <p className="fisc-intro">
          Seuil social des dividendes TNS centralisé pour les moteurs société et dirigeant.
          <LegalRefInlineList ids={PRELEVEMENTS_SOCIAL_DIRIGEANT_REF_IDS} />
        </p>
        <SectionBlock title="Dividendes TNS">
          <EditableOrReadonlyField
            isAdmin={isAdmin}
            updateField={updateField}
            field={{
              label: 'Seuil dividendes TNS soumis aux charges sociales',
              path: ['socialDirigeant', 'current', 'dividends', 'tnsSocialBasePct'],
              value: socialDirigeant.current.dividends.tnsSocialBasePct,
              step: '0.1',
              unit: '%',
            }}
          />
        </SectionBlock>
      </>
    </SectionFrame>
  );
}

function SocialDirigeantScopeSection(): ReactElement {
  return (
    <SectionFrame title="Périmètres sociaux dirigeant à compléter">
      <>
        <p className="fisc-intro">
          Le seuil dividendes TNS est disponible ; les autres périmètres restent à compléter avant
          usage complet.
          <LegalRefInlineList ids={PRELEVEMENTS_SOCIAL_DIRIGEANT_REF_IDS} />
        </p>
        <div className="income-tax-block">
          <div className="settings-registry-status-panel__counts">
            <span className="settings-registry-status-panel__count is-partial">
              Périmètre social à compléter
            </span>
          </div>
          <div className="income-tax-block-title">Périmètres bloqués</div>
          <div className="income-tax-block-body">
            <ul className="settings-error-list">
              <li>Rémunération TNS - à compléter</li>
              <li>Rémunération assimilé salarié - à compléter</li>
              <li>Tranches TA/TB/TC - à compléter</li>
              <li>Madelin - bloqué consommateur</li>
            </ul>
          </div>
        </div>
      </>
    </SectionFrame>
  );
}

export default function MementoPrelevementsEntrySection({
  entryKey,
}: MementoEntrySectionProps): ReactElement | null {
  const { loading } = usePrelevementsContext();

  if (loading) return <p className="settings-memento-empty">Chargement des prélèvements...</p>;

  if (entryKey === 'placements.ps-pfu-revenus-capital') return <PatrimonySection />;
  if (entryKey === 'retraite.globale') return <RetirementGlobalSection />;
  if (entryKey === 'dirigeant.dividendes-tns') return <DividendsTnsSection />;
  if (entryKey === 'dirigeant.charges-sociales-tns') return <SocialDirigeantScopeSection />;

  return null;
}
