/**
 * Chargement du template PowerPoint de base
 * 
 * NOTE IMPORTANTE : PPTXGenJS ne supporte pas nativement l'ouverture de fichiers PPTX existants.
 * Cette fonction est une préparation pour une future implémentation.
 * 
 * Stratégie actuelle : Reconstruction minimale du template
 * Stratégie future : Utiliser une bibliothèque compatible ou PPTXGenJS avec support de template
 */

import PptxGenJS from 'pptxgenjs';
import { DEBUG_PPTX } from '../../utils/debugFlags';

export interface BaseTemplateConfig {
  title: string;
  author: string;
  company: string;
}

/**
 * Charge le template de base depuis le fichier PPTX
 * 
 * @param config - Configuration du template
 * @returns Instance PptxGenJS pré-configurée
 * 
 * TODO: Implémenter le chargement réel du fichier PPTX
 * - Rechercher une bibliothèque compatible avec PPTXGenJS
 * - Ou utiliser PPTXGenJS avec support de template (si disponible)
 * - Ou parser le PPTX et reconstruire les slides
 */
export function loadBaseTemplate(config: BaseTemplateConfig): PptxGenJS {
  const pptx = new PptxGenJS();
  
  // Configuration de base
  pptx.title = config.title;
  pptx.author = config.author;
  pptx.company = config.company;
  
  // TODO: Charger la structure depuis public/pptx/templates/serenity-base.pptx
  // Actuellement : reconstruction minimale
  console.warn('⚠️ Template loading not implemented - using minimal reconstruction');
  if (DEBUG_PPTX) {
    // eslint-disable-next-line no-console
    console.debug('📁 Template file: public/pptx/templates/serenity-base.pptx');
  }
  
  return pptx;
}

/**
 * Alternative : Reconstruction minimale du template
 * Recrée les éléments de base du template Serenity
 */
export function reconstructBaseTemplate(config: BaseTemplateConfig): PptxGenJS {
  const pptx = new PptxGenJS();
  
  // Configuration
  pptx.title = config.title;
  pptx.author = config.author;
  pptx.company = config.company;
  
  // Définir les tailles de slide (standard 16:9)
  pptx.defineSlideMaster({
    title: 'SERENITY_MASTER',
    margin: 0.5,
  });
  
  // TODO: Définir les dimensions du slide (16:9)
  // Actuellement géré par PPTXGenJS automatiquement
  
  // TODO: Ajouter les masters slides depuis le template
  // - Cover slide master
  // - Chapter slide master  
  // - Content slide master
  // - End slide master
  
  return pptx;
}

/**
 * Vérifie la disponibilité du template file
 */
export function isTemplateAvailable(): boolean {
  // TODO: Vérifier la présence du fichier template
  // Pour l'instant, on suppose qu'il est disponible
  return true;
}

export default {
  loadBaseTemplate,
  reconstructBaseTemplate,
  isTemplateAvailable
};
