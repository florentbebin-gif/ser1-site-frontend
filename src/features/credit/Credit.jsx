/**
 * CreditV2.jsx — Orchestrateur du simulateur de crédit (Phase 1)
 *
 * Architecture modulaire inspirée du simulateur Placement :
 * - State centralisé        → utils/creditNormalizers.js
 * - Calculs                 → hooks/useCreditCalculations.js
 * - Composants UI           → components/Credit*.jsx
 * - Formatters              → utils/creditFormatters.js
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { onResetEvent, storageKeyFor } from '../../utils/reset.js';
import { useTheme } from '../../settings/ThemeProvider';
import { useUserMode } from '../../services/userModeService';
import { 
  DEFAULT_STATE, 
  normalizeLoadedState, 
  buildPersistedState,
  createNewPret,
  patchPret,
  initRawValues,
} from './utils/creditNormalizers.js';
import { useCreditCalculations } from './hooks/useCreditCalculations.js';
import { useCreditExports } from './hooks/useCreditExports.js';
import { CreditHeader } from './components/CreditHeader.jsx';
import { CreditLoanTabs } from './components/CreditLoanTabs.jsx';
import { CreditLoanForm } from './components/CreditLoanForm.jsx';
import { CreditSummaryCard } from './components/CreditSummaryCard.jsx';
import { CreditScheduleTable } from './components/CreditScheduleTable.jsx';
import { CreditPeriodsTable } from './components/CreditPeriodsTable.jsx';
import { Toggle } from './components/CreditInputs.jsx';
import './components/CreditV2.css';
import '../../styles/premium-shared.css';
import '../../components/simulator/SimulatorShell.css';

// ============================================================================
// HELPERS
// ============================================================================

function formatTauxRaw(value) {
  const num = Number(value) || 0;
  return num.toFixed(2).replace('.', ',');
}

function syncRawValues(setRawValues, pretKey, patch) {
  if (patch.taux !== undefined) {
    setRawValues(r => ({
      ...r,
      [pretKey]: { ...(r[pretKey] || {}), taux: formatTauxRaw(patch.taux) },
    }));
  }
  if (patch.tauxAssur !== undefined) {
    setRawValues(r => ({
      ...r,
      [pretKey]: { ...(r[pretKey] || {}), tauxAssur: formatTauxRaw(patch.tauxAssur) },
    }));
  }
  if (patch.quotite !== undefined) {
    setRawValues(r => ({
      ...r,
      [pretKey]: { ...(r[pretKey] || {}), quotite: String(patch.quotite) },
    }));
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CreditV2() {
  const { colors: themeColors, cabinetLogo, logoPlacement, pptxColors } = useTheme();

  // -------------------------------------------------------------------------
  // MODE UTILISATEUR
  // -------------------------------------------------------------------------
  const { mode, isLoading: modeLoading } = useUserMode();
  const isExpert = mode === 'expert';

  // -------------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------------
  const [state, setState] = useState(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [rawValues, setRawValues] = useState({});
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [hypothesesOpen, setHypothesesOpen] = useState(false);

  // Synchronise l'accordéon hypothèses avec le mode (une seule fois à la résolution du mode)
  const modeResolvedRef = useRef(false);
  useEffect(() => {
    if (!modeLoading && !modeResolvedRef.current) {
      modeResolvedRef.current = true;
      setHypothesesOpen(isExpert);
    }
  }, [modeLoading, isExpert]);

  const STORE_KEY = storageKeyFor('credit');

  // -------------------------------------------------------------------------
  // HYDRATATION & PERSISTENCE
  // -------------------------------------------------------------------------
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const normalized = normalizeLoadedState(parsed);
        setState(normalized);
        setRawValues(initRawValues(normalized));
      } else {
        setRawValues(initRawValues(DEFAULT_STATE));
      }
    } catch {
      setRawValues(initRawValues(DEFAULT_STATE));
    }
    setHydrated(true);
  }, [STORE_KEY]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(buildPersistedState(state)));
    } catch { /* noop */ }
  }, [hydrated, state, STORE_KEY]);

  // -------------------------------------------------------------------------
  // RESET
  // -------------------------------------------------------------------------
  useEffect(() => {
    const off = onResetEvent?.(({ simId }) => {
      if (simId && simId !== 'credit') return;
      const resetState = {
        ...DEFAULT_STATE,
        pret1: { ...DEFAULT_STATE.pret1, capital: 0, duree: 0, taux: 0, tauxAssur: 0, quotite: 100 },
        pret2: null,
        pret3: null,
      };
      setState(resetState);
      setRawValues(initRawValues(resetState));
      setActiveTab(0);
      try { sessionStorage.removeItem(STORE_KEY); } catch { /* noop */ }
    });
    return off || (() => {});
  }, [STORE_KEY]);

  // -------------------------------------------------------------------------
  // HELPERS DE MUTATION
  // -------------------------------------------------------------------------
  const setGlobal = useCallback((patch) => {
    setState(s => ({ ...s, ...patch }));
  }, []);

  const setPret1 = useCallback((patch) => {
    setState(s => {
      const next = { ...s, pret1: patchPret(s.pret1, patch) };
      // Sync global startYM and assurMode when pret1 changes them
      if (patch.startYM !== undefined) next.startYM = patch.startYM;
      if (patch.assurMode !== undefined) next.assurMode = patch.assurMode;
      if (patch.type !== undefined) next.creditType = patch.type;
      return next;
    });
    syncRawValues(setRawValues, 'pret1', patch);
  }, []);

  const setPret2 = useCallback((patch) => {
    setState(s => s.pret2 ? ({ ...s, pret2: patchPret(s.pret2, patch) }) : s);
    syncRawValues(setRawValues, 'pret2', patch);
  }, []);

  const setPret3 = useCallback((patch) => {
    setState(s => s.pret3 ? ({ ...s, pret3: patchPret(s.pret3, patch) }) : s);
    syncRawValues(setRawValues, 'pret3', patch);
  }, []);

  const addPret2 = useCallback(() => {
    if (state.pret2) return;
    const p = createNewPret({ startYM: state.startYM, type: state.creditType, assurMode: state.assurMode });
    setState(s => ({ ...s, pret2: p }));
    setRawValues(r => ({ ...r, pret2: { taux: formatTauxRaw(p.taux), tauxAssur: formatTauxRaw(p.tauxAssur), quotite: String(p.quotite) } }));
    setActiveTab(1);
  }, [state.startYM, state.creditType, state.assurMode, state.pret2]);

  const addPret3 = useCallback(() => {
    if (state.pret3 || !state.pret2) return;
    const p = createNewPret({ startYM: state.startYM, type: state.creditType, assurMode: state.assurMode });
    setState(s => ({ ...s, pret3: p }));
    setRawValues(r => ({ ...r, pret3: { taux: formatTauxRaw(p.taux), tauxAssur: formatTauxRaw(p.tauxAssur), quotite: String(p.quotite) } }));
    setActiveTab(2);
  }, [state.startYM, state.creditType, state.assurMode, state.pret2, state.pret3]);

  const removePret2 = useCallback(() => {
    setState(s => ({ ...s, pret2: null, pret3: null, lisserPret1: false }));
    setRawValues(({ pret2: _a, pret3: _b, ...rest }) => rest);
    if (activeTab >= 1) setActiveTab(0);
  }, [activeTab]);

  const removePret3 = useCallback(() => {
    setState(s => ({ ...s, pret3: null }));
    setRawValues(({ pret3: _a, ...rest }) => rest);
    if (activeTab === 2) setActiveTab(1);
  }, [activeTab]);

  // -------------------------------------------------------------------------
  // CALCULS (state dérivé pour le mode simplifié : assurance = 0)
  // -------------------------------------------------------------------------
  const stateForCalc = isExpert ? state : {
    ...state,
    pret1: { ...state.pret1, tauxAssur: 0 },
    pret2: state.pret2 ? { ...state.pret2, tauxAssur: 0 } : null,
    pret3: state.pret3 ? { ...state.pret3, tauxAssur: 0 } : null,
  };
  const calc = useCreditCalculations(stateForCalc, stateForCalc.startYM);

  // -------------------------------------------------------------------------
  // EXPORTS
  // -------------------------------------------------------------------------
  const { exportExcel, exportPowerPoint } = useCreditExports({
    state: stateForCalc,
    calc,
    themeColors,
    cabinetLogo,
    logoPlacement,
    pptxColors,
    setExportLoading,
  });

  const exportOptions = [
    { label: 'Excel', onClick: exportExcel },
    { label: 'PowerPoint', onClick: exportPowerPoint },
  ];

  // -------------------------------------------------------------------------
  // RENDU
  // -------------------------------------------------------------------------
  if (!hydrated) {
    return (
      <div className="sim-page cv2-skeleton-page" data-testid="credit-loading">
        <div className="cv2-skeleton cv2-skeleton--title" />
        <div className="cv2-skeleton cv2-skeleton--subtitle" />
        <div className="cv2-skeleton-grid">
          <div>
            <div className="cv2-skeleton cv2-skeleton--card" />
          </div>
          <div>
            <div className="cv2-skeleton cv2-skeleton--card-sm" />
          </div>
        </div>
      </div>
    );
  }

  const isAnnual = state.viewMode === 'annuel';

  // Lookup du formulaire actif
  // Mensualités hors assurance par prêt
  const mensuPret1 = calc.mensuBasePret1;
  const mensuPret2 = calc.pret2Rows[0]?.mensu || 0;
  const mensuPret3 = calc.pret3Rows[0]?.mensu || 0;

  const pretLookup = [
    { data: state.pret1, raw: rawValues.pret1, set: setPret1, remove: null, mensu: mensuPret1 },
    { data: state.pret2, raw: rawValues.pret2, set: setPret2, remove: removePret2, mensu: mensuPret2 },
    { data: state.pret3, raw: rawValues.pret3, set: setPret3, remove: removePret3, mensu: mensuPret3 },
  ];
  const activeLoan = pretLookup[activeTab];

  return (
    <div className="sim-page" data-testid="credit-page">
      {/* HEADER (sans toggle — déplacé dans la ligne de contrôles) */}
      <CreditHeader
        exportOptions={exportOptions}
        exportLoading={exportLoading}
      />

      {/* LIGNE DE CONTRÔLES : tabs (gauche, expert) + toggle Mensuel/Annuel (droite) */}
      <div className="cv2-mode-row">
        <Link
          to="/"
          className="cv2-mode-chip"
          data-testid="credit-mode-chip"
          title="Changer le mode depuis la page d'accueil"
        >
          {isExpert ? 'Mode expert' : 'Mode simplifié'}
        </Link>
      </div>

      <div className="cv2-controls-row">
        <div className="cv2-controls-row__left">
          {/* Tabs prêts : expert uniquement ou si prêts additionnels déjà créés */}
          <CreditLoanTabs
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            hasPret2={!!state.pret2}
            hasPret3={!!state.pret3}
            onAddPret2={addPret2}
            onAddPret3={addPret3}
            isExpert={isExpert}
          />
        </div>
        <div className="cv2-controls-row__right">
          <div className="cv2-pill-toggle" data-testid="credit-view-toggle">
            <button
              className={`cv2-pill-toggle__btn ${state.viewMode === 'mensuel' ? 'is-active' : ''}`}
              onClick={() => setGlobal({ viewMode: 'mensuel' })}
              data-testid="credit-view-mensuel"
            >
              Mensuel
            </button>
            <button
              className={`cv2-pill-toggle__btn ${state.viewMode === 'annuel' ? 'is-active' : ''}`}
              onClick={() => setGlobal({ viewMode: 'annuel' })}
              data-testid="credit-view-annuel"
            >
              Annuel
            </button>
          </div>
        </div>
      </div>

      {/* GRID : SAISIE (gauche) + SYNTHÈSE (droite) — alignés en haut */}
      <div className="cv2-grid">
        {/* COLONNE GAUCHE */}
        <div>
          <div className="premium-card">
            <div className="cv2-loan-card">
              <header className="cv2-loan-card__header">
                <h2 className="cv2-loan-card__title">Paramètres du prêt</h2>
                <p className="cv2-loan-card__subtitle">
                  Renseignez les données du financement pour estimer mensualités et coût global.
                </p>
              </header>
              <div className="cv2-loan-card__divider" />
              <div className="cv2-loan-card__body">
                <CreditLoanForm
                  pretNum={activeTab}
                  pretData={activeLoan.data}
                  rawValues={activeLoan.raw}
                  globalStartYM={state.startYM}
                  globalAssurMode={state.assurMode}
                  globalCreditType={state.creditType}
                  mensualiteHorsAssurance={activeLoan.mensu}
                  onPatch={activeLoan.set}
                  onRemove={activeLoan.remove}
                  formatTauxRaw={formatTauxRaw}
                  isExpert={isExpert}
                />
              </div>
            </div>
          </div>

          {/* Pas de lien discret ajout prêt en mode simplifié (item 5) */}

          {/* LISSAGE (si prêts additionnels) */}
          {calc.hasPretsAdditionnels && (
            <div className="premium-card">
              <div className="sim-section-title">Options de lissage</div>
              <div className="cv2-lissage">
                <Toggle
                  checked={state.lisserPret1}
                  onChange={(v) => setGlobal({ lisserPret1: v })}
                  label="Lisser le prêt 1"
                  disabled={calc.anyInfine}
                />
                {state.lisserPret1 && (
                  <div className="cv2-lissage__pills">
                    <button
                      className={`cv2-lissage__pill ${state.lissageMode === 'mensu' ? 'is-active' : ''}`}
                      onClick={() => setGlobal({ lissageMode: 'mensu' })}
                    >
                      Mensualité constante
                    </button>
                    <button
                      className={`cv2-lissage__pill ${state.lissageMode === 'duree' ? 'is-active' : ''}`}
                      onClick={() => setGlobal({ lissageMode: 'duree' })}
                    >
                      Durée constante
                    </button>
                  </div>
                )}
              </div>
              {calc.anyInfine && (
                <p className="cv2-lissage__hint">
                  Le lissage est indisponible si un prêt est en In fine.
                </p>
              )}
            </div>
          )}
        </div>

        {/* COLONNE DROITE — synthèse alignée avec le formulaire */}
        <div>
          <CreditSummaryCard
            synthese={calc.synthese}
            isAnnual={isAnnual}
            lisserPret1={state.lisserPret1}
            isExpert={isExpert}
          />
        </div>
      </div>

      {/* TABLEAU PÉRIODES (si prêts multiples) */}
      <CreditPeriodsTable
        synthesePeriodes={calc.synthesePeriodes}
        hasPret3={!!state.pret3}
      />

      {/* ÉCHÉANCIER GLOBAL — toujours fermé par défaut (item 3) */}
      <CreditScheduleTable
        rows={calc.agrRows}
        startYM={state.startYM}
        isAnnual={isAnnual}
        defaultCollapsed={true}
        hideInsurance={!isExpert}
      />

      {/* DÉTAIL PAR PRÊT (si prêts multiples) */}
      {calc.hasPretsAdditionnels && (
        <>
          <CreditScheduleTable
            rows={calc.pret1Rows}
            startYM={state.startYM}
            isAnnual={isAnnual}
            title="Détail — Prêt 1"
            defaultCollapsed={true}
            hideInsurance={!isExpert}
          />
          {calc.pret2Rows.length > 0 && (
            <CreditScheduleTable
              rows={calc.pret2Rows.filter(r => r)}
              startYM={state.startYM}
              isAnnual={isAnnual}
              title="Détail — Prêt 2"
              defaultCollapsed={true}
              hideInsurance={!isExpert}
            />
          )}
          {calc.pret3Rows.length > 0 && (
            <CreditScheduleTable
              rows={calc.pret3Rows.filter(r => r)}
              startYM={state.startYM}
              isAnnual={isAnnual}
              title="Détail — Prêt 3"
              defaultCollapsed={true}
              hideInsurance={!isExpert}
            />
          )}
        </>
      )}

      {/* HYPOTHÈSES — accordéon (ouvert par défaut en expert, fermé en simplifié) */}
      <div className="cv2-hypotheses">
        <button
          type="button"
          className="cv2-hypotheses__toggle"
          onClick={() => setHypothesesOpen(o => !o)}
          aria-expanded={hypothesesOpen}
          data-testid="credit-hypotheses-toggle"
        >
          <span className="cv2-hypotheses__title">Hypothèses et limites</span>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`cv2-hypotheses__chevron${hypothesesOpen ? ' is-open' : ''}`}
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {hypothesesOpen && (
          <ul>
            <li>Les résultats sont indicatifs et ne constituent pas une offre de prêt.</li>
            <li>Le calcul suppose un taux fixe sur toute la durée du prêt.</li>
            <li>L'assurance emprunteur est calculée selon le mode sélectionné (capital initial ou restant dû) pour chaque prêt.</li>
            <li>Les frais de dossier, de garantie et de notaire ne sont pas inclus dans ce simulateur.</li>
          </ul>
        )}
      </div>
    </div>
  );
}
