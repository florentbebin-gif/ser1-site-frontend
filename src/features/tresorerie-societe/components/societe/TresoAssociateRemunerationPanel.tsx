import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type {
  AssociateInput,
  AssociateProfileInput,
  AssociateRemunerationInput,
  SubsidiaryInput,
} from '@/engine/tresorerie/types';
import {
  fmtEuroInput,
  fmtRateInput,
  parseEuroInput,
  parseNumberInput,
  parseRateInput,
} from '../../utils/tresorerieFormatters';

interface TresoAssociateRemunerationPanelProps {
  associate: AssociateInput;
  profile: AssociateProfileInput;
  remuneration: AssociateRemunerationInput;
  subsidiaries: SubsidiaryInput[];
  onChange: (patch: Partial<AssociateInput>) => void;
}

type RemunerationMode = 'holding' | 'subsidiary' | 'none';

function getRemunerationMode(
  remuneration: AssociateRemunerationInput,
  projectionStartYear: number,
): RemunerationMode {
  if (
    remuneration.loadedAnnualCost <= 0 &&
    remuneration.endYear != null &&
    remuneration.endYear < projectionStartYear
  ) {
    return 'none';
  }
  return remuneration.source;
}

function deriveRetirementAge(
  currentAge: number,
  projectionStartYear: number,
  endYear: number | undefined,
): number {
  if (endYear == null || endYear < projectionStartYear) return currentAge;
  return Math.max(currentAge, currentAge + endYear - projectionStartYear + 1);
}

function getSourceLabel(
  mode: RemunerationMode,
  remuneration: AssociateRemunerationInput,
  subsidiaries: SubsidiaryInput[],
): string {
  if (mode === 'none') return 'Pas de rémunération';
  if (mode === 'holding') return 'Rémunération holding';
  const subsidiary = subsidiaries.find(item => item.id === remuneration.subsidiaryId);
  return subsidiary ? `Rémunération ${subsidiary.label}` : 'Rémunération filiale';
}

