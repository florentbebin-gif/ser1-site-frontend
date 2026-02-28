import React, { useEffect, useMemo, useState } from 'react';
import './IrSimulator.css';
import { onResetEvent, storageKeyFor } from '../../../utils/reset';
import { toNumber } from '../../../utils/number';
import { computeIrResult as computeIrResultEngine } from '../../../utils/irEngine.js';
import { useFiscalContext } from '../../../hooks/useFiscalContext';
import { DEFAULT_PS_SETTINGS } from '../../../constants/settingsDefaults';
import { useTheme } from '../../../settings/ThemeProvider';
import { ExportMenu } from '../../../components/ExportMenu';
import {
  computeAbattement10,
  computeEffectiveParts,
  computeExtraDeductions,
  countPersonsACharge,
} from '../../../engine/ir/adjustments.js';
import { useIrExportHandlers } from '../hooks/useIrExportHandlers';
import { IrFormSection } from './IrFormSection';
import { IrSidebarSection } from './IrSidebarSection';
import { IrDetailsSection } from './IrDetailsSection';
import { IrDisclaimer } from './IrDisclaimer';

const fmt0 = (n) => (Math.round(Number(n) || 0)).toLocaleString('fr-FR');
const euro0 = (n) => `${fmt0(n)} €`;
const fmtPct = (n) =>
  (Number(n) || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
const toNum = (v, def = 0) => toNumber(v, def);

const DEFAULT_INCOMES = {
  d1: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
  d2: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
  capital: { withPs: 0, withoutPs: 0 },
  fonciersFoyer: 0,
};

const formatMoneyInput = (n) => {
  const v = Math.round(Number(n) || 0);
  if (!v) return '';
  return v.toLocaleString('fr-FR');
};

export default function IrSimulatorContainer() {
  const { colors, cabinetLogo, logoPlacement, pptxColors } = useTheme();

  // Mode strict : n'affiche pas de résultat avant que Supabase ait répondu
  const { fiscalContext, loading: settingsLoading } = useFiscalContext({ strict: true });
  const taxSettings = fiscalContext._raw_tax;
  const psSettings = fiscalContext._raw_ps;

  const [yearKey, setYearKey] = useState('current');
  const [status, setStatus] = useState('couple');
  const [isIsolated, setIsIsolated] = useState(false);
  const [parts, setParts] = useState(0);
  const [location, setLocation] = useState('metropole');
  const [children, setChildren] = useState([]);

  const [incomes, setIncomes] = useState(DEFAULT_INCOMES);
  const [capitalMode, setCapitalMode] = useState('pfu');

  const [realMode, setRealMode] = useState({ d1: 'abat10', d2: 'abat10' });
  const [realExpenses, setRealExpenses] = useState({ d1: 0, d2: 0 });

  const [deductions, setDeductions] = useState(0);
  const [credits, setCredits] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const STORE_KEY = storageKeyFor('ir');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          setYearKey(s.yearKey ?? 'current');
          setStatus(s.status ?? 'couple');
          setIsIsolated(s.isIsolated ?? false);
          setParts(s.parts ?? 0);
          setLocation(s.location ?? 'metropole');
          setIncomes(
            s.incomes
              ? {
                  d1: { ...DEFAULT_INCOMES.d1, ...(s.incomes.d1 || {}) },
                  d2: { ...DEFAULT_INCOMES.d2, ...(s.incomes.d2 || {}) },
                  capital: { ...DEFAULT_INCOMES.capital, ...(s.incomes.capital || {}) },
                  fonciersFoyer: s.incomes.fonciersFoyer ?? 0,
                }
              : DEFAULT_INCOMES,
          );
          setRealMode(s.realMode ?? { d1: 'abat10', d2: 'abat10' });
          setRealExpenses(s.realExpenses ?? { d1: 0, d2: 0 });
          setDeductions(s.deductions ?? 0);
          setCredits(s.credits ?? 0);
          setCapitalMode(s.capitalMode ?? 'pfu');
          setChildren(Array.isArray(s.children) ? s.children : []);
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [STORE_KEY]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        STORE_KEY,
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
        }),
      );
    } catch {
      // ignore
    }
  }, [
    STORE_KEY,
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
  ]);

  useEffect(() => {
    const off = onResetEvent?.(({ simId }) => {
      if (simId && simId !== 'ir') return;

      setYearKey('current');
      setStatus('couple');
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

      try {
        sessionStorage.removeItem(STORE_KEY);
      } catch {
        // ignore
      }
    });

    return off || (() => {});
  }, [STORE_KEY]);

  const updateIncome = (who, field, value) => {
    setIncomes((prev) => ({
      ...prev,
      [who]: {
        ...prev[who],
        [field]: toNum(value, 0),
      },
    }));
  };

  const { effectiveParts } = computeEffectiveParts({
    status,
    isIsolated,
    children,
    manualParts: parts,
  });

  const abat10CfgRoot = taxSettings?.incomeTax?.abat10 || {};
  const abat10SalCfg = yearKey === 'current' ? abat10CfgRoot.current : abat10CfgRoot.previous;

  const baseSalD1 = (incomes.d1.salaries || 0) + (incomes.d1.associes62 || 0);
  const baseSalD2 = (incomes.d2.salaries || 0) + (incomes.d2.associes62 || 0);

  const abat10SalD1 = computeAbattement10(baseSalD1, abat10SalCfg);
  const abat10SalD2 = computeAbattement10(baseSalD2, abat10SalCfg);

  const cfgRet = yearKey === 'current' ? abat10CfgRoot.retireesCurrent : abat10CfgRoot.retireesPrevious;
  const baseRet = (incomes.d1.pensions || 0) + (status === 'couple' ? incomes.d2.pensions || 0 : 0);
  const abat10PensionsFoyer = computeAbattement10(baseRet, cfgRet);

  const extraDeductions = computeExtraDeductions({
    status,
    realMode,
    realExpenses,
    abat10SalD1,
    abat10SalD2,
  });

  const result = useMemo(
    () =>
      computeIrResultEngine({
        yearKey,
        status,
        isIsolated,
        parts: effectiveParts,
        location,
        incomes,
        deductions: deductions + extraDeductions,
        credits,
        taxSettings,
        psSettings,
        capitalMode,
        personsAChargeCount: countPersonsACharge(children),
      }),
    [
      yearKey,
      status,
      isIsolated,
      effectiveParts,
      location,
      incomes,
      deductions,
      extraDeductions,
      credits,
      taxSettings,
      psSettings,
      capitalMode,
      children,
    ],
  );

  const yearLabel = yearKey === 'current' ? taxSettings?.incomeTax?.currentYearLabel || '' : taxSettings?.incomeTax?.previousYearLabel || '';

  const tmiScale = yearKey === 'current' ? taxSettings?.incomeTax?.scaleCurrent || [] : taxSettings?.incomeTax?.scalePrevious || [];

  const pfuRateIR = toNum(taxSettings?.pfu?.[yearKey]?.rateIR, 12.8);
  const psPatrimonyRate = toNum(psSettings?.patrimony?.[yearKey]?.totalRate, DEFAULT_PS_SETTINGS.patrimony.current.totalRate);

  const { exportExcel, exportPowerPoint } = useIrExportHandlers({
    result,
    yearLabel,
    status,
    isIsolated,
    effectiveParts,
    location,
    incomes,
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
      <div className="ir-panel premium-page" data-testid="ir-page">
        <div className="ir-header premium-header" data-testid="ir-header">
          <div className="ir-title premium-title" data-testid="ir-title">
            Simulateur d'impôt sur le revenu
          </div>
        </div>
        <div className="ir-settings-loading" data-testid="ir-settings-loading">
          Chargement des paramètres fiscaux…
        </div>
      </div>
    );
  }

  return (
    <div className="ir-panel premium-page" data-testid="ir-page">
      <div className="ir-header premium-header" data-testid="ir-header">
        <div className="ir-title premium-title" data-testid="ir-title">
          Simulateur d'impôt sur le revenu
        </div>

        <ExportMenu
          options={[
            { label: 'Excel', onClick: exportExcel },
            { label: 'PowerPoint', onClick: exportPowerPoint },
          ]}
          loading={exportLoading}
        />
      </div>

      <div className="ir-grid premium-grid" data-testid="ir-grid">
        <IrFormSection
          taxSettings={taxSettings}
          yearKey={yearKey}
          setYearKey={setYearKey}
          status={status}
          setStatus={setStatus}
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
          psPatrimonyRate={psPatrimonyRate}
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
        />

        <IrSidebarSection
          location={location}
          setLocation={setLocation}
          status={status}
          isIsolated={isIsolated}
          setIsIsolated={setIsIsolated}
          children={children}
          setChildren={setChildren}
          effectiveParts={effectiveParts}
          parts={parts}
          setParts={setParts}
          tmiScale={tmiScale}
          result={result}
          euro0={euro0}
          fmtPct={fmtPct}
          pfuRateIR={pfuRateIR}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
        />
      </div>

      <IrDetailsSection
        showDetails={showDetails}
        result={result}
        euro0={euro0}
        fmtPct={fmtPct}
        pfuRateIR={pfuRateIR}
      />

      <IrDisclaimer isIsolated={isIsolated} />
    </div>
  );
}
