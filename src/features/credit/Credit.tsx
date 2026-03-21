/**
 * Credit.tsx - Orchestrateur du simulateur de crédit
 *
 * Architecture modulaire inspirée du simulateur Placement :
 * - State centralisé        -> utils/creditNormalizers
 * - Calculs                 -> hooks/useCreditCalculations
 * - Composants UI           -> components/Credit*
 * - Formatters              -> utils/creditFormatters
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { onResetEvent, storageKeyFor } from '../../utils/reset';
import { useTheme } from '../../settings/ThemeProvider';
import { useUserMode } from '../../settings/userMode';
import {
  DEFAULT_STATE,
  normalizeLoadedState, 
  buildPersistedState,
  createNewPret,
  patchPret,
  initRawValues,
} from './utils/creditNormalizers';
import { useCreditCalculations } from './hooks/useCreditCalculations';
import { useCreditExports } from './hooks/useCreditExports';
import { CreditHeader } from './components/CreditHeader';
import { CreditControlsRow } from './components/CreditControlsRow';
import { CreditHypotheses } from './components/CreditHypotheses';
import { CreditLoanInputPanel } from './components/CreditLoanInputPanel';
import { CreditSchedulePanels } from './components/CreditSchedulePanels';
import { CreditSummarySidebar } from './components/CreditSummarySidebar';
import type {
  CreditExportOption,
  CreditLoan,
  CreditLocalMode,
  CreditRawLoanValues,
  CreditRawValues,
  CreditScheduleRow,
  CreditShiftedScheduleRow,
  CreditState,
  CreditSynthesis,
} from './types';
import './components/CreditV2.css';
import '../../styles/premium-shared.css';
import '../../components/simulator/SimulatorShell.css';

// ============================================================================
// HELPERS
// ============================================================================

type PretKey = 'pret1' | 'pret2' | 'pret3';

type ResetDetail = {
  simId?: string;
};

type PretLookupEntry = {
  data: CreditLoan | null;
  raw?: CreditRawLoanValues;
  set: (_patch: Partial<CreditLoan>) => void;
};

function isDefinedRow(row: CreditShiftedScheduleRow): row is CreditScheduleRow {
  return row !== null;
}

function formatTauxRaw(value: number | null | undefined): string {
  const num = Number(value) || 0;
  return num.toFixed(2).replace('.', ',');
}

function syncRawValues(
  setRawValues: Dispatch<SetStateAction<CreditRawValues>>,
  pretKey: PretKey,
  patch: Partial<CreditLoan>,
): void {
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
  // Override local du mode (sans modifier le mode global de l'app)
  const [localMode, setLocalMode] = useState<CreditLocalMode>(null);
  const isExpert = (localMode ?? mode) === 'expert';
  const toggleMode = () => setLocalMode(isExpert ? 'simplifie' : 'expert');

  // -------------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------------
  const [state, setState] = useState<CreditState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [rawValues, setRawValues] = useState<CreditRawValues>({});
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [hypothesesOpen, setHypothesesOpen] = useState(false);

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
    const off = onResetEvent?.(({ simId }: ResetDetail) => {
      if (simId && simId !== 'credit') return;
      const resetState: CreditState = {
        ...DEFAULT_STATE,
        pret1: null,
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
  const setGlobal = useCallback((patch: Partial<CreditState>) => {
    setState(s => ({ ...s, ...patch }));
  }, []);

  const setPret1 = useCallback((patch: Partial<CreditLoan>) => {
    setState(s => {
      if (!s.pret1) return s;
      const next = { ...s, pret1: patchPret(s.pret1, patch) };
      // Sync global startYM and assurMode when pret1 changes them
      if (patch.startYM != null) next.startYM = patch.startYM;
      if (patch.assurMode !== undefined) next.assurMode = patch.assurMode;
      if (patch.type !== undefined) next.creditType = patch.type;
      return next;
    });
    syncRawValues(setRawValues, 'pret1', patch);
  }, []);

  const setPret2 = useCallback((patch: Partial<CreditLoan>) => {
    setState(s => s.pret2 ? ({ ...s, pret2: patchPret(s.pret2, patch) }) : s);
    syncRawValues(setRawValues, 'pret2', patch);
  }, []);

  const setPret3 = useCallback((patch: Partial<CreditLoan>) => {
    setState(s => s.pret3 ? ({ ...s, pret3: patchPret(s.pret3, patch) }) : s);
    syncRawValues(setRawValues, 'pret3', patch);
  }, []);

  const addPret1 = useCallback(() => {
    if (state.pret1) return;
    const p = createNewPret({ startYM: state.startYM, type: state.creditType, assurMode: state.assurMode });
    setState(s => ({ ...s, pret1: p }));
    setRawValues(r => ({ ...r, pret1: { taux: formatTauxRaw(p.taux), tauxAssur: formatTauxRaw(p.tauxAssur), quotite: String(p.quotite) } }));
    setActiveTab(0);
  }, [state.startYM, state.creditType, state.assurMode, state.pret1]);

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
    setRawValues(({ pret2: _a, pret3: _b, ...rest }) => ({ ...rest }));
    if (activeTab >= 1) setActiveTab(0);
  }, [activeTab]);

  const removePret3 = useCallback(() => {
    setState(s => ({ ...s, pret3: null }));
    setRawValues(({ pret3: _a, ...rest }) => ({ ...rest }));
    if (activeTab === 2) setActiveTab(1);
  }, [activeTab]);

  // -------------------------------------------------------------------------
  // POINT 5 — simplifié : supprimer pret2/pret3 résiduels (switch expert→simplifié)
  // Guard: attendre que le mode soit résolu (modeLoading=false) avant d'agir,
  // sinon on efface pret2/3 pendant le temps de chargement alors que isExpert=false
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!hydrated || modeLoading || isExpert) return;
    if (state.pret2 || state.pret3) {
      setState(s => ({ ...s, pret2: null, pret3: null, lisserPret1: false }));
      setRawValues(({ pret2: _a, pret3: _b, ...rest }) => ({ ...rest }));
      if (activeTab >= 1) setActiveTab(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, modeLoading, isExpert]);

  // -------------------------------------------------------------------------
  // CALCULS (state dérivé pour le mode simplifié : assurance = 0, pret2/3 ignorés)
  // -------------------------------------------------------------------------
  const stateForCalc: CreditState = isExpert ? state : {
    ...state,
    pret1: state.pret1 ? { ...state.pret1, tauxAssur: 0 } : null,
    pret2: null, /* point 5 — jamais de pret2/3 en simplifié */
    pret3: null,
  };
  const calc = useCreditCalculations(stateForCalc, stateForCalc.startYM);

  // -------------------------------------------------------------------------
  // SYNTHÈSE PAR PRÊT (point 4 PR2 — card s'actualise par tab actif)
  // -------------------------------------------------------------------------
  const perLoanSyntheses = useMemo(() => {
    const make = (
      rows: Array<CreditScheduleRow | null>,
      durationDiff: number = 0,
    ): CreditSynthesis | null => {
      if (!rows?.length) return null;
      const validRows = rows.filter(isDefinedRow);
      if (!validRows.length) return null;
      const totalInterets = validRows.reduce((s, r) => s + (r.interet || 0), 0);
      const totalAssurance = validRows.reduce((s, r) => s + (r.assurance || 0), 0);
      const capitalEmprunte = validRows.reduce((s, r) => s + (r.amort || 0), 0);
      return {
        mensualiteTotaleM1: validRows[0].mensu || 0,
        primeAssMensuelle: validRows[0].assurance || 0,
        totalInterets,
        totalAssurance,
        coutTotalCredit: totalInterets + totalAssurance,
        capitalEmprunte,
        diffDureesMois: durationDiff,
      };
    };
    return [
      make(calc.pret1Rows, calc.diffDureesMois ?? 0),
      make(calc.pret2Rows),
      make(calc.pret3Rows),
    ];
  }, [calc.pret1Rows, calc.pret2Rows, calc.pret3Rows, calc.diffDureesMois]);

  // Coût ou économie du lissage sur prêt 1 (intérêts lissés - intérêts base)
  const lissageCoutDelta = useMemo(() => {
    if (!state.lisserPret1 || !calc.hasPretsAdditionnels) return 0;
    if (!calc.mensuBasePret1 || !calc.dureeBaseMois) return 0;
    const lissedInterets = (calc.pret1Rows || [])
      .filter(r => r)
      .reduce((s, r) => s + (r.interet || 0), 0);
    const baseInterets = calc.mensuBasePret1 * calc.dureeBaseMois - (state.pret1?.capital || 0);
    return Math.round(lissedInterets - baseInterets);
  }, [calc.pret1Rows, calc.mensuBasePret1, calc.dureeBaseMois, state.pret1?.capital, state.lisserPret1, calc.hasPretsAdditionnels]);

  const activeSynthese = (isExpert && calc.hasPretsAdditionnels)
    ? (perLoanSyntheses[activeTab] || calc.synthese)
    : calc.synthese;

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

  const exportOptions: CreditExportOption[] = [
    { label: 'PowerPoint', onClick: exportPowerPoint },
    { label: 'Excel', onClick: exportExcel },
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

  const pretLookup: PretLookupEntry[] = [
    { data: state.pret1, raw: rawValues.pret1, set: setPret1 },
    { data: state.pret2, raw: rawValues.pret2, set: setPret2 },
    { data: state.pret3, raw: rawValues.pret3, set: setPret3 },
  ];
  const activeLoan = pretLookup[activeTab] || pretLookup[0];

  return (
    <div className="sim-page cv2-page" data-testid="credit-page">
      {/* HEADER (sans toggle — déplacé dans la ligne de contrôles) */}
      <CreditHeader
        exportOptions={exportOptions}
        exportLoading={exportLoading}
        isExpert={isExpert}
        onToggleMode={toggleMode}
      />

      <CreditControlsRow
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        hasPret1={!!state.pret1}
        hasPret2={!!state.pret2}
        hasPret3={!!state.pret3}
        onAddPret1={addPret1}
        onAddPret2={addPret2}
        onAddPret3={addPret3}
        onRemovePret2={removePret2}
        onRemovePret3={removePret3}
        isExpert={isExpert}
        viewMode={state.viewMode}
        onChangeViewMode={(viewMode) => setGlobal({ viewMode })}
      />

      {state.pret1 && (
      <div className={`cv2-grid${!isExpert ? ' cv2-grid--simple' : ''}`}>
        <CreditLoanInputPanel
          activeTab={activeTab}
          activeLoan={activeLoan}
          state={state}
          isExpert={isExpert}
          calc={calc}
          setGlobal={setGlobal}
          formatTauxRaw={formatTauxRaw}
        />

        <CreditSummarySidebar
          activeSynthese={activeSynthese}
          isAnnual={isAnnual}
          isExpert={isExpert}
          activeTab={activeTab}
          lisserPret1={state.lisserPret1}
          lissageCoutDelta={lissageCoutDelta}
          calc={calc}
        />
      </div>
      )}

      {state.pret1 && (
      <CreditSchedulePanels
        calc={calc}
        startYM={state.startYM}
        isAnnual={isAnnual}
        isExpert={isExpert}
      />
      )}

      <CreditHypotheses
        hypothesesOpen={hypothesesOpen}
        onToggle={() => setHypothesesOpen((open) => !open)}
      />
    </div>
  );
}
