/**
 * Placement Table Components - CollapsibleTable et AllocationSlider
 */

import React, { useEffect, useRef, useState } from 'react';
import { SimAmountInputPercent } from '@/components/ui/sim';
import { IconChevronDown } from '@/icons/ui';

interface CollapsibleTableProps<Row> {
  title: string;
  rows: Row[] | null | undefined;
  columns: string[];
  renderRow: (_row: Row, _index: number) => React.ReactElement;
  onOpenChange?: (_open: boolean) => void;
}

function ChevronIcon({ open }: { open: boolean }) {
  return <IconChevronDown className={`pl-collapsible__chevron${open ? ' is-open' : ''}`} />;
}

export function CollapsibleTable<Row>({
  title,
  rows,
  columns,
  renderRow,
  onOpenChange,
}: CollapsibleTableProps<Row>) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const wrap = scrollRef.current;
    const top = topRef.current;
    if (!wrap || !top) return;
    const spacer = top.firstElementChild as HTMLElement;
    if (spacer) spacer.style.width = `${wrap.scrollWidth}px`;
    const onTop = () => {
      wrap.scrollLeft = top.scrollLeft;
    };
    const onWrap = () => {
      top.scrollLeft = wrap.scrollLeft;
    };
    top.addEventListener('scroll', onTop);
    wrap.addEventListener('scroll', onWrap);
    return () => {
      top.removeEventListener('scroll', onTop);
      wrap.removeEventListener('scroll', onWrap);
    };
  }, [open]);

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
        <span>
          {title} ({rows.length} années)
        </span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <>
          <div ref={topRef} className="pl-table-top-scroll">
            <div />
          </div>
          <div ref={scrollRef} className="pl-table-scroll-wrap">
            <table className="pl-ir-table pl-detail-table">
              <thead>
                <tr>
                  {columns.map((column, index) => (
                    <th key={index}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{rows.map((row, index) => renderRow(row, index))}</tbody>
            </table>
          </div>
        </>
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
  compact?: boolean;
  readOnly?: boolean;
}

export function AllocationSlider({
  pctCapi,
  pctDistrib,
  onChange,
  disabled,
  isSCPI,
  compact,
  readOnly,
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
    <div className={`pl-alloc-slider${compact ? ' pl-alloc-slider--compact' : ''}`}>
      {!compact && (
        <div className="pl-alloc-labels">
          <span className="pl-alloc-label">Capitalisation</span>
          <span className="pl-alloc-label">Distribution</span>
        </div>
      )}

      <div className="pl-alloc-track">
        <input
          type="range"
          min="0"
          max="100"
          value={pctDistrib}
          onChange={(event) => handleCapiChange(100 - Number(event.target.value))}
          className="pl-alloc-range"
          disabled={disabled}
        />
        <div className="pl-alloc-fill" style={{ width: `${pctDistrib}%` }} />
        <div className="pl-alloc-thumb" style={{ left: `${pctDistrib}%` }} aria-hidden="true" />
      </div>

      {!compact ? (
        <div className="pl-alloc-values">
          {readOnly ? (
            <>
              <span className="pl-alloc-value-text">{pctCapi}%</span>
              <span className="pl-alloc-value-text">{pctDistrib}%</span>
            </>
          ) : (
            <>
              <div className="pl-alloc-value">
                <SimAmountInputPercent
                  value={pctCapi}
                  min={0}
                  max={100}
                  className="pl-alloc-input"
                  fieldClassName="pl-alloc-input-field"
                  rowClassName="pl-alloc-input-row"
                  unitClassName="pl-alloc-input-unit"
                  disabled={disabled}
                  onChange={handleCapiChange}
                />
              </div>

              <div className="pl-alloc-value">
                <SimAmountInputPercent
                  value={pctDistrib}
                  min={0}
                  max={100}
                  className="pl-alloc-input"
                  fieldClassName="pl-alloc-input-field"
                  rowClassName="pl-alloc-input-row"
                  unitClassName="pl-alloc-input-unit"
                  disabled={disabled}
                  onChange={(value) => handleCapiChange(100 - value)}
                />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="pl-alloc-values pl-alloc-values--compact">
          <span>{pctCapi}% C</span>
          <span>{pctDistrib}% D</span>
        </div>
      )}
    </div>
  );
}
