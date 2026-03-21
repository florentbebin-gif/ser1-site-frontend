/**
 * Placement Excel Export — xlsxBuilder (OOXML natif)
 *
 * 8 onglets normalisés : Paramètres / Épargne P1 / Épargne P2 /
 * Liquidation P1 / Liquidation P2 / Transmission / Synthèse / Hypothèses
 *
 * Conforme à la gouvernance Excel (docs/GOUVERNANCE.md § Gouvernance Excel) :
 * - headerFill = c1, sectionFill = c7 (couleurs du thème courant)
 * - sMoney pour les montants, sPercent pour les taux
 * - validateXlsxBlob() obligatoire
 */

import { ENVELOPE_LABELS } from '@/engine/placement';
import type { CompareResult, EpargneRow, LiquidationRow } from '@/engine/placement/types';
import { buildXlsxBlob, downloadXlsx, validateXlsxBlob } from '@/utils/export/xlsxBuilder';
import type { XlsxCell, XlsxSheet } from '@/utils/export/xlsxBuilder';
import {
  formatPsApplicability,
  formatPsNote,
  getPsAssietteNumeric,
  getPsMontantNumeric,
  getPsTauxNumeric,
} from '../utils/formatters';
import type { PlacementSimulatorState } from '../utils/normalizers';

// ---------------------------------------------------------------------------
// Helpers de style (même convention que IR / Succession)
// ---------------------------------------------------------------------------

const h   = (t: string): XlsxCell => ({ v: t, style: 'sHeader' });
const sec = (t: string): XlsxCell => ({ v: t, style: 'sSection' });
const txt = (t: string): XlsxCell => ({ v: t, style: 'sText' });
const ctr = (t: string | number): XlsxCell => ({ v: t, style: 'sCenter' });
const money = (v: number): XlsxCell => ({ v: Math.round(v), style: 'sMoney' });
// pct : v doit être en décimal [0–1]. Ex : 0.30 → "30,00%"
const pct = (v: number): XlsxCell => ({ v, style: 'sPercent' });

function getEnvelopeLabel(envelope: string): string {
  return ENVELOPE_LABELS[envelope as keyof typeof ENVELOPE_LABELS] || envelope;
}

function getNumericCell<T extends object>(row: T, key: string): number {
  const value = (row as Record<string, unknown>)[key];
  return typeof value === 'number' ? value : 0;
}

// ---------------------------------------------------------------------------
// Types internes
// ---------------------------------------------------------------------------

type PlacementCompareProduct = CompareResult['produit1'] & {
  epargne: CompareResult['produit1']['epargne'] & { capitalFin?: number };
  liquidation: CompareResult['produit1']['liquidation'] & {
    totalRetraits?: number;
    totalFiscalite?: number;
  };
};

// ---------------------------------------------------------------------------
// Onglet Paramètres
// ---------------------------------------------------------------------------

function buildParamsSheet(state: PlacementSimulatorState): XlsxSheet {
  const rows: Array<XlsxCell[]> = [
    [h('Champ'), h('Valeur')],
    [sec('Client'), sec('')],
    [txt('Âge actuel'), ctr(state.client.ageActuel ?? '')],
    [txt('TMI épargne'), pct(state.client.tmiEpargne)],
    [txt('TMI retraite'), pct(state.client.tmiRetraite)],
    [txt('Situation'), txt(state.client.situation === 'single' ? 'Célibataire' : 'Couple')],
    [sec('Transmission'), sec('')],
    [txt('Âge au décès'), ctr(state.transmission.ageAuDeces)],
    [txt('Nombre de bénéficiaires'), ctr(state.transmission.nbBeneficiaires)],
    [txt('Taux DMTG'), pct(state.transmission.dmtgTaux ?? 0)],
  ];

  state.products.forEach((product, idx) => {
    const prefix = `Produit ${idx + 1}`;
    const versementConfig = product.versementConfig;
    rows.push([sec(prefix), sec('')]);
    rows.push([txt(`${prefix} - Enveloppe`), txt(getEnvelopeLabel(product.envelope))]);
    rows.push([txt(`${prefix} - Durée épargne`), ctr(`${product.dureeEpargne} ans`)]);
    rows.push([txt(`${prefix} - Frais de gestion`), pct(product.fraisGestion)]);
    rows.push([txt(`${prefix} - Option barème IR`), txt(product.optionBaremeIR ? 'Oui' : 'Non')]);
    rows.push([txt(`${prefix} - PER bancaire`), txt(product.perBancaire ? 'Oui' : 'Non')]);
    rows.push([txt(`${prefix} - Versement initial`), money(versementConfig.initial?.montant || 0)]);
    rows.push([txt(`${prefix} - Versements annuels`), money(versementConfig.annuel?.montant || 0)]);
    rows.push([txt(`${prefix} - Allocation capitalisation`), pct((versementConfig.initial?.pctCapitalisation || 0) / 100)]);
    rows.push([txt(`${prefix} - Allocation distribution`), pct((versementConfig.initial?.pctDistribution || 0) / 100)]);
  });

  return { name: 'Paramètres', rows, columnWidths: [36, 22] };
}

