import { SimSegmentedControl, SimSelect, type SimSelectOption } from '@/components/ui/sim';
import { estimateSalaireNetFromBrut } from '@/domain/prevoyance/helpers';
import type {
  PrevoyanceContractKind,
  PrevoyanceRegimeSettings,
  PrevoyanceSituationDraft,
} from '@/domain/prevoyance/types';
import { FAMILY_OPTIONS } from '../constants';
import { NumberInput, SectionCard, SimFieldShell } from './FormPrimitives';

export function SituationBlock({
  situation,
  regimes,
  kind,
  onChange,
}: {
  situation: PrevoyanceSituationDraft;
  regimes: PrevoyanceRegimeSettings[];
  kind: PrevoyanceContractKind;
  onChange: (patch: Partial<PrevoyanceSituationDraft>) => void;
}) {
  const regimeOptions: SimSelectOption[] = regimes.map((regime) => ({
    value: regime.code,
    label: regime.label,
    description: regime.label
      .toLocaleLowerCase('fr-FR')
      .includes(regime.caisse.toLocaleLowerCase('fr-FR'))
      ? undefined
      : regime.caisse,
  }));

  return (
    <SectionCard
      title="Situation"
      subtitle="Choix du régime obligatoire et des ayants droit"
      icon="situation"
    >
      <div className="prevoyance-form-grid prevoyance-form-grid--three">
        <SimFieldShell label="Date de naissance">
          <input
            type="date"
            aria-label="Date de naissance"
            value={situation.birthDate}
            onChange={(event) => onChange({ birthDate: event.target.value })}
            className="sim-field__control"
          />
        </SimFieldShell>
        <SimFieldShell label="Situation familiale">
          <SimSelect
            value={situation.familyStatus}
            onChange={(value) =>
              onChange({ familyStatus: value as PrevoyanceSituationDraft['familyStatus'] })
            }
            options={FAMILY_OPTIONS}
            align="left"
          />
        </SimFieldShell>
        <SimFieldShell label="Enfants">
          <NumberInput
            value={situation.childrenCount}
            onChange={(childrenCount) => onChange({ childrenCount })}
          />
        </SimFieldShell>
      </div>

      <div className="prevoyance-regime-picker">
        <SimFieldShell label="Régime obligatoire de prévoyance">
          <SimSelect
            value={situation.regimeCode}
            onChange={(regimeCode) => onChange({ regimeCode, kindOverride: null })}
            options={regimeOptions}
            placeholder="Sélectionner"
            align="left"
          />
        </SimFieldShell>
        <SimFieldShell label="Parcours">
          <SimSegmentedControl
            value={kind}
            onChange={(value) => onChange({ kindOverride: value })}
            ariaLabel="Type de contrat prévoyance"
            size="sm"
            options={[
              { value: 'collectif', label: 'Salarié' },
              { value: 'individuel', label: 'TNS / libéral' },
            ]}
          />
        </SimFieldShell>
      </div>

      {kind === 'collectif' ? (
        <div className="prevoyance-form-grid prevoyance-form-grid--three">
          <SimFieldShell label="Salaire brut annuel">
            <NumberInput
              value={situation.salaireBrutAnnuel}
              onChange={(salaireBrutAnnuel) =>
                onChange({
                  salaireBrutAnnuel,
                  salaireNetImposable: estimateSalaireNetFromBrut(salaireBrutAnnuel),
                })
              }
              suffix="€"
            />
          </SimFieldShell>
          <SimFieldShell label="Salaire net imposable">
            <NumberInput
              value={situation.salaireNetImposable}
              onChange={(salaireNetImposable) => onChange({ salaireNetImposable })}
              suffix="€"
            />
          </SimFieldShell>
          <SimFieldShell label="Ancienneté">
            <NumberInput
              value={situation.ancienneteYears}
              onChange={(ancienneteYears) => onChange({ ancienneteYears })}
              suffix="ans"
            />
          </SimFieldShell>
        </div>
      ) : (
        <div className="prevoyance-form-grid prevoyance-form-grid--one">
          <SimFieldShell label="Revenu imposable à couvrir">
            <NumberInput
              value={situation.revenuImposable}
              onChange={(revenuImposable) => onChange({ revenuImposable })}
              suffix="€"
            />
          </SimFieldShell>
        </div>
      )}
    </SectionCard>
  );
}
