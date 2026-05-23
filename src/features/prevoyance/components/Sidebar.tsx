import type { CSSProperties } from 'react';
import {
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

function CoverageBar({
  label,
  roLabel,
  maintienLabel,
  contractLabel,
  collective,
}: {
  label: string;
  roLabel: string;
  maintienLabel?: string;
  contractLabel: string;
  collective: boolean;
}) {
  return (
    <div className="prevoyance-bar-row">
      <div className="prevoyance-bar-row__label">{label}</div>
      <div className="prevoyance-stacked-bar" aria-label={label}>
        <span className="prevoyance-stacked-bar__segment prevoyance-stacked-bar__segment--ro">
          {roLabel}
        </span>
        {collective ? (
          <span className="prevoyance-stacked-bar__segment prevoyance-stacked-bar__segment--maintien">
            {maintienLabel ?? 'Maintien'}
          </span>
        ) : null}
        <span className="prevoyance-stacked-bar__segment prevoyance-stacked-bar__segment--contrat">
          {contractLabel}
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
  pass,
  salaireBrutAnnuel,
  ancienneteYears,
}: {
  kind: PrevoyanceContractKind;
  regime: PrevoyanceRegimeSettings | null;
  maintien: PrevoyanceMaintienEmployeurSettings | null;
  contracts: PrevoyanceContractDraft[];
  annualBase: number;
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
  const contractArretLabel =
    kind === 'collectif'
      ? `${pct(Math.max(...collectiveContracts.map((contract) => contract.arret.salairePct), 0))} salaire`
      : `${euro(
          individualContracts.reduce(
            (sum, contract) => sum + (contract.arret.paliers[0]?.amount ?? 0),
            0,
          ),
        )}/j`;
  const contractInvaliditeLabel =
    kind === 'collectif'
      ? `${pct(
          Math.max(
            ...collectiveContracts.flatMap((contract) =>
              contract.invalidite.paliers.map((palier) => palier.salairePct),
            ),
            0,
          ),
        )} salaire`
      : euro(
          individualContracts.reduce(
            (sum, contract) => sum + (contract.invalidite.paliers[0]?.amount ?? 0),
            0,
          ),
        );
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
        <CoverageBar
          label="0 à 30 jours"
          roLabel={regime?.data.arret.paliers[0]?.amount.label ?? 'RO'}
          maintienLabel={
            maintienPalier ? `${pct(maintienPalier.firstPeriodRate)} employeur` : 'Pas de maintien'
          }
          contractLabel={contractArretLabel}
          collective={kind === 'collectif'}
        />
        <CoverageBar
          label="30 à 365 jours"
          roLabel={regime?.data.arret.paliers[0]?.amount.label ?? 'RO'}
          maintienLabel={
            maintienPalier
              ? `${maintienPalier.secondPeriodDays} j à ${pct(maintienPalier.secondPeriodRate)}`
              : 'Pas de maintien'
          }
          contractLabel={contractArretLabel}
          collective={kind === 'collectif'}
        />
        <CoverageBar
          label="365 à 1095 jours"
          roLabel={regime?.data.arret.paliers[0]?.amount.label ?? 'RO'}
          contractLabel={contractArretLabel}
          collective={false}
        />
      </section>

      <section className="premium-card prevoyance-side-card">
        <h2>Invalidité</h2>
        {(regime?.data.invalidite.paliers ?? []).slice(0, 3).map((palier) => (
          <div
            key={`${palier.fromRate}-${palier.toRate ?? 'plus'}`}
            className="prevoyance-threshold"
          >
            <span>
              {palier.fromRate} % à {palier.toRate ?? '+'} %
            </span>
            <strong>{palier.amount.label ?? 'RO'}</strong>
          </div>
        ))}
        <div className="prevoyance-side-note">Contrats : {contractInvaliditeLabel}</div>
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