// ---------------------------------------------------------------------------
// Onglets Épargne (séries en lignes, années en colonnes)
// ---------------------------------------------------------------------------

const EPARGNE_SERIES = [
  { key: 'capitalDebut', label: 'Capital début' },
  { key: 'versements', label: 'Versements' },
  { key: 'capitalCapi', label: 'Capital (capi)' },
  { key: 'capitalDistrib', label: 'Capital (distrib)' },
  { key: 'compteEspece', label: 'Compte espèces' },
  { key: 'gainsAnnee', label: 'Gains annuels' },
  { key: 'revenusNetAnnee', label: 'Revenus nets' },
  { key: 'capitalFin', label: 'Capital fin' },
  { key: 'capitalDecesTheorique', label: 'Capital décès théorique' },
] as const;

function buildEpargneSheet(
  produit: PlacementCompareProduct | null | undefined,
  suffix = '',
): XlsxSheet | null {
  if (!produit?.epargne?.rows?.length) return null;

  const epargneRows = produit.epargne.rows as EpargneRow[];
  const nbPeriods = epargneRows.length;

  const headerRow: XlsxCell[] = [
    h('Indicateur'),
    ...epargneRows.map((_row, idx) => h(`Année ${idx}`)),
  ];

  const dataRows: XlsxCell[][] = EPARGNE_SERIES.map(({ key, label }) => [
    txt(label),
    ...epargneRows.map((epargneRow) => money(getNumericCell(epargneRow, key))),
  ]);

  return {
    name: `Épargne ${suffix}`.trim(),
    rows: [headerRow, ...dataRows],
    columnWidths: [20, ...Array(nbPeriods).fill(14)],
  };
}

// ---------------------------------------------------------------------------
// Onglets Liquidation (séries en lignes, âges en colonnes)
// ---------------------------------------------------------------------------

const LIQUIDATION_SERIES = [
  { key: 'capitalDebut', label: 'Capital début' },
  { key: 'retraitBrut', label: 'Retrait brut' },
  { key: 'fiscalite', label: 'Fiscalité' },
  { key: 'retraitNet', label: 'Retrait net' },
  { key: 'capitalFin', label: 'Capital fin' },
  { key: 'pvLatenteDebut', label: 'PV latente début' },
  { key: 'pvLatenteFin', label: 'PV latente fin' },
] as const;

function buildLiquidationSheet(
  produit: PlacementCompareProduct | null | undefined,
  suffix = '',
): XlsxSheet | null {
  if (!produit?.liquidation?.rows?.length) return null;

  const liquidationRows = produit.liquidation.rows as LiquidationRow[];
  const nbPeriods = liquidationRows.length;

  const headerRow: XlsxCell[] = [
    h('Indicateur'),
    ...liquidationRows.map((row, idx) => h(`Âge ${(row as { age?: number }).age ?? idx}`)),
  ];

  const dataRows: XlsxCell[][] = LIQUIDATION_SERIES.map(({ key, label }) => [
    txt(label),
    ...liquidationRows.map((liqRow) => money(getNumericCell(liqRow, key))),
  ]);

  return {
    name: `Liquidation ${suffix}`.trim(),
    rows: [headerRow, ...dataRows],
    columnWidths: [20, ...Array(nbPeriods).fill(14)],
  };
}

