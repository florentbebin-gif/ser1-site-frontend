/**
 * Placement Excel Export — Construction des feuilles Excel pour le simulateur
 *
 * Fonctions pures qui transforment state + results en XML Excel.
 */

import { ENVELOPE_LABELS } from '@/engine/placementEngine.js';
import { buildWorksheetXmlVertical, downloadExcel } from '@/utils/exportExcel.js';
import {
  formatPsApplicability, formatPsNote,
  getPsAssietteNumeric, getPsTauxNumeric, getPsMontantNumeric,
} from './formatters.js';

// ─── Sheet builders ──────────────────────────────────────────────────

function buildEpargneSheet(produit, suffix = '') {
  if (!produit?.epargne?.rows?.length) return null;

  const header = ['Indicateur'];
  produit.epargne.rows.forEach((row, idx) => {
    header.push(`Année ${idx}`);
  });

  const series = [
    { key: 'capitalDebut', label: 'Capital début' },
    { key: 'versements', label: 'Versements' },
    { key: 'capitalCapi', label: 'Capital (capi)' },
    { key: 'capitalDistrib', label: 'Capital (distrib)' },
    { key: 'compteEspece', label: 'Compte espèces' },
    { key: 'gainsAnnee', label: 'Gains annuels' },
    { key: 'revenusNetAnnee', label: 'Revenus nets' },
    { key: 'capitalFin', label: 'Capital fin' },
    { key: 'capitalDecesTheorique', label: 'Capital décès théorique' },
  ];

  const rows = series.map(({ key, label }) => {
    const row = [label];
    produit.epargne.rows.forEach((r) => {
      row.push(r[key] ?? 0);
    });
    return row;
  });

  return { header, rows, name: `Épargne ${suffix}`.trim() };
}

function buildLiquidationSheet(produit, suffix = '') {
  if (!produit?.liquidation?.rows?.length) return null;

  const header = ['Indicateur'];
  produit.liquidation.rows.forEach((row, idx) => {
    header.push(`Âge ${row.age ?? idx}`);
  });

  const series = [
    { key: 'capitalDebut', label: 'Capital début' },
    { key: 'retraitBrut', label: 'Retrait brut' },
    { key: 'fiscalite', label: 'Fiscalité' },
    { key: 'retraitNet', label: 'Retrait net' },
    { key: 'capitalFin', label: 'Capital fin' },
    { key: 'pvLatenteDebut', label: 'PV latente début' },
    { key: 'pvLatenteFin', label: 'PV latente fin' },
  ];

  const rows = series.map(({ key, label }) => {
    const row = [label];
    produit.liquidation.rows.forEach((r) => {
      row.push(r[key] ?? 0);
    });
    return row;
  });

  return { header, rows, name: `Liquidation ${suffix}`.trim() };
}

// ─── Build params rows ───────────────────────────────────────────────

function buildParamsRows(state) {
  const rowsParams = [];

  // Client
  rowsParams.push(['Âge actuel', `${state.client.ageActuel} ans`]);
  rowsParams.push(['TMI épargne', `${(state.client.tmiEpargne * 100).toFixed(1).replace('.', ',')} %`]);
  rowsParams.push(['TMI retraite', `${(state.client.tmiRetraite * 100).toFixed(1).replace('.', ',')} %`]);
  rowsParams.push(['Situation', state.client.situation === 'single' ? 'Célibataire' : 'Couple']);

  // Transmission
  rowsParams.push(['Âge au décès', `${state.transmission.ageAuDeces} ans`]);
  rowsParams.push(['Nombre de bénéficiaires', state.transmission.nbBeneficiaires]);
  rowsParams.push(['Taux DMTG', `${(state.transmission.dmtgTaux * 100).toFixed(1).replace('.', ',')} %`]);

  // Produits
  state.products.forEach((product, idx) => {
    const prefix = `Produit ${idx + 1}`;
    rowsParams.push([`${prefix} - Enveloppe`, ENVELOPE_LABELS[product.envelope] || product.envelope]);
    rowsParams.push([`${prefix} - Durée épargne`, `${product.dureeEpargne} ans`]);
    rowsParams.push([`${prefix} - Frais de gestion`, `${(product.fraisGestion * 100).toFixed(2).replace('.', ',')} %`]);
    rowsParams.push([`${prefix} - Option barème IR`, product.optionBaremeIR ? 'Oui' : 'Non']);
    rowsParams.push([`${prefix} - PER bancaire`, product.perBancaire ? 'Oui' : 'Non']);
    
    const versementConfig = product.versementConfig;
    if (versementConfig) {
      rowsParams.push([`${prefix} - Versement initial`, `${versementConfig.initial?.montant || 0} €`]);
      rowsParams.push([`${prefix} - Versements annuels`, `${versementConfig.annuel?.montant || 0} €`]);
      rowsParams.push([`${prefix} - Allocation capitalisation`, `${versementConfig.initial?.pctCapitalisation || 0} %`]);
      rowsParams.push([`${prefix} - Allocation distribution`, `${versementConfig.initial?.pctDistribution || 0} %`]);
    }
  });

  return rowsParams;
}

// ─── Build full XML ──────────────────────────────────────────────────

/**
 * Construit le XML Excel complet à partir du state et des résultats.
 * Fonction pure — pas de side effects.
 */
