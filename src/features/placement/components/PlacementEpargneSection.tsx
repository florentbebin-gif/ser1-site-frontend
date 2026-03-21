import React, { useEffect, useRef, useState } from 'react';
import { ENVELOPE_LABELS } from '@/engine/placement';
import type { CompareResult } from '@/engine/placement/types';
import { shortEuro } from '../utils/formatters';
import type {
  EpargneRowWithReinvest,
  PlacementProductDraft,
  PlacementSimulatorState,
} from '../utils/normalizers';
import type { PlacementTableProduct } from '../utils/tableHelpers';
import { InputNumber, Toggle } from './inputs';
import { CollapsibleTable } from './tables';

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
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
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

function SettingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 8.92 4a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.17.51.66.96 1.2 1H21a2 2 0 0 1 0 4h-.09c-.54.04-1.03.49-1.51 1Z" />
    </svg>
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
}: PlacementEpargneSectionProps) {
  const showOptionBareme = isExpert
    && (state.products[0].envelope === 'CTO' || state.products[1].envelope === 'CTO');

  const [table1Open, setTable1Open] = useState(false);
  const [table2Open, setTable2Open] = useState(false);
  const anyTableOpen = table1Open || table2Open;

  return (
    <div className="premium-card">
      <div className="pl-card-title">Phase d'épargne</div>

      <table className="pl-ir-table pl-table premium-table">
        <thead>
          <tr>
            <th />
            <th className="pl-colhead" aria-label="Produit 1">
              <div className="pl-colbadge-wrapper">
                <EnvelopePillSelect
                  envelope={state.products[0].perBancaire && state.products[0].envelope === 'PER' ? 'PER_BANCAIRE_UI' : state.products[0].envelope}
                  colorClass="pl-collabel--product1"
                  onSelect={(env) => setProduct(0, { envelope: env })}
                />
              </div>
            </th>
            <th className="pl-colhead" aria-label="Produit 2">
              <div className="pl-colbadge-wrapper">
                <EnvelopePillSelect
                  envelope={state.products[1].perBancaire && state.products[1].envelope === 'PER' ? 'PER_BANCAIRE_UI' : state.products[1].envelope}
                  colorClass="pl-collabel--product2"
                  onSelect={(env) => setProduct(1, { envelope: env })}
                />
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Durée de la phase épargne</td>
            {state.products.map((product, index) => (
              <td key={index}>
                <InputNumber
                  value={product.dureeEpargne}
                  onChange={(value) => setProduct(index, { dureeEpargne: value ?? 1 })}
                  unit="ans"
                  min={1}
                  max={50}
                />
              </td>
            ))}
          </tr>

          {showOptionBareme && (
            <tr>
              <td>Option dividendes au barème IR</td>
              {state.products.map((product, index) => (
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
                <button
                  type="button"
                  className="pl-btn pl-btn--config"
                  onClick={() => setModalOpen(index)}
                  data-testid={`placement-config-product-${index + 1}`}
                >
                  <span className="pl-btn__icon">
                    <SettingsIcon />
                  </span>
                  <span className="pl-btn__summary">
                    {formatVersementConfigSummary(
                      product.versementConfig.initial.montant,
                      product.versementConfig.annuel.montant,
                    )}
                  </span>
                </button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {produit1 && produit2 && (
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

          <div className="pl-details-scroll">
            <CollapsibleTable
              title={`Détail ${produit1.envelopeLabel}`}
              rows={detailRows1}
              columns={columnsProduit1}
              renderRow={renderEpargneRow(produit1, columnsProduit1)}
              onOpenChange={setTable1Open}
            />
          </div>

          <div className="pl-details-scroll">
            <CollapsibleTable
              title={`Détail ${produit2.envelopeLabel}`}
              rows={detailRows2}
              columns={columnsProduit2}
              renderRow={renderEpargneRow(produit2, columnsProduit2)}
              onOpenChange={setTable2Open}
            />
          </div>
        </div>
      )}
    </div>
  );
}
