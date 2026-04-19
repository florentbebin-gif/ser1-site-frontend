import { useEffect, useMemo, useState } from 'react';
import '@/styles/sim/index.css';
import '../styles/index.css';
import { onResetEvent, storageKeyFor } from '../../../utils/reset';
import { toNumber } from '../../../utils/number';
import { computeIrResult as computeIrResultEngine } from '../../../engine/ir/compute';
import { useFiscalContext } from '../../../hooks/useFiscalContext';
import { DEFAULT_PS_SETTINGS } from '../../../constants/settingsDefaults';
import { useTheme } from '../../../settings/ThemeProvider';
import { useUserMode, type UserMode } from '../../../settings/userMode';
import { ExportMenu } from '../../../components/ExportMenu';
import { ModeToggle } from '../../../components/ModeToggle';
import { SimPageShell } from '@/components/ui/sim';
import {
  computeAbattement10,
  computeEffectiveParts,
  computeExtraDeductions,
  countPersonsACharge,
} from '../../../engine/ir/adjustments';
import { useIrExportHandlers } from '../hooks/useIrExportHandlers';
import {
  applyIncomeFilters,
  DEFAULT_INCOME_FILTERS,
  hasTaxableIncomeEntries,
  normalizeIncomeFilters,
  type IncomeFilters,
  type IrIncomes,
} from '../utils/incomeFilters';
import { IrFormSection } from './IrFormSection';
import { IrSidebarSection } from './IrSidebarSection';
import { IrDetailsSection } from './IrDetailsSection';
import { IrDisclaimer } from './IrDisclaimer';
import type {
  IrCapitalMode,
  IrChildDraft,
  IrComputedResult,
  IrIncomeTarget,
  IrLocation,
  IrRealExpenses,
  IrRealMode,
  IrScaleRow,
  IrStatus,
  IrYearKey,
} from './irTypes';

interface IrPersistedState {
  yearKey?: IrYearKey;
  status?: IrStatus | null;
  isIsolated?: boolean;
  parts?: number;
  location?: IrLocation;
  incomes?: Partial<IrIncomes>;
  realMode?: Partial<IrRealMode>;
  realExpenses?: Partial<IrRealExpenses>;
  deductions?: number;
  credits?: number;
  capitalMode?: IrCapitalMode;
  children?: IrChildDraft[];
  incomeFilters?: Partial<IncomeFilters>;
}

const fmt0 = (value: number | null | undefined): string =>
  Math.round(Number(value) || 0).toLocaleString('fr-FR');

const euro0 = (value: number): string => `${fmt0(value)} \u20AC`;

const fmtPct = (value: number): string =>
  (Number(value) || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });

const toNum = (value: unknown, fallback = 0): number => toNumber(value, fallback);

const DEFAULT_INCOMES: IrIncomes = {
  d1: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
  d2: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
  capital: { withPs: 0, withoutPs: 0 },
  fonciersFoyer: 0,
};

const formatMoneyInput = (value: number | null | undefined): string => {
  const roundedValue = Math.round(Number(value) || 0);
  if (!roundedValue) return '';
  return roundedValue.toLocaleString('fr-FR');
};

