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

function buildTresorerieCard(kpis: TresoKPIs): {
  value: string;
  tone: 'positive' | 'warning';
  note: string;
} {
  if (kpis.tresorerieTientHorizon) {
    return {
      value: 'OK',
      tone: 'positive',
      note: 'Trésorerie suffisante sur tout l’horizon',
    };
  }
  if (kpis.premiereAnneeDeficitBancaire) {
    return {
      value: `Déficit en ${kpis.premiereAnneeDeficitBancaire}`,
      tone: 'warning',
      note: 'Trésorerie bancaire passe en négatif cette année-là',
    };
  }
  return {
    value: 'À revoir',
    tone: 'warning',
    note: 'Trésorerie insuffisante à horizon',
  };
}

function buildRevenuCibleCard(kpis: TresoKPIs): {
  value: string;
  tone: 'positive' | 'warning' | 'neutral';
  note?: string;
} | null {
  if (kpis.revenuCibleTientHorizon === null) {
    return null; // Aucune cible définie → on cache la carte.
  }
  if (kpis.revenuCibleTientHorizon) {
    return { value: 'OK', tone: 'positive', note: 'Cible de revenu tenue sur tout l’horizon' };
  }
  return {
    value: kpis.premiereAnneeRevenuCibleNonTenu
      ? `Manqué dès ${kpis.premiereAnneeRevenuCibleNonTenu}`
      : 'Manqué',
    tone: 'warning',
    note: 'Revenu cible non atteint',
  };
}

export function TresoKPISidebar({ kpis }: Props) {
  const ccaValue =
    kpis.ccaRestantFinHorizon > 0
      ? fmtEuro(kpis.ccaRestantFinHorizon)
      : fmtEuro(kpis.ccaRembourseTotal);
  const ccaLabel = kpis.ccaRestantFinHorizon > 0 ? 'CCA restant dû' : 'CCA remboursé';
  const tresorerieCard = buildTresorerieCard(kpis);
  const revenuCibleCard = buildRevenuCibleCard(kpis);

  return (
    <div className="premium-card sim-summary-card ts-kpi-sidebar">
      <div className="ts-kpi-sidebar__header">
        <h2 className="ts-kpi-sidebar__title">Synthèse</h2>
        <p className="ts-kpi-sidebar__subtitle">Repères clés pour lire la projection</p>
      </div>
      <div className="ts-kpi-sidebar__divider" />

      {!kpis.hasRows ? (
        <p className="ts-kpi-sidebar__empty">
          Renseignez les paramètres pour afficher la projection.
        </p>
      ) : (
        <div className="ts-kpi-card-grid">
          <KpiCard
            label="Trésorerie sur horizon"
            value={tresorerieCard.value}
            tone={tresorerieCard.tone}
            note={tresorerieCard.note}
          />
          {revenuCibleCard ? (
            <KpiCard
              label="Revenu cible"
              value={revenuCibleCard.value}
              tone={revenuCibleCard.tone}
              note={revenuCibleCard.note}
            />
          ) : null}
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
            note={
              kpis.premiereAnneeDeficitBancaire
                ? `Dès ${kpis.premiereAnneeDeficitBancaire}`
                : undefined
            }
          />
          <KpiCard label={ccaLabel} value={ccaValue} />
        </div>
      )}
    </div>
  );
}
