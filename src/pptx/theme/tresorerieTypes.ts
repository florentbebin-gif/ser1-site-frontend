/**
 * Specs PPTX Trésorerie société IS.
 */

import type { AssociateKind, RuntimeCompanyInput } from '@/engine/tresorerie/types';
import type { BusinessIconName } from '@/icons/business/businessIconLibrary';

export type TresorerieSchemaSlideSpec = {
  type: 'treso-schema';
  title: string;
  subtitle: string;
  typeCreation: 'newco' | 'existante';
  orgchartCompany: RuntimeCompanyInput;
  essentials: {
    legalForm: string;
    companyKindLabel: string;
    capitalSocial: number;
    treasuryInitial: number;
    minimumBankBalance: number;
    workingCapitalRequirement: number;
    ccaInitialTotal: number;
    loansCount: number;
    loansTotalPrincipal: number;
    projectionStartYear: number;
    horizonYears: number;
  };
  associateHighlights: Array<{
    label: string;
    kind: AssociateKind;
    ageLabel?: string;
    capitalPct: string;
    economicRightsPct: string;
    ccaInitial: number;
  }>;
};

export type TresorerieTimelineSourceKind =
  | 'remuneration'
  | 'cca-repayment'
  | 'dividends'
  | 'cca-interest';

export type TresorerieTimelineSlideSpec = {
  type: 'treso-timeline';
  title: string;
  subtitle: string;
  rangeStartYear: number;
  rangeEndYear: number;
  associateLabel: string;
  totalNetSum: number;
  /** Année civile de départ à la retraite, pour marqueur vertical sur la frise. */
  retirementYear?: number;
  /** Si renseigné : segment final « Capital placé » entre fin du dernier palier et rangeEndYear. */
  tailSegment?: {
    startYear: number;
    endYear: number;
    label: string;
  };
  segments: Array<{
    startYear: number;
    endYear: number;
    label: string;
    sources: Array<{
      kind: TresorerieTimelineSourceKind;
      label: string;
      annualNetAmount: number;
      iconKey: BusinessIconName;
    }>;
  }>;
};

export type TresorerieFlowMechanismSlideSpec = {
  type: 'treso-flow-mechanism';
  title: string;
  subtitle: string;
  steps: Array<{
    title: string;
    label: string;
    value?: string;
    iconKey: BusinessIconName;
    tone: 'main' | 'accent' | 'muted' | 'neutral';
  }>;
};

export type TresorerieParametersAnnexSlideSpec = {
  type: 'treso-parameters-annex';
  title: string;
  subtitle: string;
  sections: Array<{
    title: string;
    iconKey: BusinessIconName;
    rows: Array<{
      label: string;
      value: string;
      accent?: boolean;
    }>;
  }>;
};

export type TresorerieSynthesisSlideSpec = {
  type: 'treso-synthesis';
  title: string;
  subtitle: string;
  rangeStartYear: number;
  rangeEndYear: number;
  chartLabels: {
    investment: string;
    incomeRelay: string;
  };
  series: Array<{
    year: number;
    investmentValue: number;
    ccaBalance: number;
    dividendRevenue: number;
  }>;
  triggerMarker?: {
    year: number;
    ageLabel: string;
    label: 'Phase de revenu';
    kind: 'cca' | 'dividendes';
  };
  milestones: {
    horizon: {
      year: number;
      ageLabel?: string;
      valueLabel: string;
    };
  };
  cashFlows: {
    annualContributionLabel?: string;
    annualWithdrawalLabel?: string;
    revenueLabel?: string;
  };
  pocketTimeline: Array<{
    label: string;
    horizonLabel: string;
    startYear: number;
    endYear: number;
    amountLabel: string;
    iconKey: BusinessIconName;
    tone: 'main' | 'accent' | 'muted' | 'neutral';
  }>;
};

export type TresorerieAllocationMatrixSlideSpec = {
  type: 'treso-allocation-matrix';
  title: string;
  subtitle: string;
  horizons: Array<{
    key: 'court' | 'moyen' | 'long';
    label: string;
    durationLabel: string;
    typicalReturn: string;
    typicalSupports: string[];
    iconKey: BusinessIconName;
  }>;
};

export type TresorerieAllocationCardsSlideSpec = {
  type: 'treso-allocation-cards';
  title: string;
  subtitle: string;
  treasuryInitial: number;
  protectedCash: number;
  allocatableBase: number;
  cards: Array<{
    pocketId: string;
    label: string;
    iconKey: BusinessIconName;
    horizonLabel: string;
    initialAmount: number;
    initialAllocationPct: number;
    annualAllocationPct: number;
    durationYears: number;
    annualReturnRate: number;
  }>;
};

export type TresorerieHypothesesSlideSpec = {
  type: 'treso-hypotheses';
  title: string;
  subtitle: string;
  sections: Array<{
    title: string;
    iconKey: BusinessIconName;
    items: string[];
  }>;
};

export type TresorerieProjectionSlideSpec = {
  type: 'treso-projection';
  title: string;
  subtitle: string;
  /** Indices 1-based des années de la page (utilisés pour lire row.values). */
  yearsForPage: number[];
  /** Première année civile de la projection (utilisée pour afficher YYYY en en-tête). */
  projectionStartYear: number;
  rows: Array<{ label: string; values: number[] }>;
  pageIndex: number;
  totalPages: number;
  /** Index 1-based de l'année de retraite pour mise en évidence. */
  retraiteYearIndex?: number;
};
