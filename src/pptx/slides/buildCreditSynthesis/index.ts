import type PptxGenJS from 'pptxgenjs';

import { addHeader, addFooter } from '@/pptx/designSystem/serenity';
import { MASTER_NAMES } from '@/pptx/template/loadBaseTemplate';
import type { ExportContext, PptxThemeRoles } from '@/pptx/theme/types';

import {
  addCreditAssuranceHistory,
  addCreditDateRange,
  addCreditHero,
  addCreditKpis,
  addCreditSplitBar,
} from './sections';
import type { CreditSynthesisData } from './types';

export function buildCreditSynthesis(
  pptx: PptxGenJS,
  data: CreditSynthesisData,
  theme: PptxThemeRoles,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });

  addHeader(
    slide,
    'Synthèse de votre financement',
    'Principaux indicateurs de votre crédit',
    theme,
    'content',
  );

  addCreditKpis(slide, data, theme);
  addCreditDateRange(slide, data, theme);
  addCreditHero(slide, data, theme);
  addCreditSplitBar(slide, data, theme);
  addCreditAssuranceHistory(slide, data, theme);
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildCreditSynthesis;
