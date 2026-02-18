import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePlacementSettings } from '@/hooks/usePlacementSettings.js';
import { simulateComplete, compareProducts } from '@/engine/placementEngine.js';
import { normalizeVersementConfig } from '@/utils/versementConfig.js';
import { onResetEvent, storageKeyFor } from '@/utils/reset.js';
import { PLACEMENT_SAVE_EVENT, PLACEMENT_LOAD_EVENT } from '@/utils/placementEvents.js';
import { savePlacementState, loadPlacementStateFromFile } from '@/utils/placementPersistence.js';
import { toEngineProduct } from '../adapters/toEngineProduct.js';
import {
  DEFAULT_STATE,
  DEFAULT_DMTG_RATE,
  normalizeLoadedState,
  buildPersistedState,
  getRendementLiquidation,
  buildDmtgOptions,
  buildCustomDmtgOption,
  withReinvestCumul,
} from '../legacy/normalizers.js';
import { exportPlacementExcel } from '../legacy/placementExcelExport.js';
import { getRelevantColumnsEpargne, getBaseColumnsForProduct } from '../legacy/tableHelpers.jsx';

export function usePlacementSimulatorController() {
  const storeKey = storageKeyFor('placement');
  const { fiscalParams, loading, error, tmiOptions, taxSettings, psSettings } = usePlacementSettings();

  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState(DEFAULT_STATE);
  const [modalOpen, setModalOpen] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);

  const dmtgScale = taxSettings?.dmtg?.scale;
  const dmtgOptions = useMemo(() => buildDmtgOptions(dmtgScale), [dmtgScale]);
  const dmtgDefaultRate = dmtgOptions[0]?.value ?? DEFAULT_DMTG_RATE;

  const dmtgSelectOptions = useMemo(() => {
    const current = state.transmission.dmtgTaux;
    if (current == null) return dmtgOptions;
    const exists = dmtgOptions.some((option) => option.value === current);
    if (exists) return dmtgOptions;
    return [...dmtgOptions, buildCustomDmtgOption(current)];
  }, [dmtgOptions, state.transmission.dmtgTaux]);

  const selectedDmtgOption = useMemo(
    () => dmtgSelectOptions.find((opt) => opt.value === state.transmission.dmtgTaux),
    [dmtgSelectOptions, state.transmission.dmtgTaux]
  );

  const selectedDmtgTrancheWidth = useMemo(() => {
    if (!selectedDmtgOption) return null;
    const from = typeof selectedDmtgOption.rangeFrom === 'number' ? selectedDmtgOption.rangeFrom : 0;
    const to = typeof selectedDmtgOption.rangeTo === 'number' ? selectedDmtgOption.rangeTo : null;
    if (to == null) return null;
    const width = to - from;
    return width > 0 ? width : null;
  }, [selectedDmtgOption]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storeKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setState({ ...DEFAULT_STATE, ...parsed });
        }
      }
    } catch {}
    setHydrated(true);
  }, [storeKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(storeKey, JSON.stringify(state));
    } catch {}
  }, [hydrated, state, storeKey]);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof dmtgDefaultRate !== 'number') return;
    setState((prev) => {
      if (prev.transmission?.dmtgTaux == null) {
        return {
          ...prev,
          transmission: { ...prev.transmission, dmtgTaux: dmtgDefaultRate },
        };
      }
      return prev;
    });
  }, [hydrated, dmtgDefaultRate]);

  const resetSimulation = useCallback(() => {
    setState(DEFAULT_STATE);
    try {
      sessionStorage.removeItem(storeKey);
    } catch {}
  }, [storeKey]);

  useEffect(() => {
    const off = onResetEvent?.(({ simId }) => {
      if (simId && simId !== 'placement') return;
      resetSimulation();
    });
    return off || (() => {});
  }, [resetSimulation]);

  const handleSavePlacement = useCallback(async () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    try {
      const result = await savePlacementState(buildPersistedState(state));
      if (result?.cancelled) return;
      if (result?.success) {
        window.alert(`Simulation enregistrée (${result.filename ?? 'fichier'}).`);
      } else {
        window.alert(result?.message || 'Impossible de sauvegarder la simulation.');
      }
    } finally {
      setActionInProgress(false);
    }
  }, [actionInProgress, state]);

  const handleLoadPlacement = useCallback(async () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    try {
      const result = await loadPlacementStateFromFile();
      if (result?.cancelled) return;
      if (result?.success && result.data) {
        const nextState = normalizeLoadedState(result.data);
        setState(nextState);
        window.alert(`Simulation chargée (${result.filename ?? 'fichier'}).`);
      } else {
        window.alert(result?.message || 'Impossible de charger ce fichier.');
      }
    } finally {
      setActionInProgress(false);
    }
  }, [actionInProgress]);

  useEffect(() => {
    const saveListener = () => handleSavePlacement();
    const loadListener = () => handleLoadPlacement();
    window.addEventListener(PLACEMENT_SAVE_EVENT, saveListener);
    window.addEventListener(PLACEMENT_LOAD_EVENT, loadListener);
    return () => {
      window.removeEventListener(PLACEMENT_SAVE_EVENT, saveListener);
      window.removeEventListener(PLACEMENT_LOAD_EVENT, loadListener);
    };
  }, [handleSavePlacement, handleLoadPlacement]);

  const results = useMemo(() => {
    if (!hydrated || loading || error) return null;

    const fpWithDmtg = { ...fiscalParams, dmtgTauxChoisi: state.transmission.dmtgTaux };
    const engineProduct1 = toEngineProduct(state.products[0]);
    const engineProduct2 = toEngineProduct(state.products[1]);

    const liquidationParams1 = {
      ...state.liquidation,
      rendement: getRendementLiquidation(state.products[0]) ?? undefined,
    };
    const liquidationParams2 = {
      ...state.liquidation,
      rendement: getRendementLiquidation(state.products[1]) ?? undefined,
    };

    const result1 = simulateComplete(
      engineProduct1,
      state.client,
      liquidationParams1,
      { ...state.transmission, agePremierVersement: state.client.ageActuel },
      fpWithDmtg
    );

    const result2 = simulateComplete(
      engineProduct2,
      state.client,
      liquidationParams2,
      { ...state.transmission, agePremierVersement: state.client.ageActuel },
      fpWithDmtg
    );

    return compareProducts(result1, result2);
  }, [state, fiscalParams, loading, hydrated, error]);

  const setClient = (patch) => setState((s) => ({ ...s, client: { ...s.client, ...patch } }));
  const setProduct = (index, patch) =>
    setState((s) => ({
      ...s,
      products: s.products.map((p, k) => (k === index ? { ...p, ...patch } : p)),
    }));
  const setLiquidation = (patch) => setState((s) => ({ ...s, liquidation: { ...s.liquidation, ...patch } }));
  const setTransmission = (patch) => setState((s) => ({ ...s, transmission: { ...s.transmission, ...patch } }));
  const setStep = (step) => setState((s) => ({ ...s, step }));

  const setVersementConfig = (productIndex, config) => {
    const normalized = normalizeVersementConfig(config);
    setState((s) => ({
      ...s,
      products: s.products.map((p, idx) => (idx === productIndex ? { ...p, versementConfig: normalized } : p)),
    }));
  };

  const updateProductOption = (productIndex, path, value) => {
    setState((prev) => {
      const nextState = { ...prev };
      const pathParts = path.split('.');
      let current = nextState.products[productIndex];
      for (let i = 0; i < pathParts.length - 1; i += 1) {
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = value;
      return nextState;
    });
  };

  const exportExcel = useCallback(async () => {
    setExportLoading(true);
    try {
      await exportPlacementExcel(state, results);
    } catch (errorExport) {
      console.error('[ExcelExport] Export failed', {
        err: errorExport,
        message: errorExport?.message,
        stack: errorExport?.stack,
      });
      alert('Impossible de générer le fichier Excel.');
    } finally {
      setExportLoading(false);
    }
  }, [state, results]);

  const exportHandlers = {
    exportExcel,
  };

  const { produit1, produit2 } = results || { produit1: null, produit2: null, deltas: {} };
  const detailRows1 = produit1 ? withReinvestCumul(produit1.epargne.rows) : [];
  const detailRows2 = produit2 ? withReinvestCumul(produit2.epargne.rows) : [];
  const columnsProduit1 = getRelevantColumnsEpargne(detailRows1, getBaseColumnsForProduct(produit1), showAllColumns);
  const columnsProduit2 = getRelevantColumnsEpargne(detailRows2, getBaseColumnsForProduct(produit2), showAllColumns);

  const handlers = {
    setClient,
    setProduct,
    setLiquidation,
    setTransmission,
    setStep,
    setVersementConfig,
    updateProductOption,
    setModalOpen,
    setShowAllColumns,
    handleSavePlacement,
    handleLoadPlacement,
    resetSimulation,
  };

  const resultsDerived = {
    results,
    produit1,
    produit2,
    detailRows1,
    detailRows2,
    columnsProduit1,
    columnsProduit2,
    dmtgSelectOptions,
    selectedDmtgTrancheWidth,
    tmiOptions,
    psSettings,
  };

  const uiFlags = {
    loading,
    error,
    hydrated,
    modalOpen,
    showAllColumns,
    actionInProgress,
    exportLoading,
  };

  return {
    state,
    handlers,
    resultsDerived,
    exportHandlers,
    uiFlags,
  };
}
