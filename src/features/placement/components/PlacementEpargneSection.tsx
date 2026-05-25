import React, { useEffect, useRef, useState } from 'react';
import { SimActionButton, SimCollapsibleTable } from '@/components/ui/sim';
import { IconChevronDown, IconLayers } from '@/icons/ui';
import { ENVELOPE_LABELS } from '@/engine/placement';
import type { CompareResult } from '@/engine/placement/types';
import { shortEuro } from '../utils/formatters';
import type {
  EpargneRowWithReinvest,
  PlacementProductDraft,
  PlacementSimulatorState,
} from '../utils/normalizers';
import type { PlacementTableProduct } from '../utils/tableHelpers';
import { PlacementNumberField } from './PlacementAmountControls';
import { PlacementToggle as Toggle } from './PlacementToggle';

interface PlacementEpargneSectionProps {
  state: PlacementSimulatorState;
  isExpert: boolean;
  setProduct: (_index: number, _patch: Partial<PlacementProductDraft>) => void;
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
  ) => (_row: EpargneRowWithReinvest, _index: number) => React.ReactElement;
  compareEnabled: boolean;
  setCompareEnabled: (_value: boolean) => void;
}

const envelopeLabels = ENVELOPE_LABELS as Record<string, string>;

const ALL_ENVELOPE_OPTIONS: [string, string][] = [
  ...Object.entries(ENVELOPE_LABELS),
  ['PER_BANCAIRE_UI', 'PER bancaire (CTO)'],
];

const ALL_ENVELOPE_LABELS: Record<string, string> = {
  ...envelopeLabels,
  PER_BANCAIRE_UI: 'PER bancaire (CTO)',
};

export function formatVersementConfigSummary(
  initialMontant: number,
  annualMontant: number,
  formatter: (value: number) => string = shortEuro,
) {
  const initialSummary = formatter(initialMontant);
  if (annualMontant > 0) {
    return `${initialSummary} + ${formatter(annualMontant)}/an`;
  }
  return initialSummary;
}

interface EnvelopePillSelectProps {
  envelope: string;
  colorClass: string;
  onSelect: (_envelope: string) => void;
}

