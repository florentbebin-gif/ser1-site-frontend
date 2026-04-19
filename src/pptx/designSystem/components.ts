/**
 * Module components — composants de rendu (headers, panels, footers, corner marks)
 */

import type PptxGenJS from 'pptxgenjs';
import type { PptxThemeRoles } from '../theme/types';
import {
  SLIDE_SIZE,
  CORNER_MARKS,
  LAYOUT_ZONES,
  DEBUG_LAYOUT_ZONES,
  RADIUS,
} from './layout';
import { TYPO } from './typography';
import { COORDS_COVER, COORDS_CHAPTER, COORDS_CONTENT, COORDS_FOOTER } from './coords';
import { SHADOW_PARAMS, roleColor } from './colorsShadows';
import { addTextFr, addTextBox } from './helpers';

/**
 * Normalize title text to force SINGLE LINE
 * - Trim whitespace
 * - Replace all newlines with space
 * - Collapse multiple spaces into one
 * => Result: title NEVER contains line breaks, NEVER forces 2 lines
 */
export function normalizeTitleText(text: string): string {
  return text
    .trim()
    .replace(/\n+/g, ' ')      // Replace ALL newlines with space
    .replace(/\s+/g, ' ')      // Collapse multiple spaces into one
    .trim();                    // Final trim
}

/**
 * Calculate the visual height of title text
 * Since title is FORCED to single line after normalization,
 * height = 1 * fontSize * lineHeightMultiple
 */
export function calculateTitleTextHeight(
  _titleText: string,
  fontSize: number,
  lineHeightMultiple: number = 1.15
): number {
  // Title is always 1 line after normalization
  const lines = 1;

  // Convert font size from points to inches (1 point = 1/72 inch)
  const fontSizeInInches = fontSize / 72;
  const textHeight = lines * fontSizeInInches * lineHeightMultiple;

  return textHeight;
}

/**
 * Draw debug borders around layout zones and reference lines (when DEBUG_LAYOUT_ZONES is true)
 */
export function drawDebugLayoutZones(
  slide: PptxGenJS.Slide,
  variant: 'chapter' | 'content',
  titleTextBottomY?: number,
  accentLineY?: number
): void {
  if (!DEBUG_LAYOUT_ZONES) return;

  const layoutZones = variant === 'chapter' ? LAYOUT_ZONES.chapter : LAYOUT_ZONES.content;
  const debugColorRed = 'FF0000';    // Red for boxes
  const debugColorGreen = '00FF00'; // Green for titleTextBottomY
  const debugColorBlue = '0000FF';  // Blue for accentLineY

  // Draw title box border (RED)
  slide.addShape('rect', {
    x: layoutZones.titleBox.x,
    y: layoutZones.titleBox.y,
    w: layoutZones.titleBox.w,
    h: layoutZones.titleBox.h,
    fill: { color: 'FFFFFF', transparency: 80 },
    line: { color: debugColorRed, width: 0.5 },
  });

  // Draw subtitle box border (RED)
  slide.addShape('rect', {
    x: layoutZones.subtitleBox.x,
    y: layoutZones.subtitleBox.y,
    w: layoutZones.subtitleBox.w,
    h: layoutZones.subtitleBox.h,
    fill: { color: 'FFFFFF', transparency: 80 },
    line: { color: debugColorRed, width: 0.5 },
  });

  // Draw reference line at titleTextBottomY (GREEN) - proves position is TEXT-based
  if (titleTextBottomY !== undefined) {
    slide.addShape('line', {
      x: layoutZones.titleBox.x,
      y: titleTextBottomY,
      w: layoutZones.titleBox.w,
      h: 0,
      line: { color: debugColorGreen, width: 0.25, dashType: 'dash' },
    });
  }

  // Draw reference line at accentLineY (BLUE) - shows where bar will be
  if (accentLineY !== undefined) {
    slide.addShape('line', {
      x: layoutZones.titleBox.x,
      y: accentLineY,
      w: layoutZones.titleBox.w,
      h: 0,
      line: { color: debugColorBlue, width: 0.25, dashType: 'dash' },
    });
  }
}

/**
 * Add accent line (horizontal) - POSITIONED BETWEEN TITLE AND SUBTITLE
 *
 * IMPORTANT: The line is now positioned at the MIDPOINT between title and subtitle zones,
 * not at the bottom of the title box. This creates proper visual separation.
 *
 * @deprecated Use addHeader() instead for text-based positioning
 */
