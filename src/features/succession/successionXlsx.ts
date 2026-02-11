/**
 * Succession Excel Export (P1-02)
 *
 * 4 onglets normalisés : Inputs / Résultats / Détails / Hypothèses
 * Utilise xlsxBuilder pour générer un fichier OOXML natif.
 */

import { buildXlsxBlob, downloadXlsx } from '../../utils/xlsxBuilder';
import type { XlsxSheet, XlsxCell } from '../../utils/xlsxBuilder';
import type { SuccessionResult, HeritierResult, LienParente } from '../../engine/succession';

const LIEN_LABELS: Record<LienParente, string> = {
  conjoint: 'Conjoint survivant',
  enfant: 'Enfant',
  petit_enfant: 'Petit-enfant',
  frere_soeur: 'Frère / Sœur',
  neveu_niece: 'Neveu / Nièce',
  autre: 'Autre',
};

export interface SuccessionXlsxInput {
  actifNetSuccession: number;
  nbHeritiers: number;
  heritiers: Array<{ lien: LienParente; partSuccession: number }>;
}

function h(text: string): XlsxCell { return { v: text, style: 'sHeader' }; }
function sec(text: string): XlsxCell { return { v: text, style: 'sSection' }; }
function money(v: number): XlsxCell { return { v, style: 'sMoney' }; }
function pct(v: number): XlsxCell { return { v: v / 100, style: 'sPercent' }; }

function buildInputsSheet(input: SuccessionXlsxInput): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [h('Paramètre'), h('Valeur')],
    ['Actif net successoral', money(input.actifNetSuccession)],
    ['Nombre d\'héritiers', input.nbHeritiers],
    [],
    [sec('Héritiers'), sec('')],
    [h('Lien de parenté'), h('Part succession (€)')],
  ];

  for (const heir of input.heritiers) {
    rows.push([LIEN_LABELS[heir.lien] ?? heir.lien, money(heir.partSuccession)]);
  }

  return { name: 'Inputs', rows, columnWidths: [30, 20] };
}

function buildResultsSheet(result: SuccessionResult): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [h('Indicateur'), h('Valeur')],
    ['Actif net successoral', money(result.actifNetSuccession)],
    ['Total droits de succession', money(result.totalDroits)],
    ['Taux moyen global', pct(result.tauxMoyenGlobal)],
    ['Nombre d\'héritiers', result.detailHeritiers.length],
  ];

  return { name: 'Résultats', rows, columnWidths: [30, 20] };
}

function buildDetailsSheet(heritiers: HeritierResult[]): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [h('Héritier'), h('Part brute'), h('Abattement'), h('Base imposable'), h('Droits'), h('Taux moyen')],
  ];

  for (const heir of heritiers) {
    rows.push([
      LIEN_LABELS[heir.lien as LienParente] ?? heir.lien,
      money(heir.partBrute),
      money(heir.abattement),
      money(heir.baseImposable),
      money(heir.droits),
      pct(heir.tauxMoyen),
    ]);
  }

  // Totals
  const totalDroits = heritiers.reduce((s, h) => s + h.droits, 0);
  const totalParts = heritiers.reduce((s, h) => s + h.partBrute, 0);
  rows.push([]);
  rows.push([
    sec('TOTAL'),
    money(totalParts),
    { v: '', style: 'sSection' },
    { v: '', style: 'sSection' },
    money(totalDroits),
    { v: '', style: 'sSection' },
  ]);

  return {
    name: 'Détails',
    rows,
    columnWidths: [20, 18, 18, 18, 18, 15],
  };
}

function buildHypothesesSheet(): XlsxSheet {
  const rows: Array<Array<XlsxCell | string>> = [
    [h('Hypothèse'), h('Référence')],
    ['Barème DMTG en vigueur', 'CGI Art. 777'],
    ['Abattement ligne directe : 100 000 €', 'CGI Art. 779'],
    ['Exonération totale du conjoint survivant', 'CGI Art. 796-0 bis'],
    ['Hors donations antérieures rapportables', 'Hypothèse simplificatrice'],
    ['Hors assurance-vie', 'Hypothèse simplificatrice'],
    ['Montants arrondis à l\'euro', 'Convention'],
    [],
    [sec('Avertissement'), sec('')],
    ['Ce document est établi à titre strictement indicatif.', ''],
    ['Il ne constitue pas un conseil juridique ou fiscal.', ''],
  ];

  return { name: 'Hypothèses', rows, columnWidths: [45, 30] };
}

export async function exportSuccessionXlsx(
  input: SuccessionXlsxInput,
  result: SuccessionResult,
  themeColor?: string,
  filename = 'Simulation-Succession',
): Promise<Blob> {
  const sheets: XlsxSheet[] = [
    buildInputsSheet(input),
    buildResultsSheet(result),
    buildDetailsSheet(result.detailHeritiers),
    buildHypothesesSheet(),
  ];

  const blob = await buildXlsxBlob({
    sheets,
    headerFill: themeColor,
    sectionFill: '#F0F0F0',
  });

  return blob;
}

export async function exportAndDownloadSuccessionXlsx(
  input: SuccessionXlsxInput,
  result: SuccessionResult,
  themeColor?: string,
  filename = 'Simulation-Succession',
): Promise<void> {
  const blob = await exportSuccessionXlsx(input, result, themeColor, filename);
  downloadXlsx(blob, filename);
}
