import { fmt } from '../successionSimulator.helpers';
import ScDonut from './ScDonut';

interface TransmissionRow {
  id: string;
  label: string;
  brut: number;
  droits: number;
  net: number;
  exonerated?: boolean;
}

interface PrevoyanceBeneficiaryLine {
  id: string;
  label: string;
  capitalTransmis: number;
  totalDroits: number;
  netTransmis: number;
}

interface ScSuccessionSummaryPanelProps {
  displayUsesChainage: boolean;
  derivedTotalDroits: number;
  synthDonutTransmis: number;
  derivedMasseTransmise: number;
  transmissionRows: TransmissionRow[];
  synthHypothese: string | null;
  isPacsed: boolean;
  chainageAnalysis: {
    order: 'epoux1' | 'epoux2';
    step1: { droitsEnfants: number } | null;
    step2: { droitsEnfants: number } | null;
  };
  avFiscalByAssure: Record<'epoux1' | 'epoux2', { totalDroits: number }>;
  perFiscalByAssure: Record<'epoux1' | 'epoux2', { totalDroits: number }>;
  prevoyanceFiscalByAssure: Record<'epoux1' | 'epoux2', { totalDroits: number }>;
  prevoyanceBeneficiaryLines: PrevoyanceBeneficiaryLine[];
  directDisplay: {
    simulatedDeceased: 'epoux1' | 'epoux2';
    result: { totalDroits: number } | null;
  };
}

export default function ScSuccessionSummaryPanel({
  displayUsesChainage,
  derivedTotalDroits,
  synthDonutTransmis,
  derivedMasseTransmise,
  transmissionRows,
  synthHypothese,
  isPacsed,
  chainageAnalysis,
  avFiscalByAssure,
  perFiscalByAssure,
  prevoyanceFiscalByAssure,
  prevoyanceBeneficiaryLines,
  directDisplay,
}: ScSuccessionSummaryPanelProps) {
  const firstCost = displayUsesChainage
    ? (chainageAnalysis.step1?.droitsEnfants ?? 0)
      + avFiscalByAssure[chainageAnalysis.order].totalDroits
      + perFiscalByAssure[chainageAnalysis.order].totalDroits
      + prevoyanceFiscalByAssure[chainageAnalysis.order].totalDroits
    : (directDisplay.result?.totalDroits ?? 0)
      + avFiscalByAssure[directDisplay.simulatedDeceased].totalDroits
      + perFiscalByAssure[directDisplay.simulatedDeceased].totalDroits
      + prevoyanceFiscalByAssure[directDisplay.simulatedDeceased].totalDroits;
  const secondValue = displayUsesChainage
    ? (chainageAnalysis.step2?.droitsEnfants ?? 0)
      + avFiscalByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits
      + perFiscalByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits
      + prevoyanceFiscalByAssure[chainageAnalysis.order === 'epoux1' ? 'epoux2' : 'epoux1'].totalDroits
    : Math.max(0, derivedMasseTransmise - derivedTotalDroits);

  return (
    <div className="premium-card sc-summary-card sc-hero-card sc-hero-card--secondary">
      <div className="sc-summary-title-row">
        <div className="sc-section-icon-wrapper">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
            <path d="M22 12A10 10 0 0 0 12 2v10z" />
          </svg>
        </div>
        <h2 className="sc-summary-title">Synthèse successorale</h2>
      </div>
      <div className="sc-card__divider sc-card__divider--tight" />
      <div className="sc-synth-hero">
        <div className="sc-synth-hero__left">
          <div className="sc-synth-hero__label">Coût de transmission estimé</div>
          <div className="sc-synth-hero__value">{fmt(derivedTotalDroits)}</div>
          {synthDonutTransmis > 0 && (
            <div className="sc-synth-hero__sub">
              sur {fmt(synthDonutTransmis)} transmis
            </div>
          )}
        </div>
        <ScDonut
          transmis={Math.max(0, synthDonutTransmis - derivedTotalDroits)}
          droits={derivedTotalDroits}
        />
      </div>
      <div className="sc-card__divider sc-card__divider--tight" />
      <div className="sc-synth-kpis">
        <div className="sc-synth-kpi">
          <span className="sc-synth-kpi__label">Patrimoine transmis</span>
          <strong className="sc-synth-kpi__value">{fmt(synthDonutTransmis)}</strong>
        </div>
        <div className="sc-synth-kpi">
          <span className="sc-synth-kpi__label">Coût cumulé</span>
          <strong className="sc-synth-kpi__value">{fmt(derivedTotalDroits)}</strong>
        </div>
        <div className="sc-synth-kpi">
          <span className="sc-synth-kpi__label">{displayUsesChainage ? 'Coût 1er décès' : 'Coût décès simulé'}</span>
          <strong className="sc-synth-kpi__value">{fmt(firstCost)}</strong>
        </div>
        <div className="sc-synth-kpi">
          <span className="sc-synth-kpi__label">{displayUsesChainage ? 'Coût 2e décès' : 'Net transmis'}</span>
          <strong className="sc-synth-kpi__value">{fmt(secondValue)}</strong>
        </div>
      </div>
      {transmissionRows.length > 0 && (
        <>
          <div className="sc-card__divider sc-card__divider--tight" />
          <div className="sc-synth-section-title">Transmission par bénéficiaire</div>
          <div className="sc-transmission-grid">
            <div className="sc-transmission-grid__head">
              <span />
              <span>Reçoit (brut)</span>
              <span>Droits</span>
              <span>Net estimé</span>
            </div>
            {transmissionRows.map((row) => (
              <div
                key={row.id}
                className={`sc-transmission-row${row.exonerated ? ' sc-transmission-row--exo' : ''}${row.id === 'assurance-vie' ? ' sc-transmission-row--av' : ''}`}
              >
                <span>{row.label}</span>
                <span>{fmt(row.brut)}</span>
                <span>{row.exonerated ? 'Exonéré' : fmt(row.droits)}</span>
                <span>{fmt(row.net)}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {prevoyanceBeneficiaryLines.length > 0 && (
        <>
          <div className="sc-card__divider sc-card__divider--tight" />
          <div className="sc-synth-section-title">Prévoyance décès par bénéficiaire</div>
          <div className="sc-transmission-grid">
            <div className="sc-transmission-grid__head">
              <span />
              <span>Reçoit (brut)</span>
              <span>Droits</span>
              <span>Net estimé</span>
            </div>
            {prevoyanceBeneficiaryLines.map((line) => (
              <div key={line.id} className="sc-transmission-row sc-transmission-row--av">
                <span>{line.label}</span>
                <span>{fmt(line.capitalTransmis)}</span>
                <span>{fmt(line.totalDroits)}</span>
                <span>{fmt(line.netTransmis)}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {(synthHypothese || transmissionRows.length > 0) && (
        <>
          <div className="sc-card__divider sc-card__divider--tight" />
          <div className="sc-summary-notes">
            {synthHypothese && (
              <p className="sc-summary-note sc-summary-note--muted">{synthHypothese}</p>
            )}
            <p className="sc-summary-note sc-summary-note--muted">
              {displayUsesChainage
                ? 'Cumul 2 décès - droits DMTG descendants, conjoint exonéré.'
                : isPacsed
                  ? "Succession directe du partenaire simulé - le PACS n'ouvre pas de droit successoral automatique sans testament."
                  : 'Succession directe du/de la défunt(e) simulé(e).'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
