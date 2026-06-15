import type { ReactElement } from 'react';
import SettingsFieldRow from '@/components/settings/SettingsFieldRow';
import SettingsYearColumn from '@/components/settings/SettingsYearColumn';
import type { ComptablesSocietesCorporateTax } from '../ComptablesSocietes/comptablesSocietesSaveAdapter';
import { useComptablesSocietesContext } from '../ComptablesSocietes/ComptablesSocietesProvider';
import type { MementoEntrySectionProps } from './mementoEntrySections';

type PeriodKey = 'current' | 'previous';
type ValueUnit = '%' | 'EUR';

interface FieldDefinition {
  label: string;
  path: string[];
  value: number | null | undefined;
  step?: string;
  unit: ValueUnit;
}

const percentFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
});
const amountFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});

function formatValue(value: number | null | undefined, unit: ValueUnit): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'Non renseigné';
  if (unit === 'EUR') return `${amountFormatter.format(value)} €`;
  return `${percentFormatter.format(value)} %`;
}

function periodLabel(
  incomeTax: ReturnType<typeof useComptablesSocietesContext>['incomeTax'],
  period: PeriodKey,
): string {
  if (period === 'current') return incomeTax.currentYearLabel || 'Année N';
  return incomeTax.previousYearLabel || 'Année N-1';
}

function ReadonlyValueRow({ field }: { field: FieldDefinition }): ReactElement {
  return (
    <div className="settings-comptables-readonly-row">
      <span>{field.label}</span>
      <strong>{formatValue(field.value, field.unit)}</strong>
    </div>
  );
}

function EditableValueRow({
  field,
  updateField,
}: {
  field: FieldDefinition;
  updateField: (path: string[], value: string | number | null) => void;
}): ReactElement {
  return (
    <SettingsFieldRow
      label={field.label}
      path={field.path}
      value={field.value ?? null}
      onChange={updateField}
      step={field.step}
      unit={field.unit}
    />
  );
}

function FieldRows({
  fields,
  isAdmin,
  updateField,
}: {
  fields: FieldDefinition[];
  isAdmin: boolean;
  updateField: (path: string[], value: string | number | null) => void;
}): ReactElement {
  return (
    <div className="income-tax-block-body">
      {fields.map((field) =>
        isAdmin ? (
          <EditableValueRow key={field.path.join('.')} field={field} updateField={updateField} />
        ) : (
          <ReadonlyValueRow key={field.path.join('.')} field={field} />
        ),
      )}
    </div>
  );
}

function EntryFrame({ title, children }: { title: string; children: ReactElement }): ReactElement {
  return (
    <section className="settings-comptables-entry-section">
      <h6>{title}</h6>
      {children}
    </section>
  );
}

function PeriodColumns({
  title,
  currentFields,
  previousFields,
  errorByPeriod,
}: {
  title: string;
  currentFields: FieldDefinition[];
  previousFields: FieldDefinition[];
  errorByPeriod?: Partial<Record<PeriodKey, string | undefined>>;
}): ReactElement {
  const { incomeTax, isAdmin, updateField } = useComptablesSocietesContext();

  return (
    <EntryFrame title={title}>
      <div className="tax-two-cols">
        <SettingsYearColumn yearLabel={periodLabel(incomeTax, 'current')}>
          <div className="income-tax-block">
            <FieldRows fields={currentFields} isAdmin={isAdmin} updateField={updateField} />
            {errorByPeriod?.current ? (
              <p className="fisc-section-error">{errorByPeriod.current}</p>
            ) : null}
          </div>
        </SettingsYearColumn>
        <SettingsYearColumn yearLabel={periodLabel(incomeTax, 'previous')} isRight>
          <div className="income-tax-block">
            <FieldRows fields={previousFields} isAdmin={isAdmin} updateField={updateField} />
            {errorByPeriod?.previous ? (
              <p className="fisc-section-error">{errorByPeriod.previous}</p>
            ) : null}
          </div>
        </SettingsYearColumn>
      </div>
    </EntryFrame>
  );
}

function corporateField(
  corporateTax: ComptablesSocietesCorporateTax,
  period: PeriodKey,
  field: keyof ComptablesSocietesCorporateTax[PeriodKey],
  label: string,
  unit: ValueUnit,
  step?: string,
): FieldDefinition {
  const value = corporateTax[period][field];
  return {
    label,
    path: ['corporateTax', period, String(field)],
    value: typeof value === 'number' || value === null ? value : null,
    step,
    unit,
  };
}

