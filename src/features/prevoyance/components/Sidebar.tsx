import type { CSSProperties } from 'react';
import {
  buildArretEuroChart,
  buildInvaliditePctChart,
  computeCollectiveAssietteBase,
  computeDecesCapitalFromContract,
  computeTranchesFromPass,
  selectMaintienEmployeurPalier,
} from '@/domain/prevoyance/helpers';
import type {
  PrevoyanceContractDraft,
  PrevoyanceContractKind,
  PrevoyanceMaintienEmployeurSettings,
  PrevoyanceRegimeSettings,
} from '@/domain/prevoyance/types';
import { TARGET_DECES_MULTIPLE } from '../constants';
import { euro, pct } from '../formatters';

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
                <span
                  className="prevoyance-mini-chart__segment prevoyance-mini-chart__segment--ro"
                  style={
                    {
                      '--prevoyance-segment-height': segmentHeight(period.roEuro, chart.reference),
                    } as CSSProperties
                  }
                  title={`Régime obligatoire : ${euro(period.roEuro)}/j`}
                />
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
      <MiniChartLegend />
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
                <span
                  className="prevoyance-mini-chart__segment prevoyance-mini-chart__segment--ro"
                  style={{ '--prevoyance-segment-height': `${palier.roPct}%` } as CSSProperties}
                  title={`Régime obligatoire : ${pct(palier.roPct)}`}
                />
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
      <MiniChartLegend />
    </div>
  );
}

function MiniChartLegend() {
  return (
    <div className="prevoyance-mini-chart__legend">
      <span>
        <i className="prevoyance-mini-chart__dot prevoyance-mini-chart__dot--reference" />
        Revenu actuel
      </span>
      <span>
        <i className="prevoyance-mini-chart__dot prevoyance-mini-chart__dot--ro" />
        Régime obligatoire
      </span>
      <span>
        <i className="prevoyance-mini-chart__dot prevoyance-mini-chart__dot--contrat" />
        Contrats de prévoyance
      </span>
    </div>
  );
}

function Donut({ value, target, label }: { value: number; target: number; label: string }) {
  const ratio = target > 0 ? Math.min(1, value / target) : 0;
  const deg = Math.round(ratio * 360);
  return (
    <div className="prevoyance-donut-wrap">
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

export function Sidebar({
  kind,
  regime,
  maintien,
  contracts,
  annualBase,
  referenceAnnual,
  pass,
  salaireBrutAnnuel,
  ancienneteYears,
}: {
  kind: PrevoyanceContractKind;
  regime: PrevoyanceRegimeSettings | null;
  maintien: PrevoyanceMaintienEmployeurSettings | null;
  contracts: PrevoyanceContractDraft[];
  annualBase: number;
  referenceAnnual: number;
  pass: number;
  salaireBrutAnnuel: number;
  ancienneteYears: number;
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
    regime,
    contracts,
    kind,
    maintienPalier,
    referenceAnnual,
    salaireBrutAnnuel,
  });
  const invaliditeChart = buildInvaliditePctChart({
    regime,
    contracts,
    kind,
    referenceAnnual,
    salaireBrutAnnuel,
  });
  const assietteBase = collectiveContracts[0]
    ? computeCollectiveAssietteBase(collectiveContracts[0].assiette, tranches)
    : salaireBrutAnnuel;
  const decesTarget = annualBase * TARGET_DECES_MULTIPLE;
  const decesCovered = contracts.reduce(
    (sum, contract) =>
      sum +
      computeDecesCapitalFromContract(
        contract,
        contract.kind === 'collectif' ? assietteBase : annualBase,
      ),
    0,
  );
  const fraisEstimated = individualContracts.reduce(
    (sum, contract) => sum + contract.fraisPro.amount,
    0,
  );
  const fraisCovered = individualContracts.reduce(
    (sum, contract) => sum + (contract.fraisPro.enabled ? contract.fraisPro.amount : 0),
    0,
  );

  return (
    <div className="prevoyance-sidebar">
      <section className="premium-card prevoyance-side-card">
        <h2>Arrêt de travail</h2>
        <MiniArretEuroChart chart={arretChart} />
      </section>

      <section className="premium-card prevoyance-side-card">
        <h2>Invalidité</h2>
        <MiniInvaliditePctChart chart={invaliditeChart} />
      </section>

      <section className="premium-card prevoyance-side-card">
        <h2>Décès</h2>
        <Donut value={decesCovered} target={decesTarget} label={`cible ${euro(decesTarget)}`} />
        {contracts.map((contract) => (
          <div key={contract.id} className="prevoyance-rente-line">
            <span>{contract.name}</span>
            <strong>
              {contract.kind === 'collectif'
                ? `${pct(contract.deces.renteConjointPct)} conjoint · ${pct(
                    contract.deces.renteEducationPct,
                  )} éducation`
                : `${euro(contract.deces.renteConjoint)} conjoint · ${euro(
                    contract.deces.renteEducation,
                  )} éducation`}
            </strong>
          </div>
        ))}
      </section>

      {kind === 'individuel' ? (
        <section className="premium-card prevoyance-side-card">
          <h2>Frais professionnels</h2>
          <Donut value={fraisCovered} target={fraisEstimated} label="couverts" />
        </section>
      ) : null}
    </div>
  );
}
