import type {
  BusinessIconName,
  TresorerieAllocationMatrixSlideSpec,
  TresorerieFlowMechanismSlideSpec,
  TresorerieHypothesesSlideSpec,
  TresorerieParametersAnnexSlideSpec,
  TresorerieSynthesisSlideSpec,
} from '@/pptx/theme/types';
import type { TresoInputsV6, TresoProjectionRow } from '@/engine/tresorerie/types';
import type { TresoKPIs } from '../hooks/useTresorerieCalculations';
import {
  getAllocationHorizonLabel,
  getAssociateProfile,
  getCapitalPct,
  getCompanyKindLabel,
  getEconomicPct,
  getSelectedAssociate,
} from '@/domain/tresorerie/societeModel';
import {
  fmtPct,
  formatEuro,
  getBankEnd,
  getMinimumBankBalance,
  getProtectedCash,
  getWorkingCapitalRequirement,
  positiveAmount,
} from './tresoreriePptxHelpers';

function getConsolidatedTreasuryEnd(rows: TresoProjectionRow[]): number {
  const lastRow = rows[rows.length - 1];
  if (!lastRow) return 0;
  return getBankEnd(lastRow) + lastRow.capitalDistrib + lastRow.valeurCapi;
}

function getCivilYear(profile: { projectionStartYear: number }, row: TresoProjectionRow): number {
  return profile.projectionStartYear + row.year - 1;
}

function getAgeLabel(profile: { currentAge: number }, row: TresoProjectionRow): string {
  return profile.currentAge > 0 ? `À ${profile.currentAge + row.year - 1} ans` : '';
}

function sumSelectedRevenue(
  row: TresoProjectionRow,
  associateId: string | undefined,
  source: 'cca' | 'dividendes',
): number {
  return row.revenusParAssocie
    .filter((revenue) => !associateId || revenue.associateId === associateId)
    .filter((revenue) => revenue.source === source)
    .reduce((sum, revenue) => {
      const sourceAmount = source === 'cca' ? revenue.ccaRepaid : revenue.grossDividends;
      return sum + Math.max(positiveAmount(sourceAmount), positiveAmount(revenue.netRevenue));
    }, 0);
}

function buildTriggerMarker(
  rows: TresoProjectionRow[],
  inputs: TresoInputsV6,
): TresorerieSynthesisSlideSpec['triggerMarker'] {
  const selectedAssociate = getSelectedAssociate(inputs);
  const profile = getAssociateProfile(inputs, selectedAssociate);
  const associateId = selectedAssociate?.id;
  const ccaRow = rows.find((row) => sumSelectedRevenue(row, associateId, 'cca') > 0);
  const dividendRow = rows.find((row) => sumSelectedRevenue(row, associateId, 'dividendes') > 0);
  const row = ccaRow ?? dividendRow;
  if (!row) return undefined;

  const isCca = row === ccaRow;
  return {
    year: getCivilYear(profile, row),
    ageLabel: getAgeLabel(profile, row) || `En ${getCivilYear(profile, row)}`,
    label: 'Phase de revenu',
    kind: isCca ? 'cca' : 'dividendes',
  };
}

function getPocketIcon(horizon: string | undefined): BusinessIconName {
  if (horizon === 'court_terme') return 'bank';
  if (horizon === 'long_terme') return 'chart-up';
  return 'balance';
}

function getPocketTone(
  index: number,
): TresorerieSynthesisSlideSpec['pocketTimeline'][number]['tone'] {
  if (index === 0) return 'main';
  if (index === 1) return 'muted';
  if (index === 2) return 'accent';
  return 'neutral';
}

