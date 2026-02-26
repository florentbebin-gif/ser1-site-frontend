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
 * - Excel export            → placement/export/placementExcelExport.js
 * - Table helpers           → placement/utils/tableHelpers.jsx
 *
 * 3 phases : Épargne → Liquidation → Transmission
 */

import React from 'react';
import './PlacementSimulator.css';
import { VersementConfigModal } from './VersementConfigModal.jsx';
import { renderEpargneRow } from '../utils/tableHelpers.jsx';
import { PlacementToolbar } from './PlacementToolbar.jsx';
import { PlacementInputsPanel } from './PlacementInputsPanel.jsx';
import { PlacementResultsPanel } from './PlacementResultsPanel.jsx';
import { usePlacementSimulatorController } from './usePlacementSimulatorController.js';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PlacementSimulatorPage() {
  const {
    state,
    handlers,
    resultsDerived,
    exportHandlers,
    uiFlags,
  } = usePlacementSimulatorController();

  const {
    setClient,
    setProduct,
    setLiquidation,
    setTransmission,
    setStep,
    setVersementConfig,
    updateProductOption,
    setModalOpen,
    setShowAllColumns,
  } = handlers;

  const {
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
  } = resultsDerived;

  const { exportExcel } = exportHandlers;

  const {
    loading,
    error,
    hydrated,
    modalOpen,
    showAllColumns,
    exportLoading,
  } = uiFlags;

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
