/**
 * tresoreriePptxWrapper.ts — Assemblage deck PPTX Trésorerie Société IS
 *
 * Structure : Couverture → Contexte → Timeline → Pédagogie → Allocation → Annexe comptable → Hypothèses → Fin
 *
 * Règle GOUVERNANCE_EXPORTS.md :
 * - Aucun recalcul métier ici — on consomme TresoProjectionRow[] tel quel.
 * - Seuls les calculs dérivés de présentation (formatage, pagination) sont autorisés.
 * - Aucun vocabulaire source interdit dans les slides client.
 */

import type { BusinessIconName } from '@/icons/business/businessIconLibrary';
import type {
  LogoPlacement,
  StudyDeckSpec,
  TresorerieAllocationCardsSlideSpec,
  TresorerieAllocationMatrixSlideSpec,
  TresorerieHypothesesSlideSpec,
  TresorerieSchemaSlideSpec,
  TresorerieSynthesisSlideSpec,
  TresorerieTimelineSlideSpec,
} from '@/pptx/theme/types';
import type {
  AllocationPocketHorizon,
  AllocationPocketInput,
  RuntimeAssociateInput,
  TresoAssociateRevenueSource,
  TresoInputsRuntime,
  TresoProjectionRow,
} from '@/engine/tresorerie/types';
import { paginateTresoYears } from '@/pptx/slides/buildTresorerieProjection';
import type { TresoKPIs } from '../hooks/useTresorerieCalculations';
import {
  getAllocationHorizonLabel,
  getAssociateProfile,
  getCapitalPct,
  getCompanyKindLabel,
  getEconomicPct,
  getSelectedAssociate,
} from '../utils/tresorerieSocieteModel';
import {
  getPhaseEndYear,
  isRevenuePhaseV6,
  type RevenuePhaseInput,
  sortPhases,
} from '../utils/revenuePhases';
import { getRevenuePhaseSourceLabel } from '../utils/revenuePhaseLabels';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const PROJECTION_PAGE_SIZE = 8;

function fmtPct(n: number): string {
  return `${Math.round(n * 100) / 100} %`;
}

function formatEuro(n: number): string {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function positiveAmount(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, value ?? 0) : 0;
}

function getAssociateRevenuePhases(associate: RuntimeAssociateInput | undefined): RevenuePhaseInput[] {
  const phases = (associate as { revenuePhases?: RevenuePhaseInput[] } | undefined)?.revenuePhases;
  return Array.isArray(phases) ? sortPhases(phases) : [];
}

function getMinimumBankBalance(inputs: TresoInputsRuntime): number {
  return positiveAmount(inputs.allocationMatrix.minimumBankBalance ?? inputs.allocationMatrix.sweepThreshold);
}

function getWorkingCapitalRequirement(inputs: TresoInputsRuntime): number {
  return positiveAmount(inputs.company.incomeStatement?.workingCapitalRequirement);
}

function getProtectedCash(inputs: TresoInputsRuntime): number {
  return getMinimumBankBalance(inputs) + getWorkingCapitalRequirement(inputs);
}

function getCivilYear(inputs: TresoInputsRuntime, row: TresoProjectionRow): number {
  const associate = getSelectedAssociate(inputs);
  const profile = getAssociateProfile(inputs, associate);
  return profile.projectionStartYear + row.year - 1;
}

function getBankEnd(row: TresoProjectionRow): number {
  return row.tresorerieBanqueFin ?? row.tresorerieFin;
}

function getAvailableTreasury(row: TresoProjectionRow, protectedCash: number): number {
  return row.tresorerieDisponible ?? Math.max(0, getBankEnd(row) - protectedCash);
}

