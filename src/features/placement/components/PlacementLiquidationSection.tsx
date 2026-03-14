import type { CompareResult } from '@/engine/placement/types';
import { InputEuro, InputNumber, InputPct, Toggle } from './inputs';
import { getRendementLiquidation } from '../utils/normalizers';
import type {
  PlacementLiquidationState,
  PlacementProductDraft,
  PlacementSimulatorState,
} from '../utils/normalizers';
import { PlacementLiquidationDetailsTable } from './PlacementLiquidationDetailsTable';

interface PlacementLiquidationSectionProps {
  state: PlacementSimulatorState;
  isExpert: boolean;
  setLiquidation: (_patch: Partial<PlacementLiquidationState>) => void;
  setProduct: (_index: number, _patch: Partial<PlacementProductDraft>) => void;
  updateProductOption: (
    _productIndex: number,
    _path: 'liquidation.optionBaremeIR',
    _value: boolean,
  ) => void;
  showAllColumns: boolean;
  setShowAllColumns: (_value: boolean) => void;
  produit1: CompareResult['produit1'] | null;
  produit2: CompareResult['produit2'] | null;
}

export function PlacementLiquidationSection({
  state,
  isExpert,
  setLiquidation,
  setProduct,
  updateProductOption,
  showAllColumns,
  setShowAllColumns,
  produit1,
  produit2,
}: PlacementLiquidationSectionProps) {
  const showOptionBareme = isExpert && (
    (produit1 && ['CTO', 'AV', 'PEA'].includes(produit1.envelope))
    || (produit2 && ['CTO', 'AV', 'PEA'].includes(produit2.envelope))
  );

  const produit1OptionBaremeIR = state.products[0].liquidation?.optionBaremeIR ?? false;
  const produit2OptionBaremeIR = state.products[1].liquidation?.optionBaremeIR ?? false;

  return (
    <div className="premium-card">
      <div className="pl-card-title">Phase de liquidation</div>

      <table className="pl-ir-table pl-table premium-table">
        <tbody>
          <tr>
            <td>Stratégie de retraits</td>
            <td colSpan={2}>
              <select
                className="pl-select"
                value={state.liquidation.mode}
                onChange={(event) => setLiquidation({ mode: event.target.value })}
              >
                <option value="epuiser">Épuiser sur N années</option>
                <option value="mensualite">Mensualité cible</option>
                <option value="unique">Retrait unique</option>
              </select>
            </td>
          </tr>

          {state.liquidation.mode === 'epuiser' && (
            <tr>
              <td>Durée de liquidation</td>
              <td colSpan={2}>
                <InputNumber
                  value={state.liquidation.duree}
                  onChange={(value) => setLiquidation({ duree: value })}
                  unit="ans"
                  min={1}
                  max={50}
                  inline
                />
              </td>
            </tr>
          )}

          {(state.products[0].envelope !== 'SCPI' || state.products[1].envelope !== 'SCPI') && (
            <tr>
              <td>
                Rendement capitalisation (liquidation)
                <div className="pl-detail-cumul">
                  Valeur par défaut : rendement capitalisation du modal
                </div>
              </td>
              {state.products.map((product, index) => (
                <td
                  key={index}
                  className={product.envelope === 'SCPI' ? 'pl-cell--muted' : 'pl-cell--soft'}
                >
                  {product.envelope === 'SCPI' ? (
                    '-'
                  ) : (
                    <InputPct
                      value={getRendementLiquidation(product) || 0}
                      onChange={(value) => setProduct(index, { rendementLiquidationOverride: value })}
                    />
                  )}
                </td>
              ))}
            </tr>
          )}

          {state.liquidation.mode === 'mensualite' && (
            <tr>
              <td>Mensualité cible</td>
              <td colSpan={2}>
                <InputEuro
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
                <InputEuro
                  value={state.liquidation.montantUnique}
                  onChange={(value) => setLiquidation({ montantUnique: value })}
                />
              </td>
            </tr>
          )}

          {showOptionBareme ? (
            <tr>
              <td>Option au barème IR</td>
              <td className="pl-cell--center">
                {produit1 && ['CTO', 'AV', 'PEA'].includes(produit1.envelope) ? (
                  <Toggle
                    checked={produit1OptionBaremeIR}
                    onChange={(value) => updateProductOption(0, 'liquidation.optionBaremeIR', value)}
                    ariaLabel={`Activer l’option au barème IR en liquidation pour ${produit1.envelopeLabel}`}
                  />
                ) : (
                  <span className="pl-muted">-</span>
                )}
              </td>
              <td className="pl-cell--center">
                {produit2 && ['CTO', 'AV', 'PEA'].includes(produit2.envelope) ? (
                  <Toggle
                    checked={produit2OptionBaremeIR}
                    onChange={(value) => updateProductOption(1, 'liquidation.optionBaremeIR', value)}
                    ariaLabel={`Activer l’option au barème IR en liquidation pour ${produit2.envelopeLabel}`}
                  />
                ) : (
                  <span className="pl-muted">-</span>
                )}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {produit1 && produit2 && (
        <div className="pl-details-section">
          <div className="pl-details-header">
            <h4 className="pl-details-title">Détail année par année</h4>
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
          </div>

          <PlacementLiquidationDetailsTable
            product={produit1}
            showAllColumns={showAllColumns}
            showCapitalDecesColumn={Boolean(
              produit1.envelope === 'PER'
              && state.products[0].versementConfig?.annuel?.garantieBonneFin?.active
            )}
          />
          <PlacementLiquidationDetailsTable
            product={produit2}
            showAllColumns={showAllColumns}
            showCapitalDecesColumn={Boolean(
              produit2.envelope === 'PER'
              && state.products[1].versementConfig?.annuel?.garantieBonneFin?.active
            )}
          />
        </div>
      )}

      <div className="pl-hint">
        <a href="/settings/base-contrat">Consulter la fiscalité des contrats &rarr;</a>
      </div>
    </div>
  );
}
