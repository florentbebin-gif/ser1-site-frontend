/**
 * Succession Excel Export (P1-02)
 *
 * 5 onglets normalises : Inputs / Resultats / Details / Chronologie / Hypotheses
 * Utilise xlsxBuilder pour generer un fichier OOXML natif.
 */

import { buildXlsxBlob, downloadXlsx, validateXlsxBlob } from '@/utils/export/xlsxBuilder';
import type { XlsxSheet, XlsxCell } from '@/utils/export/xlsxBuilder';
import type { SuccessionResult, HeritierResult, LienParente } from '@/engine/succession';
import { buildSuccessionExportActiveHypotheses } from '@/utils/export/successionExportHypotheses';
import {
  buildSuccessionFiscalSnapshot,
  type SuccessionFiscalSnapshot,
} from '../successionFiscalContext';
import { buildPredecesSheet } from './successionChronologieXlsxSheet';
import { formatMoney, h, LIEN_LABELS, money, pct, sec } from './successionXlsxCells';

export interface SuccessionChronologieBeneficiary {
  label: string;
  brut: number;
  droits: number;
  net: number;
  exonerated?: boolean;
}

export interface SuccessionXlsxInput {
  actifNetSuccession: number;
  nbHeritiers: number;
  heritiers: Array<{ lien: LienParente; partSuccession: number }>;
}

export interface SuccessionChronologieXlsxStep {
  actifTransmis: number;
  assuranceVieTransmise?: number;
  perTransmis?: number;
  prevoyanceTransmise?: number;
  masseTotaleTransmise?: number;
  droitsAssuranceVie?: number;
  droitsPer?: number;
  droitsPrevoyance?: number;
  partConjoint: number;
  partEnfants: number;
  droitsEnfants: number;
  beneficiaries?: SuccessionChronologieBeneficiary[];
}

export interface SuccessionChronologieXlsxData {
  applicable: boolean;
  order: 'epoux1' | 'epoux2';
  firstDecedeLabel: string;
  secondDecedeLabel: string;
  step1: SuccessionChronologieXlsxStep | null;
  step2: SuccessionChronologieXlsxStep | null;
  societeAcquets?: {
    configured: boolean;
    totalValue: number;
    firstEstateContribution: number;
    survivorShare: number;
    preciputAmount: number;
    survivorAttributionAmount: number;
    liquidationMode: 'quotes' | 'attribution_survivant';
    deceasedQuotePct: number;
    survivorQuotePct: number;
    attributionIntegrale: boolean;
  } | null;
  participationAcquets?: {
    configured: boolean;
    active: boolean;
    useCurrentAssetsAsFinalPatrimony: boolean;
    patrimoineOriginaireEpoux1: number;
    patrimoineOriginaireEpoux2: number;
    patrimoineFinalEpoux1: number;
    patrimoineFinalEpoux2: number;
    acquetsEpoux1: number;
    acquetsEpoux2: number;
    creditor: 'epoux1' | 'epoux2' | null;
    debtor: 'epoux1' | 'epoux2' | null;
    quoteAppliedPct: number;
    creanceAmount: number;
    firstEstateAdjustment: number;
  } | null;
  interMassClaims?: {
    configured: boolean;
    totalRequestedAmount: number;
    totalAppliedAmount: number;
    claims: Array<{
      id: string;
      kind: 'recompense' | 'creance';
      label?: string;
      fromPocket:
        | 'epoux1'
        | 'epoux2'
        | 'communaute'
        | 'societe_acquets'
        | 'indivision_pacse'
        | 'indivision_concubinage'
        | 'indivision_separatiste';
      toPocket:
        | 'epoux1'
        | 'epoux2'
        | 'communaute'
        | 'societe_acquets'
        | 'indivision_pacse'
        | 'indivision_concubinage'
        | 'indivision_separatiste';
      requestedAmount: number;
      appliedAmount: number;
    }>;
  } | null;
  affectedLiabilities?: {
    totalAmount: number;
    byPocket: Array<{
      pocket:
        | 'epoux1'
        | 'epoux2'
        | 'communaute'
        | 'societe_acquets'
        | 'indivision_pacse'
        | 'indivision_concubinage'
        | 'indivision_separatiste';
      amount: number;
    }>;
  } | null;
  preciput?: {
    mode: 'global' | 'cible' | 'none';
    pocket?:
      | 'epoux1'
      | 'epoux2'
      | 'communaute'
      | 'societe_acquets'
      | 'indivision_pacse'
      | 'indivision_concubinage'
      | 'indivision_separatiste'
      | null;
    requestedAmount: number;
    appliedAmount: number;
    usesGlobalFallback: boolean;
    selections: Array<{
      id: string;
      sourceType?: 'asset' | 'groupement_foncier';
      sourceId?: string;
      label: string;
      pocket?:
        | 'epoux1'
        | 'epoux2'
        | 'communaute'
        | 'societe_acquets'
        | 'indivision_pacse'
        | 'indivision_concubinage'
        | 'indivision_separatiste';
      requestedAmount: number;
      appliedAmount: number;
    }>;
  } | null;
  assuranceVieTotale?: number;
  perTotale?: number;
  prevoyanceTotale?: number;
  totalDroits: number;
  warnings?: string[];
}

