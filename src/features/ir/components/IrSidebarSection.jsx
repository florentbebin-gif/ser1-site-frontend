import React from 'react';

export function IrSidebarSection({
  location,
  setLocation,
  children,
  setChildren,
  parts,
  setParts,
  tmiScale,
  result,
  euro0,
  fmtPct,
  pfuRateIR,
}) {
  return (
    <div className="ir-right">
      <div className="ir-field">
        <label>Résidence</label>
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="metropole">Métropole</option>
          <option value="gmr">Guadeloupe / Martinique / Réunion</option>
          <option value="guyane">Guyane / Mayotte</option>
        </select>
      </div>

      <button
        type="button"
        className="chip"
        onClick={() => setChildren((c) => [...c, { id: Date.now(), mode: 'charge' }])}
      >
        + Ajouter un enfant
      </button>

      <div className="ir-children-grid">
        {children.map((child, idx) => (
          <div key={child.id} className="ir-child-item">
            <strong>Enfant {idx + 1}</strong>

            <select
              className="ir-child-select"
              value={child.mode}
              onChange={(e) =>
                setChildren((list) =>
                  list.map((c) => (c.id === child.id ? { ...c, mode: e.target.value } : c)),
                )
              }
            >
              <option value="charge">À charge</option>
              <option value="shared">Garde alternée</option>
            </select>

            <button
              type="button"
              className="chip ir-child-remove"
              onClick={() => setChildren((list) => list.filter((c) => c.id !== child.id))}
            >
              −
            </button>
          </div>
        ))}
      </div>

      <div className="ir-tmi-card premium-card" data-testid="ir-results-card">
        <div className="ir-tmi-header" data-testid="ir-results-header">
          Estimation IR
        </div>
        <div className="ir-card-divider" />

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

      {result && (
        <div className="ir-summary-card premium-card">
          <div className="ir-summary-row">
            <span>Revenu imposable du foyer</span>
            <span>{euro0(result.taxableIncome)}</span>
          </div>
          <div className="ir-summary-row">
            <span>Nombre de parts</span>
            <span className="ir-parts-stepper">
              <button
                type="button"
                className="ir-parts-btn"
                onClick={() => setParts((p) => Math.round((p - 0.25) * 4) / 4)}
                aria-label="Diminuer les parts"
              >▼</button>
              {result.partsNb}
              <button
                type="button"
                className="ir-parts-btn"
                onClick={() => setParts((p) => Math.round((p + 0.25) * 4) / 4)}
                aria-label="Augmenter les parts"
              >▲</button>
            </span>
          </div>
          <div className="ir-summary-row">
            <span>Revenu par part</span>
            <span>{euro0(result.taxablePerPart)}</span>
          </div>

          <div className="ir-summary-row">
            <span>Impôt sur le revenu</span>
            <span>{euro0(result.irNet || 0)}</span>
          </div>
          <div className="ir-summary-row">
            <span>PFU {fmtPct(pfuRateIR)} %</span>
            <span>{euro0(result.pfuIr || 0)}</span>
          </div>
          <div className="ir-summary-row">
            <span>CEHR</span>
            <span>{euro0(result.cehr || 0)}</span>
          </div>
          <div className="ir-summary-row">
            <span>CDHR</span>
            <span>{euro0(result.cdhr || 0)}</span>
          </div>
          <div className="ir-summary-row">
            <span>PS sur les revenus fonciers</span>
            <span>{euro0(result.psFoncier || 0)}</span>
          </div>
          <div className="ir-summary-row">
            <span>PS sur dividendes</span>
            <span>{euro0(result.psDividends || 0)}</span>
          </div>
          <div className="ir-card-divider" />
          <div className="ir-summary-row">
            <span>Imposition totale</span>
            <span>{euro0(result.totalTax || 0)}</span>
          </div>
        </div>
      )}

    </div>
  );
}
