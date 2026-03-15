/**
 * PerSimulator — MVP PER page (P1-03)
 *
 * Orchestrates: inputs → engine → outputs.
 * Zero calculation in React — all formulas in src/engine/per.ts.
 * Uses useExportGuard for TTL compliance.
 */

import { usePerCalc } from './usePerCalc';
import './Per.css';

const TMI_OPTIONS = [0, 11, 30, 41, 45];

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

export default function PerSimulator() {
  const {
    form, result, setField, compute, reset, hasResult,
  } = usePerCalc();

  return (
    <div className="per-page">
      <h1>Simulateur PER</h1>

      {/* Inputs */}
      <div className="per-card">
        <h2>Paramètres d'épargne</h2>
        <div className="per-fields">
          <div className="per-field">
            <label htmlFor="per-versement">Versement annuel (€)</label>
            <input
              id="per-versement"
              type="number"
              min={0}
              value={form.versementAnnuel || ''}
              onChange={(e) => setField('versementAnnuel', Number(e.target.value) || 0)}
              placeholder="Ex : 5 000"
            />
          </div>
          <div className="per-field">
            <label htmlFor="per-duree">Durée (années)</label>
            <input
              id="per-duree"
              type="number"
              min={1}
              max={50}
              value={form.dureeAnnees || ''}
              onChange={(e) => setField('dureeAnnees', Number(e.target.value) || 1)}
            />
          </div>
          <div className="per-field">
            <label htmlFor="per-tmi">TMI (%)</label>
            <select
              id="per-tmi"
              value={form.tmi}
              onChange={(e) => setField('tmi', Number(e.target.value))}
            >
              {TMI_OPTIONS.map((t) => (
                <option key={t} value={t}>{t} %</option>
              ))}
            </select>
          </div>
          <div className="per-field">
            <label htmlFor="per-rendement">Rendement brut (%)</label>
            <input
              id="per-rendement"
              type="number"
              min={0}
              max={15}
              step={0.1}
              value={form.rendementAnnuel}
              onChange={(e) => setField('rendementAnnuel', Number(e.target.value) || 0)}
            />
          </div>
          <div className="per-field">
            <label htmlFor="per-frais">Frais de gestion (%)</label>
            <input
              id="per-frais"
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={form.fraisGestion}
              onChange={(e) => setField('fraisGestion', Number(e.target.value) || 0)}
            />
          </div>
          <div className="per-field">
            <label htmlFor="per-age">Âge souscription</label>
            <input
              id="per-age"
              type="number"
              min={18}
              max={70}
              value={form.ageSouscription}
              onChange={(e) => setField('ageSouscription', Number(e.target.value) || 45)}
            />
          </div>
        </div>
      </div>

      {/* Compute */}
      <div className="per-actions" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className="per-btn per-btn--primary"
          onClick={compute}
          disabled={form.versementAnnuel <= 0 || form.dureeAnnees < 1}
        >
          Simuler
        </button>
        <button
          type="button"
          className="per-btn per-btn--secondary"
          onClick={reset}
        >
          Réinitialiser
        </button>
      </div>

      {/* Results */}
      {hasResult && result && (
        <>
          <div className="per-card">
            <h2>Résultats</h2>
            <div className="per-kpis">
              <div className="per-kpi">
                <div className="per-kpi-label">Capital à terme</div>
                <div className="per-kpi-value">{fmt(result.result.capitalTerme)}</div>
              </div>
              <div className="per-kpi">
                <div className="per-kpi-label">Total versements</div>
                <div className="per-kpi-value">{fmt(result.result.totalVersements)}</div>
              </div>
              <div className="per-kpi">
                <div className="per-kpi-label">Économie IR totale</div>
                <div className="per-kpi-value">{fmt(result.result.economieImpotTotale)}</div>
              </div>
              <div className="per-kpi">
                <div className="per-kpi-label">Plus-values</div>
                <div className="per-kpi-value">{fmt(result.result.gainNet)}</div>
              </div>
            </div>

            <h2>Sortie comparée</h2>
            <table className="per-sortie-table">
              <thead>
                <tr>
                  <th>Mode de sortie</th>
                  <th className="text-right">Montant brut</th>
                  <th className="text-right">Montant net estimé</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sortie en capital (100%)</td>
                  <td className="text-right">{fmt(result.result.capitalTerme)}</td>
                  <td className="text-right">{fmt(result.result.capitalNetSortie)}</td>
                </tr>
                <tr>
                  <td>Sortie en rente viagère</td>
                  <td className="text-right">{fmt(result.result.renteAnnuelleEstimee)} /an</td>
                  <td className="text-right">{fmt(result.result.renteMensuelleEstimee)} /mois</td>
                </tr>
              </tbody>
            </table>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="per-warnings">
                {result.warnings.map((w, i) => (
                  <div key={i} className={`per-warning per-warning--${w.severity}`}>
                    {w.message}
                  </div>
                ))}
              </div>
            )}
          </div>

        </>
      )}
    </div>
  );
}
