import fs from 'node:fs/promises';
import path from 'node:path';
import type PptxGenJSType from 'pptxgenjs';

type Slide = ReturnType<PptxGenJSType['addSlide']>;

type HexColor = string;

export const STYLE = {
  SLIDE_WIDTH: 10,
  SLIDE_HEIGHT: 5.625,
  MARGIN: 0.75,
  MARGIN_SLIM: 0.5,
  LINE_THIN: 1,
  LINE_MEDIUM: 2,
  LINE_THICK: 3,
  OVERLINE_COVER_PCT: 0.5,
  UNDERLINE_TITLE_PCT: 0.15,
  ACCENT_BAR_OFFSET: 0.15,
  ACCENT_BAR_WIDTH: 3,
  FOOTER_Y: 5.35,
  FOOTER_FONT_SIZE: 8,
  KPI_ICON_SIZE: 0.45,
  KPI_ICON_GAP: 0.1,
  KPI_VALUE_SIZE_ROW: 24,
  KPI_VALUE_SIZE_HERO: 52,
  KPI_LABEL_SIZE: 11,
  KPI_SUBLABEL_SIZE: 9,
  SEGMENTED_BAR_HEIGHT: 0.35,
  SEGMENTED_BAR_LABEL_SIZE: 10,
  RESULT_LINE_VALUE_SIZE: 18,
  RESULT_LINE_LABEL_SIZE: 13,
  GAP_TITLE_CONTENT: 0.4,
  GAP_ELEMENTS: 0.3,
  GAP_CARDS: 0.25,
  PADDING_CARD: 0.2,
} as const;

const DEFAULT_FONT = 'Arial';

export interface TitleWithOverlineOptions {
  title: string;
  subtitle?: string;
  date?: string;
  y?: number;
  lineColor?: HexColor;
  titleColor?: HexColor;
  subtitleColor?: HexColor;
  dateColor?: HexColor;
  lineWidthPct?: number;
  lineWeight?: number;
}

export interface TitleWithUnderlineOptions {
  title: string;
  x?: number;
  y?: number;
  width?: number;
  color?: HexColor;
  underlineColor?: HexColor;
  underlineWidthPct?: number;
  underlineWeight?: number;
  uppercase?: boolean;
}

export interface AccentBarOptions {
  x: number;
  y: number;
  height: number;
  color?: HexColor;
  weight?: number;
}

export interface FooterOptions {
  date: string;
  disclaimer: string;
  pageNumber: number | string;
  color?: HexColor;
  fontSize?: number;
  y?: number;
}

export interface SplitLayoutOptions {
  margin?: number;
  top?: number;
  bottom?: number;
  imagePosition?: 'left' | 'right';
  imagePct?: number;
  contentMargin?: number;
}

export interface SplitLayoutResult {
  image: { x: number; y: number; w: number; h: number };
  content: { x: number; y: number; w: number; h: number };
}

export interface KpiItem {
  label: string;
  value: string;
  sublabel?: string;
  iconDataUri?: string | null;
}

export interface DrawKpiRowOptions {
  x?: number;
  y: number;
  width?: number;
  labelColor?: HexColor;
  valueColor?: HexColor;
  sublabelColor?: HexColor;
  showIcons?: boolean;
  kpis: KpiItem[];
  title?: string;
  titleColor?: HexColor;
}

export interface Segment {
  label: string;
  widthPct: number;
  color?: HexColor;
}

export interface DonutSegment {
  label: string;
  value: number;
  color?: HexColor;
}

export interface DrawSegmentedBarOptions {
  x?: number;
  y: number;
  totalWidth?: number;
  height?: number;
  segments: Segment[];
  activeIndex?: number;
  markerValue?: string;
  subMarkerValue?: string;
  labelColor?: HexColor;
  activeColor?: HexColor;
  colors?: HexColor[];
}

export interface DonutLegendOptions {
  xOffset?: number;
  yOffset?: number;
  itemHeight?: number;
  labelColor?: HexColor;
  valueColor?: HexColor;
  formatter?: (value: number, pct: number) => string;
}

