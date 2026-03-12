// @ts-nocheck
import React from 'react';
import { computeDmtgConsumptionRatio, shouldShowDmtgDisclaimer } from '@/utils/transmissionDisclaimer';
import { PlacementClientProfileSection } from './PlacementClientProfileSection';
import { PlacementEpargneSection } from './PlacementEpargneSection';
import { PlacementLiquidationSection } from './PlacementLiquidationSection';
import { PlacementTransmissionSection } from './PlacementTransmissionSection';

export function PlacementInputsPanel({
  state,
  tmiOptions,
  setClient,
  setProduct,
  setLiquidation,
  setTransmission,
  updateProductOption,
  setModalOpen,
  showAllColumns,
  setShowAllColumns,
  produit1,
  produit2,
  detailRows1,
  detailRows2,
  columnsProduit1,
  columnsProduit2,
  renderEpargneRow,
  dmtgSelectOptions,
  selectedDmtgTrancheWidth,
  psSettings,
}) {
  const assietteDmtgProduit1 = (produit1?.transmission?.taxeDmtg || 0) > 0
    ? (produit1?.transmission?.assiette || 0)
    : 0;
  const assietteDmtgProduit2 = (produit2?.transmission?.taxeDmtg || 0) > 0
    ? (produit2?.transmission?.assiette || 0)
    : 0;

  const dmtgConsumptionRatioProduit1 = computeDmtgConsumptionRatio(
    assietteDmtgProduit1,
    selectedDmtgTrancheWidth,
  );
  const dmtgConsumptionRatioProduit2 = computeDmtgConsumptionRatio(
    assietteDmtgProduit2,
    selectedDmtgTrancheWidth,
  );

  const showDmtgDisclaimer =
    shouldShowDmtgDisclaimer(assietteDmtgProduit1, selectedDmtgTrancheWidth)
    || shouldShowDmtgDisclaimer(assietteDmtgProduit2, selectedDmtgTrancheWidth);

  const dmtgConsumptionPercentProduit1 = Math.min(100, Math.round(dmtgConsumptionRatioProduit1 * 100));
  const dmtgConsumptionPercentProduit2 = Math.min(100, Math.round(dmtgConsumptionRatioProduit2 * 100));

  return (
    <div className="pl-ir-left">
      <PlacementClientProfileSection
        client={state.client}
        tmiOptions={tmiOptions}
        setClient={setClient}
      />

      {state.step === 'epargne' && (
        <PlacementEpargneSection
          state={state}
          setProduct={setProduct}
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
        />
      )}

      {state.step === 'liquidation' && (
        <PlacementLiquidationSection
          state={state}
          setLiquidation={setLiquidation}
          setProduct={setProduct}
          updateProductOption={updateProductOption}
          showAllColumns={showAllColumns}
          setShowAllColumns={setShowAllColumns}
          produit1={produit1}
          produit2={produit2}
        />
      )}

      {state.step === 'transmission' && (
        <PlacementTransmissionSection
          state={state}
          setTransmission={setTransmission}
          produit1={produit1}
          produit2={produit2}
          dmtgSelectOptions={dmtgSelectOptions}
          showDmtgDisclaimer={showDmtgDisclaimer}
          dmtgConsumptionPercentProduit1={dmtgConsumptionPercentProduit1}
          dmtgConsumptionPercentProduit2={dmtgConsumptionPercentProduit2}
          psSettings={psSettings}
        />
      )}
    </div>
  );
}

