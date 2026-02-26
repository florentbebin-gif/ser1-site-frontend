/**
 * useCreditExports.js — Hook d'export Excel & PPTX pour CreditV2
 *
 * Adapté depuis Credit.jsx legacy.
 * Reçoit le state centralisé + les calculs du hook useCreditCalculations.
 */

import { useCallback } from 'react';
import { labelMonthFR, addMonths } from '../utils/creditFormatters.js';

// ============================================================================
// HELPERS (extraits de Credit.jsx legacy)
// ============================================================================

function aggregateToYearsFromRows(rows, startYMBase) {
  const map = new Map();
  rows.forEach((r, idx) => {
    if (!r) return;
    const ym = addMonths(startYMBase, idx);
    const year = ym.split('-')[0];
    const acc = map.get(year) || { interet: 0, assurance: 0, amort: 0, mensu: 0, mensuTotal: 0, crd: 0, assuranceDeces: null };
    acc.interet += r.interet || 0;
    acc.assurance += r.assurance || 0;
    acc.amort += r.amort || 0;
    acc.mensu += r.mensu || 0;
    acc.mensuTotal += r.mensuTotal || 0;
    acc.crd = r.crd || acc.crd || 0;
    if (acc.assuranceDeces === null) acc.assuranceDeces = r.assuranceDeces ?? null;
    map.set(year, acc);
  });
  return Array.from(map.entries()).map(([periode, v]) => ({ periode, ...v }));
}

function attachMonthLabels(rows, startYM) {
  return rows.map((r, idx) => ({ periode: labelMonthFR(addMonths(startYM, idx)), ...r }));
}

function transpose(aoa) {
  if (!aoa.length) return aoa;
  const rows = aoa.length;
  const cols = Math.max(...aoa.map(r => r.length));
  const out = Array.from({ length: cols }, () => Array(rows).fill(''));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out[c][r] = aoa[r][c] ?? '';
    }
  }
  return out;
}

const toNum = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

// ============================================================================
// HOOK
// ============================================================================

