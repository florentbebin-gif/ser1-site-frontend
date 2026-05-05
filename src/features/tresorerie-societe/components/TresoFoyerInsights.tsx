/**
 * TresoFoyerInsights.tsx — Timeline et graphe besoin / revenus.
 */

import type { TresoInputsV2, TresoProjectionRow } from '../../../engine/tresorerie/types';

interface Props {
  inputs: TresoInputsV2;
  rows: TresoProjectionRow[];
}

function fmtEuro(n: number): string {
  return `${Math.round(n || 0).toLocaleString('fr-FR')} €`;
}

export function TresoFoyerInsights({ inputs, rows }: Props) {
  const v2 = inputs;

  const retraiteIndex = Math.max(0, v2.foyer.retirementAge - v2.foyer.currentAge);
  const retraiteRow = rows[retraiteIndex] ?? rows[0];
  const revenus = retraiteRow?.revenusNets ?? 0;
  const besoin = v2.foyer.annualIncomeNeed;
  const maxGraph = Math.max(besoin, revenus, 1);
  const currentYear = v2.foyer.projectionStartYear;
  const retirementYear = currentYear + retraiteIndex;

  return (
    <div className="premium-card ts-foyer-insights">
      <div className="ts-kpi-sidebar__header">
        <h2 className="ts-kpi-sidebar__title">Foyer</h2>
        <p className="ts-kpi-sidebar__subtitle">Horizon et revenus à la date cible</p>
      </div>
      <div className="ts-kpi-sidebar__divider" />

      <div className="ts-mini-timeline" aria-label="Timeline de projection">
        <div className="ts-mini-timeline__track">
          <span className="ts-mini-timeline__dot is-active" />
          <span className="ts-mini-timeline__line" />
          <span className="ts-mini-timeline__dot" />
        </div>
        <div className="ts-mini-timeline__labels">
          <span>{currentYear}</span>
          <strong>{retirementYear}</strong>
        </div>
      </div>

      <div className="ts-income-graph" aria-label="Besoin de revenus et revenus générés">
        <div className="ts-income-graph__row">
          <span>Besoin annuel</span>
          <div className="ts-income-graph__bar">
            <i style={{ width: `${(besoin / maxGraph) * 100}%` }} />
          </div>
          <strong>{fmtEuro(besoin)}</strong>
        </div>
        <div className="ts-income-graph__row">
          <span>Revenus société</span>
          <div className="ts-income-graph__bar ts-income-graph__bar--accent">
            <i style={{ width: `${(revenus / maxGraph) * 100}%` }} />
          </div>
          <strong>{fmtEuro(revenus)}</strong>
        </div>
      </div>
    </div>
  );
}
