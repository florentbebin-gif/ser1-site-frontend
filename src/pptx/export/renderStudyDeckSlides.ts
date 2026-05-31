import type PptxGenJS from 'pptxgenjs';
import type {
  ChapterSlideSpec,
  ContentSlideSpec,
  CreditAmortizationSlideSpec,
  CreditAnnexeSlideSpec,
  CreditGlobalSynthesisSlideSpec,
  CreditLoanSynthesisSlideSpec,
  CreditSynthesisSlideSpec,
  ExportContext,
  IrAnnexeSlideSpec,
  IrSynthesisSlideSpec,
  PerFiscalSnapshotSlideSpec,
  PerPlafond3ColSlideSpec,
  PerProjectionTableSlideSpec,
  PerTransfertAuditContractSlideSpec,
  PerTransfertSynthesisSlideSpec,
  PlacementDetailSlideSpec,
  PlacementHypothesesSlideSpec,
  PlacementProjectionSlideSpec,
  PlacementSynthesisSlideSpec,
  PrevoyanceContractsTableSlideSpec,
  PrevoyanceRoChartSlideSpec,
  StudyDeckSpec,
  SuccessionAnnexTableSlideSpec,
  SuccessionAssetAnnexSlideSpec,
  SuccessionChronologySlideSpec,
  SuccessionFamilyContextSlideSpec,
  SuccessionHypothesesSlideSpec,
  SuccessionSynthesisSlideSpec,
  TresorerieAllocationCardsSlideSpec,
  TresorerieAllocationMatrixSlideSpec,
  TresorerieFlowMechanismSlideSpec,
  TresorerieHypothesesSlideSpec,
  TresorerieParametersAnnexSlideSpec,
  TresorerieProjectionSlideSpec,
  TresorerieSchemaSlideSpec,
  TresorerieSynthesisSlideSpec,
  TresorerieTimelineSlideSpec,
} from '../theme/types';
import { buildCover, buildChapter, buildContent, buildEnd } from '../slides';
import { buildIrSynthesis } from '../slides/buildIrSynthesis';
import { buildIrAnnexe } from '../slides/buildIrAnnexe';
import { buildCreditSynthesis } from '../slides/buildCreditSynthesis';
import { buildCreditGlobalSynthesis } from '../slides/buildCreditGlobalSynthesis';
import { buildCreditLoanSynthesis } from '../slides/buildCreditLoanSynthesis';
import { buildCreditAnnexe } from '../slides/buildCreditAnnexe';
import { buildCreditAmortization } from '../slides/buildCreditAmortization';
import { buildSuccessionSynthesis } from '../slides/buildSuccessionSynthesis';
import { buildSuccessionFamilyContext } from '../slides/buildSuccessionFamilyContext';
import { buildSuccessionChronology } from '../slides/buildSuccessionChronology';
import { buildSuccessionAnnexTable } from '../slides/buildSuccessionAnnexTable';
import { buildSuccessionAssetAnnex } from '../slides/buildSuccessionAssetAnnex';
import { buildSuccessionHypotheses } from '../slides/buildSuccessionHypotheses';
import { buildPlacementSynthesis } from '../slides/buildPlacementSynthesis';
import { buildPlacementDetail } from '../slides/buildPlacementDetail';
import { buildPlacementHypotheses } from '../slides/buildPlacementHypotheses';
import { buildPlacementProjection } from '../slides/buildPlacementProjection';
import { buildPerFiscalSnapshot } from '../slides/buildPerFiscalSnapshot';
import { buildPerPlafond3Col } from '../slides/buildPerPlafond3Col';
import { buildPerProjectionTable } from '../slides/buildPerProjectionTable';
import { buildAuditContractSlide } from '../slides/buildAuditContractSlide';
import { buildPerTransfertSynthesis } from '../slides/buildPerTransfertSynthesis';
import {
  buildPrevoyanceContractsTable,
  buildPrevoyanceRoChart,
} from '../slides/buildPrevoyanceSlides';
import { buildTresorerieSchema } from '../slides/buildTresorerieSchema';
import { buildTresorerieTimeline } from '../slides/buildTresorerieTimeline';
import { buildTresorerieFlowMechanism } from '../slides/buildTresorerieFlowMechanism';
import { buildTresorerieSynthesis } from '../slides/buildTresorerieSynthesis';
import { buildTresorerieAllocationMatrix } from '../slides/buildTresorerieAllocationMatrix';
import { buildTresorerieAllocationCards } from '../slides/buildTresorerieAllocationCards';
import { buildTresorerieHypotheses } from '../slides/buildTresorerieHypotheses';
import { buildTresorerieParametersAnnex } from '../slides/buildTresorerieParametersAnnex';
import { buildTresorerieProjection } from '../slides/buildTresorerieProjection';

