/**
 * SuccessionSimulator — MVP Succession page (P1-02)
 *
 * Orchestrates: inputs → engine → outputs.
 * Zero calculation in React — all formulas in src/engine/succession/.
 * Uses useExportGuard for TTL compliance.
 */

import React, { useContext, useCallback } from 'react';
import { useSuccessionCalc } from './useSuccessionCalc';
import { exportSuccessionPptx } from '../../pptx/exports/successionExport';
import { exportAndDownloadSuccessionXlsx } from './successionXlsx';
import { useTheme } from '../../settings/ThemeProvider';
import { SessionGuardContext } from '../../App';
import { useFiscalContext } from '../../hooks/useFiscalContext';
import type { LienParente } from '../../engine/succession';
import './Succession.css';

const LIEN_OPTIONS: { value: LienParente; label: string }[] = [
  { value: 'conjoint', label: 'Conjoint' },
  { value: 'enfant', label: 'Enfant' },
  { value: 'petit_enfant', label: 'Petit-enfant' },
  { value: 'frere_soeur', label: 'Frère / Sœur' },
  { value: 'neveu_niece', label: 'Neveu / Nièce' },
  { value: 'autre', label: 'Autre' },
];

const fmt = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

const fmtPct = (v: number): string =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + ' %';

export default function SuccessionSimulator() {
  // Mode strict : attend Supabase avant d'afficher le simulateur (PR-01)
  // Le branchement du calcul sur dmtgSettings sera fait en PR-03
  const { loading: settingsLoading } = useFiscalContext({ strict: true });

  const {
    form, result, setActifNet, addHeritier, removeHeritier,
    updateHeritier, distributeEqually, compute, reset, hasResult,
  } = useSuccessionCalc();

  const { pptxColors, cabinetLogo, logoPlacement } = useTheme();
  const { sessionExpired, canExport } = useContext(SessionGuardContext);

  const handleExportPptx = useCallback(async () => {
    if (!result || !canExport) return;
    await exportSuccessionPptx(
      {
        actifNetSuccession: result.result.actifNetSuccession,
        totalDroits: result.result.totalDroits,
        tauxMoyenGlobal: result.result.tauxMoyenGlobal,
        heritiers: result.result.detailHeritiers,
      },
      pptxColors,
      { logoUrl: cabinetLogo, logoPlacement },
    );
  }, [result, canExport, pptxColors, cabinetLogo, logoPlacement]);

  const handleExportXlsx = useCallback(async () => {
    if (!result || !canExport) return;
    await exportAndDownloadSuccessionXlsx(
      {
        actifNetSuccession: form.actifNetSuccession,
        nbHeritiers: form.heritiers.length,
        heritiers: form.heritiers.map((h) => ({ lien: h.lien, partSuccession: h.partSuccession })),
      },
      result.result,
      pptxColors.c1,
    );
  }, [result, canExport, form, pptxColors]);

  if (settingsLoading) {
    return (
      <div className="succession-page">
        <h1>Simulateur Succession</h1>
        <div className="succession-settings-loading" data-testid="succession-settings-loading">
          Chargement des paramètres fiscaux…
        </div>
      </div>
    );
  }

  return (
    <div className="succession-page">
      <h1>Simulateur Succession</h1>

      {/* Inputs */}
      <div className="succession-card">
        <h2>Patrimoine transmis</h2>
        <div className="succession-field">
          <label htmlFor="actif-net">Actif net successoral (€)</label>
          <input
            id="actif-net"
            type="number"
            min={0}
            value={form.actifNetSuccession || ''}
            onChange={(e) => setActifNet(Number(e.target.value) || 0)}
            placeholder="Ex : 500 000"
          />
        </div>
      </div>

      <div className="succession-card">
        <h2>Héritiers</h2>
        {form.heritiers.map((h) => (
          <div key={h.id} className="succession-heritier-row">
            <div className="succession-field">
              <label>Lien de parenté</label>
              <select
                value={h.lien}
                onChange={(e) => updateHeritier(h.id, 'lien', e.target.value as LienParente)}
              >
                {LIEN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="succession-field">
              <label>Part succession (€)</label>
              <input
                type="number"
                min={0}
                value={h.partSuccession || ''}
                onChange={(e) => updateHeritier(h.id, 'partSuccession', Number(e.target.value) || 0)}
                placeholder="Montant"
              />
            </div>
            {form.heritiers.length > 1 && (
              <button
                type="button"
                className="succession-btn-remove"
                onClick={() => removeHeritier(h.id)}
                title="Supprimer cet héritier"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <div className="succession-actions">
          <button
            type="button"
            className="succession-btn succession-btn--secondary"
            onClick={() => addHeritier('enfant')}
          >
            + Ajouter un héritier
          </button>
          <button
            type="button"
            className="succession-btn succession-btn--secondary"
            onClick={distributeEqually}
            disabled={form.heritiers.length === 0 || form.actifNetSuccession <= 0}
          >
            Répartir également
          </button>
        </div>
      </div>

      {/* Compute */}
      <div className="succession-actions" style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className="succession-btn succession-btn--primary"
          onClick={compute}
          disabled={form.actifNetSuccession <= 0 || form.heritiers.length === 0}
        >
          Calculer les droits
        </button>
        <button
          type="button"
          className="succession-btn succession-btn--secondary"
          onClick={reset}
        >
          Réinitialiser
        </button>
      </div>

      {/* Results */}
      {hasResult && result && (
        <>
          <div className="succession-card">
            <h2>Résultats</h2>
            <div className="succession-kpis">
              <div className="succession-kpi">
                <div className="succession-kpi-label">Actif net successoral</div>
                <div className="succession-kpi-value">{fmt(result.result.actifNetSuccession)}</div>
              </div>
              <div className="succession-kpi">
                <div className="succession-kpi-label">Total droits</div>
                <div className="succession-kpi-value">{fmt(result.result.totalDroits)}</div>
              </div>
              <div className="succession-kpi">
                <div className="succession-kpi-label">Taux moyen global</div>
                <div className="succession-kpi-value">{fmtPct(result.result.tauxMoyenGlobal)}</div>
              </div>
            </div>

            <table className="succession-table">
              <thead>
                <tr>
                  <th>Héritier</th>
                  <th className="text-right">Part brute</th>
                  <th className="text-right">Abattement</th>
                  <th className="text-right">Base imposable</th>
                  <th className="text-right">Droits</th>
                  <th className="text-right">Taux moyen</th>
                </tr>
              </thead>
              <tbody>
                {result.result.detailHeritiers.map((h, i) => (
                  <tr key={i}>
                    <td>{LIEN_OPTIONS.find((o) => o.value === h.lien)?.label ?? h.lien}</td>
                    <td className="text-right">{fmt(h.partBrute)}</td>
                    <td className="text-right">{fmt(h.abattement)}</td>
                    <td className="text-right">{fmt(h.baseImposable)}</td>
                    <td className="text-right">{fmt(h.droits)}</td>
                    <td className="text-right">{fmtPct(h.tauxMoyen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Export bar */}
          <div className="succession-card">
            <h2>Exports</h2>
            {sessionExpired && (
              <p className="succession-session-msg">
                Session expirée — reconnectez-vous pour exporter.
              </p>
            )}
            <div className="succession-export-bar">
              <button
                type="button"
                className="succession-btn succession-btn--accent"
                onClick={handleExportPptx}
                disabled={!canExport}
              >
                Exporter PPTX
              </button>
              <button
                type="button"
                className="succession-btn succession-btn--accent"
                onClick={handleExportXlsx}
                disabled={!canExport}
              >
                Exporter Excel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