function buildInputsSheet(input: SuccessionXlsxInput): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [h('Parametre'), h('Valeur')],
    ['Masse transmise estimee', money(input.actifNetSuccession)],
    ["Nombre d'heritiers", input.nbHeritiers],
    [],
    [sec('Heritiers'), sec('')],
    [h('Lien de parenté'), h('Part succession (EUR)')],
  ];

  for (const heir of input.heritiers) {
    rows.push([LIEN_LABELS[heir.lien] ?? heir.lien, money(heir.partSuccession)]);
  }

  return { name: 'Inputs', rows, columnWidths: [30, 20] };
}

function buildResultsSheet(result: SuccessionResult): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [h('Indicateur'), h('Valeur')],
    ['Masse transmise estimee', money(result.actifNetSuccession)],
    ['Total droits de succession', money(result.totalDroits)],
    ['Taux moyen global', pct(result.tauxMoyenGlobal)],
    ["Nombre d'heritiers", result.detailHeritiers.length],
  ];

  return { name: 'Résultats', rows, columnWidths: [30, 20] };
}

function buildDetailsSheet(heritiers: HeritierResult[]): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [
      h('Heritier'),
      h('Part brute'),
      h('Abattement'),
      h('Base imposable'),
      h('Droits'),
      h('Taux moyen'),
    ],
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

  const totalDroits = heritiers.reduce((sum, heir) => sum + heir.droits, 0);
  const totalParts = heritiers.reduce((sum, heir) => sum + heir.partBrute, 0);
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

function buildHypothesesSheet(fiscalSnapshot?: SuccessionFiscalSnapshot): XlsxSheet {
  const snapshot = fiscalSnapshot ?? buildSuccessionFiscalSnapshot(null);
  const rows: Array<Array<XlsxCell | string>> = [
    [h('Hypothèse'), h('Référence')],
    ['Barème DMTG en vigueur', 'CGI Art. 777'],
    [
      `Abattement ligne directe : ${formatMoney(snapshot.dmtgSettings.ligneDirecte.abattement)}`,
      'CGI Art. 779',
    ],
    ['Exonération totale du conjoint survivant', 'CGI Art. 796-0 bis'],
    ['Hors donations antérieures rapportables', 'Hypothèse simplificatrice'],
    [
      'Assurance-vie et PER assurance intégrés à la masse transmise affichée',
      'Ventilation fiscale simplifiée',
    ],
    ["Montants arrondis à l'euro", 'Convention'],
    [],
    [sec('Avertissement'), sec('')],
    ['Ce document est établi à titre strictement indicatif.', ''],
    ['Il ne constitue pas un conseil juridique ou fiscal.', ''],
  ];

  return { name: 'Hypothèses', rows, columnWidths: [45, 30] };
}

function buildSuccessionHypothesesSheet(
  assumptions: string[] = [],
  chronologie?: SuccessionChronologieXlsxData,
  fiscalSnapshot?: SuccessionFiscalSnapshot,
): XlsxSheet {
  const sheet = buildHypothesesSheet(fiscalSnapshot);
  const activeHypotheses = buildSuccessionExportActiveHypotheses(assumptions, chronologie);
  if (activeHypotheses.length === 0) {
    return sheet;
  }

  return {
    ...sheet,
    rows: [
      ...sheet.rows,
      [],
      [sec('Hypotheses calculees'), sec('')],
      ...activeHypotheses.map(
        (assumption) => [assumption, 'Module succession'] as Array<XlsxCell | string>,
      ),
    ],
  };
}

export async function exportSuccessionXlsx(
  input: SuccessionXlsxInput,
  result?: SuccessionResult | null,
  themeColor?: string,
  _filename = 'Simulation-Succession',
  chronologie?: SuccessionChronologieXlsxData,
  sectionFill?: string,
  assumptions?: string[],
  fiscalSnapshot?: SuccessionFiscalSnapshot,
): Promise<Blob> {
  const sheets: XlsxSheet[] = result
    ? [
        buildInputsSheet(input),
        buildResultsSheet(result),
        buildDetailsSheet(result.detailHeritiers),
        buildPredecesSheet(chronologie),
        buildSuccessionHypothesesSheet(assumptions ?? [], chronologie, fiscalSnapshot),
      ]
    : [
        buildPredecesSheet(chronologie),
        buildSuccessionHypothesesSheet(assumptions ?? [], chronologie, fiscalSnapshot),
      ];

  const blob = await buildXlsxBlob({
    sheets,
    headerFill: themeColor,
    sectionFill,
  });

  const isValid = await validateXlsxBlob(blob);
  if (!isValid) throw new Error('XLSX invalide (signature PK manquante).');
  return blob;
}

export async function exportAndDownloadSuccessionXlsx(
  input: SuccessionXlsxInput,
  result?: SuccessionResult | null,
  themeColor?: string,
  filename = 'Simulation-Succession',
  chronologie?: SuccessionChronologieXlsxData,
  sectionFill?: string,
  assumptions?: string[],
  fiscalSnapshot?: SuccessionFiscalSnapshot,
): Promise<void> {
  const blob = await exportSuccessionXlsx(
    input,
    result,
    themeColor,
    filename,
    chronologie,
    sectionFill,
    assumptions,
    fiscalSnapshot,
  );
  downloadXlsx(blob, filename);
}