function buildProjectionRows(
  rows: TresoProjectionRow[],
  inputs: TresoInputsRuntime,
) {
  const protectedCash = getProtectedCash(inputs);
  return [
    { label: "Compte bancaire en début d'année", values: rows.map(row => row.tresorerieBanqueDebut ?? row.tresorerieDebut) },
    { label: 'Solde protégé sur compte bancaire', values: rows.map(row => row.soldeMinimumCompteBancaire ?? getMinimumBankBalance(inputs)) },
    { label: 'Besoin en fonds de roulement protégé', values: rows.map(row => row.bfr ?? getWorkingCapitalRequirement(inputs)) },
    { label: 'Liquidité disponible sur compte bancaire', values: rows.map(row => getAvailableTreasury(row, protectedCash)) },
    { label: 'Versements vers les poches de placement', values: rows.map(row => row.montantBalayeAnnuel ?? 0) },
    { label: 'Capital investi — poche distribution', values: rows.map(row => row.capitalDistrib) },
    { label: 'Valeur investie — poche capitalisation', values: rows.map(row => row.valeurCapi) },
    { label: 'Revenus des filiales', values: rows.map(row => row.dividendesFiliales) },
    { label: 'Charges sociales TNS estimées', values: rows.map(row =>
      row.revenusParAssocie.reduce((sum, revenu) => sum + revenu.tnsSocialCharges, 0),
    ) },
    { label: 'Impôt sur les sociétés', values: rows.map(row => row.is) },
    { label: 'Résultat net comptable', values: rows.map(row => row.resultatNetComptable) },
    { label: 'Total revenus nets associés', values: rows.map(row => row.revenusNets) },
    { label: 'Écart annuel avec le besoin de revenus', values: rows.map(row => row.deltaBesoin) },
    { label: "Compte bancaire en fin d'année", values: rows.map(row => getBankEnd(row)) },
    { label: "Trésorerie consolidée en fin d'année", values: rows.map(row => getBankEnd(row) + row.capitalDistrib + row.valeurCapi) },
  ];
}

export function getTresoReadiness(inputs: TresoInputsRuntime): {
  hasCompanyConfigured: boolean;
  hasAssociateWithAge: boolean;
  isReady: boolean;
} {
  const associate = getSelectedAssociate(inputs);
  const profile = getAssociateProfile(inputs, associate);
  const hasCompanyConfigured = Boolean(inputs.company.legalForm && inputs.company.associates.length > 0);
  const hasAssociateWithAge = Boolean(associate && profile.currentAge > 0);
  return {
    hasCompanyConfigured,
    hasAssociateWithAge,
    isReady: hasCompanyConfigured && hasAssociateWithAge,
  };
}

function phaseLabel(phase: RevenuePhaseInput): string {
  if (isRevenuePhaseV6(phase)) return phase.label?.trim() || `Palier ${phase.startYear}-${phase.endYear}`;
  return phase.label?.trim() || getRevenuePhaseSourceLabel(phase.source);
}

function mapRevenueSource(source: TresoAssociateRevenueSource): {
  kind: TresorerieTimelineSlideSpec['segments'][number]['sources'][number]['kind'];
  label: string;
  iconKey: BusinessIconName;
} | null {
  if (source === 'remuneration') {
    return { kind: 'remuneration', label: 'Rémunération nette', iconKey: 'money' };
  }
  if (source === 'cca') {
    return { kind: 'cca-repayment', label: 'Remboursement CCA', iconKey: 'bank' };
  }
  if (source === 'cca_interets') {
    return { kind: 'cca-interest', label: 'Intérêts CCA', iconKey: 'percent' };
  }
  if (source === 'dividendes') {
    return { kind: 'dividends', label: 'Dividendes nets', iconKey: 'chart-up' };
  }
  return null;
}

