/**
 * Succession Hypotheses Slide Builder
 *
 * Grille compacte d'hypothèses actives, 1 ou 2 colonnes selon le nombre d'items.
 */

import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, SuccessionHypothesesSlideSpec } from '../theme/types';
import {
  addCardPanelWithShadow,
  addFooter,
  addHeader,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

const GEO = {
  gridX: 0.92,
  gridY: 2.42,
  gridW: 11.50,
  cardH: 0.62,
  gap: 0.20,
} as const;

export function buildSuccessionHypotheses(
  pptx: PptxGenJS,
  spec: SuccessionHypothesesSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;
  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const items = spec.items.slice(0, 10);
  const columns = items.length > 6 ? 2 : 1;
  const cardW = columns === 2 ? (GEO.gridW - GEO.gap) / 2 : GEO.gridW;

  items.forEach((item, index) => {
    const col = columns === 2 ? index % 2 : 0;
    const row = columns === 2 ? Math.floor(index / 2) : index;
    const x = GEO.gridX + col * (cardW + GEO.gap);
    const y = GEO.gridY + row * (GEO.cardH + 0.14);
    addCardPanelWithShadow(slide, { x, y, w: cardW, h: GEO.cardH }, theme);
    addTextFr(slide, item, {
      x: x + 0.24,
      y: y + 0.12,
      w: cardW - 0.48,
      h: GEO.cardH - 0.22,
      fontSize: 8.5,
      color: roleColor(theme, 'textBody'),
      valign: 'middle',
    });
  });

  if (spec.items.length > items.length) {
    addTextFr(slide, `+ ${spec.items.length - items.length} hypothèse(s) complémentaire(s) dans le dossier.`, {
      x: GEO.gridX,
      y: 6.55,
      w: GEO.gridW,
      h: 0.24,
      fontSize: 8.5,
      color: roleColor(theme, 'textBody'),
      italic: true,
      align: 'center',
    });
  }

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildSuccessionHypotheses;
