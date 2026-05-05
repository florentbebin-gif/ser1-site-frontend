/**
 * TresoKPISidebar.tsx — 9 KPIs de synthèse (colonne droite sticky)
 *
 * Chaque KPI a un état conditionnel : incomplete, ready, warning.
 * IS latent capitalisation : affiché séparément avec badge "non décaissé".
 */

import type { TresoKPIs } from '../hooks/useTresorerieCalculations';
import type { TresoInputs } from '../../../engine/tresorerie/types';

interface Props {
  kpis: TresoKPIs;
  inputs: TresoInputs;
}

function fmtEuro(n: number): string {
  return Math.round(n).toLocaleString('fr-FR') + ' €';
}

function fmtAns(n: number): string {
  return n === 1 ? '1 an' : `${n} ans`;
}

interface KpiRowProps {
  label: string;
  value: string | null;
  status: 'ready' | 'incomplete' | 'warning';
  badge?: string;
  note?: string;
}

function KpiRow({ label, value, status, badge, note }: KpiRowProps) {
  return (
    <div className={`ts-kpi-row ts-kpi-row--${status}`}>
      <div className="ts-kpi-row__header">
        <span className="ts-kpi-row__label">{label}</span>
        {badge && <span className="ts-kpi-row__badge">{badge}</span>}
      </div>
      <div className="ts-kpi-row__value">
        {status === 'incomplete'
          ? <span className="ts-kpi-row__incomplete">Hypothèses à compléter</span>
          : value}
      </div>
      {note && <p className="ts-kpi-row__note">{note}</p>}
    </div>
  );
}

export function TresoKPISidebar({ kpis, inputs }: Props) {
  const hasCapiValeurs = !!(
    inputs.capitalisation?.valeurActuelle != null &&
    inputs.capitalisation?.capitalInvestiHistorique != null
  );
  const hasAnneeRetraite = kpis.anneeRetraiteIndex !== null && kpis.anneeRetraiteIndex >= 0;

  return (
    <div className="premium-card sim-summary-card ts-kpi-sidebar">
      <div className="ts-kpi-sidebar__header">
        <h2 className="ts-kpi-sidebar__title">Synthèse</h2>
        <p className="ts-kpi-sidebar__subtitle">Indicateurs clés de la simulation</p>
      </div>
      <div className="ts-kpi-sidebar__divider" />

      {!kpis.hasRows ? (
        <p className="ts-kpi-sidebar__empty">
          Renseignez les paramètres pour afficher la projection.
        </p>
      ) : (
        <div className="ts-kpi-list">

          {/* 1 — CCA total constitué */}
          <KpiRow
            label="CCA total constitué"
            value={fmtEuro(kpis.ccaTotalConstitue)}
            status="ready"
          />

          {/* 2 — IS total décaissé */}
          <KpiRow
            label="IS total décaissé"
            value={fmtEuro(kpis.isTotalDecaisse)}
            status="ready"
          />

          {/* 3 — IS latent capitalisation (non décaissé) */}
          {inputs.capitalisation ? (
            <KpiRow
              label="IS latent capitalisation"
              value={hasCapiValeurs
                ? fmtEuro(kpis.isLatentCapi)
                : fmtEuro(kpis.isLatentCapi)}
              status="ready"
              badge="non décaissé"
              note={!hasCapiValeurs && inputs.typeCreation === 'existante'
                ? 'Renseignez la valeur actuelle et le capital investi pour affiner.'
                : undefined}
            />
          ) : null}

          {/* 4 — Revenu net à la retraite */}
          <KpiRow
            label="Revenu net annuel à la retraite"
            value={hasAnneeRetraite ? fmtEuro(kpis.revenusNetsRetraite) : null}
            status={hasAnneeRetraite ? 'ready' : 'incomplete'}
          />

          {/* 5 — Durée remboursement CCA */}
          <KpiRow
            label="Durée de remboursement CCA"
            value={kpis.dureeRemboursementCCA != null
              ? fmtAns(kpis.dureeRemboursementCCA)
              : null}
            status={kpis.dureeRemboursementCCA != null ? 'ready' : 'incomplete'}
          />

          {/* 6 — Valeur nette société à la retraite */}
          <KpiRow
            label="Valeur nette société à la retraite"
            value={hasAnneeRetraite ? fmtEuro(kpis.valeurNetteSocieteRetraite) : null}
            status={hasAnneeRetraite ? 'ready' : 'incomplete'}
          />

          {/* 7 — Réserves à la retraite */}
          <KpiRow
            label="Réserves disponibles à la retraite"
            value={hasAnneeRetraite ? fmtEuro(kpis.reservesRetraite) : null}
            status={hasAnneeRetraite ? 'ready' : 'incomplete'}
          />

          {/* 8 — Capacité distribuable année 1 */}
          <KpiRow
            label="Capacité distribuable (an 1)"
            value={fmtEuro(kpis.capaciteDistribuableAn1)}
            status="ready"
          />

          {/* 9 — Alerte dividendes > capacité */}
          {kpis.alerteDividendesAn1 || inputs.creditIR?.actif || inputs.holding ? (
            <KpiRow
              label="Alerte dividendes"
              value={kpis.alerteDividendesAn1
                ? '⚠ Dividendes > capacité distribuable'
                : 'Aucune alerte'}
              status={kpis.alerteDividendesAn1 ? 'warning' : 'ready'}
            />
          ) : null}

        </div>
      )}
    </div>
  );
}
