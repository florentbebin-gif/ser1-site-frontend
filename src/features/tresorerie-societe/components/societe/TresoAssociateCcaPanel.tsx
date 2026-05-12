import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import type { CcaScheduleInput } from '@/engine/tresorerie/types';
import {
  fmtEuroInput,
  fmtRateInput,
  parseEuroInput,
  parseRateInput,
} from '../../utils/tresorerieFormatters';

interface TresoAssociateCcaPanelProps {
  cca: CcaScheduleInput;
  onChange: (patch: Partial<CcaScheduleInput>) => void;
}

export function TresoAssociateCcaPanel({
  cca,
  onChange,
}: TresoAssociateCcaPanelProps) {
  return (
    <div className="ts-associate-card">
      <div className="ts-associate-card__header">
        <strong>Compte courant d’associé</strong>
        <span>Taux maximum déductible</span>
      </div>
      <p className="ts-note--info">
        Les intérêts CCA sont saisis au taux convenu ; la déductibilité est plafonnée par le taux maximum déductible issu des paramètres fiscaux.
      </p>
      <p className="ts-note--info">
        Les apports et leur programmation se définissent dans le parcours de revenus, par palier.
      </p>
      <div className="ts-modal-grid ts-modal-grid--three">
        <SimFieldShell label="CCA actuel" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmtEuroInput(cca.currentBalance)}
            onChange={event => onChange({ currentBalance: parseEuroInput(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>
        <SimFieldShell label="Taux de rémunération CCA" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="decimal"
            className="sim-field__control"
            value={fmtRateInput(cca.remunerationRate)}
            onChange={event => onChange({ remunerationRate: parseRateInput(event.target.value) })}
          />
          <span className="sim-field__unit ts-unit">%</span>
        </SimFieldShell>
      </div>
    </div>
  );
}