export interface DrawDonutChartOptions {
  x?: number;
  y?: number;
  size?: number;
  innerRadiusPct?: number;
  segments: DonutSegment[];
  legend?: DonutLegendOptions;
  title?: string;
  titleColor?: HexColor;
}

export interface DrawPhaseTimelineOptions {
  x?: number;
  y?: number;
  width?: number;
  ageActuel: number;
  ageFinEpargne: number;
  ageAuDeces: number;
  colors?: {
    epargne?: HexColor;
    liquidation?: HexColor;
    transmission?: HexColor;
    text?: HexColor;
  };
  labels?: {
    epargne?: string;
    liquidation?: string;
    transmission?: string;
    subtitle?: string;
  };
}

export interface DrawResultLineOptions {
  label: string;
  value: string;
  x?: number;
  y: number;
  width?: number;
  labelColor?: HexColor;
  valueColor?: HexColor;
  underlineColor?: HexColor;
}

export interface PedagogicalBlockOptions {
  title: string;
  content: string | string[];
  x: number;
  y: number;
  w: number;
  h: number;
  titleColor?: HexColor;
  contentColor?: HexColor;
  backgroundColor?: HexColor;
}

export function drawTitleWithOverline(slide: Slide, options: TitleWithOverlineOptions): void {
  const {
    title,
    subtitle,
    date,
    y = STYLE.SLIDE_HEIGHT * 0.35,
    lineColor,
    titleColor,
    subtitleColor,
    dateColor,
    lineWidthPct = STYLE.OVERLINE_COVER_PCT,
    lineWeight = STYLE.LINE_MEDIUM,
  } = options;

  const normalizedLineColor = normalizeHexColor(lineColor ?? 'FFFFFF');
  const normalizedTitleColor = normalizeHexColor(titleColor ?? 'FFFFFF');
  const normalizedSubtitleColor = normalizeHexColor(subtitleColor ?? 'CCCCCC');
  const normalizedDateColor = normalizeHexColor(dateColor ?? 'AAAAAA');

  const lineWidth = Math.min(STYLE.SLIDE_WIDTH, STYLE.SLIDE_WIDTH * clampUnit(lineWidthPct));
  const lineX = (STYLE.SLIDE_WIDTH - lineWidth) / 2;
  const titleY = y + 0.2;

  slide.addShape('line', {
    x: lineX,
    y,
    w: lineWidth,
    h: 0,
    line: {
      color: normalizedLineColor,
      width: lineWeight,
    },
  });

  slide.addText(title, {
    x: STYLE.MARGIN,
    y: titleY,
    w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
    h: 0.8,
    align: 'center',
    fontSize: 40,
    bold: false,
    color: normalizedTitleColor,
    fontFace: DEFAULT_FONT,
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: STYLE.MARGIN,
      y: titleY + 0.8,
      w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
      h: 0.6,
      align: 'center',
      fontSize: 22,
      color: normalizedSubtitleColor,
      fontFace: DEFAULT_FONT,
    });
  }

  if (date) {
    slide.addText(date, {
      x: STYLE.MARGIN,
      y: STYLE.SLIDE_HEIGHT * 0.85,
      w: STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
      h: 0.3,
      align: 'center',
      fontSize: 14,
      color: normalizedDateColor,
      fontFace: DEFAULT_FONT,
    });
  }
}

export function drawTitleWithUnderline(slide: Slide, options: TitleWithUnderlineOptions): void {
  const {
    title,
    x = STYLE.MARGIN,
    y = STYLE.MARGIN,
    width = STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
    color = '3D4A47',
    underlineColor,
    underlineWidthPct = STYLE.UNDERLINE_TITLE_PCT,
    underlineWeight = STYLE.LINE_MEDIUM,
    uppercase = true,
  } = options;

  const normalizedColor = normalizeHexColor(color);
  const normalizedUnderlineColor = normalizeHexColor(underlineColor ?? normalizedColor);

  const titleText = uppercase ? title.toUpperCase() : title;

  slide.addText(titleText, {
    x,
    y,
    w: width,
    h: 0.4,
    align: 'left',
    fontSize: 28,
    color: normalizedColor,
    bold: false,
    fontFace: DEFAULT_FONT,
  });

  const underlineWidth = width * clampUnit(underlineWidthPct);

  slide.addShape('line', {
    x,
    y: y + 0.45,
    w: underlineWidth,
    h: 0,
    line: {
      color: normalizedUnderlineColor,
      width: underlineWeight,
    },
  });
}

