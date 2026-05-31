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
import type {
  AmountScheduleInput,
  AllocationPocketHorizon,
  RuntimeAssociateInput,
  SubsidiaryInput,
  TresoInputsV6,
  TresoProjectionRow,
} from '@/engine/tresorerie/types';
import type { TresoKPIs } from '../hooks/useTresorerieCalculations';
import {
  getAssociateProfile,
  getCapitalPct,
  getCompanyKindCode,
  getCompanyKindLabel,
  getEconomicPct,
  getAllocationHorizonLabel,
  getSelectedAssociate,
} from '@/domain/tresorerie/societeModel';
import {
  computeComplement,
  computeNetRevenue,
  getPhaseEndYear,
  isRevenuePhaseV6,
  type RevenuePhaseInput,
  sortPhases,
} from '../utils/revenuePhases';
import { getRevenuePhaseSourceLabel } from '../utils/revenuePhaseLabels';
import { buildProjectionSheet } from './tresorerieExcelProjectionSheet';
import { ctr, h, money, sec, sourceLabel, txt } from './tresorerieExcelCells';

function buildAssociateRevenueSheet(rows: TresoProjectionRow[], inputs: TresoInputsV6): XlsxSheet {
  if (rows.length === 0) {
    return {
      name: 'Revenus associés',
      rows: [[h('Année'), h('Associé'), h('Source'), h('Revenu net')]],
      columnWidths: [14, 24, 24, 16],
    };
  }

  const anneeCivile = getAssociateProfile(inputs, getSelectedAssociate(inputs)).projectionStartYear;
  const dataRows = rows.flatMap((row) => {
    const year = anneeCivile + row.year - 1;
    if (row.revenusParAssocie.length === 0) {
      return [[ctr(year), txt('—'), txt('Aucun revenu associé détaillé'), money(0)]];
    }
    return row.revenusParAssocie.map((revenue) => [
      ctr(year),
      txt(revenue.label),
      txt(sourceLabel(revenue.source)),
      money(revenue.netRevenue),
    ]);
  });

  return {
    name: 'Revenus associés',
    rows: [[h('Année'), h('Associé'), h('Source'), h('Revenu net')], ...dataRows],
    columnWidths: [14, 24, 24, 16],
  };
}

function ccaCurrentBalance(associate: RuntimeAssociateInput): number {
  return associate.cca?.currentBalance ?? 0;
}

function getAssociateRevenuePhases(associate: RuntimeAssociateInput): RevenuePhaseInput[] {
  const phases = (associate as { revenuePhases?: RevenuePhaseInput[] }).revenuePhases;
  return Array.isArray(phases) ? sortPhases(phases) : [];
}

function phaseLabel(phase: RevenuePhaseInput): string {
  if (isRevenuePhaseV6(phase))
    return phase.label?.trim() || `Palier ${phase.startYear}-${phase.endYear}`;
  return phase.label?.trim() || getRevenuePhaseSourceLabel(phase.source);
}

function phaseSourceLabel(phase: RevenuePhaseInput): string {
  if (!isRevenuePhaseV6(phase)) return getRevenuePhaseSourceLabel(phase.source);
  const labels = [
    phase.remuneration.enabled && phase.remuneration.source !== 'none' ? 'Rémunération' : undefined,
    phase.distribution.enabled ? 'Distribution' : undefined,
    phase.ccaContribution.enabled ? 'Constitution CCA' : undefined,
    phase.ccaRepayment.enabled ? 'Remboursement CCA' : undefined,
  ].filter(Boolean);
  return labels.join(' + ') || 'Aucune sous-phase';
}

function phaseLoadedAnnualCost(phase: RevenuePhaseInput): number {
  return isRevenuePhaseV6(phase) ? phase.remuneration.loadedAnnualCost : phase.loadedAnnualCost;
}

function phaseAnnualNeed(phase: RevenuePhaseInput): number {
  return isRevenuePhaseV6(phase)
    ? phase.distribution.annualNetIncomeNeed
    : phase.annualNetIncomeNeed;
}

function phaseCcaStrategyLabel(phase: RevenuePhaseInput): string {
  if (!isRevenuePhaseV6(phase))
    return phase.useCcaForCompletion ? 'CCA prioritaire' : 'Dividendes uniquement';
  return phase.ccaRepayment.enabled
    ? `Remboursement ${phase.ccaRepayment.strategy}`
    : 'Sans remboursement CCA';
}

