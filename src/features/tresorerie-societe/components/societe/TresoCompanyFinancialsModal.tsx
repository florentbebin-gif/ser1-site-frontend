import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimModalShell } from '@/components/ui/sim/SimModalShell';
import type { CompanyInputV6 } from '@/engine/tresorerie/types';
import { fmtEuroInput, parseEuroInput } from '../../utils/tresorerieFormatters';

interface TresoCompanyFinancialsModalProps {
  company: CompanyInputV6;
  onChange: (patch: Partial<CompanyInputV6>) => void;
  onClose: () => void;
}

export function TresoCompanyFinancialsModal({
  company,
  onChange,
  onClose,
}: TresoCompanyFinancialsModalProps) {
  return (
    <SimModalShell
      title="Paramètres financiers"
      subtitle="Capital, primes, réserves et option IS"
      onClose={onClose}
      overlayClassName="ts-nested-modal-overlay"
      modalClassName="sim-modal--lg"
      bodyClassName="ts-company-modal__body"
      footer={
        <button type="button" className="sim-modal-btn sim-modal-btn--primary" onClick={onClose}>
          Fermer
        </button>
      }
    >
      <div className="ts-modal-grid">
        <SimFieldShell label="Capital social" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmtEuroInput(company.shareCapital)}
            onChange={(event) => onChange({ shareCapital: parseEuroInput(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        <SimFieldShell label="Prime d’émission" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmtEuroInput(company.sharePremium)}
            onChange={(event) => onChange({ sharePremium: parseEuroInput(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        <SimFieldShell label="Réserves initiales" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmtEuroInput(company.reservesInitial)}
            onChange={(event) => onChange({ reservesInitial: parseEuroInput(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        <SimFieldShell
          label="Réserve légale initiale"
          className="ts-field"
          rowClassName="ts-field__row"
        >
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmtEuroInput(company.legalReserveInitial ?? 0)}
            onChange={(event) =>
              onChange({ legalReserveInitial: parseEuroInput(event.target.value) })
            }
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>

        <label className="ts-toggle-label ts-modal-toggle">
          <input
            type="checkbox"
            checked={company.reducedCorporateTaxEligible}
            onChange={(event) => onChange({ reducedCorporateTaxEligible: event.target.checked })}
          />
          Éligible au taux réduit d’IS
        </label>
      </div>
    </SimModalShell>
  );
}
