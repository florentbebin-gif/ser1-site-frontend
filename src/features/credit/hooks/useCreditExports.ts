/**
 * useCreditExports.ts - Hook d'export Excel & PPTX pour CreditV2
 *
 * Adapte depuis l'ancienne implementation monolithique du simulateur Credit.
 * Reçoit le state centralisé + les calculs du hook useCreditCalculations.
 */

import { useCallback } from 'react';
import { labelMonthFR, addMonths } from '../utils/creditFormatters';
import type {
  CreditExportHookParams,
  CreditPptxData,
  CreditScheduleRow,
  CreditShiftedScheduleRow,
} from '../types';

interface ExportDisplayRow {
  periode: string;
  interet: number;
  assurance: number;
  amort: number;
  mensu: number;
  mensuTotal: number;
  crd: number;
  assuranceDeces: number;
}

function isDefinedRow(row: CreditShiftedScheduleRow): row is CreditScheduleRow {
  return row !== null;
}

// ============================================================================
// HELPERS herites de l'ancienne implementation du simulateur Credit
// ============================================================================

function aggregateToYearsFromRows(
  rows: Array<CreditScheduleRow | null>,
  startYMBase: string,
): ExportDisplayRow[] {
  const map = new Map<string, ExportDisplayRow>();
  rows.forEach((row, idx) => {
    if (!row) return;
    const ym = addMonths(startYMBase, idx);
    const year = ym.split('-')[0];
    const current = map.get(year) || {
      periode: year,
      interet: 0,
      assurance: 0,
      amort: 0,
      mensu: 0,
      mensuTotal: 0,
      crd: 0,
      assuranceDeces: 0,
    };
    current.interet += row.interet || 0;
    current.assurance += row.assurance || 0;
    current.amort += row.amort || 0;
    current.mensu += row.mensu || 0;
    current.mensuTotal += row.mensuTotal || 0;
    current.crd = row.crd || current.crd || 0;
    current.assuranceDeces = Math.max(current.assuranceDeces ?? 0, row.assuranceDeces ?? 0);
    map.set(year, current);
  });
  return Array.from(map.values());
}

function attachMonthLabels(rows: CreditScheduleRow[], startYM: string): ExportDisplayRow[] {
  return rows.map((row, idx) => ({
    periode: labelMonthFR(addMonths(startYM, idx)),
    interet: row.interet,
    assurance: row.assurance,
    amort: row.amort,
    mensu: row.mensu,
    mensuTotal: row.mensuTotal,
    crd: row.crd,
    assuranceDeces: row.assuranceDeces,
  }));
}

function transpose<T>(aoa: T[][]): T[][] {
  if (!aoa.length) return aoa;
  const rows = aoa.length;
  const cols = Math.max(...aoa.map((row) => row.length));
  const out = Array.from({ length: cols }, () => Array(rows).fill('' as unknown as T));
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      out[col][row] = aoa[row][col] ?? ('' as unknown as T);
    }
  }
  return out;
}

