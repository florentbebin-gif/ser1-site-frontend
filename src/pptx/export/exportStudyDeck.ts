/**
 * Study Deck Export Orchestrator
 * 
 * Main entry point for exporting PPTX presentations using the Serenity design system.
 * Frontend-only (browser), no Node backend required.
 */

import PptxGenJS from 'pptxgenjs';
import type { 
  StudyDeckSpec, 
  ExportContext, 
  ChapterSlideSpec, 
  ContentSlideSpec,
  IrSynthesisSlideSpec,
  IrAnnexeSlideSpec,
  CreditSynthesisSlideSpec,
  CreditGlobalSynthesisSlideSpec,
  CreditLoanSynthesisSlideSpec,
  CreditAnnexeSlideSpec,
  CreditAmortizationSlideSpec
} from '../theme/types';
import { SLIDE_SIZE } from '../designSystem/serenity';
import { getPptxThemeFromUiSettings } from '../theme/getPptxThemeFromUiSettings';
import { loadLogoDataUriSafe } from '../logo/loadLogoDataUri';
import { fetchChapterImageDataUri } from '../assets/resolvePublicAsset';
import { buildCover, buildChapter, buildContent, buildEnd } from '../slides';
import { buildIrSynthesis } from '../slides/buildIrSynthesis';
import { buildIrAnnexe } from '../slides/buildIrAnnexe';
import { buildCreditSynthesis } from '../slides/buildCreditSynthesis';
import { buildCreditGlobalSynthesis } from '../slides/buildCreditGlobalSynthesis';
import { buildCreditLoanSynthesis } from '../slides/buildCreditLoanSynthesis';
import { buildCreditAnnexe } from '../slides/buildCreditAnnexe';
import { buildCreditAmortization } from '../slides/buildCreditAmortization';
import { injectThemeColors } from '../theme/themeBuilder';
import { defineSlideMasters } from '../template/loadBaseTemplate';

/**
 * Default footer disclaimer (verbatim as specified)
 */
const DEFAULT_DISCLAIMER = 
  "Document non contractuel établi en fonction des dispositions fiscales ou sociales en vigueur à la date des présentes";

/**
 * UI Settings shape (matches ThemeProvider format)
 */