function buildPocketTimeline(
  inputs: TresoInputsV6,
  projectionStartYear: number,
  rangeEndYear: number,
): TresorerieSynthesisSlideSpec['pocketTimeline'] {
  const allocatableBase = Math.max(
    0,
    positiveAmount(inputs.company.treasuryInitial) - getProtectedCash(inputs),
  );
  const pockets = inputs.allocationMatrix.pockets;
  if (pockets.length === 0) {
    return [
      {
        label: 'Trésorerie conservée sur compte bancaire',
        horizonLabel: 'Compte bancaire',
        startYear: projectionStartYear,
        endYear: rangeEndYear,
        amountLabel: formatEuro(positiveAmount(inputs.company.treasuryInitial)),
        iconKey: 'bank',
        tone: 'neutral',
      },
    ];
  }

  return pockets.slice(0, 4).map((pocket, index) => {
    const delayYears = Math.floor(positiveAmount(pocket.enjoymentDelayMonths) / 12);
    const startYear = Math.min(rangeEndYear, projectionStartYear + delayYears);
    const duration = Math.max(1, positiveAmount(pocket.durationYears));
    return {
      label: pocket.label?.trim() || `Poche ${index + 1}`,
      horizonLabel: getAllocationHorizonLabel(pocket.horizon),
      startYear,
      endYear: Math.min(rangeEndYear, startYear + duration - 1),
      amountLabel: formatEuro(
        (allocatableBase * positiveAmount(pocket.initialAllocationPct)) / 100,
      ),
      iconKey: getPocketIcon(pocket.horizon),
      tone: getPocketTone(index),
    };
  });
}

function buildCashFlows(
  rows: TresoProjectionRow[],
  inputs: TresoInputsV6,
): TresorerieSynthesisSlideSpec['cashFlows'] {
  const selectedAssociate = getSelectedAssociate(inputs);
  const associateId = selectedAssociate?.id;
  const annualContribution =
    selectedAssociate?.revenuePhases.reduce(
      (sum, phase) =>
        sum +
        (phase.ccaContribution?.enabled
          ? positiveAmount(phase.ccaContribution.annual?.amount ?? 0)
          : 0),
      0,
    ) ?? 0;
  const firstCcaAmount = rows
    .map((row) => sumSelectedRevenue(row, associateId, 'cca'))
    .find((amount) => amount > 0);
  const hasDividends = rows.some((row) =>
    row.revenusParAssocie
      .filter((revenue) => !associateId || revenue.associateId === associateId)
      .some((revenue) => revenue.source === 'dividendes' && positiveAmount(revenue.netRevenue) > 0),
  );

  return {
    annualContributionLabel:
      annualContribution > 0 ? `Apports CCA annuels ${formatEuro(annualContribution)}` : undefined,
    annualWithdrawalLabel: firstCcaAmount
      ? `CCA servi ${formatEuro(firstCcaAmount)} / an`
      : undefined,
    revenueLabel: hasDividends ? 'Dividendes nets selon phase' : undefined,
  };
}

function getSelectedDividendNetRevenue(
  row: TresoProjectionRow,
  associateId: string | undefined,
): number {
  return row.revenusParAssocie
    .filter((revenue) => !associateId || revenue.associateId === associateId)
    .filter((revenue) => revenue.source === 'dividendes')
    .reduce((sum, revenue) => sum + positiveAmount(revenue.netRevenue), 0);
}

export function buildSynthesisSlide(
  rows: TresoProjectionRow[],
  _kpis: TresoKPIs,
  inputs: TresoInputsV6,
  rangeEndYear: number,
): TresorerieSynthesisSlideSpec {
  const consolidatedEnd = getConsolidatedTreasuryEnd(rows);
  const selectedAssociate = getSelectedAssociate(inputs);
  const profile = getAssociateProfile(inputs, selectedAssociate);
  const associateId = selectedAssociate?.id;
  const projectionStartYear = profile.projectionStartYear;
  return {
    type: 'treso-synthesis',
    title: 'Synthèse',
    subtitle: 'Phases, CCA et poches de trésorerie sur l’horizon projeté',
    rangeStartYear: projectionStartYear,
    rangeEndYear,
    chartLabels: {
      investment: 'Valorisation de la trésorerie',
      incomeRelay: 'CCA restant puis dividendes',
    },
    series: rows.map((row) => ({
      year: getCivilYear(profile, row),
      investmentValue: positiveAmount(row.capitalDistrib) + positiveAmount(row.valeurCapi),
      ccaBalance: positiveAmount(row.ccaRestant),
      dividendRevenue: getSelectedDividendNetRevenue(row, associateId),
    })),
    triggerMarker: buildTriggerMarker(rows, inputs),
    milestones: {
      horizon: {
        year: rangeEndYear,
        ageLabel:
          profile.currentAge > 0
            ? `${profile.currentAge + Math.max(rows.length - 1, 0)} ans`
            : undefined,
        valueLabel: formatEuro(consolidatedEnd),
      },
    },
    cashFlows: buildCashFlows(rows, inputs),
    pocketTimeline: buildPocketTimeline(inputs, projectionStartYear, rangeEndYear),
  };
}