function EnvelopePillSelect({ envelope, colorClass, onSelect }: EnvelopePillSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="pl-envelope-pill-wrapper">
      <button
        type="button"
        className={`pl-collabel ${colorClass}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {ALL_ENVELOPE_LABELS[envelope] ?? envelope}
        <IconChevronDown className="pl-envelope-pill__chevron" />
      </button>
      {open && (
        <div className="pl-envelope-menu" role="listbox">
          {ALL_ENVELOPE_OPTIONS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="option"
              aria-selected={key === envelope}
              className={`pl-envelope-menu__option${key === envelope ? ' is-selected' : ''}`}
              onClick={() => {
                onSelect(key);
                setOpen(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlacementEpargneSection({
  state,
  isExpert,
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
  compareEnabled,
  setCompareEnabled,
}: PlacementEpargneSectionProps) {
  const produit1Draft = state.products[0];
  const produit2Draft = state.products[1];
  const [table1Open, setTable1Open] = useState(false);
  const [table2Open, setTable2Open] = useState(false);
  const anyTableOpen = table1Open || table2Open;

  if (!produit1Draft || (compareEnabled && !produit2Draft)) return null;

  const showOptionBareme =
    isExpert &&
    (produit1Draft.envelope === 'CTO' || (compareEnabled && produit2Draft?.envelope === 'CTO'));

  return (
    <div className="premium-card premium-card--guide sim-card--guide">
      <div className="pl-card-header sim-card__header sim-card__header--bleed">
        <div className="pl-card-title-row sim-card__title-row">
          <span className="sim-card__icon">
            <IconLayers />
          </span>
          <h2 className="pl-card-title sim-card__title">Phase d'épargne</h2>
        </div>
        <p className="pl-card-subtitle sim-card__subtitle">
          Paramètres de constitution, versements et options fiscales des placements.
        </p>
      </div>
      <div className="sim-divider" />

      <table
        className={`pl-ir-table pl-table premium-table${!compareEnabled ? ' pl-table--single' : ''}`}
      >
        <thead>
          <tr>
            <th className="pl-rowlabel">Choix du placement</th>
            <th className="pl-colhead" aria-label="Produit 1">
              <div className="pl-colbadge-wrapper">
                <EnvelopePillSelect
                  envelope={
                    produit1Draft.perBancaire && produit1Draft.envelope === 'PER'
                      ? 'PER_BANCAIRE_UI'
                      : produit1Draft.envelope
                  }
                  colorClass="pl-collabel--product1"
                  onSelect={(env) => setProduct(0, { envelope: env })}
                />
              </div>
            </th>
            {compareEnabled && produit2Draft ? (
              <th className="pl-colhead" aria-label="Produit 2">
                <div className="pl-colbadge-wrapper">
                  <EnvelopePillSelect
                    envelope={
                      produit2Draft.perBancaire && produit2Draft.envelope === 'PER'
                        ? 'PER_BANCAIRE_UI'
                        : produit2Draft.envelope
                    }
                    colorClass="pl-collabel--product2"
                    onSelect={(env) => setProduct(1, { envelope: env })}
                  />
                  <SimActionButton
                    variant="delete"
                    mode="icon"
                    label="Retirer le 2e placement"
                    onClick={() => setCompareEnabled(false)}
                    ariaLabel="Retirer le 2e placement"
                    title="Retirer le 2e placement"
                    danger
                  />
                </div>
              </th>
            ) : (
              <th className="pl-colhead pl-colhead--add" aria-label="Ajouter un 2e placement">
                <SimActionButton
                  variant="add"
                  mode="icon"
                  label="Ajouter un 2e placement"
                  onClick={() => setCompareEnabled(true)}
                  ariaLabel="Ajouter un 2e placement"
                  title="Ajouter un 2e placement"
                />
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Durée de la phase épargne</td>
            {(compareEnabled ? state.products : state.products.slice(0, 1)).map(
              (product, index) => (
                <td key={index}>
                  <PlacementNumberField
                    value={product.dureeEpargne}
                    onChange={(value) => setProduct(index, { dureeEpargne: value ?? 1 })}
                    unit="ans"
                    min={1}
                    max={50}
                  />
                </td>
              ),
            )}
            {!compareEnabled && <td aria-hidden="true" />}
          </tr>

          {showOptionBareme && (
            <tr>
              <td>Option dividendes au barème IR</td>
              {(compareEnabled ? state.products : state.products.slice(0, 1)).map(
                (product, index) => (
                  <td key={index} className="pl-cell--center">
                    {product.envelope === 'CTO' ? (
                      <Toggle
                        checked={product.optionBaremeIR}
                        onChange={(value) => setProduct(index, { optionBaremeIR: value })}
                        ariaLabel={`Activer l’option dividendes au barème IR pour ${envelopeLabels[product.envelope]}`}
                      />
                    ) : (
                      <span className="pl-muted">-</span>
                    )}
                  </td>
                ),
              )}
              {!compareEnabled && <td aria-hidden="true" />}
            </tr>
          )}

          <tr>
            <td>
              Paramétrer les versements
              <div className="pl-detail-cumul">Initial, annuel, allocation, frais</div>
            </td>
            {(compareEnabled ? state.products : state.products.slice(0, 1)).map(
              (product, index) => (
                <td key={index}>
                  <SimActionButton
                    variant="edit"
                    mode="text"
                    label={formatVersementConfigSummary(
                      product.versementConfig.initial.montant,
                      product.versementConfig.annuel.montant,
                    )}
                    ariaLabel={`Paramétrer les versements du produit ${index + 1}`}
                    className="pl-config-action"
                    onClick={() => setModalOpen(index)}
                    data-testid={`placement-config-product-${index + 1}`}
                  />
                </td>
              ),
            )}
            {!compareEnabled && <td aria-hidden="true" />}
          </tr>
        </tbody>
      </table>

      {produit1 && (compareEnabled ? produit2 : true) && (
        <div className="pl-details-section">
          {anyTableOpen && isExpert && (
            <div className="pl-details-toolbar">
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
          )}

          {produit1 && (
            <div className="pl-details-scroll">
              <SimCollapsibleTable
                title={`Détail ${produit1.envelopeLabel}`}
                rows={detailRows1}
                columns={columnsProduit1}
                renderRow={renderEpargneRow(produit1, columnsProduit1)}
                tableClassName="pl-ir-table pl-detail-table"
                rowCountLabel={(count) => `${count} années`}
                onOpenChange={setTable1Open}
              />
            </div>
          )}

          {compareEnabled && produit2 && (
            <div className="pl-details-scroll">
              <SimCollapsibleTable
                title={`Détail ${produit2.envelopeLabel}`}
                rows={detailRows2}
                columns={columnsProduit2}
                renderRow={renderEpargneRow(produit2, columnsProduit2)}
                tableClassName="pl-ir-table pl-detail-table"
                rowCountLabel={(count) => `${count} années`}
                onOpenChange={setTable2Open}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
