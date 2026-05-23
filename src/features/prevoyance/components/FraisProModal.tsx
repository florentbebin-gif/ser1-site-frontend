import { SimModalShell } from '@/components/ui/sim';
import type { FraisProModalState, FraisProNumericKey } from '../defaults';
import { euro } from '../formatters';
import { NumberInput, SimFieldShell } from './FormPrimitives';

export function FraisProModal({
  state,
  onClose,
  onApply,
  onChange,
}: {
  state: FraisProModalState;
  onClose: () => void;
  onApply: (amount: number) => void;
  onChange: (patch: Partial<FraisProModalState>) => void;
}) {
  const total =
    state.chargesExternes +
    state.loyers +
    state.assurances +
    state.salaires +
    state.amortissements +
    state.fraisBancaires;

  const row = (label: string, key: FraisProNumericKey) => (
    <SimFieldShell label={label}>
      <NumberInput
        value={Number(state[key]) || 0}
        onChange={(value) => onChange({ [key]: value })}
        suffix="€"
      />
    </SimFieldShell>
  );

  return (
    <SimModalShell
      title="Frais professionnels"
      subtitle="Estimation à partir des charges du compte de résultat."
      onClose={onClose}
      modalClassName="prevoyance-frais-modal"
      footer={
        <>
          <span>Total recommandé : {euro(total)}</span>
          <button type="button" className="prevoyance-add-button" onClick={() => onApply(total)}>
            Retenir ce montant
          </button>
        </>
      }
    >
      <div className="prevoyance-frais-grid">
        {row('Achats et charges externes', 'chargesExternes')}
        {row('Loyers et crédit-bail', 'loyers')}
        {row('Assurances', 'assurances')}
        {row('Salaires et charges', 'salaires')}
        {row('Dotations aux amortissements', 'amortissements')}
        {row('Frais bancaires', 'fraisBancaires')}
      </div>
    </SimModalShell>
  );
}
