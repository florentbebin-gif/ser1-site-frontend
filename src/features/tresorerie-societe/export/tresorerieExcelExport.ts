/**
 * tresorerieExcelExport.ts — Export Excel Trésorerie Société IS
 *
 * 2 onglets :
 * - Projection : indicateurs en lignes, années en colonnes (40 max)
 * - Hypothèses : sources réglementaires + avertissement
 *
 * Conforme à la gouvernance Excel (docs/GOUVERNANCE_EXPORTS.md) :
 * - headerFill = c1, sectionFill = c7
 * - sMoney pour les montants, sPercent pour les taux
 * - validateXlsxBlob() obligatoire
 *
 * Règle GOUVERNANCE_EXPORTS.md:62 : aucun recalcul métier ici.
 * On consomme TresoProjectionRow[] tel quel.
 */

import { buildXlsxBlob, downloadXlsx, validateXlsxBlob } from '@/utils/export/xlsxBuilder';
import type { XlsxCell, XlsxSheet } from '@/utils/export/xlsxBuilder';
import type { TresoInputs, TresoProjectionRow } from '@/engine/tresorerie/types';
import type { TresoKPIs } from '../hooks/useTresorerieCalculations';

// ─── Helpers de style ─────────────────────────────────────────────────────────

const h = (t: string): XlsxCell => ({ v: t, style: 'sHeader' });
const sec = (t: string): XlsxCell => ({ v: t, style: 'sSection' });
const txt = (t: string): XlsxCell => ({ v: t, style: 'sText' });
const ctr = (t: string | number): XlsxCell => ({ v: t, style: 'sCenter' });
const money = (v: number): XlsxCell => ({ v: Math.round(v), style: 'sMoney' });

// ─── Libellés UI premium (jamais les labels Excel bruts) ─────────────────────

interface ProjectionSerie {
  key: keyof TresoProjectionRow;
  label: string;
  format: 'money' | 'bool';
}

const RESUME_SERIES: ProjectionSerie[] = [
  { key: 'apportCCA', label: "Apports en compte courant d'associé", format: 'money' },
  { key: 'ccaCumule', label: 'CCA total constitué', format: 'money' },
  { key: 'retraitsCCA', label: 'Remboursements CCA (sans PFU)', format: 'money' },
  { key: 'ccaRestant', label: 'CCA net restant dû', format: 'money' },
  { key: 'revenuDistrib', label: 'Revenus — poche de distribution', format: 'money' },
  { key: 'dividendesFiliales', label: 'Dividendes filiales reçus (régime mère-fille)', format: 'money' },
  { key: 'gainCapiN', label: 'Gain de capitalisation (sortie)', format: 'money' },
  { key: 'valeurCapi', label: 'Valeur poche de capitalisation', format: 'money' },
  { key: 'isLatentCapi', label: 'IS latent capitalisation (non décaissé)', format: 'money' },
  { key: 'chargesStructure', label: 'Charges de structure', format: 'money' },
  { key: 'interetsCreditIS', label: 'Intérêts crédit IS (déductibles)', format: 'money' },
  { key: 'resultatFiscalAvantIS', label: 'Résultat fiscal avant IS', format: 'money' },
  { key: 'is', label: 'Impôt sur les sociétés', format: 'money' },
  { key: 'resultatNetComptable', label: 'Résultat net comptable', format: 'money' },
  { key: 'reservesDebut', label: "Réserves en début d'exercice", format: 'money' },
  { key: 'dividendesAssociesBruts', label: 'Dividendes versés aux associés (bruts)', format: 'money' },
  { key: 'reservesFin', label: "Réserves en fin d'exercice", format: 'money' },
  { key: 'capaciteDistribuable', label: 'Capacité distribuable', format: 'money' },
  { key: 'pfu', label: 'Fiscalité dividendes (PFU)', format: 'money' },
  { key: 'revenusNets', label: 'Total revenus nets annuels', format: 'money' },
  { key: 'deltaBesoin', label: 'Écart annuel avec le besoin de revenus', format: 'money' },
  { key: 'tresorerieFin', label: "Trésorerie fin d'année", format: 'money' },
];

