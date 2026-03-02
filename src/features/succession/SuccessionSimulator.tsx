/**
 * SuccessionSimulator — Simulateur Succession
 *
 * PR1 scope:
 * - Alignement UI sur la norme /sim/* (shell, grille, sticky, accordéons)
 * - Aucun changement de formule métier
 */

import React, { useContext, useCallback, useEffect, useState } from 'react';
import { useSuccessionCalc } from './useSuccessionCalc';
import { exportSuccessionPptx } from '../../pptx/exports/successionExport';
import { exportAndDownloadSuccessionXlsx } from './successionXlsx';
import { useTheme } from '../../settings/ThemeProvider';
import { SessionGuardContext } from '../../App';
import { useFiscalContext } from '../../hooks/useFiscalContext';
import { ExportMenu } from '../../components/ExportMenu';
import { onResetEvent } from '../../utils/reset';
import type { LienParente } from '../../engine/succession';
import '../../components/simulator/SimulatorShell.css';
import '../../styles/premium-shared.css';
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
  const { loading: settingsLoading, fiscalContext } = useFiscalContext({ strict: true });
  const {
    form, result, setActifNet, addHeritier, removeHeritier,
    updateHeritier, distributeEqually, compute, reset, hasResult,
  } = useSuccessionCalc({ dmtgSettings: fiscalContext.dmtgSettings });

  const { pptxColors, cabinetLogo, logoPlacement } = useTheme();
  const { sessionExpired, canExport } = useContext(SessionGuardContext);
  const [exportLoading, setExportLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [hypothesesOpen, setHypothesesOpen] = useState(false);

  useEffect(() => {
    const off = onResetEvent?.(({ simId }: { simId?: string }) => {
      if (simId && simId !== 'succession') return;
      reset();
      setShowDetails(false);
      setHypothesesOpen(false);
    });
    return off || (() => {});
  }, [reset]);

  const handleExportPptx = useCallback(async () => {
    if (!result || !canExport) return;
    try {
      setExportLoading(true);
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
    } finally {
      setExportLoading(false);
    }
  }, [result, canExport, pptxColors, cabinetLogo, logoPlacement]);

  const handleExportXlsx = useCallback(async () => {
    if (!result || !canExport) return;
    try {
      setExportLoading(true);
      await exportAndDownloadSuccessionXlsx(
        {
          actifNetSuccession: form.actifNetSuccession,
          nbHeritiers: form.heritiers.length,
          heritiers: form.heritiers.map((h) => ({ lien: h.lien, partSuccession: h.partSuccession })),
        },
        result.result,
        pptxColors.c1,
      );
    } finally {
      setExportLoading(false);
    }
  }, [result, canExport, form, pptxColors]);

  const exportOptions = [
    {
      label: 'PowerPoint',
      onClick: handleExportPptx,
      disabled: !result,
      tooltip: !result ? 'Calculez d’abord les droits pour exporter.' : undefined,
    },
    {
      label: 'Excel',
      onClick: handleExportXlsx,
      disabled: !result,
      tooltip: !result ? 'Calculez d’abord les droits pour exporter.' : undefined,
    },
  ];

  if (settingsLoading) {
    return (
      <div className="sim-page sc-page" data-testid="succession-page">
        <div className="premium-header sc-header">
          <h1 className="premium-title">Simulateur succession</h1>
          <p className="premium-subtitle">Estimez les droits de mutation à titre gratuit.</p>
        </div>
        <div className="sc-settings-loading" data-testid="succession-settings-loading">
          Chargement des paramètres fiscaux…
        </div>
      </div>
    );
  }

  return (
    <div className="sim-page sc-page" data-testid="succession-page">
      <div className="premium-header sc-header">
        <h1 className="premium-title">Simulateur succession</h1>
        <div className="sc-header__subtitle-row">
          <p className="premium-subtitle">
            Estimez les droits de succession à partir de l&apos;actif net et de la répartition entre héritiers.
          </p>
          <div className="sim-header__actions">
            <ExportMenu options={exportOptions} loading={exportLoading} />
          </div>
        </div>
      </div>

      {sessionExpired && (
        <p className="sc-session-msg">
          Session expirée — reconnectez-vous pour exporter.
        </p>
      )}

      <div className="sc-grid">
        <div className="sc-left">
          <div className="premium-card sc-card sc-card--guide">
            <header className="sc-card__header">
              <h2 className="sc-card__title">Patrimoine transmis</h2>
              <p className="sc-card__subtitle">Actif net successoral pris en compte pour le calcul.</p>
            </header>
            <div className="sc-card__divider" />
            <div className="sc-field">
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

          <div className="premium-card sc-card">
            <header className="sc-card__header">
              <h2 className="sc-card__title">Héritiers</h2>
              <p className="sc-card__subtitle">Renseignez le lien de parenté et la part transmise.</p>
            </header>
            <div className="sc-card__divider" />

            <div className="sc-heirs-list">
              {form.heritiers.map((h) => (
                <div key={h.id} className="sc-heir-row">
                  <div className="sc-field">
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
                  <div className="sc-field">
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
                      className="sc-remove-btn"
                      onClick={() => removeHeritier(h.id)}
                      title="Supprimer cet héritier"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="sc-inline-actions">
              <button
                type="button"
                className="premium-btn sc-btn sc-btn--secondary"
                onClick={() => addHeritier('enfant')}
              >
                + Ajouter un héritier
              </button>
              <button
                type="button"
                className="premium-btn sc-btn sc-btn--secondary"
                onClick={distributeEqually}
                disabled={form.heritiers.length === 0 || form.actifNetSuccession <= 0}
              >
                Répartir également
              </button>
            </div>
          </div>

          <div className="sc-primary-actions">
            <button
              type="button"
              className="premium-btn sc-btn sc-btn--primary"
              onClick={compute}
              disabled={form.actifNetSuccession <= 0 || form.heritiers.length === 0}
            >
              Calculer les droits
            </button>
            <button
              type="button"
              className="premium-btn sc-btn sc-btn--secondary"
              onClick={reset}
            >
              Réinitialiser
            </button>
          </div>
        </div>

        <div className="sc-right">
          <div className="premium-card sc-summary-card">
            <h2 className="sc-summary-title">Synthèse</h2>
            <div className="sc-card__divider sc-card__divider--tight" />
            {hasResult && result ? (
              <div className="sc-kpis">
                <div className="sc-kpi">
                  <div className="sc-kpi__label">Actif net successoral</div>
                  <div className="sc-kpi__value">{fmt(result.result.actifNetSuccession)}</div>
                </div>
                <div className="sc-kpi">
                  <div className="sc-kpi__label">Total droits</div>
                  <div className="sc-kpi__value">{fmt(result.result.totalDroits)}</div>
                </div>
                <div className="sc-kpi">
                  <div className="sc-kpi__label">Taux moyen global</div>
                  <div className="sc-kpi__value">{fmtPct(result.result.tauxMoyenGlobal)}</div>
                </div>
              </div>
            ) : (
              <div className="sc-summary-placeholder">
                <div className="sc-summary-row">
                  <span>Actif saisi</span>
                  <strong>{fmt(form.actifNetSuccession)}</strong>
                </div>
                <div className="sc-summary-row">
                  <span>Nombre d&apos;héritiers</span>
                  <strong>{form.heritiers.length}</strong>
                </div>
                <p className="sc-summary-note">
                  Lancez le calcul pour afficher le détail des droits.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {hasResult && result && (
        <div className="premium-card sc-detail-card" data-testid="succession-detail-accordion">
          <div className="sc-detail-header">
            <h3 className="sc-detail-title">Détail du calcul</h3>
            <button
              type="button"
              className="sc-detail-toggle"
              aria-expanded={showDetails}
              onClick={() => setShowDetails((v) => !v)}
            >
              {showDetails ? 'Masquer' : 'Afficher'}
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`sc-chevron${showDetails ? ' is-open' : ''}`}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {showDetails && (
            <table className="premium-table sc-detail-table">
              <thead>
                <tr>
                  <th>Héritier</th>
                  <th className="align-right">Part brute</th>
                  <th className="align-right">Abattement</th>
                  <th className="align-right">Base imposable</th>
                  <th className="align-right">Droits</th>
                  <th className="align-right">Taux moyen</th>
                </tr>
              </thead>
              <tbody>
                {result.result.detailHeritiers.map((h, i) => (
                  <tr key={i}>
                    <td>{LIEN_OPTIONS.find((o) => o.value === h.lien)?.label ?? h.lien}</td>
                    <td className="align-right">{fmt(h.partBrute)}</td>
                    <td className="align-right">{fmt(h.abattement)}</td>
                    <td className="align-right">{fmt(h.baseImposable)}</td>
                    <td className="align-right value-cell">{fmt(h.droits)}</td>
                    <td className="align-right">{fmtPct(h.tauxMoyen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="sc-hypotheses">
        <button
          type="button"
          className="sc-hypotheses__toggle"
          onClick={() => setHypothesesOpen((v) => !v)}
          aria-expanded={hypothesesOpen}
          data-testid="succession-hypotheses-toggle"
        >
          <span className="sc-hypotheses__title">Hypothèses et limites</span>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`sc-hypotheses__chevron${hypothesesOpen ? ' is-open' : ''}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {hypothesesOpen && (
          <ul>
            <li>Barèmes DMTG et abattements appliqués depuis les paramètres de l&apos;application.</li>
            <li>Le calcul repose sur les parts de succession saisies pour chaque héritier.</li>
            <li>Les donations antérieures, libéralités complexes et avantages matrimoniaux ne sont pas encore intégrés dans ce module.</li>
            <li>Résultat indicatif, à confirmer par une analyse patrimoniale et notariale.</li>
          </ul>
        )}
      </div>
    </div>
  );
}
