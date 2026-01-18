/**
 * Credit Deck Builder
 * 
 * Generates a StudyDeckSpec for Credit simulation results using the Serenity template.
 * Follows the same pattern as IR deck builder.
 * 
 * Structure:
 * 1. Cover - "NOM Prénom" as subtitle
 * 2. Chapter "Votre projet de financement"
 * 3. Credit Synthesis - Premium KPI visual slide
 * 4. Chapter "Annexes"
 * 5. Credit Annexe - Detailed prose explanation
 * 6+ Credit Amortization - Paginated yearly tables
 * N. End - Legal mentions
 */

import type { 
  StudyDeckSpec, 
  ChapterSlideSpec, 
  CreditSynthesisSlideSpec, 
  CreditAnnexeSlideSpec,
  CreditAmortizationSlideSpec,
  CreditAmortizationRow,
} from '../theme/types';

export const DEBUG_PPTX = false;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Credit Simulation Data (matches Credit.jsx state)
 */
export interface CreditData {
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
  
  // Amortization schedule (annual aggregation)
  amortizationRows: CreditAmortizationRow[];
  
  // Client info
  clientName?: string;
}

/**
 * UI Settings (ThemeProvider format)
 */
export interface UiSettingsForPptx {
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
  c6: string;
  c7: string;
  c8: string;
  c9: string;
  c10: string;
}

/**
 * Advisor info (optional)
 */
export interface AdvisorInfo {
  name?: string;
  title?: string;
  office?: string;
}

// ============================================================================
// PAGINATION HELPER
// ============================================================================

const MAX_YEARS_PER_SLIDE = 8;

function paginateAmortizationRows(
  rows: CreditAmortizationRow[]
): CreditAmortizationRow[][] {
  const pages: CreditAmortizationRow[][] = [];
  for (let i = 0; i < rows.length; i += MAX_YEARS_PER_SLIDE) {
    pages.push(rows.slice(i, i + MAX_YEARS_PER_SLIDE));
  }
  return pages;
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Build Credit Study Deck Specification
 * 
 * @param creditData - Credit simulation results
 * @param uiSettings - Theme colors from ThemeProvider
 * @param logoUrl - Optional logo URL from Supabase Storage
 * @param advisor - Optional advisor information
 */
export function buildCreditStudyDeck(
  creditData: CreditData,
  uiSettings: UiSettingsForPptx,
  logoUrl?: string,
  advisor?: AdvisorInfo
): StudyDeckSpec {
  if (DEBUG_PPTX) {
    console.log('[PPTX Credit] Building deck with:');
    console.log('  Theme colors:', {
      bgMain: uiSettings.c1,
      accent: uiSettings.c6,
      textBody: uiSettings.c10,
    });
    console.log('  Credit Data:', {
      capitalEmprunte: creditData.capitalEmprunte,
      dureeMois: creditData.dureeMois,
      coutTotalCredit: creditData.coutTotalCredit,
    });
    console.log('  Logo URL:', logoUrl || '(none)');
  }
  
  // Format date
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  
  // Client name for subtitle
  const clientSubtitle = creditData.clientName || 'NOM Prénom';
  
  // Advisor meta
  const advisorMeta = advisor?.name || 'NOM Prénom';
  
  // Total remboursé
  const totalRembourse = creditData.capitalEmprunte + creditData.coutTotalCredit;
  
  // Paginate amortization rows
  const amortizationPages = paginateAmortizationRows(creditData.amortizationRows);
  const totalAmortizationPages = amortizationPages.length;
  
  // Build slides array
  const slides: Array<
    | ChapterSlideSpec 
    | CreditSynthesisSlideSpec 
    | CreditAnnexeSlideSpec 
    | CreditAmortizationSlideSpec
  > = [
    // Chapter 1: Votre projet de financement
    {
      type: 'chapter',
      title: 'Votre projet de financement',
      subtitle: 'Analyse détaillée de votre crédit immobilier',
      chapterImageIndex: 1,
    },
    
    // Slide 3: Credit Synthesis (premium visual)
    {
      type: 'credit-synthesis',
      capitalEmprunte: creditData.capitalEmprunte,
      dureeMois: creditData.dureeMois,
      tauxNominal: creditData.tauxNominal,
      tauxAssurance: creditData.tauxAssurance,
      mensualiteHorsAssurance: creditData.mensualiteHorsAssurance,
      mensualiteTotale: creditData.mensualiteTotale,
      coutTotalInterets: creditData.coutTotalInterets,
      coutTotalAssurance: creditData.coutTotalAssurance,
      coutTotalCredit: creditData.coutTotalCredit,
      creditType: creditData.creditType,
      assuranceMode: creditData.assuranceMode,
    },
    
    // Chapter 2: Annexes
    {
      type: 'chapter',
      title: 'Annexes',
      subtitle: 'Détail du calcul et tableau d\'amortissement',
      chapterImageIndex: 3,
    },
    
    // Slide 5: Credit Annexe (prose explanation)
    {
      type: 'credit-annexe',
      capitalEmprunte: creditData.capitalEmprunte,
      dureeMois: creditData.dureeMois,
      tauxNominal: creditData.tauxNominal,
      tauxAssurance: creditData.tauxAssurance,
      mensualiteHorsAssurance: creditData.mensualiteHorsAssurance,
      mensualiteTotale: creditData.mensualiteTotale,
      coutTotalInterets: creditData.coutTotalInterets,
      coutTotalAssurance: creditData.coutTotalAssurance,
      coutTotalCredit: creditData.coutTotalCredit,
      creditType: creditData.creditType,
      assuranceMode: creditData.assuranceMode,
      totalRembourse,
    },
    
    // Slides 6+: Amortization tables (paginated)
    ...amortizationPages.map((pageRows, pageIndex): CreditAmortizationSlideSpec => ({
      type: 'credit-amortization',
      rows: pageRows,
      pageIndex,
      totalPages: totalAmortizationPages,
    })),
  ];
  
  // Build complete deck spec
  const spec: StudyDeckSpec = {
    cover: {
      type: 'cover',
      title: 'Simulation Crédit Immobilier',
      subtitle: clientSubtitle,
      logoUrl,
      leftMeta: dateStr,
      rightMeta: advisorMeta,
    },
    slides,
    end: {
      type: 'end',
      legalText: `Document établi à titre strictement indicatif et dépourvu de valeur contractuelle. Il a été élaboré sur la base des dispositions légales et réglementaires en vigueur à la date de sa remise, lesquelles sont susceptibles d'évoluer.

Les informations qu'il contient sont strictement confidentielles et destinées exclusivement aux personnes expressément autorisées.

Cette simulation ne constitue pas une offre de prêt. Les conditions réelles dépendront de l'établissement prêteur et de votre profil emprunteur. Les frais annexes (dossier, garantie, notaire) ne sont pas inclus.

Toute reproduction, représentation, diffusion ou rediffusion, totale ou partielle, sur quelque support ou par quelque procédé que ce soit, ainsi que toute vente, revente, retransmission ou mise à disposition de tiers, est strictement encadrée.`,
    },
  };
  
  if (DEBUG_PPTX) {
    console.log('[PPTX Credit] Deck spec built:', {
      coverTitle: spec.cover.title,
      coverSubtitle: spec.cover.subtitle,
      slidesCount: spec.slides.length,
      slideTypes: spec.slides.map(s => s.type),
      amortizationPages: totalAmortizationPages,
    });
  }
  
  return spec;
}

export default buildCreditStudyDeck;
