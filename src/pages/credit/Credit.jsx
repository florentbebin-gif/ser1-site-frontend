/**
 * CreditV2.jsx — Orchestrateur du simulateur de crédit (Phase 1)
 *
 * Architecture modulaire inspirée de PlacementV2 :
 * - State centralisé        → utils/creditNormalizers.js
 * - Calculs                 → hooks/useCreditCalculations.js
 * - Composants UI           → components/Credit*.jsx
 * - Formatters              → utils/creditFormatters.js
 */

import React, { useState, useEffect, useCallback } from 'react';
import { onResetEvent, storageKeyFor } from '../../utils/reset.js';
import { useTheme } from '../../settings/ThemeProvider';
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
  // STATE
  // -------------------------------------------------------------------------
  const [state, setState] = useState(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [rawValues, setRawValues] = useState({});
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

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
  // CALCULS
  // -------------------------------------------------------------------------
  const calc = useCreditCalculations(state, state.startYM);

  // -------------------------------------------------------------------------
  // EXPORTS
  // -------------------------------------------------------------------------
  const { exportExcel, exportPowerPoint } = useCreditExports({
    state,
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
    return <div className="cv2-page">Chargement…</div>;
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
    <div className="cv2-page" data-testid="credit-page">
      {/* HEADER */}
      <CreditHeader
        viewMode={state.viewMode}
        onViewModeChange={(v) => setGlobal({ viewMode: v })}
        exportOptions={exportOptions}
        exportLoading={exportLoading}
      />

      {/* GRID : SAISIE (gauche) + SYNTHÈSE (droite) */}
      <div className="cv2-grid">
        {/* COLONNE GAUCHE */}
        <div>
          <CreditLoanTabs
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            hasPret2={!!state.pret2}
            hasPret3={!!state.pret3}
            onAddPret2={addPret2}
            onAddPret3={addPret3}
          />

          <div className="cv2-card">
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
            />
          </div>

          {/* LISSAGE (si prêts additionnels) */}
          {calc.hasPretsAdditionnels && (
            <div className="cv2-card">
              <div className="cv2-card__title">Options de lissage</div>
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

        {/* COLONNE DROITE */}
        <div>
          <CreditSummaryCard
            synthese={calc.synthese}
            isAnnual={isAnnual}
            lisserPret1={state.lisserPret1}
          />
        </div>
      </div>

      {/* TABLEAU PÉRIODES (si prêts multiples) */}
      <CreditPeriodsTable
        synthesePeriodes={calc.synthesePeriodes}
        hasPret3={!!state.pret3}
      />

      {/* ÉCHÉANCIER GLOBAL */}
      <CreditScheduleTable
        rows={calc.agrRows}
        startYM={state.startYM}
        isAnnual={isAnnual}
      />

      {/* DÉTAIL PAR PRÊT (si prêts multiples) */}
      {calc.hasPretsAdditionnels && (
        <>
          <CreditScheduleTable
            rows={calc.pret1Rows}
            startYM={state.startYM}
            isAnnual={isAnnual}
            title="Détail — Prêt 1"
          />
          {calc.pret2Rows.length > 0 && (
            <CreditScheduleTable
              rows={calc.pret2Rows.filter(r => r)}
              startYM={state.startYM}
              isAnnual={isAnnual}
              title="Détail — Prêt 2"
            />
          )}
          {calc.pret3Rows.length > 0 && (
            <CreditScheduleTable
              rows={calc.pret3Rows.filter(r => r)}
              startYM={state.startYM}
              isAnnual={isAnnual}
              title="Détail — Prêt 3"
            />
          )}
        </>
      )}

      {/* HYPOTHÈSES */}
      <div className="cv2-hypotheses">
        <div className="cv2-hypotheses__title">Hypothèses et limites</div>
        <ul>
          <li>Les résultats sont indicatifs et ne constituent pas une offre de prêt.</li>
          <li>Le calcul suppose un taux fixe sur toute la durée du prêt.</li>
          <li>L'assurance emprunteur est calculée selon le mode sélectionné (capital initial ou restant dû) pour chaque prêt.</li>
          <li>Les frais de dossier, de garantie et de notaire ne sont pas inclus dans ce simulateur.</li>
        </ul>
      </div>
    </div>
  );
}
