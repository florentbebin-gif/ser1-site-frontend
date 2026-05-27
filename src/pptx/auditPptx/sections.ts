import PptxGenJS from 'pptxgenjs';

import type { DossierAudit } from '@/features/audit/types';
import { DEFAULT_COLORS } from '@/settings/ThemeProvider';
import type { ThemeColors } from '@/settings/ThemeProvider';

import type { AuditDeckPalette } from './types';

export function createAuditPresentation(): PptxGenJS {
  const pptx = new PptxGenJS();
  pptx.title = 'Audit Patrimonial';
  pptx.author = 'SER1 - Cabinet CGP';
  pptx.company = 'Cabinet CGP';
  return pptx;
}

export function resolveAuditPalette(colors: ThemeColors = DEFAULT_COLORS): AuditDeckPalette {
  return {
    c1: colors.c1.replace('#', ''),
    c2: colors.c2.replace('#', ''),
    c4: colors.c4.replace('#', ''),
    c7: colors.c7.replace('#', ''),
    c9: colors.c9.replace('#', ''),
    c10: colors.c10.replace('#', ''),
  };
}

export function getAuditClientName(dossier: DossierAudit): string {
  return (
    `${dossier.situationFamiliale.mr.prenom} ${dossier.situationFamiliale.mr.nom}`.trim() ||
    'Client'
  );
}

export function getAuditFilename(clientName: string): string {
  return `Audit_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pptx`;
}