export function addAccentLine(
  slide: PptxGenJS.Slide,
  theme: PptxThemeRoles,
  variant: 'cover' | 'chapter' | 'content'
): void {
  let coords: { x: number; y: number; w: number };
  let lineWidth: number;

  if (variant === 'cover') {
    // Cover slide uses fixed coordinates (no subtitle zone)
    coords = COORDS_COVER.dividerLine;
    lineWidth = 0.75;
  } else {
    // Chapter and Content: calculate Y position at midpoint between title and subtitle
    const layoutZones = variant === 'chapter' ? LAYOUT_ZONES.chapter : LAYOUT_ZONES.content;
    const baseCoords = variant === 'chapter' ? COORDS_CHAPTER.accentLine : COORDS_CONTENT.accentLine;

    // Calculate midpoint between title bottom and subtitle top
    const titleBottomY = layoutZones.titleBox.y + layoutZones.titleBox.h;
    const subtitleTopY = layoutZones.subtitleBox.y;
    const accentLineY = titleBottomY + (subtitleTopY - titleBottomY) * 0.5;

    coords = {
      x: baseCoords.x,
      y: accentLineY,
      w: baseCoords.w
    };
    lineWidth = 1.5;
  }

  slide.addShape('line', {
    x: coords.x,
    y: coords.y,
    w: coords.w,
    h: 0,
    line: {
      color: roleColor(theme, 'accent'),
      width: lineWidth,
    },
  });
}

/**
 * Add complete header (title + accent line + subtitle) with TEXT-BASED positioning
 *
 * IMPORTANT: This function positions the accent line based on the ACTUAL height of the title text,
 * not the title box height. This prevents the line from being "stuck" when the title box is too large
 * or contains empty lines.
 *
 * @param slide - PptxGenJS slide
 * @param titleText - Title text (will be normalized)
 * @param subtitleText - Subtitle text
 * @param theme - Theme roles for colors
 * @param variant - 'chapter' or 'content' layout
 * @param titleFontSize - Font size for title (default: TYPO.sizes.h1)
 * @param subtitleFontSize - Font size for subtitle (default: TYPO.sizes.h2)
 */
export function addHeader(
  slide: PptxGenJS.Slide,
  titleText: string,
  subtitleText: string,
  theme: PptxThemeRoles,
  variant: 'chapter' | 'content',
  titleFontSize: number = TYPO.sizes.h1,
  subtitleFontSize: number = TYPO.sizes.h2
): void {
  const layoutZones = variant === 'chapter' ? LAYOUT_ZONES.chapter : LAYOUT_ZONES.content;
  const baseCoords = variant === 'chapter' ? COORDS_CHAPTER : COORDS_CONTENT;

  // ========== B1: Normalize title to SINGLE LINE ==========
  const normalizedTitleText = normalizeTitleText(titleText);

  // ========== B2: Calculate Y of accent line CENTERED ==========
  // Title text height (always 1 line after normalization)
  const titleTextHeight = calculateTitleTextHeight(normalizedTitleText, titleFontSize);

  // Bottom of title TEXT (not box)
  const titleTextBottomY = layoutZones.titleBox.y + titleTextHeight;

  // Top of subtitle (fixed position from layout)
  const subtitleTopY = layoutZones.subtitleBox.y;

  // Accent line Y = CENTERED between title text bottom and subtitle top
  const accentLineY = titleTextBottomY + (subtitleTopY - titleTextBottomY) * 0.5;

  // ========== B3: Ensure subtitle stays below accent line ==========
  const minGapAfterLine = 0.08; // minimum gap after accent line
  const subtitleY = Math.max(subtitleTopY, accentLineY + minGapAfterLine);

  // ========== C1: Debug mode logging and visual markers ==========
  if (DEBUG_LAYOUT_ZONES) {
    // eslint-disable-next-line no-console
    console.log('[DEBUG HEADER]', {
      slideType: variant,
      titleOriginal: titleText,
      titleNormalized: normalizedTitleText,
      titleBox: layoutZones.titleBox,
      subtitleBox: layoutZones.subtitleBox,
      titleTextBottomY: titleTextBottomY.toFixed(3),
      subtitleTopY: subtitleTopY.toFixed(3),
      accentLineY: accentLineY.toFixed(3),
      subtitleY: subtitleY.toFixed(3),
      gap_title_to_line: (accentLineY - titleTextBottomY).toFixed(3),
      gap_line_to_subtitle: (subtitleY - accentLineY).toFixed(3),
    });
  }

  // Draw debug zones with reference lines
  drawDebugLayoutZones(slide, variant, titleTextBottomY, accentLineY);

  // ========== Render title ==========
  addTextBox(slide, normalizedTitleText, layoutZones.titleBox, {
    fontSize: titleFontSize,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
    isUpperCase: true,
  });

  // ========== Render accent line (CENTERED) ==========
  slide.addShape('line', {
    x: baseCoords.accentLine.x,
    y: accentLineY,
    w: baseCoords.accentLine.w,
    h: 0,
    line: {
      color: roleColor(theme, 'accent'),
      width: 1.5,
    },
  });

  // ========== Render subtitle (below accent line) ==========
  const subtitleRect = {
    x: layoutZones.subtitleBox.x,
    y: subtitleY,
    w: layoutZones.subtitleBox.w,
    h: layoutZones.subtitleBox.h,
  };

  addTextBox(slide, subtitleText, subtitleRect, {
    fontSize: subtitleFontSize,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
  });
}

