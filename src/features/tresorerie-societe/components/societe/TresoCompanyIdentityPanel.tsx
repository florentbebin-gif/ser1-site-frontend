import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import {
  COMPANY_CREATION_TYPE_OPTIONS,
  COMPANY_KIND_OPTIONS,
  LEGAL_FORM_OPTIONS,
} from '../../utils/tresorerieSocieteOptions';
import type { CompanyInput, CompanyInputV5, CompanyKind, LegalForm } from '@/engine/tresorerie/types';
import {
  fmtEuroInput,
  parseEuroInput,
} from '../../utils/tresorerieFormatters';

interface TresoCompanyIdentityPanelProps {
  company: CompanyInputV5;
  onCompanyChange: (patch: Partial<CompanyInputV5>) => void;
}

export function TresoCompanyIdentityPanel({
  company,
  onCompanyChange,
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

      <p className="ts-note--info">
        La date de début de projection se règle dans le parcours associé en haut de page.
      </p>

      <SimFieldShell label="Type de société" className="ts-field" rowClassName="ts-field__row">
        <SimSelect
          value={company.creationType}
          onChange={value => onCompanyChange({ creationType: value as CompanyInput['creationType'] })}
          options={COMPANY_CREATION_TYPE_OPTIONS}
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
