// src/pages/Ir.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Ir.css';

import { supabase } from '../supabaseClient';
import { onResetEvent, storageKeyFor } from '../utils/reset';
import { toNumber } from '../utils/number';

// ---- Helpers formats ----
const fmt0 = (n) => (Math.round(Number(n) || 0)).toLocaleString('fr-FR');
const euro0 = (n) => `${fmt0(n)} €`;
const toNum = (v, def = 0) => toNumber(v, def);
// pour afficher joliment les entrées monétaires
const formatMoneyInput = (n) => {
  const v = Math.round(Number(n) || 0);
  if (!v) return '';
  return v.toLocaleString('fr-FR');
};
// abattement 10 % avec plafond / plancher
function computeAbattement10(base, cfg) {
  if (!cfg || base <= 0) return 0;
  const plafond = Number(cfg.plafond) || 0;
  const plancher = Number(cfg.plancher) || 0;

  let val = base * 0.1;
  if (plafond > 0) val = Math.min(val, plafond);
  if (plancher > 0) val = Math.max(val, plancher);
  return val;
}

// ---- Calcul IR progressif + TMI ----
function computeProgressiveTax(scale = [], taxablePerPart) {
  if (!Array.isArray(scale) || !scale.length || taxablePerPart <= 0) {
    return {
      taxPerPart: 0,
      tmiRate: 0,
      tmiBasePerPart: 0,
      tmiBracketTo: null,
      bracketsDetails: [],
    };
  }

  let remaining = taxablePerPart;
  let tax = 0;
  let tmiRate = 0;
  let tmiBasePerPart = 0;
  let tmiBracketTo = null;
  const details = [];

  for (const br of scale) {
    const from = Number(br.from) || 0;
    const to = br.to == null ? null : Number(br.to);
    const rate = Number(br.rate) || 0;

    if (taxablePerPart <= from) {
      details.push({
        label: `De ${from.toLocaleString('fr-FR')}€ à ${to ? to.toLocaleString('fr-FR') + '€' : 'plus'}`,
        base: 0,
        rate,
        tax: 0,
      });
      continue;
    }

    const upper = to == null ? taxablePerPart : Math.min(taxablePerPart, to);
    const base = Math.max(0, upper - from);
    const trancheTax = base * (rate / 100);

    tax += trancheTax;
    remaining -= base;

    details.push({
      label: `De ${from.toLocaleString('fr-FR')}€ à ${to ? to.toLocaleString('fr-FR') + '€' : 'plus'}`,
      base,
      rate,
      tax: trancheTax,
    });

    if (base > 0) {
      tmiRate = rate;
      tmiBasePerPart = base;
      tmiBracketTo = to;
    }


    if (to == null || taxablePerPart <= to) break;
  }

  return {
    taxPerPart: tax,
    tmiRate,
    tmiBasePerPart,
    tmiBracketTo,
    bracketsDetails: details,
  };
}

// ---- CEHR (contrib. exceptionnelle hauts revenus) ----
function computeCEHR(brackets = [], rfr) {
  if (!Array.isArray(brackets) || !brackets.length || rfr <= 0) {
    return { cehr: 0, cehrDetails: [] };
  }

  let cehr = 0;
  const details = [];

  for (const br of brackets) {
    const from = Number(br.from) || 0;
    const to = br.to == null ? null : Number(br.to);
    const rate = Number(br.rate) || 0;

    if (rfr <= from) {
      details.push({
        label: `De ${from.toLocaleString('fr-FR')}€ à ${to ? to.toLocaleString('fr-FR') + '€' : 'plus'}`,
        base: 0,
        rate,
        tax: 0,
      });
      continue;
    }

    const upper = to == null ? rfr : Math.min(rfr, to);
    const base = Math.max(0, upper - from);
    const t = base * (rate / 100);

    cehr += t;
    details.push({
      label: `De ${from.toLocaleString('fr-FR')}€ à ${to ? to.toLocaleString('fr-FR') + '€' : 'plus'}`,
      base,
      rate,
      tax: t,
    });

    if (to == null || rfr <= to) break;
  }

  return { cehr, cehrDetails: details };
}

// ---- CDHR (version simplifiée : plancher de taux effectif) ----
function computeCDHR(config, rfr, taxBeforeCdhr, statusKey) {
  if (!config || rfr <= 0) return { cdhr: 0 };

  const minEffectiveRate = Number(config.minEffectiveRate) || 0;
  if (!minEffectiveRate) return { cdhr: 0 };

  const threshold =
    statusKey === 'couple'
      ? Number(config.thresholdCouple) || 0
      : Number(config.thresholdSingle) || 0;

  if (rfr <= threshold) return { cdhr: 0 };

  const minTax = (minEffectiveRate / 100) * rfr;
  const cdhr = Math.max(0, minTax - taxBeforeCdhr);

  return { cdhr };
}

