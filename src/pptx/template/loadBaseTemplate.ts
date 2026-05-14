/**
 * Chargement du template PowerPoint de base
 * 
 * Stratégie "Conservateur+" : Template codé via PptxGenJS defineSlideMaster().
 * Les masters définissent les backgrounds et éléments statiques.
 * Les builders ajoutent le contenu dynamique (texte, données, footer avec slideIndex).
 * 
 * Masters définis :
 * - SERENITY_COVER   : Fond bgMain (color1) — slide de couverture
 * - SERENITY_CHAPTER : Fond blanc — slides de chapitre
 * - SERENITY_CONTENT : Fond blanc — slides de contenu/synthèse
 * - SERENITY_END     : Fond bgMain (color1) — slide de fin/mentions légales
 */

import type PptxGenJS from 'pptxgenjs';
import type { PptxThemeRoles } from '../theme/types';
import { DEBUG_PPTX } from '../../utils/debugFlags';

/**
 * Noms des slide masters Serenity
 * Utilisés par les builders via pptx.addSlide({ masterName })
 */
export const MASTER_NAMES = {
  COVER: 'SERENITY_COVER',
  CHAPTER: 'SERENITY_CHAPTER',
  CONTENT: 'SERENITY_CONTENT',
  END: 'SERENITY_END',
} as const;

/**
 * Définit les 4 slide masters Serenity sur une instance PptxGenJS.
 * 
 * Chaque master fournit :
 * - Background (couleur de fond)
 * - Margin (marge par défaut)
 * 
 * Les éléments dynamiques (footer, header, contenu) restent dans les builders
 * car ils dépendent du slideIndex et des données.
 * 
 * @param pptx - Instance PptxGenJS
 * @param theme - Thème PPTX résolu (pour bgMain)
 */
export function defineSlideMasters(pptx: PptxGenJS, theme: PptxThemeRoles): void {
  // COVER : fond sombre (bgMain = color1)
  pptx.defineSlideMaster({
    title: MASTER_NAMES.COVER,
    background: { color: theme.bgMain.replace('#', '') },
    margin: 0,
  });
  
  // CHAPTER : fond blanc (panel + image ajoutés par le builder)
  pptx.defineSlideMaster({
    title: MASTER_NAMES.CHAPTER,
    background: { color: 'FFFFFF' },
    margin: 0,
  });
  
  // CONTENT : fond blanc (utilisé par content, synthesis, annexe, amortization)
  pptx.defineSlideMaster({
    title: MASTER_NAMES.CONTENT,
    background: { color: 'FFFFFF' },
    margin: 0,
  });
  
  // END : fond sombre (bgMain = color1)
  pptx.defineSlideMaster({
    title: MASTER_NAMES.END,
    background: { color: theme.bgMain.replace('#', '') },
    margin: 0,
  });
  
  if (DEBUG_PPTX) {
    // eslint-disable-next-line no-console
    console.debug('[PPTX] defineSlideMasters: 4 masters defined (COVER, CHAPTER, CONTENT, END)');
  }
}

