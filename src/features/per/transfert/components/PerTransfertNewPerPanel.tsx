import { SimActionButton } from '@/components/ui/sim';
import type { PerTransfertFormState } from '../hooks/usePerTransfertSimulator';
import { PerTransfertMoneyField, PerTransfertRateField } from './PerTransfertFields';
import { FieldGrid, Panel } from './PerTransfertLayoutPrimitives';

type PerTransfertUpdate = <K extends keyof PerTransfertFormState>(
  key: K,
  value: PerTransfertFormState[K],
) => void;

interface PerTransfertNewPerPanelProps {
  state: PerTransfertFormState;
  isC3CapitalLocked: boolean;
  update: PerTransfertUpdate;
  onOpenAnnuitySettings: () => void;
}

export function PerTransfertNewPerPanel({
  state,
  isC3CapitalLocked,
  update,
  onOpenAnnuitySettings,
}: PerTransfertNewPerPanelProps) {
  return (
    <Panel
      title="Nouveau PER"
      subtitle="Hypothèse de transfert immédiat, projection jusqu’à la retraite et modalités de sortie."
      headerActions={
        <SimActionButton
          variant="edit"
          mode="text"
          label="Paramètres rente"
          onClick={onOpenAnnuitySettings}
        />
      }
    >
      <FieldGrid>
        <PerTransfertRateField
          label="Frais d'entrée nouveau PER"
          value={state.newPerEntryFeeRate}
          onChange={(value) => update('newPerEntryFeeRate', value)}
        />
        <PerTransfertMoneyField
          label="Versements annuels nouveau PER jusqu’à liquidation"
          value={state.newPerAnnualPayment}
          onChange={(value) => update('newPerAnnualPayment', value)}
        />
        <PerTransfertRateField
          label="Performance avant retraite"
          value={state.performanceUntilRetirementRate}
          onChange={(value) => update('performanceUntilRetirementRate', value)}
          suffix="% / an"
        />
        <PerTransfertRateField
          label="Part en sortie capital"
          value={isC3CapitalLocked ? 0 : state.capitalShareRate}
          onChange={(value) => update('capitalShareRate', value)}
          min={0}
          max={100}
          hint={
            isC3CapitalLocked
              ? 'Compartiment C3 : sortie capital neutralisée hors petite rente.'
              : undefined
          }
        />
        <PerTransfertRateField
          label="Performance phase liquidation"
          value={state.capitalExitRevaluationRate}
          onChange={(value) => update('capitalExitRevaluationRate', value)}
          suffix="% / an"
        />
      </FieldGrid>
    </Panel>
  );
}
