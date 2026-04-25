import type PptxGenJS from 'pptxgenjs';
import type { ExportContext, PerFiscalSnapshotSlideSpec, PptxThemeRoles } from '../theme/types';
import {
  RADIUS,
  SLIDE_SIZE,
  addCardPanelWithShadow,
  addFooter,
  addHeader,
  addTextFr,
  roleColor,
} from '../designSystem/serenity';
import { MASTER_NAMES } from '../template/loadBaseTemplate';

const GEO = {
  marginX: 0.92,
  barY: 2.05,
  barH: 0.46,
  markerY: 2.66,
  tableX: 1.55,
  tableY: 3.18,
  tableW: 10.23,
  tableH: 2.62,
} as const;

function euro(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Math.round(value || 0));
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1).replace('.', ',')} %`;
}

function clean(color: string): string {
  return color.replace('#', '');
}

function bracketColor(index: number, theme: PptxThemeRoles): string {
  const palette = [
    theme.colors.color4,
    theme.colors.color8,
    theme.colors.color7,
    theme.colors.color6,
    theme.colors.color5,
  ];
  return clean(palette[Math.min(index, palette.length - 1)] ?? palette[palette.length - 1]);
}

function formatThreshold(value: number | null): string {
  return value == null ? 'Dernière tranche' : `À partir de ${euro(value)}`;
}

function drawTmiScale(
  slide: PptxGenJS.Slide,
  spec: PerFiscalSnapshotSlideSpec,
  theme: PptxThemeRoles,
): void {
  const brackets = spec.brackets.length > 0
    ? spec.brackets
    : [{ label: pct(spec.tmiRate), rate: spec.tmiRate * 100, threshold: spec.activeThreshold }];
  const activeRate = Math.round(spec.tmiRate * 100);
  const barW = SLIDE_SIZE.width - GEO.marginX * 2;
  const segmentW = barW / brackets.length;
  let activeCenterX = GEO.marginX + segmentW / 2;

  brackets.forEach((bracket, index) => {
    const x = GEO.marginX + index * segmentW;
    const isActive = Math.round(bracket.rate) === activeRate;
    const color = bracketColor(index, theme);
    if (isActive) {
      activeCenterX = x + segmentW / 2;
    }

    slide.addShape('roundRect', {
      x,
      y: GEO.barY,
      w: segmentW - 0.03,
      h: GEO.barH,
      rectRadius: RADIUS.panel,
      fill: { color },
      line: {
        color: isActive ? clean(theme.bgMain) : color,
        width: isActive ? 1.7 : 0,
      },
    });

    addTextFr(slide, bracket.label, {
      x,
      y: GEO.barY,
      w: segmentW - 0.03,
      h: GEO.barH,
      fontSize: 12,
      bold: isActive,
      color: isActive ? clean(theme.textOnMain) : clean(theme.textMain),
      align: 'center',
      valign: 'middle',
    });
  });

  const markerW = 1.58;
  const markerX = Math.max(GEO.marginX, Math.min(SLIDE_SIZE.width - GEO.marginX - markerW, activeCenterX - markerW / 2));
  slide.addShape('roundRect', {
    x: markerX,
    y: GEO.markerY,
    w: markerW,
    h: 0.32,
    rectRadius: RADIUS.panel,
    fill: { color: clean(theme.bgMain) },
    line: { color: clean(theme.bgMain), width: 0 },
  });
  addTextFr(slide, formatThreshold(spec.activeThreshold), {
    x: markerX,
    y: GEO.markerY + 0.02,
    w: markerW,
    h: 0.24,
    fontSize: 9,
    color: clean(theme.textOnMain),
    bold: true,
    align: 'center',
    valign: 'middle',
  });
}

function drawFiscalTable(
  slide: PptxGenJS.Slide,
  spec: PerFiscalSnapshotSlideSpec,
  theme: PptxThemeRoles,
): void {
  addCardPanelWithShadow(slide, { x: GEO.tableX, y: GEO.tableY, w: GEO.tableW, h: GEO.tableH }, theme);

  const rows = [
    { label: 'Revenu imposable du foyer', value: euro(spec.revenuImposableFoyer) },
    { label: 'Nombre de parts', value: spec.partsNb.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) },
    { label: 'TMI', value: pct(spec.tmiRate) },
    { label: 'Marge restante dans la TMI', value: euro(spec.montantDansLaTMI) },
    { label: 'Estimation de votre IR', value: euro(spec.irEstime), strong: true },
  ];

  const rowH = GEO.tableH / rows.length;
  rows.forEach((row, index) => {
    const y = GEO.tableY + index * rowH;
    if (row.strong) {
      slide.addShape('rect', {
        x: GEO.tableX + 0.05,
        y: y + 0.03,
        w: GEO.tableW - 0.10,
        h: rowH - 0.06,
        fill: { color: clean(theme.accent), transparency: 82 },
        line: { color: clean(theme.accent), transparency: 100 },
      });
    } else if (index > 0) {
      slide.addShape('line', {
        x: GEO.tableX + 0.45,
        y,
        w: GEO.tableW - 0.90,
        h: 0,
        line: { color: roleColor(theme, 'panelBorder'), width: 0.5 },
      });
    }

    addTextFr(slide, row.label, {
      x: GEO.tableX + 0.55,
      y: y + 0.08,
      w: 5.9,
      h: rowH - 0.08,
      fontSize: row.strong ? 12 : 11,
      color: roleColor(theme, 'textBody'),
      bold: !!row.strong,
      align: 'left',
      valign: 'middle',
    });
    addTextFr(slide, row.value, {
      x: GEO.tableX + 6.65,
      y: y + 0.08,
      w: 3.0,
      h: rowH - 0.08,
      fontSize: row.strong ? 14 : 12,
      color: roleColor(theme, 'textMain'),
      bold: true,
      align: 'right',
      valign: 'middle',
    });
  });
}

export function buildPerFiscalSnapshot(
  pptx: PptxGenJS,
  spec: PerFiscalSnapshotSlideSpec,
  ctx: ExportContext,
  slideIndex: number,
): void {
  const slide = pptx.addSlide({ masterName: MASTER_NAMES.CONTENT });
  const { theme } = ctx;

  addHeader(slide, spec.title, spec.subtitle, theme, 'content');
  drawTmiScale(slide, spec, theme);
  drawFiscalTable(slide, spec, theme);
  addFooter(slide, ctx, slideIndex, 'onLight');
}

export default buildPerFiscalSnapshot;