export function buildFlowMechanismSlide(
  inputs: TresoInputsV6,
  kpis: TresoKPIs,
): TresorerieFlowMechanismSlideSpec {
  const ccaInitialTotal = inputs.company.associates.reduce(
    (sum, associate) => sum + positiveAmount(associate.cca?.currentBalance),
    0,
  );
  const initialContributions =
    positiveAmount(inputs.company.shareCapital) +
    positiveAmount(inputs.company.sharePremium) +
    ccaInitialTotal;
  const protectedCash = getProtectedCash(inputs);
  const allocatableBase = Math.max(
    0,
    positiveAmount(inputs.company.treasuryInitial) - protectedCash,
  );

  return {
    type: 'treso-flow-mechanism',
    title: 'Mécanisme des flux',
    subtitle: 'Du compte bancaire société vers les revenus et les poches investies',
    steps: [
      {
        title: 'Associer les apports',
        label: 'Capital, primes et CCA alimentent la société',
        value: formatEuro(initialContributions),
        iconKey: 'user-add',
        tone: 'neutral',
      },
      {
        title: 'Protéger la banque',
        label: 'Solde minimum et fonds de roulement restent conservés',
        value: formatEuro(protectedCash),
        iconKey: 'bank',
        tone: 'main',
      },
      {
        title: 'Servir les revenus',
        label: 'Rémunération, CCA et dividendes suivent le parcours associé',
        value: formatEuro(kpis.revenusNetsRetraite),
        iconKey: 'money',
        tone: 'accent',
      },
      {
        title: 'Investir l’excédent',
        label: 'Le surplus est balayé vers les poches de placement',
        value: formatEuro(allocatableBase),
        iconKey: 'chart-up',
        tone: 'muted',
      },
    ],
  };
}

export function buildParametersAnnexSlide(
  inputs: TresoInputsV6,
  projectionStartYear: number,
  horizonYears: number,
): TresorerieParametersAnnexSlideSpec {
  const selectedAssociate = getSelectedAssociate(inputs);
  const profile = getAssociateProfile(inputs, selectedAssociate);
  const companyType =
    inputs.company.creationType === 'existante' ? 'Société existante' : 'Société à créer';
  const ccaInitialTotal = inputs.company.associates.reduce(
    (sum, associate) => sum + positiveAmount(associate.cca?.currentBalance),
    0,
  );
  const loansTotal = inputs.company.loans.reduce(
    (sum, loan) => sum + positiveAmount(loan.principal),
    0,
  );

  return {
    type: 'treso-parameters-annex',
    title: 'Annexe — Paramètres',
    subtitle: 'Détail des hypothèses structurantes utilisées dans les slides de synthèse',
    sections: [
      {
        title: 'Société',
        iconKey: 'buildings',
        rows: [
          { label: 'Type de montage', value: companyType, accent: true },
          {
            label: 'Forme et type',
            value: `${inputs.company.legalForm.toUpperCase()} · ${getCompanyKindLabel(inputs.company)}`,
          },
          {
            label: 'Capital social',
            value: formatEuro(positiveAmount(inputs.company.shareCapital)),
          },
          {
            label: 'Crédits société',
            value:
              inputs.company.loans.length > 0
                ? `${inputs.company.loans.length} prêt(s) · ${formatEuro(loansTotal)}`
                : 'Aucun',
          },
        ],
      },
      {
        title: 'Sécurité de trésorerie',
        iconKey: 'bank',
        rows: [
          {
            label: 'Trésorerie initiale',
            value: formatEuro(positiveAmount(inputs.company.treasuryInitial)),
            accent: true,
          },
          { label: 'Solde bancaire minimum', value: formatEuro(getMinimumBankBalance(inputs)) },
          { label: 'Fonds de roulement', value: formatEuro(getWorkingCapitalRequirement(inputs)) },
          { label: 'CCA initial total', value: formatEuro(ccaInitialTotal) },
          {
            label: 'Horizon de projection',
            value: `${projectionStartYear} → ${projectionStartYear + Math.max(0, horizonYears - 1)}`,
          },
        ],
      },
      {
        title: 'Associé principal',
        iconKey: 'family',
        rows: [
          { label: 'Nom', value: selectedAssociate?.label ?? 'Associé', accent: true },
          {
            label: 'Profil',
            value: selectedAssociate?.kind === 'pm' ? 'Personne morale' : 'Personne physique',
          },
          { label: 'Âge', value: profile.currentAge > 0 ? `${profile.currentAge} ans` : '—' },
          {
            label: 'Capital · Économique',
            value: selectedAssociate
              ? `${fmtPct(getCapitalPct(selectedAssociate))} · ${fmtPct(getEconomicPct(selectedAssociate))}`
              : '—',
          },
          {
            label: 'CCA initial',
            value: formatEuro(positiveAmount(selectedAssociate?.cca?.currentBalance)),
          },
        ],
      },
    ],
  };
}

