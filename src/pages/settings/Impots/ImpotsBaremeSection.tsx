import type { Dispatch, ReactElement, SetStateAction } from 'react';
import {
  ImpotsBaremeYearColumn,
  type IncomeScaleKey,
  type IncomeTaxSettings,
  type ScaleFieldKey,
} from './ImpotsBaremeYearColumn';

interface ImpotsBaremeSectionProps {
  incomeTax: IncomeTaxSettings;
  updateField: (path: string[], value: string | number | null) => void;
  updateIncomeScale: (
    which: IncomeScaleKey,
    index: number,
    key: ScaleFieldKey,
    value: string | number | null,
  ) => void;
  isAdmin: boolean;
  openSection: string | null;
  setOpenSection: Dispatch<SetStateAction<string | null>>;
}

export default function ImpotsBaremeSection({
  incomeTax,
  updateField,
  updateIncomeScale,
  isAdmin,
  openSection,
  setOpenSection,
}: ImpotsBaremeSectionProps): ReactElement {
  const isOpen = openSection === 'bareme';

  return (
    <div className="fisc-acc-item">
      <button
        type="button"
        className="fisc-acc-header"
        id="impots-header-bareme"
        aria-expanded={isOpen}
        aria-controls="impots-panel-bareme"
        onClick={() => setOpenSection(isOpen ? null : 'bareme')}
      >
        <span className="settings-premium-title settings-premium-title--flush">
          {"Bar\u00e8me de l\u2019imp\u00f4t sur le revenu"}
        </span>
        <span className="fisc-acc-chevron">
          {isOpen ? '\u25be' : '\u25b8'}
        </span>
      </button>

      {isOpen && (
        <div
          className="fisc-acc-body"
          id="impots-panel-bareme"
          role="region"
          aria-labelledby="impots-header-bareme"
        >
          <p style={{ fontSize: 13, color: 'var(--color-c9)', marginBottom: 8 }}>
            {
              'Bar\u00e8me progressif par tranches (taux et retraitement) pour le bar\u00e8me actuel et celui de l\u2019ann\u00e9e pr\u00e9c\u00e9dente.'
            }
          </p>

          <div className="income-tax-columns">
            <ImpotsBaremeYearColumn
              yearLabel={incomeTax.currentYearLabel}
              yearLabelKey="currentYearLabel"
              scaleKey="scaleCurrent"
              periodKey="current"
              retireesKey="retireesCurrent"
              placeholder="Ex: 2026 (revenus 2025)"
              incomeTax={incomeTax}
              updateField={updateField}
              updateIncomeScale={updateIncomeScale}
              isAdmin={isAdmin}
            />
            <ImpotsBaremeYearColumn
              yearLabel={incomeTax.previousYearLabel}
              yearLabelKey="previousYearLabel"
              scaleKey="scalePrevious"
              periodKey="previous"
              retireesKey="retireesPrevious"
              placeholder="Ex: 2025 (revenus 2024)"
              incomeTax={incomeTax}
              updateField={updateField}
              updateIncomeScale={updateIncomeScale}
              isAdmin={isAdmin}
              className="income-tax-col-right"
            />
          </div>
        </div>
      )}
    </div>
  );
}
