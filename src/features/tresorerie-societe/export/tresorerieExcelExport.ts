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
import type { AssociateInput, TresoInputsRuntime, TresoProjectionRow } from '@/engine/tresorerie/types';
import type { TresoKPIs } from '../hooks/useTresorerieCalculations';
import {
  getAssociateProfile,
  getCapitalPct,
  getCompanyKindCode,
  getCompanyKindLabel,
  getEconomicPct,
  getSelectedAssociate,
} from '../utils/tresorerieSocieteModel';

// ─── Helpers de style ─────────────────────────────────────────────────────────

const h = (t: string): XlsxCell => ({ v: t, style: 'sHeader' });
const sec = (t: string): XlsxCell => ({ v: t, style: 'sSection' });
const txt = (t: string): XlsxCell => ({ v: t, style: 'sText' });
const ctr = (t: string | number): XlsxCell => ({ v: t, style: 'sCenter' });
const money = (v: number): XlsxCell => ({ v: Math.round(v), style: 'sMoney' });

function sourceLabel(source: string): string {
  if (source === 'remuneration') return 'Rémunération';
  if (source === 'cca') return 'Remboursement CCA';
  if (source === 'cca_interets') return 'Intérêts CCA';
  if (source === 'dividendes') return 'Dividendes';
  if (source === 'charges_sociales_tns') return 'Charges sociales TNS';
  if (source === 'fiscalite') return 'Fiscalité';
  return source;
}

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
  { key: 'interetsCCA', label: 'Intérêts CCA versés', format: 'money' },
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
  inputs: TresoInputsRuntime,
): XlsxSheet {
  if (rows.length === 0) {
    return {
      name: 'Projection',
      rows: [[h('Indicateur')], [txt('Aucune donnée — paramètres à renseigner.')]],
      columnWidths: [40],
    };
  }

  const activeProfile = getAssociateProfile(inputs, getSelectedAssociate(inputs));
  const anneeCivile = activeProfile.projectionStartYear;
  const ccaInitialTotal = inputs.company.associates.reduce(
    (sum, associate) => sum + (associate.cca?.currentBalance ?? associate.ccaInitial),
    0,
  );
  const ccaAnnualTotal = inputs.company.associates.reduce(
    (sum, associate) => sum + (associate.cca?.annualContribution.amount ?? associate.ccaAnnualContribution),
    0,
  );
  const maxContributionEndYear = inputs.company.associates.reduce<number | undefined>(
    (max, associate) => {
      const endYear = associate.cca?.annualContribution.endYear ?? associate.ccaContributionEndYear;
      if (endYear == null) return max;
      return max == null ? endYear : Math.max(max, endYear);
    },
    undefined,
  );
  const activeDurationLabel = maxContributionEndYear == null
    ? 'Non bornée'
    : `${Math.max(0, maxContributionEndYear - anneeCivile + 1)} ans`;

  // En-tête avec paramètres
  const paramRows: XlsxCell[][] = [
    [h('Paramètre'), h('Valeur')],
    [txt('Type de société'), txt(inputs.company.creationType === 'existante' ? 'Société existante' : 'Société à créer (NEWCO)')],
    [txt('Type société'), txt(getCompanyKindLabel(inputs.company))],
    [txt('Âge actuel associé actif'), ctr(activeProfile.currentAge)],
    [txt('Âge de retraite associé actif'), ctr(activeProfile.retirementAge)],
    [txt('Besoin annuel net à la retraite'), money(activeProfile.annualIncomeNeed)],
    [txt('Coûts de structure annuels'), money(inputs.company.incomeStatement?.annualStructureCosts ?? inputs.company.annualStructureCosts)],
    [txt('BFR'), money(inputs.company.incomeStatement?.workingCapitalRequirement ?? 0)],
    [txt('CCA initial'), money(ccaInitialTotal)],
    [txt('Apport annuel CCA'), money(ccaAnnualTotal)],
    [txt('Durée phase active'), ctr(activeDurationLabel)],
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

function buildAssociateRevenueSheet(rows: TresoProjectionRow[], inputs: TresoInputsRuntime): XlsxSheet {
  if (rows.length === 0) {
    return {
      name: 'Revenus associés',
      rows: [[h('Année'), h('Associé'), h('Source'), h('Revenu net')]],
      columnWidths: [14, 24, 24, 16],
    };
  }

  const anneeCivile = getAssociateProfile(inputs, getSelectedAssociate(inputs)).projectionStartYear;
  const dataRows = rows.flatMap(row => {
    const year = anneeCivile + row.year - 1;
    if (row.revenusParAssocie.length === 0) {
      return [[ctr(year), txt('—'), txt('Aucun revenu associé détaillé'), money(0)]];
    }
    return row.revenusParAssocie.map(revenue => [
      ctr(year),
      txt(revenue.label),
      txt(sourceLabel(revenue.source)),
      money(revenue.netRevenue),
    ]);
  });

  return {
    name: 'Revenus associés',
    rows: [
      [h('Année'), h('Associé'), h('Source'), h('Revenu net')],
      ...dataRows,
    ],
    columnWidths: [14, 24, 24, 16],
  };
}

function ccaCurrentBalance(associate: AssociateInput): number {
  return associate.cca?.currentBalance ?? associate.ccaInitial;
}

function buildStructureSheet(inputs: TresoInputsRuntime): XlsxSheet {
  const company = inputs.company;
  const incomeStatement = company.incomeStatement ?? {
    annualRevenue: 0,
    annualStructureCosts: company.annualStructureCosts,
    workingCapitalRequirement: 0,
  };
  const pocketRows: XlsxCell[][] = inputs.allocationMatrix.pockets.length > 0
    ? inputs.allocationMatrix.pockets.map(pocket => [
      txt(pocket.label ?? pocket.id),
      txt(pocket.horizon ?? 'moyen_terme'),
      txt(`${pocket.initialAllocationPct} % initial · ${pocket.annualAllocationPct} % balayage · ${Math.round(pocket.annualReturnRate * 10000) / 100} %`),
    ])
    : [[
      txt('Trésorerie conservée sur compte bancaire'),
      txt('Sans rendement'),
      txt('Aucune poche d’allocation renseignée'),
    ]];
  const rows: XlsxCell[][] = [
    [h('Structure société'), h('Valeur'), h('Détail')],
    [txt('Type société'), txt(getCompanyKindLabel(company)), txt(getCompanyKindCode(company))],
    [txt('Forme sociale'), txt(company.legalForm.toUpperCase()), txt('')],
    [txt('Chiffre d’affaires annuel'), money(incomeStatement.annualRevenue), txt('Compte de résultat')],
    [txt('Coûts de structure annuels'), money(incomeStatement.annualStructureCosts), txt('Compte de résultat')],
    [txt('BFR'), money(incomeStatement.workingCapitalRequirement), txt('Seuil non investissable')],
    [txt('Solde minimum bancaire'), money(inputs.allocationMatrix.minimumBankBalance ?? inputs.allocationMatrix.sweepThreshold ?? 0), txt('Compte bancaire pivot')],
    [sec('Associés'), sec(''), sec('')],
    [h('Associé'), h('% capital / économique'), h('Rémunération / CCA')],
    ...company.associates.map(associate => [
      txt(`${associate.label} (${associate.kind === 'pm' ? 'PM' : 'PP'})`),
      txt(`${getCapitalPct(associate)} % / ${getEconomicPct(associate)} %`),
      txt(`${associate.remuneration?.source === 'subsidiary' ? 'Filiale' : 'Holding'} · CCA ${ccaCurrentBalance(associate).toLocaleString('fr-FR')} € au taux ${Math.round((associate.cca?.remunerationRate ?? 0) * 10000) / 100} %`),
    ]),
    [sec('Filiales'), sec(''), sec('')],
    [h('Filiale'), h('% détention'), h('Trésorerie / Cession')],
    ...company.subsidiaries.map(subsidiary => [
      txt(subsidiary.label),
      txt(`${subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct} %`),
      txt(`${(subsidiary.parentEntityId ?? 'societe') === 'societe' ? 'Société mère' : subsidiary.parentEntityId} · trésorerie ${(subsidiary.treasuryInitial ?? 0).toLocaleString('fr-FR')} € · cession ${subsidiary.disposal?.year ?? subsidiary.disposalYear ?? 'non prévue'}`),
    ]),
    [sec('Stratégie de trésorerie'), sec(''), sec('')],
    [h('Poche'), h('Horizon'), h('Allocation et rendement')],
    ...pocketRows,
  ];

  return { name: 'Structure société', rows, columnWidths: [28, 28, 32] };
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
    [txt('Taux maximum déductible des intérêts CCA issu des paramètres fiscaux'), txt('Service-Public / BOFiP / CGI art. 39')],
    [sec('Dividendes et PFU'), sec('')],
    [txt('PFU dividendes : taux issus des paramètres fiscaux admin'), txt('CGI Art. 200 A')],
    [txt('Convention Option A : dividendes sortis en brut unique (pas de double comptage)'), txt('Convention interne')],
    [txt('Dividendes plafonnés à la capacité distribuable et à la trésorerie disponible'), txt('Hypothèse prudentielle')],
    [sec('Capitalisation'), sec('')],
    [txt('IS latent capitalisation : affiché pour information, non décaissé avant la sortie'), txt('Hypothèse de présentation')],
    [txt('IS effectif : déclenché uniquement au moment d\'un rachat'), txt('CGI Art. 219')],
    [sec('Matrice de trésorerie'), sec('')],
    [txt('Balayage en fin d’exercice uniquement, après IS, dettes, CCA, charges et dividendes'), txt('Convention SER1')],
    [txt('BFR inclus dans le seuil de sécurité avant investissement'), txt('Convention SER1')],
    [txt('Les lots investis en fin d’exercice ne produisent pas de revenus sur l’exercice écoulé'), txt('Convention SER1')],
    [txt('Au terme, les placements reviennent sur le compte bancaire ; la répétition réinvestit seulement le surplus'), txt('Convention SER1')],
    [sec('TNS'), sec('')],
    [txt('Seuil social V1 : capital social + primes + CCA TNS de début d’exercice'), txt('CSS L136-3 / R131-7')],
    [txt('Le taux de charges sociales TNS reste une saisie manuelle'), txt('Hypothèse déclarative')],
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
  inputs: TresoInputsRuntime,
  headerFill?: string,
  sectionFill?: string,
): Promise<Blob> {
  const sheets: XlsxSheet[] = [
    buildProjectionSheet(rows, kpis, inputs),
    buildAssociateRevenueSheet(rows, inputs),
    buildHypothesesSheet(),
    buildStructureSheet(inputs),
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
  inputs: TresoInputsRuntime,
  headerFill?: string,
  sectionFill?: string,
): Promise<void> {
  const blob = await buildTresorerieXlsxBlob(rows, kpis, inputs, headerFill, sectionFill);
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  downloadXlsx(blob, `simulation-tresorerie-societe-${dateStr}.xlsx`);
}