export const HYPOTHESES_SLIDE: TresorerieHypothesesSlideSpec = {
  type: 'treso-hypotheses',
  title: 'Hypothèses et périmètre',
  subtitle: 'Cadre de lecture de la simulation',
  sections: [
    {
      title: 'Périmètre',
      iconKey: 'checklist',
      items: [
        'Société soumise à l’IS uniquement ; SARL de famille à l’IR hors scope.',
        'Taux fiscaux issus des paramètres admin, sans valeur hardcodée.',
        'Document indicatif, non contractuel.',
      ],
    },
    {
      title: 'Calcul IS',
      iconKey: 'calculator',
      items: [
        'IS calculé sur la base fiscale, sans report de pertes.',
        'Réserve légale dotée selon le taux légal jusqu’au plafond applicable.',
        'PFU dividendes : brut unique sans double comptage.',
        'IS latent capitalisation affiché pour information, non décaissé avant sortie.',
      ],
    },
    {
      title: 'CCA et trésorerie',
      iconKey: 'bank',
      items: [
        'Remboursement CCA hors PFU : baisse du passif, pas des réserves.',
        'Intérêts CCA déductibles dans la limite du taux fiscal maximum.',
        'Solde bancaire minimum et fonds de roulement protégés avant allocation.',
      ],
    },
    {
      title: 'Régimes et dates',
      iconKey: 'buildings',
      items: [
        'Délai de jouissance : premier jour du mois au moins égal à la date de départ.',
        'Régime mère-fille : détention et durée de conservation à vérifier.',
        'Les flux filiales restent conditionnés aux calendriers renseignés.',
      ],
    },
  ],
};
export const ALLOCATION_MATRIX_SLIDE: TresorerieAllocationMatrixSlideSpec = {
  type: 'treso-allocation-matrix',
  title: 'Lecture des poches de placement',
  subtitle: 'Une organisation par horizon pour distinguer liquidité et capital investi',
  horizons: [
    {
      key: 'court',
      label: 'Court terme',
      durationLabel: '0 à 3 ans',
      typicalReturn: '1 à 3 %',
      typicalSupports: ['Compte bancaire', 'Monétaire', 'DAT court'],
      iconKey: 'bank',
    },
    {
      key: 'moyen',
      label: 'Moyen terme',
      durationLabel: '3 à 8 ans',
      typicalReturn: '3 à 5 %',
      typicalSupports: ['Fonds obligataires', 'SCPI', 'Produits structurés prudents'],
      iconKey: 'balance',
    },
    {
      key: 'long',
      label: 'Long terme',
      durationLabel: '8 ans et plus',
      typicalReturn: '5 à 8 %',
      typicalSupports: ['Actions diversifiées', 'Private equity', 'Capitalisation long terme'],
      iconKey: 'chart-up',
    },
  ],
};