export function useCreditExports({
  state,
  calc,
  themeColors,
  cabinetLogo,
  logoPlacement,
  pptxColors,
  setExportLoading,
}) {
  const { startYM } = state;
  const isAnnual = state.viewMode === 'annuel';

  // ---- Excel ----
  const exportExcel = useCallback(async () => {
    setExportLoading(true);
    try {
      const { buildXlsxBlob, downloadXlsx, validateXlsxBlob } = await import('../../../utils/xlsxBuilder');

      const cell = (v, style) => ({ v, style });

      const headerResume = [
        cell('Période', 'sHeader'),
        cell('Intérêts', 'sHeader'),
        cell('Assurance', 'sHeader'),
        cell('Amort.', 'sHeader'),
        cell(isAnnual ? 'Annuité' : 'Mensualité', 'sHeader'),
        cell(isAnnual ? 'Annuité + Assur.' : 'Mensualité + Assur.', 'sHeader'),
        cell('CRD total', 'sHeader'),
        cell('Assurance décès', 'sHeader'),
      ];
      const headerPret = [
        cell('Période', 'sHeader'),
        cell('Intérêts', 'sHeader'),
        cell('Assurance', 'sHeader'),
        cell('Amort.', 'sHeader'),
        cell(isAnnual ? 'Annuité' : 'Mensualité', 'sHeader'),
        cell(isAnnual ? 'Annuité + Assur.' : 'Mensualité + Assur.', 'sHeader'),
        cell('CRD', 'sHeader'),
        cell('Capitaux décès', 'sHeader'),
      ];

      // Onglet PARAMÈTRES
      const headerParams = [cell('Champ', 'sHeader'), cell('Valeur', 'sHeader')];
      const rowsParams = [];
      const p1 = state.pret1;

      rowsParams.push([cell('Prêt 1', 'sSection'), cell('', 'sSection')]);
      rowsParams.push([cell('Type de crédit (Prêt 1)', 'sText'), cell(p1.type === 'amortissable' ? 'Amortissable' : 'In fine', 'sText')]);
      rowsParams.push([cell('Date de souscription (Prêt 1)', 'sText'), cell(startYM ? labelMonthFR(startYM) : '', 'sText')]);
      rowsParams.push([cell('Durée (mois) — Prêt 1', 'sText'), cell(p1.duree, 'sCenter')]);
      rowsParams.push([cell('Montant emprunté (Prêt 1)', 'sText'), cell(toNum(p1.capital), 'sMoney')]);
      rowsParams.push([cell('Taux annuel (crédit) — Prêt 1', 'sText'), cell((Number(p1.taux) || 0) / 100, 'sPercent')]);
      rowsParams.push([cell('Mensualité (hors assurance) — Prêt 1', 'sText'), cell(toNum(calc.mensuBasePret1), 'sMoney')]);
      rowsParams.push([cell('Mensualité totale estimée', 'sText'), cell(Math.round(calc.synthese.mensualiteTotaleM1 + calc.synthese.primeAssMensuelle), 'sMoney')]);
      rowsParams.push([cell("Mode de l'assurance (Prêt 1)", 'sText'), cell((p1.assurMode || state.assurMode) === 'CI' ? 'Capital initial' : 'Capital restant dû', 'sText')]);
      rowsParams.push([cell('Taux annuel (assurance) — Prêt 1', 'sText'), cell((Number(p1.tauxAssur) || 0) / 100, 'sPercent')]);
      rowsParams.push([cell('Quotité assurée — Prêt 1', 'sText'), cell(p1.quotite / 100, 'sPercent')]);
      rowsParams.push([cell('Vue', 'sText'), cell(isAnnual ? 'Vue annuelle' : 'Vue mensuelle', 'sText')]);
      rowsParams.push([cell('Lissage prêt 1', 'sText'), cell(state.lisserPret1 ? (state.lissageMode === 'mensu' ? 'Mensualité constante' : 'Durée constante') : 'Aucun', 'sText')]);

      // Prêts additionnels
      [state.pret2, state.pret3].forEach((p, idx) => {
        if (!p) return;
        const k = idx + 2;
        const pAssurMode = p.assurMode || state.assurMode || 'CRD';
        rowsParams.push([cell(`Prêt ${k}`, 'sSection'), cell('', 'sSection')]);
        rowsParams.push([cell(`Prêt ${k} - Type de crédit`, 'sText'), cell((p.type || state.creditType) === 'amortissable' ? 'Amortissable' : 'In fine', 'sText')]);
        rowsParams.push([cell(`Prêt ${k} - Montant emprunté`, 'sText'), cell(toNum(p.capital), 'sMoney')]);
        rowsParams.push([cell(`Prêt ${k} - Durée (mois)`, 'sText'), cell(toNum(p.duree), 'sCenter')]);
        rowsParams.push([cell(`Prêt ${k} - Taux annuel (crédit)`, 'sText'), cell((Number(p.taux || 0) || 0) / 100, 'sPercent')]);
        rowsParams.push([cell(`Prêt ${k} - Taux annuel (assurance)`, 'sText'), cell((Number(p.tauxAssur || 0) || 0) / 100, 'sPercent')]);
        rowsParams.push([cell(`Prêt ${k} - Mode assurance`, 'sText'), cell(pAssurMode === 'CI' ? 'Capital initial' : 'Capital restant dû', 'sText')]);
        rowsParams.push([cell(`Prêt ${k} - Quotité assurée`, 'sText'), cell((p.quotite ?? 100) / 100, 'sPercent')]);
        rowsParams.push([cell(`Prêt ${k} - Date de souscription`, 'sText'), cell(p.startYM ? labelMonthFR(p.startYM) : '', 'sText')]);
      });

      // Résumé
      const tableDisplay = isAnnual
        ? aggregateToYearsFromRows(calc.agrRows, startYM)
        : attachMonthLabels(calc.agrRows, startYM);

      const resumeRows = tableDisplay.map((l) => [
        cell(l.periode, 'sCenter'),
        cell(Math.round(l.interet), 'sMoney'),
        cell(Math.round(l.assurance), 'sMoney'),
        cell(Math.round(l.amort), 'sMoney'),
        cell(Math.round(l.mensu), 'sMoney'),
        cell(Math.round(l.mensuTotal), 'sMoney'),
        cell(Math.round(l.crd), 'sMoney'),
        cell(Math.round(l.assuranceDeces ?? 0), 'sMoney'),
      ]);

      // Détail par prêt
      const mapRows = (rows) => (isAnnual
        ? aggregateToYearsFromRows(rows, startYM)
        : attachMonthLabels(rows, startYM)
      ).map((l) => [
        cell(l.periode, 'sCenter'),
        cell(Math.round(l?.interet ?? 0), 'sMoney'),
        cell(Math.round(l?.assurance ?? 0), 'sMoney'),
        cell(Math.round(l?.amort ?? 0), 'sMoney'),
        cell(Math.round(l?.mensu ?? 0), 'sMoney'),
        cell(Math.round(l?.mensuTotal ?? 0), 'sMoney'),
        cell(Math.round(l?.crd ?? 0), 'sMoney'),
        cell(Math.round(l?.assuranceDeces ?? 0), 'sMoney'),
      ]);

      const pret1Arr = mapRows(calc.pret1Rows);
      const pret2Arr = calc.pret2Rows.length > 0 ? mapRows(calc.pret2Rows.filter(r => r)) : [];
      const pret3Arr = calc.pret3Rows.length > 0 ? mapRows(calc.pret3Rows.filter(r => r)) : [];

      const sheets = [
        { name: 'Paramètres', rows: [headerParams, ...rowsParams], columnWidths: [36, 22] },
        { name: 'Résumé', rows: transpose([headerResume, ...resumeRows]), columnWidths: [18, 14, 14, 14, 14, 14, 14, 14] },
        { name: 'Prêt 1', rows: transpose([headerPret, ...pret1Arr]), columnWidths: [18, 14, 14, 14, 14, 14, 14, 14] },
        ...(pret2Arr.length > 0 ? [{ name: 'Prêt 2', rows: transpose([headerPret, ...pret2Arr]), columnWidths: [18, 14, 14, 14, 14, 14, 14, 14] }] : []),
        ...(pret3Arr.length > 0 ? [{ name: 'Prêt 3', rows: transpose([headerPret, ...pret3Arr]), columnWidths: [18, 14, 14, 14, 14, 14, 14, 14] }] : []),
      ];

      const blob = await buildXlsxBlob({ sheets, headerFill: themeColors?.c1, sectionFill: themeColors?.c7 });
      const isValid = await validateXlsxBlob(blob);
      if (!isValid) throw new Error('XLSX invalide (signature PK manquante).');
      downloadXlsx(blob, `SER1_${isAnnual ? 'Annuel' : 'Mensuel'}.xlsx`);
    } catch (e) {
      console.error('Export Excel échoué', e);
      alert('Impossible de générer le fichier Excel.');
    } finally {
      setExportLoading(false);
    }
  }, [state, calc, isAnnual, startYM, themeColors, setExportLoading]);

  // ---- PowerPoint ----
  const exportPowerPoint = useCallback(async () => {
    setExportLoading(true);
    try {
      const [{ buildCreditStudyDeck }, { exportAndDownloadStudyDeck }] = await Promise.all([
        import('../../../pptx/presets/creditDeckBuilder'),
        import('../../../pptx/export/exportStudyDeck'),
      ]);

      const exportLogo = cabinetLogo || undefined;
      const p1 = state.pret1;
      const p1Params = calc.pret1Params;

      // Aggregated years for total
      const aggregatedYears = aggregateToYearsFromRows(calc.agrRows, startYM);
      const amortizationRowsTotal = aggregatedYears.map(row => ({
        periode: row.periode, interet: row.interet, assurance: row.assurance,
        amort: row.amort, annuite: row.mensu, annuiteTotale: row.mensuTotal, crd: row.crd,
      }));

      // Per-loan aggregation
      const pret1Agg = aggregateToYearsFromRows(calc.pret1Rows, startYM);
      const amortizationRowsPret1 = pret1Agg.map(row => ({
        periode: row.periode, interet: row.interet, assurance: row.assurance,
        amort: row.amort, annuite: row.mensu, annuiteTotale: row.mensuTotal, crd: row.crd,
      }));

      const totalCapital = p1Params.capital
        + (state.pret2 ? toNum(state.pret2.capital) : 0)
        + (state.pret3 ? toNum(state.pret3.capital) : 0);

      const maxDureeMois = Math.max(
        p1Params.duree,
        state.pret2 ? toNum(state.pret2.duree) : 0,
        state.pret3 ? toNum(state.pret3.duree) : 0,
      );

      // Build loans array
      const pret1Interets = calc.pret1Rows.reduce((s, l) => s + (l.interet || 0), 0);
      const pret1Assurance = calc.pret1Rows.reduce((s, l) => s + (l.assurance || 0), 0);

      const loans = [{
        index: 1,
        capital: p1Params.capital,
        dureeMois: p1Params.duree,
        tauxNominal: p1.taux,
        tauxAssurance: p1.tauxAssur,
        quotite: p1Params.quotite,
        creditType: p1.type || state.creditType,
        assuranceMode: p1.assurMode || state.assurMode,
        mensualiteHorsAssurance: calc.mensuBasePret1,
        mensualiteTotale: calc.mensuBasePret1 + (calc.pret1Rows[0]?.assurance || 0),
        coutInterets: pret1Interets,
        coutAssurance: pret1Assurance,
        amortizationRows: amortizationRowsPret1,
      }];

      // Pret2 & Pret3
      [{ pret: state.pret2, rows: calc.pret2Rows, idx: 0 }, { pret: state.pret3, rows: calc.pret3Rows, idx: 1 }].forEach(({ pret, rows, idx }) => {
        if (!pret) return;
        const pRows = rows.filter(r => r);
        const pAgg = aggregateToYearsFromRows(pRows, startYM);
        const pInterets = pRows.reduce((s, row) => s + ((row?.interet) || 0), 0);
        const pAssurance = pRows.reduce((s, row) => s + ((row?.assurance) || 0), 0);
        loans.push({
          index: idx + 2,
          capital: toNum(pret.capital),
          dureeMois: toNum(pret.duree),
          tauxNominal: Number(pret.taux) || 0,
          tauxAssurance: Number(pret.tauxAssur) || 0,
          quotite: (pret.quotite ?? 100) / 100,
          creditType: pret.type || state.creditType,
          assuranceMode: pret.assurMode || state.assurMode || 'CRD',
          mensualiteHorsAssurance: rows[0]?.mensu || 0,
          mensualiteTotale: rows[0]?.mensuTotal || 0,
          coutInterets: pInterets,
          coutAssurance: pAssurance,
          amortizationRows: pAgg.map(row => ({
            periode: row.periode, interet: row.interet, assurance: row.assurance,
            amort: row.amort, annuite: row.mensu, annuiteTotale: row.mensuTotal, crd: row.crd,
          })),
        });
      });

      const paymentPeriods = calc.synthesePeriodes.map(p => ({
        label: p.from, mensualitePret1: p.p1, mensualitePret2: p.p2, mensualitePret3: p.p3, total: p.p1 + p.p2 + p.p3,
      }));

      const assuranceDecesByYear = aggregatedYears.map((row) => row?.assuranceDeces ?? 0);

      const creditData = {
        totalCapital,
        maxDureeMois,
        coutTotalInterets: calc.synthese.totalInterets,
        coutTotalAssurance: calc.synthese.totalAssurance,
        coutTotalCredit: calc.synthese.coutTotalCredit,
        assuranceDecesByYear,
        smoothingEnabled: state.lisserPret1 && calc.hasPretsAdditionnels,
        smoothingMode: state.lissageMode,
        loans,
        paymentPeriods,
        amortizationRows: amortizationRowsTotal,
        capitalEmprunte: totalCapital,
        dureeMois: maxDureeMois,
        tauxNominal: p1.taux,
        tauxAssurance: p1.tauxAssur,
        quotite: p1Params.quotite,
        mensualiteHorsAssurance: calc.mensuBasePret1,
        mensualiteTotale: calc.mensuBasePret1 + calc.synthese.primeAssMensuelle,
        creditType: state.creditType,
        assuranceMode: state.assurMode,
        clientName: undefined,
      };

      const deck = buildCreditStudyDeck(creditData, pptxColors, exportLogo, logoPlacement);
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      await exportAndDownloadStudyDeck(deck, pptxColors, `simulation-credit-${dateStr}.pptx`);
    } catch (error) {
      console.error('Export PowerPoint Crédit échoué:', error);
      alert('Erreur lors de la génération du PowerPoint. Veuillez réessayer.');
    } finally {
      setExportLoading(false);
    }
  }, [state, calc, startYM, cabinetLogo, logoPlacement, pptxColors, setExportLoading]);

  return { exportExcel, exportPowerPoint };
}
