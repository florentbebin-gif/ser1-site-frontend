import type {
  RuntimeAssociateInput,
  TresoInputsV6,
  TresoProjectionRow,
} from '@/engine/tresorerie/types';
import {
  getAssociateProfile,
  getCompanyKindLabel,
  getSelectedAssociate,
} from '@/domain/tresorerie/societeModel';
import { isRevenuePhaseV6, sortPhases, type RevenuePhaseInput } from '../utils/revenuePhases';
import type { TresoKPIs } from '../hooks/useTresorerieCalculations';
import type { XlsxCell, XlsxSheet } from '@/utils/export/xlsxBuilder';
import { ctr, h, money, sec, txt } from './tresorerieExcelCells';

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
  {
    key: 'dividendesFiliales',
    label: 'Dividendes filiales reçus (régime mère-fille)',
    format: 'money',
  },
  {
    key: 'cessionFilialesCash',
    label: 'Cash brut de cession filiale reçu en banque',
    format: 'money',
  },
  {
    key: 'cessionFilialesPlusValueBrute',
    label: 'Plus-value brute de cession filiale',
    format: 'money',
  },
  {
    key: 'cessionFilialesQuotePartTaxable',
    label: 'Quote-part taxable de cession filiale',
    format: 'money',
  },
  { key: 'quotePartTaxable', label: 'Quote-part taxable totale filiales', format: 'money' },
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
  { key: 'reserveLegaleDebut', label: "Réserve légale en début d'exercice", format: 'money' },
  {
    key: 'dotationReserveLegale',
    label: 'Dotation obligatoire à la réserve légale',
    format: 'money',
  },
  { key: 'reserveLegaleFin', label: "Réserve légale en fin d'exercice", format: 'money' },
  {
    key: 'dividendesAssociesBruts',
    label: 'Dividendes versés aux associés (bruts)',
    format: 'money',
  },
  { key: 'reservesFin', label: "Réserves en fin d'exercice", format: 'money' },
  { key: 'capaciteDistribuable', label: 'Capacité distribuable', format: 'money' },
  { key: 'pfu', label: 'Fiscalité dividendes (PFU)', format: 'money' },
  { key: 'revenusNets', label: 'Total revenus nets annuels', format: 'money' },
  { key: 'deltaBesoin', label: 'Écart annuel avec le besoin de revenus', format: 'money' },
  { key: 'tresorerieBanqueFin', label: 'Compte bancaire fin d’année', format: 'money' },
  { key: 'soldeMinimumCompteBancaire', label: 'Solde minimum bancaire', format: 'money' },
  { key: 'bfr', label: 'BFR protégé', format: 'money' },
  {
    key: 'tresorerieDisponible',
    label: 'Trésorerie disponible au-dessus du seuil',
    format: 'money',
  },
  { key: 'montantInvestiInitial', label: 'Montant investi initialement', format: 'money' },
  { key: 'montantBalayeAnnuel', label: 'Montant balayé vers placements', format: 'money' },
  { key: 'montantReinvestiAuTerme', label: 'Montant réinvesti au terme', format: 'money' },
  {
    key: 'deficitTresorerieBancaire',
    label: 'Déficit bancaire vs solde minimum + BFR',
    format: 'money',
  },
  {
    key: 'alerteTresorerieBancaireInsuffisante',
    label: 'Alerte compte bancaire insuffisant',
    format: 'bool',
  },
  { key: 'tresorerieFin', label: "Trésorerie fin d'année", format: 'money' },
];

function getAssociateRevenuePhases(associate: RuntimeAssociateInput): RevenuePhaseInput[] {
  const phases = (associate as { revenuePhases?: RevenuePhaseInput[] }).revenuePhases;
  return Array.isArray(phases) ? sortPhases(phases) : [];
}

export function buildProjectionSheet(
  rows: TresoProjectionRow[],
  kpis: TresoKPIs,
  inputs: TresoInputsV6,
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
    (sum, associate) => sum + (associate.cca?.currentBalance ?? 0),
    0,
  );
  const ccaAnnualTotal = inputs.company.associates.reduce((sum, associate) => {
    const phaseAnnual = getAssociateRevenuePhases(associate)
      .filter(isRevenuePhaseV6)
      .reduce((phaseSum, phase) => phaseSum + (phase.ccaContribution.annual?.amount ?? 0), 0);
    return sum + phaseAnnual;
  }, 0);
  const maxContributionEndYear = inputs.company.associates.reduce<number | undefined>(
    (max, associate) => {
      const phaseEndYear = getAssociateRevenuePhases(associate)
        .filter(isRevenuePhaseV6)
        .reduce<number | undefined>((phaseMax, phase) => {
          const endYear = phase.ccaContribution.annual?.endYear;
          if (endYear == null) return phaseMax;
          return phaseMax == null ? endYear : Math.max(phaseMax, endYear);
        }, undefined);
      return phaseEndYear == null ? max : max == null ? phaseEndYear : Math.max(max, phaseEndYear);
    },
    undefined,
  );
  const activeDurationLabel =
    maxContributionEndYear == null
      ? 'Non bornée'
      : `${Math.max(0, maxContributionEndYear - anneeCivile + 1)} ans`;

  const paramRows: XlsxCell[][] = [
    [h('Paramètre'), h('Valeur')],
    [
      txt('Type de société'),
      txt(
        inputs.company.creationType === 'existante'
          ? 'Société existante'
          : 'Société à créer (NEWCO)',
      ),
    ],
    [txt('Type société'), txt(getCompanyKindLabel(inputs.company))],
    [txt('Âge actuel associé actif'), ctr(activeProfile.currentAge)],
    [txt('Âge de retraite associé actif'), ctr(activeProfile.retirementAge)],
    [txt('Besoin annuel net à la retraite'), money(activeProfile.annualIncomeNeed)],
    [
      txt('Coûts de structure annuels'),
      money(
        inputs.company.incomeStatement?.annualStructureCosts ?? inputs.company.annualStructureCosts,
      ),
    ],
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
    [
      txt('Alerte dividendes > capacité (an 1)'),
      txt(kpis.alerteDividendesAn1 ? 'Oui — à contrôler' : 'Non'),
    ],
    [txt('Déficit bancaire maximum'), money(kpis.deficitBancaireMax)],
    [
      txt('Alerte compte bancaire'),
      txt(
        kpis.alerteTresorerieBancaire
          ? `Oui — première année ${kpis.premiereAnneeDeficitBancaire ?? 'à contrôler'}`
          : 'Non',
      ),
    ],
    [sec(''), sec('')],
  ];

  const nbAns = rows.length;
  const headerYear: XlsxCell[] = [
    h('Indicateur'),
    ...rows.map((r) => h(`${anneeCivile + r.year - 1} — An ${r.year}`)),
  ];

  const dataRows: XlsxCell[][] = RESUME_SERIES.map(({ key, label }) => [
    txt(label),
    ...rows.map((r) => {
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
