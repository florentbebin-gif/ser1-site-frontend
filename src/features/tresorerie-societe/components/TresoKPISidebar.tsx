/**
 * TresoKPISidebar.tsx — Synthèse courte de la projection holding.
 */

import type { TresoKPIs } from '../hooks/useTresorerieCalculations';
import type { TresoInputsRuntime } from '../../../engine/tresorerie/types';

interface Props {
  kpis: TresoKPIs;
  inputs: TresoInputsRuntime;
}

function fmtEuro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function fmtPercent(n: number): string {
  return `${(n * 100).toLocaleString('fr-FR', {
    maximumFractionDigits: 1,
  })} %`;
}

interface KpiCardProps {
  label: string;
  value: string;
  tone?: 'neutral' | 'warning' | 'positive';
  note?: string;
}

function KpiCard({ label, value, tone = 'neutral', note }: KpiCardProps) {
  return (
    <div className={`ts-kpi-card ts-kpi-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

function getHorizonNote(kpis: TresoKPIs): string {
  const notes: string[] = [];
  if (kpis.tresorerieTientHorizon) {
    notes.push('Trésorerie OK');
  } else {
    notes.push(kpis.premiereAnneeDeficitBancaire
      ? `Trésorerie dès ${kpis.premiereAnneeDeficitBancaire}`
      : 'Trésorerie à revoir');
  }

  if (kpis.revenuCibleTientHorizon === null) {
    notes.push('Aucune cible de revenu');
  } else if (kpis.revenuCibleTientHorizon) {
    notes.push('Revenu cible OK');
  } else {
    notes.push(kpis.premiereAnneeRevenuCibleNonTenu
      ? `Revenu cible dès ${kpis.premiereAnneeRevenuCibleNonTenu}`
      : 'Revenu cible à revoir');
  }
  return notes.join(' · ');
}

export function TresoKPISidebar({ kpis }: Props) {
  const ccaValue = kpis.ccaRestantFinHorizon > 0
    ? fmtEuro(kpis.ccaRestantFinHorizon)
    : fmtEuro(kpis.ccaRembourseTotal);
  const ccaLabel = kpis.ccaRestantFinHorizon > 0 ? 'CCA restant dû' : 'CCA remboursé';
  const horizonOk = kpis.tresorerieTientHorizon && kpis.revenuCibleTientHorizon !== false;

  return (
    <div className="premium-card sim-summary-card ts-kpi-sidebar">
      <div className="ts-kpi-sidebar__header">
        <h2 className="ts-kpi-sidebar__title">Synthèse</h2>
        <p className="ts-kpi-sidebar__subtitle">6 repères pour lire la projection</p>
      </div>
      <div className="ts-kpi-sidebar__divider" />

      {!kpis.hasRows ? (
        <p className="ts-kpi-sidebar__empty">
          Renseignez les paramètres pour afficher la projection.
        </p>
      ) : (
        <div className="ts-kpi-card-grid">
          <KpiCard
            label="Tenue horizon"
            value={horizonOk ? 'OK' : 'À revoir'}
            tone={horizonOk ? 'positive' : 'warning'}
            note={getHorizonNote(kpis)}
          />
          <KpiCard
            label="Performance moyenne"
            value={fmtPercent(kpis.performanceMoyenneTresorerie)}
            note="Trésorerie placée"
          />
          <KpiCard label="IS total décaissé" value={fmtEuro(kpis.isTotalDecaisse)} />
          <KpiCard
            label="Compte bancaire fin horizon"
            value={fmtEuro(kpis.compteBancaireFinHorizon)}
            tone={kpis.compteBancaireFinHorizon < 0 ? 'warning' : 'neutral'}
          />
          <KpiCard
            label="Déficit bancaire maximal"
            value={fmtEuro(kpis.deficitBancaireMax)}
            tone={kpis.deficitBancaireMax > 0 ? 'warning' : 'positive'}
            note={kpis.premiereAnneeDeficitBancaire
              ? `Dès ${kpis.premiereAnneeDeficitBancaire}`
              : undefined}
          />
          <KpiCard label={ccaLabel} value={ccaValue} />
        </div>
      )}
    </div>
  );
}
