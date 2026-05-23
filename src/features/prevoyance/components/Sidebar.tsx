import type { CSSProperties } from 'react';
import {
  buildArretCoverageBars,
  buildInvaliditeCoverageBars,
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

function MiniCoverageChart({
  bars,
  showMaintien,
}: {
  bars: ReturnType<typeof buildArretCoverageBars>;
  showMaintien: boolean;
}) {
  return (
    <div className="prevoyance-mini-chart">
      <div className="prevoyance-mini-chart__bars">
        {bars.map((bar) => (
          <div key={bar.key} className="prevoyance-mini-chart__item">
            <div className="prevoyance-mini-chart__track" aria-label={bar.label}>
              <div className="prevoyance-mini-chart__stack">
                {bar.segments.map((segment) => (
                  <span
                    key={`${bar.key}-${segment.kind}`}
                    className={`prevoyance-mini-chart__segment prevoyance-mini-chart__segment--${segment.kind}`}
                    style={
                      {
                        '--prevoyance-segment-height': `${Math.min(100, segment.valuePct)}%`,
                      } as CSSProperties
                    }
                    title={`${segment.label} : ${pct(segment.valuePct)}`}
                  />
                ))}
              </div>
              <strong>{pct(bar.totalPct)}</strong>
            </div>
            <span className="prevoyance-mini-chart__label">{bar.label}</span>
          </div>
        ))}
      </div>
      <div className="prevoyance-mini-chart__legend">
        <span>
          <i className="prevoyance-mini-chart__dot prevoyance-mini-chart__dot--ro" />
          Régime obligatoire
        </span>
        {showMaintien ? (
          <span>
            <i className="prevoyance-mini-chart__dot prevoyance-mini-chart__dot--maintien" />
            Maintien employeur
          </span>
        ) : null}
        <span>
          <i className="prevoyance-mini-chart__dot prevoyance-mini-chart__dot--contrat" />
          Contrats de prévoyance
        </span>
      </div>
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
  const arretBars = buildArretCoverageBars({
    regime,
    contracts,
    kind,
    maintienPalier,
    referenceAnnual,
    salaireBrutAnnuel,
  });
  const invaliditeBars = buildInvaliditeCoverageBars({
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
        <MiniCoverageChart bars={arretBars} showMaintien={kind === 'collectif'} />
      </section>

      <section className="premium-card prevoyance-side-card">
        <h2>Invalidité</h2>
        <MiniCoverageChart bars={invaliditeBars} showMaintien={false} />
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