function buildTimelineSegments(
  rows: TresoProjectionRow[],
  inputs: TresoInputsRuntime,
  associate: RuntimeAssociateInput | undefined,
): TresorerieTimelineSlideSpec['segments'] {
  const phases = getAssociateRevenuePhases(associate);
  const profile = getAssociateProfile(inputs, associate);
  const horizonYear = profile.projectionStartYear + Math.max(rows.length - 1, 0);

  return phases.map(phase => {
    const startYear = phase.startYear;
    const endYear = Math.min(getPhaseEndYear(phase, phases, horizonYear), horizonYear);
    const rowsInPhase = rows.filter(row => {
      const civilYear = getCivilYear(inputs, row);
      return civilYear >= startYear && civilYear <= endYear;
    });
    const sums = new Map<string, {
      kind: TresorerieTimelineSlideSpec['segments'][number]['sources'][number]['kind'];
      label: string;
      iconKey: BusinessIconName;
      sum: number;
    }>();

    rowsInPhase.forEach(row => {
      row.revenusParAssocie
        .filter(revenu => !associate || revenu.associateId === associate.id)
        .forEach(revenu => {
          const mapped = mapRevenueSource(revenu.source);
          if (!mapped) return;
          const existing = sums.get(mapped.kind) ?? { ...mapped, sum: 0 };
          existing.sum += positiveAmount(revenu.netRevenue);
          sums.set(mapped.kind, existing);
        });
    });

    const duration = Math.max(1, rowsInPhase.length || endYear - startYear + 1);
    const sources = Array.from(sums.values())
      .map(source => ({
        kind: source.kind,
        label: source.label,
        annualNetAmount: source.sum / duration,
        iconKey: source.iconKey,
      }))
      .filter(source => source.annualNetAmount > 0);

    return {
      startYear,
      endYear,
      label: phaseLabel(phase),
      sources,
    };
  }).filter(segment => segment.endYear >= segment.startYear && segment.sources.length > 0);
}

function buildAssociateHighlights(
  inputs: TresoInputsRuntime,
): TresorerieSchemaSlideSpec['associateHighlights'] {
  const selectedAssociate = getSelectedAssociate(inputs);
  const associates = [
    ...(selectedAssociate ? [selectedAssociate] : []),
    ...inputs.company.associates.filter(associate => associate.id !== selectedAssociate?.id),
  ].slice(0, 2);

  return associates.map(associate => {
    const profile = getAssociateProfile(inputs, associate);
    return {
      label: associate.label,
      kind: associate.kind ?? 'pp',
      ageLabel: profile.currentAge > 0 ? `${profile.currentAge} ans` : undefined,
      capitalPct: fmtPct(getCapitalPct(associate)),
      economicRightsPct: fmtPct(getEconomicPct(associate)),
      ccaInitial: positiveAmount(associate.cca?.currentBalance),
    };
  });
}

function horizonIcon(horizon: AllocationPocketHorizon | undefined): BusinessIconName {
  if (horizon === 'court_terme') return 'bank';
  if (horizon === 'long_terme') return 'chart-up';
  return 'balance';
}

function buildAllocationCards(
  inputs: TresoInputsRuntime,
): TresorerieAllocationCardsSlideSpec | null {
  const pockets = inputs.allocationMatrix.pockets;
  if (pockets.length === 0) return null;

  const protectedCash = getProtectedCash(inputs);
  const treasuryInitial = positiveAmount(inputs.company.treasuryInitial);
  const allocatableBase = Math.max(0, treasuryInitial - protectedCash);
  const cardForPocket = (pocket: AllocationPocketInput, index: number) => ({
    pocketId: pocket.id,
    label: pocket.label?.trim() || `Poche ${index + 1}`,
    iconKey: horizonIcon(pocket.horizon),
    horizonLabel: getAllocationHorizonLabel(pocket.horizon),
    initialAmount: allocatableBase * positiveAmount(pocket.initialAllocationPct) / 100,
    initialAllocationPct: positiveAmount(pocket.initialAllocationPct),
    annualAllocationPct: positiveAmount(pocket.annualAllocationPct),
    durationYears: positiveAmount(pocket.durationYears),
    annualReturnRate: positiveAmount(pocket.annualReturnRate),
  });

  return {
    type: 'treso-allocation-cards',
    title: 'Organisation de la trésorerie',
    subtitle: 'Liquidité conservée, BFR protégé et poches investies',
    treasuryInitial,
    protectedCash,
    allocatableBase,
    cards: pockets.slice(0, 5).map(cardForPocket),
  };
}

