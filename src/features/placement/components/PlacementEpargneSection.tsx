// @ts-nocheck
import React from 'react';
import { ENVELOPE_LABELS } from '@/engine/placement';
import { shortEuro } from '../utils/formatters';
import { InputNumber, Toggle } from './inputs';
import { CollapsibleTable } from './tables';

export function PlacementEpargneSection({
  state,
  setProduct,
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
}) {
  return (
    <div className="pl-ir-table-wrapper premium-card premium-section">
      <div className="pl-section-title premium-section-title">Phase d'épargne</div>
      <table className="pl-ir-table pl-table premium-table">
        <thead>
          <tr>
            <th />
            <th className="pl-colhead" aria-label="Produit 1">
              <div className="pl-colbadge-wrapper">
                <div className="pl-collabel pl-collabel--product1">{ENVELOPE_LABELS[state.products[0].envelope]}</div>
              </div>
            </th>
            <th className="pl-colhead" aria-label="Produit 2">
              <div className="pl-colbadge-wrapper">
                <div className="pl-collabel pl-collabel--product2">{ENVELOPE_LABELS[state.products[1].envelope]}</div>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Enveloppe</td>
            {state.products.map((product, index) => (
              <td key={index}>
                <select
                  className="pl-select"
                  value={product.envelope}
                  onChange={(event) => setProduct(index, { envelope: event.target.value })}
                >
                  {Object.entries(ENVELOPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </td>
            ))}
          </tr>
          <tr>
            <td>Durée de la phase épargne</td>
            {state.products.map((product, index) => (
              <td key={index}>
                <InputNumber
                  value={product.dureeEpargne}
                  onChange={(value) => setProduct(index, { dureeEpargne: value })}
                  unit="ans"
                  min={1}
                  max={50}
                />
              </td>
            ))}
          </tr>
          {(state.products[0].envelope === 'PER' || state.products[1].envelope === 'PER') && (
            <tr>
              <td>PER bancaire (CTO)</td>
              {state.products.map((product, index) => (
                <td key={index} style={{ textAlign: 'center' }}>
                  {product.envelope === 'PER' ? (
                    <Toggle
                      checked={product.perBancaire}
                      onChange={(value) => setProduct(index, { perBancaire: value })}
                      label=""
                    />
                  ) : (
                    <span className="pl-muted">—</span>
                  )}
                </td>
              ))}
            </tr>
          )}
          {(state.products[0].envelope === 'CTO' || state.products[1].envelope === 'CTO') && (
            <tr>
              <td>Option dividendes au barème IR</td>
              {state.products.map((product, index) => (
                <td key={index} style={{ textAlign: 'center' }}>
                  {product.envelope === 'CTO' ? (
                    <Toggle
                      checked={product.optionBaremeIR}
                      onChange={(value) => setProduct(index, { optionBaremeIR: value })}
                      label=""
                    />
                  ) : (
                    <span className="pl-muted">—</span>
                  )}
                </td>
              ))}
            </tr>
          )}
          <tr>
            <td>
              Paramétrer les versements
              <div className="pl-detail-cumul">Initial, annuel, allocation, frais</div>
            </td>
            {state.products.map((product, index) => (
              <td key={index}>
                <button className="pl-btn pl-btn--config" onClick={() => setModalOpen(index)}>
                  <span className="pl-btn__icon">⚙</span>
                  <span className="pl-btn__summary">
                    {shortEuro(product.versementConfig.initial.montant)} + {shortEuro(product.versementConfig.annuel.montant)}/an
                  </span>
                </button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {produit1 && produit2 && (
        <div className="pl-details-section">
          <div className="pl-details-toolbar">
            <label className="pl-details-toggle">
              <input
                type="checkbox"
                checked={showAllColumns}
                onChange={(event) => setShowAllColumns(event.target.checked)}
              />
              Afficher toutes les colonnes
            </label>
          </div>
          <div className="pl-details-scroll">
            <CollapsibleTable
              title={`Détail ${produit1.envelopeLabel}`}
              rows={detailRows1}
              columns={columnsProduit1}
              renderRow={renderEpargneRow(produit1, columnsProduit1)}
            />
          </div>
          <div className="pl-details-scroll">
            <CollapsibleTable
              title={`Détail ${produit2.envelopeLabel}`}
              rows={detailRows2}
              columns={columnsProduit2}
              renderRow={renderEpargneRow(produit2, columnsProduit2)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

