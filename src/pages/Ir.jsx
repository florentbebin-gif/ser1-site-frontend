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

// ---- Calcul IR progressif + TMI (base par part) ----
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
        label: `De ${from.toLocaleString('fr-FR')}€ à ${
          to ? to.toLocaleString('fr-FR') + '€' : 'plus'
        }`,
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

    details.push({
      label: `De ${from.toLocaleString('fr-FR')}€ à ${
        to ? to.toLocaleString('fr-FR') + '€' : 'plus'
      }`,
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

  if (tax < 0) tax = 0;

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

// ---- CDHR (Contribution différentielle sur les hauts revenus) ----
// D’après le guide usager (article 224 CGI) :
// CDHR = max(0, A - B)
// A = 20% * assiette (RFR "retraité"/autonome), avec décote d'entrée éventuelle
// B = (IR retenu + CEHR retenue + PFU part IR) + majorations (12 500 couple, 1 500 / personne à charge)
function computeCDHR(config, assiette, irRetenu, pfuIr, cehr, isCouple, personsAChargeCount) {
  if (!config || !Number.isFinite(assiette) || assiette <= 0) {
    return { cdhr: 0, cdhrDetails: null };
  }

  // Taux minimal : si la config est "20" => 20% ; si un jour c’est "0.20" => on accepte aussi.
  const rawRate = Number(config.minEffectiveRate);
  const minRate = !rawRate ? 0 : rawRate > 1 ? rawRate / 100 : rawRate; // 0.20 attendu
  if (!minRate) return { cdhr: 0, cdhrDetails: null };

  // Seuils d'entrée (champ) : 250k / 500k
  const threshold = isCouple
    ? Number(config.thresholdCouple) || 500000
    : Number(config.thresholdSingle) || 250000;

  if (assiette <= threshold) return { cdhr: 0, cdhrDetails: null };

  // Plafond de zone de décote : 330k / 660k
  const decoteMaxAssiette = isCouple
    ? Number(config.decoteMaxAssietteCouple) || 660000
    : Number(config.decoteMaxAssietteSingle) || 330000;

  // Paramètre guide : 82,5%
  const decoteSlope = Number(config.decoteSlopePercent);
  const slope = Number.isFinite(decoteSlope) && decoteSlope > 0
    ? decoteSlope / 100
    : 0.825;

  // A = 20% * assiette (avant décote)
  const termA_beforeDecote = minRate * assiette;

  // Décote d'entrée (si assiette <= 330k/660k)
  // Le guide dit : la cotisation de 20% est diminuée de (A - 82,5%*(assiette - seuil)) si positive
  let decoteApplied = 0;
  if (assiette <= decoteMaxAssiette) {
    const target = slope * Math.max(0, assiette - threshold);
    decoteApplied = Math.max(0, termA_beforeDecote - target);
  }

  const termA_afterDecote = Math.max(0, termA_beforeDecote - decoteApplied);

  // Majorations (guide)
  const majCouple = isCouple ? (Number(config.majorationCouple) || 12500) : 0;
  const majPerCharge = Number(config.majorationPerCharge) || 1500;
  const personsCount = Math.max(0, Number(personsAChargeCount) || 0);
  const majCharges = personsCount * majPerCharge;
  const majorations = majCouple + majCharges;

  // B = IR retenu + CEHR + PFU(part IR) + majorations
  const termB =
    (Number(irRetenu) || 0) +
    (Number(cehr) || 0) +
    (Number(pfuIr) || 0) +
    majorations;

  const cdhr = Math.max(0, termA_afterDecote - termB);

  return {
    cdhr,
    cdhrDetails: {
      assiette,
      threshold,
      minRatePercent: minRate * 100,
      decoteMaxAssiette,
      slopePercent: slope * 100,

      termA_beforeDecote,
      decoteApplied,
      termA_afterDecote,

      termB,
      irRetenu: Number(irRetenu) || 0,
      cehr: Number(cehr) || 0,
      pfuIr: Number(pfuIr) || 0,
      majorations,
      majCouple,
      majCharges,
      personsAChargeCount: personsCount,
    },
  };
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
  isIsolated,
  parts,
  location,
  incomes,
  deductions,
  credits,
  taxSettings,
  psSettings,
  capitalMode,
  personsAChargeCount,
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
  const qfCfgRoot = incomeTaxCfg.quotientFamily || {};
  const qfYearCfg =
    yearKey === 'current'
      ? qfCfgRoot.current || {}
      : qfCfgRoot.previous || {};

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
  (incomes.d1.autres || 0);

const totalIncomeD2 = isCouple
  ? (incomes.d2.salaries || 0) +
    (incomes.d2.associes62 || 0) +
    (incomes.d2.pensions || 0) +
    (incomes.d2.bic || 0) +
    (incomes.d2.autres || 0)
  : 0;


  // Revenus de capitaux mobiliers (foyer)
  const capWithPs = incomes.capital?.withPs || 0;
  const capWithoutPs = incomes.capital?.withoutPs || 0;
  const capTotal = capWithPs + capWithoutPs;

  const modeCap = capitalMode || 'pfu';

  let capitalBaseBareme = 0;
  let capitalBasePfu = 0;

  if (modeCap === 'bareme') {
    // Abattement de 40 % avant intégration au barème
    capitalBaseBareme = capTotal * 0.6;
  } else {
    // PFU : base brute soumise à 12,8 %
    capitalBasePfu = capTotal;
  }

 const baseRevenusBareme =
  totalIncomeD1 +
  totalIncomeD2 +
  (incomes.fonciersFoyer || 0) +
  capitalBaseBareme;


  const deductionsTotal = Math.max(0, deductions || 0);
  const creditsTotal = Math.max(0, credits || 0);

  // Revenu imposable au barème
  const taxableIncome = Math.max(0, baseRevenusBareme - deductionsTotal);
  const taxablePerPart = partsNb > 0 ? taxableIncome / partsNb : taxableIncome;

  // Total "revenus" global pour info/export (barème + PFU)
  const totalIncome = baseRevenusBareme + capitalBasePfu;


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
  let qfExtraHalfParts = 0; // nombre de demi-parts supplémentaires prises en compte
  let irAfterQf = irBrutFoyerSansPlafond; // IR après quotient familial



  // Gestion du plafonnement du quotient familial (parts supplémentaires)
  const basePartsForQf = isCouple ? 2 : 1;
  const extraParts = Math.max(0, partsNb - basePartsForQf);
  const extraHalfParts = extraParts * 2;

  const plafondPartSup = Number(qfYearCfg.plafondPartSup || 0); // F18

  const plafondParentIso2 = Number(
    qfYearCfg.plafondParentIsoléDeuxPremièresParts || 0 // G18
  );

  let irBase = irBrutFoyerSansPlafond; // par défaut, on met quelque chose
  let maxAvantage = 0;
  let qfIsCapped = false; // plafonnement actif
  
  if (taxableIncome > 0 && extraHalfParts > 0 && plafondPartSup > 0) {
    // 1) Impôt avec les parts "de base"
    const taxablePerPartBase =
      basePartsForQf > 0 ? taxableIncome / basePartsForQf : taxableIncome;
    const { taxPerPart: taxPerPartBase } = computeProgressiveTax(
      scale,
      taxablePerPartBase
    );
    irBase = taxPerPartBase * basePartsForQf;
    irBeforeQfBase = irBase;

    // 2) Avantage brut du QF (comme en Excel : IR_base - IR_toutes_parts)
    const avantageBrut = Math.max(0, irBase - irBrutFoyerSansPlafond);
    qfExtraHalfParts = extraHalfParts;

    // 3) Plafond max de l'avantage (traduction de ta formule Excel)
    const isSingle = !isCouple;

    if (!isIsolated || !isSingle || plafondParentIso2 <= 0) {
      // Cas général : pas isolé, ou marié, ou pas de plafond isolé paramétré
      // -> (S22 - base) * (F18 * 2)
      maxAvantage = extraParts * 2 * plafondPartSup;
    } else {
      // Cas parent isolé (isIsolated = true et célibataire)
      if (partsNb <= 2) {
        // S22 <= 2 : (S22 - 1) * G18
        maxAvantage = (partsNb - 1) * plafondParentIso2;
      } else {
        // S22 > 2 : G18 + (S22 - 2) * (F18 * 2)
        maxAvantage =
          plafondParentIso2 + (partsNb - 2) * 2 * plafondPartSup;
      }
    }

    // 4) Avantage retenu = minimum (brut, plafond)
    const avantageRetenu = Math.min(avantageBrut, maxAvantage);
    qfIsCapped = avantageBrut > maxAvantage;

    qfAdvantage = avantageRetenu;
    irBrutFoyer = irBase - avantageRetenu; // IR après plafonnement
    irAfterQf = irBrutFoyer;
  } else {
    // Pas de parts supplémentaires ou pas de plafonnement applicable
    irBeforeQfBase = irBrutFoyerSansPlafond;
    qfAdvantage = 0;
    irAfterQf = irBrutFoyerSansPlafond;
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

  // PFU 12,8 % sur les revenus de capitaux mobiliers en option PFU
  let pfuIr = 0;
  if (capitalBasePfu > 0) {
    const pfuCfg =
      taxSettings.pfu && taxSettings.pfu[yearKey]
        ? taxSettings.pfu[yearKey]
        : null;
    const pfuRateIR = pfuCfg ? Number(pfuCfg.rateIR) || 12.8 : 12.8;
    pfuIr = capitalBasePfu * (pfuRateIR / 100);
  }

  // On approxime le RFR : revenu imposable + revenus taxés au PFU
  const rfr = taxableIncome + capitalBasePfu;


// CEHR / CDHR
const { cehr, cehrDetails } = computeCEHR(cehrBrackets, rfr);

const { cdhr, cdhrDetails } = computeCDHR(
  cdhrCfg,
  rfr,
  irBrutFoyer, // IR progressif après quotient, avant décote/crédits (ok pour notre besoin)
  pfuIr,
  cehr,
  isCouple,
  personsAChargeCount
);



  // ---- PS sur revenus fonciers + dividendes ----
  let psRateTotal = 0;
  let psFoncier = 0;
  let psDividends = 0;
  let psTotal = 0;

  if (patrimonyCfg) {
    psRateTotal = Number(patrimonyCfg.totalRate) || 0;

const fonciersBase = incomes.fonciersFoyer || 0;
psFoncier = fonciersBase * (psRateTotal / 100);


    // PS sur dividendes : uniquement sur la ligne "soumis aux PS"
    if (capWithPs > 0) {
      psDividends = capWithPs * (psRateTotal / 100);
    }

    psTotal = psFoncier + psDividends;
  }

  // --- TMI d'affichage : si plafonnement QF actif, on se base sur les parts "de base" (1 ou 2)
  const partsForTmi = qfIsCapped ? basePartsForQf : partsNb;
  const taxablePerPartForTmi =
    partsForTmi > 0 ? taxableIncome / partsForTmi : taxableIncome;

  const tmiComputedForDisplay = computeProgressiveTax(scale, taxablePerPartForTmi);

  const tmiRateDisplay = tmiComputedForDisplay.tmiRate || 0;
  const tmiBasePerPartDisplay = tmiComputedForDisplay.tmiBasePerPart || 0;
  const tmiBracketToDisplay = tmiComputedForDisplay.tmiBracketTo;
const bracketsDetailsDisplay = tmiComputedForDisplay.bracketsDetails || [];

  
  // ---- TMI : montants associés (affichage) ----
  let tmiBaseGlobal = 0;
  let tmiMarginGlobal = null;

  if (tmiRateDisplay > 0) {
    // 1) "Montant des revenus dans cette TMI"
    if (decote > 0 && decoteRate > 0 && irNet > 0 && !qfIsCapped) {
      // cas décote (on garde ta logique précédente), uniquement quand pas de plafonnement QF bloquant
      const tmiFactor =
        (tmiRateDisplay / 100) * (1 + decoteRate / 100);
      tmiBaseGlobal = tmiFactor > 0 ? irNet / tmiFactor : 0;
    } else {
      // cas général (dont plafonnement QF actif) : base dans la tranche * partsForTmi
      tmiBaseGlobal = tmiBasePerPartDisplay * partsForTmi;
    }

    // 2) "Montant des revenus avant changement de TMI"
    if (tmiBracketToDisplay != null) {
      const margeParPart = Math.max(0, tmiBracketToDisplay - taxablePerPartForTmi);
      tmiMarginGlobal = margeParPart * partsForTmi;
    }
  }


  const totalTax = irNet + pfuIr + cehr + cdhr + psTotal;

  return {
    totalIncome,
    taxableIncome,
    taxablePerPart,
    partsNb,

    // Quotient familial
    irBeforeQfBase,
    qfAdvantage,
    irAfterQf,

    // Décote / crédits
    decote,
    creditsTotal,

    // IR & composantes
    irNet,
    pfuIr,
    cehr,
    cehrDetails,
    cdhr,
    cdhrDetails,

    // Prélèvements sociaux
    psFoncier,
    psDividends,
    psTotal,

    // Total global
    totalTax,

    // TMI / barème
    tmiRate: tmiRateDisplay,
    tmiBaseGlobal,
    tmiMarginGlobal,
    bracketsDetails: bracketsDetailsDisplay,
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
  const [parts, setParts] = useState(0); // ajustement manuel en nombre de parts
  const [location, setLocation] = useState('metropole'); // metropole | gmr | guyane
  const [children, setChildren] = useState([]);
// ex : [{ id: 1, mode: 'charge' | 'shared' }]


  const DEFAULT_INCOMES = {
  d1: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
  d2: { salaries: 0, associes62: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
  capital: {
    withPs: 0,
    withoutPs: 0,
  },
    fonciersFoyer: 0,
};

const [incomes, setIncomes] = useState(DEFAULT_INCOMES);
const [capitalMode, setCapitalMode] = useState('pfu'); // 'pfu' ou 'bareme'


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
          setParts(s.parts ?? 0);
          setLocation(s.location ?? 'metropole');
setIncomes(
  s.incomes
    ? {
        d1: { ...DEFAULT_INCOMES.d1, ...(s.incomes.d1 || {}) },
        d2: { ...DEFAULT_INCOMES.d2, ...(s.incomes.d2 || {}) },
        capital: {
          ...DEFAULT_INCOMES.capital,
          ...(s.incomes.capital || {}),
        },
        fonciersFoyer: s.incomes.fonciersFoyer ?? 0,
      }
    : DEFAULT_INCOMES
);

          setRealMode(s.realMode ?? { d1: 'abat10', d2: 'abat10' });
          setRealExpenses(s.realExpenses ?? { d1: 0, d2: 0 });
          setDeductions(s.deductions ?? 0);
          setCredits(s.credits ?? 0);
          setCapitalMode(s.capitalMode ?? 'pfu');
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
  capitalMode,
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
    capitalMode,
  ]);


  // Reset global depuis la topbar
  useEffect(() => {
    const off = onResetEvent?.(({ simId }) => {
      // ne réagit qu'au reset du simulateur IR
      if (simId && simId !== 'ir') return;

setYearKey('current');
setStatus('couple');
setIsIsolated(false);
setParts(0);            // ajustement remis à zéro
setLocation('metropole');
setIncomes(DEFAULT_INCOMES);
setChildren([]);        // on supprime tous les enfants
setDeductions(0);
setCredits(0);
setRealMode({ d1: 'abat10', d2: 'abat10' });
setRealExpenses({ d1: 0, d2: 0 });
setCapitalMode('pfu');

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
  
// ===== Calcul automatique du nombre de parts =====

// Parts de base selon la situation familiale
const baseParts = status === 'couple' ? 2 : 1;

// Parts liées aux enfants
const childrenParts = children.reduce((sum, child, idx) => {
  const isFirstTwo = idx < 2;
  if (child.mode === 'charge') {
    return sum + (isFirstTwo ? 0.5 : 1);
  }
  if (child.mode === 'shared') {
    return sum + (isFirstTwo ? 0.25 : 0.5);
  }
  return sum;
}, 0);


// Majoration parent isolé (case T simplifiée)
const isolatedBonus =
  status === 'single' && isIsolated ? 0.5 : 0;

// Nombre de parts calculé automatiquement
const computedParts = baseParts + childrenParts + isolatedBonus;

// Ajustement manuel (par quart de part)
const effectiveParts = Math.max(
  baseParts,
  Math.round((computedParts + (Number(parts) || 0)) * 4) / 4
);


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
    (status === 'couple'
      ? realMode.d2 === 'reels'
        ? realExpenses.d2 || 0
        : realMode.d2 === 'abat10'
        ? abat10SalD2
        : 0
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
      capitalMode,
      personsAChargeCount: Array.isArray(children)
  ? children.filter((c) => c && (c.mode === 'charge' || c.mode === 'shared')).length
  : 0,
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
    capitalMode,
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
      rows.push(['Nombre de parts', result.partsNb]);
      rows.push([
        'Zone géographique',
        location === 'metropole'
          ? 'Métropole'
          : location === 'gmr'
          ? 'Guadeloupe / Martinique / Réunion'
          : 'Guyane / Mayotte',
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
} else {
  // Célibataire / Veuf / Divorcé :
  // On efface les revenus du déclarant 2
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
// quel que soit le cas, on remet l’ajustement manuel à 0
setParts(0);
}}
              >
                <option value="single">Célibataire / Veuf / Divorcé</option>
                <option value="couple">Marié / Pacsé</option>
              </select>
            </div>
          </div>

          <div className="ir-table-wrapper">
            <table
            className={`ir-table ${status === 'single' ? 'ir-table-single' : ''}`}
            aria-label="Revenus imposables"
            >
              <colgroup>
                <col style={{ width: '40%' }} />
                <col style={{ width: '30%' }} />
                <col style={{ width: '30%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Revenus imposables</th>
                  <th>Déclarant 1</th>
                  <th>Déclarant 2</th>
                </tr>
              </thead>
              <tbody>
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
                <tr className="ir-row-title">
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
                        (status === 'couple' ? incomes.d2.pensions || 0 : 0);
                      const val = computeAbattement10(baseRet, cfgRet);
                      return euro0(val);
                    })()}
                  </td>
                </tr>


<tr>
  <td>Revenus fonciers nets</td>
  <td colSpan={2}>
    <input
      type="text"
      inputMode="numeric"
      placeholder="0 €"
      value={formatMoneyInput(incomes.fonciersFoyer || 0)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, '');
        const val = raw === '' ? 0 : Number(raw);
        setIncomes((prev) => ({
          ...prev,
          fonciersFoyer: val,
        }));
      }}
    />
  </td>
</tr>

<tr>
  <td>RCM soumis aux PS à 17,2 %</td>
  <td colSpan={2}>
    <input
      type="text"
      inputMode="numeric"
      placeholder="0 €"
      value={formatMoneyInput(incomes.capital.withPs)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, '');
        updateIncome('capital', 'withPs', raw === '' ? 0 : Number(raw));
      }}
    />
  </td>
</tr>

<tr>
  <td>RCM non soumis aux PS à 17,2 %</td>
  <td colSpan={2}>
    <input
      type="text"
      inputMode="numeric"
      placeholder="0 €"
      value={formatMoneyInput(incomes.capital.withoutPs)}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d]/g, '');
        updateIncome('capital', 'withoutPs', raw === '' ? 0 : Number(raw));
      }}
    />
  </td>
