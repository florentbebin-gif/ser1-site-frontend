/**
 * Hook useIr - Gestion de l'état du simulateur IR
 * 
 * Isole tout le state, les calculs et la persistence du simulateur IR.
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { onResetEvent, storageKeyFor } from '../../../utils/reset';
import { toNumber } from '../../../utils/number';
import { computeIrResult } from '../../../utils/irEngine.js';
import { getFiscalSettings, addInvalidationListener } from '../../../utils/fiscalSettingsCache.js';
import {
  computeAbattement10,
  computeEffectiveParts,
  computeExtraDeductions,
  countPersonsACharge,
} from '../../../engine/ir/adjustments.js';
import { DEFAULT_PS_SETTINGS } from '../../../constants/settingsDefaults';

// Helpers formats
const toNum = (v: any, def = 0) => toNumber(v, def);

const DEFAULT_INCOMES = {
  d1: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
  d2: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
  capital: { withPs: 0, withoutPs: 0 },
  fonciersFoyer: 0,
};

export interface UseIrReturn {
  // Settings
  taxSettings: any;
  psSettings: any;
  
  // User inputs
  yearKey: string;
  setYearKey: (_v: string) => void;
  status: string;
  setStatus: (_v: string) => void;
  isIsolated: boolean;
  setIsIsolated: (_v: boolean) => void;
  parts: number;
  setParts: (_v: number) => void;
  location: string;
  setLocation: (_v: string) => void;
  children: { id: number; mode: string }[];
  setChildren: React.Dispatch<React.SetStateAction<{ id: number; mode: string }[]>>;
  incomes: typeof DEFAULT_INCOMES;
  capitalMode: string;
  setCapitalMode: (_v: string) => void;
  realMode: { d1: string; d2: string };
  setRealMode: React.Dispatch<React.SetStateAction<{ d1: string; d2: string }>>;
  realExpenses: { d1: number; d2: number };
  setRealExpenses: React.Dispatch<React.SetStateAction<{ d1: number; d2: number }>>;
  deductions: number;
  setDeductions: (_v: number) => void;
  credits: number;
  setCredits: (_v: number) => void;
  showDetails: boolean;
  setShowDetails: (_v: boolean) => void;
  exportLoading: boolean;
  setExportLoading: (_v: boolean) => void;
  
  // Derived values
  effectiveParts: number;
  baseParts: number;
  computedParts: number;
  abat10SalD1: number;
  abat10SalD2: number;
  extraDeductions: number;
  result: any;
  yearLabel: string;
  tmiScale: any[];
  pfuRateIR: number;
  psPatrimonyRate: number;
  
  // Handlers
  updateIncome: (_who: string, _field: string, _value: number) => void;
  reset: () => void;
  hydrated: boolean;
}

export function useIr(): UseIrReturn {
  const [taxSettings, setTaxSettings] = useState<any>(null);
  const [psSettings, setPsSettings] = useState<any>(null);

  // User inputs
  const [yearKey, setYearKey] = useState('current');
  const [status, setStatus] = useState('couple');
  const [isIsolated, setIsIsolated] = useState(false);
  const [parts, setParts] = useState(0);
  const [location, setLocation] = useState('metropole');
  const [children, setChildren] = useState<{ id: number; mode: string }[]>([]);
  const [incomes, setIncomes] = useState(DEFAULT_INCOMES);
  const [capitalMode, setCapitalMode] = useState('pfu');
  const [realMode, setRealMode] = useState({ d1: 'abat10', d2: 'abat10' });
  const [realExpenses, setRealExpenses] = useState({ d1: 0, d2: 0 });
  const [deductions, setDeductions] = useState(0);
  const [credits, setCredits] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const STORE_KEY = storageKeyFor('ir');

  // Chargement des paramètres fiscaux
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const settings = await getFiscalSettings();
        if (!mounted) return;
        setTaxSettings(settings.tax);
        setPsSettings(settings.ps);
      } catch (e) {
        console.error('[IR] Erreur chargement settings:', e);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Invalidation cache admin
  useEffect(() => {
    const remove = addInvalidationListener((kind: 'tax' | 'ps') => {
      if (kind === 'tax' || kind === 'ps') {
        getFiscalSettings({ force: true }).then((settings) => {
          setTaxSettings(settings.tax);
          setPsSettings(settings.ps);
        });
      }
    });
    return remove;
  }, []);

  // Restauration sessionStorage
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
          setIncomes(s.incomes
            ? {
                d1: { ...DEFAULT_INCOMES.d1, ...(s.incomes.d1 || {}) },
                d2: { ...DEFAULT_INCOMES.d2, ...(s.incomes.d2 || {}) },
                capital: { ...DEFAULT_INCOMES.capital, ...(s.incomes.capital || {}) },
                fonciersFoyer: s.incomes.fonciersFoyer ?? 0,
              }
            : DEFAULT_INCOMES
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

  // Sauvegarde sessionStorage
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
        })
      );
    } catch {
      // ignore
    }
  }, [
    STORE_KEY, hydrated, yearKey, status, isIsolated, parts, location,
    incomes, realMode, realExpenses, deductions, credits, capitalMode, children,
  ]);

  // Reset global
  const reset = useCallback(() => {
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
  }, [STORE_KEY]);

  useEffect(() => {
    const off = onResetEvent?.(({ simId }: { simId?: string }) => {
      if (simId && simId !== 'ir') return;
      reset();
    });
    return off || (() => {});
  }, [STORE_KEY, reset]);

  // Handlers
  const updateIncome = useCallback((_who: string, _field: string, _value: number) => {
    setIncomes((prev: any) => ({
      ...prev,
      [_who]: {
        ...prev[_who],
        [_field]: toNum(_value, 0),
      },
    }));
  }, []);

  // Calculs
  const { baseParts, computedParts, effectiveParts } = computeEffectiveParts({
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

  const extraDeductions = computeExtraDeductions({
    status,
    realMode,
    realExpenses,
    abat10SalD1,
    abat10SalD2,
  });

  const result = useMemo(
    () =>
      computeIrResult({
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
        personsAChargeCount: countPersonsACharge(children as any),
      }),
    [
      yearKey, status, isIsolated, effectiveParts, location, incomes,
      deductions, extraDeductions, credits, taxSettings, psSettings, capitalMode, children,
    ]
  );

  const yearLabel =
    yearKey === 'current'
      ? taxSettings?.incomeTax?.currentYearLabel || ''
      : taxSettings?.incomeTax?.previousYearLabel || '';

  const tmiScale =
    yearKey === 'current'
      ? taxSettings?.incomeTax?.scaleCurrent || []
      : taxSettings?.incomeTax?.scalePrevious || [];

  const pfuRateIR = toNum(taxSettings?.pfu?.[yearKey]?.rateIR, 12.8);
  const psPatrimonyRate = toNum(psSettings?.patrimony?.[yearKey]?.totalRate, DEFAULT_PS_SETTINGS.patrimony.current.totalRate);

  return {
    taxSettings,
    psSettings,
    yearKey,
    setYearKey,
    status,
    setStatus,
    isIsolated,
    setIsIsolated,
    parts,
    setParts,
    location,
    setLocation,
    children,
    setChildren,
    incomes,
    capitalMode,
    setCapitalMode,
    realMode,
    setRealMode,
    realExpenses,
    setRealExpenses,
    deductions,
    setDeductions,
    credits,
    setCredits,
    showDetails,
    setShowDetails,
    exportLoading,
    setExportLoading,
    effectiveParts,
    baseParts,
    computedParts,
    abat10SalD1,
    abat10SalD2,
    extraDeductions,
    result,
    yearLabel,
    tmiScale,
    pfuRateIR,
    psPatrimonyRate,
    updateIncome,
    reset,
    hydrated,
  };
}
