import type { IrSidebarSectionProps } from './irTypes';
import { IrSelect } from './IrSelect';

const DONUT_R = 27;
const DONUT_CX = 34;
const DONUT_CY = 34;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_R;

interface IrTaxDonutProps {
  revenus: number;
  imposition: number;
}

function IrTaxDonut({ revenus, imposition }: IrTaxDonutProps) {
  const safeRevenus = Math.max(0, Number(revenus) || 0);
  const safeImposition = Math.max(0, Number(imposition) || 0);
  const total = safeRevenus + safeImposition;

  if (total <= 0) {
    return (
      <svg
        width="68"
        height="68"
        viewBox="0 0 68 68"
        className="ir-summary-donut"
        aria-hidden="true"
      >
        <circle
          cx={DONUT_CX}
          cy={DONUT_CY}
          r={DONUT_R}
          fill="none"
          stroke="var(--color-c8)"
          strokeWidth="9"
        />
      </svg>
    );
  }

  const revenusLen = (safeRevenus / total) * DONUT_CIRCUMFERENCE;
  const impositionLen = DONUT_CIRCUMFERENCE - revenusLen;

  return (
    <svg
      width="68"
      height="68"
      viewBox="0 0 68 68"
      className="ir-summary-donut"
      aria-hidden="true"
      style={{ transform: 'rotate(-90deg)' }}
    >
      <circle
        cx={DONUT_CX}
        cy={DONUT_CY}
        r={DONUT_R}
        fill="none"
        stroke="var(--color-c8)"
        strokeWidth="9"
      />
      <circle
        cx={DONUT_CX}
        cy={DONUT_CY}
        r={DONUT_R}
        fill="none"
        stroke="var(--color-c5)"
        strokeWidth="9"
        strokeDasharray={`${revenusLen} ${DONUT_CIRCUMFERENCE}`}
        strokeDashoffset="0"
        strokeLinecap="butt"
      />
      <circle
        cx={DONUT_CX}
        cy={DONUT_CY}
        r={DONUT_R}
        fill="none"
        stroke="var(--color-c6)"
        strokeWidth="9"
        strokeDasharray={`${impositionLen} ${DONUT_CIRCUMFERENCE}`}
        strokeDashoffset={`${-revenusLen}`}
        strokeLinecap="butt"
      />
    </svg>
  );
}

