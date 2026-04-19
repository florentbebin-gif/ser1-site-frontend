/**
 * Module layout — dimensions et zones de la slide
 *
 * All coordinates in inches for 16:9 widescreen (13.3333" x 7.5")
 */

// ============================================================================
// SLIDE SIZE
// ============================================================================

export const SLIDE_SIZE = {
  width: 13.3333,
  height: 7.5,
  layout: 'LAYOUT_WIDE' as const,
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
