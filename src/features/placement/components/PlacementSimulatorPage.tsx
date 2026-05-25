/**
 * PlacementSimulatorPage.tsx - Orchestrateur du simulateur de placement
 *
 * Architecture modulaire :
 * - Moteur de calcul        -> engine/placementEngine.ts
 * - Settings-driven         -> hooks/usePlacementSettings.ts
 * - Formatters              -> placement/utils/formatters.ts
 * - Normalizers & constants -> placement/utils/normalizers.ts
 * - Input components        -> placement/components/PlacementFormControls.tsx
 * - Table components        -> placement/components/PlacementTables.tsx
 * - VersementConfigModal    -> placement/components/VersementConfigModal.tsx
 * - Excel export            -> placement/export/placementExcelExport.ts
 * - Table helpers           -> placement/utils/tableHelpers.tsx
 *
 * 3 phases : Epargne -> Liquidation -> Transmission
 */

import { useState } from 'react';
import { ExportMenu } from '@/components/ExportMenu';
import { ModeToggle } from '@/components/ModeToggle';
import { SimPageShell } from '@/components/ui/sim';
import { useUserMode, type UserMode } from '@/settings/userMode';
import { resolveEffectiveUserMode } from '@/settings/userModeDisplay';
import '@/styles/sim/index.css';
import '../styles/index.css';
import { VersementConfigModal } from './VersementConfigModal';
import { renderEpargneRow } from '../utils/tableHelpers';
import { PlacementPhaseNav } from './PlacementPhaseNav';
import { PlacementInputsPanel } from './PlacementInputsPanel';
import { PlacementHypotheses } from './PlacementHypotheses';
import { PlacementResultsPanel } from './PlacementResultsPanel';
import { usePlacementSimulatorController } from '../hooks/usePlacementSimulatorController';

export default function PlacementSimulatorPage() {
  const { mode } = useUserMode();
  const [localMode, setLocalMode] = useState<UserMode | null>(null);
  const effectiveMode = resolveEffectiveUserMode(mode, localMode);
  const isExpert = effectiveMode === 'expert';
  const toggleMode = () => setLocalMode(isExpert ? 'simplifie' : 'expert');

  const { state, handlers, resultsDerived, exportHandlers, uiFlags } =
    usePlacementSimulatorController(isExpert);

  const {
    setClient,
    setProduct,
    setLiquidation,
    setTransmission,
    setStep,
    setVersementConfig,
    updateProductOption,
    setCompareEnabled,
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

  const { loading, error, hydrated, modalOpen, showAllColumns, exportLoading } = uiFlags;

  const modalProduct = modalOpen === null ? null : (state.products[modalOpen] ?? null);

  const exportOptions = [
    { label: 'Excel', onClick: exportExcel, disabled: !results?.produit1 },
    { label: 'PowerPoint', onClick: exportPptx, disabled: !results?.produit1 },
  ];
  const showResults = state.client.ageActuel !== null;

  if (error) {
    return (
      <SimPageShell
        title="Placement"
        subtitle="Épargne → Liquidation → Transmission"
        pageClassName="pl-page"
        pageTestId="placement-page"
        titleTestId="placement-title"
        actions={
          <>
            <ModeToggle value={isExpert} onChange={toggleMode} testId="placement-mode-btn" />
            <ExportMenu options={exportOptions} loading={exportLoading} />
          </>
        }
        nav={<PlacementPhaseNav step={state.step} onStepChange={setStep} />}
        error={error}
      />
    );
  }

  return (
    <>
      <SimPageShell
        title="Placement"
        subtitle="Épargne → Liquidation → Transmission"
        pageClassName="pl-page"
        pageTestId="placement-page"
        titleTestId="placement-title"
        actions={
          <>
            <ModeToggle value={isExpert} onChange={toggleMode} testId="placement-mode-btn" />
            <ExportMenu options={exportOptions} loading={exportLoading} />
          </>
        }
        nav={<PlacementPhaseNav step={state.step} onStepChange={setStep} />}
      >
        <SimPageShell.Main className="pl-ir-left">
          <PlacementInputsPanel
            state={state}
            isExpert={isExpert}
            tmiOptions={tmiOptions}
            setClient={setClient}
            setProduct={setProduct}
            setLiquidation={setLiquidation}
            setTransmission={setTransmission}
            updateProductOption={updateProductOption}
            setCompareEnabled={setCompareEnabled}
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
        </SimPageShell.Main>

        <SimPageShell.Side
          className={`pl-ir-right${!showResults ? ' pl-ir-right--placeholder' : ''}`}
          sticky={showResults}
        >
          {showResults ? (
            <PlacementResultsPanel
              loading={loading}
              hydrated={hydrated}
              results={results}
              state={state}
            />
          ) : (
            <div className="pl-ir-right__spacer" aria-hidden="true" />
          )}
        </SimPageShell.Side>

        <SimPageShell.Section>
          <PlacementHypotheses />
        </SimPageShell.Section>
      </SimPageShell>

      {modalOpen !== null && modalProduct && (
        <VersementConfigModal
          envelope={modalProduct.envelope}
          config={modalProduct.versementConfig}
          dureeEpargne={modalProduct.dureeEpargne}
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
    </>
  );
}
