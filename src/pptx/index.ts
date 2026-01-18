/**
 * PPTX Generation Module
 * 
 * Génération de présentations PowerPoint pour les audits et stratégies.
 * Utilise PptxGenJS.
 */

import PptxGenJS from 'pptxgenjs';
import type { ThemeColors } from '../settings/ThemeProvider';
import { DEFAULT_COLORS } from '../settings/ThemeProvider';
import { addTextFr } from './designSystem/serenity';

export type { ThemeColors };
export { DEFAULT_COLORS };

/**
 * Crée une nouvelle présentation avec les styles de base
 */
export function createPresentation(title: string): PptxGenJS {
  const pptx = new PptxGenJS();
  pptx.title = title;
  pptx.author = 'SER1 - Audit Patrimonial';
  pptx.company = 'Cabinet CGP';
  return pptx;
}

/**
 * Ajoute la slide de titre (fond c1 + nom/prénom + logo)
 */
export function addTitleSlide(
  pptx: PptxGenJS,
  clientName: string,
  colors: ThemeColors = DEFAULT_COLORS,
  logoBase64?: string
): void {
  const slide = pptx.addSlide();
  
  // Fond couleur c1
  slide.background = { color: colors.c1.replace('#', '') };
  
  // Nom et prénom centré
  addTextFr(slide, clientName || 'Nom et Prénom', {
    x: '10%',
    y: '40%',
    w: '80%',
    h: '20%',
    fontSize: 36,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
    fontFace: 'Arial',
  });
  
  // Logo centré si fourni
  if (logoBase64) {
    slide.addImage({
      data: logoBase64,
      x: '35%',
      y: '65%',
      w: '30%',
      h: '20%',
    });
  }
}

// Exports pour les modules spécifiques (à implémenter)
// export * from './auditPptx';
// export * from './strategyPptx';