function getConsolidatedTreasuryEnd(rows: TresoProjectionRow[]): number {
  const lastRow = rows[rows.length - 1];
  if (!lastRow) return 0;
  return getBankEnd(lastRow) + lastRow.capitalDistrib + lastRow.valeurCapi;
}

function buildSynthesisSlide(
  rows: TresoProjectionRow[],
  kpis: TresoKPIs,
  rangeEndYear: number,
): TresorerieSynthesisSlideSpec {
  const consolidatedEnd = getConsolidatedTreasuryEnd(rows);
  return {
    type: 'treso-synthesis',
    title: 'Synthèse avant annexe',
    subtitle: 'Les points de repère à retenir avant la projection comptable',
    kpis: [
      { label: 'CCA total constitué', value: formatEuro(kpis.ccaTotalConstitue), iconKey: 'bank' },
      { label: 'IS décaissé', value: formatEuro(kpis.isTotalDecaisse), iconKey: 'calculator' },
      { label: 'Revenus nets retraite', value: formatEuro(kpis.revenusNetsRetraite), iconKey: 'money' },
      { label: 'Trésorerie consolidée', value: formatEuro(consolidatedEnd), iconKey: 'chart-up' },
    ],
    hero: {
      label: 'Trésorerie consolidée fin horizon',
      value: formatEuro(consolidatedEnd),
      caption: `Compte bancaire + poches investies au ${rangeEndYear}`,
    },
  };
}

