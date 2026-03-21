import type { ReactElement } from 'react';
import type { CompareResult } from '@/engine/placement/types';
import type { UsePlacementSettingsResult } from '@/hooks/usePlacementSettings';
import { computeDmtgConsumptionRatio, shouldShowDmtgDisclaimer } from '@/engine/placement/transmissionDisclaimer';
import type {
  DmtgOption,
  EpargneRowWithReinvest,
  PlacementClient,
  PlacementLiquidationState,
  PlacementProductDraft,
  PlacementSimulatorState,
  PlacementTransmissionState,
} from '../utils/normalizers';
import type { PlacementTableProduct } from '../utils/tableHelpers';
import { PlacementClientProfileSection } from './PlacementClientProfileSection';
import { PlacementEpargneSection } from './PlacementEpargneSection';
import { PlacementLiquidationSection } from './PlacementLiquidationSection';
import { PlacementTransmissionSection } from './PlacementTransmissionSection';

interface PlacementInputsPanelProps {
  state: PlacementSimulatorState;
  isExpert: boolean;
  tmiOptions: UsePlacementSettingsResult['tmiOptions'];
  setClient: (_patch: Partial<PlacementClient>) => void;
  setProduct: (_index: number, _patch: Partial<PlacementProductDraft>) => void;
  setLiquidation: (_patch: Partial<PlacementLiquidationState>) => void;
  setTransmission: (_patch: Partial<PlacementTransmissionState>) => void;
  updateProductOption: (
    _productIndex: number,
    _path: 'liquidation.optionBaremeIR',
    _value: boolean,
  ) => void;
  setModalOpen: (_productIndex: number) => void;
  showAllColumns: boolean;
  setShowAllColumns: (_value: boolean) => void;
  produit1: CompareResult['produit1'] | null;
  produit2: CompareResult['produit2'] | null;
  detailRows1: EpargneRowWithReinvest[];
  detailRows2: EpargneRowWithReinvest[];
  columnsProduit1: string[];
  columnsProduit2: string[];
  renderEpargneRow: (
    _product: PlacementTableProduct,
    _columns: string[],
  ) => (_row: EpargneRowWithReinvest, _index: number) => ReactElement;
  dmtgSelectOptions: DmtgOption[];
  selectedDmtgTrancheWidth: number | null;
  psSettings: UsePlacementSettingsResult['psSettings'];
}

export function PlacementInputsPanel({
  state,
  isExpert,
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
}: PlacementInputsPanelProps) {
  const assietteDmtgProduit1 = (produit1?.transmission?.taxeDmtg || 0) > 0
    ? (produit1?.transmission?.assiette || 0)
    : 0;
  const assietteDmtgProduit2 = (produit2?.transmission?.taxeDmtg || 0) > 0
    ? (produit2?.transmission?.assiette || 0)
    : 0;

  const nbBenef = Math.max(1, state.transmission.nbBeneficiaires);
  const assietteDmtgProduit1PerBenef = assietteDmtgProduit1 / nbBenef;
  const assietteDmtgProduit2PerBenef = assietteDmtgProduit2 / nbBenef;

  const dmtgConsumptionRatioProduit1 = computeDmtgConsumptionRatio(
    assietteDmtgProduit1PerBenef,
    selectedDmtgTrancheWidth ?? 0,
  );
  const dmtgConsumptionRatioProduit2 = computeDmtgConsumptionRatio(
    assietteDmtgProduit2PerBenef,
    selectedDmtgTrancheWidth ?? 0,
  );

  const showDmtgDisclaimer =
    shouldShowDmtgDisclaimer(assietteDmtgProduit1PerBenef, selectedDmtgTrancheWidth ?? 0)
    || shouldShowDmtgDisclaimer(assietteDmtgProduit2PerBenef, selectedDmtgTrancheWidth ?? 0);

  const dmtgConsumptionPercentProduit1 = Math.min(100, Math.round(dmtgConsumptionRatioProduit1 * 100));
  const dmtgConsumptionPercentProduit2 = Math.min(100, Math.round(dmtgConsumptionRatioProduit2 * 100));

  return (
    <div className="pl-ir-left">
      <PlacementClientProfileSection
        client={state.client}
        tmiOptions={tmiOptions}
        setClient={setClient}
      />

      {state.client.ageActuel !== null && state.step === 'epargne' && (
        <PlacementEpargneSection
          state={state}
          isExpert={isExpert}
          setProduct={setProduct}
          setModalOpen={setModalOpen}
          showAllColumns={isExpert ? showAllColumns : false}
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

      {state.client.ageActuel !== null && state.step === 'liquidation' && (
        <PlacementLiquidationSection
          state={state}
          isExpert={isExpert}
          setLiquidation={setLiquidation}
          updateProductOption={updateProductOption}
          showAllColumns={showAllColumns}
          setShowAllColumns={setShowAllColumns}
          produit1={produit1}
          produit2={produit2}
        />
      )}

      {state.client.ageActuel !== null && state.step === 'transmission' && (
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