// ---- Seuils RFR pour PS retraite (par quart de part) ----
function computeRfrThresholdsForParts(baseThresholds, parts) {
  if (!baseThresholds || !parts) return null;

  const {
    rfrMaxExemption1Part,
    rfrMaxReduced1Part,
    rfrMaxMedian1Part,
    incrementQuarterExemption,
    incrementQuarterReduced,
    incrementQuarterMedian,
  } = baseThresholds;

  const extraParts = Math.max(0, parts - 1); // au-delà de la 1re part
  const quarterCount = extraParts * 4; // "par quart de part"

  return {
    exoMax:
      (Number(rfrMaxExemption1Part) || 0) +
      quarterCount * (Number(incrementQuarterExemption) || 0),
    reducedMax:
      (Number(rfrMaxReduced1Part) || 0) +
      quarterCount * (Number(incrementQuarterReduced) || 0),
    medianMax:
      (Number(rfrMaxMedian1Part) || 0) +
      quarterCount * (Number(incrementQuarterMedian) || 0),
  };
}

function determinePsBracketLabel(rfr, thresholds) {
  if (!thresholds || rfr == null) return null;
  const { exoMax, reducedMax, medianMax } = thresholds;

  if (rfr <= exoMax) return 'Exonération';
  if (rfr <= reducedMax) return 'Taux réduit';
  if (rfr <= medianMax) return 'Taux médian';
  return 'Taux normal';
}