const toNum = (value: string | number | null | undefined): number => {
  const num = parseFloat(String(value ?? ''));
  return Number.isNaN(num) ? 0 : num;
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
}: CreditExportHookParams) {
  const { startYM } = state;
  const isAnnual = state.viewMode === 'annuel';

  const exportExcel = useCallback(async () => {
    setExportLoading(true);
    try {
      const { buildXlsxBlob, downloadXlsx, validateXlsxBlob } = await import('../../../utils/export/xlsxBuilder');

      const cell = (value: string | number, style: string) => ({ v: value, style });

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

      const headerParams = [cell('Champ', 'sHeader'), cell('Valeur', 'sHeader')];
      const rowsParams = [];
      const p1 = state.pret1;

      rowsParams.push([cell('Prêt 1', 'sSection'), cell('', 'sSection')]);
      rowsParams.push([cell('Type de crédit (Prêt 1)', 'sText'), cell(p1.type === 'amortissable' ? 'Amortissable' : 'In fine', 'sText')]);
      rowsParams.push([cell('Date de souscription (Prêt 1)', 'sText'), cell(startYM ? labelMonthFR(startYM) : '', 'sText')]);
      rowsParams.push([cell('Durée (mois) - Prêt 1', 'sText'), cell(p1.duree, 'sCenter')]);
      rowsParams.push([cell('Montant emprunté (Prêt 1)', 'sText'), cell(toNum(p1.capital), 'sMoney')]);
      rowsParams.push([cell('Taux annuel (crédit) - Prêt 1', 'sText'), cell((Number(p1.taux) || 0) / 100, 'sPercent')]);
      rowsParams.push([cell('Mensualité (hors assurance) - Prêt 1', 'sText'), cell(toNum(calc.mensuBasePret1), 'sMoney')]);
      rowsParams.push([cell('Mensualité totale estimée', 'sText'), cell(Math.round(calc.synthese.mensualiteTotaleM1 + calc.synthese.primeAssMensuelle), 'sMoney')]);
      rowsParams.push([cell("Mode de l'assurance (Prêt 1)", 'sText'), cell((p1.assurMode || state.assurMode) === 'CI' ? 'Capital initial' : 'Capital restant dû', 'sText')]);
      rowsParams.push([cell('Taux annuel (assurance) - Prêt 1', 'sText'), cell((Number(p1.tauxAssur) || 0) / 100, 'sPercent')]);
      rowsParams.push([cell('Quotité assurée - Prêt 1', 'sText'), cell(p1.quotite / 100, 'sPercent')]);
      rowsParams.push([cell('Vue', 'sText'), cell(isAnnual ? 'Vue annuelle' : 'Vue mensuelle', 'sText')]);
      rowsParams.push([cell('Lissage prêt 1', 'sText'), cell(state.lisserPret1 ? (state.lissageMode === 'mensu' ? 'Mensualité constante' : 'Durée constante') : 'Aucun', 'sText')]);

      [state.pret2, state.pret3].forEach((loan, idx) => {
        if (!loan) return;
        const loanIndex = idx + 2;
        const loanAssurMode = loan.assurMode || state.assurMode || 'CRD';
        rowsParams.push([cell(`Prêt ${loanIndex}`, 'sSection'), cell('', 'sSection')]);
        rowsParams.push([cell(`Prêt ${loanIndex} - Type de crédit`, 'sText'), cell((loan.type || state.creditType) === 'amortissable' ? 'Amortissable' : 'In fine', 'sText')]);
        rowsParams.push([cell(`Prêt ${loanIndex} - Montant emprunté`, 'sText'), cell(toNum(loan.capital), 'sMoney')]);
        rowsParams.push([cell(`Prêt ${loanIndex} - Durée (mois)`, 'sText'), cell(toNum(loan.duree), 'sCenter')]);
        rowsParams.push([cell(`Prêt ${loanIndex} - Taux annuel (crédit)`, 'sText'), cell((Number(loan.taux || 0) || 0) / 100, 'sPercent')]);
        rowsParams.push([cell(`Prêt ${loanIndex} - Taux annuel (assurance)`, 'sText'), cell((Number(loan.tauxAssur || 0) || 0) / 100, 'sPercent')]);
        rowsParams.push([cell(`Prêt ${loanIndex} - Mode assurance`, 'sText'), cell(loanAssurMode === 'CI' ? 'Capital initial' : 'Capital restant dû', 'sText')]);
        rowsParams.push([cell(`Prêt ${loanIndex} - Quotité assurée`, 'sText'), cell((loan.quotite ?? 100) / 100, 'sPercent')]);
        rowsParams.push([cell(`Prêt ${loanIndex} - Date de souscription`, 'sText'), cell(loan.startYM ? labelMonthFR(loan.startYM) : '', 'sText')]);
      });

      const tableDisplay = isAnnual
        ? aggregateToYearsFromRows(calc.agrRows, startYM)
        : attachMonthLabels(calc.agrRows, startYM);

      const resumeRows = tableDisplay.map((line) => [
        cell(line.periode, 'sCenter'),
        cell(Math.round(line.interet), 'sMoney'),
        cell(Math.round(line.assurance), 'sMoney'),
        cell(Math.round(line.amort), 'sMoney'),
        cell(Math.round(line.mensu), 'sMoney'),
        cell(Math.round(line.mensuTotal), 'sMoney'),
        cell(Math.round(line.crd), 'sMoney'),
        cell(Math.round(line.assuranceDeces ?? 0), 'sMoney'),
      ]);

      const mapRows = (rows: CreditScheduleRow[]) => (isAnnual
        ? aggregateToYearsFromRows(rows, startYM)
        : attachMonthLabels(rows, startYM)
      ).map((line) => [
        cell(line.periode, 'sCenter'),
        cell(Math.round(line.interet ?? 0), 'sMoney'),
        cell(Math.round(line.assurance ?? 0), 'sMoney'),
        cell(Math.round(line.amort ?? 0), 'sMoney'),
        cell(Math.round(line.mensu ?? 0), 'sMoney'),
        cell(Math.round(line.mensuTotal ?? 0), 'sMoney'),
        cell(Math.round(line.crd ?? 0), 'sMoney'),
        cell(Math.round(line.assuranceDeces ?? 0), 'sMoney'),
      ]);

      const pret1Arr = mapRows(calc.pret1Rows);
      const pret2Arr = calc.pret2Rows.length > 0 ? mapRows(calc.pret2Rows.filter(isDefinedRow)) : [];
      const pret3Arr = calc.pret3Rows.length > 0 ? mapRows(calc.pret3Rows.filter(isDefinedRow)) : [];

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
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      downloadXlsx(blob, `simulation-credit-${dateStr}.xlsx`);
    } catch (error) {
      console.error('Export Excel échoué', error);
      alert('Impossible de générer le fichier Excel.');
    } finally {
      setExportLoading(false);
    }
  }, [state, calc, isAnnual, startYM, themeColors, setExportLoading]);

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

      const aggregatedYears = aggregateToYearsFromRows(calc.agrRows, startYM);
      const amortizationRowsTotal = aggregatedYears.map((row) => ({
        periode: row.periode,
        interet: row.interet,
        assurance: row.assurance,
        amort: row.amort,
        annuite: row.mensu,
        annuiteTotale: row.mensuTotal,
        crd: row.crd,
      }));

      const pret1Agg = aggregateToYearsFromRows(calc.pret1Rows, startYM);
      const amortizationRowsPret1 = pret1Agg.map((row) => ({
        periode: row.periode,
        interet: row.interet,
        assurance: row.assurance,
        amort: row.amort,
        annuite: row.mensu,
        annuiteTotale: row.mensuTotal,
        crd: row.crd,
      }));

      const totalCapital = p1Params.capital
        + (state.pret2 ? toNum(state.pret2.capital) : 0)
        + (state.pret3 ? toNum(state.pret3.capital) : 0);

      const maxDureeMois = Math.max(
        p1Params.duree,
        state.pret2 ? toNum(state.pret2.duree) : 0,
        state.pret3 ? toNum(state.pret3.duree) : 0,
      );

      const pret1Interets = calc.pret1Rows.reduce((sum, row) => sum + (row.interet || 0), 0);
      const pret1Assurance = calc.pret1Rows.reduce((sum, row) => sum + (row.assurance || 0), 0);

      const loans: NonNullable<CreditPptxData['loans']> = [{
        index: 1,
        capital: p1Params.capital,
        dureeMois: p1Params.duree,
        tauxNominal: p1.taux,
        tauxAssurance: p1.tauxAssur,
        quotite: p1Params.quotite,
        creditType: p1.type || state.creditType,
        assuranceMode: p1.assurMode || state.assurMode,
        mensualiteHorsAssurance: (state.lisserPret1 && calc.hasPretsAdditionnels)
          ? (calc.pret1Rows[0]?.mensu ?? calc.mensuBasePret1)
          : calc.mensuBasePret1,
        mensualiteTotale: (state.lisserPret1 && calc.hasPretsAdditionnels)
          ? (calc.pret1Rows[0]?.mensuTotal ?? (calc.mensuBasePret1 + (calc.pret1Rows[0]?.assurance || 0)))
          : calc.mensuBasePret1 + (calc.pret1Rows[0]?.assurance || 0),
        coutInterets: pret1Interets,
        coutAssurance: pret1Assurance,
        amortizationRows: amortizationRowsPret1,
        startYM,
        dateEffet: startYM ? labelMonthFR(startYM) : undefined,
      }];

      [
        { pret: state.pret2, rows: calc.pret2Rows, idx: 0 },
        { pret: state.pret3, rows: calc.pret3Rows, idx: 1 },
      ].forEach(({ pret, rows, idx }) => {
        if (!pret) return;
        const validRows = rows.filter(isDefinedRow);
        const aggregated = aggregateToYearsFromRows(validRows, startYM);
        const pretInterets = validRows.reduce((sum, row) => sum + (row.interet || 0), 0);
        const pretAssurance = validRows.reduce((sum, row) => sum + (row.assurance || 0), 0);
        const pretStartYM = pret.startYM || startYM;
        loans.push({
          index: idx + 2,
          capital: toNum(pret.capital),
          dureeMois: toNum(pret.duree),
          tauxNominal: Number(pret.taux) || 0,
          tauxAssurance: Number(pret.tauxAssur) || 0,
          quotite: (pret.quotite ?? 100) / 100,
          creditType: pret.type || state.creditType,
          assuranceMode: pret.assurMode || state.assurMode || 'CRD',
          mensualiteHorsAssurance: rows.find(isDefinedRow)?.mensu || 0,
          mensualiteTotale: rows.find(isDefinedRow)?.mensuTotal || 0,
          coutInterets: pretInterets,
          coutAssurance: pretAssurance,
          amortizationRows: aggregated.map((row) => ({
            periode: row.periode,
            interet: row.interet,
            assurance: row.assurance,
            amort: row.amort,
            annuite: row.mensu,
            annuiteTotale: row.mensuTotal,
            crd: row.crd,
          })),
          startYM: pretStartYM,
          dateEffet: pretStartYM ? labelMonthFR(pretStartYM) : undefined,
        });
      });

      const paymentPeriods: NonNullable<CreditPptxData['paymentPeriods']> = calc.synthesePeriodes.map((period) => ({
        label: period.from,
        mensualitePret1: period.p1,
        mensualitePret2: period.p2,
        mensualitePret3: period.p3,
        total: period.p1 + period.p2 + period.p3,
        monthIndex: period.monthIndex ?? 0,
      }));

      const assuranceDecesByYear = aggregatedYears.map((row) => row.assuranceDeces ?? 0);

      const creditData: CreditPptxData = {
        totalCapital,
        maxDureeMois,
        startYM,
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
