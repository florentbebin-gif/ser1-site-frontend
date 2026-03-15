/**
 * Placement Table Components - CollapsibleTable et AllocationSlider
 */

import React, { useState } from 'react';

interface CollapsibleTableProps<Row> {
  title: string;
  rows: Row[] | null | undefined;
  columns: string[];
  renderRow: (_row: Row, _index: number) => React.ReactElement;
  onOpenChange?: (_open: boolean) => void;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`pl-collapsible__chevron${open ? ' is-open' : ''}`}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function CollapsibleTable<Row>({
  title,
  rows,
  columns,
  renderRow,
  onOpenChange,
}: CollapsibleTableProps<Row>) {
  const [open, setOpen] = useState(false);
  if (!rows || rows.length === 0) return null;

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <div className="pl-collapsible">
      <button
        type="button"
        className="pl-collapsible__toggle"
        onClick={handleToggle}
        aria-expanded={open}
      >
        <span>{title} ({rows.length} années)</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <table className="pl-ir-table pl-detail-table">
          <thead>
            <tr>
              {columns.map((column, index) => <th key={index}>{column}</th>)}
            </tr>
          </thead>
          <tbody>{rows.map((row, index) => renderRow(row, index))}</tbody>
        </table>
      )}
    </div>
  );
}

interface AllocationSliderProps {
  pctCapi: number;
  pctDistrib: number;
  onChange: (_pctCapi: number, _pctDistrib: number) => void;
  disabled?: boolean;
  isSCPI?: boolean;
}

export function AllocationSlider({
  pctCapi,
  pctDistrib,
  onChange,
  disabled,
  isSCPI,
}: AllocationSliderProps) {
  const handleCapiChange = (nextPctCapi: number) => {
    const clamped = Math.min(100, Math.max(0, nextPctCapi));
    onChange(clamped, 100 - clamped);
  };

  if (isSCPI) {
    return (
      <div className="pl-alloc-fixed">
        <span className="pl-alloc-badge pl-alloc-badge--distrib">100% Distribution</span>
        <span className="pl-alloc-hint">SCPI : distribution uniquement</span>
      </div>
    );
  }

  return (
    <div className="pl-alloc-slider">
      <div className="pl-alloc-labels">
        <span className="pl-alloc-label">Capitalisation</span>
        <span className="pl-alloc-label">Distribution</span>
      </div>

      <div className="pl-alloc-track">
        <input
          type="range"
          min="0"
          max="100"
          value={pctCapi}
          onChange={(event) => handleCapiChange(Number(event.target.value))}
          className="pl-alloc-range"
          disabled={disabled}
        />
        <div className="pl-alloc-fill" style={{ width: `${pctCapi}%` }} />
        <div className="pl-alloc-thumb" style={{ left: `${pctCapi}%` }} aria-hidden="true" />
      </div>

      <div className="pl-alloc-values">
        <div className="pl-alloc-value">
          <input
            type="number"
            min="0"
            max="100"
            value={pctCapi}
            onChange={(event) => handleCapiChange(Number(event.target.value))}
            className="pl-alloc-input"
            disabled={disabled}
          />
          <span>%</span>
        </div>

        <div className="pl-alloc-value">
          <input
            type="number"
            min="0"
            max="100"
            value={pctDistrib}
            onChange={(event) => handleCapiChange(100 - Number(event.target.value))}
            className="pl-alloc-input"
            disabled={disabled}
          />
          <span>%</span>
        </div>
      </div>
    </div>
  );
}
