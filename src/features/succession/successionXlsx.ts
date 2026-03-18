/**
 * Succession Excel Export (P1-02)
 *
 * 5 onglets normalises : Inputs / Resultats / Details / Chronologie / Hypotheses
 * Utilise xlsxBuilder pour generer un fichier OOXML natif.
 */

import { buildXlsxBlob, downloadXlsx, validateXlsxBlob } from '../../utils/export/xlsxBuilder';
import type { XlsxSheet, XlsxCell } from '../../utils/export/xlsxBuilder';
import type { SuccessionResult, HeritierResult, LienParente } from '../../engine/succession';

const LIEN_LABELS: Record<LienParente, string> = {
  conjoint: 'Conjoint survivant',
  enfant: 'Enfant',
  petit_enfant: 'Petit-enfant',
  parent: 'Parent',
  frere_soeur: 'Frere / Soeur',
  neveu_niece: 'Neveu / Niece',
  autre: 'Autre',
};

interface SuccessionChronologieBeneficiary {
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
  assuranceVieTotale?: number;
  perTotale?: number;
  prevoyanceTotale?: number;
  totalDroits: number;
  warnings?: string[];
}

function h(text: string): XlsxCell { return { v: text, style: 'sHeader' }; }
function sec(text: string): XlsxCell { return { v: text, style: 'sSection' }; }
function money(v: number): XlsxCell { return { v, style: 'sMoney' }; }
function pct(v: number): XlsxCell { return { v: v / 100, style: 'sPercent' }; }

const formatMoney = (value: number): string =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

function buildInputsSheet(input: SuccessionXlsxInput): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [h('Parametre'), h('Valeur')],
    ['Masse transmise estimee', money(input.actifNetSuccession)],
    ['Nombre d\'heritiers', input.nbHeritiers],
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
    ['Nombre d\'heritiers', result.detailHeritiers.length],
  ];

  return { name: 'Résultats', rows, columnWidths: [30, 20] };
}

function buildDetailsSheet(heritiers: HeritierResult[]): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [h('Heritier'), h('Part brute'), h('Abattement'), h('Base imposable'), h('Droits'), h('Taux moyen')],
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

