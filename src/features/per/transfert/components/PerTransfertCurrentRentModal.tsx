import type { MortalityTableCode } from '@/data/mortality';
import { SimModalShell } from '@/components/ui/sim';
import type { PerTransfertFormState } from '../hooks/usePerTransfertSimulator';
import {
  PerTransfertIntegerField,
  PerTransfertRateField,
  PerTransfertSelectField,
} from './PerTransfertFields';

interface PerTransfertCurrentRentModalProps {
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

export function PerTransfertCurrentRentModal({
  state,
  update,
  onClose,
}: PerTransfertCurrentRentModalProps) {
  return (
    <SimModalShell
      title="Calcul de rente personnalisé"
      subtitle="Mode expert pour remplacer la rente indiquée sur le relevé"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="sim-modal-btn sim-modal-btn--ghost" onClick={onClose}>
            Fermer
          </button>
          <button type="button" className="sim-modal-btn sim-modal-btn--primary" onClick={onClose}>
            Appliquer
          </button>
        </>
      }
    >
      <div className="per-transfert-modal-grid">
        <PerTransfertSelectField
          label="Mode de calcul"
          value={state.currentRentMode}
          onChange={(value) =>
            update('currentRentMode', value as PerTransfertFormState['currentRentMode'])
          }
          options={[
            { value: 'statement', label: 'Utiliser la rente du relevé' },
            { value: 'manual_table', label: 'Appliquer une table de mortalité' },
          ]}
        />

        {state.currentRentMode === 'manual_table' ? (
          <>
            <PerTransfertSelectField
              label="Table de mortalité"
              value={state.mortalityTable}
              onChange={(value) => update('mortalityTable', value as MortalityTableCode)}
              options={MORTALITY_OPTIONS}
            />
            <PerTransfertRateField
              label="Taux technique"
              value={state.currentTechnicalRate}
              onChange={(value) => update('currentTechnicalRate', value)}
            />
            <PerTransfertRateField
              label="Frais conversion rente"
              value={state.currentConversionFeeRate}
              onChange={(value) => update('currentConversionFeeRate', value)}
            />
            <PerTransfertRateField
              label="Frais arrérages"
              value={state.currentArrearsFeeRate}
              onChange={(value) => update('currentArrearsFeeRate', value)}
            />
            <PerTransfertIntegerField
              label="Annuités garanties"
              value={state.currentGuaranteedYears}
              onChange={(value) => update('currentGuaranteedYears', value)}
              min={0}
              suffix="ans"
            />
            <PerTransfertRateField
              label="Taux de réversion"
              value={state.currentReversionRate}
              onChange={(value) => update('currentReversionRate', value)}
            />
            <label className="per-transfert-checkbox per-transfert-modal-grid__wide">
              <input
                type="checkbox"
                checked={state.currentReversionEnabled}
                onChange={(event) => update('currentReversionEnabled', event.target.checked)}
              />
              Activer la réversion dans le tarif du contrat actuel
            </label>
            {state.currentReversionEnabled ? (
              <PerTransfertIntegerField
                label="Année de naissance du conjoint"
                value={state.currentReversionSpouseBirthYear}
                onChange={(value) => update('currentReversionSpouseBirthYear', value)}
                min={1900}
                hint="Utilisée pour recalculer l’âge du conjoint à la liquidation."
              />
            ) : null}
          </>
        ) : (
          <p className="per-transfert-modal-note per-transfert-modal-grid__wide">
            SER1 conserve la rente brute annuelle du relevé comme rente estimée à l'âge de
            liquidation, puis applique uniquement la fiscalité et la revalorisation après
            liquidation.
          </p>
        )}
      </div>
    </SimModalShell>
  );
}
