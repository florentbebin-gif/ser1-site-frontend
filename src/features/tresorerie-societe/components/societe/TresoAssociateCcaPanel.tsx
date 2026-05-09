import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import type { CcaScheduleInput } from '@/engine/tresorerie/types';
import {
  fmtEuroInput,
  fmtRateInput,
  parseEuroInput,
  parseNumberInput,
  parseRateInput,
} from '../../utils/tresorerieFormatters';

interface TresoAssociateCcaPanelProps {
  cca: CcaScheduleInput;
  projectionStartYear: number;
  onChange: (patch: Partial<CcaScheduleInput>) => void;
}

export function TresoAssociateCcaPanel({
  cca,
  projectionStartYear,
  onChange,
}: TresoAssociateCcaPanelProps) {
  const firstExceptionalContribution = cca.exceptionalContributions[0] ?? {
    year: projectionStartYear,
    amount: 0,
  };

  return (
    <div className="ts-associate-card">
      <div className="ts-associate-card__header">
        <strong>Compte courant d’associé</strong>
        <span>Taux maximum déductible</span>
      </div>
      <p className="ts-note--info">
        Les intérêts CCA sont saisis au taux convenu ; la déductibilité est plafonnée par le taux maximum déductible issu des paramètres fiscaux.
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
        <SimFieldShell label="Apport exceptionnel" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmtEuroInput(firstExceptionalContribution.amount)}
            onChange={event => onChange({
              exceptionalContributions: [{
                ...firstExceptionalContribution,
                amount: parseEuroInput(event.target.value),
              }],
            })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>
        <SimFieldShell label="Année exceptionnelle" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={firstExceptionalContribution.year}
            onChange={event => onChange({
              exceptionalContributions: [{
                ...firstExceptionalContribution,
                year: parseNumberInput(event.target.value),
              }],
            })}
          />
        </SimFieldShell>
        <SimFieldShell label="Apport annuel" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmtEuroInput(cca.annualContribution.amount)}
            onChange={event => onChange({
              annualContribution: {
                ...cca.annualContribution,
                amount: parseEuroInput(event.target.value),
              },
            })}
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>
        <SimFieldShell label="Apport annuel de" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={cca.annualContribution.startYear}
            onChange={event => onChange({
              annualContribution: {
                ...cca.annualContribution,
                startYear: parseNumberInput(event.target.value),
              },
            })}
          />
        </SimFieldShell>
        <SimFieldShell label="Apport annuel à" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={cca.annualContribution.endYear ?? ''}
            onChange={event => {
              const endYear = parseNumberInput(event.target.value);
              onChange({
                annualContribution: {
                  ...cca.annualContribution,
                  endYear: endYear || undefined,
                },
              });
            }}
          />
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
