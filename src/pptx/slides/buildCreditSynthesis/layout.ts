import { COORDS_CONTENT, SLIDE_SIZE } from '@/pptx/designSystem/serenity';

const CONTENT_TOP_Y = COORDS_CONTENT.content.y;
const VERTICAL_SHIFT = 0.32;

export const LAYOUT = {
  marginX: COORDS_CONTENT.margin.x,
  contentWidth: COORDS_CONTENT.margin.w,
  slideWidth: SLIDE_SIZE.width,
  kpi: {
    iconSize: 0.48,
    iconY: CONTENT_TOP_Y + VERTICAL_SHIFT,
    labelY: CONTENT_TOP_Y + VERTICAL_SHIFT + 0.54,
    valueY: CONTENT_TOP_Y + VERTICAL_SHIFT + 0.78,
    colWidth: 2.8,
    colSpacing: 0.18,
    sectionEndY: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.15,
  },
  hero: {
    y: CONTENT_TOP_Y + VERTICAL_SHIFT + 1.4,
    labelHeight: 0.28,
    valueHeight: 0.52,
    subLabelHeight: 0.24,
    lineY: CONTENT_TOP_Y + VERTICAL_SHIFT + 2.5,
    sectionEndY: CONTENT_TOP_Y + VERTICAL_SHIFT + 2.6,
  },
  bar: {
    y: CONTENT_TOP_Y + VERTICAL_SHIFT + 2.8,
    height: 0.38,
    legendY: CONTENT_TOP_Y + VERTICAL_SHIFT + 3.25,
    legendHeight: 0.22,
    marginX: 1.5,
    sectionEndY: CONTENT_TOP_Y + VERTICAL_SHIFT + 3.5,
  },
} as const;