export function drawAccentBar(slide: Slide, options: AccentBarOptions): void {
  const { x, y, height, color = '3D4A47', weight = STYLE.ACCENT_BAR_WIDTH } = options;
  const normalizedColor = normalizeHexColor(color);

  slide.addShape('line', {
    x,
    y,
    w: 0,
    h: height,
    line: {
      color: normalizedColor,
      width: weight,
    },
  });
}

export function drawFooter(slide: Slide, options: FooterOptions): void {
  const { date, disclaimer, pageNumber, color = '8A8F97', fontSize = STYLE.FOOTER_FONT_SIZE, y = STYLE.FOOTER_Y } = options;
  const normalizedColor = normalizeHexColor(color);
  const contentWidth = STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2;

  slide.addText(date, {
    x: STYLE.MARGIN,
    y,
    w: contentWidth / 3,
    h: 0.25,
    align: 'left',
    fontSize,
    color: normalizedColor,
    fontFace: DEFAULT_FONT,
  });

  slide.addText(disclaimer, {
    x: STYLE.MARGIN + contentWidth / 3,
    y,
    w: contentWidth / 3,
    h: 0.25,
    align: 'center',
    fontSize,
    color: normalizedColor,
    fontFace: DEFAULT_FONT,
  });

  slide.addText(`Page ${pageNumber}`, {
    x: STYLE.MARGIN + (contentWidth * 2) / 3,
    y,
    w: contentWidth / 3,
    h: 0.25,
    align: 'right',
    fontSize,
    color: normalizedColor,
    fontFace: DEFAULT_FONT,
  });
}

export function applySplitLayout(
  slide: Slide,
  imagePath: string,
  options: SplitLayoutOptions = {}
): SplitLayoutResult {
  const {
    margin = STYLE.MARGIN,
    top = STYLE.MARGIN,
    bottom = STYLE.MARGIN,
    imagePosition = 'left',
    imagePct = 45,
    contentMargin = 0.35,
  } = options;

  const usableWidth = STYLE.SLIDE_WIDTH - margin * 2;
  const usableHeight = STYLE.SLIDE_HEIGHT - top - bottom;
  const imageWidth = usableWidth * clampUnit(imagePct / 100);
  const contentWidth = usableWidth - imageWidth - contentMargin;

  const imageX = imagePosition === 'left' ? margin : STYLE.SLIDE_WIDTH - margin - imageWidth;
  const contentX = imagePosition === 'left' ? imageX + imageWidth + contentMargin : margin;

  slide.addImage({
    path: imagePath,
    x: imageX,
    y: top,
    w: imageWidth,
    h: usableHeight,
  });

  return {
    image: { x: imageX, y: top, w: imageWidth, h: usableHeight },
    content: { x: contentX, y: top, w: contentWidth, h: usableHeight },
  };
}

