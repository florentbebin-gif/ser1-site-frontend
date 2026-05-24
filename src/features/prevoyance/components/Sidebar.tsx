import type { CSSProperties, ReactNode } from 'react';
import {
  buildArretEuroChart,
  buildInvaliditePctChart,
  computeCollectiveAssietteBase,
  computeDecesCapitalFromContract,
  computeRegimeDecesCapital,
  computeTranchesFromPass,
  selectMaintienEmployeurPalier,
} from '@/domain/prevoyance/helpers';
import type {
  PrevoyanceContractAggregationMode,
  PrevoyanceContractDraft,
  PrevoyanceContractKind,
  PrevoyanceDeathTargetDraft,
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '@/domain/prevoyance/types';
import { euro, pct } from '../formatters';
import { NumberInput, SectionIcon, type SectionIconName } from './FormPrimitives';

function segmentHeight(value: number, reference: number): string {
  if (reference <= 0) return '0%';
  return `${Math.min(100, Math.max(0, (value / reference) * 100))}%`;
}

function MiniArretEuroChart({ chart }: { chart: ReturnType<typeof buildArretEuroChart> }) {
  return (
    <div className="prevoyance-mini-chart">
      <div className="prevoyance-mini-chart__bars">
        <div className="prevoyance-mini-chart__item">
          <strong className="prevoyance-mini-chart__value">{euro(chart.reference)}/j</strong>
          <div className="prevoyance-mini-chart__track" aria-label="Revenu actuel">
            <div className="prevoyance-mini-chart__stack">
              <span
                className="prevoyance-mini-chart__segment prevoyance-mini-chart__segment--reference"
                style={{ '--prevoyance-segment-height': '100%' } as CSSProperties}
              />
            </div>
          </div>
          <span className="prevoyance-mini-chart__label">Revenu actuel</span>
        </div>
        {chart.periods.map((period) => (
          <div key={`${period.from}-${period.to}`} className="prevoyance-mini-chart__item">
            <strong className="prevoyance-mini-chart__value">{euro(period.totalEuro)}/j</strong>
            <div
              className="prevoyance-mini-chart__track"
              aria-label={`De ${period.from} à ${period.to} jours`}
            >
              <div className="prevoyance-mini-chart__stack">
                {period.roSegments.length > 1 ? (
                  period.roSegments.map((segment, index) => (
                    <span
                      key={segment.code}
                      className="prevoyance-mini-chart__segment prevoyance-mini-chart__segment--ro"
                      style={
                        {
                          '--prevoyance-segment-height': segmentHeight(
                            segment.euro,
                            chart.reference,
                          ),
                          '--prevoyance-segment-fill':
                            index % 2 === 0 ? 'var(--color-c3)' : 'var(--color-c6)',
                        } as CSSProperties
                      }
                      title={`${segment.label} : ${euro(segment.euro)}/j`}
                    />
                  ))
                ) : (
                  <span
                    className="prevoyance-mini-chart__segment prevoyance-mini-chart__segment--ro"
                    style={
                      {
                        '--prevoyance-segment-height': segmentHeight(
                          period.roEuro,
                          chart.reference,
                        ),
                      } as CSSProperties
                    }
                    title={`Régime obligatoire : ${euro(period.roEuro)}/j`}
                  />
                )}
                <span
                  className="prevoyance-mini-chart__segment prevoyance-mini-chart__segment--contrat"
                  style={
                    {
                      '--prevoyance-segment-height': segmentHeight(
                        period.contratEuro,
                        chart.reference,
                      ),
                    } as CSSProperties
                  }
                  title={`Contrats de prévoyance : ${euro(period.contratEuro)}/j`}
                />
              </div>
            </div>
            <span className="prevoyance-mini-chart__label">
              De {period.from} à {period.to} j
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniInvaliditePctChart({ chart }: { chart: ReturnType<typeof buildInvaliditePctChart> }) {
  return (
    <div className="prevoyance-mini-chart">
      <div className="prevoyance-mini-chart__bars">
        <div className="prevoyance-mini-chart__item">
          <strong className="prevoyance-mini-chart__value">100 %</strong>
          <div className="prevoyance-mini-chart__track" aria-label="Revenu actuel">
            <div className="prevoyance-mini-chart__stack">
              <span
                className="prevoyance-mini-chart__segment prevoyance-mini-chart__segment--reference"
                style={{ '--prevoyance-segment-height': '100%' } as CSSProperties}
              />
            </div>
          </div>
          <span className="prevoyance-mini-chart__label">Revenu actuel</span>
        </div>
        {chart.paliers.map((palier) => (
          <div key={palier.rate} className="prevoyance-mini-chart__item">
            <strong className="prevoyance-mini-chart__value">{pct(palier.totalPct)}</strong>
            <div className="prevoyance-mini-chart__track" aria-label={`${palier.rate} %`}>
              <div className="prevoyance-mini-chart__stack">
                {palier.roSegments.length > 1 ? (
                  palier.roSegments.map((segment, index) => (
                    <span
                      key={segment.code}
                      className="prevoyance-mini-chart__segment prevoyance-mini-chart__segment--ro"
                      style={
                        {
                          '--prevoyance-segment-height': `${segment.pct}%`,
                          '--prevoyance-segment-fill':
                            index % 2 === 0 ? 'var(--color-c3)' : 'var(--color-c6)',
                        } as CSSProperties
                      }
                      title={`${segment.label} : ${pct(segment.pct)}`}
                    />
                  ))
                ) : (
                  <span
                    className="prevoyance-mini-chart__segment prevoyance-mini-chart__segment--ro"
                    style={{ '--prevoyance-segment-height': `${palier.roPct}%` } as CSSProperties}
                    title={`Régime obligatoire : ${pct(palier.roPct)}`}
                  />
                )}
                <span
                  className="prevoyance-mini-chart__segment prevoyance-mini-chart__segment--contrat"
                  style={
                    { '--prevoyance-segment-height': `${palier.contratPct}%` } as CSSProperties
                  }
                  title={`Contrats de prévoyance : ${pct(palier.contratPct)}`}
                />
              </div>
            </div>
            <span className="prevoyance-mini-chart__label">{palier.rate} %</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniChartLegend() {
  return (
    <div className="prevoyance-mini-chart__legend">
      <span>
        <i className="prevoyance-mini-chart__dot prevoyance-mini-chart__dot--reference" />
        Revenu
      </span>
      <span>
        <i className="prevoyance-mini-chart__dot prevoyance-mini-chart__dot--ro" />
        RO
      </span>
      <span>
        <i className="prevoyance-mini-chart__dot prevoyance-mini-chart__dot--contrat" />
        Contrats
      </span>
    </div>
  );
}

function SideCard({
  title,
  icon,
  children,
  actions,
  compact = false,
}: {
  title: string;
  icon: SectionIconName;
  children: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section
      className={
        compact
          ? 'premium-card premium-card--guide sim-card--guide prevoyance-side-card prevoyance-side-card--compact'
          : 'premium-card premium-card--guide sim-card--guide prevoyance-side-card'
      }
    >
      <div className="sim-card__header sim-card__header--bleed prevoyance-side-card__header">
        <div className="prevoyance-side-card__title-row">
          <h2 className="sim-card__title sim-card__title-row">
            <span className="sim-card__icon sim-card__icon--sm">
              <SectionIcon name={icon} size={13} />
            </span>
            <span>{title}</span>
          </h2>
          {actions ? <div className="prevoyance-side-card__actions">{actions}</div> : null}
        </div>
      </div>
      <div className="sim-divider sim-divider--tight" />
      {children}
    </section>
  );
}

function Donut({
  value,
  target,
  label,
  compact = false,
}: {
  value: number;
  target: number;
  label: string;
  compact?: boolean;
}) {
  const ratio = target > 0 ? Math.min(1, value / target) : 0;
  const deg = Math.round(ratio * 360);
  return (
    <div
      className={
        compact ? 'prevoyance-donut-wrap prevoyance-donut-wrap--compact' : 'prevoyance-donut-wrap'
      }
    >
      <div
        className="prevoyance-donut"
        style={{ '--prevoyance-donut-deg': `${deg}deg` } as CSSProperties}
        aria-label={label}
      >
        <span>{pct(ratio * 100)}</span>
      </div>
      <div>
        <strong>{euro(value)}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function MiniDonut({ value, target, label }: { value: number; target: number; label: string }) {
  const ratio = target > 0 ? Math.min(1, value / target) : 0;
  const deg = Math.round(ratio * 360);
  return (
    <div
      className="prevoyance-mini-donut"
      style={{ '--prevoyance-donut-deg': `${deg}deg` } as CSSProperties}
      aria-label={label}
    >
      <span>{pct(ratio * 100)}</span>
    </div>
  );
}

function DeathTargetControl({
  deathTarget,
  onDeathTargetChange,
}: {
  deathTarget: PrevoyanceDeathTargetDraft;
  onDeathTargetChange: (deathTarget: PrevoyanceDeathTargetDraft) => void;
}) {
  return (
    <div className="prevoyance-death-target">
      <div className="prevoyance-death-target__top">
        <div className="prevoyance-death-target__presets">
          {[1, 3, 5].map((multiple) => (
            <button
              key={multiple}
              type="button"
              className={
                deathTarget.mode === 'multiple' && deathTarget.multiple === multiple
                  ? 'prevoyance-death-target__preset is-active'
                  : 'prevoyance-death-target__preset'
              }
              onClick={() =>
                onDeathTargetChange({
                  ...deathTarget,
                  mode: 'multiple',
                  multiple: multiple as 1 | 3 | 5,
                })
              }
            >
              x{multiple}
            </button>
          ))}
        </div>
        <div className="prevoyance-death-target__manual">
          <span title="Besoin à couvrir">Besoin</span>
          <span className="prevoyance-death-target__manual-input">
            <NumberInput
              value={deathTarget.manualAmount}
              onChange={(manualAmount) =>
                onDeathTargetChange({ ...deathTarget, mode: 'manual', manualAmount })
              }
              suffix="€"
              ariaLabel="Besoin à couvrir"
            />
          </span>
        </div>
      </div>
    </div>
  );
}

function computeCotisationAnnual(
  contract: PrevoyanceContractDraft,
  salaireBrutAnnuel: number,
): number {
  if (contract.kind === 'individuel') return contract.cotisation.montantAnnuel;
  return Math.round(salaireBrutAnnuel * (contract.cotisation.tauxPctSalaire / 100));
}

export function Sidebar({
  kind,
  regimeStack,
  maintien,
  contracts,
  contractAggregationMode,
  deathTarget,
  onDeathTargetChange,
  annualBase,
  referenceAnnual,
  pass,
  salaireBrutAnnuel,
  ancienneteYears,
  hasConjoint,
  hasChildren,
  fraisGenerauxAssiette,
}: {
  kind: PrevoyanceContractKind;
  regimeStack: PrevoyanceRegimeSettings[];
  maintien: PrevoyanceMaintienEmployeurSettings | null;
  contracts: PrevoyanceContractDraft[];
  contractAggregationMode: PrevoyanceContractAggregationMode;
  deathTarget: PrevoyanceDeathTargetDraft;
  onDeathTargetChange: (deathTarget: PrevoyanceDeathTargetDraft) => void;
  annualBase: number;
  referenceAnnual: number;
  pass: number;
  salaireBrutAnnuel: number;
  ancienneteYears: number;
  hasConjoint: boolean;
  hasChildren: boolean;
  fraisGenerauxAssiette: number;
}) {
  const tranches = computeTranchesFromPass(salaireBrutAnnuel, pass);
  const maintienPalier = selectMaintienEmployeurPalier(ancienneteYears, maintien);
  const collectiveContracts = contracts.filter(
    (contract): contract is Extract<PrevoyanceContractDraft, { kind: 'collectif' }> =>
      contract.kind === 'collectif',
  );
  const individualContracts = contracts.filter(
    (contract): contract is Extract<PrevoyanceContractDraft, { kind: 'individuel' }> =>
      contract.kind === 'individuel',
  );
  const arretChart = buildArretEuroChart({
    regimeStack,
    contracts,
    kind,
    contractAggregationMode,
    maintienPalier,
    referenceAnnual,
    salaireBrutAnnuel,
  });
  const invaliditeChart = buildInvaliditePctChart({
    regimeStack,
    contracts,
    kind,
    contractAggregationMode,
    referenceAnnual,
    salaireBrutAnnuel,
  });
  const assietteBase = collectiveContracts[0]
    ? computeCollectiveAssietteBase(collectiveContracts[0].assiette, tranches)
    : salaireBrutAnnuel;
  const decesTarget =
    deathTarget.mode === 'manual' && deathTarget.manualAmount > 0
      ? deathTarget.manualAmount
      : referenceAnnual * deathTarget.multiple;
  const privateDecesCovered = contracts.reduce(
    (sum, contract) =>
      sum +
      computeDecesCapitalFromContract(
        contract,
        contract.kind === 'collectif' ? assietteBase : annualBase,
      ),
    0,
  );
  const regimeDecesCovered = computeRegimeDecesCapital(
    regimeStack,
    referenceAnnual,
    salaireBrutAnnuel,
  );
  const decesCovered = regimeDecesCovered + privateDecesCovered;
  const fraisCovered = individualContracts.reduce(
    (sum, contract) => sum + (contract.fraisPro.enabled ? contract.fraisPro.amount : 0),
    0,
  );
  const cotisationAnnual = contracts.reduce(
    (sum, contract) => sum + computeCotisationAnnual(contract, salaireBrutAnnuel),
    0,
  );
  const cotisationTitle =
    contractAggregationMode === 'compare' ? 'Contrat affiché' : 'Cumul contrats';

  return (
    <div className="prevoyance-sidebar">
      <SideCard title="Arrêt de travail" icon="arret" actions={<MiniChartLegend />}>
        <MiniArretEuroChart chart={arretChart} />
        {kind === 'individuel' ? (
          <div className="prevoyance-frais-inline-kpi">
            <MiniDonut value={fraisCovered} target={fraisGenerauxAssiette} label="frais généraux" />
            <div>
              <span>Frais généraux couverts</span>
              <strong>{euro(fraisCovered)} couverts</strong>
              <small>
                {fraisGenerauxAssiette > 0
                  ? `Assiette ${euro(fraisGenerauxAssiette)}`
                  : 'Assiette à estimer'}
              </small>
            </div>
          </div>
        ) : null}
      </SideCard>

      <SideCard title="Invalidité" icon="invalidite" actions={<MiniChartLegend />}>
        <MiniInvaliditePctChart chart={invaliditeChart} />
      </SideCard>

      <SideCard
        title="Décès"
        icon="deces"
        actions={
          <DeathTargetControl deathTarget={deathTarget} onDeathTargetChange={onDeathTargetChange} />
        }
      >
        <Donut value={decesCovered} target={decesTarget} label={`objectif ${euro(decesTarget)}`} />
        {regimeDecesCovered > 0 ? (
          <div className="prevoyance-rente-line">
            <span>Régime obligatoire</span>
            <strong>{euro(regimeDecesCovered)}</strong>
          </div>
        ) : null}
        {contracts.map((contract) => (
          <div key={contract.id} className="prevoyance-rente-line">
            <span>{contract.name}</span>
            <strong>
              {contract.kind === 'collectif'
                ? [
                    hasConjoint ? `${pct(contract.deces.renteConjointPct)} conjoint` : null,
                    hasChildren ? `${pct(contract.deces.renteEducationPct)} éducation` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || euro(computeDecesCapitalFromContract(contract, assietteBase))
                : [
                    hasConjoint ? `${euro(contract.deces.renteConjoint)} conjoint` : null,
                    hasChildren ? `${euro(contract.deces.renteEducation)} éducation` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || euro(computeDecesCapitalFromContract(contract, annualBase))}
            </strong>
          </div>
        ))}
      </SideCard>

      <SideCard title="Cotisation" icon="contracts" compact>
        <div className="prevoyance-cotisation-kpi">
          <span>{cotisationTitle}</span>
          <strong>{euro(cotisationAnnual)}/an</strong>
        </div>
      </SideCard>
    </div>
  );
}