/**
 * Add corner marks (vertical lines)
 */
export function addCornerMarks(
  slide: PptxGenJS.Slide,
  theme: PptxThemeRoles,
  placementVariant: 'coverBottom' | 'endDiagonal'
): void {
  const accentColor = roleColor(theme, 'accent');
  const lineWidth = 0.75;

  if (placementVariant === 'coverBottom') {
    // Bottom left corner mark (2 vertical lines)
    const left = COORDS_COVER.cornerMarkLeft;
    slide.addShape('line', {
      x: left.x,
      y: left.y,
      w: 0,
      h: left.h * 0.6,
      line: { color: accentColor, width: lineWidth },
    });
    slide.addShape('line', {
      x: left.x + 0.15,
      y: left.y + 0.1,
      w: 0,
      h: left.h * 0.5,
      line: { color: accentColor, width: lineWidth },
    });

    // Bottom right corner mark (2 vertical lines)
    const right = COORDS_COVER.cornerMarkRight;
    slide.addShape('line', {
      x: right.x + right.w - 0.15,
      y: right.y,
      w: 0,
      h: right.h * 0.6,
      line: { color: accentColor, width: lineWidth },
    });
    slide.addShape('line', {
      x: right.x + right.w,
      y: right.y + 0.1,
      w: 0,
      h: right.h * 0.5,
      line: { color: accentColor, width: lineWidth },
    });
  } else if (placementVariant === 'endDiagonal') {
    // Compute symmetric positions from CORNER_MARKS constants
    const cm = CORNER_MARKS;
    const cmLineWidth = cm.lineWidth;

    // SYMMETRIC POSITIONING:
    // Top right corner: anchor at top-right, lines go DOWN
    // x = slideWidth - marginX (right edge of lines)
    // y = marginY (top of lines)
    const topRightX = SLIDE_SIZE.width - cm.marginX;
    const topRightY = cm.marginY;

    // Bottom left corner: anchor at bottom-left, lines go DOWN from anchor
    // x = marginX (left edge of lines)
    // y = slideHeight - marginY - primaryHeight (so bottom of line touches marginY from bottom)
    const bottomLeftX = cm.marginX;
    const bottomLeftY = SLIDE_SIZE.height - cm.marginY - cm.primaryHeight;

    // Top right corner marks (2 vertical lines) - positioned from right edge
    slide.addShape('line', {
      x: topRightX - cm.lineSpacing,
      y: topRightY,
      w: 0,
      h: cm.primaryHeight,
      line: { color: accentColor, width: cmLineWidth },
    });
    slide.addShape('line', {
      x: topRightX,
      y: topRightY + cm.secondaryOffset,
      w: 0,
      h: cm.secondaryHeight,
      line: { color: accentColor, width: cmLineWidth },
    });

    // Bottom left corner marks (2 vertical lines) - positioned from left edge
    slide.addShape('line', {
      x: bottomLeftX,
      y: bottomLeftY,
      w: 0,
      h: cm.primaryHeight,
      line: { color: accentColor, width: cmLineWidth },
    });
    slide.addShape('line', {
      x: bottomLeftX + cm.lineSpacing,
      y: bottomLeftY + cm.secondaryOffset,
      w: 0,
      h: cm.secondaryHeight,
      line: { color: accentColor, width: cmLineWidth },
    });
  }
}

/**
 * Format date for footer (fr-FR locale)
 */