export function drawKpiRow(slide: Slide, options: DrawKpiRowOptions): void {
  const {
    x = STYLE.MARGIN,
    y,
    width = STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
    labelColor = '6B7280',
    valueColor = '1F2933',
    sublabelColor = '9CA3AF',
    showIcons = true,
    kpis,
    title,
    titleColor = '3D4A47',
  } = options;

  if (!kpis.length) return;

  let currentY = y;

  if (title) {
    slide.addText(title, {
      x,
      y: currentY,
      w: width,
      h: 0.3,
      align: 'left',
      fontSize: 14,
      bold: true,
      color: normalizeHexColor(titleColor),
    });
    currentY += 0.4;
  }

  const columnWidth = width / kpis.length;

  kpis.forEach((kpi, idx) => {
    const columnX = x + idx * columnWidth;
    let itemY = currentY;

    if (showIcons && kpi.iconDataUri) {
      slide.addImage({
        data: kpi.iconDataUri,
        x: columnX + (columnWidth - STYLE.KPI_ICON_SIZE) / 2,
        y: currentY,
        w: STYLE.KPI_ICON_SIZE,
        h: STYLE.KPI_ICON_SIZE,
      });
      currentY += STYLE.KPI_ICON_SIZE + STYLE.KPI_ICON_GAP;
    }

    slide.addText(kpi.label, {
      x: columnX,
      y: currentY,
      w: columnWidth,
      h: 0.3,
      align: 'center',
      fontSize: STYLE.KPI_LABEL_SIZE,
      color: normalizeHexColor(labelColor),
      fontFace: DEFAULT_FONT,
    });

    currentY += 0.35;

    slide.addText(kpi.value, {
      x: columnX,
      y: currentY,
      w: columnWidth,
      h: 0.5,
      align: 'center',
      fontSize: STYLE.KPI_VALUE_SIZE_ROW,
      color: normalizeHexColor(valueColor),
      bold: true,
      fontFace: DEFAULT_FONT,
    });

    currentY += 0.55;

    if (kpi.sublabel) {
      slide.addText(kpi.sublabel, {
        x: columnX,
        y: currentY,
        w: columnWidth,
        h: 0.3,
        align: 'center',
        fontSize: STYLE.KPI_SUBLABEL_SIZE,
        color: normalizeHexColor(sublabelColor),
        fontFace: DEFAULT_FONT,
      });
    }
  });
}

export function drawSegmentedBar(slide: Slide, options: DrawSegmentedBarOptions): void {
  const {
    x = STYLE.MARGIN,
    y,
    totalWidth = STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
    height = STYLE.SEGMENTED_BAR_HEIGHT,
    segments,
    activeIndex,
    markerValue,
    subMarkerValue,
    labelColor = '6B7280',
    activeColor = '1F2933',
    colors,
  } = options;

  if (!segments.length) return;

  const palette = (colors?.length ? colors : ['E8ECEE', 'D2DBD5', 'B5C7BC', '88AB95', '4A6A59']).map((hex) =>
    normalizeHexColor(hex)
  );
  const totalRatio =
    segments.reduce((sum, segment) => sum + Math.max(Number(segment.widthPct) || 0, 0), 0) || segments.length;

  let cursor = x;

  segments.forEach((segment, index) => {
    const ratio = Math.max(Number(segment.widthPct) || 0, 0) / totalRatio;
    const width = totalWidth * (ratio || 0);
    const fillColor = normalizeHexColor(segment.color ?? palette[index % palette.length]);

    slide.addShape('rect', {
      x: cursor,
      y,
      w: width,
      h: height,
      fill: { color: fillColor },
      line: { color: 'FFFFFF', width: STYLE.LINE_THIN },
    });

    slide.addText(segment.label, {
      x: cursor,
      y: y + height + 0.05,
      w: width,
      h: 0.3,
      align: 'center',
      fontSize: STYLE.SEGMENTED_BAR_LABEL_SIZE,
      color: normalizeHexColor(labelColor),
      fontFace: DEFAULT_FONT,
    });

    if (typeof activeIndex === 'number' && activeIndex === index && markerValue) {
      slide.addText(markerValue, {
        x: cursor,
        y: y - 0.35,
        w: width,
        h: 0.3,
        align: 'center',
        fontSize: 12,
        color: normalizeHexColor(activeColor),
        bold: true,
        fontFace: DEFAULT_FONT,
      });
      slide.addShape('line', {
        x: cursor + width / 2,
        y: y - 0.05,
        w: 0,
        h: 0.2,
        line: { color: normalizeHexColor(activeColor), width: STYLE.LINE_THIN },
      });

      if (subMarkerValue) {
        slide.addText(subMarkerValue, {
          x: cursor,
          y: y - 0.12,
          w: width,
          h: 0.25,
          align: 'center',
          fontSize: 10,
          color: normalizeHexColor(activeColor),
          fontFace: DEFAULT_FONT,
        });
      }
    }

    cursor += width;
  });
}

