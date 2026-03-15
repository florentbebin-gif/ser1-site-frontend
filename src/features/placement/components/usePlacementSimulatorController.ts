import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useTheme } from '@/settings/ThemeProvider';
import { usePlacementSettings, type UsePlacementSettingsResult } from '@/hooks/usePlacementSettings';
import { useFiscalContext } from '@/hooks/useFiscalContext';
import { simulateComplete, compareProducts } from '@/engine/placement';
import type { CompareResult } from '@/engine/placement/types';
import { DEFAULT_INITIAL, DEFAULT_ANNUEL, DEFAULT_DISTRIBUTION, normalizeVersementConfig } from '@/engine/placement/versementConfig';
import type { VersementConfig, VersementConfigInput } from '@/engine/placement/versementConfig';
import { onResetEvent, storageKeyFor } from '@/utils/reset';
import { savePlacementState, loadPlacementStateFromFile } from '../utils/placementPersistence';
import { toEngineProduct } from '../adapters/toEngineProduct';
import {
  DEFAULT_STATE,
  DEFAULT_DMTG_RATE,
  normalizeLoadedState,
  buildPersistedState,
  buildPlacementStateForMode,
  getRendementLiquidation,
  buildDmtgOptions,
  buildCustomDmtgOption,
  withReinvestCumul,
  type DmtgOption,
  type EpargneRowWithReinvest,
  type PlacementClient,
  type PlacementLiquidationState,
  type PlacementProductDraft,
  type PlacementSimulatorState,
  type PlacementStep,
  type PlacementTransmissionState,
} from '../utils/normalizers';
import { exportPlacementExcel } from '../export/placementExcelExport';
import { getRelevantColumnsEpargne, getBaseColumnsForProduct } from '../utils/tableHelpers';

const PLACEMENT_SAVE_EVENT = 'ser1:placement:save';
const PLACEMENT_LOAD_EVENT = 'ser1:placement:load';

export type PlacementCompareProduct = CompareResult['produit1'];

export interface PlacementSimulatorHandlers {
  setClient: (_patch: Partial<PlacementClient>) => void;
  setProduct: (_index: number, _patch: Partial<PlacementProductDraft>) => void;
  setLiquidation: (_patch: Partial<PlacementLiquidationState>) => void;
  setTransmission: (_patch: Partial<PlacementTransmissionState>) => void;
  setStep: (_step: PlacementStep) => void;
  setVersementConfig: (
    _productIndex: number,
    _config: VersementConfig | VersementConfigInput | undefined,
  ) => void;
  updateProductOption: (
    _productIndex: number,
    _path: 'liquidation.optionBaremeIR',
    _value: boolean,
  ) => void;
  setModalOpen: Dispatch<SetStateAction<number | null>>;
  setShowAllColumns: Dispatch<SetStateAction<boolean>>;
  handleSavePlacement: () => Promise<void>;
  handleLoadPlacement: () => Promise<void>;
  resetSimulation: () => void;
}

export interface PlacementSimulatorResultsDerived {
  results: CompareResult | null;
  produit1: PlacementCompareProduct | null;
  produit2: PlacementCompareProduct | null;
  detailRows1: EpargneRowWithReinvest[];
  detailRows2: EpargneRowWithReinvest[];
  columnsProduit1: string[];
  columnsProduit2: string[];
  dmtgSelectOptions: DmtgOption[];
  selectedDmtgTrancheWidth: number | null;
  tmiOptions: UsePlacementSettingsResult['tmiOptions'];
  psSettings: UsePlacementSettingsResult['psSettings'];
}

export interface PlacementSimulatorExportHandlers {
  exportExcel: () => Promise<void>;
}

export interface PlacementSimulatorUiFlags {
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  modalOpen: number | null;
  showAllColumns: boolean;
  actionInProgress: boolean;
  exportLoading: boolean;
}

