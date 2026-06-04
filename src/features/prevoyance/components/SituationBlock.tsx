import { SimSelect, SimTemporalField, type SimSelectOption } from '@/components/ui/sim';
import { estimateSalaireNetFromBrut } from '@/domain/prevoyance/helpers';
import type {
  PrevoyanceContractKind,
  PrevoyanceRegimeSettings,
  PrevoyanceSituationDraft,
} from '@/domain/prevoyance/types';
import { FAMILY_OPTIONS } from '../constants';
import { NumberInput, SectionCard, SimFieldShell } from './FormPrimitives';

function normalizeRegimeLabel(value: string): string {
  return value
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function shouldShowCaisseDescription(label: string, caisse: string): boolean {
  const normalizedLabel = normalizeRegimeLabel(label);
  const normalizedCaisse = normalizeRegimeLabel(caisse);
  const caisseTokens = normalizedCaisse.split(' ').filter((token) => token.length > 1);
  const mainCaisseToken = caisseTokens[0] ?? normalizedCaisse;

  return !normalizedLabel.includes(normalizedCaisse) && !normalizedLabel.includes(mainCaisseToken);
}

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
    description: shouldShowCaisseDescription(regime.label, regime.caisse)
      ? regime.caisse
      : undefined,
  }));
  const birthDateId = 'prevoyance-birth-date';

  return (
    <SectionCard
      title="Situation"
      subtitle="Choix du régime obligatoire et des ayants droit"
      icon="situation"
    >
      <div className="prevoyance-form-grid prevoyance-form-grid--three">
        <SimFieldShell label="Date de naissance" controlId={birthDateId}>
          <SimTemporalField
            id={birthDateId}
            aria-label="Date de naissance"
            value={situation.birthDate}
            onChange={(birthDate) => onChange({ birthDate })}
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
            ariaLabel="Enfants"
          />
        </SimFieldShell>
      </div>

      <div className="prevoyance-regime-picker">
        <SimFieldShell label="Régime obligatoire de prévoyance">
          <SimSelect
            value={situation.regimeCode}
            onChange={(regimeCode) => onChange({ regimeCode })}
            options={regimeOptions}
            placeholder="Sélectionner"
            align="left"
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
              ariaLabel="Salaire brut annuel"
            />
          </SimFieldShell>
          <SimFieldShell label="Salaire net imposable">
            <NumberInput
              value={situation.salaireNetImposable}
              onChange={(salaireNetImposable) => onChange({ salaireNetImposable })}
              suffix="€"
              ariaLabel="Salaire net imposable"
            />
          </SimFieldShell>
          <SimFieldShell label="Ancienneté">
            <NumberInput
              value={situation.ancienneteYears}
              onChange={(ancienneteYears) => onChange({ ancienneteYears })}
              suffix="ans"
              ariaLabel="Ancienneté"
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
              ariaLabel="Revenu imposable à couvrir"
            />
          </SimFieldShell>
        </div>
      )}
    </SectionCard>
  );
}
