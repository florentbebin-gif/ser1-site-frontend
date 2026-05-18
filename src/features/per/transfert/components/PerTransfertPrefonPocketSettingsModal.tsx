import { SimModalShell } from '@/components/ui/sim';
import type { BaseCgRetraitePrefonPocket } from '@/data/base-cg-retraite';
import {
  PerTransfertIntegerField,
  PerTransfertMoneyField,
  PerTransfertRateField,
} from './PerTransfertFields';

interface PerTransfertPrefonPocketSettingsModalProps {
  pocket: BaseCgRetraitePrefonPocket;
  index: number;
  onChange: (_index: number, _updates: Partial<BaseCgRetraitePrefonPocket>) => void;
  onClose: () => void;
}

export function PerTransfertPrefonPocketSettingsModal({
  pocket,
  index,
  onChange,
  onClose,
}: PerTransfertPrefonPocketSettingsModalProps) {
  return (
    <SimModalShell
      title={`Paramètres de la poche ${index + 1}`}
      subtitle="Réversion, revalorisation de la valeur de service et options capital propres au compartiment Préfon."
      onClose={onClose}
      footer={
        <button type="button" className="sim-modal-btn sim-modal-btn--primary" onClick={onClose}>
          Appliquer
        </button>
      }
    >
      <div className="per-transfert-modal-grid">
        <PerTransfertRateField
          label="Revalorisation valeur de service"
          value={pocket.serviceRevaluationRate ?? 0}
          onChange={(value) => onChange(index, { serviceRevaluationRate: value })}
          suffix="% / an"
        />
        <PerTransfertIntegerField
          label="Année naissance réversataire"
          value={pocket.spouseBirthYear ?? 0}
          onChange={(value) => onChange(index, { spouseBirthYear: value })}
          min={1900}
        />
        <PerTransfertRateField
          label="Taux de réversion"
          value={pocket.reversionRate ?? 60}
          onChange={(value) => onChange(index, { reversionRate: value })}
          min={0}
          max={100}
        />
        <PerTransfertMoneyField
          label="Valeur de transfert globale"
          value={pocket.capitalAmount ?? 0}
          onChange={(value) => onChange(index, { capitalAmount: value })}
          hint="Fallback avancé si le relevé ne fournit aucun nombre de points exploitable."
        />
        <label className="per-transfert-checkbox">
          <input
            type="checkbox"
            checked={Boolean(pocket.reversionEnabled)}
            onChange={(event) => onChange(index, { reversionEnabled: event.target.checked })}
          />
          Activer la réversion sur cette poche
        </label>
        {pocket.compartment === 'C0' ? (
          <label className="per-transfert-checkbox">
            <input
              type="checkbox"
              checked={Boolean(pocket.c0CapitalOptionEnabled)}
              onChange={(event) =>
                onChange(index, { c0CapitalOptionEnabled: event.target.checked })
              }
            />
            Option capital C0 limitée à 20 %
          </label>
        ) : null}
        {pocket.compartment === 'C1' ||
        pocket.compartment === 'C1_BIS' ||
        pocket.compartment === 'C2' ? (
          <label className="per-transfert-checkbox">
            <input
              type="checkbox"
              checked={pocket.capitalOptionEnabled !== false}
              onChange={(event) => onChange(index, { capitalOptionEnabled: event.target.checked })}
            />
            Capital possible sur cette poche
          </label>
        ) : null}
      </div>
    </SimModalShell>
  );
}
