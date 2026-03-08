/**
 * Succession Excel Export (P1-02)
 *
 * 5 onglets normalisés : Inputs / Résultats / Détails / Chronologie / Hypothèses
 * Utilise xlsxBuilder pour générer un fichier OOXML natif.
 */

import { buildXlsxBlob, downloadXlsx } from '../../utils/xlsxBuilder';
import type { XlsxSheet, XlsxCell } from '../../utils/xlsxBuilder';
import type { SuccessionResult, HeritierResult, LienParente } from '../../engine/succession';
import { DEFAULT_COLORS } from '../../settings/theme';

const LIEN_LABELS: Record<LienParente, string> = {
  conjoint: 'Conjoint survivant',
  enfant: 'Enfant',
  petit_enfant: 'Petit-enfant',
  parent: 'Parent',
  frere_soeur: 'Frère / Sœur',
  neveu_niece: 'Neveu / Nièce',
  autre: 'Autre',
};

export interface SuccessionXlsxInput {
  actifNetSuccession: number;
  nbHeritiers: number;
  heritiers: Array<{ lien: LienParente; partSuccession: number }>;
}

export interface SuccessionChronologieXlsxStep {
  actifTransmis: number;
  assuranceVieTransmise?: number;
  masseTotaleTransmise?: number;
  droitsAssuranceVie?: number;
  partConjoint: number;
  partEnfants: number;
  droitsEnfants: number;
}

export interface SuccessionChronologieXlsxData {
  applicable: boolean;
  order: 'epoux1' | 'epoux2';
  firstDecedeLabel: string;
  secondDecedeLabel: string;
  step1: SuccessionChronologieXlsxStep | null;
  step2: SuccessionChronologieXlsxStep | null;
  assuranceVieTotale?: number;
  totalDroits: number;
  warnings?: string[];
}

function h(text: string): XlsxCell { return { v: text, style: 'sHeader' }; }
function sec(text: string): XlsxCell { return { v: text, style: 'sSection' }; }
function money(v: number): XlsxCell { return { v, style: 'sMoney' }; }
function pct(v: number): XlsxCell { return { v: v / 100, style: 'sPercent' }; }

function buildInputsSheet(input: SuccessionXlsxInput): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [h('Paramètre'), h('Valeur')],
    ['Masse transmise estimée', money(input.actifNetSuccession)],
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
    ['Masse transmise estimée', money(result.actifNetSuccession)],
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
    ['Assurance-vie intégrée à la masse transmise affichée', 'Sans ventilation fiscale détaillée'],
    ['Montants arrondis à l\'euro', 'Convention'],
    [],
    [sec('Avertissement'), sec('')],
    ['Ce document est établi à titre strictement indicatif.', ''],
    ['Il ne constitue pas un conseil juridique ou fiscal.', ''],
  ];

  return { name: 'Hypothèses', rows, columnWidths: [45, 30] };
}

function orderLabel(order: 'epoux1' | 'epoux2'): string {
  return order === 'epoux1'
    ? 'Époux 1 décède en premier'
    : 'Époux 2 décède en premier';
}

