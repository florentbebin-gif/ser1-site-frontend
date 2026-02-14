/**
 * PlacementSimulatorPage.jsx — Orchestrateur du simulateur de placement
 *
 * Architecture modulaire :
 * - Moteur de calcul        → engine/placementEngine.js
 * - Settings-driven         → hooks/usePlacementSettings.js
 * - Formatters              → placement/utils/formatters.js
 * - Normalizers & constants → placement/utils/normalizers.js
 * - Input components        → placement/components/inputs.jsx
 * - Table components        → placement/components/tables.jsx
 * - VersementConfigModal    → placement/components/VersementConfigModal.jsx
 * - Excel export            → placement/utils/placementExcelExport.js
 * - Table helpers           → placement/utils/tableHelpers.jsx
 *
 * 3 phases : Épargne → Liquidation → Transmission
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePlacementSettings } from '@/hooks/usePlacementSettings.js';
import {
  simulateComplete,
  compareProducts,
} from '@/engine/placementEngine.js';
import '@/pages/Placement.css';
import { normalizeVersementConfig } from '@/utils/versementConfig.js';
import { onResetEvent, storageKeyFor } from '@/utils/reset.js';
import { PLACEMENT_SAVE_EVENT, PLACEMENT_LOAD_EVENT } from '@/utils/placementEvents.js';
import { savePlacementState, loadPlacementStateFromFile } from '@/utils/placementPersistence.js';
import { toEngineProduct } from '../adapters/toEngineProduct.js';
import {
  DEFAULT_STATE, DEFAULT_DMTG_RATE,
  normalizeLoadedState, buildPersistedState,
  getRendementLiquidation, buildDmtgOptions, buildCustomDmtgOption,
  withReinvestCumul,
} from '@/pages/placement/utils/normalizers.js';

import { VersementConfigModal } from '@/pages/placement/components/VersementConfigModal.jsx';
import { exportPlacementExcel } from '@/pages/placement/utils/placementExcelExport.js';
import {
  getRelevantColumnsEpargne, getBaseColumnsForProduct, renderEpargneRow,
} from '@/pages/placement/utils/tableHelpers.jsx';
import { PlacementToolbar } from './PlacementToolbar.jsx';
import { PlacementInputsPanel } from './PlacementInputsPanel.jsx';
import { PlacementResultsPanel } from './PlacementResultsPanel.jsx';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PlacementSimulatorPage() {
  const STORE_KEY = storageKeyFor('placement');
  const { fiscalParams, loading, error, tmiOptions, taxSettings, psSettings } = usePlacementSettings();

  const [hydrated, setHydrated] = useState(false);
  const [state, setState] = useState(DEFAULT_STATE);
  const [modalOpen, setModalOpen] = useState(null); // null | 0 | 1
  const [actionInProgress, setActionInProgress] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

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
    [dmtgSelectOptions, state.transmission.dmtgTaux],
  );

  const selectedDmtgTrancheWidth = useMemo(() => {
    if (!selectedDmtgOption) return null;
    const from = typeof selectedDmtgOption.rangeFrom === 'number' ? selectedDmtgOption.rangeFrom : 0;
    const to = typeof selectedDmtgOption.rangeTo === 'number' ? selectedDmtgOption.rangeTo : null;
    if (to == null) return null; // pas de borne supérieure => pas de ratio pertinent
    const width = to - from;
    return width > 0 ? width : null;
  }, [selectedDmtgOption]);

  // Hydratation depuis sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          setState({ ...DEFAULT_STATE, ...s });
        }
      }
    } catch {}
    setHydrated(true);
  }, [STORE_KEY]);

  // Persistance
  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {}
  }, [hydrated, state, STORE_KEY]);

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

  // Reset
  useEffect(() => {
    const off = onResetEvent?.(({ simId }) => {
      if (simId && simId !== 'placement') return;
      setState(DEFAULT_STATE);
      try { sessionStorage.removeItem(STORE_KEY); } catch {}
    });
    return off || (() => {});
  }, [STORE_KEY]);



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

  // Calculs
  const results = useMemo(() => {
    if (!hydrated || loading || error) return null;

    // Ajouter le taux DMTG choisi aux fiscalParams
    const fpWithDmtg = { ...fiscalParams, dmtgTauxChoisi: state.transmission.dmtgTaux };

    // Transformer les produits vers le format moteur
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

  // Helpers pour mise à jour du state
  const setClient = (patch) => setState((s) => ({ ...s, client: { ...s.client, ...patch } }));
  const setProduct = (i, patch) => setState((s) => ({
    ...s,
    products: s.products.map((p, k) => (k === i ? { ...p, ...patch } : p)),
  }));
  const setLiquidation = (patch) => setState((s) => ({ ...s, liquidation: { ...s.liquidation, ...patch } }));
  const setTransmission = (patch) => setState((s) => ({ ...s, transmission: { ...s.transmission, ...patch } }));
  const setStep = (step) => setState((s) => ({ ...s, step }));

  const setVersementConfig = (productIndex, config) => {
    const normalized = normalizeVersementConfig(config);
    setState((s) => ({
      ...s,
      products: s.products.map((p, idx) =>
        idx === productIndex ? { ...p, versementConfig: normalized } : p
      ),
    }));
  };

  const updateProductOption = (productIndex, path, value) => {
    setState(prev => {
      const newState = { ...prev };
      const pathParts = path.split('.');
      let current = newState.products[productIndex];
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      
      current[pathParts[pathParts.length - 1]] = value;
      return newState;
    });
  };

  // Export Excel
  const exportExcel = useCallback(async () => {
    setExportLoading(true);
    try {
      await exportPlacementExcel(state, results);
    } catch (e) {
      console.error("[ExcelExport] Export failed", { 
        err: e, 
        message: e?.message, 
        stack: e?.stack 
      });
      alert('Impossible de générer le fichier Excel.');
    } finally {
      setExportLoading(false);
    }
  }, [state, results]);

  const { produit1, produit2 } = results || { produit1: null, produit2: null, deltas: {} };

  // État pour le toggle "Afficher toutes les colonnes"
  const [showAllColumns, setShowAllColumns] = useState(false);

  const detailRows1 = produit1 ? withReinvestCumul(produit1.epargne.rows) : [];
  const detailRows2 = produit2 ? withReinvestCumul(produit2.epargne.rows) : [];

  const columnsProduit1 = getRelevantColumnsEpargne(detailRows1, getBaseColumnsForProduct(produit1), showAllColumns);
  const columnsProduit2 = getRelevantColumnsEpargne(detailRows2, getBaseColumnsForProduct(produit2), showAllColumns);

  // Loading / Error (placés après les hooks pour respecter les Rules of Hooks)
  if (error) {
    return (
      <div className="pl-panel placement-page">
        <div className="pl-ir-header">
          <div className="pl-ir-title">Erreur</div>
          <div className="pl-error">{error}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="pl-panel placement-page premium-page">
      <PlacementToolbar
        exportLoading={exportLoading}
        onExportExcel={exportExcel}
        canExportExcel={Boolean(results?.produit1)}
        step={state.step}
        onStepChange={setStep}
      />

      <div className="pl-ir-grid">
        <PlacementInputsPanel
          state={state}
          tmiOptions={tmiOptions}
          setClient={setClient}
          setProduct={setProduct}
          setLiquidation={setLiquidation}
          setTransmission={setTransmission}
          updateProductOption={updateProductOption}
          setModalOpen={setModalOpen}
          showAllColumns={showAllColumns}
          setShowAllColumns={setShowAllColumns}
          produit1={produit1}
          produit2={produit2}
          detailRows1={detailRows1}
          detailRows2={detailRows2}
          columnsProduit1={columnsProduit1}
          columnsProduit2={columnsProduit2}
          renderEpargneRow={renderEpargneRow}
          dmtgSelectOptions={dmtgSelectOptions}
          selectedDmtgTrancheWidth={selectedDmtgTrancheWidth}
          psSettings={psSettings}
        />

        <PlacementResultsPanel
          loading={loading}
          hydrated={hydrated}
          results={results}
          state={state}
        />
      </div>

      {/* Modal de configuration des versements */}
      {modalOpen !== null && (
        <VersementConfigModal
          envelope={state.products[modalOpen].envelope}
          config={state.products[modalOpen].versementConfig}
          dureeEpargne={state.products[modalOpen].dureeEpargne}
          onSave={(config) => {
            try {
              setVersementConfig(modalOpen, config);
              setModalOpen(null);
            } catch (error) {
              console.error('[Placement] Error in onSave handler:', error);
            }
          }}
          onClose={() => setModalOpen(null)}
        />
      )}
    </div>
  );
}