export function buildPlacementExcelXml(state, results) {
  const { produit1, produit2 } = results;

  const headerParams = ['Champ', 'Valeur'];
  const rowsParams = buildParamsRows(state);

  const sheetEpargneProduit1 = buildEpargneSheet(produit1, 'Produit 1');
  const sheetEpargneProduit2 = buildEpargneSheet(produit2, 'Produit 2');
  const sheetLiquidationProduit1 = buildLiquidationSheet(produit1, 'Produit 1');
  const sheetLiquidationProduit2 = buildLiquidationSheet(produit2, 'Produit 2');

  // 3) Transmission
  const headerTransmission = ['Indicateur', 'Produit 1', 'Produit 2'];
  const psRowApplic = [
    'PS décès - applicables ?',
    formatPsApplicability(produit1?.transmission?.psDeces),
    formatPsApplicability(produit2?.transmission?.psDeces),
  ];
  const psRowAssiette = [
    'PS décès - assiette',
    getPsAssietteNumeric(produit1?.transmission?.psDeces),
    getPsAssietteNumeric(produit2?.transmission?.psDeces),
  ];
  const psRowTaux = [
    'PS décès - taux',
    getPsTauxNumeric(produit1?.transmission?.psDeces),
    getPsTauxNumeric(produit2?.transmission?.psDeces),
  ];
  const psRowMontant = [
    'PS décès - montant',
    getPsMontantNumeric(produit1?.transmission?.psDeces),
    getPsMontantNumeric(produit2?.transmission?.psDeces),
  ];
  const psRowNote = [
    'PS décès - commentaire',
    formatPsNote(produit1?.transmission?.psDeces),
    formatPsNote(produit2?.transmission?.psDeces),
  ];

  const rowsTransmission = [
    ['Capital transmis', produit1?.transmission?.capitalTransmis || 0, produit2?.transmission?.capitalTransmis || 0],
    ['Abattement', produit1?.transmission?.abattement || 0, produit2?.transmission?.abattement || 0],
    ['Assiette fiscale', produit1?.transmission?.assiette || 0, produit2?.transmission?.assiette || 0],
    psRowApplic,
    psRowAssiette,
    psRowTaux,
    psRowMontant,
    psRowNote,
    ['Fiscalité forfaitaire (990 I / 757 B)', produit1?.transmission?.taxeForfaitaire || 0, produit2?.transmission?.taxeForfaitaire || 0],
    ['Fiscalité DMTG', produit1?.transmission?.taxeDmtg || 0, produit2?.transmission?.taxeDmtg || 0],
    ['Fiscalité totale', produit1?.transmission?.taxe || 0, produit2?.transmission?.taxe || 0],
    ['Net transmis', produit1?.transmission?.capitalTransmisNet || 0, produit2?.transmission?.capitalTransmisNet || 0],
  ];

  // 4) Synthèse comparative
  const headerSynthese = ['Indicateur', 'Produit 1', 'Produit 2'];
  const rowsSynthese = [
    ['Enveloppe', ENVELOPE_LABELS[produit1?.envelope] || '', ENVELOPE_LABELS[produit2?.envelope] || ''],
    ['Capital acquis épargne', produit1?.epargne?.capitalFin || 0, produit2?.epargne?.capitalFin || 0],
    ['Total retraits liquidation', produit1?.liquidation?.totalRetraits || 0, produit2?.liquidation?.totalRetraits || 0],
    ['Fiscalité totale', (produit1?.liquidation?.totalFiscalite || 0) + (produit1?.transmission?.taxe || 0), (produit2?.liquidation?.totalFiscalite || 0) + (produit2?.transmission?.taxe || 0)],
    ['Net global', (produit1?.liquidation?.totalRetraits || 0) + (produit1?.transmission?.capitalTransmisNet || 0), (produit2?.liquidation?.totalRetraits || 0) + (produit2?.transmission?.capitalTransmisNet || 0)],
  ];

  return `<?xml version="1.0"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
      ${buildWorksheetXmlVertical('Paramètres', headerParams, rowsParams)}
      ${sheetEpargneProduit1 ? buildWorksheetXmlVertical(sheetEpargneProduit1.name, sheetEpargneProduit1.header, sheetEpargneProduit1.rows) : ''}
      ${sheetEpargneProduit2 ? buildWorksheetXmlVertical(sheetEpargneProduit2.name, sheetEpargneProduit2.header, sheetEpargneProduit2.rows) : ''}
      ${sheetLiquidationProduit1 ? buildWorksheetXmlVertical(sheetLiquidationProduit1.name, sheetLiquidationProduit1.header, sheetLiquidationProduit1.rows) : ''}
      ${sheetLiquidationProduit2 ? buildWorksheetXmlVertical(sheetLiquidationProduit2.name, sheetLiquidationProduit2.header, sheetLiquidationProduit2.rows) : ''}
      ${buildWorksheetXmlVertical('Transmission', headerTransmission, rowsTransmission)}
      ${buildWorksheetXmlVertical('Synthèse', headerSynthese, rowsSynthese)}
    </Workbook>`;
}

// ─── Export action ───────────────────────────────────────────────────

/**
 * Exporte la simulation en fichier Excel.
 * Gère le download et les erreurs.
 */
export async function exportPlacementExcel(state, results) {
  if (!results || !results.produit1) {
    alert('Veuillez lancer une simulation avant d\'exporter.');
    return;
  }

  const xml = buildPlacementExcelXml(state, results);
  await downloadExcel(xml, `SER1_Placement_${new Date().toISOString().slice(0, 10)}.xls`);
}
