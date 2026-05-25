/**
 * Placement Table Components - AllocationSlider
 */

import { SimAmountInputPercent } from '@/components/ui/sim';

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