export function usePlacementSimulatorController(isExpert: boolean) {
  const storeKey = storageKeyFor('placement');
  const { fiscalParams, loading, error, tmiOptions, psSettings } = usePlacementSettings();
  const { fiscalContext } = useFiscalContext({ strict: false });
  const { pptxColors } = useTheme();

  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState<PlacementSimulatorState>(DEFAULT_STATE);
  const [modalOpen, setModalOpen] = useState<number | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);

  const dmtgScale = fiscalContext?.dmtgScaleLigneDirecte;
  const dmtgOptions = useMemo(() => buildDmtgOptions(dmtgScale), [dmtgScale]);
  const dmtgDefaultRate = dmtgOptions[0]?.value ?? DEFAULT_DMTG_RATE;

  const dmtgSelectOptions = useMemo(() => {
    const current = state.transmission.dmtgTaux;
    if (current == null) return dmtgOptions;
    const exists = dmtgOptions.some((option: { value: number }) => option.value === current);
    if (exists) return dmtgOptions;
    return [...dmtgOptions, buildCustomDmtgOption(current)];
  }, [dmtgOptions, state.transmission.dmtgTaux]);

  const selectedDmtgOption = useMemo(
    () => dmtgSelectOptions.find((opt: { value: number }) => opt.value === state.transmission.dmtgTaux),
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
          setState(normalizeLoadedState(parsed));
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
        } as unknown as typeof prev;
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
    const off = onResetEvent?.(({ simId }: { simId?: string }) => {
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

  const results = useMemo<CompareResult | null>(() => {
    if (!hydrated || loading || error) return null;

    const stateForCalc = buildPlacementStateForMode(state, isExpert);
    const fpWithDmtg = { ...fiscalParams, dmtgTauxChoisi: stateForCalc.transmission.dmtgTaux };
    const engineProduct1 = toEngineProduct(stateForCalc.products[0]);
    const engineProduct2 = toEngineProduct(stateForCalc.products[1]);

    const liquidationParams1 = {
      ...stateForCalc.liquidation,
      rendement: getRendementLiquidation(stateForCalc.products[0]) ?? undefined,
      optionBaremeIR: stateForCalc.products[0].liquidation?.optionBaremeIR ?? false,
    };
    const liquidationParams2 = {
      ...stateForCalc.liquidation,
      rendement: getRendementLiquidation(stateForCalc.products[1]) ?? undefined,
      optionBaremeIR: stateForCalc.products[1].liquidation?.optionBaremeIR ?? false,
    };

    const result1 = simulateComplete(
      engineProduct1,
      stateForCalc.client,
      liquidationParams1,
      { ...stateForCalc.transmission, agePremierVersement: stateForCalc.client.ageActuel },
      fpWithDmtg
    );

    const result2 = simulateComplete(
      engineProduct2,
      stateForCalc.client,
      liquidationParams2,
      { ...stateForCalc.transmission, agePremierVersement: stateForCalc.client.ageActuel },
      fpWithDmtg
    );

    return compareProducts(result1, result2);
  }, [state, isExpert, fiscalParams, loading, hydrated, error]);

  const setClient = (patch: Partial<PlacementClient>) =>
    setState((s) => {
      const next = { ...s, client: { ...s.client, ...patch } };
      if ('ageActuel' in patch && typeof patch.ageActuel === 'number') {
        const duree = Math.max(1, 64 - patch.ageActuel);
        next.products = next.products.map((p) => ({ ...p, dureeEpargne: duree }));
      }
      if (patch.situation === 'single' && s.transmission.beneficiaryType === 'conjoint') {
        next.transmission = { ...next.transmission, beneficiaryType: 'enfants' };
      }
      return next;
    });
  const setProduct = (index: number, patch: Partial<PlacementProductDraft>) =>
    setState((s) => {
      const updatedPatch = { ...patch };
      if (patch.envelope === 'PER_BANCAIRE_UI') {
        updatedPatch.envelope = 'PER';
        updatedPatch.perBancaire = true;
      } else if ('envelope' in patch) {
        updatedPatch.perBancaire = false;
      }
      if (updatedPatch.envelope === 'SCPI') {
        const currentVc = s.products[index].versementConfig;
        updatedPatch.versementConfig = {
          ...currentVc,
          initial: { ...currentVc.initial, fraisEntree: 0, pctCapitalisation: 0, pctDistribution: 100 },
          annuel: { ...currentVc.annuel, fraisEntree: 0, pctCapitalisation: 0, pctDistribution: 100 },
          ponctuels: (currentVc.ponctuels || []).map((p) => ({ ...p, pctCapitalisation: 0, pctDistribution: 100 })),
          distribution: { ...currentVc.distribution, rendementAnnuel: 0 },
        };
      } else if ('envelope' in updatedPatch && s.products[index].envelope === 'SCPI') {
        const currentVc = s.products[index].versementConfig;
        updatedPatch.versementConfig = {
          ...currentVc,
          initial: { ...currentVc.initial, fraisEntree: DEFAULT_INITIAL.fraisEntree, pctCapitalisation: 100, pctDistribution: 0 },
          annuel: { ...currentVc.annuel, fraisEntree: DEFAULT_ANNUEL.fraisEntree, pctCapitalisation: 100, pctDistribution: 0 },
          ponctuels: (currentVc.ponctuels || []).map((p) => ({ ...p, pctCapitalisation: 100, pctDistribution: 0 })),
          distribution: { ...DEFAULT_DISTRIBUTION },
        };
      }
      return {
        ...s,
        products: s.products.map((p, k) => (k === index ? { ...p, ...updatedPatch } : p)),
      };
    });
  const setLiquidation = (patch: Partial<PlacementLiquidationState>) =>
    setState((s) => ({ ...s, liquidation: { ...s.liquidation, ...patch } }));
  const setTransmission = (patch: Partial<PlacementTransmissionState>) =>
    setState((s) => ({ ...s, transmission: { ...s.transmission, ...patch } }));
  const setStep = (step: PlacementStep) => setState((s) => ({ ...s, step }));

  const setVersementConfig = (
    productIndex: number,
    config: VersementConfig | VersementConfigInput | undefined,
  ) => {
    const normalized = normalizeVersementConfig(config);
    setState((s) => ({
      ...s,
      products: s.products.map((p, idx) => (idx === productIndex ? { ...p, versementConfig: normalized } : p)),
    }));
  };

  const updateProductOption = (
    productIndex: number,
    _path: 'liquidation.optionBaremeIR',
    value: boolean,
  ) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((product, index) => (
        index === productIndex
          ? {
              ...product,
              liquidation: {
                ...product.liquidation,
                optionBaremeIR: value,
              },
            }
          : product
      )),
    }));
  };

  const exportExcel = useCallback(async () => {
    setExportLoading(true);
    try {
      await exportPlacementExcel(buildPlacementStateForMode(state, isExpert), results, pptxColors.c1, pptxColors.c7);
    } catch (errorExport) {
      const err = errorExport instanceof Error ? errorExport : new Error(String(errorExport));
      console.error('[ExcelExport] Export failed', {
        err: errorExport,
        message: err.message,
        stack: err.stack,
      });
      alert('Impossible de générer le fichier Excel.');
    } finally {
      setExportLoading(false);
    }
  }, [state, isExpert, results, pptxColors]);

  const exportHandlers: PlacementSimulatorExportHandlers = {
    exportExcel,
  };

  const produit1 = results?.produit1 ?? null;
  const produit2 = results?.produit2 ?? null;
  const detailRows1: EpargneRowWithReinvest[] = produit1 ? withReinvestCumul(produit1.epargne.rows) : [];
  const detailRows2: EpargneRowWithReinvest[] = produit2 ? withReinvestCumul(produit2.epargne.rows) : [];
  const columnsProduit1 = getRelevantColumnsEpargne(detailRows1, getBaseColumnsForProduct(produit1), showAllColumns);
  const columnsProduit2 = getRelevantColumnsEpargne(detailRows2, getBaseColumnsForProduct(produit2), showAllColumns);

  const handlers: PlacementSimulatorHandlers = {
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

  const resultsDerived: PlacementSimulatorResultsDerived = {
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

  const uiFlags: PlacementSimulatorUiFlags = {
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
