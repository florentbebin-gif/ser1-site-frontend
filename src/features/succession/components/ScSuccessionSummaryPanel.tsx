import { fmt } from '../successionSimulator.helpers';
import {
  getSuccessionInterMassClaimKindLabel,
  getSuccessionPocketLabel,
} from '../successionInterMassClaims';
import ScDonut from './ScDonut';

interface TransmissionRow {
  id: string;
  label: string;
  brut: number;
  droits: number;
  net: number;
  exonerated?: boolean;
}

interface InsuranceBeneficiaryLine {
  id: string;
  label: string;
  capitalTransmis: number;
  totalDroits: number;
  netTransmis: number;
}

function formatPartyLabel(value: 'epoux1' | 'epoux2'): string {
  return value === 'epoux1' ? 'Epoux 1' : 'Epoux 2';
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
    societeAcquets: {
      totalValue: number;
      firstEstateContribution: number;
      survivorShare: number;
      preciputAmount: number;
      survivorAttributionAmount: number;
      liquidationMode: 'quotes' | 'attribution_survivant';
      deceasedQuotePct: number;
      survivorQuotePct: number;
      attributionIntegrale: boolean;
    } | null;
    participationAcquets: {
      active: boolean;
      patrimoineOriginaireEpoux1: number;
      patrimoineOriginaireEpoux2: number;
      patrimoineFinalEpoux1: number;
      patrimoineFinalEpoux2: number;
      acquetsEpoux1: number;
      acquetsEpoux2: number;
      creditor: 'epoux1' | 'epoux2' | null;
      debtor: 'epoux1' | 'epoux2' | null;
      quoteAppliedPct: number;
      creanceAmount: number;
      firstEstateAdjustment: number;
    } | null;
    interMassClaims: {
      totalRequestedAmount: number;
      totalAppliedAmount: number;
      claims: Array<{
        id: string;
        kind: 'recompense' | 'creance';
        label?: string;
        fromPocket: 'epoux1' | 'epoux2' | 'communaute' | 'societe_acquets' | 'indivision_pacse' | 'indivision_concubinage';
        toPocket: 'epoux1' | 'epoux2' | 'communaute' | 'societe_acquets' | 'indivision_pacse' | 'indivision_concubinage';
        appliedAmount: number;
      }>;
    } | null;
    affectedLiabilities: {
      totalAmount: number;
      byPocket: Array<{
        pocket: 'epoux1' | 'epoux2' | 'communaute' | 'societe_acquets' | 'indivision_pacse' | 'indivision_concubinage';
        amount: number;
      }>;
    } | null;
    preciput: {
      mode: 'global' | 'cible' | 'none';
      appliedAmount: number;
      usesGlobalFallback: boolean;
      selections: Array<{
        id: string;
        label: string;
        appliedAmount: number;
      }>;
    } | null;
    step1: { droitsEnfants: number } | null;
    step2: { droitsEnfants: number } | null;
  };
  avFiscalByAssure: Record<'epoux1' | 'epoux2', { totalDroits: number }>;
  perFiscalByAssure: Record<'epoux1' | 'epoux2', { totalDroits: number }>;
  prevoyanceFiscalByAssure: Record<'epoux1' | 'epoux2', { totalDroits: number }>;
  insurance990ILines: InsuranceBeneficiaryLine[];
  insurance757BLines: InsuranceBeneficiaryLine[];
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
  insurance990ILines,
  insurance757BLines,
  directDisplay,
}: ScSuccessionSummaryPanelProps) {
  const societeAcquets = chainageAnalysis.societeAcquets;
  const participationAcquets = chainageAnalysis.participationAcquets;
  const interMassClaims = chainageAnalysis.interMassClaims;
  const affectedLiabilities = chainageAnalysis.affectedLiabilities;
  const preciput = chainageAnalysis.preciput;
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
              sur {fmt(synthDonutTransmis)} {displayUsesChainage ? 'cumules' : 'transmis'}
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
          <span className="sc-synth-kpi__label">{displayUsesChainage ? 'Cumul transmis sur 2 deces' : 'Patrimoine transmis'}</span>
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
      {displayUsesChainage && societeAcquets && societeAcquets.totalValue > 0 && (
        <>
          <div className="sc-card__divider sc-card__divider--tight" />
          <div className="sc-synth-section-title">Liquidation societe d'acquets</div>
          <div className="sc-summary-row">
            <span>Valeur nette de la poche</span>
            <strong>{fmt(societeAcquets.totalValue)}</strong>
          </div>
          <div className="sc-summary-row">
            <span>Part integree au 1er deces</span>
            <strong>{fmt(societeAcquets.firstEstateContribution)}</strong>
          </div>
          <div className="sc-summary-row">
            <span>Part conservee par le survivant</span>
            <strong>{fmt(societeAcquets.survivorShare)}</strong>
          </div>
          <div className="sc-summary-row">
            <span>Quotes retenues</span>
            <strong>{`${Math.round(societeAcquets.deceasedQuotePct)}% / ${Math.round(societeAcquets.survivorQuotePct)}%`}</strong>
          </div>
          {societeAcquets.preciputAmount > 0 && (
            <div className="sc-summary-row">
              <span>Preciput preleve</span>
              <strong>{fmt(societeAcquets.preciputAmount)}</strong>
            </div>
          )}
          {societeAcquets.survivorAttributionAmount > 0 && (
            <div className="sc-summary-row">
              <span>Attribution prealable au survivant</span>
              <strong>{fmt(societeAcquets.survivorAttributionAmount)}</strong>
            </div>
          )}
          {societeAcquets.attributionIntegrale && (
            <div className="sc-summary-row">
              <span>Attribution integrale du reliquat</span>
              <strong>Oui</strong>
            </div>
          )}
        </>
      )}
      {displayUsesChainage && preciput && (preciput.appliedAmount > 0 || preciput.selections.length > 0) && (
        <>
          <div className="sc-card__divider sc-card__divider--tight" />
          <div className="sc-synth-section-title">Preciput applique</div>
          <div className="sc-summary-row">
            <span>Mode retenu</span>
            <strong>{preciput.mode === 'cible' ? 'Cible' : 'Global'}</strong>
          </div>
          <div className="sc-summary-row">
            <span>Montant preleve</span>
            <strong>{fmt(preciput.appliedAmount)}</strong>
          </div>
          {preciput.usesGlobalFallback && (
            <div className="sc-summary-row">
              <span>Mode de repli global</span>
              <strong>Oui</strong>
            </div>
          )}
          {preciput.selections.map((selection) => (
            <div key={selection.id} className="sc-summary-row">
              <span>{selection.label}</span>
              <strong>{fmt(selection.appliedAmount)}</strong>
            </div>
          ))}
        </>
      )}
      {displayUsesChainage && participationAcquets && (
        <>
          <div className="sc-card__divider sc-card__divider--tight" />
          <div className="sc-synth-section-title">Participation aux acquets</div>
          {!participationAcquets.active ? (
            <div className="sc-summary-row">
              <span>Configuration</span>
              <strong>Inactive</strong>
            </div>
          ) : (
            <>
              <div className="sc-summary-row">
                <span>Patrimoine originaire Epoux 1 / Epoux 2</span>
                <strong>{`${fmt(participationAcquets.patrimoineOriginaireEpoux1)} / ${fmt(participationAcquets.patrimoineOriginaireEpoux2)}`}</strong>
              </div>
              <div className="sc-summary-row">
                <span>Patrimoine final Epoux 1 / Epoux 2</span>
                <strong>{`${fmt(participationAcquets.patrimoineFinalEpoux1)} / ${fmt(participationAcquets.patrimoineFinalEpoux2)}`}</strong>
              </div>
              <div className="sc-summary-row">
                <span>Acquets nets Epoux 1 / Epoux 2</span>
                <strong>{`${fmt(participationAcquets.acquetsEpoux1)} / ${fmt(participationAcquets.acquetsEpoux2)}`}</strong>
              </div>
              <div className="sc-summary-row">
                <span>Creance de participation</span>
                <strong>{fmt(participationAcquets.creanceAmount)}</strong>
              </div>
              {participationAcquets.creditor && participationAcquets.debtor && (
                <>
                  <div className="sc-summary-row">
                    <span>Creancier / debiteur</span>
                    <strong>{`${formatPartyLabel(participationAcquets.creditor)} / ${formatPartyLabel(participationAcquets.debtor)}`}</strong>
                  </div>
                  <div className="sc-summary-row">
                    <span>Quote appliquee</span>
                    <strong>{`${Math.round(participationAcquets.quoteAppliedPct)} %`}</strong>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
      {displayUsesChainage && interMassClaims && interMassClaims.totalAppliedAmount > 0 && (
        <>
          <div className="sc-card__divider sc-card__divider--tight" />
          <div className="sc-synth-section-title">Recompenses / creances entre masses</div>
          <div className="sc-summary-row">
            <span>Montant applique</span>
            <strong>{fmt(interMassClaims.totalAppliedAmount)}</strong>
          </div>
          {interMassClaims.claims
            .filter((claim) => claim.appliedAmount > 0)
            .map((claim) => (
              <div key={claim.id} className="sc-summary-row">
                <span>
                  {(claim.label ?? getSuccessionInterMassClaimKindLabel(claim.kind))}
                  {' - '}
                  {getSuccessionPocketLabel(claim.fromPocket)}
                  {' vers '}
                  {getSuccessionPocketLabel(claim.toPocket)}
                </span>
                <strong>{fmt(claim.appliedAmount)}</strong>
              </div>
            ))}
        </>
      )}
      {displayUsesChainage && affectedLiabilities && affectedLiabilities.totalAmount > 0 && (
        <>
          <div className="sc-card__divider sc-card__divider--tight" />
          <div className="sc-synth-section-title">Passif affecte</div>
          <div className="sc-summary-row">
            <span>Total des passifs rattaches</span>
            <strong>{fmt(affectedLiabilities.totalAmount)}</strong>
          </div>
          {affectedLiabilities.byPocket.map((entry) => (
            <div key={entry.pocket} className="sc-summary-row">
              <span>{getSuccessionPocketLabel(entry.pocket)}</span>
              <strong>{fmt(entry.amount)}</strong>
            </div>
          ))}
        </>
      )}
      {(transmissionRows.length > 0 || insurance757BLines.length > 0) && (
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
            {insurance757BLines.map((line) => (
              <div key={`757b-${line.id}`} className="sc-transmission-row sc-transmission-row--av">
                <span>{line.label} (art. 757 B)</span>
                <span>{fmt(line.capitalTransmis)}</span>
                <span>{fmt(line.totalDroits)}</span>
                <span>{fmt(line.netTransmis)}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {insurance990ILines.length > 0 && (
        <>
          <div className="sc-card__divider sc-card__divider--tight" />
          <div className="sc-synth-section-title">Assurances hors succession — art. 990 I</div>
          <div className="sc-transmission-grid">
            <div className="sc-transmission-grid__head">
              <span />
              <span>Reçoit (brut)</span>
              <span>Droits</span>
              <span>Net estimé</span>
            </div>
            {insurance990ILines.map((line) => (
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
      {(synthHypothese || transmissionRows.length > 0 || insurance757BLines.length > 0) && (
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
                  : 'Succession directe simulée.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