function buildRevenuePhaseRows(company: TresoInputsV6['company']): XlsxCell[][] {
  const horizonYear = (company.projectionStartYear ?? new Date().getFullYear()) + 14;
  const rows = company.associates.flatMap((associate) => {
    const phases = getAssociateRevenuePhases(associate);
    return phases.map((phase) => [
      txt(associate.label),
      txt(phaseLabel(phase)),
      txt(`${phase.startYear} → ${getPhaseEndYear(phase, phases, horizonYear)}`),
      txt(phaseSourceLabel(phase)),
      money(phaseLoadedAnnualCost(phase)),
      money(computeNetRevenue(phase)),
      money(phaseAnnualNeed(phase)),
      money(computeComplement(phase)),
      txt(phaseCcaStrategyLabel(phase)),
    ]);
  });

  return rows.length > 0
    ? rows
    : [
        [
          txt('Aucun parcours renseigné'),
          txt(''),
          txt(''),
          txt(''),
          txt(''),
          txt(''),
          txt(''),
          txt(''),
          txt(''),
        ],
      ];
}

function scheduleRows(
  subsidiary: SubsidiaryInput,
  label: string,
  schedules: AmountScheduleInput[] | undefined,
): XlsxCell[][] {
  const rows = schedules && schedules.length > 0 ? schedules : [];

  return rows.map((schedule) => [
    txt(subsidiary.label),
    txt(label),
    txt(`${schedule.startYear} → ${schedule.endYear ?? 'non borné'}`),
    money(schedule.amount),
  ]);
}

function disposalRows(subsidiaries: SubsidiaryInput[]): XlsxCell[][] {
  const rows = subsidiaries
    .map((subsidiary) => {
      const disposal = subsidiary.disposal;
      if (!disposal) return null;
      return [
        txt(subsidiary.label),
        ctr(disposal.year ?? 'Non renseignée'),
        money(disposal.estimatedPrice),
        money(disposal.taxBasis),
        money(disposal.fees ?? 0),
        txt(disposal.acquisitionYear ? String(disposal.acquisitionYear) : 'Non renseignée'),
        txt(disposal.regime === 'auto' ? 'Auto' : disposal.regime.toUpperCase()),
      ];
    })
    .filter((row): row is XlsxCell[] => row !== null);

  return rows.length > 0
    ? rows
    : [[txt('Aucune cession prévue'), txt(''), txt(''), txt(''), txt(''), txt(''), txt('')]];
}