interface UiSettingsInput {
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
 * Export options
 */
interface ExportOptions {
  locale?: 'fr-FR' | string;
  footerDisclaimer?: string;
  showSlideNumbers?: boolean;
  coverLeftMeta?: string;
  coverRightMeta?: string;
}

/**
 * Pre-load all required assets for the deck
 */
async function preloadAssets(
  spec: StudyDeckSpec
): Promise<{
  logoDataUri?: string;
  chapterImages: Map<number, string>;
}> {
  const chapterImages = new Map<number, string>();
  
  // Load logo if specified
  const logoDataUri = spec.cover.logoUrl 
    ? await loadLogoDataUriSafe(spec.cover.logoUrl)
    : undefined;
  
  // Collect unique chapter image indices
  const chapterIndices = new Set<number>();
  for (const slide of spec.slides) {
    if (slide.type === 'chapter') {
      chapterIndices.add(slide.chapterImageIndex);
    }
  }
  
  // Load chapter images in parallel
  const loadPromises = Array.from(chapterIndices).map(async (index) => {
    try {
      const dataUri = await fetchChapterImageDataUri(index);
      chapterImages.set(index, dataUri);
    } catch (error) {
      console.error(`[PPTX Export] Failed to load chapter image ${index}:`, error);
    }
  });
  
  await Promise.all(loadPromises);
  
  return { logoDataUri, chapterImages };
}

/**
 * Export a study deck to PPTX
 * 
 * @param spec - Study deck specification
 * @param uiSettings - UI theme settings (ThemeProvider format: c1..c10)
 * @param options - Export options
 * @returns Promise resolving to Blob (for browser download)
 */
export async function exportStudyDeck(
  spec: StudyDeckSpec,
  uiSettings: UiSettingsInput,
  options: ExportOptions = {}
): Promise<Blob> {
  // 1. Build theme from UI settings
  const theme = getPptxThemeFromUiSettings(uiSettings);
  
  // 2. Build export context
  const ctx: ExportContext = {
    theme,
    locale: options.locale || 'fr-FR',
    generatedAt: new Date(),
    footerDisclaimer: options.footerDisclaimer || DEFAULT_DISCLAIMER,
    showSlideNumbers: options.showSlideNumbers !== false,
    coverLeftMeta: options.coverLeftMeta,
    coverRightMeta: options.coverRightMeta,
  };
  
  // 3. Pre-load assets
  const { logoDataUri, chapterImages } = await preloadAssets(spec);
  
  // 4. Create presentation
  const pptx = new PptxGenJS();
  pptx.layout = SLIDE_SIZE.layout;
  pptx.title = spec.cover.title;
  pptx.author = 'SER1 - Serenity';
  pptx.company = 'Cabinet CGP';
  
  // 4b. Define theme colors so user can use them in PowerPoint
  // This adds all 10 colors to the PPTX theme palette
  pptx.defineLayout({
    name: 'SER1_WIDE',
    width: 13.3333,
    height: 7.5,
  });
  
  // Define slide masters (COVER, CHAPTER, CONTENT, END)
  // Masters provide backgrounds; builders add dynamic content
  defineSlideMasters(pptx, theme);
  
  // Set theme fonts
  try {
    pptx.theme = {
      headFontFace: 'Arial',
      bodyFontFace: 'Arial',
    };
  } catch (e) {
    // Theme definition is optional, continue if not supported
    console.warn('[PPTX Export] Theme colors not fully supported:', e);
  }
  
  // 5. Build slides
  let slideIndex = 1;
  
  // Cover slide (no slide number in footer typically, but we track index)
  buildCover(pptx, spec.cover, ctx, logoDataUri);
  slideIndex++;
  
  // Content/Chapter slides
  for (const slideSpec of spec.slides) {
    if (slideSpec.type === 'chapter') {
      const chapterSpec = slideSpec as ChapterSlideSpec;
      const imageDataUri = chapterImages.get(chapterSpec.chapterImageIndex);
      
      if (!imageDataUri) {
        console.warn(`[PPTX Export] Missing chapter image ${chapterSpec.chapterImageIndex}`);
        // Skip slide or use fallback
        continue;
      }
      
      buildChapter(pptx, chapterSpec, ctx, imageDataUri, slideIndex);
    } else if (slideSpec.type === 'content') {
      buildContent(pptx, slideSpec as ContentSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'ir-synthesis') {
      // Premium IR Synthesis slide (4 KPI + TMI bar + tax result)
      const synthesisSpec = slideSpec as IrSynthesisSlideSpec;
      buildIrSynthesis(pptx, {
        income1: synthesisSpec.income1,
        income2: synthesisSpec.income2,
        isCouple: synthesisSpec.isCouple,
        taxableIncome: synthesisSpec.taxableIncome,
        partsNb: synthesisSpec.partsNb,
        tmiRate: synthesisSpec.tmiRate,
        irNet: synthesisSpec.irNet,
        taxablePerPart: synthesisSpec.taxablePerPart,
        bracketsDetails: synthesisSpec.bracketsDetails,
        // TMI details (MUST use same source as UI - no recalculation)
        tmiBaseGlobal: synthesisSpec.tmiBaseGlobal,
        tmiMarginGlobal: synthesisSpec.tmiMarginGlobal,
      }, ctx.theme, ctx, slideIndex);
    } else if (slideSpec.type === 'ir-annexe') {
      // IR Annexe slide (detailed calculation prose)
      const annexeSpec = slideSpec as IrAnnexeSlideSpec;
      buildIrAnnexe(pptx, {
        taxableIncome: annexeSpec.taxableIncome,
        partsNb: annexeSpec.partsNb,
        taxablePerPart: annexeSpec.taxablePerPart,
        tmiRate: annexeSpec.tmiRate,
        irNet: annexeSpec.irNet,
        totalTax: annexeSpec.totalTax,
        bracketsDetails: annexeSpec.bracketsDetails,
        decote: annexeSpec.decote,
        qfAdvantage: annexeSpec.qfAdvantage,
        creditsTotal: annexeSpec.creditsTotal,
        // PFU 12.8% (MUST use same source as UI)
        pfuIr: annexeSpec.pfuIr,
        cehr: annexeSpec.cehr,
        cdhr: annexeSpec.cdhr,
        psFoncier: annexeSpec.psFoncier,
        psDividends: annexeSpec.psDividends,
        psTotal: annexeSpec.psTotal,
        isCouple: annexeSpec.isCouple,
        childrenCount: annexeSpec.childrenCount,
      }, ctx.theme, ctx, slideIndex);
    } else if (slideSpec.type === 'credit-synthesis') {
      // Credit Synthesis slide (premium visual - single loan)
      const creditSynthSpec = slideSpec as CreditSynthesisSlideSpec;
      buildCreditSynthesis(pptx, {
        capitalEmprunte: creditSynthSpec.capitalEmprunte,
        dureeMois: creditSynthSpec.dureeMois,
        tauxNominal: creditSynthSpec.tauxNominal,
        tauxAssurance: creditSynthSpec.tauxAssurance,
        mensualiteHorsAssurance: creditSynthSpec.mensualiteHorsAssurance,
        mensualiteTotale: creditSynthSpec.mensualiteTotale,
        coutTotalInterets: creditSynthSpec.coutTotalInterets,
        coutTotalAssurance: creditSynthSpec.coutTotalAssurance,
        coutTotalCredit: creditSynthSpec.coutTotalCredit,
        creditType: creditSynthSpec.creditType,
        assuranceMode: creditSynthSpec.assuranceMode,
      }, ctx.theme, ctx, slideIndex);
    } else if (slideSpec.type === 'credit-global-synthesis') {
      // Credit Global Synthesis slide (multi-loan overview)
      const globalSynthSpec = slideSpec as CreditGlobalSynthesisSlideSpec;
      buildCreditGlobalSynthesis(pptx, globalSynthSpec, ctx.theme, ctx, slideIndex);
    } else if (slideSpec.type === 'credit-loan-synthesis') {
      // Credit Per-Loan Synthesis slide
      const loanSynthSpec = slideSpec as CreditLoanSynthesisSlideSpec;
      buildCreditLoanSynthesis(pptx, loanSynthSpec, ctx.theme, ctx, slideIndex);
    } else if (slideSpec.type === 'credit-annexe') {
      // Credit Annexe slide (detailed prose - multi-loan aware)
      const creditAnnexeSpec = slideSpec as CreditAnnexeSlideSpec;
      buildCreditAnnexe(pptx, creditAnnexeSpec, ctx.theme, ctx, slideIndex);
    } else if (slideSpec.type === 'credit-amortization') {
      // Credit Amortization slide (paginated by YEAR COLUMNS)
      const amortSpec = slideSpec as CreditAmortizationSlideSpec;
      buildCreditAmortization(pptx, {
        allRows: amortSpec.allRows,
        yearsForPage: amortSpec.yearsForPage,
        pageIndex: amortSpec.pageIndex,
        totalPages: amortSpec.totalPages,
      }, ctx.theme, ctx, slideIndex);
    }
    
    slideIndex++;
  }
  
  // End slide
  buildEnd(pptx, spec.end, ctx, slideIndex);
  
  // 6. Write to blob (browser-compatible)
  const rawBlob = await pptx.write({ outputType: 'blob' }) as Blob;
  
  // 7. Inject custom theme colors into the PPTX
  // This patches the ppt/theme/theme1.xml to include our 10 colors
  // so they appear in PowerPoint's theme color palette
  const blob = await injectThemeColors(rawBlob, uiSettings, 'Serenity');
  
  return blob;
}

/**
 * Download a PPTX blob as a file
 * 
 * @param blob - PPTX blob
 * @param filename - Output filename (should end with .pptx)
 */
export function downloadPptx(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.pptx') ? filename : `${filename}.pptx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export and immediately download a study deck
 * 
 * @param spec - Study deck specification
 * @param uiSettings - UI theme settings
 * @param filename - Output filename
 * @param options - Export options
 */
export async function exportAndDownloadStudyDeck(
  spec: StudyDeckSpec,
  uiSettings: UiSettingsInput,
  filename: string,
  options: ExportOptions = {}
): Promise<void> {
  const blob = await exportStudyDeck(spec, uiSettings, options);
  downloadPptx(blob, filename);
}

export default {
  exportStudyDeck,
  downloadPptx,
  exportAndDownloadStudyDeck,
};
