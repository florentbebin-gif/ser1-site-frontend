import { SimFieldShell } from '@/components/ui/sim/SimFieldShell';
import { SimSelect } from '@/components/ui/sim/SimSelect';
import type { AssociateRevenuePhaseInputV6, DividendsStrategy } from '@/engine/tresorerie/types';
import {
  fmtEuroInput,
  fmtRateInput,
  parseEuroInput,
  parseNumberInput,
  parseRateInput,
} from '../../utils/tresorerieFormatters';
import { fmtEuro, normalizeSourcePatch } from './revenuePhaseModalUtils';

type PhasePatch = (patch: Partial<AssociateRevenuePhaseInputV6>) => void;
type RemunerationPatch = (patch: Partial<AssociateRevenuePhaseInputV6['remuneration']>) => void;
type DistributionPatch = (patch: Partial<AssociateRevenuePhaseInputV6['distribution']>) => void;
type CcaContributionPatch = (
  patch: Partial<AssociateRevenuePhaseInputV6['ccaContribution']>,
) => void;

interface SelectOption {
  value: string;
  label: string;
}

export function TresoRevenuePhasePeriodPanel({
  draft,
  onPatch,
}: {
  draft: AssociateRevenuePhaseInputV6;
  onPatch: PhasePatch;
}) {
  return (
    <section className="ts-associate-card">
      <div className="ts-associate-card__header">
        <strong>Période</strong>
        <span>Bornes inclusives</span>
      </div>
      <div className="ts-modal-grid ts-modal-grid--three">
        <SimFieldShell
          label="Année de début"
          className="ts-field"
          rowClassName="ts-field__row"
          controlId="ts-phase-start-year"
        >
          <input
            id="ts-phase-start-year"
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={draft.startYear}
            onChange={(event) => onPatch({ startYear: parseNumberInput(event.target.value) })}
          />
        </SimFieldShell>

        <SimFieldShell
          label="Année de fin"
          className="ts-field"
          rowClassName="ts-field__row"
          controlId="ts-phase-end-year"
        >
          <input
            id="ts-phase-end-year"
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={draft.endYear}
            onChange={(event) => onPatch({ endYear: parseNumberInput(event.target.value) })}
          />
        </SimFieldShell>
      </div>
    </section>
  );
}

