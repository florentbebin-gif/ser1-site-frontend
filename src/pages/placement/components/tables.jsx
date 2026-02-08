/**
 * Placement Table Components — CollapsibleTable et AllocationSlider
 */

import React, { useState } from 'react';

// ─── CollapsibleTable ────────────────────────────────────────────────

export function CollapsibleTable({ title, rows, columns, renderRow }) {
  const [open, setOpen] = useState(false);
  if (!rows || rows.length === 0) return null;
  return (
    <div className="pl-collapsible">
      <button className="pl-collapsible__toggle" onClick={() => setOpen(!open)}>
        {open ? '▼' : '▶'} {title} ({rows.length} années)
      </button>
      {open && (
        <table className="ir-table pl-detail-table">
          <thead>
            <tr>
              {columns.map((c, i) => <th key={i}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => renderRow(r, i))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── AllocationSlider ────────────────────────────────────────────────

export function AllocationSlider({ pctCapi, pctDistrib, onChange, disabled, isSCPI }) {
  const handleCapiChange = (pctCapi) => {
    onChange(pctCapi, 100 - pctCapi);
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
          onChange={(e) => handleCapiChange(Number(e.target.value))}
          className="pl-alloc-range"
          disabled={disabled}
        />
        <div className="pl-alloc-fill" style={{ width: `${pctCapi}%` }} />
      </div>
      <div className="pl-alloc-values">
        <div className="pl-alloc-value">
          <input
            type="number"
            min="0"
            max="100"
            value={pctCapi}
            onChange={(e) => handleCapiChange(Number(e.target.value))}
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
            onChange={(e) => handleCapiChange(100 - Number(e.target.value))}
            className="pl-alloc-input"
            disabled={disabled}
          />
          <span>%</span>
        </div>
      </div>
    </div>
  );
}