export default function IrSimulatorContainer() {
  const { colors, cabinetLogo, logoPlacement, pptxColors } = useTheme();

  const { mode } = useUserMode();
  const [localMode, setLocalMode] = useState<UserMode | null>(null);
  const isExpert = (localMode ?? mode) === 'expert';
  const toggleMode = () => setLocalMode(isExpert ? 'simplifie' : 'expert');

  const { fiscalContext, loading: settingsLoading } = useFiscalContext({ strict: true });
  const taxSettings = fiscalContext._raw_tax;
  const psSettings = fiscalContext._raw_ps;

  const [yearKey, setYearKey] = useState<IrYearKey>('current');
  const [status, setStatus] = useState<IrStatus | null>(null);
  const [isIsolated, setIsIsolated] = useState(false);
  const [parts, setParts] = useState(0);
  const [location, setLocation] = useState<IrLocation>('metropole');
  const [children, setChildren] = useState<IrChildDraft[]>([]);

  const [incomes, setIncomes] = useState<IrIncomes>(DEFAULT_INCOMES);
  const [incomeFilters, setIncomeFilters] = useState<IncomeFilters>(() => ({ ...DEFAULT_INCOME_FILTERS }));
  const [capitalMode, setCapitalMode] = useState<IrCapitalMode>('pfu');

  const [realMode, setRealMode] = useState<IrRealMode>({ d1: 'abat10', d2: 'abat10' });
  const [realExpenses, setRealExpenses] = useState<IrRealExpenses>({ d1: 0, d2: 0 });

  const [deductions, setDeductions] = useState(0);
  const [credits, setCredits] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const storeKey = storageKeyFor('ir');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storeKey);
      if (raw) {
        const persistedState = JSON.parse(raw) as IrPersistedState;
        if (persistedState && typeof persistedState === 'object') {
          setYearKey(persistedState.yearKey ?? 'current');
          setStatus(persistedState.status ?? null);
          setIsIsolated(persistedState.isIsolated ?? false);
          setParts(persistedState.parts ?? 0);
          setLocation(persistedState.location ?? 'metropole');
          setIncomes(
            persistedState.incomes
              ? {
                  d1: { ...DEFAULT_INCOMES.d1, ...(persistedState.incomes.d1 || {}) },
                  d2: { ...DEFAULT_INCOMES.d2, ...(persistedState.incomes.d2 || {}) },
                  capital: { ...DEFAULT_INCOMES.capital, ...(persistedState.incomes.capital || {}) },
                  fonciersFoyer: persistedState.incomes.fonciersFoyer ?? 0,
                }
              : DEFAULT_INCOMES,
          );
          setRealMode({
            d1: persistedState.realMode?.d1 ?? 'abat10',
            d2: persistedState.realMode?.d2 ?? 'abat10',
          });
          setRealExpenses({
            d1: persistedState.realExpenses?.d1 ?? 0,
            d2: persistedState.realExpenses?.d2 ?? 0,
          });
          setDeductions(persistedState.deductions ?? 0);
          setCredits(persistedState.credits ?? 0);
          setCapitalMode(persistedState.capitalMode ?? 'pfu');
          setChildren(Array.isArray(persistedState.children) ? persistedState.children : []);
          setIncomeFilters(normalizeIncomeFilters(persistedState.incomeFilters));
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [storeKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        storeKey,
        JSON.stringify({
          yearKey,
          status,
          isIsolated,
          parts,
          location,
          incomes,
          realMode,
          realExpenses,
          deductions,
          credits,
          capitalMode,
          children,
          incomeFilters,
        }),
      );
    } catch {
      // ignore
    }
  }, [
    storeKey,
    hydrated,
    yearKey,
    status,
    isIsolated,
    parts,
    location,
    incomes,
    realMode,
    realExpenses,
    deductions,
    credits,
    capitalMode,
    children,
    incomeFilters,
  ]);

  useEffect(() => {
    const off = onResetEvent?.(({ simId }: { simId?: string }) => {
      if (simId && simId !== 'ir') return;

      setYearKey('current');
      setStatus(null);
      setIsIsolated(false);
      setParts(0);
      setLocation('metropole');
      setIncomes(DEFAULT_INCOMES);
      setChildren([]);
      setDeductions(0);
      setCredits(0);
      setRealMode({ d1: 'abat10', d2: 'abat10' });
      setRealExpenses({ d1: 0, d2: 0 });
      setCapitalMode('pfu');
      setIncomeFilters({ ...DEFAULT_INCOME_FILTERS });

      try {
        sessionStorage.removeItem(storeKey);
      } catch {
        // ignore
      }
    });

    return off || (() => {});
  }, [storeKey]);

  const updateIncome = (who: IrIncomeTarget, field: string, value: number) => {
    setIncomes((prev) => ({
      ...prev,
      [who]: {
        ...(prev[who] as Record<string, number | undefined>),
        [field]: toNum(value, 0),
      },
    } as IrIncomes));
  };

  const effectiveIncomes = useMemo(
    () => applyIncomeFilters(incomes, incomeFilters),
    [incomes, incomeFilters],
  );
  const showSummaryCard = useMemo(() => hasTaxableIncomeEntries(incomes), [incomes]);

  const { effectiveParts } = computeEffectiveParts({
    status: status ?? 'single',
    isIsolated,
    children,
    manualParts: parts,
  });

  const abat10CfgRoot = taxSettings?.incomeTax?.abat10 || {};
  const abat10SalCfg = yearKey === 'current' ? abat10CfgRoot.current : abat10CfgRoot.previous;

  const baseSalD1 = (effectiveIncomes.d1.salaries || 0) + (effectiveIncomes.d1.associes62 || 0);
  const baseSalD2 = (effectiveIncomes.d2.salaries || 0) + (effectiveIncomes.d2.associes62 || 0);

  const abat10SalD1 = computeAbattement10(baseSalD1, abat10SalCfg);
  const abat10SalD2 = computeAbattement10(baseSalD2, abat10SalCfg);

  const cfgRet = yearKey === 'current' ? abat10CfgRoot.retireesCurrent : abat10CfgRoot.retireesPrevious;
  const baseRet =
    (effectiveIncomes.d1.pensions || 0) +
    (status === 'couple' ? effectiveIncomes.d2.pensions || 0 : 0);
  const abat10PensionsFoyer = computeAbattement10(baseRet, cfgRet);

  const extraDeductions = computeExtraDeductions({
    status: status ?? 'single',
    realMode,
    realExpenses,
    abat10SalD1,
    abat10SalD2,
  });

  const result = useMemo<IrComputedResult | null>(
    () => {
      if (!status) return null;
      return computeIrResultEngine({
        yearKey,
        status,
        isIsolated,
        parts: effectiveParts,
        location,
        incomes: isExpert
          ? effectiveIncomes
          : { ...effectiveIncomes, capital: { withPs: 0, withoutPs: 0 } },
        deductions: (isExpert ? deductions : 0) + extraDeductions,
        credits: isExpert ? credits : 0,
        taxSettings,
        psSettings,
        capitalMode,
        personsAChargeCount: countPersonsACharge(children),
      });
    },
    [
      yearKey,
      status,
      isIsolated,
      effectiveParts,
      location,
      effectiveIncomes,
      isExpert,
      deductions,
      extraDeductions,
      credits,
      taxSettings,
      psSettings,
      capitalMode,
      children,
    ],
  );

  const yearLabel =
    yearKey === 'current'
      ? taxSettings?.incomeTax?.currentYearLabel || ''
      : taxSettings?.incomeTax?.previousYearLabel || '';

  const tmiScale: IrScaleRow[] =
    yearKey === 'current'
      ? taxSettings?.incomeTax?.scaleCurrent || []
      : taxSettings?.incomeTax?.scalePrevious || [];

  const pfuRateIR = toNum(taxSettings?.pfu?.[yearKey]?.rateIR, 12.8);
  const psGeneralRate = toNum(
    psSettings?.patrimony?.[yearKey]?.generalRate,
    DEFAULT_PS_SETTINGS.patrimony.current.generalRate,
  );
  const psExceptionRate = toNum(
    psSettings?.patrimony?.[yearKey]?.exceptionRate,
    DEFAULT_PS_SETTINGS.patrimony.current.exceptionRate,
  );

  const { exportExcel, exportPowerPoint } = useIrExportHandlers({
    result,
    yearLabel,
    status: status ?? 'single',
    isIsolated,
    effectiveParts,
    location,
    incomes: effectiveIncomes,
    capitalMode,
    realMode,
    realExpenses,
    deductions,
    credits,
    colors,
    cabinetLogo,
    logoPlacement,
    pptxColors,
    setExportLoading,
  });

  if (settingsLoading) {
    return (
      <SimPageShell
        title="Simulateur d&apos;imp&ocirc;t sur le revenu"
        subtitle="Estimez votre imp&ocirc;t sur le revenu et vos pr&eacute;l&egrave;vements sociaux."
        pageTestId="ir-page"
        headerTestId="ir-header"
        titleTestId="ir-title"
        statusTestId="ir-settings-loading"
        loading
        loadingContent={(
          <div className="ir-settings-loading">
            Chargement des param&egrave;tres fiscaux&hellip;
          </div>
        )}
      />
    );
  }

  return (
    <SimPageShell
      title="Simulateur d&apos;imp&ocirc;t sur le revenu"
      subtitle="Estimez votre imp&ocirc;t sur le revenu et vos pr&eacute;l&egrave;vements sociaux."
      pageTestId="ir-page"
      headerTestId="ir-header"
      titleTestId="ir-title"
      mobileSideFirst
      actions={(
        <>
          <ModeToggle value={isExpert} onChange={() => toggleMode()} testId="ir-mode-btn" />
          <ExportMenu
            options={[
              { label: 'Excel', onClick: exportExcel },
              { label: 'PowerPoint', onClick: exportPowerPoint },
            ]}
            loading={exportLoading}
          />
        </>
      )}
    >
      <SimPageShell.Main>
        <IrFormSection
          status={status}
          setStatus={setStatus}
          isIsolated={isIsolated}
          setIsIsolated={setIsIsolated}
          setIncomes={setIncomes}
          setParts={setParts}
          incomes={incomes}
          updateIncome={updateIncome}
          formatMoneyInput={formatMoneyInput}
          realMode={realMode}
          setRealModeState={setRealMode}
          realExpenses={realExpenses}
          setRealExpensesState={setRealExpenses}
          abat10SalD1={abat10SalD1}
          abat10SalD2={abat10SalD2}
          psGeneralRate={psGeneralRate}
          psExceptionRate={psExceptionRate}
          fmtPct={fmtPct}
          capitalMode={capitalMode}
          setCapitalMode={setCapitalMode}
          pfuRateIR={pfuRateIR}
          deductions={deductions}
          setDeductions={setDeductions}
          credits={credits}
          setCredits={setCredits}
          abat10PensionsFoyer={abat10PensionsFoyer}
          euro0={euro0}
          isExpert={isExpert}
          children={children}
          setChildren={setChildren}
          incomeFilters={incomeFilters}
          setIncomeFilters={setIncomeFilters}
        />
      </SimPageShell.Main>

      <SimPageShell.Side sticky={false}>
        <IrSidebarSection
          yearKey={yearKey}
          setYearKey={setYearKey}
          taxSettings={taxSettings}
          location={location}
          setLocation={setLocation}
          setParts={setParts}
          tmiScale={tmiScale}
          result={result}
          euro0={euro0}
          fmtPct={fmtPct}
          pfuRateIR={pfuRateIR}
          isExpert={isExpert}
          showSummaryCard={showSummaryCard}
          hasSituation={status !== null}
        />
      </SimPageShell.Side>

      <SimPageShell.Section>
        <>
          {result && (
            <div className="ir-detail-card premium-card" data-testid="ir-detail-accordion">
              <div className="ir-detail-header">
                <h3 className="ir-detail-title">D&eacute;tail du calcul</h3>
                <button
                  type="button"
                  className="ir-detail-toggle"
                  aria-expanded={showDetails}
                  onClick={() => setShowDetails((value) => !value)}
                  data-testid="ir-detail-toggle"
                >
                  {showDetails ? 'Masquer' : 'Afficher'}
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`ir-detail-chevron${showDetails ? ' is-open' : ''}`}
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
              {showDetails && (
                <IrDetailsSection
                  result={result}
                  euro0={euro0}
                  fmtPct={fmtPct}
                  pfuRateIR={pfuRateIR}
                />
              )}
            </div>
          )}

          <IrDisclaimer isIsolated={isIsolated} />
        </>
      </SimPageShell.Section>
    </SimPageShell>
  );
}
