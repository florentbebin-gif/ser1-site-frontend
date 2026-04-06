/**
 * PlacementSimulatorPage.tsx - Orchestrateur du simulateur de placement
 *
 * Architecture modulaire :
 * - Moteur de calcul        -> engine/placementEngine.ts
 * - Settings-driven         -> hooks/usePlacementSettings.ts
 * - Formatters              -> placement/utils/formatters.ts
 * - Normalizers & constants -> placement/utils/normalizers.ts
 * - Input components        -> placement/components/inputs.tsx
 * - Table components        -> placement/components/tables.tsx
 * - VersementConfigModal    -> placement/components/VersementConfigModal.tsx
 * - Excel export            -> placement/export/placementExcelExport.ts
 * - Table helpers           -> placement/utils/tableHelpers.tsx
 *
 * 3 phases : Epargne -> Liquidation -> Transmission
 */

import { useState } from 'react';
import { useUserMode, type UserMode } from '@/settings/userMode';
import '@/styles/sim/index.css';
import '../styles/index.css';
import { VersementConfigModal } from './VersementConfigModal';
import { renderEpargneRow } from '../utils/tableHelpers';
import { PlacementToolbar } from './PlacementToolbar';
import { PlacementInputsPanel } from './PlacementInputsPanel';
import { PlacementHypotheses } from './PlacementHypotheses';
import { PlacementResultsPanel } from './PlacementResultsPanel';
import { usePlacementSimulatorController } from '../hooks/usePlacementSimulatorController';

export default function PlacementSimulatorPage() {
  const { mode } = useUserMode();
  const [localMode, setLocalMode] = useState<UserMode | null>(null);
  const isExpert = (localMode ?? mode) === 'expert';
  const toggleMode = () => setLocalMode(isExpert ? 'simplifie' : 'expert');

  const {
    state,
    handlers,
    resultsDerived,
    exportHandlers,
    uiFlags,
  } = usePlacementSimulatorController(isExpert);

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

  const { exportExcel, exportPptx } = exportHandlers;

  const {
    loading,
    error,
    hydrated,
    modalOpen,
    showAllColumns,
    exportLoading,
  } = uiFlags;

  if (error) {
    return (
      <div className="sim-page pl-page" data-testid="placement-page">
        <div className="pl-ir-header">
          <div className="pl-ir-title">Erreur</div>
          <div className="pl-error">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sim-page pl-page" data-testid="placement-page">
      <PlacementToolbar
        exportLoading={exportLoading}
        onExportExcel={exportExcel}
        canExportExcel={Boolean(results?.produit1)}
        onExportPptx={exportPptx}
        canExportPptx={Boolean(results?.produit1)}
        step={state.step}
        onStepChange={setStep}
        isExpert={isExpert}
        onToggleMode={toggleMode}
      />

      <div className="pl-ir-grid sim-grid">
        <PlacementInputsPanel
          state={state}
          isExpert={isExpert}
          tmiOptions={tmiOptions}
          setClient={setClient}
          setProduct={setProduct}
          setLiquidation={setLiquidation}
          setTransmission={setTransmission}
          updateProductOption={updateProductOption}
          setModalOpen={(productIndex) => setModalOpen(productIndex)}
          showAllColumns={showAllColumns}
          setShowAllColumns={(value) => setShowAllColumns(value)}
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

        {state.client.ageActuel !== null && (
          <PlacementResultsPanel
            loading={loading}
            hydrated={hydrated}
            results={results}
            state={state}
          />
        )}
      </div>

      <PlacementHypotheses />

      {modalOpen !== null && (
        <VersementConfigModal
          envelope={state.products[modalOpen].envelope}
          config={state.products[modalOpen].versementConfig}
          dureeEpargne={state.products[modalOpen].dureeEpargne}
          isExpert={isExpert}
          onSave={(config) => {
            try {
              setVersementConfig(modalOpen, config);
              setModalOpen(null);
            } catch (modalError) {
              console.error('[Placement] Error in onSave handler:', modalError);
            }
          }}
          onClose={() => setModalOpen(null)}
        />
      )}
    </div>
  );
}