export function formatDateFr(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Add footer component
 */
export function addFooter(
  slide: PptxGenJS.Slide,
  ctx: {
    generatedAt: Date;
    footerDisclaimer?: string;
    showSlideNumbers?: boolean;
    theme: PptxThemeRoles;
  },
  slideIndex: number,
  variant: 'onLight' | 'accent' | 'onMain'
): void {
  let textColor: string;
  if (variant === 'onLight') {
    textColor = roleColor(ctx.theme, 'footerOnLight');
  } else if (variant === 'onMain') {
    // Use adaptive text color for colored backgrounds
    textColor = ctx.theme.textOnMain.replace('#', '');
  } else {
    textColor = roleColor(ctx.theme, 'footerAccent');
  }

  // Use explicit check to allow empty string to suppress disclaimer
  const disclaimer = ctx.footerDisclaimer !== undefined
    ? ctx.footerDisclaimer
    : "Document non contractuel établi en fonction des dispositions fiscales ou sociales en vigueur à la date des présentes";

  // Date
  addTextFr(slide, formatDateFr(ctx.generatedAt), {
    x: COORDS_FOOTER.date.x,
    y: COORDS_FOOTER.date.y,
    w: COORDS_FOOTER.date.w,
    h: COORDS_FOOTER.date.h,
    fontSize: TYPO.sizes.footer,
    fontFace: TYPO.fontFace,
    color: textColor,
    align: 'left',
    valign: 'middle',
  });

  // Disclaimer
  addTextFr(slide, disclaimer, {
    x: COORDS_FOOTER.disclaimer.x,
    y: COORDS_FOOTER.disclaimer.y,
    w: COORDS_FOOTER.disclaimer.w,
    h: COORDS_FOOTER.disclaimer.h,
    fontSize: TYPO.sizes.footer,
    fontFace: TYPO.fontFace,
    color: textColor,
    align: 'center',
    valign: 'middle',
  });

  // Slide number
  const slideNumText = ctx.showSlideNumbers !== false ? `${slideIndex}` : 'N°';
  addTextFr(slide, slideNumText, {
    x: COORDS_FOOTER.slideNum.x,
    y: COORDS_FOOTER.slideNum.y,
    w: COORDS_FOOTER.slideNum.w,
    h: COORDS_FOOTER.slideNum.h,
    fontSize: TYPO.sizes.footer,
    fontFace: TYPO.fontFace,
    color: textColor,
    align: 'right',
    valign: 'middle',
  });
}

/**
 * Add card panel with premium shadow effect
 *
 * Uses native PPTXGenJS shadow property for a single clean shadow.
 * NO multi-layer simulation - one shape only.
 *
 * Panel specs:
 * - Fill: white (#FFFFFF)
 * - Border: color 8 (panelBorder role), 0.75pt width
 * - Shadow: outer, 24% opacity, 23pt blur, 14pt offset, 74° angle
 *
 * @param slide - PptxGenJS slide
 * @param rect - Panel bounding box
 * @param theme - Theme roles for colors
 * @param panelRadius - Corner radius for roundRect
 */
export function addCardPanelWithShadow(
  slide: PptxGenJS.Slide,
  rect: { x: number; y: number; w: number; h: number },
  theme: PptxThemeRoles,
  panelRadius: number = RADIUS.panel
): void {
  const shadowColor = roleColor(theme, 'shadowBase');
  const borderColor = roleColor(theme, 'panelBorder');

  // Single panel with native PPTXGenJS shadow
  // NO multi-layer simulation - clean single shape
  slide.addShape('roundRect', {
    x: rect.x,
    y: rect.y,
    w: rect.w,
    h: rect.h,
    fill: { color: 'FFFFFF' },
    line: { color: borderColor, width: 0.75 },
    rectRadius: panelRadius,
    shadow: {
      type: SHADOW_PARAMS.type,
      angle: SHADOW_PARAMS.angle,
      blur: SHADOW_PARAMS.blur,
      offset: SHADOW_PARAMS.offset,
      opacity: SHADOW_PARAMS.opacity,
      color: shadowColor,
    },
  });
}

/**
 * Legacy function - kept for backward compatibility
 * @deprecated Use addCardPanelWithShadow instead
 */
export function addPanelWithShadow(
  slide: PptxGenJS.Slide,
  rect: { x: number; y: number; w: number; h: number },
  theme: PptxThemeRoles
): void {
  addCardPanelWithShadow(slide, rect, theme);
}
