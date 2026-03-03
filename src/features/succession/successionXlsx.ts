/**
 * Succession Excel Export (P1-02)
 *
 * 4 onglets normalisés : Inputs / Résultats / Détails / Hypothèses
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
  frere_soeur: 'Frère / Sœur',
  neveu_niece: 'Neveu / Nièce',
  autre: 'Autre',
};

export interface SuccessionXlsxInput {
  actifNetSuccession: number;
  nbHeritiers: number;
  heritiers: Array<{ lien: LienParente; partSuccession: number }>;
  context?: SuccessionExportContext;
}

export interface SuccessionExportContext {
  situationFamiliale: string;
  regimeMatrimonial: string | null;
  pacsConvention: string | null;
  nbEnfants: number;
  nbEnfantsNonCommuns: number;
  testamentActif: boolean;
  liquidationRegime: string | null;
  predecesApplicable: boolean;
  predecesDroitsMrDecede: number | null;
  predecesDroitsMmeDecedee: number | null;
  devolutionReserve: string | null;
  devolutionQuotiteDisponible: string | null;
  devolutionLignes: Array<{ heritier: string; droits: string }>;
  masseCivileReference: number;
  quotiteDisponibleMontant: number;
  liberalitesImputeesMontant: number;
  depassementQuotiteMontant: number;
  warnings: string[];
}

function h(text: string): XlsxCell { return { v: text, style: 'sHeader' }; }
function sec(text: string): XlsxCell { return { v: text, style: 'sSection' }; }
function money(v: number): XlsxCell { return { v, style: 'sMoney' }; }
function pct(v: number): XlsxCell { return { v: v / 100, style: 'sPercent' }; }
function yesNo(v: boolean): string { return v ? 'Oui' : 'Non'; }

function dedupeWarnings(warnings: string[]): string[] {
  const seen = new Set<string>();
  return warnings.filter((warning) => {
    const key = warning.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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

  if (input.context) {
    const ctx = input.context;
    rows.push([]);
    rows.push([sec('Contexte civil simplifie'), sec('')]);
    rows.push(['Situation familiale', ctx.situationFamiliale]);
    if (ctx.regimeMatrimonial) rows.push(['Regime matrimonial', ctx.regimeMatrimonial]);
    if (ctx.pacsConvention) rows.push(['Convention PACS', ctx.pacsConvention]);
    rows.push(['Nombre d\'enfants (scenarios civils)', ctx.nbEnfants]);
    rows.push(['Nombre d\'enfants non communs', ctx.nbEnfantsNonCommuns]);
    rows.push(['Testament actif', yesNo(ctx.testamentActif)]);
    if (ctx.liquidationRegime) rows.push(['Regime de liquidation retenu', ctx.liquidationRegime]);
    if (ctx.devolutionReserve && ctx.devolutionQuotiteDisponible) {
      rows.push([
        'Reserve / quotite disponible',
        `${ctx.devolutionReserve} / ${ctx.devolutionQuotiteDisponible}`,
      ]);
    }

    rows.push([]);
    rows.push([sec('Liberalites et avantages (indicatif)'), sec('')]);
    rows.push(['Masse civile de reference', money(ctx.masseCivileReference)]);
    rows.push(['Quotite disponible estimee', money(ctx.quotiteDisponibleMontant)]);
    rows.push(['Liberalites a controler', money(ctx.liberalitesImputeesMontant)]);
    if (ctx.depassementQuotiteMontant > 0) {
      rows.push(['Depassement estime de quotite', money(ctx.depassementQuotiteMontant)]);
    }
  }

  return { name: 'Inputs', rows, columnWidths: [40, 26] };
}

function buildResultsSheet(result: SuccessionResult, context?: SuccessionExportContext): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [h('Indicateur'), h('Valeur')],
    ['Actif net successoral', money(result.actifNetSuccession)],
    ['Total droits de succession', money(result.totalDroits)],
    ['Taux moyen global', pct(result.tauxMoyenGlobal)],
    ['Nombre d\'héritiers', result.detailHeritiers.length],
  ];

  if (context?.predecesApplicable) {
    if (context.predecesDroitsMrDecede !== null) {
      rows.push(['Scenario predeces M. decede', money(context.predecesDroitsMrDecede)]);
    }
    if (context.predecesDroitsMmeDecedee !== null) {
      rows.push(['Scenario predeces Mme decedee', money(context.predecesDroitsMmeDecedee)]);
    }
  }

  if (context && context.depassementQuotiteMontant > 0) {
    rows.push(['Depassement estime de quotite disponible', money(context.depassementQuotiteMontant)]);
  }

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

function buildHypothesesSheet(context?: SuccessionExportContext): XlsxSheet {
  const moduleWarnings = dedupeWarnings(context?.warnings ?? []).slice(0, 8);
  const rows: Array<Array<XlsxCell | string>> = [
    [h('Hypothèse'), h('Référence')],
    ['Barème DMTG en vigueur', 'CGI Art. 777'],
    ['Abattement ligne directe : 100 000 €', 'CGI Art. 779'],
    ['Exonération totale du conjoint survivant', 'CGI Art. 796-0 bis'],
    ['Lecture civile (liquidation, devolution, liberalites) simplifiee', 'Hypothese de module'],
    ['Assurance-vie deces et mecanismes civils complexes hors moteur detaille', 'Perimetre'],
    ['Montants arrondis à l\'euro', 'Convention'],
    [],
    [sec('Avertissement'), sec('')],
    ['Ce document est établi à titre strictement indicatif.', ''],
    ['Il ne constitue pas un conseil juridique ou fiscal.', ''],
  ];

  if (moduleWarnings.length > 0) {
    rows.push([]);
    rows.push([sec('Points de vigilance du module'), sec('')]);
    for (const warning of moduleWarnings) {
      rows.push([`- ${warning}`, '']);
    }
  }

  return { name: 'Hypothèses', rows, columnWidths: [45, 30] };
}

export async function exportSuccessionXlsx(
  input: SuccessionXlsxInput,
  result: SuccessionResult,
  themeColor?: string,
  _filename = 'Simulation-Succession',
): Promise<Blob> {
  const sheets: XlsxSheet[] = [
    buildInputsSheet(input),
    buildResultsSheet(result, input.context),
    buildDetailsSheet(result.detailHeritiers),
    buildHypothesesSheet(input.context),
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
  result: SuccessionResult,
  themeColor?: string,
  filename = 'Simulation-Succession',
): Promise<void> {
  const blob = await exportSuccessionXlsx(input, result, themeColor, filename);
  downloadXlsx(blob, filename);
}