const HYPOTHESES_SLIDE: TresorerieHypothesesSlideSpec = {
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

const ALLOCATION_MATRIX_SLIDE: TresorerieAllocationMatrixSlideSpec = {
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

// ─── Construction du StudyDeckSpec ────────────────────────────────────────────

export interface TresorerieDeckData {
  rows: TresoProjectionRow[];
  kpis: TresoKPIs;
  inputs: TresoInputsRuntime;
  clientName?: string;
}

export function buildTresorerieStudyDeck(
  data: TresorerieDeckData,
  logoUrl?: string,
  logoPlacement?: LogoPlacement,
): StudyDeckSpec {
  const { rows, kpis, inputs } = data;

  const selectedAssociate = getSelectedAssociate(inputs);
  const profile = getAssociateProfile(inputs, selectedAssociate);
  const readiness = getTresoReadiness(inputs);
  const dateStr = new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  const typeLabel = inputs.company.creationType === 'existante'
    ? 'Société existante'
    : 'Société à créer';
  const projectionStartYear = profile.projectionStartYear;
  const horizonYears = rows.length;
  const rangeEndYear = projectionStartYear + Math.max(0, horizonYears - 1);
  const timelineSegments = buildTimelineSegments(rows, inputs, selectedAssociate);
  const allocationCards = buildAllocationCards(inputs);

  // ── Projection paginée ──────────────────────────────────────────────────────
  const totalYears = rows.length;
  const pages = totalYears > 0 ? paginateTresoYears(totalYears, PROJECTION_PAGE_SIZE) : [];

  const projectionRows = buildProjectionRows(rows, inputs);
  const projectionSlides = pages.map((yearsForPage, pageIdx) => {
    const firstCivilYear = projectionStartYear + yearsForPage[0] - 1;
    const lastYearIndex = yearsForPage[yearsForPage.length - 1] ?? yearsForPage[0];
    const lastCivilYear = projectionStartYear + lastYearIndex - 1;
    return {
      type: 'treso-projection' as const,
      title: 'Annexe — Projection comptable',
      subtitle: `Lecture annuelle ${firstCivilYear}-${lastCivilYear} · banque, investissements et consolidation`,
      yearsForPage,
      projectionStartYear,
      rows: projectionRows,
      pageIndex: pageIdx,
      totalPages: pages.length,
      retraiteYearIndex: kpis.anneeRetraiteIndex != null ? kpis.anneeRetraiteIndex + 1 : undefined,
    };
  });

  const slides: StudyDeckSpec['slides'] = [
    {
      type: 'treso-schema',
      title: 'Contexte société et associé',
      subtitle: 'Organigramme, détentions et paramètres structurants',
      typeCreation: inputs.company.creationType,
      orgchartCompany: inputs.company,
      essentials: {
        legalForm: inputs.company.legalForm,
        companyKindLabel: getCompanyKindLabel(inputs.company),
        capitalSocial: positiveAmount(inputs.company.shareCapital),
        treasuryInitial: positiveAmount(inputs.company.treasuryInitial),
        minimumBankBalance: getMinimumBankBalance(inputs),
        workingCapitalRequirement: getWorkingCapitalRequirement(inputs),
        ccaInitialTotal: inputs.company.associates.reduce(
          (sum, associate) => sum + positiveAmount(associate.cca?.currentBalance),
          0,
        ),
        loansCount: inputs.company.loans.length,
        loansTotalPrincipal: inputs.company.loans.reduce((sum, loan) => sum + positiveAmount(loan.principal), 0),
        projectionStartYear,
        horizonYears,
      },
      associateHighlights: buildAssociateHighlights(inputs),
    },
    {
      type: 'treso-timeline',
      title: 'Parcours de revenus de l’associé',
      subtitle: readiness.isReady
        ? `${selectedAssociate?.label ?? 'Associé'} · revenus nets affichés par période`
        : 'À compléter après paramétrage de l’associé',
      rangeStartYear: projectionStartYear,
      rangeEndYear,
      associateLabel: selectedAssociate?.label ?? 'Associé',
      totalNetSum: rows.reduce((sum, row) => sum + row.revenusParAssocie
        .filter(revenu => !selectedAssociate || revenu.associateId === selectedAssociate.id)
        .reduce((innerSum, revenu) => innerSum + positiveAmount(revenu.netRevenue), 0), 0),
      retirementYear: profile.currentAge > 0 && profile.retirementAge > profile.currentAge
        ? profile.projectionStartYear + (profile.retirementAge - profile.currentAge)
        : undefined,
      tailSegment: (() => {
        if (timelineSegments.length === 0) return undefined;
        const lastEnd = Math.max(...timelineSegments.map(s => s.endYear));
        if (lastEnd >= rangeEndYear) return undefined;
        return {
          startYear: lastEnd + 1,
          endYear: rangeEndYear,
          label: 'Capital placé · trésorerie capitalisée',
        };
      })(),
      segments: timelineSegments,
    },
    {
      type: 'treso-flow-mechanism',
      title: 'Mécanisme des flux',
      subtitle: 'Du compte bancaire société vers les revenus et les poches investies',
    },
    ALLOCATION_MATRIX_SLIDE,
    ...(allocationCards ? [allocationCards] : []),
    buildSynthesisSlide(rows, kpis, rangeEndYear),
    ...projectionSlides,
    HYPOTHESES_SLIDE,
  ];

  return {
    cover: {
      type: 'cover',
      title: 'Trésorerie société',
      subtitle: `Simulation IS — ${typeLabel} · ${dateStr}`,
      logoUrl,
      logoPlacement,
    },
    slides,
    end: {
      type: 'end',
      legalText:
        'Document non contractuel établi en fonction des dispositions fiscales ou sociales en vigueur à la date des présentes. ' +
        'Les projections présentées sont indicatives et ne constituent pas un conseil en investissement ou fiscal.',
    },
  };
}
