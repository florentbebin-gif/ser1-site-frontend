import { useState } from 'react';
import type { CompareResult } from '@/engine/placement/types';
import { PlacementEuroField, PlacementNumberField } from './PlacementAmountControls';
import { PlacementToggle as Toggle } from './PlacementToggle';
import { SimSelect } from '@/components/ui/sim';
import { IconArrowLeftRight } from '@/icons/ui';
import type { PlacementLiquidationState, PlacementSimulatorState } from '../utils/normalizers';
import { PlacementLiquidationDetailsTable } from './PlacementLiquidationDetailsTable';

interface PlacementLiquidationSectionProps {
  state: PlacementSimulatorState;
  isExpert: boolean;
  setLiquidation: (_patch: Partial<PlacementLiquidationState>) => void;
  updateProductOption: (
    _productIndex: number,
    _path: 'liquidation.optionBaremeIR',
    _value: boolean,
  ) => void;
  showAllColumns: boolean;
  setShowAllColumns: (_value: boolean) => void;
  produit1: CompareResult['produit1'] | null;
  produit2: CompareResult['produit2'] | null;
  compareEnabled: boolean;
}

export function PlacementLiquidationSection({
  state,
  isExpert,
  setLiquidation,
  updateProductOption,
  showAllColumns,
  setShowAllColumns,
  produit1,
  produit2,
  compareEnabled,
}: PlacementLiquidationSectionProps) {
  const showOptionBareme =
    isExpert &&
    ((produit1 && ['CTO', 'AV', 'PEA'].includes(produit1.envelope)) ||
      (compareEnabled && produit2 && ['CTO', 'AV', 'PEA'].includes(produit2.envelope)));

  const [table1Open, setTable1Open] = useState(false);
  const [table2Open, setTable2Open] = useState(false);
  const anyTableOpen = table1Open || table2Open;

  const produit1Draft = state.products[0];
  const produit2Draft = state.products[1];
  const produit1OptionBaremeIR = produit1Draft?.liquidation?.optionBaremeIR ?? false;
  const produit2OptionBaremeIR = produit2Draft?.liquidation?.optionBaremeIR ?? false;

  return (
    <div className="premium-card premium-card--guide sim-card--guide">
      <div className="pl-card-header sim-card__header sim-card__header--bleed">
        <div className="pl-card-title-row sim-card__title-row">
          <span className="sim-card__icon">
            <IconArrowLeftRight />
          </span>
          <h2 className="pl-card-title sim-card__title">Phase de liquidation</h2>
        </div>
        <p className="pl-card-subtitle sim-card__subtitle">
          Stratégie de sortie, retraits et fiscalité au barème.
        </p>
      </div>
      <div className="sim-divider" />

      <table className="pl-ir-table pl-table premium-table">
        <tbody>
          <tr>
            <td>Stratégie de retraits</td>
            <td colSpan={2}>
              <SimSelect
                value={isExpert ? state.liquidation.mode : 'epuiser'}
                onChange={(v) => setLiquidation({ mode: v })}
                forced={!isExpert}
                options={[
                  { value: 'epuiser', label: 'Épuiser sur N années' },
                  ...(isExpert
                    ? [
                        { value: 'mensualite', label: 'Mensualité cible' },
                        { value: 'unique', label: 'Retrait unique' },
                      ]
                    : []),
                ]}
              />
            </td>
          </tr>

          {state.liquidation.mode === 'epuiser' && (
            <tr>
              <td>Durée de liquidation</td>
              <td colSpan={2}>
                <PlacementNumberField
                  value={state.liquidation.duree}
                  onChange={(value) => setLiquidation({ duree: value ?? 1 })}
                  unit="ans"
                  min={1}
                  max={50}
                  inline
                />
              </td>
            </tr>
          )}

          {state.liquidation.mode === 'mensualite' && (
            <tr>
              <td>Mensualité cible</td>
              <td colSpan={2}>
                <PlacementEuroField
                  value={state.liquidation.mensualiteCible}
                  onChange={(value) => setLiquidation({ mensualiteCible: value })}
                />
              </td>
            </tr>
          )}

          {state.liquidation.mode === 'unique' && (
            <tr>
              <td>Montant du retrait</td>
              <td colSpan={2}>
                <PlacementEuroField
                  value={state.liquidation.montantUnique}
                  onChange={(value) => setLiquidation({ montantUnique: value })}
                />
              </td>
            </tr>
          )}

          {showOptionBareme ? (
            <tr data-testid="placement-row-liquidation-bareme-ir">
              <td>Option au barème IR</td>
              <td className="pl-cell--center">
                {produit1 && ['CTO', 'AV', 'PEA'].includes(produit1.envelope) ? (
                  <Toggle
                    checked={produit1OptionBaremeIR}
                    onChange={(value) =>
                      updateProductOption(0, 'liquidation.optionBaremeIR', value)
                    }
                    ariaLabel={`Activer l’option au barème IR en liquidation pour ${produit1.envelopeLabel}`}
                  />
                ) : (
                  <span className="pl-muted">-</span>
                )}
              </td>
              {compareEnabled && (
                <td className="pl-cell--center">
                  {produit2 && ['CTO', 'AV', 'PEA'].includes(produit2.envelope) ? (
                    <Toggle
                      checked={produit2OptionBaremeIR}
                      onChange={(value) =>
                        updateProductOption(1, 'liquidation.optionBaremeIR', value)
                      }
                      ariaLabel={`Activer l’option au barème IR en liquidation pour ${produit2.envelopeLabel}`}
                    />
                  ) : (
                    <span className="pl-muted">-</span>
                  )}
                </td>
              )}
            </tr>
          ) : null}
        </tbody>
      </table>

      {produit1 && (compareEnabled ? produit2 : true) && (
        <div className="pl-details-section">
          <div className="pl-details-header">
            <h4 className="pl-details-title">Détail année par année</h4>
            {anyTableOpen && isExpert && (
              <div className="pl-pill-toggle">
                <button
                  type="button"
                  className={`pl-pill-toggle__btn${!showAllColumns ? ' is-active' : ''}`}
                  onClick={() => setShowAllColumns(false)}
                >
                  Essentielles
                </button>
                <button
                  type="button"
                  className={`pl-pill-toggle__btn${showAllColumns ? ' is-active' : ''}`}
                  onClick={() => setShowAllColumns(true)}
                >
                  Toutes les colonnes
                </button>
              </div>
            )}
          </div>

          {produit1 && (
            <PlacementLiquidationDetailsTable
              product={produit1}
              showAllColumns={showAllColumns}
              showCapitalDecesColumn={Boolean(
                produit1.envelope === 'PER' &&
                produit1Draft?.versementConfig?.annuel?.garantieBonneFin?.active,
              )}
              onOpenChange={setTable1Open}
            />
          )}
          {compareEnabled && produit2 && (
            <PlacementLiquidationDetailsTable
              product={produit2}
              showAllColumns={showAllColumns}
              showCapitalDecesColumn={Boolean(
                produit2.envelope === 'PER' &&
                produit2Draft?.versementConfig?.annuel?.garantieBonneFin?.active,
              )}
              onOpenChange={setTable2Open}
            />
          )}
        </div>
      )}

      <div className="pl-hint">
        <a href="/settings/memento">Consulter la fiscalité des contrats &rarr;</a>
      </div>
    </div>
  );
}
