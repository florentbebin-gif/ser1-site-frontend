import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type { CompanyInput, CompanyKind, LegalForm } from '@/engine/tresorerie/types';
import {
  COMPANY_KIND_CODES,
  COMPANY_KIND_LABELS,
} from '../../utils/tresorerieSocieteModel';
import {
  fmtEuroInput,
  parseEuroInput,
  parseNumberInput,
} from '../../utils/tresorerieFormatters';

interface TresoCompanyIdentityPanelProps {
  company: CompanyInput;
  projectionStartYear: number;
  onCompanyChange: (patch: Partial<CompanyInput>) => void;
  onProjectionStartYearChange: (year: number) => void;
}

const TYPE_OPTIONS = [
  { value: 'newco', label: 'Société à créer' },
  { value: 'existante', label: 'Société existante' },
];

const LEGAL_FORM_OPTIONS: Array<{ value: LegalForm; label: string }> = [
  { value: 'sas', label: 'SAS' },
  { value: 'sc', label: 'SC' },
  { value: 'sarl', label: 'SARL' },
  { value: 'sa', label: 'SA' },
  { value: 'selarl', label: 'SELARL' },
  { value: 'spfpl', label: 'SPFPL' },
  { value: 'selas', label: 'SELAS' },
  { value: 'autre', label: 'Autre' },
];

const COMPANY_KIND_OPTIONS: Array<{ value: CompanyKind; label: string }> =
  (Object.keys(COMPANY_KIND_LABELS) as CompanyKind[]).map(kind => ({
    value: kind,
    label: `${COMPANY_KIND_LABELS[kind]} (${COMPANY_KIND_CODES[kind]})`,
  }));

export function TresoCompanyIdentityPanel({
  company,
  projectionStartYear,
  onCompanyChange,
  onProjectionStartYearChange,
}: TresoCompanyIdentityPanelProps) {
  return (
    <div className="ts-modal-grid">
      <SimFieldShell label="Libellé de la société principale" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          className="sim-field__control ts-input-left"
          value={company.label ?? ''}
          onChange={event => onCompanyChange({ label: event.target.value })}
        />
      </SimFieldShell>

      <SimFieldShell label="Début de projection" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={projectionStartYear}
          onChange={event => onProjectionStartYearChange(parseNumberInput(event.target.value))}
        />
      </SimFieldShell>

      <SimFieldShell label="Type de société" className="ts-field" rowClassName="ts-field__row">
        <SimSelect
          value={company.creationType}
          onChange={value => onCompanyChange({ creationType: value as CompanyInput['creationType'] })}
          options={TYPE_OPTIONS}
          ariaLabel="Type de société"
        />
      </SimFieldShell>

      <SimFieldShell label="Forme sociale" className="ts-field" rowClassName="ts-field__row">
        <SimSelect
          value={company.legalForm}
          onChange={value => onCompanyChange({ legalForm: value as LegalForm })}
          options={LEGAL_FORM_OPTIONS}
          ariaLabel="Forme sociale"
        />
      </SimFieldShell>

      <SimFieldShell label="Type société" className="ts-field" rowClassName="ts-field__row">
        <SimSelect
          value={company.companyKind ?? 'holding_patrimoniale'}
          onChange={value => onCompanyChange({ companyKind: value as CompanyKind })}
          options={COMPANY_KIND_OPTIONS}
          ariaLabel="Type société"
        />
      </SimFieldShell>

      <SimFieldShell label="Capital social" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmtEuroInput(company.shareCapital)}
          onChange={event => onCompanyChange({ shareCapital: parseEuroInput(event.target.value) })}
        />
        <span className="sim-field__unit ts-unit">€</span>
      </SimFieldShell>

      <SimFieldShell label="Prime d’émission" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmtEuroInput(company.sharePremium)}
          onChange={event => onCompanyChange({ sharePremium: parseEuroInput(event.target.value) })}
        />
        <span className="sim-field__unit ts-unit">€</span>
      </SimFieldShell>

      <SimFieldShell label="Trésorerie initiale" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmtEuroInput(company.treasuryInitial)}
          onChange={event => onCompanyChange({ treasuryInitial: parseEuroInput(event.target.value) })}
        />
        <span className="sim-field__unit ts-unit">€</span>
      </SimFieldShell>

      <SimFieldShell label="Réserves initiales" className="ts-field" rowClassName="ts-field__row">
        <input
          type="text"
          inputMode="numeric"
          className="sim-field__control"
          value={fmtEuroInput(company.reservesInitial)}
          onChange={event => onCompanyChange({ reservesInitial: parseEuroInput(event.target.value) })}
        />
        <span className="sim-field__unit ts-unit">€</span>
      </SimFieldShell>

      <label className="ts-toggle-label ts-modal-toggle">
        <input
          type="checkbox"
          checked={company.reducedCorporateTaxEligible}
          onChange={event => onCompanyChange({ reducedCorporateTaxEligible: event.target.checked })}
        />
        Éligible au taux réduit d’IS
      </label>
    </div>
  );
}