// ---------------------------------------------------------------------------
// Onglet Transmission (3 colonnes : Indicateur | Produit 1 | Produit 2)
// ---------------------------------------------------------------------------

function buildTransmissionSheet(
  produit1: PlacementCompareProduct | null | undefined,
  produit2: PlacementCompareProduct | null | undefined,
): XlsxSheet {
  const ps1 = produit1?.transmission?.psDeces;
  const ps2 = produit2?.transmission?.psDeces;

  const rows: XlsxCell[][] = [
    [h('Indicateur'), h('Produit 1'), h('Produit 2')],
    [txt('Capital transmis'), money(produit1?.transmission?.capitalTransmis || 0), money(produit2?.transmission?.capitalTransmis || 0)],
    [txt('Abattement'), money(produit1?.transmission?.abattement || 0), money(produit2?.transmission?.abattement || 0)],
    [txt('Assiette fiscale'), money(produit1?.transmission?.assiette || 0), money(produit2?.transmission?.assiette || 0)],
    [sec('Prélèvements sociaux au décès'), sec(''), sec('')],
    [txt('PS décès — applicables ?'), txt(formatPsApplicability(ps1)), txt(formatPsApplicability(ps2))],
    [txt('PS décès — assiette'), money(getPsAssietteNumeric(ps1)), money(getPsAssietteNumeric(ps2))],
    [txt('PS décès — taux'), pct(getPsTauxNumeric(ps1)), pct(getPsTauxNumeric(ps2))],
    [txt('PS décès — montant'), money(getPsMontantNumeric(ps1)), money(getPsMontantNumeric(ps2))],
    [txt('PS décès — commentaire'), txt(formatPsNote(ps1)), txt(formatPsNote(ps2))],
    [sec('Fiscalité'), sec(''), sec('')],
    [txt('Fiscalité forfaitaire (990 I / 757 B)'), money(produit1?.transmission?.taxeForfaitaire || 0), money(produit2?.transmission?.taxeForfaitaire || 0)],
    [txt('Fiscalité DMTG'), money(produit1?.transmission?.taxeDmtg || 0), money(produit2?.transmission?.taxeDmtg || 0)],
    [txt('Fiscalité totale'), money(produit1?.transmission?.taxe || 0), money(produit2?.transmission?.taxe || 0)],
    [txt('Net transmis'), money(produit1?.transmission?.capitalTransmisNet || 0), money(produit2?.transmission?.capitalTransmisNet || 0)],
  ];

  return { name: 'Transmission', rows, columnWidths: [30, 18, 18] };
}

// ---------------------------------------------------------------------------
// Onglet Synthèse (3 colonnes)
// ---------------------------------------------------------------------------

function buildSyntheseSheet(
  produit1: PlacementCompareProduct | null | undefined,
  produit2: PlacementCompareProduct | null | undefined,
): XlsxSheet {
  const rows: XlsxCell[][] = [
    [h('Indicateur'), h('Produit 1'), h('Produit 2')],
    [txt('Enveloppe'), txt(getEnvelopeLabel(produit1?.envelope || '')), txt(getEnvelopeLabel(produit2?.envelope || ''))],
    [txt('Capital acquis épargne'), money(produit1?.epargne?.capitalFin || 0), money(produit2?.epargne?.capitalFin || 0)],
    [txt('Total retraits liquidation'), money(produit1?.liquidation?.totalRetraits || 0), money(produit2?.liquidation?.totalRetraits || 0)],
    [txt('Fiscalité totale'), money((produit1?.liquidation?.totalFiscalite || 0) + (produit1?.transmission?.taxe || 0)), money((produit2?.liquidation?.totalFiscalite || 0) + (produit2?.transmission?.taxe || 0))],
    [txt('Net global'), money((produit1?.liquidation?.totalRetraits || 0) + (produit1?.transmission?.capitalTransmisNet || 0)), money((produit2?.liquidation?.totalRetraits || 0) + (produit2?.transmission?.capitalTransmisNet || 0))],
  ];

  return { name: 'Synthèse', rows, columnWidths: [30, 18, 18] };
}