// ─── Onglet Projection ────────────────────────────────────────────────────────

function buildProjectionSheet(
  rows: TresoProjectionRow[],
  kpis: TresoKPIs,
  inputs: TresoInputs,
): XlsxSheet {
  if (rows.length === 0) {
    return {
      name: 'Projection',
      rows: [[h('Indicateur')], [txt('Aucune donnée — paramètres à renseigner.')]],
      columnWidths: [40],
    };
  }

  const anneeCivile = inputs.anneeCivileDebut ?? new Date().getFullYear();

  // En-tête avec paramètres
  const paramRows: XlsxCell[][] = [
    [h('Paramètre'), h('Valeur')],
    [txt('Type de société'), txt(inputs.typeCreation === 'existante' ? 'Société existante' : 'Société à créer (NEWCO)')],
    [txt('Âge actuel'), ctr(inputs.ageActuel)],
    [txt('Âge de retraite'), ctr(inputs.ageRetraite)],
    [txt('Besoin annuel net à la retraite'), money(inputs.besoinsRetraiteAnnuels)],
    [txt('Frais annuels de structure'), money(inputs.fraisStructureAnnuels)],
    [txt('CCA initial'), money(inputs.ccaInitial)],
    [txt('Apport annuel CCA'), money(inputs.apportAnnuelCCA)],
    [txt('Durée phase active'), ctr(`${inputs.dureeActiveAns} ans`)],
    [sec(''), sec('')],
    [h('KPI'), h('Valeur')],
    [txt('CCA total constitué'), money(kpis.ccaTotalConstitue)],
    [txt('IS total décaissé'), money(kpis.isTotalDecaisse)],
    [txt('IS latent capitalisation (non décaissé)'), money(kpis.isLatentCapi)],
    [txt('Revenus nets à la retraite'), money(kpis.revenusNetsRetraite)],
    [txt('Valeur nette société à la retraite'), money(kpis.valeurNetteSocieteRetraite)],
    [txt('Réserves à la retraite'), money(kpis.reservesRetraite)],
    [txt('Capacité distribuable (an 1)'), money(kpis.capaciteDistribuableAn1)],
    [txt('Alerte dividendes > capacité (an 1)'), txt(kpis.alerteDividendesAn1 ? 'Oui — à contrôler' : 'Non')],
    [sec(''), sec('')],
  ];

  // Tableau de projection : séries en lignes, années en colonnes
  const nbAns = rows.length;
  const headerYear: XlsxCell[] = [
    h('Indicateur'),
    ...rows.map(r => h(`${anneeCivile + r.year - 1} — An ${r.year}`)),
  ];

  const dataRows: XlsxCell[][] = RESUME_SERIES.map(({ key, label }) => [
    txt(label),
    ...rows.map(r => {
      const val = r[key];
      if (typeof val === 'boolean') return txt(val ? 'Oui' : 'Non');
      return money(typeof val === 'number' ? val : 0);
    }),
  ]);

  return {
    name: 'Projection',
    rows: [...paramRows, headerYear, ...dataRows],
    columnWidths: [40, ...Array(nbAns).fill(14)],
  };
}

// ─── Onglet Hypothèses ────────────────────────────────────────────────────────

