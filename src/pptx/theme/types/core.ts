/**
 * Types PPTX partagés sans dépendance de domaine.
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

export type PptxThemeRoles = {

  colors: UiThemeColors;

  white: '#FFFFFF';

  bgMain: string;

  textOnMain: string;

  textMain: string;

  textBody: string;

  accent: string;

  panelBg: '#FFFFFF';

  panelBorder: string;

  shadowBase: string;

  footerOnLight: string;

  footerAccent: string;
};

export type ExportContext = {
  theme: PptxThemeRoles;
  locale: 'fr-FR' | string;
  generatedAt: Date;
  footerDisclaimer?: string;
  showSlideNumbers?: boolean;
  coverLeftMeta?: string;
  coverRightMeta?: string;
};

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

export type LogoPlacement =
  | 'center-bottom'
  | 'center-top'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-left'
  | 'top-right';

export type IconPlacement = {
  name: BusinessIconName;
  x: number;
  y: number;
  w: number;
  h: number;
  colorRole?: 'accent' | 'textMain' | 'textBody' | 'white';
};

export type CoverSlideSpec = {
  type: 'cover';
  title: string;
  subtitle: string;
  logoUrl?: string;
  logoPlacement?: LogoPlacement;
  leftMeta?: string;
  rightMeta?: string;
};

export type ChapterSlideSpec = {
  type: 'chapter';
  title: string;
  subtitle: string;
  body?: string;
  chapterImageIndex: number;
};

export type ContentSlideSpec = {
  type: 'content';
  title: string;
  subtitle: string;
  body?: string;
  icons?: IconPlacement[];
};

export type EndSlideSpec = {
  type: 'end';
  legalText: string;
};