</tr>
<tr>
  <td>Option d&apos;imposition des RCM</td>
  <td colSpan={2}>
    <select
      value={capitalMode}
      onChange={(e) => setCapitalMode(e.target.value)}
      style={{ width: '100%' }}
    >
      <option value="pfu">PFU 12,8 %</option>
      <option value="bareme">Barème de l&apos;IR (abattement 40 %)</option>
    </select>
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

        {/* Bloc de droite */}
        <div className="ir-right">
          <div className="ir-field">
            <label>Résidence</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="metropole">Métropole</option>
              <option value="gmr">
                Guadeloupe / Martinique / Réunion
              </option>
              <option value="guyane">Guyane / Mayotte</option>
            </select>
          </div>

          {status === 'single' && (
            <div className="ir-field">
              <label>Situation familiale particulière</label>

              <label style={{ fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={isIsolated}
                  onChange={(e) => setIsIsolated(e.target.checked)}
                  style={{ marginRight: 6 }}
                />
                Parent isolé
              </label>
            </div>
          )}

          <button
            type="button"
            className="chip"
            onClick={() =>
              setChildren((c) => [
                ...c,
                { id: Date.now(), mode: 'charge' },
              ])
            }
          >
            + Ajouter un enfant
          </button>

          {children.map((child, idx) => (
            <div
              key={child.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                marginTop: 4,
              }}
            >
              <strong>Enfant {idx + 1}</strong>

<select
  className="ir-child-select"
  value={child.mode}
  onChange={(e) =>
    setChildren((list) =>
      list.map((c) =>
        c.id === child.id ? { ...c, mode: e.target.value } : c
      )
    )
  }
>
  <option value="charge">À charge</option>
  <option value="shared">Garde alternée</option>
</select>


              <button
                type="button"
                className="chip"
                style={{ padding: '2px 6px', fontSize: 12 }}
                onClick={() =>
                  setChildren((list) =>
                    list.filter((c) => c.id !== child.id)
                  )
                }
              >
                −
              </button>
            </div>
          ))}

<div className="ir-parts-row">
  <div className="ir-field">
    <label>Nombre de parts (calculé)</label>
    <input
      type="text"
      readOnly
      value={effectiveParts.toFixed(2)}
      style={{ background: '#f3f3f3' }}
    />
  </div>

  <div className="ir-field">
    <label>Ajustement de parts</label>
    <input
      type="number"
      step="0.25"
      value={parts}
      onChange={(e) =>
        setParts(
          Math.round(Number(e.target.value || 0) * 4) / 4
        )
      }
      title="Ajustement manuel"
    />
  </div>
</div>


          <div className="ir-tmi-card">
            <div className="ir-tmi-header">Estimation IR</div>

            <div className="ir-tmi-bar">
              {tmiScale.map((br, idx) => {
                const rate = Number(br.rate) || 0;
                const isActive = rate === (result?.tmiRate || 0);
                return (
                  <div
                    key={idx}
                    className={`ir-tmi-segment${
                      isActive ? ' is-active' : ''
                    }`}
                  >
                    <span>{rate}%</span>
                  </div>
                );
              })}
            </div>

            <div className="ir-tmi-rows">
              <div className="ir-tmi-row">
                <span>TMI</span>
                <span>
                  {result ? `${result.tmiRate || 0} %` : '-'}
                </span>
              </div>
              <div className="ir-tmi-row">
                <span>Impôt sur le revenu</span>
                <span>
                  {result ? euro0(result.irNet || 0) : '-'}
                </span>
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
                <span>Impôt sur le revenu</span>
                <span>{euro0(result.irNet || 0)}</span>
              </div>
              <div className="ir-summary-row">
                <span>PFU 12,8 %</span>
                <span>{euro0(result.pfuIr || 0)}</span>
              </div>
              <div className="ir-summary-row">
                <span>CEHR</span>
                <span>{euro0(result.cehr || 0)}</span>
              </div>
              <div className="ir-summary-row">
                <span>CDHR</span>
                <span>{euro0(result.cdhr || 0)}</span>
              </div>
              <div className="ir-summary-row">
                <span>PS sur les revenus fonciers</span>
                <span>{euro0(result.psFoncier || 0)}</span>
              </div>
              <div className="ir-summary-row">
                <span>PS sur dividendes</span>
                <span>{euro0(result.psDividends || 0)}</span>
              </div>
              <div className="ir-summary-row">
                <span>Imposition totale</span>
                <span>{euro0(result.totalTax || 0)}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            className="chip"
            onClick={() => setShowDetails((v) => !v)}
            style={{ marginTop: 12 }}
          >
            {showDetails
              ? 'Masquer le détail du calcul'
              : 'Afficher le détail du calcul'}
          </button>
        </div> {/* fin .ir-right */}

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

<h4>CDHR</h4>
{result.cdhrDetails ? (
  <table className="ir-details-table">
    <tbody>
      <tr>
        <td>Terme 1 : {result.cdhrDetails.minEffectiveRate}% × RFR</td>
        <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.terme1)}</td>
      </tr>
      <tr>
        <td>Terme 2 : IR progressif (avant décote)</td>
        <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.irProgressifAvantDecote)}</td>
      </tr>
      <tr>
        <td>+ PFU 12,8% (part IR)</td>
        <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.pfuIr)}</td>
      </tr>
      <tr>
        <td>+ CEHR</td>
        <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.cehr)}</td>
      </tr>
      <tr>
        <td>+ Majoration</td>
        <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.majoration)}</td>
      </tr>
      <tr>
        <td><strong>CDHR = max(0, Terme 1 − Terme 2)</strong></td>
        <td style={{ textAlign: 'right' }}><strong>{euro0(result.cdhr || 0)}</strong></td>
      </tr>
    </tbody>
  </table>
) : (
  <p>Aucune CDHR due.</p>
)}

          
        </div>
      )}
<div className="ir-disclaimer">
  <p>
    Le simulateur ne prend pas en compte certaines situations particulières (enfants
    majeurs rattachés, pensions complexes, fiscalité étrangère). Ces situations peuvent
    nécessiter une analyse personnalisée.
  </p>
</div>



    </div>
  );
}