export function drawDonutChart(slide: Slide, options: DrawDonutChartOptions): void {
  const {
    x = STYLE.MARGIN,
    y = STYLE.MARGIN,
    size = 3.2,
    innerRadiusPct = 0.55,
    segments,
    legend,
    title,
    titleColor = '1F2933',
  } = options;

  if (!segments.length) {
    return;
  }

  const total = segments.reduce((sum, seg) => sum + Math.max(seg.value, 0), 0);
  const colors = segments.map((seg, idx) =>
    `#${normalizeHexColor(seg.color ?? ['3D4A47', '88938A', 'C5D2C5', 'E9E4D4'][idx % 4])}`
  );

  const chartData = [
    {
      name: 'Répartition',
      labels: segments.map((seg) => seg.label),
      values: segments.map((seg) => Math.max(seg.value, 0)),
    },
  ];

  slide.addChart('pie', chartData, {
    x,
    y: title ? y + 0.35 : y,
    w: size,
    h: size,
    showLegend: false,
    chartColors: colors,
    dataLabelPosition: 'inEnd',
    dataLabelColor: 'FFFFFF',
    dataLabelFontSize: 10,
    dataLabelFormatCode: '0%',
  });

  const innerSize = size * clampUnit(innerRadiusPct);
  slide.addShape('ellipse', {
    x: x + (size - innerSize) / 2,
    y: (title ? y + 0.35 : y) + (size - innerSize) / 2,
    w: innerSize,
    h: innerSize,
    fill: { color: 'FFFFFF' },
    line: { color: 'FFFFFF' },
  });

  if (title) {
    slide.addText(title, {
      x,
      y,
      w: size,
      h: 0.3,
      align: 'center',
      fontSize: 14,
      color: normalizeHexColor(titleColor),
      bold: true,
      fontFace: DEFAULT_FONT,
    });
  }

  const legendOptions: DonutLegendOptions = {
    xOffset: size + 0.4,
    yOffset: title ? 0.35 : 0,
    itemHeight: 0.4,
    labelColor: '4A4E57',
    valueColor: '1F2933',
    formatter: (value, pct) => `${value.toLocaleString('fr-FR')} € • ${(pct * 100).toFixed(1)} %`,
    ...legend,
  };

  const formatter =
    legendOptions.formatter ??
    ((value, pct) => `${value.toLocaleString('fr-FR')} € • ${(pct * 100).toFixed(1)} %`);

  const legendX = x + legendOptions.xOffset!;
  let legendY = (title ? y + 0.35 : y) + legendOptions.yOffset!;

  segments.forEach((segment, index) => {
    const pct = total > 0 ? Math.max(segment.value, 0) / total : 0;
    const color = normalizeHexColor(segment.color ?? colors[index].replace('#', ''));

    slide.addShape('rect', {
      x: legendX,
      y: legendY,
      w: 0.25,
      h: 0.25,
      fill: { color },
      line: { color, width: STYLE.LINE_THIN },
    });

    slide.addText(segment.label, {
      x: legendX + 0.35,
      y: legendY - 0.02,
      w: 2.5,
      h: 0.25,
      fontSize: 11,
      color: normalizeHexColor(legendOptions.labelColor ?? '4A4E57'),
      fontFace: DEFAULT_FONT,
    });

    slide.addText(formatter(segment.value, pct), {
      x: legendX + 0.35,
      y: legendY + 0.2,
      w: 2.5,
      h: 0.25,
      fontSize: 10,
      color: normalizeHexColor(legendOptions.valueColor ?? '1F2933'),
      fontFace: DEFAULT_FONT,
    });

    legendY += legendOptions.itemHeight!;
  });
}