function buildStructureSheet(inputs: TresoInputsV6): XlsxSheet {
  const company = inputs.company;
  const incomeStatement = company.incomeStatement ?? {
    annualRevenue: 0,
    annualStructureCosts: company.annualStructureCosts,
    workingCapitalRequirement: 0,
  };
  const minimumBankBalance =
    inputs.allocationMatrix.minimumBankBalance ?? inputs.allocationMatrix.sweepThreshold ?? 0;
  const bankLabel =
    inputs.allocationMatrix.pockets.length === 0
      ? 'Trésorerie conservée sur compte bancaire'
      : 'Compte bancaire';
  const pocketRows: XlsxCell[][] = [
    [
      txt(bankLabel),
      txt('Poche système'),
      txt(`0 % · solde minimum ${minimumBankBalance.toLocaleString('fr-FR')} €`),
    ],
  ];
  const horizons: AllocationPocketHorizon[] = ['court_terme', 'moyen_terme', 'long_terme'];
  horizons.forEach((horizon) => {
    const horizonPockets = inputs.allocationMatrix.pockets.filter(
      (pocket) => pocket.horizon === horizon,
    );
    if (horizonPockets.length === 0) {
      pocketRows.push([
        txt(getAllocationHorizonLabel(horizon)),
        txt('Aucune poche'),
        txt('Trésorerie non affectée à cet horizon'),
      ]);
      return;
    }
    horizonPockets.forEach((pocket) => {
      pocketRows.push([
        txt(getAllocationHorizonLabel(pocket.horizon)),
        txt(pocket.label ?? pocket.id),
        txt(
          `${pocket.initialAllocationPct} % initial · ${pocket.annualAllocationPct} % balayage · ${Math.round(pocket.annualReturnRate * 10000) / 100} % · durée ${pocket.durationYears} ans`,
        ),
      ]);
    });
  });
  const flowScheduleRows = company.subsidiaries.flatMap((subsidiary) => [
    ...scheduleRows(subsidiary, 'Prestations vers la mère', subsidiary.servicesSchedule),
    ...scheduleRows(subsidiary, 'Dividendes vers la mère', subsidiary.dividendsSchedule),
  ]);
  const rows: XlsxCell[][] = [
    [h('Structure société'), h('Valeur'), h('Détail')],
    [txt('Type société'), txt(getCompanyKindLabel(company)), txt(getCompanyKindCode(company))],
    [txt('Forme sociale'), txt(company.legalForm.toUpperCase()), txt('')],
    [
      txt('Chiffre d’affaires annuel'),
      money(incomeStatement.annualRevenue),
      txt('Compte de résultat'),
    ],
    [
      txt('Coûts de structure annuels'),
      money(incomeStatement.annualStructureCosts),
      txt('Compte de résultat'),
    ],
    [txt('BFR'), money(incomeStatement.workingCapitalRequirement), txt('Seuil non investissable')],
    [txt('Solde minimum bancaire'), money(minimumBankBalance), txt('Compte bancaire pivot')],
    [sec('Associés'), sec(''), sec('')],
    [h('Associé'), h('% capital / économique'), h('Rémunération / CCA')],
    ...company.associates.map((associate) => [
      txt(`${associate.label} (${associate.kind === 'pm' ? 'PM' : 'PP'})`),
      txt(`${getCapitalPct(associate)} % / ${getEconomicPct(associate)} %`),
      txt(
        `Parcours timeline · CCA ${ccaCurrentBalance(associate).toLocaleString('fr-FR')} € au taux ${Math.round((associate.cca?.remunerationRate ?? 0) * 10000) / 100} %`,
      ),
    ]),
    [
      sec('Parcours de revenus'),
      sec(''),
      sec(''),
      sec(''),
      sec(''),
      sec(''),
      sec(''),
      sec(''),
      sec(''),
    ],
    [
      h('Associé'),
      h('Palier'),
      h('Période'),
      h('Source'),
      h('Rémunération chargée'),
      h('Net estimé'),
      h('Besoin total net'),
      h('Complément'),
      h('Priorité'),
    ],
    ...buildRevenuePhaseRows(company),
    [sec('Filiales'), sec(''), sec('')],
    [h('Filiale'), h('% détention'), h('Trésorerie / Cession')],
    ...company.subsidiaries.map((subsidiary) => [
      txt(subsidiary.label),
      txt(`${subsidiary.ownershipPct ?? subsidiary.holdingOwnershipPct} %`),
      txt(
        `${(subsidiary.parentEntityId ?? 'societe') === 'societe' ? 'Société mère' : subsidiary.parentEntityId} · trésorerie ${(subsidiary.treasuryInitial ?? 0).toLocaleString('fr-FR')} € · cession ${subsidiary.disposal?.year ?? 'non prévue'}`,
      ),
    ]),
    [sec('Paliers filiales'), sec(''), sec('')],
    [h('Filiale'), h('Flux'), h('Période'), h('Montant')],
    ...flowScheduleRows,
    [sec('Cessions filiales'), sec(''), sec(''), sec(''), sec(''), sec(''), sec('')],
    [
      h('Filiale'),
      h('Année'),
      h('Prix'),
      h('Valeur fiscale des titres'),
      h('Frais'),
      h('Acquisition'),
      h('Régime'),
    ],
    ...disposalRows(company.subsidiaries),
    [sec('Stratégie de trésorerie'), sec(''), sec('')],
    [h('Groupe'), h('Poche'), h('Allocation, rendement et durée')],
    ...pocketRows,
  ];

  return { name: 'Structure société', rows, columnWidths: [28, 28, 32, 18, 18, 18, 18] };
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
    [
      txt('Quote-part de frais et charges (QPFC) issue des paramètres fiscaux'),
      txt('CGI Art. 216 — BOI-IS-BASE-10-10-10-10'),
    ],
    [txt('Conditions : ≥ 5 % de détention, ≥ 2 ans de conservation'), txt('CGI Art. 145')],
    [
      txt("L'utilisateur confirme l'éligibilité — SER1 n'effectue pas de validation juridique"),
      txt('Hypothèse déclarative'),
    ],
    [sec("Compte courant d'associé"), sec('')],
    [txt('Remboursement CCA : hors PFU, diminue le passif uniquement'), txt('CGI Art. 38 quater')],
    [
      txt('CCA constitué = apports programmés dans les paliers + apports exceptionnels'),
      txt('Convention SER1'),
    ],
    [
      txt('Taux maximum déductible des intérêts CCA issu des paramètres fiscaux'),
      txt('Service-Public / BOFiP / CGI art. 39'),
    ],
    [sec('Dividendes et PFU'), sec('')],
    [txt('PFU dividendes : taux issus des paramètres fiscaux admin'), txt('CGI Art. 200 A')],
    [
      txt('Convention Option A : dividendes sortis en brut unique (pas de double comptage)'),
      txt('Convention interne'),
    ],
    [
      txt(
        'Dividendes plafonnés à la capacité distribuable après dotation de réserve légale et à la trésorerie disponible',
      ),
      txt('C. com. L232-10 / L232-11'),
    ],
    [sec('Capitalisation'), sec('')],
    [
      txt('IS latent capitalisation : affiché pour information, non décaissé avant la sortie'),
      txt('Hypothèse de présentation'),
    ],
    [txt("IS effectif : déclenché uniquement au moment d'un rachat"), txt('CGI Art. 219')],
    [sec('Matrice de trésorerie'), sec('')],
    [
      txt('Balayage en fin d’exercice uniquement, après IS, dettes, CCA, charges et dividendes'),
      txt('Convention SER1'),
    ],
    [txt('BFR inclus dans le seuil de sécurité avant investissement'), txt('Convention SER1')],
    [
      txt('Les lots investis en fin d’exercice ne produisent pas de revenus sur l’exercice écoulé'),
      txt('Convention SER1'),
    ],
    [
      txt(
        'Au terme, les placements reviennent sur le compte bancaire ; la répétition réinvestit seulement le surplus',
      ),
      txt('Convention SER1'),
    ],
    [sec('TNS'), sec('')],
    [
      txt('Seuil social V1 : capital social + primes + CCA TNS de début d’exercice'),
      txt('CSS L136-3 / R131-7'),
    ],
    [
      txt('Le taux de charges sociales TNS reste une saisie manuelle'),
      txt('Hypothèse déclarative'),
    ],
    [sec('Délai de jouissance'), sec('')],
    [
      txt('Un mois est productif si son premier jour est ≥ dateDebutJouissance'),
      txt('Convention SER1'),
    ],
    [txt("Revenus proratisés selon les mois productifs de l'année civile"), txt('Convention SER1')],
    [sec('Réserve légale'), sec('')],
    [
      txt('Dotation de 5 % du résultat net bénéficiaire jusqu’à 10 % du capital social'),
      txt('C. com. L232-10'),
    ],
    [
      txt(
        'La réserve légale est non distribuable ; les réserves initiales restent le poste distribuable',
      ),
      txt('C. com. L232-11'),
    ],
    [
      txt('Taux fiscaux issus des paramètres admin — aucune valeur codée en dur dans l’export'),
      txt('Gouvernance SER1'),
    ],
    [sec('Avertissement'), sec('')],
    [txt("Société à l'IR (SARL de famille) : hors scope V1"), txt('')],
    [txt('Ce document est établi à titre strictement indicatif.'), txt('')],
    [txt('Il ne constitue pas un conseil en investissement ou fiscal.'), txt('')],
    [txt("Montants arrondis à l'euro le plus proche."), txt('Convention')],
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
  inputs: TresoInputsV6,
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
  inputs: TresoInputsV6,
  headerFill?: string,
  sectionFill?: string,
): Promise<void> {
  const blob = await buildTresorerieXlsxBlob(rows, kpis, inputs, headerFill, sectionFill);
  const dateStr = (new Date().toISOString().split('T')[0] ?? 'date').replace(/-/g, '');
  downloadXlsx(blob, `simulation-tresorerie-societe-${dateStr}.xlsx`);
}
