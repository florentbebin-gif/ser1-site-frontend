/**
 * buildTresorerieFlowMechanism.ts — Slide pédagogique flux CCA / trésorerie.
 *
 * Style aligné Placement Synthesis :
 * - 4 nœuds en losange avec ombre,
 * - 5 flèches colorées (chaque flux a sa propre couleur sectorielle),
 * - labels dans des roundRect blancs avec bordure colorée (anti-superposition),
 * - bandeau de synthèse pédagogique en bas.
 */

import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, TresorerieFlowMechanismSlideSpec } from '../theme/types';
import { MASTER_NAMES } from '../template/loadBaseTemplate';
import {
  COORDS_CONTENT,
  SHADOW_PARAMS,
  addFooter,
  addHeader,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { addBusinessIconToSlide, type BusinessIconName } from '../icons/addBusinessIcon';

type NodeSpec = {
  label: string;
  icon: BusinessIconName;
  x: number;
  y: number;
  accent?: boolean;
};

const NODE_W = 2.62;
const NODE_H = 1.18;
const MARGIN_X = COORDS_CONTENT.margin.x;
const CONTENT_W = COORDS_CONTENT.margin.w;
const WHITE = 'FFFFFF';

function drawNode(slide: PptxGenJS.Slide, node: NodeSpec, ctx: ExportContext): void {
  const { theme } = ctx;
  const accent = roleColor(theme, 'accent');
  const panelBorder = roleColor(theme, 'panelBorder');
  const fillColor = node.accent ? accent : WHITE;
  const lineColor = node.accent ? accent : panelBorder;
  const textColor = node.accent ? WHITE : roleColor(theme, 'textMain');

  slide.addShape('roundRect', {
    x: node.x,
    y: node.y,
    w: NODE_W,
    h: NODE_H,
    fill: { color: fillColor },
    line: { color: lineColor, width: node.accent ? 0 : 1 },
    rectRadius: 0.12,
    shadow: {
      type: SHADOW_PARAMS.type,
      angle: SHADOW_PARAMS.angle,
      blur: node.accent ? SHADOW_PARAMS.blur : 14,
      offset: node.accent ? SHADOW_PARAMS.offset : 6,
      opacity: node.accent ? SHADOW_PARAMS.opacity : 0.18,
      color: roleColor(theme, 'shadowBase'),
    },
  });
  addBusinessIconToSlide(slide, node.icon, {
    x: node.x + 0.22,
    y: node.y + 0.36,
    w: 0.50,
    h: 0.50,
  }, theme, node.accent ? 'white' : 'accent');
  addTextFr(slide, node.label, {
    x: node.x + 0.82,
    y: node.y + 0.22,
    w: NODE_W - 0.98,
    h: 0.74,
    fontSize: 11.5,
    bold: true,
    color: textColor,
    valign: 'middle',
  });
}

function drawFlowArrow(
  slide: PptxGenJS.Slide,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: string,
): void {
  const x = Math.min(from.x, to.x);
  const y = Math.min(from.y, to.y);
  const w = Math.abs(to.x - from.x);
  const h = Math.abs(to.y - from.y);
  slide.addShape('line', {
    x,
    y,
    w,
    h,
    flipH: from.x > to.x,
    line: {
      color,
      width: 2.2,
      endArrowType: 'triangle',
    } as PptxGenJS.ShapeLineProps,
  });
}

function drawFlowLabel(
  slide: PptxGenJS.Slide,
  centerX: number,
  centerY: number,
  label: string,
  color: string,
  theme: ExportContext['theme'],
  w: number = 2.30,
): void {
  const h = 0.36;
  slide.addShape('roundRect', {
    x: centerX - w / 2,
    y: centerY - h / 2,
    w,
    h,
    fill: { color: WHITE },
    line: { color, width: 1.2 },
    rectRadius: 0.08,
  });
  addTextFr(slide, label, {
    x: centerX - w / 2,
    y: centerY - h / 2,
    w,
    h,
    fontSize: 9.5,
    bold: true,
    color,
    align: 'center',
    valign: 'middle',
  });
  void theme;
}

export function buildTresorerieFlowMechanism(
  pptx: PptxGenJS,
  spec: TresorerieFlowMechanismSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;
  addHeader(slide, spec.title, spec.subtitle, theme, 'content');

  const accent = roleColor(theme, 'accent');
  const color3 = theme.colors.color3.replace('#', '');
  const color5 = theme.colors.color5.replace('#', '');
  const color8 = theme.colors.color8.replace('#', '');
  const panelBorder = roleColor(theme, 'panelBorder');

  // ── Disposition des 4 nœuds en losange ──────────────────────────────
  const associate: NodeSpec = { label: 'Associé personne physique', icon: 'family', x: 0.78, y: 3.20 };
  const company: NodeSpec = { label: 'Compte bancaire société', icon: 'bank', x: 5.36, y: 2.16, accent: true };
  const pockets: NodeSpec = { label: 'Placements de trésorerie', icon: 'chart-up', x: 9.94, y: 3.20 };
  const subsidiaries: NodeSpec = { label: 'Filiales ou activité', icon: 'buildings', x: 5.36, y: 4.92 };

  [associate, company, pockets, subsidiaries].forEach(node => drawNode(slide, node, ctx));

  // ── Flèches (chaque flux a sa couleur) ───────────────────────────────
  // 1. Associé → Société : apports (color5 = vert moyen)
  drawFlowArrow(slide,
    { x: associate.x + NODE_W, y: associate.y + 0.40 },
    { x: company.x, y: company.y + 0.50 },
    color5,
  );
  // 2. Société → Associé : revenus (accent = vert foncé)
  drawFlowArrow(slide,
    { x: company.x, y: company.y + 0.90 },
    { x: associate.x + NODE_W, y: associate.y + 0.80 },
    accent,
  );
  // 3. Société → Poches : balayage (color8 = vert pâle)
  drawFlowArrow(slide,
    { x: company.x + NODE_W, y: company.y + 0.50 },
    { x: pockets.x, y: pockets.y + 0.40 },
    color8,
  );
  // 4. Poches → Société : retraits (color3 = accent)
  drawFlowArrow(slide,
    { x: pockets.x, y: pockets.y + 0.80 },
    { x: company.x + NODE_W, y: company.y + 0.90 },
    color3,
  );
  // 5. Filiales → Société : dividendes filiales (panelBorder gris)
  drawFlowArrow(slide,
    { x: subsidiaries.x + NODE_W / 2, y: subsidiaries.y },
    { x: company.x + NODE_W / 2, y: company.y + NODE_H },
    panelBorder,
  );

  // ── Labels dans roundRect au milieu de chaque flèche ─────────────────
  // 1. Apports — milieu haut-gauche
  drawFlowLabel(slide,
    (associate.x + NODE_W + company.x) / 2,
    (associate.y + 0.40 + company.y + 0.50) / 2 - 0.30,
    'Apports CCA · Capital',
    color5,
    theme,
    2.30,
  );
  // 2. Rémunération — milieu bas-gauche
  drawFlowLabel(slide,
    (associate.x + NODE_W + company.x) / 2,
    (associate.y + 0.80 + company.y + 0.90) / 2 + 0.34,
    'Rémunération · CCA · Dividendes',
    accent,
    theme,
    2.80,
  );
  // 3. Balayage — milieu haut-droit
  drawFlowLabel(slide,
    (company.x + NODE_W + pockets.x) / 2,
    (company.y + 0.50 + pockets.y + 0.40) / 2 - 0.30,
    'Balayage de l’excédent',
    color8,
    theme,
    2.30,
  );
  // 4. Retraits — milieu bas-droit
  drawFlowLabel(slide,
    (company.x + NODE_W + pockets.x) / 2,
    (company.y + 0.90 + pockets.y + 0.80) / 2 + 0.34,
    'Revenus · Retraits',
    color3,
    theme,
    2.00,
  );
  // 5. Dividendes filiales — milieu vertical
  drawFlowLabel(slide,
    company.x + NODE_W / 2 + 1.30,
    (company.y + NODE_H + subsidiaries.y) / 2,
    'Dividendes filiales · Intérêts CCA',
    panelBorder,
    theme,
    2.80,
  );

  // ── Bandeau de synthèse pédagogique ─────────────────────────────────
  const footerY = 6.12;
  slide.addShape('roundRect', {
    x: MARGIN_X,
    y: footerY,
    w: CONTENT_W,
    h: 0.68,
    fill: { color: theme.colors.color9.replace('#', '') },
    line: { color: panelBorder, width: 0.6 },
    rectRadius: 0.10,
  });
  addTextFr(
    slide,
    'La société conserve un solde bancaire minimum et un fonds de roulement. Au-delà, l’excédent finance le parcours de revenus ou rejoint les poches de placement.',
    {
      x: MARGIN_X + 0.30,
      y: footerY + 0.10,
      w: CONTENT_W - 0.60,
      h: 0.50,
      fontSize: 11,
      color: roleColor(theme, 'textMain'),
      align: 'center',
      valign: 'middle',
    },
  );

  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildTresorerieFlowMechanism;
