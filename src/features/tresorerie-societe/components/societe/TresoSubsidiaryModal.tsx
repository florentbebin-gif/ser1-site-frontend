import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimModalShell } from '@/components/ui/sim/SimModalShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type { CompanyInput, SubsidiaryInput } from '@/engine/tresorerie/types';
import {
  fmtEuroInput,
  parseEuroInput,
  parseNumberInput,
  parsePctInput,
} from '../../utils/tresorerieFormatters';

interface TresoSubsidiaryModalProps {
  company: CompanyInput;
  subsidiary: SubsidiaryInput;
  onChange: (patch: Partial<SubsidiaryInput>) => void;
  onClose: () => void;
}

function parentLabel(company: CompanyInput, parentId: string | undefined): string {
  if (!parentId || parentId === 'societe') return 'Société mère';
  return company.subsidiaries.find(subsidiary => subsidiary.id === parentId)?.label ?? 'Filiale parente';
}

export function TresoSubsidiaryModal({
  company,
  subsidiary,
  onChange,
  onClose,
}: TresoSubsidiaryModalProps) {
  const parentOptions = [
    { value: 'societe', label: 'Sous la société mère' },
    ...company.subsidiaries
      .filter(candidate => candidate.id !== subsidiary.id)
      .map(candidate => ({ value: candidate.id, label: `Sous ${candidate.label}` })),
  ];
  const parentId = subsidiary.parentEntityId ?? 'societe';

  return (
    <SimModalShell
      title="Paramétrer la filiale"
      subtitle={`${parentLabel(company, parentId)} détient ${subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct} %`}
      onClose={onClose}
      modalClassName="ts-company-modal"
      bodyClassName="ts-company-modal__body"
    >
      <div className="ts-modal-grid">
        <SimFieldShell label="Libellé" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            className="sim-field__control ts-input-left"
            value={subsidiary.label}
            onChange={event => onChange({ label: event.target.value })}
          />
        </SimFieldShell>

        <SimFieldShell label="Position dans le schéma" className="ts-field" rowClassName="ts-field__row">
          <SimSelect
            value={parentId}
            onChange={value => onChange({ parentEntityId: value })}
            options={parentOptions}
            ariaLabel="Position de la filiale"
          />
        </SimFieldShell>

        <SimFieldShell label="Détenteur affiché" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            className="sim-field__control ts-input-left"
            value={parentLabel(company, parentId)}
            readOnly
          />
        </SimFieldShell>

        <SimFieldShell label="% de détention" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="decimal"
            className="sim-field__control"
            value={String(subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct)}
            onChange={event => {
              const ownershipPct = parsePctInput(event.target.value);
              onChange({ ownershipPct, holdingOwnershipPct: ownershipPct });
            }}
          />
          <span className="sim-field__unit ts-unit">%</span>
        </SimFieldShell>

        <SimFieldShell label="Ordre d’affichage" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={subsidiary.displayOrder ?? 0}
            onChange={event => onChange({ displayOrder: parseNumberInput(event.target.value) })}
          />
        </SimFieldShell>

        <SimFieldShell label="Prestations annuelles" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmtEuroInput(subsidiary.annualServicesRevenue)}
            onChange={event => onChange({ annualServicesRevenue: parseEuroInput(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        <SimFieldShell label="Dividendes annuels" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmtEuroInput(subsidiary.annualDividends)}
            onChange={event => onChange({ annualDividends: parseEuroInput(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        <label className="ts-toggle-label ts-modal-toggle">
          <input
            type="checkbox"
            checked={subsidiary.motherDaughterEligible}
            onChange={event => onChange({ motherDaughterEligible: event.target.checked })}
          />
          Régime mère-fille éligible
        </label>
      </div>
    </SimModalShell>
  );
}
