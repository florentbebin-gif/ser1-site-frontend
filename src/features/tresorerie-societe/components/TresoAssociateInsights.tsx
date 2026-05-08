/**
 * TresoAssociateInsights.tsx — Timeline et graphe besoin / revenus.
 */

import type { TresoInputsRuntime, TresoProjectionRow } from '../../../engine/tresorerie/types';
import { getAssociateProfile, getSelectedAssociate } from '../utils/tresorerieSocieteModel';

interface Props {
  inputs: TresoInputsRuntime;
  rows: TresoProjectionRow[];
}

function fmtEuro(n: number): string {
  return `${Math.round(n || 0).toLocaleString('fr-FR')} €`;
}

export function TresoAssociateInsights({ inputs, rows }: Props) {
  const profile = getAssociateProfile(inputs, getSelectedAssociate(inputs));

  const retraiteIndex = Math.max(0, profile.retirementAge - profile.currentAge);
  const retraiteRow = rows[retraiteIndex] ?? rows[0];
  const revenus = retraiteRow?.revenusNets ?? 0;
  const besoin = profile.annualIncomeNeed;
  const maxGraph = Math.max(besoin, revenus, 1);
  const currentYear = profile.projectionStartYear;
  const retirementYear = currentYear + retraiteIndex;

  return (
    <div className="premium-card ts-associate-insights">
      <div className="ts-kpi-sidebar__header">
        <h2 className="ts-kpi-sidebar__title">Associé actif</h2>
        <p className="ts-kpi-sidebar__subtitle">Horizon et revenus paramétrés dans la modale</p>
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
