import type PptxGenJS from 'pptxgenjs';

import type { DossierAudit } from '@/features/audit/types';
import type { ThemeColors } from '@/settings/ThemeProvider';

export type TableData = Array<Array<{ text: string }>>;
export type AuditSlide = ReturnType<PptxGenJS['addSlide']>;

export interface AuditPptxOptions {
  dossier: DossierAudit;
  colors?: ThemeColors;
  logoBase64?: string;
}

export interface AuditDeckPalette {
  c1: string;
  c2: string;
  c4: string;
  c7: string;
  c9: string;
  c10: string;
}