function buildHypothesesSheet(): XlsxSheet {
  const rows: XlsxCell[][] = [
    [h('Hypothèse / Source'), h('Référence')],
    [sec('Impôt sur les sociétés'), sec('')],
    [txt('IS calculé sur la base fiscale (résultat avant IS clampé à 0)'), txt('CGI Art. 219')],
    [txt('Taux réduit IS sur les PME selon seuil paramétrable'), txt('CGI Art. 219 I-b')],
    [txt('Pas de report de pertes en V1'), txt('Hypothèse simplificatrice')],
    [sec('Régime mère-fille'), sec('')],
    [txt('Quote-part de frais et charges (QPFC) issue des paramètres fiscaux'), txt('CGI Art. 216 — BOI-IS-BASE-10-10-10-10')],
    [txt('Conditions : ≥ 5 % de détention, ≥ 2 ans de conservation'), txt('CGI Art. 145')],
    [txt("L'utilisateur confirme l'éligibilité — SER1 n'effectue pas de validation juridique"), txt('Hypothèse déclarative')],
    [sec('Compte courant d\'associé'), sec('')],
    [txt('Remboursement CCA : hors PFU, diminue le passif uniquement'), txt('CGI Art. 38 quater')],
    [txt('CCA constitué = apports initiaux + apports annuels sur la durée active'), txt('Hypothèse simplificatrice')],
    [sec('Dividendes et PFU'), sec('')],
    [txt('PFU dividendes : taux issus des paramètres fiscaux admin'), txt('CGI Art. 200 A')],
    [txt('Convention Option A : dividendes sortis en brut unique (pas de double comptage)'), txt('Convention interne')],
    [txt('Dividendes plafonnés à la capacité distribuable et à la trésorerie disponible'), txt('Hypothèse prudentielle')],
    [sec('Capitalisation'), sec('')],
    [txt('IS latent capitalisation : affiché pour information, non décaissé avant la sortie'), txt('Hypothèse de présentation')],
    [txt('IS effectif : déclenché uniquement au moment d\'un rachat'), txt('CGI Art. 219')],
    [sec('Délai de jouissance'), sec('')],
    [txt('Un mois est productif si son premier jour est ≥ dateDebutJouissance'), txt('Convention SER1')],
    [txt('Revenus proratisés selon les mois productifs de l\'année civile'), txt('Convention SER1')],
    [sec('Réserve légale'), sec('')],
    [txt('Réserve légale de droit commun non modélisée en V1'), txt('Hypothèse simplificatrice')],
    [txt('Taux fiscaux issus des paramètres admin — aucune valeur codée en dur dans l’export'), txt('Gouvernance SER1')],
    [sec('Avertissement'), sec('')],
    [txt('Société à l\'IR (SARL de famille) : hors scope V1'), txt('')],
    [txt('Ce document est établi à titre strictement indicatif.'), txt('')],
    [txt('Il ne constitue pas un conseil en investissement ou fiscal.'), txt('')],
    [txt('Montants arrondis à l\'euro le plus proche.'), txt('Convention')],
  ];

  return { name: 'Hypothèses', rows, columnWidths: [55, 35] };
}

// ─── Fonctions publiques ──────────────────────────────────────────────────────

/**
 * Construit le blob XLSX Trésorerie (sans déclencher de téléchargement).
 * Exporté pour les tests smoke / fingerprint.
 */
export async function buildTresorerieXlsxBlob(
  rows: TresoProjectionRow[],
  kpis: TresoKPIs,
  inputs: TresoInputs,
  headerFill?: string,
  sectionFill?: string,
): Promise<Blob> {
  const sheets: XlsxSheet[] = [
    buildProjectionSheet(rows, kpis, inputs),
    buildHypothesesSheet(),
  ];

  const blob = await buildXlsxBlob({ sheets, headerFill, sectionFill });
  const isValid = await validateXlsxBlob(blob);
  if (!isValid) throw new Error('XLSX invalide (signature PK manquante).');
  return blob;
}

/**
 * Génère et télécharge le fichier Excel Trésorerie Société IS.
 */
export async function exportTresorerieExcel(
  rows: TresoProjectionRow[],
  kpis: TresoKPIs,
  inputs: TresoInputs,
  headerFill?: string,
  sectionFill?: string,
): Promise<void> {
  const blob = await buildTresorerieXlsxBlob(rows, kpis, inputs, headerFill, sectionFill);
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  downloadXlsx(blob, `simulation-tresorerie-societe-${dateStr}.xlsx`);
}
