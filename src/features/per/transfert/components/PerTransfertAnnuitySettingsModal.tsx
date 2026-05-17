import type { MortalityTableCode } from '@/data/mortality';
import { SimModalShell } from '@/components/ui/sim';
import type { PerTransfertFormState } from '../hooks/usePerTransfertSimulator';
import {
  PerTransfertIntegerField,
  PerTransfertRateField,
  PerTransfertSelectField,
} from './PerTransfertFields';

interface PerTransfertAnnuitySettingsModalProps {
  state: PerTransfertFormState;
  update: <K extends keyof PerTransfertFormState>(key: K, value: PerTransfertFormState[K]) => void;
  onClose: () => void;
}

const MORTALITY_OPTIONS = [
  { value: 'TGH05', label: 'TGH05 hommes' },
  { value: 'TGF05', label: 'TGF05 femmes' },
  { value: 'TPRV93', label: 'TPRV93 ancienne table' },
  { value: 'TPG93', label: 'TPG93 générationnelle' },
];

export function PerTransfertAnnuitySettingsModal({
  state,
  update,
  onClose,
}: PerTransfertAnnuitySettingsModalProps) {
  return (
    <SimModalShell
      title="Paramètres de rente du nouveau PER"
      subtitle="Par défaut : TGF05/TGH05 selon le sexe, taux technique à 0 %."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="sim-modal-btn sim-modal-btn--ghost" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="sim-modal-btn sim-modal-btn--primary" onClick={onClose}>
            Appliquer
          </button>
        </>
      }
    >
      <div className="per-transfert-modal-grid">
        <PerTransfertSelectField
          label="Table de mortalité"
          value={state.mortalityTable}
          onChange={(value) => update('mortalityTable', value as MortalityTableCode)}
          options={MORTALITY_OPTIONS}
        />
        <PerTransfertRateField
          label="Taux technique"
          value={state.technicalRate}
          onChange={(value) => update('technicalRate', value)}
        />
        <PerTransfertRateField
          label="Frais conversion"
          value={state.conversionFeeRate}
          onChange={(value) => update('conversionFeeRate', value)}
        />
        <PerTransfertRateField
          label="Frais arrérages"
          value={state.arrearsFeeRate}
          onChange={(value) => update('arrearsFeeRate', value)}
        />
        <PerTransfertRateField
          label="Revalorisation rente PER"
          value={state.newRentRevaluationRate}
          onChange={(value) => update('newRentRevaluationRate', value)}
          suffix="% / an"
        />
        <PerTransfertIntegerField
          label="Annuités garanties"
          value={state.guaranteedYears}
          onChange={(value) => update('guaranteedYears', value)}
          min={0}
          suffix="ans"
        />
        <PerTransfertRateField
          label="Taux de réversion"
          value={state.reversionRate}
          onChange={(value) => update('reversionRate', value)}
        />
        <PerTransfertIntegerField
          label="Année naissance conjoint"
          value={state.spouseBirthYear}
          onChange={(value) => update('spouseBirthYear', value)}
          min={1900}
        />
        <PerTransfertIntegerField
          label="Âge conjoint liquidation"
          value={state.spouseAgeAtLiquidation}
          onChange={(value) => update('spouseAgeAtLiquidation', value)}
          min={0}
          suffix="ans"
        />
        <label className="per-transfert-checkbox per-transfert-modal-grid__wide">
          <input
            type="checkbox"
            checked={state.reversionEnabled}
            onChange={(event) => update('reversionEnabled', event.target.checked)}
          />
          Activer la réversion dans le tarif de rente du nouveau PER
        </label>
      </div>
    </SimModalShell>
  );
}
