/**
 * PPTX Theme Types
 * 
 * Maps UI settings colors to PPTX theme roles
 */

/**
 * UI Theme Colors from ThemeProvider (10 colors)
 */
export type UiThemeColors = {
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
  color6: string;
  color7: string;
  color8: string;
  color9: string;
  color10: string;
};

/**
 * PPTX Theme Roles
 * 
 * Maps semantic roles to actual colors.
 * All colors must come from UiThemeColors except white (#FFFFFF).
 */
export type PptxThemeRoles = {
  // All 10 UI colors preserved
  colors: UiThemeColors;
  
  // Constant white (only hardcoded color allowed)
  white: '#FFFFFF';
  
  // Background main (cover, etc.) -> color1
  bgMain: string;
  
  // Text on main background -> adaptive (white if dark, black if light)
  textOnMain: string;
  
  // Text main (titles on light bg) -> color1
  textMain: string;
  
  // Text body (content) -> color10
  textBody: string;
  
  // Accent color (lines, decorations) -> color6
  accent: string;
  
  // Panel background -> always white
  panelBg: '#FFFFFF';
  
  // Panel border color -> color8 (softer)
  panelBorder: string;
  
  // Shadow base color -> color1
  shadowBase: string;
  
  // Footer text on light background -> color10
  footerOnLight: string;
  
  // Footer accent (end slide) -> color6
  footerAccent: string;
};

/**
 * Export Context for PPTX generation
 */
export type ExportContext = {
  theme: PptxThemeRoles;
  locale: 'fr-FR' | string;
  generatedAt: Date;
  footerDisclaimer?: string;
  showSlideNumbers?: boolean;
  coverLeftMeta?: string;
  coverRightMeta?: string;
};

/**
 * Business Icon Names (from existing library)
 */
export type BusinessIconName = 
  | 'money' 
  | 'cheque' 
  | 'bank' 
  | 'calculator' 
  | 'checklist'
  | 'buildings' 
  | 'gauge' 
  | 'pen' 
  | 'chart-down' 
  | 'chart-up'
  | 'balance' 
  | 'tower'
  | 'percent';

/**
 * Logo Placement options for cover slide
 */
export type LogoPlacement =
  | 'center-bottom'
  | 'center-top'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right';

/**
 * Icon Placement specification
 */
export type IconPlacement = {
  name: BusinessIconName;
  x: number;
  y: number;
  w: number;
  h: number;
  colorRole?: 'accent' | 'textMain' | 'textBody' | 'white';
};

/**
 * Cover Slide Specification
 */
export type CoverSlideSpec = {
  type: 'cover';
  title: string;
  subtitle: string;
  logoUrl?: string;
  logoPlacement?: LogoPlacement;
  leftMeta?: string;
  rightMeta?: string;
};

/**
 * Chapter Slide Specification
 */
export type ChapterSlideSpec = {
  type: 'chapter';
  title: string;
  subtitle: string;
  body?: string;
  chapterImageIndex: number; // 1-9
};

/**
 * Content Slide Specification
 */
export type ContentSlideSpec = {
  type: 'content';
  title: string;
  subtitle: string;
  body?: string;
  icons?: IconPlacement[];
};

/**
 * IR Synthesis Slide Specification (premium KPI layout)
 */
export type IrSynthesisSlideSpec = {
  type: 'ir-synthesis';
  income1: number;
  income2: number;
  isCouple: boolean;
  taxableIncome: number;
  partsNb: number;
  tmiRate: number;
  irNet: number;
  taxablePerPart: number;
  bracketsDetails?: Array<{ label: string; base: number; rate: number; tax: number }>;
  // TMI details (exact values from IR card)
  tmiBaseGlobal?: number;   // Montant des revenus dans cette TMI
  tmiMarginGlobal?: number | null; // Marge avant changement de TMI
};

/**
 * IR Annexe Slide Specification (detailed calculation prose)
 */
export type IrAnnexeSlideSpec = {
  type: 'ir-annexe';
  taxableIncome: number;
  partsNb: number;
  taxablePerPart: number;
  tmiRate: number;
  irNet: number;
  totalTax: number;
  bracketsDetails?: Array<{ label: string; base: number; rate: number; tax: number }>;
  decote?: number;
  qfAdvantage?: number;
  creditsTotal?: number;
  pfuIr?: number; // PFU 12.8% sur revenus du capital
  cehr?: number;
  cdhr?: number;
  psFoncier?: number;
  psDividends?: number;
  psTotal?: number;
  isCouple?: boolean;
  childrenCount?: number;
};

/**
 * Succession Synthesis Slide Specification (P1-02)
 */
export type SuccessionSynthesisSlideSpec = {
  type: 'succession-synthesis';
  actifNetSuccession: number;
  totalDroits: number;
  tauxMoyenGlobal: number;
  heritiers: Array<{
    lien: string;
    partBrute: number;
    abattement: number;
    baseImposable: number;
    droits: number;
    tauxMoyen: number;
  }>;
};

/**
 * End/Legal Slide Specification
 */
export type EndSlideSpec = {
  type: 'end';
  legalText: string;
};

/**
 * Loan Summary for multi-loan PPTX
 */
