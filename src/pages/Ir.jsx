// src/pages/Ir.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { buildXlsxBlob, downloadXlsx, validateXlsxBlob } from '../utils/xlsxBuilder';
import './Ir.css';
import '../styles/premium-shared.css';
import { onResetEvent, storageKeyFor } from '../utils/reset';
import { toNumber } from '../utils/number';
import { computeIrResult as computeIrResultEngine } from '../utils/irEngine.js';
import { getFiscalSettings, addInvalidationListener } from '../utils/fiscalSettingsCache.js';
import { useTheme } from '../settings/ThemeProvider';
import { buildIrStudyDeck } from '../pptx/presets/irDeckBuilder';
import { exportAndDownloadStudyDeck } from '../pptx/export/exportStudyDeck';
import { supabase } from '../supabaseClient';

// ---- Helpers formats ----
const fmt0 = (n) => (Math.round(Number(n) || 0)).toLocaleString('fr-FR');
const euro0 = (n) => `${fmt0(n)} €`;
const fmtPct = (n) =>
  (Number(n) || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
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

/* ===============================
   Page IR
================================ */
export default function Ir() {
  // Theme colors and logo from ThemeProvider
  // pptxColors respects the theme scope setting (SER1 classic if ui-only)
  const { colors, logo, setLogo, pptxColors } = useTheme();

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

  // Persist dans sessionStorage
  const STORE_KEY = storageKeyFor('ir');
  const [hydrated, setHydrated] = useState(false);

  // Valeurs par défaut (fallback si Supabase ne répond pas)
  
  // Chargement des paramètres fiscaux via le cache (jamais de blocage infini)
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError('');
        const settings = await getFiscalSettings();
        if (!mounted) return;
        setTaxSettings(settings.tax);
        setPsSettings(settings.ps);
        setLoading(false);
      } catch (e) {
        console.error('[IR] Erreur chargement settings:', e);
        if (mounted) {
          setError('Erreur lors du chargement des paramètres');
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Invalidation cache après mise à jour admin (optionnel, pour cohérence)
  useEffect(() => {
    const remove = addInvalidationListener((kind) => {
      if (kind === 'tax' || kind === 'ps') {
        // Recharger immédiatement pour refléter les changements
        getFiscalSettings({ force: true }).then((settings) => {
          setTaxSettings(settings.tax);
          setPsSettings(settings.ps);
        });
      }
    });
    return remove;
  }, []);

  // Restauration depuis sessionStorage
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
          setChildren(Array.isArray(s.children) ? s.children : []);
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sauvegarde dans sessionStorage
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
        sessionStorage.removeItem(STORE_KEY);
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
    ? (taxSettings?.incomeTax?.currentYearLabel || '')
    : (taxSettings?.incomeTax?.previousYearLabel || '');


  const tmiScale =
  yearKey === 'current'
    ? taxSettings?.incomeTax?.scaleCurrent || []
    : taxSettings?.incomeTax?.scalePrevious || [];

  const pfuRateIR = toNum(taxSettings?.pfu?.[yearKey]?.rateIR, 12.8);
  const psPatrimonyRate = toNum(psSettings?.patrimony?.[yearKey]?.totalRate, 17.2);

  const cell = (v, style) => ({ v, style });

  async function exportExcel() {
    try {
      if (!result) {
        alert('Les résultats ne sont pas disponibles.');
        return;
      }

      const headerParams = [cell('Champ', 'sHeader'), cell('Valeur', 'sHeader')];
      const rowsParams = [];

      rowsParams.push([cell('Paramètres fiscaux', 'sSection'), cell('', 'sSection')]);
      rowsParams.push([cell('Barème', 'sText'), cell(yearLabel, 'sText')]);
      rowsParams.push([
        cell('Situation familiale', 'sText'),
        cell(status === 'couple' ? 'Marié / Pacsé' : 'Célibataire / Veuf / Divorcé', 'sText'),
      ]);
      rowsParams.push([cell('Parent isolé', 'sText'), cell(isIsolated ? 'Oui' : 'Non', 'sText')]);
      rowsParams.push([cell('Nombre de parts (calculé)', 'sText'), cell(result.partsNb || effectiveParts, 'sCenter')]);
      rowsParams.push([cell('Zone géographique', 'sText'), cell(location === 'metropole'
        ? 'Métropole'
        : location === 'gmr'
        ? 'Guadeloupe / Martinique / Réunion'
        : 'Guyane / Mayotte', 'sText')]);

      rowsParams.push([cell('Revenus', 'sSection'), cell('', 'sSection')]);
      rowsParams.push([cell('Salaires D1', 'sText'), cell(incomes.d1.salaries || 0, 'sMoney')]);
      rowsParams.push([cell('Salaires D2', 'sText'), cell(incomes.d2.salaries || 0, 'sMoney')]);
      rowsParams.push([cell('Associés/gérants D1', 'sText'), cell(incomes.d1.associes62 || 0, 'sMoney')]);
      rowsParams.push([cell('Associés/gérants D2', 'sText'), cell(incomes.d2.associes62 || 0, 'sMoney')]);
      rowsParams.push([cell('BIC/BNC/BA D1', 'sText'), cell(incomes.d1.bic || 0, 'sMoney')]);
      rowsParams.push([cell('BIC/BNC/BA D2', 'sText'), cell(incomes.d2.bic || 0, 'sMoney')]);
      rowsParams.push([cell('Pensions D1', 'sText'), cell(incomes.d1.pensions || 0, 'sMoney')]);
      rowsParams.push([cell('Pensions D2', 'sText'), cell(incomes.d2.pensions || 0, 'sMoney')]);
      rowsParams.push([cell('Revenus fonciers nets', 'sText'), cell(incomes.fonciersFoyer || 0, 'sMoney')]);
      rowsParams.push([cell('RCM soumis aux PS', 'sText'), cell(incomes.capital.withPs || 0, 'sMoney')]);
      rowsParams.push([cell('RCM hors PS', 'sText'), cell(incomes.capital.withoutPs || 0, 'sMoney')]);
      rowsParams.push([cell('Option RCM', 'sText'), cell(capitalMode === 'pfu' ? 'PFU (flat tax)' : 'Barème', 'sText')]);

      rowsParams.push([cell('Déductions / crédits', 'sSection'), cell('', 'sSection')]);
      rowsParams.push([cell('Frais réels D1', 'sText'), cell(realMode.d1 === 'reels' ? realExpenses.d1 || 0 : 0, 'sMoney')]);
      rowsParams.push([cell('Frais réels D2', 'sText'), cell(realMode.d2 === 'reels' ? realExpenses.d2 || 0 : 0, 'sMoney')]);
      rowsParams.push([cell('Déductions foyer', 'sText'), cell(deductions || 0, 'sMoney')]);
      rowsParams.push([cell('Crédits d’impôt', 'sText'), cell(credits || 0, 'sMoney')]);

      const headerSynth = [cell('Indicateur', 'sHeader'), cell('Valeur', 'sHeader')];
      const rowsSynth = [];
      rowsSynth.push([cell('Revenu imposable du foyer', 'sText'), cell(result.taxableIncome || 0, 'sMoney')]);
      rowsSynth.push([cell('Revenu imposable par part', 'sText'), cell(result.taxablePerPart || 0, 'sMoney')]);
      rowsSynth.push([cell('TMI', 'sText'), cell((result.tmiRate || 0) / 100, 'sPercent')]);
      rowsSynth.push([cell('Impôt sur le revenu', 'sText'), cell(result.irNet || 0, 'sMoney')]);
      rowsSynth.push([cell('PFU IR', 'sText'), cell(result.pfuIr || 0, 'sMoney')]);
      rowsSynth.push([cell('CEHR', 'sText'), cell(result.cehr || 0, 'sMoney')]);
      rowsSynth.push([cell('CDHR', 'sText'), cell(result.cdhr || 0, 'sMoney')]);
      rowsSynth.push([cell('PS fonciers', 'sText'), cell(result.psFoncier || 0, 'sMoney')]);
      rowsSynth.push([cell('PS dividendes', 'sText'), cell(result.psDividends || 0, 'sMoney')]);
      rowsSynth.push([cell('PS total', 'sText'), cell(result.psTotal || 0, 'sMoney')]);
      rowsSynth.push([cell('Imposition totale', 'sText'), cell(result.totalTax || 0, 'sMoney')]);

      const headerDetails = [
        cell('Poste', 'sHeader'),
        cell('Base', 'sHeader'),
        cell('Taux', 'sHeader'),
        cell('Impôt', 'sHeader'),
      ];

      const rowsDetails = [];
      rowsDetails.push([cell('Barème (tranches)', 'sSection'), cell('', 'sSection'), cell('', 'sSection'), cell('', 'sSection')]);
      (result.bracketsDetails || []).forEach((b) => {
        rowsDetails.push([
          cell(b.label || '', 'sText'),
          cell(b.base || 0, 'sMoney'),
          cell((b.rate || 0) / 100, 'sPercent'),
          cell(b.tax || 0, 'sMoney'),
        ]);
      });

      rowsDetails.push([cell('Décote', 'sText'), cell(result.decote || 0, 'sMoney'), cell('', 'sText'), cell('', 'sText')]);
      rowsDetails.push([cell('Avantage QF', 'sText'), cell(result.qfAdvantage || 0, 'sMoney'), cell('', 'sText'), cell('', 'sText')]);
      rowsDetails.push([cell('Crédits / Réductions', 'sText'), cell(result.creditsTotal || 0, 'sMoney'), cell('', 'sText'), cell('', 'sText')]);
      rowsDetails.push([cell('PFU IR', 'sText'), cell(result.pfuIr || 0, 'sMoney'), cell('', 'sText'), cell('', 'sText')]);
      rowsDetails.push([cell('CEHR', 'sText'), cell(result.cehr || 0, 'sMoney'), cell('', 'sText'), cell('', 'sText')]);
      rowsDetails.push([cell('CDHR', 'sText'), cell(result.cdhr || 0, 'sMoney'), cell('', 'sText'), cell('', 'sText')]);
      rowsDetails.push([cell('PS fonciers', 'sText'), cell(result.psFoncier || 0, 'sMoney'), cell('', 'sText'), cell('', 'sText')]);
      rowsDetails.push([cell('PS dividendes', 'sText'), cell(result.psDividends || 0, 'sMoney'), cell('', 'sText'), cell('', 'sText')]);
      rowsDetails.push([cell('PS total', 'sText'), cell(result.psTotal || 0, 'sMoney'), cell('', 'sText'), cell('', 'sText')]);

      const blob = await buildXlsxBlob({
        sheets: [
          {
            name: 'Paramètres',
            rows: [headerParams, ...rowsParams],
            columnWidths: [36, 22],
          },
          {
            name: 'Synthèse impôts',
            rows: [headerSynth, ...rowsSynth],
            columnWidths: [36, 22],
          },
          {
            name: 'Détails calculs',
            rows: [headerDetails, ...rowsDetails],
            columnWidths: [36, 18, 14, 18],
          },
        ],
        headerFill: colors?.c1,
        sectionFill: colors?.c7,
      });
      const isValid = await validateXlsxBlob(blob);
      if (!isValid) {
        throw new Error('XLSX invalide (signature PK manquante).');
      }
      downloadXlsx(blob, 'SER1_IR.xlsx');
    } catch (e) {
      console.error('Export Excel IR échoué', e);
      alert('Impossible de générer le fichier Excel.');
    }
  }

  async function exportPowerPoint() {
    if (!result) {
      alert('Les résultats ne sont pas disponibles.');
      return;
    }

    try {
      // CRITICAL: Ensure logo is loaded before export
      // If logo is not available in context, try to reload it from user metadata
      let exportLogo = logo;
      if (!exportLogo) {
        console.info('[IR Export] Logo not in context, attempting to reload from user metadata...');
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.user_metadata?.cover_slide_url) {
            exportLogo = user.user_metadata.cover_slide_url;
            // Also update the context for future exports
            setLogo(exportLogo);
            console.info('[IR Export] Logo reloaded successfully');
          } else {
            console.info('[IR Export] No logo found in user metadata');
          }
        } catch (logoError) {
          console.warn('[IR Export] Failed to reload logo:', logoError);
        }
      }

      // Build IR data from current result
      const irData = {
        taxableIncome: result.taxableIncome || 0,
        partsNb: result.partsNb || effectiveParts,
        taxablePerPart: result.taxablePerPart || 0,
        tmiRate: result.tmiRate || 0,
        irNet: result.irNet || 0,
        totalTax: result.totalTax || 0,
        // Income breakdown for KPI display - sum of activity incomes BEFORE abatement
        // = Traitements et salaires + Revenus associés/gérants + BIC-BNC-BA + Pensions
        income1: (incomes.d1.salaries || 0) + (incomes.d1.associes62 || 0) + (incomes.d1.bic || 0) + (incomes.d1.pensions || 0),
        income2: (incomes.d2.salaries || 0) + (incomes.d2.associes62 || 0) + (incomes.d2.bic || 0) + (incomes.d2.pensions || 0),
        pfuIr: result.pfuIr || 0,
        cehr: result.cehr || 0,
        cdhr: result.cdhr || 0,
        psFoncier: result.psFoncier || 0,
        psDividends: result.psDividends || 0,
        psTotal: result.psTotal || 0,
        status: status,
        childrenCount: children.length,
        location: location,
        decote: result.decote || 0,
        qfAdvantage: result.qfAdvantage || 0,
        creditsTotal: result.creditsTotal || 0,
        bracketsDetails: result.bracketsDetails || [],
        // TMI details (exact values from IR card)
        tmiBaseGlobal: result.tmiBaseGlobal || 0,
        tmiMarginGlobal: result.tmiMarginGlobal || null,
        // Client name will be passed from user profile if available
        clientName: undefined, // TODO: Get from user profile or form input
      };

      // Build deck spec using pptxColors (respects theme scope setting)
      // Use exportLogo which is guaranteed to be loaded if available
      const deck = buildIrStudyDeck(irData, pptxColors, exportLogo);

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `simulation-ir-${dateStr}.pptx`;

      // Export and download using pptxColors (respects theme scope setting)
      await exportAndDownloadStudyDeck(deck, pptxColors, filename);
    } catch (error) {
      console.error('Export PowerPoint IR échoué:', error);
      alert('Erreur lors de la génération du PowerPoint. Veuillez réessayer.');
    }
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
    <div className="ir-panel premium-page">
      <div className="ir-header premium-header">
        <div className="ir-title premium-title">Simulateur d'impôt sur le revenu</div>

        <div ref={exportRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="chip premium-btn"
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
                className="chip premium-btn"
                style={{width:'100%', justifyContent:'flex-start'}}
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
                className="chip premium-btn"
                style={{width:'100%', justifyContent:'flex-start'}}
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

      <div className="ir-grid premium-grid">
        {/* Bloc de gauche : saisie */}
        <div className="ir-left premium-section">
          <div className="ir-table-wrapper premium-card premium-section">
            <div className="ir-top-row">
              <div className="ir-field premium-field">
                <label>Barème</label>
                <select
                  className="premium-select"
                  value={yearKey}
                  onChange={(e) => setYearKey(e.target.value)}
                >
                  <option value="current">
                    {taxSettings?.incomeTax?.currentYearLabel || 'Année N'}
                  </option>
                  <option value="previous">
                    {taxSettings?.incomeTax?.previousYearLabel || 'Année N-1'}
                  </option>
                </select>
              </div>

              <div className="ir-field premium-field">
                <label>Situation familiale</label>
                <select
                  className="premium-select"
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
  <td>RCM soumis aux PS à {fmtPct(psPatrimonyRate)} %</td>
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
  <td>RCM non soumis aux PS à {fmtPct(psPatrimonyRate)} %</td>
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
      <option value="pfu">PFU {fmtPct(pfuRateIR)} %</option>
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
                Marge avant changement de TMI :{' '}
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
                <span>PFU {fmtPct(pfuRateIR)} %</span>
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
          <table className="ir-table premium-table">
            <thead>
              <tr>
                <th>Tranche</th>
                <th>Base (par part)</th>
                <th>Taux</th>
                <th>Impôt (par part)</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(result.bracketsDetails) ? result.bracketsDetails : []).map((row, idx) => (
                <tr key={idx}>
                  <td>{row.label}</td>
                  <td>{euro0(row.base)}</td>
                  <td>{row.rate} %</td>
                  <td>{euro0(row.tax)}</td>
                </tr>
              ))}
            </tbody>
          </table>
    <table className="ir-table premium-table">
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
        {(result.domAbatementAmount || 0) > 0 && (
  <tr>
    <td>Abattement DOM</td>
    <td style={{ textAlign: 'right' }}>
      - {euro0(result.domAbatementAmount)}
    </td>
  </tr>
)}
        <tr>
  <td>Impôt après abattement DOM</td>
  <td style={{ textAlign: 'right' }}>
    {euro0(Math.max(0, (result.irAfterQf || 0) - (result.domAbatementAmount || 0)))}
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
            <table className="ir-table premium-table">
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
  <table className="ir-table premium-table">
    <tbody>
      <tr>
        <td>Assiette (RFR)</td>
        <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.assiette)}</td>
      </tr>

      <tr>
        <td>Terme A (avant décote) : {result.cdhrDetails.minRatePercent}% × assiette</td>
        <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.termA_beforeDecote)}</td>
      </tr>

      <tr>
        <td>Décote CDHR appliquée</td>
        <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.decoteApplied)}</td>
      </tr>

      <tr>
        <td><strong>Terme A (après décote)</strong></td>
        <td style={{ textAlign: 'right' }}><strong>{euro0(result.cdhrDetails.termA_afterDecote)}</strong></td>
      </tr>

      <tr>
        <td>Terme B : IR retenu</td>
        <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.irRetenu)}</td>
      </tr>

      <tr>
        <td>+ PFU {fmtPct(pfuRateIR)}% (part IR)</td>
        <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.pfuIr)}</td>
      </tr>

      <tr>
        <td>+ CEHR</td>
        <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.cehr)}</td>
      </tr>

      <tr>
        <td>
          + Majorations (couple + charges) — charges : {result.cdhrDetails.personsAChargeCount}
        </td>
        <td style={{ textAlign: 'right' }}>{euro0(result.cdhrDetails.majorations)}</td>
      </tr>

      <tr>
        <td style={{ paddingLeft: 18, opacity: 0.85 }}>• Majoration couple</td>
        <td style={{ textAlign: 'right', opacity: 0.85 }}>{euro0(result.cdhrDetails.majCouple)}</td>
      </tr>

      <tr>
        <td style={{ paddingLeft: 18, opacity: 0.85 }}>• Majoration personnes à charge</td>
        <td style={{ textAlign: 'right', opacity: 0.85 }}>{euro0(result.cdhrDetails.majCharges)}</td>
      </tr>

      <tr>
        <td><strong>CDHR = max(0, Terme A (après décote) − Terme B)</strong></td>
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
  <strong>Hypothèses / simplifications</strong>
  <p>
    RCM au barème : abattement forfaitaire de 40% sur l&apos;assiette IR (simplifié).
  </p>
  <p>
    RFR (CEHR / CDHR) : revenu imposable + RCM au PFU (simplifié).
  </p>
  <p>
    CDHR : certains paramètres (décote / majorations) utilisent des valeurs par défaut si non paramétrés.
  </p>
  <p>
    Le simulateur ne prend pas en compte certaines situations particulières (enfants
    majeurs rattachés, pensions complexes, fiscalité étrangère, transfert de domicile en cours d'année, ...).
    <br />
    Ces situations peuvent nécessiter une analyse personnalisée.
  </p>
</div>



    </div>
  );
}