// ---- Calcul global IR + CEHR + CDHR + PS ----
function computeIrResult({
  yearKey,
  status,
  isIsolated, // actuellement pas utilisé dans ce calcul, mais gardé pour cohérence
  parts,
  location,
  incomes,
  deductions,
  credits,
  taxSettings,
  psSettings,
}) {
  if (!taxSettings) return null;

  const isCouple = status === 'couple';

  // ---- Paramètres IR ----
  const incomeTaxCfg = taxSettings.incomeTax || {};
  const scale =
    yearKey === 'current'
      ? incomeTaxCfg.scaleCurrent || []
      : incomeTaxCfg.scalePrevious || [];

  const cehrCfg = taxSettings.cehr || {};
  const cehrYearCfg = cehrCfg[yearKey] || {};
  const cehrBrackets =
    cehrYearCfg[isCouple ? 'couple' : 'single'] || [];

  const cdhrCfg =
    taxSettings.cdhr && taxSettings.cdhr[yearKey]
      ? taxSettings.cdhr[yearKey]
      : null;

  // Décote (paramètres dans taxSettings.incomeTax.decote)
  const decoteCfgRoot = incomeTaxCfg.decote || {};
  const decoteYearCfg = decoteCfgRoot[yearKey] || {};

  // Quotient familial (plafond de l'avantage lié aux parts supplémentaires)
  const qfCfgRoot = incomeTaxCfg.quotientFamilial || {};
  const qfYearCfg = qfCfgRoot[yearKey] || {};

  // PS patrimoine (revenus fonciers)
  const psCfg = psSettings || {};
  const patrimonyCfg =
    psCfg.patrimony && psCfg.patrimony[yearKey]
      ? psCfg.patrimony[yearKey]
      : null;

  // ---- Revenus / parts ----
  const partsNb = Math.max(0.5, Number(parts) || 1);

  const totalIncomeD1 =
    (incomes.d1.salaries || 0) +
    (incomes.d1.associes62 || 0) +
    (incomes.d1.pensions || 0) +
    (incomes.d1.bic || 0) +
    (incomes.d1.fonciers || 0) +
    (incomes.d1.autres || 0);

  // Si on est en "célibataire / veuf / divorcé", on ignore le déclarant 2 dans le calcul
  const totalIncomeD2 = isCouple
    ? (incomes.d2.salaries || 0) +
      (incomes.d2.associes62 || 0) +
      (incomes.d2.pensions || 0) +
      (incomes.d2.bic || 0) +
      (incomes.d2.fonciers || 0) +
      (incomes.d2.autres || 0)
    : 0;

  const totalIncome = totalIncomeD1 + totalIncomeD2;
  const deductionsTotal = Math.max(0, deductions || 0);
  const creditsTotal = Math.max(0, credits || 0);

  const taxableIncome = Math.max(0, totalIncome - deductionsTotal);
  const taxablePerPart = partsNb > 0 ? taxableIncome / partsNb : taxableIncome;

  const {
    taxPerPart,
    tmiRate,
    tmiBasePerPart,
    tmiBracketTo,
    bracketsDetails,
  } = computeProgressiveTax(scale, taxablePerPart);

  // IR brut avec le nombre de parts effectif (avant plafonnement du QF)
  const irBrutFoyerSansPlafond = taxPerPart * partsNb;
  let irBrutFoyer = irBrutFoyerSansPlafond;

  // Variables pour le détail du quotient familial
  let irBeforeQfBase = irBrutFoyerSansPlafond; // impôt théorique avec parts "de base"
  let qfAdvantage = 0; // avantage effectivement retenu

  // Gestion du plafonnement du quotient familial (parts supplémentaires)
  const minPartsBase = isCouple ? 2 : 1;
  const extraParts = Math.max(0, partsNb - minPartsBase);
  const extraHalfParts = extraParts * 2;

  const plafondParDemiPartSup = isCouple
    ? Number(qfYearCfg.plafondParDemiPartSupCouple || 0)
    : Number(qfYearCfg.plafondParDemiPartSupSingle || 0);

  if (plafondParDemiPartSup > 0 && extraHalfParts > 0 && taxableIncome > 0) {
    const basePartsForQf = minPartsBase;

    // IR avec seulement les parts de base (1 pour célibataire, 2 pour couple)
    const taxablePerPartBase =
      basePartsForQf > 0 ? taxableIncome / basePartsForQf : taxableIncome;
    const { taxPerPart: taxPerPartBase } = computeProgressiveTax(
      scale,
      taxablePerPartBase
    );
    const irBase = taxPerPartBase * basePartsForQf;
    irBeforeQfBase = irBase;

    const avantageBrut = Math.max(0, irBase - irBrutFoyerSansPlafond);
    const maxAvantage = plafondParDemiPartSup * extraHalfParts;
    const avantageRetenu = Math.min(avantageBrut, maxAvantage);

    qfAdvantage = avantageRetenu;
    // IR après plafonnement : on retire seulement l'avantage retenu
    irBrutFoyer = irBase - avantageRetenu;
  } else {
    // Pas de parts supplémentaires ou pas de plafonnement
    irBeforeQfBase = irBrutFoyerSansPlafond;
    qfAdvantage = Math.max(0, irBeforeQfBase - irBrutFoyer);
  }

  // ---- Décote ----
  let decote = 0;
  const decoteTrigger = isCouple
    ? Number(decoteYearCfg.triggerCouple || 0)
    : Number(decoteYearCfg.triggerSingle || 0);
  const decoteAmount = isCouple
    ? Number(decoteYearCfg.amountCouple || 0)
    : Number(decoteYearCfg.amountSingle || 0);
  const decoteRate = Number(decoteYearCfg.ratePercent || 0);

  if (decoteTrigger > 0 && decoteAmount > 0 && irBrutFoyer <= decoteTrigger) {
    const raw = decoteAmount - (decoteRate / 100) * irBrutFoyer;
    if (raw > 0) decote = raw;
  }
  if (decote > irBrutFoyer) decote = irBrutFoyer;

  // IR net après crédits et décote (c'est ce qu'on appellera "Impôt sur le revenu")
  const irNet = Math.max(0, irBrutFoyer - creditsTotal - decote);

  // On approxime le RFR par le revenu imposable
  const rfr = taxableIncome;

  // CEHR / CDHR
  const { cehr, cehrDetails } = computeCEHR(cehrBrackets, rfr);
  const { cdhr } = computeCDHR(
    cdhrCfg,
    rfr,
    irNet + cehr,
    isCouple ? 'couple' : 'single'
  );

  // ---- PS sur revenus fonciers ----
  let psRateTotal = 0;
  let psTotal = 0;
  if (patrimonyCfg) {
    psRateTotal = Number(patrimonyCfg.totalRate) || 0;
    const fonciersBase =
      (incomes.d1.fonciers || 0) +
      (isCouple ? incomes.d2.fonciers || 0 : 0);
    psTotal = fonciersBase * (psRateTotal / 100);
  }

  const tmiBaseGlobal = tmiBasePerPart * partsNb;
  let tmiMarginGlobal = null;
  if (tmiBracketTo != null) {
    const margeParPart = Math.max(0, tmiBracketTo - taxablePerPart);
    tmiMarginGlobal = margeParPart * partsNb;
  }

  const totalTax = irNet + cehr + cdhr + psTotal;

  return {
    totalIncome,
    totalIncomeD1,
    totalIncomeD2,
    taxableIncome,
    taxablePerPart,
    partsNb,

    irBrutFoyer,          // IR brut du foyer après quotient familial
    irBeforeQfBase,       // Impôt avant quotient familial (avec parts de base)
    qfAdvantage,          // Avantage du quotient familial retenu
    irAfterQf: irBrutFoyer,

    creditsTotal,
    decote,
    irNet,                // Impôt sur le revenu net (après crédits + décote)

    tmiRate,
    tmiBasePerPart,
    tmiBaseGlobal,
    tmiMarginGlobal,
    bracketsDetails,
    rfr,
    cehr,
    cehrDetails,
    cdhr,
    psTotal,
    psRateTotal,
    totalTax,
  };
}




