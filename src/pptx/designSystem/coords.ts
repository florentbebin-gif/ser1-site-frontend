/**
 * Module coords — coordonnées des zones par type de slide
 */

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