export type LoanSummary = {
  index: number;  // 1, 2, or 3
  capital: number;
  dureeMois: number;
  tauxNominal: number;
  tauxAssurance: number;
  quotite?: number;  // 0..1, défaut 1 (100%). Quotité assurée
  creditType: 'amortissable' | 'infine';
  assuranceMode: 'CI' | 'CRD';
  mensualiteHorsAssurance: number;
  mensualiteTotale: number;
  coutInterets: number;
  coutAssurance: number;
  amortizationRows?: CreditAmortizationRow[];
};

/**
 * Payment Period for timeline visualization
 */
export type PaymentPeriod = {
  label: string;  // e.g. "À partir de 01/2025"
  mensualitePret1: number;
  mensualitePret2: number;
  mensualitePret3: number;
  total: number;
};

/**
 * Credit Global Synthesis Slide Specification (multi-loan overview)
 */
export type CreditGlobalSynthesisSlideSpec = {
  type: 'credit-global-synthesis';
  totalCapital: number;
  maxDureeMois: number;
  coutTotalInterets: number;
  coutTotalAssurance: number;
  coutTotalCredit: number;
  assuranceDecesByYear?: number[];
  loans: LoanSummary[];
  paymentPeriods: PaymentPeriod[];
  smoothingEnabled: boolean;
  smoothingMode?: 'mensu' | 'duree';
};

/**
 * Credit Loan Synthesis Slide Specification (per-loan detail)
 */
export type CreditLoanSynthesisSlideSpec = {
  type: 'credit-loan-synthesis';
  loanIndex: number;  // 1, 2, or 3
  capitalEmprunte: number;
  dureeMois: number;
  tauxNominal: number;
  tauxAssurance: number;
  mensualiteHorsAssurance: number;
  mensualiteTotale: number;
  coutTotalInterets: number;
  coutTotalAssurance: number;
  coutTotalCredit: number;
  creditType: 'amortissable' | 'infine';
  assuranceMode: 'CI' | 'CRD';
};

/**
 * Credit Synthesis Slide Specification (legacy - single loan)
 * @deprecated Use CreditGlobalSynthesisSlideSpec and CreditLoanSynthesisSlideSpec instead
 */
export type CreditSynthesisSlideSpec = {
  type: 'credit-synthesis';
  capitalEmprunte: number;
  dureeMois: number;
  tauxNominal: number;       // taux annuel %
  tauxAssurance: number;     // taux annuel %
  mensualiteHorsAssurance: number;
  mensualiteTotale: number;
  coutTotalInterets: number;
  coutTotalAssurance: number;
  coutTotalCredit: number;   // intérêts + assurance
  creditType: 'amortissable' | 'infine';
  assuranceMode: 'CI' | 'CRD';
};

/**
 * Credit Annexe Slide Specification (detailed prose - multi-loan support)
 */
export type CreditAnnexeSlideSpec = {
  type: 'credit-annexe';
  // Global totals
  totalCapital: number;
  maxDureeMois: number;
  coutTotalInterets: number;
  coutTotalAssurance: number;
  coutTotalCredit: number;
  totalRembourse: number;
  // Multi-loan data
  loans: LoanSummary[];
  // Smoothing
  smoothingEnabled: boolean;
  smoothingMode?: 'mensu' | 'duree';
  // Legacy single-loan fields (for backward compatibility)
  capitalEmprunte?: number;
  dureeMois?: number;
  tauxNominal?: number;
  tauxAssurance?: number;
  mensualiteHorsAssurance?: number;
  mensualiteTotale?: number;
  creditType?: 'amortissable' | 'infine';
  assuranceMode?: 'CI' | 'CRD';
};

/**
 * Credit Amortization Row (annual aggregation)
 * Supports multi-loan scenarios with loanIndex for grouping
 */
export type CreditAmortizationRow = {
  loanIndex?: number;   // 1, 2, 3 for multi-loan grouping (optional for backward compat)
  periode: string;      // year label e.g. "2026"
  interet: number;
  assurance: number;
  amort: number;
  annuite: number;      // hors assurance
  annuiteTotale: number; // avec assurance
  crd: number;          // CRD fin de période
};

/**
 * Credit Amortization Slide Specification (paginated by YEAR COLUMNS)
 * 
 * Structure: Same row structure on every page, only year columns change
 * - allRows: ALL amortization rows from all loans
 * - yearsForPage: Years to display on THIS page (column headers)
 */
export type CreditAmortizationSlideSpec = {
  type: 'credit-amortization';
  allRows: CreditAmortizationRow[];  // ALL rows from all loans
  yearsForPage: string[];             // Years for THIS page's columns
  pageIndex: number;                  // 0-based page number
  totalPages: number;
  // Legacy field for backward compatibility
  rows?: CreditAmortizationRow[];
};

/**
 * Study Deck Specification (complete presentation)
 */
export type StudyDeckSpec = {
  cover: CoverSlideSpec;
  slides: Array<
    | ChapterSlideSpec 
    | ContentSlideSpec 
    | IrSynthesisSlideSpec 
    | IrAnnexeSlideSpec
    | CreditSynthesisSlideSpec
    | CreditGlobalSynthesisSlideSpec
    | CreditLoanSynthesisSlideSpec
    | CreditAnnexeSlideSpec
    | CreditAmortizationSlideSpec
    | SuccessionSynthesisSlideSpec
  >;
  end: EndSlideSpec;
};
