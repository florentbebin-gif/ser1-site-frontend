import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { IrFormSection } from './IrFormSection';
import type { IrFormSectionProps } from './irTypes';

const baseProps = {
  status: 'couple',
  setStatus: vi.fn(),
  isIsolated: false,
  setIsIsolated: vi.fn(),
  setIncomes: vi.fn(),
  setParts: vi.fn(),
  incomes: {
    d1: { salaries: 50000, associes62: 12000, pensions: 10000, bic: 4000, fonciers: 0, autres: 3000 },
    d2: { salaries: 35000, associes62: 9000, pensions: 7000, bic: 2500, fonciers: 0, autres: 1500 },
    capital: { withPs: 0, withoutPs: 0 },
    fonciersFoyer: 4200,
  },
  updateIncome: vi.fn(),
  formatMoneyInput: (v: number | null | undefined) => String(v || ''),
  realMode: { d1: 'abat10', d2: 'abat10' },
  setRealModeState: vi.fn(),
  realExpenses: { d1: 0, d2: 0 },
  setRealExpensesState: vi.fn(),
  abat10SalD1: 5000,
  abat10SalD2: 3500,
  psGeneralRate: 18.6,
  psExceptionRate: 17.2,
  fmtPct: (v: number) => String(v),
  capitalMode: 'pfu',
  setCapitalMode: vi.fn(),
  pfuRateIR: 12.8,
  deductions: 0,
  setDeductions: vi.fn(),
  credits: 0,
  setCredits: vi.fn(),
  abat10PensionsFoyer: 1700,
  euro0: (v: number) => `${v} EUR`,
  children: [],
  setChildren: vi.fn(),
  isExpert: true,
  incomeFilters: { tns: false, pension: false, foncier: false },
  setIncomeFilters: vi.fn(),
} satisfies IrFormSectionProps;

function renderSection(overrides: Partial<IrFormSectionProps> = {}) {
  return renderToStaticMarkup(
    <IrFormSection
      {...baseProps}
      {...overrides}
    />,
  );
}

describe('IrFormSection income filters UI', () => {
  it('renders the three filter buttons in simplified and expert mode', () => {
    const expertHtml = renderSection({ isExpert: true });
    const simplifiedHtml = renderSection({ isExpert: false });

    for (const html of [expertHtml, simplifiedHtml]) {
      expect(html).toContain('data-testid="ir-filter-tns"');
      expect(html).toContain('data-testid="ir-filter-pension"');
      expect(html).toContain('data-testid="ir-filter-foncier"');
    }
  });

  it('defaults to inactive filter buttons', () => {
    const html = renderSection();

    expect((html.match(/aria-pressed="false"/g) || []).length).toBe(3);
    expect(html).not.toContain('ir-income-filter-btn is-active');
  });

  it('reflects active/inactive states with aria-pressed and active class', () => {
    const html = renderSection({
      incomeFilters: { tns: false, pension: true, foncier: false },
    });

    expect((html.match(/aria-pressed="true"/g) || []).length).toBe(1);
    expect((html.match(/aria-pressed="false"/g) || []).length).toBe(2);
    expect((html.match(/ir-income-filter-btn is-active/g) || []).length).toBe(1);
  });

  it('hides TNS, Pension and Foncier rows when corresponding filters are disabled', () => {
    const html = renderSection({
      incomeFilters: { tns: false, pension: false, foncier: false },
      isExpert: false,
    });

    expect(html).not.toMatch(/Revenus des associ/);
    expect(html).not.toMatch(/BIC.*imposables/);
    expect(html).not.toMatch(/Pensions, retraites et rentes/);
    expect(html).not.toMatch(/pensions \(foyer\)/);
    expect(html).not.toMatch(/Revenus fonciers nets/);

    expect(html).toMatch(/Traitements et salaires/);
    expect(html).toMatch(/Autres revenus imposables/);
  });

  it('renders euro suffixes next to amount inputs and uses a plain 0 placeholder', () => {
    const html = renderSection({
      incomeFilters: { tns: true, pension: true, foncier: true },
    });

    expect(html).toContain('placeholder="0"');
    expect(html).not.toContain('placeholder="0 €"');
    expect(html).toContain('ir-table-input__unit');
  });
});
