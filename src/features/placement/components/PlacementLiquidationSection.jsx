import React from 'react';
import { InputEuro, InputNumber, InputPct, Toggle } from './inputs.jsx';
import { getRendementLiquidation } from '../utils/normalizers';
import { PlacementLiquidationDetailsTable } from './PlacementLiquidationDetailsTable.jsx';

export function PlacementLiquidationSection({
  state,
  setLiquidation,
  setProduct,
  updateProductOption,
  showAllColumns,
  setShowAllColumns,
  produit1,
  produit2,
}) {
  const showOptionBareme = (
    (produit1 && ['CTO', 'AV', 'PEA'].includes(produit1.envelope))
    || (produit2 && ['CTO', 'AV', 'PEA'].includes(produit2.envelope))
  );

  return (
    <div className="pl-ir-table-wrapper premium-card premium-section">
      <div className="pl-section-title premium-section-title">Phase de liquidation</div>
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
                <div className="pl-detail-cumul">Valeur par défaut : rendement capitalisation du modal</div>
              </td>
              {state.products.map((product, index) => (
                <td key={index} style={{ opacity: product.envelope === 'SCPI' ? 0.55 : 0.85 }}>
                  {product.envelope === 'SCPI' ? (
                    '—'
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
              <td style={{ textAlign: 'center' }}>
                {produit1 && ['CTO', 'AV', 'PEA'].includes(produit1.envelope) ? (
                  <Toggle
                    checked={produit1.liquidation.optionBaremeIR}
                    onChange={(value) => updateProductOption(0, 'liquidation.optionBaremeIR', value)}
                    label=""
                  />
                ) : (
                  <span className="pl-muted">—</span>
                )}
              </td>
              <td style={{ textAlign: 'center' }}>
                {produit2 && ['CTO', 'AV', 'PEA'].includes(produit2.envelope) ? (
                  <Toggle
                    checked={produit2.liquidation.optionBaremeIR}
                    onChange={(value) => updateProductOption(1, 'liquidation.optionBaremeIR', value)}
                    label=""
                  />
                ) : (
                  <span className="pl-muted">—</span>
                )}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {produit1 && produit2 && (
        <div className="pl-details-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-c1)' }}>Détail année par année</h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-c9)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showAllColumns}
                onChange={(event) => setShowAllColumns(event.target.checked)}
                style={{ margin: 0 }}
              />
              Afficher toutes les colonnes
            </label>
          </div>
          <PlacementLiquidationDetailsTable
            product={produit1}
            showAllColumns={showAllColumns}
            showCapitalDecesColumn={Boolean(produit2.envelope === 'PER' && produit2?.versementConfig?.annuel?.garantieBonneFin?.active)}
          />
          <PlacementLiquidationDetailsTable
            product={produit2}
            showAllColumns={showAllColumns}
            showCapitalDecesColumn={Boolean(produit2.envelope === 'PER' && produit2?.versementConfig?.annuel?.garantieBonneFin?.active)}
          />
        </div>
      )}

      <div className="pl-hint">
        <a href="/settings/base-contrat" style={{ color: 'var(--color-c2)', fontSize: 11 }}>
          Consulter la fiscalité des contrats →
        </a>
      </div>
    </div>
  );
}