export function TresoRevenuePhaseRemunerationPanel({
  draft,
  netRevenue,
  subsidiaryOptions,
  remunerationSourceOptions,
  onPatch,
}: {
  draft: AssociateRevenuePhaseInputV6;
  netRevenue: number;
  subsidiaryOptions: SelectOption[];
  remunerationSourceOptions: Array<
    [AssociateRevenuePhaseInputV6['remuneration']['source'], string]
  >;
  onPatch: RemunerationPatch;
}) {
  return (
    <section className="ts-associate-card">
      <div className="ts-associate-card__header">
        <strong>Phase rémunération</strong>
        <span>Revenu payé</span>
      </div>
      <div className="ts-phase-source" role="radiogroup" aria-label="Source de rémunération">
        {remunerationSourceOptions.map(([value, label]) => (
          <label key={value} className="ts-phase-source__choice">
            <input
              type="radio"
              name="ts-phase-source"
              checked={draft.remuneration.source === value}
              onChange={() => onPatch(normalizeSourcePatch(value))}
            />
            {label}
          </label>
        ))}
      </div>

      {draft.remuneration.source === 'subsidiary' ? (
        <div className="ts-modal-grid ts-modal-grid--three">
          <SimFieldShell label="Filiale source" className="ts-field" rowClassName="ts-field__row">
            <SimSelect
              value={draft.remuneration.subsidiaryId ?? subsidiaryOptions[0]?.value ?? ''}
              onChange={(value) => onPatch({ subsidiaryId: value })}
              options={subsidiaryOptions}
              ariaLabel="Filiale source de rémunération"
              disabled={subsidiaryOptions.length === 0}
            />
          </SimFieldShell>
        </div>
      ) : null}

      {draft.remuneration.source !== 'none' ? (
        <div className="ts-modal-grid ts-modal-grid--three">
          <SimFieldShell
            label="Rémunération chargée annuelle"
            className="ts-field"
            rowClassName="ts-field__row"
          >
            <input
              type="text"
              inputMode="numeric"
              className="sim-field__control"
              value={fmtEuroInput(draft.remuneration.loadedAnnualCost)}
              onChange={(event) =>
                onPatch({ loadedAnnualCost: parseEuroInput(event.target.value) })
              }
            />
            <span className="sim-field__unit ts-unit">€</span>
          </SimFieldShell>

          <SimFieldShell label="Taux de charges" className="ts-field" rowClassName="ts-field__row">
            <input
              type="text"
              inputMode="decimal"
              className="sim-field__control"
              value={fmtRateInput(draft.remuneration.socialChargeRate)}
              onChange={(event) =>
                onPatch({ socialChargeRate: parseRateInput(event.target.value) })
              }
            />
            <span className="sim-field__unit ts-unit">%</span>
          </SimFieldShell>

          <div className="ts-phase-net">
            <span>Net annuel estimé avant IR</span>
            <strong>{fmtEuro(netRevenue)}</strong>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function TresoRevenuePhaseDistributionPanel({
  draft,
  onPatch,
}: {
  draft: AssociateRevenuePhaseInputV6;
  onPatch: DistributionPatch;
}) {
  return (
    <section className="ts-associate-card">
      <div className="ts-associate-card__header">
        <strong>Phase distribution</strong>
        <span>Objectif ou trésorerie disponible</span>
      </div>
      <p className="ts-phase-source-title">Dividendes souhaités</p>
      <div className="ts-phase-source" role="radiogroup" aria-label="Dividendes souhaités">
        {(
          [
            ['max_treso', 'Maximum selon trésorerie'],
            ['montant_cible', 'Montant net cible'],
          ] as Array<[DividendsStrategy, string]>
        ).map(([value, label]) => (
          <label key={value} className="ts-phase-source__choice">
            <input
              type="radio"
              name="ts-dividends-strategy"
              checked={draft.distribution.dividendsStrategy === value}
              onChange={() =>
                onPatch({
                  enabled: true,
                  dividendsStrategy: value,
                })
              }
            />
            {label}
          </label>
        ))}
      </div>
      {draft.distribution.dividendsStrategy === 'montant_cible' ? (
        <div className="ts-modal-grid ts-modal-grid--three">
          <SimFieldShell
            label="Objectif net annuel de l’associé (net de PFU)"
            className="ts-field"
            rowClassName="ts-field__row"
          >
            <input
              type="text"
              inputMode="numeric"
              className="sim-field__control"
              value={fmtEuroInput(draft.distribution.dividendsTargetAmountNet ?? 0)}
              onChange={(event) =>
                onPatch({
                  dividendsTargetAmountNet: parseEuroInput(event.target.value),
                })
              }
            />
            <span className="sim-field__unit ts-unit">€</span>
          </SimFieldShell>
        </div>
      ) : null}
      <p className="ts-note--info">
        En maximum selon trésorerie, le calculateur rembourse d’abord le CCA disponible puis
        distribue les dividendes possibles.
      </p>
    </section>
  );
}

export function TresoRevenuePhaseCcaContributionPanel({
  draft,
  onPatch,
}: {
  draft: AssociateRevenuePhaseInputV6;
  onPatch: CcaContributionPatch;
}) {
  return (
    <section className="ts-associate-card">
      <div className="ts-associate-card__header">
        <strong>Phase constitution de CCA</strong>
        <span>Apports ponctuels ou récurrents</span>
      </div>
      <div className="ts-modal-grid ts-modal-grid--three">
        <SimFieldShell label="Apport annuel" className="ts-field" rowClassName="ts-field__row">
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmtEuroInput(draft.ccaContribution.annual?.amount ?? 0)}
            onChange={(event) =>
              onPatch({
                enabled: true,
                annual: {
                  amount: parseEuroInput(event.target.value),
                  startYear: draft.startYear,
                  endYear: draft.endYear,
                },
              })
            }
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>
      </div>
      <div className="ts-modal-grid ts-modal-grid--three">
        <SimFieldShell
          label="Apport exceptionnel"
          className="ts-field"
          rowClassName="ts-field__row"
        >
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={fmtEuroInput(draft.ccaContribution.exceptional?.amount ?? 0)}
            onChange={(event) =>
              onPatch({
                enabled: true,
                exceptional: {
                  year: draft.ccaContribution.exceptional?.year ?? draft.startYear,
                  amount: parseEuroInput(event.target.value),
                },
              })
            }
          />
          <span className="sim-field__unit ts-unit">€</span>
        </SimFieldShell>
        <SimFieldShell
          label="Année exceptionnelle"
          className="ts-field"
          rowClassName="ts-field__row"
        >
          <input
            type="text"
            inputMode="numeric"
            className="sim-field__control"
            value={draft.ccaContribution.exceptional?.year ?? draft.startYear}
            onChange={(event) =>
              onPatch({
                enabled: true,
                exceptional: {
                  amount: draft.ccaContribution.exceptional?.amount ?? 0,
                  year: parseNumberInput(event.target.value),
                },
              })
            }
          />
        </SimFieldShell>
      </div>
    </section>
  );
}
