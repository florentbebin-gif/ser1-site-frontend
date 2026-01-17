/**
 * PPTX Theme Types
 * 
 * Maps UI settings colors to PPTX theme roles
 */

/**
 * UI Theme Colors from ThemeProvider (10 colors)
 */
export type UiThemeColors = {
  color1: string;
  color2: string;
  color3: string;
  color4: string;
  color5: string;
  color6: string;
  color7: string;
  color8: string;
  color9: string;
  color10: string;
};

/**
 * PPTX Theme Roles
 * 
 * Maps semantic roles to actual colors.
 * All colors must come from UiThemeColors except white (#FFFFFF).
 */
export type PptxThemeRoles = {
  // All 10 UI colors preserved
  colors: UiThemeColors;
  
  // Constant white (only hardcoded color allowed)
  white: '#FFFFFF';
  
  // Background main (cover, etc.) -> color1
  bgMain: string;
  
  // Text on main background -> adaptive (white if dark, black if light)
  textOnMain: string;
  
  // Text main (titles on light bg) -> color1
  textMain: string;
  
  // Text body (content) -> color10
  textBody: string;
  
  // Accent color (lines, decorations) -> color6
  accent: string;
  
  // Panel background -> always white
  panelBg: '#FFFFFF';
  
  // Panel border color -> color8 (softer)
  panelBorder: string;
  
  // Shadow base color -> color1
  shadowBase: string;
  
  // Footer text on light background -> color10
  footerOnLight: string;
  
  // Footer accent (end slide) -> color6
  footerAccent: string;
};

/**
 * Export Context for PPTX generation
 */
export type ExportContext = {
  theme: PptxThemeRoles;
  locale: 'fr-FR' | string;
  generatedAt: Date;
  footerDisclaimer?: string;
  showSlideNumbers?: boolean;
  coverLeftMeta?: string;
  coverRightMeta?: string;
};

/**
 * Business Icon Names (from existing library)
 */
export type BusinessIconName = 
  | 'money' 
  | 'cheque' 
  | 'bank' 
  | 'calculator' 
  | 'checklist'
  | 'buildings' 
  | 'gauge' 
  | 'pen' 
  | 'chart-down' 
  | 'chart-up'
  | 'balance' 
  | 'tower'
  | 'percent';

/**
 * Icon Placement specification
 */
export type IconPlacement = {
  name: BusinessIconName;
  x: number;
  y: number;
  w: number;
  h: number;
  colorRole?: 'accent' | 'textMain' | 'textBody' | 'white';
};

/**
 * Cover Slide Specification
 */
export type CoverSlideSpec = {
  type: 'cover';
  title: string;
  subtitle: string;
  logoUrl?: string;
  leftMeta?: string;
  rightMeta?: string;
};

/**
 * Chapter Slide Specification
 */
export type ChapterSlideSpec = {
  type: 'chapter';
  title: string;
  subtitle: string;
  body?: string;
  chapterImageIndex: number; // 1-9
};

/**
 * Content Slide Specification
 */
export type ContentSlideSpec = {
  type: 'content';
  title: string;
  subtitle: string;
  body?: string;
  icons?: IconPlacement[];
};

/**
 * End/Legal Slide Specification
 */
export type EndSlideSpec = {
  type: 'end';
  legalText: string;
};

/**
 * Study Deck Specification (complete presentation)
 */
export type StudyDeckSpec = {
  cover: CoverSlideSpec;
  slides: Array<ChapterSlideSpec | ContentSlideSpec>;
  end: EndSlideSpec;
};