// ---------------------------------------------------------------------------
// Onglet Hypothèses (obligatoire — dernier onglet)
// ---------------------------------------------------------------------------

function buildHypothesesSheet(): XlsxSheet {
  const rows: XlsxCell[][] = [
    [h('Hypothèse'), h('Référence')],
    [txt('Versements supposés constants sur la durée d\'épargne'), txt('Hypothèse simplificatrice')],
    [txt('Rendement et frais constants sur la durée'), txt('Hypothèse simplificatrice')],
    [txt('PER : déduction des versements selon plafond PASS'), txt('CGI Art. 163 quatervicies')],
    [txt('Assurance-vie : abattement 990 I ou 757 B selon souscription'), txt('CGI Art. 990 I et 757 B')],
    [txt('PFU (flat tax) : IR 12,8% + PS 17,2%'), txt('CGI Art. 200 A')],
    [txt('Prélèvements sociaux patrimoine : 17,2%'), txt('CGI Art. L136-7 CSS')],
    [txt('Fiscalité de transmission : barème DMTG ou forfait selon enveloppe'), txt('CGI Art. 777 et suivants')],
    [txt('Montants arrondis à l\'euro le plus proche'), txt('Convention')],
    [sec('Avertissement'), sec('')],
    [txt('Ce document est établi à titre strictement indicatif.'), txt('')],
    [txt('Il ne constitue pas un conseil en investissement ou fiscal.'), txt('')],
  ];

  return { name: 'Hypothèses', rows, columnWidths: [45, 30] };
}

// ---------------------------------------------------------------------------
// Fonctions publiques
// ---------------------------------------------------------------------------

/**
 * Construit le blob XLSX Placement (sans déclencher de téléchargement).
 * Exporté pour les tests smoke.
 */
export async function buildPlacementXlsxBlob(
  state: PlacementSimulatorState,
  results: CompareResult,
  headerFill?: string,
  sectionFill?: string,
): Promise<Blob> {
  const { produit1, produit2 } = results as {
    produit1: PlacementCompareProduct;
    produit2: PlacementCompareProduct;
  };

  const sheets: XlsxSheet[] = [
    buildParamsSheet(state),
  ];

  const ep1 = buildEpargneSheet(produit1, 'Produit 1');
  if (ep1) sheets.push(ep1);

  const ep2 = buildEpargneSheet(produit2, 'Produit 2');
  if (ep2) sheets.push(ep2);

  const liq1 = buildLiquidationSheet(produit1, 'Produit 1');
  if (liq1) sheets.push(liq1);

  const liq2 = buildLiquidationSheet(produit2, 'Produit 2');
  if (liq2) sheets.push(liq2);

  sheets.push(buildTransmissionSheet(produit1, produit2));
  sheets.push(buildSyntheseSheet(produit1, produit2));
  sheets.push(buildHypothesesSheet());

  const blob = await buildXlsxBlob({ sheets, headerFill, sectionFill });
  const isValid = await validateXlsxBlob(blob);
  if (!isValid) throw new Error('XLSX invalide (signature PK manquante).');
  return blob;
}

/**
 * Génère et télécharge le fichier Excel Placement.
 */
export async function exportPlacementExcel(
  state: PlacementSimulatorState,
  results: CompareResult | null | undefined,
  headerFill?: string,
  sectionFill?: string,
): Promise<void> {
  if (!results?.produit1) {
    alert("Veuillez lancer une simulation avant d'exporter.");
    return;
  }

  const blob = await buildPlacementXlsxBlob(state, results, headerFill, sectionFill);
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  downloadXlsx(blob, `simulation-placement-${dateStr}.xlsx`);
}