function qpfcField(
  corporateTax: ComptablesSocietesCorporateTax,
  period: PeriodKey,
  field: 'standard' | 'group',
  label: string,
): FieldDefinition {
  return {
    label,
    path: ['corporateTax', period, 'motherDaughterQpfc', field],
    value: corporateTax[period].motherDaughterQpfc?.[field] ?? null,
    step: '0.1',
    unit: '%',
  };
}

function CorporateTaxRatesSection(): ReactElement {
  const { corporateTax } = useComptablesSocietesContext();

  return (
    <PeriodColumns
      title="Taux IS"
      currentFields={[
        corporateField(corporateTax, 'current', 'normalRate', 'Taux normal IS', '%', '0.1'),
        corporateField(corporateTax, 'current', 'reducedRate', 'Taux réduit IS', '%', '0.1'),
        corporateField(corporateTax, 'current', 'reducedThreshold', 'Seuil taux réduit', 'EUR'),
      ]}
      previousFields={[
        corporateField(corporateTax, 'previous', 'normalRate', 'Taux normal IS', '%', '0.1'),
        corporateField(corporateTax, 'previous', 'reducedRate', 'Taux réduit IS', '%', '0.1'),
        corporateField(corporateTax, 'previous', 'reducedThreshold', 'Seuil taux réduit', 'EUR'),
      ]}
    />
  );
}

function MotherDaughterSection(): ReactElement {
  const { corporateTax, corporateTaxErrors } = useComptablesSocietesContext();

  return (
    <PeriodColumns
      title="Quote-part mère-fille"
      currentFields={[
        qpfcField(corporateTax, 'current', 'standard', 'Quote-part frais (régime standard)'),
        qpfcField(corporateTax, 'current', 'group', 'Quote-part frais (groupe fiscal)'),
      ]}
      previousFields={[
        qpfcField(corporateTax, 'previous', 'standard', 'Quote-part frais (régime standard)'),
        qpfcField(corporateTax, 'previous', 'group', 'Quote-part frais (groupe fiscal)'),
      ]}
      errorByPeriod={{
        current: corporateTaxErrors['corporateTax.current.motherDaughterQpfc'],
        previous: corporateTaxErrors['corporateTax.previous.motherDaughterQpfc'],
      }}
    />
  );
}

function CcaDeductibilitySection(): ReactElement {
  const { corporateTax } = useComptablesSocietesContext();

  return (
    <PeriodColumns
      title="Déductibilité des intérêts CCA"
      currentFields={[
        corporateField(
          corporateTax,
          'current',
          'maxDeductibleCcaInterestRate',
          'Intérêts CCA (taux max déductible)',
          '%',
          '0.01',
        ),
      ]}
      previousFields={[
        corporateField(
          corporateTax,
          'previous',
          'maxDeductibleCcaInterestRate',
          'Intérêts CCA (taux max déductible)',
          '%',
          '0.01',
        ),
      ]}
    />
  );
}

function DividendsAbatementSection(): ReactElement {
  const { corporateTax } = useComptablesSocietesContext();

  return (
    <PeriodColumns
      title="Abattement dividendes au barème"
      currentFields={[
        corporateField(
          corporateTax,
          'current',
          'dividendsAbatementPct',
          'Abattement dividendes au barème',
          '%',
          '0.1',
        ),
      ]}
      previousFields={[
        corporateField(
          corporateTax,
          'previous',
          'dividendsAbatementPct',
          'Abattement dividendes au barème',
          '%',
          '0.1',
        ),
      ]}
    />
  );
}

export default function MementoComptablesSocietesEntrySection({
  entryKey,
}: MementoEntrySectionProps): ReactElement | null {
  const { loading } = useComptablesSocietesContext();

  if (loading) {
    return <p className="settings-memento-empty">Chargement des paramètres comptables...</p>;
  }

  if (entryKey === 'societe.is') return <CorporateTaxRatesSection />;
  if (entryKey === 'societe.groupe-mere-fille-qpfc') return <MotherDaughterSection />;
  if (entryKey === 'societe.compte-courant-associe') return <CcaDeductibilitySection />;
  if (entryKey === 'dirigeant.dividendes-tns') return <DividendsAbatementSection />;

  return null;
}
