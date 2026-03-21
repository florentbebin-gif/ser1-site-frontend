import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { IrSidebarSection } from './IrSidebarSection';
import type { IrSidebarSectionProps } from './irTypes';

const baseProps = {
  yearKey: 'current',
  setYearKey: vi.fn(),
  taxSettings: {
    incomeTax: {
      currentYearLabel: '2026',
      previousYearLabel: '2025',
    },
  },
  location: 'metropole',
  setLocation: vi.fn(),
  setParts: vi.fn(),
  tmiScale: [{ rate: 0 }, { rate: 11 }, { rate: 30 }, { rate: 41 }, { rate: 45 }],
  result: {
    tmiRate: 30,
    irNet: 12000,
    tmiBaseGlobal: 50000,
    tmiMarginGlobal: 1000,
    partsNb: 2,
    taxableIncome: 70000,
    taxablePerPart: 35000,
    pfuIr: 0,
    cehr: 0,
    cdhr: 0,
    psFoncier: 0,
    psDividends: 0,
    totalTax: 12000,
    totalIncome: 70000,
  },
  euro0: (value: number) => `${value} EUR`,
  fmtPct: (value: number) => String(value),
  pfuRateIR: 12.8,
  isExpert: true,
  showSummaryCard: true,
  hasSituation: true,
} satisfies IrSidebarSectionProps;

function renderSidebar(overrides: Partial<IrSidebarSectionProps> = {}) {
  return renderToStaticMarkup(<IrSidebarSection {...baseProps} {...overrides} />);
}

describe('IrSidebarSection', () => {
  it('hides the summary card when there is no taxable income entry', () => {
    const html = renderSidebar({ showSummaryCard: false });

    expect(html).not.toContain('data-testid="ir-summary-card"');
    expect(html).toContain('data-testid="ir-results-card"');
  });

  it('renders the summary card when taxable income entries exist', () => {
    const html = renderSidebar();

    expect(html).toContain('data-testid="ir-summary-card"');
    expect(html).toContain('Nombre de parts');
  });
});