/* ===============================
   Page IR
================================ */
export default function Ir() {
  const [taxSettings, setTaxSettings] = useState(null);
  const [psSettings, setPsSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Choix utilisateur
  const [yearKey, setYearKey] = useState('current'); // current = 2025, previous = 2024
  const [status, setStatus] = useState('couple'); // 'single' | 'couple'
  const [isIsolated, setIsIsolated] = useState(false); // option parent isolé
  const [parts, setParts] = useState(2); // parts "de base" (hors demi-part isolé)
  const [location, setLocation] = useState('metropole'); // metropole | gmr | guyane

  const [incomes, setIncomes] = useState({
    d1: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
    d2: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
  });
  // Mode de déduction des frais pour salaires / art.62
  const [realMode, setRealMode] = useState({ d1: 'abat10', d2: 'abat10' }); // 'abat10' | 'reels'
  const [realExpenses, setRealExpenses] = useState({ d1: 0, d2: 0 });

  const [deductions, setDeductions] = useState(0);
  const [credits, setCredits] = useState(0);

  const [showDetails, setShowDetails] = useState(false);

  // Export dropdown
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);

  // Persist dans localStorage
  const STORE_KEY = storageKeyFor('ir');
  const [hydrated, setHydrated] = useState(false);

  // Chargement paramètres Supabase
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError('');

        const [taxRes, psRes] = await Promise.all([
          supabase.from('tax_settings').select('data').eq('id', 1).maybeSingle(),
          supabase.from('ps_settings').select('data').eq('id', 1).maybeSingle(),
        ]);

        if (!taxRes.error && taxRes.data && taxRes.data.data && mounted) {
          setTaxSettings(taxRes.data.data);
        } else if (taxRes.error && mounted) {
          console.warn('Erreur tax_settings', taxRes.error);
        }

        if (!psRes.error && psRes.data && psRes.data.data && mounted) {
          setPsSettings(psRes.data.data);
        } else if (psRes.error && mounted) {
          console.warn('Erreur ps_settings', psRes.error);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError('Erreur lors du chargement des paramètres fiscaux.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Restauration depuis localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          setYearKey(s.yearKey ?? 'current');
          setStatus(s.status ?? 'couple');
          setIsIsolated(s.isIsolated ?? false);
          setParts(s.parts ?? 2);
          setLocation(s.location ?? 'metropole');
          setIncomes(
            s.incomes ?? {
              d1: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
              d2: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
            }
          );
          setRealMode(s.realMode ?? { d1: 'abat10', d2: 'abat10' });
          setRealExpenses(s.realExpenses ?? { d1: 0, d2: 0 });
          setDeductions(s.deductions ?? 0);
          setCredits(s.credits ?? 0);
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarde dans localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
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
        })
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
  ]);


  // Reset global depuis la topbar
  useEffect(() => {
    const off = onResetEvent?.(({ simId }) => {
      // ne réagit qu'au reset du simulateur IR
      if (simId && simId !== 'ir') return;

      setYearKey('current');
      setStatus('couple');
      setIsIsolated(false);
      setParts(2);
      setLocation('metropole');
      setIncomes({
          d1: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
          d2: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
      });
      setDeductions(0);
      setCredits(0);
      setRealMode({ d1: 'abat10', d2: 'abat10' });
      setRealExpenses({ d1: 0, d2: 0 });

      try {
        localStorage.removeItem(STORE_KEY);
      } catch {
        // ignore
      }
    });

    return off || (() => {});
  }, [STORE_KEY]);

  // Fermeture menu export au clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (!exportRef.current) return;
      if (!exportRef.current.contains(e.target)) setExportOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  // Handlers de saisie
  const updateIncome = (who, field, value) => {
    setIncomes((prev) => ({
      ...prev,
      [who]: {
        ...prev[who],
        [field]: toNum(value, 0),
      },
    }));
  };
  
  // Parts effectives prenant en compte le statut et l'option "isolé"
  const minParts = status === 'couple' ? 2 : 1;
  const baseParts = Math.max(minParts, Number(parts) || minParts);
  const effectiveParts =
    status === 'single' && isIsolated ? baseParts + 0.5 : baseParts;

  // Abattement 10 % salaires / art. 62 (par déclarant)
  const abat10CfgRoot = taxSettings?.incomeTax?.abat10 || {};
  const abat10SalCfg =
    yearKey === 'current'
      ? abat10CfgRoot.current
      : abat10CfgRoot.previous;

  const baseSalD1 = (incomes.d1.salaries || 0) + (incomes.d1.associes62 || 0);
  const baseSalD2 = (incomes.d2.salaries || 0) + (incomes.d2.associes62 || 0);

  const abat10SalD1 = computeAbattement10(baseSalD1, abat10SalCfg);
  const abat10SalD2 = computeAbattement10(baseSalD2, abat10SalCfg);

  // Frais réels / 10 % déclarés par le foyer (s'ajoutent aux "Déductions")
  const extraDeductions =
    (realMode.d1 === 'reels'
      ? realExpenses.d1 || 0
      : realMode.d1 === 'abat10'
      ? abat10SalD1
      : 0) +
    (realMode.d2 === 'reels'
      ? realExpenses.d2 || 0
      : realMode.d2 === 'abat10'
      ? abat10SalD2
      : 0);


  // Calcul principal
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
      realMode,
      realExpenses,
    ]

  );


  const yearLabel =
    yearKey === 'current'
      ? 'Barème 2025 (revenus 2024)'
      : 'Barème 2024 (revenus 2023)';
  const tmiScale =
  yearKey === 'current'
    ? taxSettings?.incomeTax?.scaleCurrent || []
    : taxSettings?.incomeTax?.scalePrevious || [];

  // Export Excel très simplifié
  function buildWorksheetXmlVertical(title, header, rows) {
    const aoa = [header, ...rows];
    const esc = (s) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const rowXml = (cells) =>
      `<Row>${cells
        .map(
          (v) =>
            `<Cell><Data ss:Type="${
              typeof v === 'number' ? 'Number' : 'String'
            }">${esc(v)}</Data></Cell>`
        )
        .join('')}</Row>`;

    return `
      <Worksheet ss:Name="${esc(title)}">
        <Table>
          ${aoa.map((r) => rowXml(r)).join('')}
        </Table>
      </Worksheet>`;
  }

  function exportExcel() {
    try {
      if (!result) {
        alert('Les résultats ne sont pas disponibles.');
        return;
      }

      const header = ['Champ', 'Valeur'];
      const rows = [];

      rows.push(['Barème', yearLabel]);
      rows.push([
        'Situation familiale',
        status === 'couple' ? 'Marié / Pacsé' : 'Célibataire / Veuf / Divorcé',
      ]);
      rows.push(['Nombre de parts', parts]);
      rows.push([
        'Zone géographique',
        location === 'metropole'
          ? 'Métropole'
          : location === 'gmr'
          ? 'Guadeloupe / Martinique / Réunion / St-Barth / St-Martin'
          : 'Guyane',
      ]);

      rows.push(['Revenus imposables total', euro0(result.totalIncome)]);
      rows.push(['Revenu imposable du foyer', euro0(result.taxableIncome)]);
      rows.push(['TMI', `${result.tmiRate || 0} %`]);
      rows.push(['Impôt sur le revenu', euro0(result.irNet || 0)]);
      rows.push(['CEHR', euro0(result.cehr)]);
      rows.push(['CDHR', euro0(result.cdhr)]);
      rows.push(['PS sur les revenus fonciers', euro0(result.psTotal)]);
      rows.push(['Imposition totale (IR + CEHR + CDHR + PS)', euro0(result.totalTax)]);

      const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  ${buildWorksheetXmlVertical('IR', header, rows)}
</Workbook>`;

      const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SER1_IR.xls';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export Excel IR échoué', e);
      alert('Impossible de générer le fichier Excel.');
    }
  }

  function exportPowerPoint() {
    // même logique que Credit.jsx : placeholder pour la vraie génération
    alert('Export PowerPoint (IR) : paramétrage à venir 👍');
  }

  // ------------ Rendu --------------

  if (loading) {
    return (
      <div className="panel ir-panel">
        <div className="ir-header">
          <span>Simulateur IR</span>
        </div>
        <p>Chargement des paramètres fiscaux…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel ir-panel">
        <div className="ir-header">
          <span>Simulateur IR</span>
        </div>
        <p className="ir-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="panel ir-panel">
      <div className="ir-header">
        <div className="ir-title">Simulateur d&apos;impôt sur le revenu</div>

        <div ref={exportRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="chip"
            aria-haspopup="menu"
            aria-expanded={exportOpen ? 'true' : 'false'}
            onClick={() => setExportOpen((v) => !v)}
          >
            Exporter ▾
          </button>

          {exportOpen && (
            <div
              role="menu"
              className="ir-export-menu"
            >
              <button
                type="button"
                role="menuitem"
                className="chip"
                onClick={() => {
                  setExportOpen(false);
                  exportExcel();
                }}
              >
                Excel
              </button>
              <button
                type="button"
                role="menuitem"
                className="chip"
                onClick={() => {
                  setExportOpen(false);
                  exportPowerPoint();
                }}
              >
                PowerPoint
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="ir-grid">
        {/* Bloc de gauche : saisie */}
        <div className="ir-left">
          <div className="ir-top-params">
            <div className="ir-field">
              <label>Barème</label>
              <select value={yearKey} onChange={(e) => setYearKey(e.target.value)}>
                <option value="current">Barème 2025 (revenus 2024)</option>
                <option value="previous">Barème 2024 (revenus 2023)</option>
              </select>
            </div>


            <div className="ir-field">
              <label>Situation familiale</label>
              <select
                value={status}
onChange={(e) => {
  const newStatus = e.target.value;
  setStatus(newStatus);

  if (newStatus === 'couple') {
    setIsIsolated(false);
    if (parts < 2) setParts(2);
  } else {
    // Célibataire / Veuf / Divorcé :
    if (parts < 1) setParts(1);

    // On efface les revenus du déclarant 2 et ses frais
    setIncomes((prev) => ({
      ...prev,
      d2: {
        salaries: 0,
        associes62: 0,
        pensions: 0,
        bic: 0,
        fonciers: 0,
        autres: 0,
      },
    }));
    setRealMode((prev) => ({ ...prev, d2: 'abat10' }));
    setRealExpenses((prev) => ({ ...prev, d2: 0 }));
  }
}}
              >
                <option value="single">Célibataire / Veuf / Divorcé</option>
                <option value="couple">Marié / Pacsé</option>
              </select>
            </div>

            
            {status === 'single' && (
              <div className="ir-field">
                <label>Isolé</label>
                <select
                  value={isIsolated ? 'yes' : 'no'}
                  onChange={(e) => setIsIsolated(e.target.value === 'yes')}
                >
                  <option value="no">Non</option>
                  <option value="yes">Oui</option>
                </select>
              </div>
            )}

            <div className="ir-field">
              <label>Nombre de parts</label>
              <input
                type="number"
                step="0.25"
                min={status === 'couple' ? 2 : 1}
                value={parts}
                onChange={(e) => {
                  const min = status === 'couple' ? 2 : 1;
                  const raw = toNum(e.target.value, min);
                  // on "accroche" à un quart de part
                  const snapped = Math.round(raw * 4) / 4;
                  setParts(snapped < min ? min : snapped);
                }}
              />
            </div>

            <div className="ir-field">
              <label>Résidence</label>
              <select value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="metropole">Métropole</option>
                <option value="gmr">
                  Guadeloupe / Martinique / Réunion / St-Barth / St-Martin
                </option>
                <option value="guyane">Guyane</option>
              </select>
            </div>
          </div>

          <div className="ir-table-wrapper">
            <table className="ir-table" aria-label="Revenus imposables">
              <colgroup>
                <col style={{ width: '40%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '30%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th />
                  <th>Déclarant 1</th>
                  <th>Déclarant 2</th>
                </tr>
              </thead>
              <tbody>
                <tr className="ir-row-title">
                  <td colSpan={3}>Revenus imposables</td>
                </tr>
                <tr>
                  <td>Traitements et salaires</td>
                  <td>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(incomes.d1.salaries)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        updateIncome('d1', 'salaries', raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(incomes.d2.salaries)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        updateIncome('d2', 'salaries', raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Revenus des associés / gérants</td>
                  <td>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(incomes.d1.associes62)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        updateIncome('d1', 'associes62', raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(incomes.d2.associes62)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        updateIncome('d2', 'associes62', raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Frais réels ou abattement 10&nbsp;%</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select
                        style={{ flex: 1 }}
                        value={realMode.d1}
                        onChange={(e) =>
                          setRealMode((m) => ({ ...m, d1: e.target.value }))
                        }
                      >
                        <option value="reels">FR</option>
                        <option value="abat10">10%</option>
                      </select>
                      {realMode.d1 === 'reels' ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0 €"
                          style={{ flex: 1 }}
                          value={formatMoneyInput(realExpenses.d1)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^\d]/g, '');
                            setRealExpenses((r) => ({
                              ...r,
                              d1: raw === '' ? 0 : Number(raw),
                            }));
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          style={{ flex: 1, background: '#f3f3f3' }}
                          readOnly
                          value={formatMoneyInput(abat10SalD1)}
                        />
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <select
                        style={{ flex: 1 }}
                        value={realMode.d2}
                        onChange={(e) =>
                          setRealMode((m) => ({ ...m, d2: e.target.value }))
                        }
                      >
                        <option value="reels">FR</option>
                        <option value="abat10">10%</option>
                      </select>
                      {realMode.d2 === 'reels' ? (
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0 €"
                          style={{ flex: 1 }}
                          value={formatMoneyInput(realExpenses.d2)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^\d]/g, '');
                            setRealExpenses((r) => ({
                              ...r,
                              d2: raw === '' ? 0 : Number(raw),
                            }));
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          style={{ flex: 1, background: '#f3f3f3' }}
                          readOnly
                          value={formatMoneyInput(abat10SalD2)}
                        />
                      )}
                    </div>
                  </td>
                </tr>

                <tr>
                  <td>Pensions, retraites et rentes</td>
                  <td>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(incomes.d1.pensions)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        updateIncome('d1', 'pensions', raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(incomes.d2.pensions)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        updateIncome('d2', 'pensions', raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                </tr>
                <tr className="ir-row-title">
                  <td>Abattement 10&nbsp;% pensions (foyer)</td>
                  <td colSpan={2} style={{ textAlign: 'center' }}>
                    {(() => {
                      const abat10CfgRoot = taxSettings?.incomeTax?.abat10 || {};
                      const cfgRet =
                        yearKey === 'current'
                          ? abat10CfgRoot.retireesCurrent
                          : abat10CfgRoot.retireesPrevious;
                      const baseRet =
                        (incomes.d1.pensions || 0) +
                        (incomes.d2.pensions || 0);
                      const val = computeAbattement10(baseRet, cfgRet);
                      return euro0(val);
                    })()}
                  </td>
                </tr>

                <tr>
                  <td>BIC-BNC-BA imposables</td>
                  <td>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(incomes.d1.bic)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        updateIncome('d1', 'bic', raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(incomes.d2.bic)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        updateIncome('d2', 'bic', raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Revenus fonciers nets</td>
                  <td>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(incomes.d1.fonciers)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        updateIncome('d1', 'fonciers', raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(incomes.d2.fonciers)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        updateIncome('d2', 'fonciers', raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Autres revenus imposables</td>
                  <td>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(incomes.d1.autres)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        updateIncome('d1', 'autres', raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(incomes.d2.autres)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        updateIncome('d2', 'autres', raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                </tr>

                <tr className="ir-row-title">
                  <td colSpan={3}>Ajustements</td>
                </tr>
                <tr>
                  <td>Déductions (pensions alimentaires, etc.)</td>
                  <td colSpan={2}>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(deductions)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        setDeductions(raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Réductions / crédits d&apos;impôt</td>
                  <td colSpan={2}>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0 €"
                      value={formatMoneyInput(credits)}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        setCredits(raw === '' ? 0 : Number(raw));
                      }}
                    />
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

        {/* Bloc de droite : synthèse / TMI */}
        <div className="ir-right">
          <div className="ir-tmi-card">
            <div className="ir-tmi-header">Estimation IR</div>

<div className="ir-tmi-bar">
  {tmiScale.map((br, idx) => {
    const rate = Number(br.rate) || 0;
    const isActive = rate === (result?.tmiRate || 0);
    return (
      <div
        key={idx}
        className={`ir-tmi-segment${isActive ? ' is-active' : ''}`}
      >
        <span>{rate}%</span>
      </div>
    );
  })}
</div>

<div className="ir-tmi-rows">
  <div className="ir-tmi-row">
    <span>TMI</span>
    <span>{result ? `${result.tmiRate || 0} %` : '-'}</span>
  </div>
  <div className="ir-tmi-row">
    <span>Impôt sur le revenu</span>
    <span>{result ? euro0(result.irNet || 0) : '-'}</span>
  </div>
</div>


            <div className="ir-tmi-sub">
              <div>
                Montant des revenus dans cette TMI :{' '}
                {result ? euro0(result.tmiBaseGlobal) : '0 €'}
              </div>
              <div>
                Montant des revenus avant changement de TMI :{' '}
                {result && result.tmiMarginGlobal != null
                  ? euro0(result.tmiMarginGlobal)
                  : '—'}
              </div>
            </div>

          </div>

          {result && (
            <div className="ir-summary-card">
              <div className="ir-summary-row">
                <span>Revenu imposable du foyer</span>
                <span>{euro0(result.taxableIncome)}</span>
              </div>
              <div className="ir-summary-row">
                <span>Nombre de parts</span>
                <span>{result.partsNb}</span>
              </div>
               <div className="ir-summary-row">
                <span>Revenu par part</span>
                <span>{euro0(result.taxablePerPart)}</span>
              </div>
              <div className="ir-summary-row">
                <span>Imposition totale</span>
                <span>{euro0(result.totalTax)}</span>
              </div>
              <div className="ir-summary-row">
                <span>CEHR</span>
                <span>{euro0(result.cehr)}</span>
              </div>
              <div className="ir-summary-row">
                <span>CDHR</span>
                <span>{euro0(result.cdhr)}</span>
              </div>
              <div className="ir-summary-row">
                <span>PS sur les revenus fonciers</span>
                <span>{euro0(result.psTotal)}</span>
              </div>

            </div>
          )}

          <button
            type="button"
            className="chip"
            onClick={() => setShowDetails((v) => !v)}
            style={{ marginTop: 12 }}
          >
            {showDetails ? 'Masquer le détail du calcul' : 'Afficher le détail du calcul'}
          </button>
        </div>
      </div>

      {showDetails && result && (
        <div className="ir-details">
          <h3>Détail du calcul</h3>

          <h4>Barème de l&apos;impôt sur le revenu</h4>
          <table className="ir-details-table">
            <thead>
              <tr>
                <th>Tranche</th>
                <th>Base (par part)</th>
                <th>Taux</th>
                <th>Impôt (par part)</th>
              </tr>
            </thead>
            <tbody>
              {result.bracketsDetails.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.label}</td>
                  <td>{euro0(row.base)}</td>
                  <td>{row.rate} %</td>
                  <td>{euro0(row.tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
    <table className="ir-details-table">
      <tbody>
        <tr>
          <td>Base imposable du foyer</td>
          <td style={{ textAlign: 'right' }}>
            {euro0(result.taxableIncome)}
          </td>
        </tr>
        <tr>
          <td>Impôt avant quotient familial</td>
          <td style={{ textAlign: 'right' }}>
            {euro0(result.irBeforeQfBase || 0)}
          </td>
        </tr>
        <tr>
          <td>Quotient familial</td>
          <td style={{ textAlign: 'right' }}>
            {euro0(result.qfAdvantage || 0)}
          </td>
        </tr>
        <tr>
          <td>Impôt après quotient familial</td>
          <td style={{ textAlign: 'right' }}>
            {euro0(result.irAfterQf || 0)}
          </td>
        </tr>
        <tr>
          <td>Réductions et crédits d&apos;impôt</td>
          <td style={{ textAlign: 'right' }}>
            {euro0(result.creditsTotal || 0)}
          </td>
        </tr>
        <tr>
          <td>Décote</td>
          <td style={{ textAlign: 'right' }}>
            {euro0(result.decote || 0)}
          </td>
        </tr>
        <tr>
          <td>Impôt après réductions, crédits d&apos;impôt et décote</td>
          <td style={{ textAlign: 'right' }}>
            {euro0(result.irNet || 0)}
          </td>
        </tr>
      </tbody>
    </table>

          <h4>CEHR</h4>
          {result.cehrDetails && result.cehrDetails.length > 0 ? (
            <table className="ir-details-table">
              <thead>
                <tr>
                  <th>Tranche RFR</th>
                  <th>Base</th>
                  <th>Taux</th>
                  <th>CEHR</th>
                </tr>
              </thead>
              <tbody>
                {result.cehrDetails.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.label}</td>
                    <td>{euro0(row.base)}</td>
                    <td>{row.rate} %</td>
                    <td>{euro0(row.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>Aucune CEHR due.</p>
          )}
        </div>
      )}
    </div>
  );
}