function buildHypothesesSheet(): XlsxSheet {
  const rows: Array<Array<XlsxCell | string>> = [
    [h('Hypothèse'), h('Référence')],
    ['Barème DMTG en vigueur', 'CGI Art. 777'],
    ['Abattement ligne directe : 100 000 EUR', 'CGI Art. 779'],
    ['Exonération totale du conjoint survivant', 'CGI Art. 796-0 bis'],
    ['Hors donations antérieures rapportables', 'Hypothèse simplificatrice'],
    ['Assurance-vie et PER assurance intégrés à la masse transmise affichée', 'Ventilation fiscale simplifiée'],
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

function appendBeneficiaryRows(
  rows: Array<Array<XlsxCell | string | number>>,
  beneficiaries?: SuccessionChronologieBeneficiary[],
): void {
  if (!beneficiaries || beneficiaries.length === 0) return;

  rows.push([h('Bénéficiaire réel'), h('Part brute')]);
  beneficiaries.forEach((beneficiary) => {
    rows.push([
      beneficiary.exonerated
        ? `${beneficiary.label} (exonéré)`
        : `${beneficiary.label} - droits ${formatMoney(beneficiary.droits)}`,
      money(beneficiary.brut),
    ]);
  });
}

function buildPredecesSheet(
  chronologie?: SuccessionChronologieXlsxData,
  sheetName = 'Chronologie',
): XlsxSheet {
  const rows: Array<Array<XlsxCell | string | number>> = [
    [h('Indicateur'), h('Valeur')],
  ];

  if (!chronologie) {
    rows.push(['Module de chronologie', 'Donnee non transmise a l\'export']);
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
    if ((chronologie.step1.perTransmis ?? 0) > 0) {
      rows.push(['Dont PER assurance', money(chronologie.step1.perTransmis ?? 0)]);
    }
    if ((chronologie.step1.prevoyanceTransmise ?? 0) > 0) {
      rows.push(['Dont prévoyance décès', money(chronologie.step1.prevoyanceTransmise ?? 0)]);
    }
    if ((chronologie.step1.droitsAssuranceVie ?? 0) > 0) {
      rows.push(['Droits assurance-vie', money(chronologie.step1.droitsAssuranceVie ?? 0)]);
    }
    if ((chronologie.step1.droitsPer ?? 0) > 0) {
      rows.push(['Droits PER', money(chronologie.step1.droitsPer ?? 0)]);
    }
    if ((chronologie.step1.droitsPrevoyance ?? 0) > 0) {
      rows.push(['Droits prévoyance', money(chronologie.step1.droitsPrevoyance ?? 0)]);
    }
    rows.push(['Masse successorale civile', money(chronologie.step1.actifTransmis)]);
    rows.push(['Part conjoint / partenaire', money(chronologie.step1.partConjoint)]);
    rows.push(['Part autres bénéficiaires', money(chronologie.step1.partEnfants)]);
    rows.push(['Droits succession', money(chronologie.step1.droitsEnfants)]);
    appendBeneficiaryRows(rows, chronologie.step1.beneficiaries);
    rows.push([]);

    rows.push([sec(`Étape 2 - décès ${chronologie.secondDecedeLabel}`), sec('')]);
    rows.push(['Masse transmise totale', money(chronologie.step2.masseTotaleTransmise ?? chronologie.step2.actifTransmis)]);
    if ((chronologie.step2.assuranceVieTransmise ?? 0) > 0) {
      rows.push(['Dont assurance-vie', money(chronologie.step2.assuranceVieTransmise ?? 0)]);
    }
    if ((chronologie.step2.perTransmis ?? 0) > 0) {
      rows.push(['Dont PER assurance', money(chronologie.step2.perTransmis ?? 0)]);
    }
    if ((chronologie.step2.prevoyanceTransmise ?? 0) > 0) {
      rows.push(['Dont prévoyance décès', money(chronologie.step2.prevoyanceTransmise ?? 0)]);
    }
    if ((chronologie.step2.droitsAssuranceVie ?? 0) > 0) {
      rows.push(['Droits assurance-vie', money(chronologie.step2.droitsAssuranceVie ?? 0)]);
    }
    if ((chronologie.step2.droitsPer ?? 0) > 0) {
      rows.push(['Droits PER', money(chronologie.step2.droitsPer ?? 0)]);
    }
    if ((chronologie.step2.droitsPrevoyance ?? 0) > 0) {
      rows.push(['Droits prévoyance', money(chronologie.step2.droitsPrevoyance ?? 0)]);
    }
    rows.push(['Masse successorale civile', money(chronologie.step2.actifTransmis)]);
    rows.push(['Part conjoint / partenaire', money(chronologie.step2.partConjoint)]);
    rows.push(['Part autres bénéficiaires', money(chronologie.step2.partEnfants)]);
    rows.push(['Droits succession', money(chronologie.step2.droitsEnfants)]);
    appendBeneficiaryRows(rows, chronologie.step2.beneficiaries);
    rows.push([]);

    rows.push(['Total cumulé des droits (2 décès)', money(chronologie.totalDroits)]);
    if (typeof chronologie.assuranceVieTotale === 'number' && chronologie.assuranceVieTotale > 0) {
      rows.push(['Capitaux assurance-vie saisis', money(chronologie.assuranceVieTotale)]);
    }
    if (typeof chronologie.perTotale === 'number' && chronologie.perTotale > 0) {
      rows.push(['Capitaux PER assurance saisis', money(chronologie.perTotale)]);
    }
    if (typeof chronologie.prevoyanceTotale === 'number' && chronologie.prevoyanceTotale > 0) {
      rows.push(['Capitaux prévoyance décès saisis', money(chronologie.prevoyanceTotale)]);
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
  sectionFill?: string,
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
): Promise<void> {
  const blob = await exportSuccessionXlsx(input, result, themeColor, filename, chronologie, sectionFill);
  downloadXlsx(blob, filename);
}