export function drawPhaseTimeline(slide: Slide, options: DrawPhaseTimelineOptions): void {
  const {
    x = STYLE.MARGIN,
    y = STYLE.MARGIN + 0.5,
    width = STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
    ageActuel,
    ageFinEpargne,
    ageAuDeces,
    colors = {
      epargne: '4A6A59',
      liquidation: 'A5B9A8',
      transmission: 'D3DED3',
      text: '1F2933',
    },
    labels = {
      epargne: 'ÉPARGNE',
      liquidation: 'LIQUIDATION',
      transmission: 'TRANSMISSION',
      subtitle: 'Votre stratégie patrimoniale suit trois temps forts.',
    },
  } = options;

  if (ageFinEpargne <= ageActuel || ageAuDeces <= ageFinEpargne) {
    return;
  }

  const totalYears = ageAuDeces - ageActuel;
  const timelineHeight = 0.25;

  drawTitleWithUnderline(slide, {
    title: 'VOTRE HORIZON DE VIE',
    x,
    y: y - 0.6,
    width,
  });

  slide.addText(labels.subtitle ?? '', {
    x,
    y: y - 0.2,
    w: width,
    h: 0.3,
    fontSize: 12,
    color: normalizeHexColor(colors.text ?? '1F2933'),
    fontFace: DEFAULT_FONT,
  });

  const yearsToPixels = (years: number) => (width * years) / totalYears;
  const posAge = (age: number) => x + yearsToPixels(age - ageActuel);

  slide.addShape('line', {
    x,
    y: y + 0.4,
    w: width,
    h: 0,
    line: { color: normalizeHexColor('#C5CFD6'), width: STYLE.LINE_THICK },
  });

  const phases: { label: string; start: number; end: number; color: HexColor }[] = [
    { label: labels.epargne ?? 'ÉPARGNE', start: ageActuel, end: ageFinEpargne, color: colors.epargne ?? '4A6A59' },
    {
      label: labels.liquidation ?? 'LIQUIDATION',
      start: ageFinEpargne,
      end: (ageFinEpargne + ageAuDeces) / 2,
      color: colors.liquidation ?? 'A5B9A8',
    },
    {
      label: labels.transmission ?? 'TRANSMISSION',
      start: (ageFinEpargne + ageAuDeces) / 2,
      end: ageAuDeces,
      color: colors.transmission ?? 'D3DED3',
    },
  ];

  phases.forEach(({ label, start, end, color }) => {
    const phaseX = posAge(start);
    const phaseWidth = yearsToPixels(end - start);
    slide.addShape('rect', {
      x: phaseX,
      y,
      w: phaseWidth,
      h: timelineHeight,
      fill: { color: normalizeHexColor(color) },
      line: { color: normalizeHexColor(color) },
    });

    slide.addText(label, {
      x: phaseX,
      y: y + timelineHeight + 0.05,
      w: phaseWidth,
      h: 0.3,
      align: 'center',
      fontSize: 11,
      color: normalizeHexColor(colors.text ?? '1F2933'),
      fontFace: DEFAULT_FONT,
    });
  });

  const drawAgeMarker = (age: number, label: string) => {
    const mkX = posAge(age);
    slide.addShape('line', {
      x: mkX,
      y: y - 0.1,
      w: 0,
      h: timelineHeight + 0.8,
      line: { color: normalizeHexColor('#9CA3AF'), width: STYLE.LINE_THIN },
    });
    slide.addText(label, {
      x: mkX - 0.2,
      y: y - 0.4,
      w: 0.5,
      h: 0.25,
      align: 'center',
      fontSize: 11,
      color: normalizeHexColor(colors.text ?? '1F2933'),
      fontFace: DEFAULT_FONT,
    });
  };

  drawAgeMarker(ageActuel, `${ageActuel} ans`);
  drawAgeMarker(ageFinEpargne, `${ageFinEpargne} ans`);
  drawAgeMarker(ageAuDeces, `${ageAuDeces} ans`);
}