function buildPredecesSheet(
  chronologie?: SuccessionChronologieXlsxData,
  sheetName = 'Chronologie',
): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [h('Indicateur'), h('Valeur')],
  ];

  if (!chronologie) {
    rows.push(['Module de chronologie', 'Donnée non transmise à l’export']);
    return { name: sheetName, rows, columnWidths: [42, 35] };
  }

  rows.push(['Ordre simulé', orderLabel(chronologie.order)]);
  rows.push(['Chronologie retenue comme source principale', chronologie.applicable ? 'Oui' : 'Non']);
  rows.push([]);

  if (chronologie.applicable && chronologie.step1 && chronologie.step2) {
    rows.push([sec(`Étape 1 - décès ${chronologie.firstDecedeLabel}`), sec('')]);
    rows.push(['Masse transmise totale', money(chronologie.step1.masseTotaleTransmise ?? chronologie.step1.actifTransmis)]);
    if ((chronologie.step1.assuranceVieTransmise ?? 0) > 0) {
      rows.push(['Dont assurance-vie', money(chronologie.step1.assuranceVieTransmise ?? 0)]);
    }
    if ((chronologie.step1.droitsAssuranceVie ?? 0) > 0) {
      rows.push(['Droits assurance-vie', money(chronologie.step1.droitsAssuranceVie ?? 0)]);
    }
    rows.push(['Masse successorale civile', money(chronologie.step1.actifTransmis)]);
    rows.push(['Part conjoint survivant', money(chronologie.step1.partConjoint)]);
    rows.push(['Part descendants', money(chronologie.step1.partEnfants)]);
    rows.push(['Droits descendants', money(chronologie.step1.droitsEnfants)]);
    rows.push([]);

    rows.push([sec(`Étape 2 - décès ${chronologie.secondDecedeLabel}`), sec('')]);
    rows.push(['Masse transmise totale', money(chronologie.step2.masseTotaleTransmise ?? chronologie.step2.actifTransmis)]);
    if ((chronologie.step2.assuranceVieTransmise ?? 0) > 0) {
      rows.push(['Dont assurance-vie', money(chronologie.step2.assuranceVieTransmise ?? 0)]);
    }
    if ((chronologie.step2.droitsAssuranceVie ?? 0) > 0) {
      rows.push(['Droits assurance-vie', money(chronologie.step2.droitsAssuranceVie ?? 0)]);
    }
    rows.push(['Masse successorale civile', money(chronologie.step2.actifTransmis)]);
    rows.push(['Part descendants', money(chronologie.step2.partEnfants)]);
    rows.push(['Droits descendants', money(chronologie.step2.droitsEnfants)]);
    rows.push([]);

    rows.push(['Total cumulé des droits (2 décès)', money(chronologie.totalDroits)]);
    if (typeof chronologie.assuranceVieTotale === 'number' && chronologie.assuranceVieTotale > 0) {
      rows.push(['Capitaux assurance-vie saisis', money(chronologie.assuranceVieTotale)]);
    }
  } else {
    rows.push(['Statut', 'Chronologie 2 décès non retenue comme source principale pour la situation saisie']);
  }

  if (chronologie.warnings && chronologie.warnings.length > 0) {
    rows.push([]);
    rows.push([sec('Avertissements'), sec('')]);
    chronologie.warnings.forEach((warning) => {
      rows.push([warning, '']);
    });
  }

  return { name: sheetName, rows, columnWidths: [42, 35] };
}

export async function exportSuccessionXlsx(
  input: SuccessionXlsxInput,
  result?: SuccessionResult | null,
  themeColor?: string,
  _filename = 'Simulation-Succession',
  chronologie?: SuccessionChronologieXlsxData,
): Promise<Blob> {
  const sheets: XlsxSheet[] = result
    ? [
      buildInputsSheet(input),
      buildResultsSheet(result),
      buildDetailsSheet(result.detailHeritiers),
      buildPredecesSheet(chronologie),
      buildHypothesesSheet(),
    ]
    : [
      buildPredecesSheet(chronologie),
      buildHypothesesSheet(),
    ];

  const blob = await buildXlsxBlob({
    sheets,
    headerFill: themeColor,
    sectionFill: DEFAULT_COLORS.c8,
  });

  return blob;
}

export async function exportAndDownloadSuccessionXlsx(
  input: SuccessionXlsxInput,
  result?: SuccessionResult | null,
  themeColor?: string,
  filename = 'Simulation-Succession',
  chronologie?: SuccessionChronologieXlsxData,
): Promise<void> {
  const blob = await exportSuccessionXlsx(input, result, themeColor, filename, chronologie);
  downloadXlsx(blob, filename);
}
