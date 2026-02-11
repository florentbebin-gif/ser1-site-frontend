/**
 * PER Excel Export (P1-03)
 *
 * 4 onglets normalisés : Inputs / Résultats / Détails / Hypothèses
 * Utilise xlsxBuilder pour générer un fichier OOXML natif.
 */

import { buildXlsxBlob, downloadXlsx } from '../../utils/xlsxBuilder';
import type { XlsxSheet, XlsxCell } from '../../utils/xlsxBuilder';
import type { PerResult, PerProjectionRow } from '../../engine/per';

function h(text: string): XlsxCell { return { v: text, style: 'sHeader' }; }
function sec(text: string): XlsxCell { return { v: text, style: 'sSection' }; }
function money(v: number): XlsxCell { return { v, style: 'sMoney' }; }
function pct(v: number): XlsxCell { return { v: v / 100, style: 'sPercent' }; }

export interface PerXlsxInput {
  versementAnnuel: number;
  dureeAnnees: number;
  tmi: number;
  rendementAnnuel: number;
  fraisGestion: number;
}

function buildInputsSheet(input: PerXlsxInput): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [h('Paramètre'), h('Valeur')],
    ['Versement annuel', money(input.versementAnnuel)],
    ['Durée d\'épargne', `${input.dureeAnnees} ans`],
    ['TMI', pct(input.tmi)],
    ['Rendement annuel brut', pct(input.rendementAnnuel)],
    ['Frais de gestion annuels', pct(input.fraisGestion)],
  ];

  return { name: 'Inputs', rows, columnWidths: [30, 20] };
}

function buildResultsSheet(result: PerResult): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [h('Indicateur'), h('Valeur')],
    ['Total versements', money(result.totalVersements)],
    ['Capital à terme', money(result.capitalTerme)],
    ['Plus-values brutes', money(result.gainNet)],
    [],
    [sec('Avantage fiscal'), sec('')],
    ['Économie IR annuelle', money(result.economieImpotAnnuelle)],
    ['Économie IR totale', money(result.economieImpotTotale)],
    ['Ratio économie / versements', pct(result.ratioEconomieVersement)],
    [],
    [sec('Sortie en capital'), sec('')],
    ['Capital brut', money(result.capitalTerme)],
    ['IR estimé sortie capital', money(result.irSortieCapital)],
    ['Capital net après IR', money(result.capitalNetSortie)],
    [],
    [sec('Sortie en rente'), sec('')],
    ['Rente annuelle estimée', money(result.renteAnnuelleEstimee)],
    ['Rente mensuelle estimée', money(result.renteMensuelleEstimee)],
    ['Rente nette après IR', money(result.renteNetteApresIR)],
    [],
    ['TRI (avec avantage fiscal)', pct(result.tauxRendementInterne)],
  ];

  return { name: 'Résultats', rows, columnWidths: [30, 20] };
}

function buildDetailsSheet(projection: PerProjectionRow[]): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [h('Année'), h('Versement cumulé'), h('Capital début'), h('Intérêts'), h('Frais'), h('Capital fin'), h('Éco IR cumulée')],
  ];

  for (const row of projection) {
    rows.push([
      row.annee,
      money(row.versementCumule),
      money(row.capitalDebut),
      money(row.interets),
      money(row.frais),
      money(row.capitalFin),
      money(row.economieImpotCumulee),
    ]);
  }

  return {
    name: 'Détails',
    rows,
    columnWidths: [10, 18, 18, 15, 15, 18, 18],
  };
}

function buildHypothesesSheet(): XlsxSheet {
  const rows: Array<Array<XlsxCell | string>> = [
    [h('Hypothèse'), h('Référence')],
    ['Versements volontaires déductibles', 'CGI Art. 163 quatervicies'],
    ['Plafond déduction : 10% PASS N-1 (35 194 € en 2024)', 'CGI Art. 163 quatervicies'],
    ['Rendement et frais constants sur la durée', 'Hypothèse simplificatrice'],
    ['Taux conversion rente : ~4% à 65 ans', 'Hypothèse simplificatrice'],
    ['Fiscalité sortie capital : IR barème', 'CGI Art. 163 quatervicies'],
    ['Abattement 10% sur rente (RVTG)', 'CGI Art. 158-5'],
    ['Hors prélèvements sociaux (17,2%)', 'Hypothèse simplificatrice'],
    [],
    [sec('Avertissement'), sec('')],
    ['Ce document est établi à titre strictement indicatif.', ''],
    ['Il ne constitue pas un conseil en investissement.', ''],
  ];

  return { name: 'Hypothèses', rows, columnWidths: [45, 30] };
}

export async function exportPerXlsx(
  input: PerXlsxInput,
  result: PerResult,
  themeColor?: string,
  filename = 'Simulation-PER',
): Promise<Blob> {
  const sheets: XlsxSheet[] = [
    buildInputsSheet(input),
    buildResultsSheet(result),
    buildDetailsSheet(result.projectionAnnuelle),
    buildHypothesesSheet(),
  ];

  const blob = await buildXlsxBlob({
    sheets,
    headerFill: themeColor,
    sectionFill: '#F0F0F0',
  });

  return blob;
}

export async function exportAndDownloadPerXlsx(
  input: PerXlsxInput,
  result: PerResult,
  themeColor?: string,
  filename = 'Simulation-PER',
): Promise<void> {
  const blob = await exportPerXlsx(input, result, themeColor, filename);
  downloadXlsx(blob, filename);
}
