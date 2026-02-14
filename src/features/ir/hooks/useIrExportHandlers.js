import { useCallback } from 'react';

export function useIrExportHandlers({
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
}) {
  const cell = (v, style) => ({ v, style });

  const exportExcel = useCallback(async () => {
    setExportLoading(true);
    try {
      if (!result) {
        alert('Les résultats ne sont pas disponibles.');
        setExportLoading(false);
        return;
      }

      const { buildXlsxBlob, downloadXlsx, validateXlsxBlob } = await import('../../../utils/xlsxBuilder');

      const headerParams = [cell('Champ', 'sHeader'), cell('Valeur', 'sHeader')];
      const rowsParams = [];

      rowsParams.push([cell('Paramètres fiscaux', 'sSection'), cell('', 'sSection')]);
      rowsParams.push([cell('Barème', 'sText'), cell(yearLabel, 'sText')]);
      rowsParams.push([cell('Situation familiale', 'sText'), cell(status === 'couple' ? 'Marié / Pacsé' : 'Célibataire / Veuf / Divorcé', 'sText')]);
      rowsParams.push([cell('Parent isolé', 'sText'), cell(isIsolated ? 'Oui' : 'Non', 'sText')]);
      rowsParams.push([cell('Nombre de parts (calculé)', 'sText'), cell(result.partsNb || effectiveParts, 'sCenter')]);
      rowsParams.push([cell('Zone géographique', 'sText'), cell(location === 'metropole' ? 'Métropole' : location === 'gmr' ? 'Guadeloupe / Martinique / Réunion' : 'Guyane / Mayotte', 'sText')]);

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

      const headerDetails = [cell('Poste', 'sHeader'), cell('Base', 'sHeader'), cell('Taux', 'sHeader'), cell('Impôt', 'sHeader')];
      const rowsDetails = [];
      rowsDetails.push([cell('Barème (tranches)', 'sSection'), cell('', 'sSection'), cell('', 'sSection'), cell('', 'sSection')]);
      (result.bracketsDetails || []).forEach((b) => {
        rowsDetails.push([cell(b.label || '', 'sText'), cell(b.base || 0, 'sMoney'), cell((b.rate || 0) / 100, 'sPercent'), cell(b.tax || 0, 'sMoney')]);
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
          { name: 'Paramètres', rows: [headerParams, ...rowsParams], columnWidths: [36, 22] },
          { name: 'Synthèse impôts', rows: [headerSynth, ...rowsSynth], columnWidths: [36, 22] },
          { name: 'Détails calculs', rows: [headerDetails, ...rowsDetails], columnWidths: [36, 18, 14, 18] },
        ],
        headerFill: colors?.c1,
        sectionFill: colors?.c7,
      });

      const isValid = await validateXlsxBlob(blob);
      if (!isValid) {
        throw new Error('XLSX invalide (signature PK manquante).');
      }

      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      downloadXlsx(blob, `simulation-ir-${dateStr}.xlsx`);
    } catch (error) {
      console.error('Export Excel IR échoué:', error);
      alert('Erreur lors de la génération du fichier Excel.');
    } finally {
      setExportLoading(false);
    }
  }, [
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
    setExportLoading,
  ]);

  const exportPowerPoint = useCallback(async () => {
    if (!result) {
      alert('Les résultats ne sont pas disponibles.');
      return;
    }

    setExportLoading(true);
    try {
      const [{ buildIrStudyDeck }, { exportAndDownloadStudyDeck }] = await Promise.all([
        import('../../../pptx/presets/irDeckBuilder'),
        import('../../../pptx/export/exportStudyDeck'),
      ]);

      const exportLogo = cabinetLogo || undefined;

      const irData = {
        taxableIncome: result.taxableIncome || 0,
        partsNb: result.partsNb || effectiveParts,
        tmiRate: result.tmiRate || 0,
        irNet: result.irNet || 0,
        pfuIr: result.pfuIr || 0,
        cehr: result.cehr || 0,
        cdhr: result.cdhr || 0,
        psFoncier: result.psFoncier || 0,
        psDividends: result.psDividends || 0,
        psTotal: result.psTotal || 0,
        totalTax: result.totalTax || 0,
        bracketsDetails: result.bracketsDetails || [],
        yearLabel,
        status,
        location,
      };

      const deck = buildIrStudyDeck(irData, pptxColors, exportLogo, logoPlacement);
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const filename = `simulation-ir-${dateStr}.pptx`;

      await exportAndDownloadStudyDeck(deck, pptxColors, filename);
    } catch (error) {
      console.error('Export PowerPoint IR échoué:', error);
      alert('Erreur lors de la génération du PowerPoint. Veuillez réessayer.');
    } finally {
      setExportLoading(false);
    }
  }, [
    result,
    effectiveParts,
    yearLabel,
    status,
    location,
    pptxColors,
    cabinetLogo,
    logoPlacement,
    setExportLoading,
  ]);

  return { exportExcel, exportPowerPoint };
}
