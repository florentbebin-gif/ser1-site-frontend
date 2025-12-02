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

// ---- Calcul IR progressif + TMI ----
function computeProgressiveTax(scale = [], taxablePerPart) {
  if (!Array.isArray(scale) || !scale.length || taxablePerPart <= 0) {
    return {
      taxPerPart: 0,
      tmiRate: 0,
      tmiBasePerPart: 0,
      bracketsDetails: [],
    };
  }

  let remaining = taxablePerPart;
  let tax = 0;
  let tmiRate = 0;
  let tmiBasePerPart = 0;
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
    }

    if (to == null || taxablePerPart <= to) break;
  }

  return {
    taxPerPart: tax,
    tmiRate,
    tmiBasePerPart,
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
  status, // 'single' | 'couple'
  parts,
  location, // 'metropole' | 'gmr' | 'guyane'
  incomes,
  deductions,
  credits,
  taxSettings,
  psSettings,
}) {
  if (!taxSettings || !psSettings) return null;

  const incomeTaxCfg = taxSettings.incomeTax || {};
  const scale = (incomeTaxCfg.scale && incomeTaxCfg.scale[yearKey]) || [];

  const cehrCfg = taxSettings.cehr || {};
  const cehrBrackets =
    cehrCfg[yearKey] && cehrCfg[yearKey][status === 'couple' ? 'couple' : 'single'];

  const cdhrCfg = taxSettings.cdhr && taxSettings.cdhr[yearKey];

  const retirementCfg = psSettings.retirement || {};
  const psBrackets =
    retirementCfg[yearKey] && retirementCfg[yearKey].brackets
      ? retirementCfg[yearKey].brackets
      : [];
  const psThresholdsByLoc =
    retirementCfg.thresholds &&
    retirementCfg.thresholds[yearKey] &&
    retirementCfg.thresholds[yearKey][location];

  const partsNb = Math.max(0.5, Number(parts) || 1);

  const totalIncomeD1 =
    (incomes.d1.salaries || 0) +
    (incomes.d1.pensions || 0) +
    (incomes.d1.bic || 0) +
    (incomes.d1.fonciers || 0) +
    (incomes.d1.autres || 0);

  const totalIncomeD2 =
    (incomes.d2.salaries || 0) +
    (incomes.d2.pensions || 0) +
    (incomes.d2.bic || 0) +
    (incomes.d2.fonciers || 0) +
    (incomes.d2.autres || 0);

  const totalIncome = totalIncomeD1 + totalIncomeD2;
  const deductionsTotal = Math.max(0, deductions || 0);
  const creditsTotal = Math.max(0, credits || 0);

  const taxableIncome = Math.max(0, totalIncome - deductionsTotal);
  const taxablePerPart = partsNb > 0 ? taxableIncome / partsNb : taxableIncome;

  const {
    taxPerPart,
    tmiRate,
    tmiBasePerPart,
    bracketsDetails,
  } = computeProgressiveTax(scale, taxablePerPart);

  const irBrutFoyer = taxPerPart * partsNb;
  const irNetAfterCredits = Math.max(0, irBrutFoyer - creditsTotal);

  // On approxime le RFR par le revenu imposable
  const rfr = taxableIncome;

  const { cehr, cehrDetails } = computeCEHR(cehrBrackets, rfr);
  const { cdhr } = computeCDHR(
    cdhrCfg,
    rfr,
    irNetAfterCredits + cehr,
    status === 'couple' ? 'couple' : 'single'
  );

  // PS sur pensions de retraite
  let psRateLabel = null;
  let psRateTotal = 0;
  let psTotal = 0;

  const thresholds = computeRfrThresholdsForParts(psThresholdsByLoc, partsNb);
  const psBracketLabel = determinePsBracketLabel(rfr, thresholds);

  if (psBracketLabel) {
    const psBracket = psBrackets.find((b) => b.label === psBracketLabel);
    if (psBracket) {
      psRateLabel = psBracket.label;
      psRateTotal = Number(psBracket.totalRate) || 0;

      const pensionsBase = (incomes.d1.pensions || 0) + (incomes.d2.pensions || 0);
      psTotal = pensionsBase * (psRateTotal / 100);
    }
  }

  const tmiBaseGlobal = tmiBasePerPart * partsNb;

  const totalTax = irNetAfterCredits + cehr + cdhr + psTotal;

  return {
    totalIncome,
    totalIncomeD1,
    totalIncomeD2,
    taxableIncome,
    taxablePerPart,
    partsNb,
    irBrutFoyer,
    irNetAfterCredits,
    tmiRate,
    tmiBasePerPart,
    tmiBaseGlobal,
    bracketsDetails,
    rfr,
    cehr,
    cehrDetails,
    cdhr,
    psTotal,
    psRateLabel,
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
  const [parts, setParts] = useState(2);
  const [location, setLocation] = useState('metropole'); // metropole | gmr | guyane

  const [incomes, setIncomes] = useState({
    d1: { salaries: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
    d2: { salaries: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
  });

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
          setParts(s.parts ?? 2);
          setLocation(s.location ?? 'metropole');
          setIncomes(
            s.incomes ?? {
              d1: { salaries: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
              d2: { salaries: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
            }
          );
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
          parts,
          location,
          incomes,
          deductions,
          credits,
        })
      );
    } catch {
      // ignore
    }
  }, [STORE_KEY, hydrated, yearKey, status, parts, location, incomes, deductions, credits]);

  // Reset global depuis la topbar
  useEffect(() => {
    const off = onResetEvent?.(({ simId }) => {
      // ne réagit qu'au reset du simulateur IR
      if (simId && simId !== 'ir') return;

      setYearKey('current');
      setStatus('couple');
      setParts(2);
      setLocation('metropole');
      setIncomes({
        d1: { salaries: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
        d2: { salaries: 0, pensions: 0, bic: 0, fonciers: 0, autres: 0 },
      });
      setDeductions(0);
      setCredits(0);

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

  // Calcul principal
  const result = useMemo(
    () =>
      computeIrResult({
        yearKey,
        status,
        parts,
        location,
        incomes,
        deductions,
        credits,
        taxSettings,
        psSettings,
      }),
    [yearKey, status, parts, location, incomes, deductions, credits, taxSettings, psSettings]
  );

  const yearLabel =
    yearKey === 'current'
      ? '2025 (RFR 2023 & Avis IR 2024)'
      : '2024 (RFR 2022 & Avis IR 2023)';

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
      rows.push(['IR (après crédits)', euro0(result.irNetAfterCredits)]);
      rows.push(['CEHR', euro0(result.cehr)]);
      rows.push(['CDHR', euro0(result.cdhr)]);
      rows.push(['Prélèvements sociaux retraite', euro0(result.psTotal)]);
      rows.push(['Impôts totaux (IR + CEHR + CDHR + PS)', euro0(result.totalTax)]);

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
        <span>Simulateur d&apos;impôt sur le revenu</span>

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
                <option value="current">
                  2025 (RFR 2023 &amp; Avis IR 2024)
                </option>
                <option value="previous">
                  2024 (RFR 2022 &amp; Avis IR 2023)
                </option>
              </select>
            </div>

            <div className="ir-field">
              <label>Situation familiale</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="single">Célibataire / Veuf / Divorcé</option>
                <option value="couple">Marié / Pacsé</option>
              </select>
            </div>

            <div className="ir-field">
              <label>Nombre de parts</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={parts}
                onChange={(e) => setParts(toNum(e.target.value, 1))}
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
                      type="number"
                      value={incomes.d1.salaries}
                      onChange={(e) => updateIncome('d1', 'salaries', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={incomes.d2.salaries}
                      onChange={(e) => updateIncome('d2', 'salaries', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Pensions, retraites et rentes</td>
                  <td>
                    <input
                      type="number"
                      value={incomes.d1.pensions}
                      onChange={(e) => updateIncome('d1', 'pensions', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={incomes.d2.pensions}
                      onChange={(e) => updateIncome('d2', 'pensions', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td>BIC-BNC-BA imposables</td>
                  <td>
                    <input
                      type="number"
                      value={incomes.d1.bic}
                      onChange={(e) => updateIncome('d1', 'bic', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={incomes.d2.bic}
                      onChange={(e) => updateIncome('d2', 'bic', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Revenus fonciers nets</td>
                  <td>
                    <input
                      type="number"
                      value={incomes.d1.fonciers}
                      onChange={(e) => updateIncome('d1', 'fonciers', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={incomes.d2.fonciers}
                      onChange={(e) => updateIncome('d2', 'fonciers', e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Autres revenus imposables</td>
                  <td>
                    <input
                      type="number"
                      value={incomes.d1.autres}
                      onChange={(e) => updateIncome('d1', 'autres', e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={incomes.d2.autres}
                      onChange={(e) => updateIncome('d2', 'autres', e.target.value)}
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
                      type="number"
                      value={deductions}
                      onChange={(e) => setDeductions(toNum(e.target.value, 0))}
                    />
                  </td>
                </tr>
                <tr>
                  <td>Réductions / crédits d&apos;impôt</td>
                  <td colSpan={2}>
                    <input
                      type="number"
                      value={credits}
                      onChange={(e) => setCredits(toNum(e.target.value, 0))}
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
              {(taxSettings?.incomeTax?.scale?.[yearKey] || []).map((br, idx) => {
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
                <span>IR total (IR + CEHR + CDHR + PS)</span>
                <span>{result ? euro0(result.totalTax) : '-'}</span>
              </div>
            </div>

            <div className="ir-tmi-sub">
              Montant des revenus dans cette TMI :{' '}
              {result ? euro0(result.tmiBaseGlobal) : '0 €'}
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
                <span>IR (après crédits)</span>
                <span>{euro0(result.irNetAfterCredits)}</span>
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
                <span>Prélèvements sociaux retraite</span>
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