export function IrSidebarSection({
  yearKey,
  setYearKey,
  taxSettings,
  location,
  setLocation,
  setParts,
  tmiScale,
  result,
  euro0,
  fmtPct,
  pfuRateIR,
  isExpert,
  showSummaryCard,
  hasSituation,
}: IrSidebarSectionProps) {
  return (
    <div className="ir-right">
      <div className="ir-controls-sticky">
        <div className="ir-field">
          <label>Barème</label>
          <IrSelect
            value={yearKey}
            onChange={(value) => setYearKey(value as IrSidebarSectionProps['yearKey'])}
            options={[
              { value: 'current', label: taxSettings?.incomeTax?.currentYearLabel || 'Année N' },
              { value: 'previous', label: taxSettings?.incomeTax?.previousYearLabel || 'Année N-1' },
            ]}
          />
        </div>
        <div className="ir-field">
          <label>Résidence</label>
          <IrSelect
            value={location}
            onChange={(value) => setLocation(value as IrSidebarSectionProps['location'])}
            options={[
              { value: 'metropole', label: 'Métropole' },
              { value: 'gmr', label: 'Guadeloupe / Martinique / Réunion' },
              { value: 'guyane', label: 'Guyane / Mayotte' },
            ]}
          />
        </div>
      </div>

      {hasSituation && (
      <div className="ir-results-sticky">
      <div className="ir-tmi-card premium-card sim-summary-card" data-testid="ir-results-card">
        <div className="ir-tmi-header" data-testid="ir-results-header">
          <div className="ir-section-icon-wrapper">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
          </div>
          Estimation IR
        </div>
        <div className="ir-card-divider sim-divider" />

        <div className="ir-tmi-bar" data-testid="ir-tmi-bar">
          {tmiScale.map((br, idx) => {
            const rate = Number(br.rate) || 0;
            const isActive = rate === (result?.tmiRate || 0);
            return (
              <div key={idx} className={`ir-tmi-segment${isActive ? ' is-active' : ''}`}>
                <span>{rate}%</span>
              </div>
            );
          })}
        </div>

        <div className="ir-tmi-rows" data-testid="ir-tmi-rows">
          <div className="ir-tmi-row" data-testid="ir-tmi-row">
            <span>TMI</span>
            <span data-testid="ir-tmi-value">{result ? `${result.tmiRate || 0} %` : '-'}</span>
          </div>
          <div className="ir-tmi-row" data-testid="ir-irnet-row">
            <span>Impôt sur le revenu</span>
            <span data-testid="ir-irnet-value">{result ? euro0(result.irNet || 0) : '-'}</span>
          </div>
        </div>

        <div className="ir-tmi-sub">
          <div>Montant des revenus dans cette TMI : {result ? euro0(result.tmiBaseGlobal) : '0 €'}</div>
          <div>
            Marge avant changement de TMI :{' '}
            {result && result.tmiMarginGlobal != null ? euro0(result.tmiMarginGlobal) : '—'}
          </div>
        </div>
      </div>

      {result && showSummaryCard && (
        <div className="ir-summary-card premium-card sim-summary-card sim-summary-card--secondary" data-testid="ir-summary-card">
          {isExpert && (
            <div className="ir-summary-row">
              <span>Revenu imposable du foyer</span>
              <span>{euro0(result.taxableIncome)}</span>
            </div>
          )}
          <div className="ir-summary-row">
            <span>Nombre de parts</span>
            <span className="ir-parts-stepper">
              <button
                type="button"
                className="ir-parts-btn"
                onClick={() => setParts((parts) => Math.round((parts - 0.25) * 4) / 4)}
                aria-label="Diminuer les parts"
              >▼</button>
              {result.partsNb}
              <button
                type="button"
                className="ir-parts-btn"
                onClick={() => setParts((parts) => Math.round((parts + 0.25) * 4) / 4)}
                aria-label="Augmenter les parts"
              >▲</button>
            </span>
          </div>
          {isExpert && (
            <div className="ir-summary-row">
              <span>Revenu par part</span>
              <span>{euro0(result.taxablePerPart)}</span>
            </div>
          )}

          <div className="ir-summary-row">
            <span>Impôt sur le revenu</span>
            <span>{euro0(result.irNet || 0)}</span>
          </div>
          <div className="ir-summary-row">
            <span>PFU {fmtPct(pfuRateIR)} %</span>
            <span>{euro0(result.pfuIr || 0)}</span>
          </div>
          {isExpert && (
            <>
              <div className="ir-summary-row">
                <span>CEHR</span>
                <span>{euro0(result.cehr || 0)}</span>
              </div>
              <div className="ir-summary-row">
                <span>CDHR</span>
                <span>{euro0(result.cdhr || 0)}</span>
              </div>
            </>
          )}
          <div className="ir-summary-row">
            <span>PS sur les revenus fonciers</span>
            <span>{euro0(result.psFoncier || 0)}</span>
          </div>
          {isExpert && (
            <div className="ir-summary-row">
              <span>PS sur dividendes</span>
              <span>{euro0(result.psDividends || 0)}</span>
            </div>
          )}
          <div className="ir-card-divider ir-card-divider--tight sim-divider sim-divider--tight" />
          <div className="ir-summary-total-hero">
            <div>
              <div className="ir-summary-total-hero__label">Imposition totale</div>
              <div className="ir-summary-total-hero__value">{euro0(result.totalTax || 0)}</div>
            </div>
            <IrTaxDonut
              revenus={result.totalIncome || 0}
              imposition={result.totalTax || 0}
            />
          </div>
        </div>
      )}
      </div>
      )}

    </div>
  );
}