const FALLBACK_CHAPTER_IMAGE_DATA_URI =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

interface RenderStudyDeckSlidesInput {
  pptx: PptxGenJS;
  spec: StudyDeckSpec;
  ctx: ExportContext;
  logoDataUri?: string;
  chapterImages: Map<number, string>;
}

export function renderStudyDeckSlides({
  pptx,
  spec,
  ctx,
  logoDataUri,
  chapterImages,
}: RenderStudyDeckSlidesInput): void {
  let slideIndex = 1;

  buildCover(pptx, spec.cover, ctx, logoDataUri);
  slideIndex++;

  for (const slideSpec of spec.slides) {
    if (slideSpec.type === 'chapter') {
      const chapterSpec = slideSpec as ChapterSlideSpec;
      const imageDataUri =
        chapterImages.get(chapterSpec.chapterImageIndex) ?? FALLBACK_CHAPTER_IMAGE_DATA_URI;

      if (!chapterImages.has(chapterSpec.chapterImageIndex)) {
        console.warn(`[PPTX Export] Missing chapter image ${chapterSpec.chapterImageIndex}`);
      }

      buildChapter(pptx, chapterSpec, ctx, imageDataUri, slideIndex);
    } else if (slideSpec.type === 'content') {
      buildContent(pptx, slideSpec as ContentSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'ir-synthesis') {
      const synthesisSpec = slideSpec as IrSynthesisSlideSpec;
      buildIrSynthesis(
        pptx,
        {
          income1: synthesisSpec.income1,
          income2: synthesisSpec.income2,
          isCouple: synthesisSpec.isCouple,
          taxableIncome: synthesisSpec.taxableIncome,
          partsNb: synthesisSpec.partsNb,
          tmiRate: synthesisSpec.tmiRate,
          irNet: synthesisSpec.irNet,
          taxablePerPart: synthesisSpec.taxablePerPart,
          bracketsDetails: synthesisSpec.bracketsDetails,
          irScale: synthesisSpec.irScale,
          tmiBaseGlobal: synthesisSpec.tmiBaseGlobal,
          tmiMarginGlobal: synthesisSpec.tmiMarginGlobal,
        },
        ctx.theme,
        ctx,
        slideIndex,
      );
    } else if (slideSpec.type === 'ir-annexe') {
      const annexeSpec = slideSpec as IrAnnexeSlideSpec;
      buildIrAnnexe(
        pptx,
        {
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
          pfuIr: annexeSpec.pfuIr,
          pfuRateIR: annexeSpec.pfuRateIR,
          cehr: annexeSpec.cehr,
          cdhr: annexeSpec.cdhr,
          psFoncier: annexeSpec.psFoncier,
          psDividends: annexeSpec.psDividends,
          psTotal: annexeSpec.psTotal,
          isCouple: annexeSpec.isCouple,
          childrenCount: annexeSpec.childrenCount,
        },
        ctx.theme,
        ctx,
        slideIndex,
      );
    } else if (slideSpec.type === 'credit-synthesis') {
      const creditSynthSpec = slideSpec as CreditSynthesisSlideSpec;
      buildCreditSynthesis(
        pptx,
        {
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
          startYM: creditSynthSpec.startYM,
          assuranceDecesByYear: creditSynthSpec.assuranceDecesByYear,
        },
        ctx.theme,
        ctx,
        slideIndex,
      );
    } else if (slideSpec.type === 'credit-global-synthesis') {
      buildCreditGlobalSynthesis(
        pptx,
        slideSpec as CreditGlobalSynthesisSlideSpec,
        ctx.theme,
        ctx,
        slideIndex,
      );
    } else if (slideSpec.type === 'credit-loan-synthesis') {
      buildCreditLoanSynthesis(
        pptx,
        slideSpec as CreditLoanSynthesisSlideSpec,
        ctx.theme,
        ctx,
        slideIndex,
      );
    } else if (slideSpec.type === 'credit-annexe') {
      buildCreditAnnexe(pptx, slideSpec as CreditAnnexeSlideSpec, ctx.theme, ctx, slideIndex);
    } else if (slideSpec.type === 'credit-amortization') {
      const amortSpec = slideSpec as CreditAmortizationSlideSpec;
      buildCreditAmortization(
        pptx,
        {
          allRows: amortSpec.allRows,
          yearsForPage: amortSpec.yearsForPage,
          pageIndex: amortSpec.pageIndex,
          totalPages: amortSpec.totalPages,
        },
        ctx.theme,
        ctx,
        slideIndex,
      );
    } else if (slideSpec.type === 'succession-family-context') {
      buildSuccessionFamilyContext(
        pptx,
        slideSpec as SuccessionFamilyContextSlideSpec,
        ctx,
        slideIndex,
      );
    } else if (slideSpec.type === 'succession-synthesis') {
      buildSuccessionSynthesis(pptx, slideSpec as SuccessionSynthesisSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'succession-chronology') {
      buildSuccessionChronology(pptx, slideSpec as SuccessionChronologySlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'succession-annex-table') {
      buildSuccessionAnnexTable(pptx, slideSpec as SuccessionAnnexTableSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'succession-annex-assets') {
      buildSuccessionAssetAnnex(pptx, slideSpec as SuccessionAssetAnnexSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'succession-hypotheses') {
      buildSuccessionHypotheses(pptx, slideSpec as SuccessionHypothesesSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'placement-synthesis') {
      buildPlacementSynthesis(pptx, slideSpec as PlacementSynthesisSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'placement-detail') {
      buildPlacementDetail(pptx, slideSpec as PlacementDetailSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'placement-hypotheses') {
      buildPlacementHypotheses(pptx, slideSpec as PlacementHypothesesSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'placement-projection') {
      buildPlacementProjection(pptx, slideSpec as PlacementProjectionSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'per-fiscal-snapshot') {
      buildPerFiscalSnapshot(pptx, slideSpec as PerFiscalSnapshotSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'per-plafond-3col') {
      buildPerPlafond3Col(pptx, slideSpec as PerPlafond3ColSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'per-projection-table') {
      buildPerProjectionTable(pptx, slideSpec as PerProjectionTableSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'per-transfert-synthesis') {
      buildPerTransfertSynthesis(
        pptx,
        slideSpec as PerTransfertSynthesisSlideSpec,
        ctx,
        slideIndex,
      );
    } else if (slideSpec.type === 'per-transfert-audit-contract') {
      buildAuditContractSlide(
        pptx,
        slideSpec as PerTransfertAuditContractSlideSpec,
        ctx,
        slideIndex,
      );
    } else if (slideSpec.type === 'prevoyance-ro-chart') {
      buildPrevoyanceRoChart(pptx, slideSpec as PrevoyanceRoChartSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'prevoyance-contracts-table') {
      buildPrevoyanceContractsTable(
        pptx,
        slideSpec as PrevoyanceContractsTableSlideSpec,
        ctx,
        slideIndex,
      );
    } else if (slideSpec.type === 'treso-schema') {
      buildTresorerieSchema(pptx, slideSpec as TresorerieSchemaSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'treso-timeline') {
      buildTresorerieTimeline(pptx, slideSpec as TresorerieTimelineSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'treso-flow-mechanism') {
      buildTresorerieFlowMechanism(
        pptx,
        slideSpec as TresorerieFlowMechanismSlideSpec,
        ctx,
        slideIndex,
      );
    } else if (slideSpec.type === 'treso-synthesis') {
      buildTresorerieSynthesis(pptx, slideSpec as TresorerieSynthesisSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'treso-allocation-matrix') {
      buildTresorerieAllocationMatrix(
        pptx,
        slideSpec as TresorerieAllocationMatrixSlideSpec,
        ctx,
        slideIndex,
      );
    } else if (slideSpec.type === 'treso-allocation-cards') {
      buildTresorerieAllocationCards(
        pptx,
        slideSpec as TresorerieAllocationCardsSlideSpec,
        ctx,
        slideIndex,
      );
    } else if (slideSpec.type === 'treso-parameters-annex') {
      buildTresorerieParametersAnnex(
        pptx,
        slideSpec as TresorerieParametersAnnexSlideSpec,
        ctx,
        slideIndex,
      );
    } else if (slideSpec.type === 'treso-hypotheses') {
      buildTresorerieHypotheses(pptx, slideSpec as TresorerieHypothesesSlideSpec, ctx, slideIndex);
    } else if (slideSpec.type === 'treso-projection') {
      buildTresorerieProjection(pptx, slideSpec as TresorerieProjectionSlideSpec, ctx, slideIndex);
    }

    slideIndex++;
  }

  buildEnd(pptx, spec.end, ctx, slideIndex);
}