export function drawResultLine(slide: Slide, options: DrawResultLineOptions): void {
  const {
    label,
    value,
    x = STYLE.MARGIN,
    y,
    width = STYLE.SLIDE_WIDTH - STYLE.MARGIN * 2,
    labelColor = '6B7280',
    valueColor = '1F2933',
    underlineColor,
  } = options;

  slide.addText(label, {
    x,
    y,
    w: width / 2,
    h: 0.3,
    align: 'left',
    fontSize: STYLE.RESULT_LINE_LABEL_SIZE,
    color: normalizeHexColor(labelColor),
    fontFace: DEFAULT_FONT,
  });

  slide.addText(value, {
    x: x + width / 2,
    y,
    w: width / 2,
    h: 0.3,
    align: 'right',
    fontSize: STYLE.RESULT_LINE_VALUE_SIZE,
    color: normalizeHexColor(valueColor),
    bold: true,
    fontFace: DEFAULT_FONT,
  });

  slide.addShape('line', {
    x: x + width * 0.65,
    y: y + 0.35,
    w: width * 0.3,
    h: 0,
    line: { color: normalizeHexColor(underlineColor ?? valueColor), width: STYLE.LINE_MEDIUM },
  });
}

export function paginateTableRows<T>(rows: T[] = [], maxRows = 18): T[][] {
  if (!rows.length || maxRows <= 0) {
    return rows.length ? [rows] : [];
  }
  const chunkSize = Math.max(1, maxRows);
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += chunkSize) {
    chunks.push(rows.slice(index, index + chunkSize));
  }
  return chunks;
}

export async function loadIconAsDataUri(publicPath: string): Promise<string | null> {
  if (!publicPath) return null;

  try {
    let candidate = publicPath;
    if (publicPath.startsWith('/')) {
      const trimmed = publicPath.replace(/^[/\\]+/, '');
      candidate = path.join('public', trimmed);
    }

    const absolutePath = path.isAbsolute(candidate)
      ? candidate
      : path.join(process.cwd(), candidate);
    const svgBuffer = await fs.readFile(absolutePath);
    const base64 = svgBuffer.toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  } catch (error) {
    console.warn('[slideHelpers] Unable to load icon:', publicPath, error);
    return null;
  }
}

export function normalizeHexColor(color: string, fallback: HexColor = '000000'): HexColor {
  if (!color) return fallback;
  const cleaned = color.replace('#', '').trim();
  const match = cleaned.match(/^[0-9a-fA-F]{6}$/);
  return match ? cleaned.toUpperCase() : fallback;
}

export function drawPedagogicalBlock(slide: Slide, options: PedagogicalBlockOptions): void {
  const {
    title, content, x, y, w, h,
    titleColor = '3D4A47',
    contentColor = '6B7280',
    backgroundColor = 'F3F4F6',
  } = options;

  slide.addShape('rect', {
    x, y, w, h,
    fill: { color: normalizeHexColor(backgroundColor) },
  });

  slide.addText(title.toUpperCase(), {
    x: x + 0.2, y: y + 0.15, w: w - 0.4, h: 0.3,
    fontSize: 12,
    bold: true,
    color: normalizeHexColor(titleColor),
    charSpacing: 2,
  });

  const contentText = Array.isArray(content) ? content.join('\n') : content;
  slide.addText(contentText, {
    x: x + 0.2, y: y + 0.5, w: w - 0.4, h: h - 0.6,
    fontSize: 10,
    color: normalizeHexColor(contentColor),
  });
}

function clampUnit(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

/**
 * SMOKE TEST (usage manuel)
 *
 * import PptxGenJS from 'pptxgenjs';
 * import { STYLE, drawKpiRow, applySplitLayout, drawTitleWithUnderline, loadIconAsDataUri } from './slideHelpers';
 *
 * async function smokeTest() {
 *   const pptx = new PptxGenJS();
 *   const splitSlide = pptx.addSlide();
 *   applySplitLayout(splitSlide, 'public/login-bg.png', { imagePosition: 'left' });
 *
 *   const kpiSlide = pptx.addSlide();
 *   const moneyIcon = await loadIconAsDataUri('public/ppt-assets/icons/icon-money.svg');
 *   drawTitleWithUnderline(kpiSlide, { title: 'KPI EXAMPLE' });
 *   drawKpiRow(kpiSlide, {
 *     y: STYLE.MARGIN + 0.5,
 *     kpis: [{ label: 'Capital acquis', value: '612 340 €', iconDataUri: moneyIcon }],
 *   });
 * }
 */