export function TresoAssociateRemunerationPanel({
  associate,
  profile,
  remuneration,
  subsidiaries,
  onChange,
}: TresoAssociateRemunerationPanelProps) {
  const projectionStartYear = profile.projectionStartYear;
  const mode = getRemunerationMode(remuneration, projectionStartYear);
  const netRemuneration = Math.max(0, remuneration.loadedAnnualCost * (1 - remuneration.socialChargeRate));
  const needAfterStop = Math.max(0, remuneration.annualNeedAfterStop ?? profile.annualIncomeNeed ?? 0);
  const radioName = `ts-remuneration-source-${associate.id}`;
  const sourceLabel = getSourceLabel(mode, remuneration, subsidiaries);
  const stopLabel = mode === 'none'
    ? `Besoin dès ${projectionStartYear}`
    : remuneration.endYear
      ? `${remuneration.endYear} arrêt`
      : 'Fin à définir';

  const patchRemuneration = (patch: Partial<AssociateRemunerationInput>) => {
    const nextRemuneration = { ...remuneration, ...patch };
    const nextNeedAfterStop = Math.max(0, nextRemuneration.annualNeedAfterStop ?? 0);
    const nextProfile: AssociateProfileInput = {
      ...profile,
      annualIncomeNeed: nextNeedAfterStop,
      projectionStartYear,
      retirementAge: deriveRetirementAge(
        profile.currentAge,
        projectionStartYear,
        nextRemuneration.endYear,
      ),
    };
    onChange({
      remuneration: nextRemuneration,
      remunerationAnnualCost: nextRemuneration.loadedAnnualCost,
      remunerationEndYear: nextRemuneration.endYear,
      socialChargesManualRate: nextRemuneration.socialChargeRate,
      profile: nextProfile,
    });
  };

  const selectMode = (nextMode: RemunerationMode) => {
    if (nextMode === 'none') {
      patchRemuneration({
        source: 'holding',
        subsidiaryId: undefined,
        loadedAnnualCost: 0,
        endYear: projectionStartYear - 1,
      });
      return;
    }

    patchRemuneration({
      source: nextMode,
      subsidiaryId: nextMode === 'subsidiary'
        ? remuneration.subsidiaryId ?? subsidiaries[0]?.id
        : undefined,
      endYear: remuneration.endYear != null && remuneration.endYear < projectionStartYear
        ? undefined
        : remuneration.endYear,
    });
  };

  return (
    <div className="ts-associate-card ts-remuneration-panel">
      <div className="ts-associate-card__header">
        <strong>Rémunération</strong>
        <span>Parcours de revenu et besoin futur</span>
      </div>

      <div className="ts-remuneration-timeline" aria-label="Synthèse de rémunération">
        <span>Aujourd’hui</span>
        <i />
        <strong>{sourceLabel} {mode === 'none' ? '' : `${fmtEuroInput(netRemuneration)} €/an net estimé`}</strong>
        <i />
        <strong>{stopLabel}</strong>
        <i />
        <strong>Besoin {fmtEuroInput(needAfterStop)} €/an depuis CCA puis dividendes</strong>
      </div>

      <div className="ts-remuneration-steps">
        <section className="ts-remuneration-step">
          <div className="ts-remuneration-step__header">
            <span>1</span>
            <div>
              <strong>Vous payez-vous aujourd’hui ?</strong>
              <small>Choisissez l’entité qui supporte le coût de rémunération.</small>
            </div>
          </div>
          <div className="ts-remuneration-radios">
            <label>
              <input
                type="radio"
                name={radioName}
                checked={mode === 'holding'}
                onChange={() => selectMode('holding')}
              />
              Oui, depuis la holding
            </label>
            <label>
              <input
                type="radio"
                name={radioName}
                checked={mode === 'subsidiary'}
                onChange={() => selectMode('subsidiary')}
              />
              Oui, depuis une filiale
            </label>
            <label>
              <input
                type="radio"
                name={radioName}
                checked={mode === 'none'}
                onChange={() => selectMode('none')}
              />
              Non
            </label>
          </div>
          {mode === 'subsidiary' ? (
            <SimFieldShell label="Filiale source" className="ts-field" rowClassName="ts-field__row">
              <SimSelect
                value={remuneration.subsidiaryId ?? subsidiaries[0]?.id ?? ''}
                onChange={value => patchRemuneration({ subsidiaryId: value || undefined })}
                options={subsidiaries.map(subsidiary => ({
                  value: subsidiary.id,
                  label: subsidiary.label,
                }))}
                ariaLabel="Filiale source de rémunération"
              />
            </SimFieldShell>
          ) : null}
        </section>

        {mode !== 'none' ? (
          <section className="ts-remuneration-step">
            <div className="ts-remuneration-step__header">
              <span>2</span>
              <div>
                <strong>Combien et jusqu’à quand ?</strong>
                <small>Le coût chargé pilote la sortie de trésorerie de l’entité source.</small>
              </div>
            </div>
            <div className="ts-modal-grid ts-modal-grid--three">
              <SimFieldShell label="Rémunération chargée annuelle" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="numeric"
                  className="sim-field__control"
                  value={fmtEuroInput(remuneration.loadedAnnualCost)}
                  onChange={event => patchRemuneration({
                    loadedAnnualCost: parseEuroInput(event.target.value),
                  })}
                />
                <span className="sim-field__unit ts-unit">€</span>
              </SimFieldShell>

              <SimFieldShell label="Taux de charges" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="decimal"
                  className="sim-field__control"
                  value={fmtRateInput(remuneration.socialChargeRate)}
                  onChange={event => patchRemuneration({
                    socialChargeRate: parseRateInput(event.target.value),
                  })}
                />
                <span className="sim-field__unit ts-unit">%</span>
              </SimFieldShell>

              <SimFieldShell label="Je m’arrête en" className="ts-field" rowClassName="ts-field__row">
                <input
                  type="text"
                  inputMode="numeric"
                  className="sim-field__control"
                  value={remuneration.endYear ?? ''}
                  onChange={event => {
                    const endYear = parseNumberInput(event.target.value);
                    patchRemuneration({ endYear: endYear || undefined });
                  }}
                />
              </SimFieldShell>
            </div>
            <div className="ts-remuneration-net">
              <span>Net annuel estimé</span>
              <strong>{fmtEuroInput(netRemuneration)} €</strong>
            </div>
          </section>
        ) : null}

        <section className="ts-remuneration-step">
          <div className="ts-remuneration-step__header">
            <span>{mode === 'none' ? '2' : '3'}</span>
            <div>
              <strong>Et après ?</strong>
              <small>
                Ce besoin pilote les remboursements de CCA puis les dividendes dans la projection.
              </small>
            </div>
          </div>
          <SimFieldShell
            label={mode === 'none'
              ? 'Besoin annuel net dès la projection'
              : 'Besoin annuel net après arrêt'}
            className="ts-field"
            rowClassName="ts-field__row"
          >
            <input
              type="text"
              inputMode="numeric"
              className="sim-field__control"
              value={fmtEuroInput(needAfterStop)}
              onChange={event => patchRemuneration({
                annualNeedAfterStop: parseEuroInput(event.target.value),
              })}
            />
            <span className="sim-field__unit ts-unit">€</span>
          </SimFieldShell>
        </section>
      </div>
    </div>
  );
}
