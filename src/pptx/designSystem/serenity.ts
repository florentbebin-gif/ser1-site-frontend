/**
 * Serenity Design System for PPTX Generation
 * 
 * All coordinates in inches for 16:9 widescreen (13.3333" x 7.5")
 * Font: Arial ONLY
 * Colors: From theme roles (no hardcoded except white #FFFFFF)
 */

import PptxGenJS from 'pptxgenjs';
import type { PptxThemeRoles } from '../theme/types';

// ============================================================================
// SLIDE SIZE
// ============================================================================

export const SLIDE_SIZE = {
  width: 13.3333,
  height: 7.5,
  layout: 'LAYOUT_WIDE' as const,
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPO = {
  fontFace: 'Arial',
  sizes: {
    h1: 24,
    h2: 16,
    body: 14,
    bodySmall: 12,
    bodyXSmall: 10,
    legal: 11,
    footer: 8,
    coverTitle: 24,
    coverSubtitle: 18,
    coverMeta: 14, // Changed from 18 to 14 per spec
  },
} as const;

// ============================================================================
// COORDINATES - COVER SLIDE
// ============================================================================

export const COORDS_COVER = {
  logo: { x: 4.4844, y: 1.9542, w: 4.3646, h: 1.9896 },
  title: { x: 1.5528, y: 4.0986, w: 10.2277, h: 0.8333 },
  dividerLine: { x: 4.4520, y: 5.0778, w: 4.4294 },
  subtitle: { x: 1.5528, y: 5.2418, w: 10.2277, h: 0.5443 },
  metaLeft: { x: 0.9784, y: 6.0417, w: 2.8646, h: 0.8333 },
  metaRight: { x: 9.4903, y: 6.0417, w: 2.8646, h: 0.8333 },
  cornerMarkLeft: { x: 0.8229, y: 6.1459, w: 0.9063, h: 0.9062 },
  cornerMarkRight: { x: 11.6042, y: 6.1458, w: 0.9063, h: 0.9062 },
} as const;

// ============================================================================
// COORDINATES - CHAPTER SLIDE
// ============================================================================

export const COORDS_CHAPTER = {
  panel: { x: 0.5966, y: 0.7347, w: 12.14, h: 5.8704 },
  image: { x: 0.5966, y: 0.7347, w: 4.2424, h: 5.8704 },
  title: { x: 4.9909, y: 0.9223, w: 7.3319, h: 0.8663 },
  subtitle: { x: 4.9909, y: 1.9535, w: 7.3319, h: 0.4149 },
  accentLine: { x: 5.0818, y: 1.7886, w: 1.1278 },
  body: { x: 4.9909, y: 2.5334, w: 7.3319, h: 3.7227 },
} as const;

// ============================================================================
// COORDINATES - CONTENT SLIDE
// ============================================================================

export const COORDS_CONTENT = {
  margin: { x: 0.9167, w: 11.5 },
  title: { x: 0.9167, y: 0.7643, w: 11.5, h: 0.8663 },
  subtitle: { x: 0.9167, y: 1.7956, w: 11.5, h: 0.4149 },
  accentLine: { x: 1.0029, y: 1.6408, w: 1.0614 },
  content: { x: 0.9167, y: 2.3754, w: 11.5, h: 4.3602 },
} as const;

// ============================================================================
// COORDINATES - END SLIDE
// ============================================================================

export const COORDS_END = {
  // Legal block centered horizontally
  legalBlock: { x: 2.6458, y: 2.0166, w: 8.0417, h: 3.4669 },
  // Corner marks computed from CORNER_MARKS constants for perfect symmetry
  // topRight: x = slideWidth - marginX - size, y = marginY
  // bottomLeft: x = marginX, y = slideHeight - marginY - size
} as const;

// ============================================================================
// COORDINATES - FOOTER (shared)
// ============================================================================

export const COORDS_FOOTER = {
  date: { x: 0.9167, y: 6.9514, w: 1.6875, h: 0.3993 },
  disclaimer: { x: 2.9792, y: 6.9514, w: 7.375, h: 0.3993 },
  slideNum: { x: 10.7292, y: 6.9514, w: 1.6875, h: 0.3993 },
} as const;

// ============================================================================
// LINE STYLES
// ============================================================================

export const LINE_STYLES = {
  divider: { w: 0.75 / 72 }, // 0.75 pt in inches
  accent: { w: 1.5 / 72 },   // 1.5 pt in inches
} as const;

// ============================================================================
// RADIUS TOKENS (shared for panel/image harmony)
// ============================================================================

export const RADIUS = {
  /** 
   * Panel radius (rectRadius for roundRect shape)
   * Must match the pre-processed image corner radius for seamless junction
   */
  panel: 0.12,
  /** 
   * Image radius adjustment (same as panel for perfect alignment)
   * Used when clipping/masking is applied
   */
  imageAdj: 0.12,
} as const;

// ============================================================================
// BLEED TOKENS (anti-aliasing gap elimination)
// ============================================================================

export const BLEED = {
  /**
   * Image bleed (in inches) - image extends slightly under the panel border
   * This eliminates the "hole" caused by anti-aliasing at rounded corners
   * Value 0.02 (~1.5px) is enough to hide gaps without visual distortion
   */
  image: 0.02,
} as const;

// ============================================================================
// CORNER MARKS LAYOUT (symmetric positioning)
// Computed mathematically for perfect symmetry
// ============================================================================

export const CORNER_MARKS = {
  /** Size of the corner mark group (width = height) */
  size: 0.65,
  /** Horizontal margin from slide edge (same for left and right) */
  marginX: 0.75,
  /** Vertical margin from slide edge (same for top and bottom) */
  marginY: 0.75,
  /** Line spacing between the two vertical lines */
  lineSpacing: 0.12,
  /** Height of primary line (inches) */
  primaryHeight: 0.55,
  /** Height of secondary line (inches) */
  secondaryHeight: 0.40,
  /** Vertical offset for secondary line */
  secondaryOffset: 0.08,
  /** Line width in points */
  lineWidth: 0.75,
} as const;

// ============================================================================
// LAYOUT CONTRACT (strict bounding boxes for each zone)
// Prevents overflow and encroachment on title/subtitle areas
// ============================================================================

export const LAYOUT_ZONES = {
  /** Chapter slide zones */
  chapter: {
    titleBox: { x: 4.9909, y: 0.9223, w: 7.3319, h: 0.8663 },
    subtitleBox: { x: 4.9909, y: 1.9535, w: 7.3319, h: 0.6 },
    bodyBox: { x: 4.9909, y: 2.6, w: 7.3319, h: 3.6 },
  },
  /** Content slide zones */
  content: {
    titleBox: { x: 0.9167, y: 0.7643, w: 11.5, h: 0.8663 },
    subtitleBox: { x: 0.9167, y: 1.7956, w: 11.5, h: 0.4149 },
    bodyBox: { x: 0.9167, y: 2.3754, w: 11.5, h: 4.3602 },
  },
  /** Cover slide zones */
  cover: {
    titleBox: { x: 1.5528, y: 4.0986, w: 10.2277, h: 0.8333 },
    subtitleBox: { x: 1.5528, y: 5.2418, w: 10.2277, h: 0.5443 },
  },
} as const;

/** Minimum font sizes for text fitting (prevents unreadable text) */
export const MIN_FONT_SIZES = {
  h1: 18,
  h2: 12,
  body: 10,
  bodySmall: 8,
} as const;

// ============================================================================
// TEXT-BASED LAYOUT TOKENS (for accent line positioning)
// ============================================================================

/** Gaps for text-based layout (in inches) */
export const TEXT_GAPS = {
  /** Gap after title text before accent line */
  afterTitle: 0.1,
  /** Gap after accent line before subtitle */
  afterLine: 0.15,
} as const;

/** Debug mode flag (set to true to visualize layout zones) */
export const DEBUG_LAYOUT_ZONES = false;

// ============================================================================
// SHADOW PARAMS (premium outer shadow spec)
// Based on: 24% opacity, 23.3pt blur, 14.3pt distance, 74° angle
// ============================================================================

export const SHADOW_PARAMS = {
  /** Shadow type: outer (standard drop shadow) */
  type: 'outer' as const,
  /** Angle in degrees (74° = bottom-right bias) */
  angle: 74,
  /** Blur radius in points (23pt ≈ soft premium shadow) */
  blur: 23,
  /** Offset/distance in points (14pt) */
  offset: 14,
  /** Opacity (0.24 = 24%) */
  opacity: 0.24,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Normalize title text by removing trailing whitespace and newlines
 * This prevents empty lines from affecting layout calculations
 */
export function normalizeTitleText(text: string): string {
  return text.trim().replace(/\n+$/g, '');
}

/**
 * Calculate the visual height of title text based on font size and line count
 * This returns the actual height of the rendered text, not the box height
 */
export function calculateTitleTextHeight(
  titleText: string,
  fontSize: number,
  lineHeightMultiple: number = 1.15
): number {
  const normalizedText = normalizeTitleText(titleText);
  const lines = normalizedText.split('\n').length;
  
  // Convert font size from points to inches (1 point = 1/72 inch)
  const fontSizeInInches = fontSize / 72;
  const textHeight = lines * fontSizeInInches * lineHeightMultiple;
  
  if (DEBUG_LAYOUT_ZONES) {
    console.log('[DEBUG] Title text height calculation:', {
      originalText: titleText,
      normalizedText,
      lines,
      fontSize,
      lineHeightMultiple,
      textHeightInInches: textHeight,
    });
  }
  
  return textHeight;
}

/**
 * Draw debug borders around layout zones (when DEBUG_LAYOUT_ZONES is true)
 */
export function drawDebugLayoutZones(
  slide: PptxGenJS.Slide,
  variant: 'chapter' | 'content'
): void {
  if (!DEBUG_LAYOUT_ZONES) return;
  
  const layoutZones = variant === 'chapter' ? LAYOUT_ZONES.chapter : LAYOUT_ZONES.content;
  const debugColor = 'FF0000'; // Red for visibility
  
  // Draw title box border
  slide.addShape('rect', {
    x: layoutZones.titleBox.x,
    y: layoutZones.titleBox.y,
    w: layoutZones.titleBox.w,
    h: layoutZones.titleBox.h,
    fill: { color: 'FFFFFF', transparency: 80 },
    line: { color: debugColor, width: 0.5 },
  });
  
  // Draw subtitle box border
  slide.addShape('rect', {
    x: layoutZones.subtitleBox.x,
    y: layoutZones.subtitleBox.y,
    w: layoutZones.subtitleBox.w,
    h: layoutZones.subtitleBox.h,
    fill: { color: 'FFFFFF', transparency: 80 },
    line: { color: debugColor, width: 0.5 },
  });
}
export function roleColor(theme: PptxThemeRoles, role: keyof PptxThemeRoles): string {
  const color = theme[role];
  if (typeof color === 'string') {
    return color.replace('#', '');
  }
  throw new Error(`Invalid color role: ${String(role)}`);
}

/**
 * Add solid background to slide
 */
export function addBackground(slide: PptxGenJS.Slide, color: string): void {
  slide.background = { color: color.replace('#', '') };
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
  
  // Draw debug zones if enabled
  drawDebugLayoutZones(slide, variant);
  
  // Normalize title text to remove trailing empty lines
  const normalizedTitleText = normalizeTitleText(titleText);
  
  // Calculate the actual visual height of the title text
  const titleTextHeight = calculateTitleTextHeight(normalizedTitleText, titleFontSize);
  
  // Calculate positions based on TEXT height, not box height
  const titleVisualBottomY = layoutZones.titleBox.y + titleTextHeight;
  const accentLineY = titleVisualBottomY + TEXT_GAPS.afterTitle;
  const subtitleY = accentLineY + TEXT_GAPS.afterLine;
  
  if (DEBUG_LAYOUT_ZONES) {
    console.log('[DEBUG] Header positioning:', {
      variant,
      normalizedTitleText,
      titleTextHeight,
      titleVisualBottomY,
      accentLineY,
      subtitleY,
      subtitleBoxTop: layoutZones.subtitleBox.y,
    });
  }
  
  // Add title (using original title box for positioning, but text is normalized)
  addTextBox(slide, normalizedTitleText, layoutZones.titleBox, {
    fontSize: titleFontSize,
    color: theme.textMain,
    bold: true,
    align: 'left',
    valign: 'top',
    isUpperCase: true,
  });
  
  // Add accent line at calculated Y position (based on text height)
  const accentLineCoords = {
    x: baseCoords.accentLine.x,
    y: accentLineY,
    w: baseCoords.accentLine.w,
  };
  
  slide.addShape('line', {
    x: accentLineCoords.x,
    y: accentLineCoords.y,
    w: accentLineCoords.w,
    h: 0,
    line: {
      color: roleColor(theme, 'accent'),
      width: 1.5,
    },
  });
  
  // Add subtitle at calculated Y position
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
function formatDateFr(date: Date): string {
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
  slide.addText(formatDateFr(ctx.generatedAt), {
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
  slide.addText(disclaimer, {
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
  slide.addText(slideNumText, {
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

/**
 * Add chapter image from public assets with bleed
 * 
 * IMPORTANT: Images are PRE-PROCESSED with rounded corners (in /public/pptx/chapters/)
 * Do NOT apply rounding here - it creates an oval/ellipse effect which is incorrect.
 * 
 * BLEED: Image extends slightly under the panel border to eliminate
 * the "hole" caused by anti-aliasing at rounded corners.
 */
export function addChapterImage(
  slide: PptxGenJS.Slide,
  imageDataUri: string,
  rect: { x: number; y: number; w: number; h: number },
  applyBleed: boolean = true
): void {
  // Apply bleed to eliminate anti-aliasing gaps at corners
  const bleed = applyBleed ? BLEED.image : 0;
  
  slide.addImage({
    data: imageDataUri,
    x: rect.x - bleed,
    y: rect.y - bleed,
    w: rect.w + bleed, // Only extend right edge (left is panel edge)
    h: rect.h + 2 * bleed,
    // NO rounding option - image is pre-processed with rounded corners
  });
}

/**
 * Validate that a rect is within slide bounds (NO OVERFLOW)
 * @throws Error if rect exceeds slide canvas
 */
export function validateNoOverflow(
  rect: { x: number; y: number; w: number; h: number },
  context: string = 'element'
): void {
  const rightEdge = rect.x + rect.w;
  const bottomEdge = rect.y + rect.h;
  
  if (rect.x < 0 || rect.y < 0) {
    console.warn(`[Layout Contract] ${context}: Negative position detected (x:${rect.x}, y:${rect.y})`);
  }
  if (rightEdge > SLIDE_SIZE.width) {
    console.warn(`[Layout Contract] ${context}: Right edge overflow (${rightEdge} > ${SLIDE_SIZE.width})`);
  }
  if (bottomEdge > SLIDE_SIZE.height) {
    console.warn(`[Layout Contract] ${context}: Bottom edge overflow (${bottomEdge} > ${SLIDE_SIZE.height})`);
  }
}

/**
 * Clamp a rect to stay within slide bounds
 * Used to enforce NO OVERFLOW rule
 */
export function clampToSlide(
  rect: { x: number; y: number; w: number; h: number }
): { x: number; y: number; w: number; h: number } {
  const x = Math.max(0, rect.x);
  const y = Math.max(0, rect.y);
  const w = Math.min(rect.w, SLIDE_SIZE.width - x);
  const h = Math.min(rect.h, SLIDE_SIZE.height - y);
  return { x, y, w, h };
}

/**
 * Add text box with consistent defaults
 * Enforces NO OVERFLOW by clamping to slide bounds
 */
export function addTextBox(
  slide: PptxGenJS.Slide,
  text: string,
  rect: { x: number; y: number; w: number; h: number },
  style: {
    fontSize?: number;
    fontFace?: string;
    color: string;
    bold?: boolean;
    align?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    isUpperCase?: boolean;
    lineSpacing?: number; // Line spacing multiplier (e.g., 1.15 for 115%)
    wrap?: boolean; // Enable text wrapping (default: true)
  }
): void {
  const displayText = style.isUpperCase ? text.toUpperCase() : text;
  
  // Validate and clamp to slide bounds (NO OVERFLOW)
  validateNoOverflow(rect, 'TextBox');
  const safeRect = clampToSlide(rect);
  
  // Build text options
  const textOptions: PptxGenJS.TextPropsOptions = {
    x: safeRect.x,
    y: safeRect.y,
    w: safeRect.w,
    h: safeRect.h,
    fontSize: style.fontSize || TYPO.sizes.body,
    fontFace: style.fontFace || TYPO.fontFace,
    color: style.color.replace('#', ''),
    bold: style.bold || false,
    align: style.align || 'left',
    valign: style.valign || 'top',
    wrap: style.wrap !== false, // Default to true for text fitting
  };
  
  // Add line spacing if specified (PptxGenJS uses lineSpacingMultiple)
  if (style.lineSpacing) {
    textOptions.lineSpacingMultiple = style.lineSpacing;
  }
  
  slide.addText(displayText, textOptions);
}

export default {
  SLIDE_SIZE,
  TYPO,
  RADIUS,
  BLEED,
  CORNER_MARKS,
  LAYOUT_ZONES,
  MIN_FONT_SIZES,
  TEXT_GAPS,
  COORDS_COVER,
  COORDS_CHAPTER,
  COORDS_CONTENT,
  COORDS_END,
  COORDS_FOOTER,
  LINE_STYLES,
  SHADOW_PARAMS,
  roleColor,
  addBackground,
  addAccentLine,
  addHeader,
  addCornerMarks,
  addFooter,
  addCardPanelWithShadow,
  addPanelWithShadow,
  addChapterImage,
  addTextBox,
  normalizeTitleText,
  calculateTitleTextHeight,
  drawDebugLayoutZones,
  validateNoOverflow,
  clampToSlide,
};
